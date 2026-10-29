const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { exec, execFile } = require('child_process');
const db = require('./db.js');
const aiService = require('./ai_service.js');

const PORT = process.env.PORT || 5000;

// CORS 响应头
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');
  res.setHeader('Access-Control-Expose-Headers', 'X-Device-Id');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

// 获取客户端真实 IP
function getClientIp(req) {
  return req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown';
}

// 静态文件服务：serve 前端 dist 目录（Docker 部署）
function serveStatic(req, res, pathname) {
  const distPath = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    return false;
  }
  let filePath = path.join(distPath, pathname);
  // 如果路径是目录或不存在，尝试 index.html（SPA 路由）
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distPath, 'index.html');
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.map': 'application/json'
    };
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
    return true;
  }
  return false;
}

// 题库管理
function loadQuestions() {
  return db.loadQuestionsByBank(1);
}

function nextQId() {
  const data = db.loadQuestionsByBank(1);
  return data.questions.length > 0 ? Math.max(...data.questions.map(q => q.id)) + 1 : 1;
}

// 回收站设置（兼容层，因为 db.js 使用固定 7 天保留期）
let recycleBinSettings = { retention_days: 7 };

// 自动清理过期回收站项目
function cleanupRecycleBin() {
  const beforeCount = db.getRecycleBinItemCount();
  db.cleanupExpiredRecycleBin();
  const afterCount = db.getRecycleBinItemCount();
  if (beforeCount !== afterCount) {
    console.log(`回收站自动清理: 删除了 ${beforeCount - afterCount} 个过期项目`);
  }
}

// 启动时清理一次，之后每天清理
setInterval(cleanupRecycleBin, 24 * 60 * 60 * 1000);

// 立即清理一次
cleanupRecycleBin();

// 解析 multipart/form-data
function parseMultipart(req, callback) {
  const contentType = req.headers['content-type'] || '';
  const match = contentType.match(/boundary=([^;]+)/i);
  if (!match) {
    callback(new Error('No boundary'));
    return;
  }
  let boundary = match[1].trim().replace(/^['"]|['"]$/g, '');
  let body = Buffer.alloc(0);
  req.on('data', chunk => { body = Buffer.concat([body, chunk]); });
  req.on('end', () => {
    const fields = {};
    const boundaryStr = '--' + boundary;
    const parts = body.toString('binary').split(boundaryStr);
    for (let i = 1; i < parts.length - 1; i++) {
      const part = parts[i];
      const idx = part.indexOf('\r\n\r\n');
      if (idx === -1) continue;
      const headerStr = part.slice(0, idx);
      const bodyStr = part.slice(idx + 4, part.length - 2);
      const bodyBuffer = Buffer.from(bodyStr, 'binary');
      const nameMatch = headerStr.match(/name="([^"]+)"/);
      const filenameMatch = headerStr.match(/filename="([^"]*)"/);
      const name = nameMatch ? nameMatch[1] : null;
      if (name) {
        if (filenameMatch) {
          fields[name] = { filename: filenameMatch[1], buffer: bodyBuffer };
        } else {
          fields[name] = bodyBuffer.toString('utf-8');
        }
      }
    }
    callback(null, fields);
  });
}

// 查找 Python 可执行文件
function findPython(callback) {
  // Linux/Docker 环境直接返回 python3
  if (process.platform !== 'win32') {
    callback(null, 'python3');
    return;
  }
  
  // 以下保持原有 Windows 逻辑不变
  const kimiPython = 'C:/Users/Administrator/AppData/Roaming/kimi-desktop/daimon-share/daimon/runtime/python/.venv/Scripts/python.exe';
  if (fs.existsSync(kimiPython)) {
    execFile(kimiPython, ['-c', 'import docx; import openpyxl; print("OK")'], { timeout: 5000, windowsHide: true }, (err) => {
      if (!err) {
        callback(null, kimiPython);
        return;
      }
      fallbackFind(callback);
    });
    return;
  }
  fallbackFind(callback);
}

function fallbackFind(callback) {
  const candidates = [
    'python', 'python3', 'py',
    '/usr/bin/python3', '/usr/local/bin/python3',
    'C:/Users/Administrator/AppData/Local/Programs/Python/Python312/python.exe',
    'C:/Users/Administrator/AppData/Local/Programs/Python/Python311/python.exe',
    'C:/Users/Administrator/AppData/Local/Programs/Python/Python310/python.exe',
    'C:/Users/Administrator/AppData/Local/Programs/Python/Python39/python.exe',
    'C:/Python312/python.exe', 'C:/Python311/python.exe', 'C:/Python310/python.exe', 'C:/Python39/python.exe',
    'C:/Users/Administrator/AppData/Roaming/kimi-desktop/daimon-share/daimon/runtime/python/.venv/Scripts/python.exe'
  ];
  function tryNext(i) {
    if (i >= candidates.length) {
      callback(new Error('未找到 Python。请安装 Python 3.9+ 并确保 python-docx 和 openpyxl 已安装。安装命令：pip install python-docx openpyxl'));
      return;
    }
    const cmd = candidates[i].includes(' ') ? '"' + candidates[i] + '"' : candidates[i];
    exec(cmd + ' --version', { windowsHide: true }, (err, stdout) => {
      if (!err && stdout && stdout.includes('Python 3')) {
        exec(cmd + ' -c "import docx; import openpyxl; print(\\\'OK\\\')"', { windowsHide: true }, (err2) => {
          if (!err2) {
            callback(null, candidates[i]);
          } else {
            tryNext(i + 1);
          }
        });
      } else {
        tryNext(i + 1);
      }
    });
  }
  tryNext(0);
}
// 提取关键词（用于简答题评分）
function extractKeywords(text) {
  const keywords = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) continue;
    let clean = trimmed.replace(/^\d+[\.\s、]+/g, '');
    clean = clean.replace(/[，。！？；：""''（）\(\)\[\],.!?;:'"]/g, '');
    if (clean.length > 2) {
      keywords.push(clean.toLowerCase());
    }
  }
  return keywords;
}

// 随机打乱数组
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 解析 POST 请求体（支持 async 回调）
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    let parsed = null;
    let err = null;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      err = e;
    }
    try {
      await callback(err, parsed);
    } catch (cbErr) {
      console.error('parseBody callback error:', cbErr);
    }
  });
}

// ============ 课程学习模块 ============

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const PASS_SCORE = 60; // 及格线

// 课包考试闸门：返回 { gated, allowed, code, error, ... }
// gated=false 表示该试卷未关联课包，走原有流程
function checkPackageGate(uid, examConfigId) {
  const pkg = db.getCoursePackageByExamConfig(examConfigId);
  if (!pkg || pkg.enabled === false) return { gated: false };

  const latest = db.getLatestResult(uid, pkg.exam_config_id);

  // 已通过 → 禁止重复考
  if (latest && latest.percentage >= PASS_SCORE) {
    return {
      gated: true, allowed: false, code: 'ALREADY_PASSED',
      percentage: latest.percentage, total_score: latest.total_score, max_score: latest.max_score,
      error: `你已通过该考试（${latest.percentage}分），无需重复参加`
    };
  }

  // 晋级链：培训师课包需先通过姐妹团考试
  if (pkg.key === 'trainer') {
    const sister = db.loadCoursePackages().find(p => p.key === 'sister');
    if (sister && sister.exam_config_id) {
      const sisterResult = db.getLatestResult(uid, sister.exam_config_id);
      if (!sisterResult || sisterResult.percentage < PASS_SCORE) {
        return { gated: true, allowed: false, code: 'CHAIN_LOCKED', error: '需先通过姐妹团考试，才能参加培训师考试' };
      }
    }
  }

  // 挂科冷却期
  if (latest && latest.percentage < PASS_SCORE) {
    const cooldownMs = (pkg.cooldown_days || 0) * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(latest.created_at).getTime();
    if (cooldownMs > 0 && elapsed < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
      return {
        gated: true, allowed: false, code: 'COOLDOWN',
        remaining_seconds: remaining, percentage: latest.percentage,
        error: `上次考试未及格，冷却期中，请 ${formatDuration(remaining)} 后再试`
      };
    }
  }

  // 必修课必须全部完成（选修课不计入解锁条件）
  const courses = db.loadCourses(pkg.id, true).filter(c => c.category !== 'optional');
  const progress = db.getProgressByUid(uid);
  const doneSet = new Set(progress.filter(p => p.completed === 1).map(p => p.course_id));
  const remainingCourses = courses.filter(c => !doneSet.has(c.id));
  if (remainingCourses.length > 0) {
    return {
      gated: true, allowed: false, code: 'COURSES_INCOMPLETE',
      remaining_courses: remainingCourses.length, total_courses: courses.length,
      error: `请先完成全部必修课程（还差 ${remainingCourses.length} 门）`
    };
  }

  return { gated: true, allowed: true };
}

function formatDuration(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d} 天 ${h} 小时`;
  if (h > 0) return `${h} 小时 ${m} 分钟`;
  return `${m} 分钟`;
}

// 组装某 uid 在某课包下的学习状态（学习首页 / 管理端共用）
function buildPackageState(pkg, uid) {
  const courses = db.loadCourses(pkg.id, true);
  const progressRows = uid ? db.getProgressByUid(uid) : [];
  const progressMap = new Map(progressRows.map(p => [p.course_id, p]));

  const courseList = courses.map(c => {
    const p = progressMap.get(c.id);
    return {
      id: c.id,
      package_id: c.package_id,
      title: c.title,
      type: c.type,
      video_path: c.video_path,
      duration_minutes: c.duration_minutes,
      sort: c.sort,
      category: c.category || 'required',
      watched_seconds: p ? p.watched_seconds : 0,
      progress_percent: p ? p.progress_percent : 0,
      completed: p ? p.completed === 1 : false,
      completed_at: p ? p.completed_at : null
    };
  });

  const requiredList = courseList.filter(c => c.category !== 'optional');
  const completedCount = requiredList.filter(c => c.completed).length;
  const allCompleted = requiredList.length > 0 && completedCount === requiredList.length;

  // 晋级链：培训师课包需先通过姐妹团考试（无论是否已配置考试都生效）
  let chainLocked = false;
  if (pkg.key === 'trainer') {
    const sister = db.loadCoursePackages().find(p => p.key === 'sister');
    if (sister && sister.exam_config_id && uid) {
      const sr = db.getLatestResult(uid, sister.exam_config_id);
      chainLocked = !sr || sr.percentage < PASS_SCORE;
    } else {
      // 未配置姐妹团考试或未登录：没人能通过姐妹团 → 培训师课包保持锁定
      chainLocked = true;
    }
  }

  // 考试状态
  let examStatus;
  if (chainLocked) {
    examStatus = { status: 'locked', chain_locked: true, reason: '需先通过姐妹团考试' };
  } else if (!pkg.exam_config_id) {
    examStatus = { status: 'no_exam' };
  } else {
    const latest = uid ? db.getLatestResult(uid, pkg.exam_config_id) : null;
    if (latest && latest.percentage >= PASS_SCORE) {
      examStatus = { status: 'passed', percentage: latest.percentage, total_score: latest.total_score, max_score: latest.max_score, exam_name: latest.exam_name };
    } else {
      examStatus = buildLockStatus(pkg, latest, allCompleted, requiredList.length, completedCount);
    }
  }

  return {
    id: pkg.id,
    key: pkg.key,
    name: pkg.name,
    description: pkg.description,
    cooldown_days: pkg.cooldown_days,
    exam_config_id: pkg.exam_config_id,
    sort: pkg.sort,
    courses: courseList,
    total_courses: requiredList.length,
    completed_courses: completedCount,
    all_completed: allCompleted,
    chain_locked: chainLocked,
    exam_status: examStatus
  };
}

function buildLockStatus(pkg, latest, allCompleted, totalCourses, completedCount) {
  if (latest && latest.percentage < PASS_SCORE) {
    const cooldownMs = (pkg.cooldown_days || 0) * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(latest.created_at).getTime();
    if (cooldownMs > 0 && elapsed < cooldownMs) {
      return {
        status: 'cooldown',
        remaining_seconds: Math.ceil((cooldownMs - elapsed) / 1000),
        cooldown_days: pkg.cooldown_days,
        last_percentage: latest.percentage
      };
    }
  }
  if (!allCompleted) {
    return { status: 'locked', remaining_courses: totalCourses - completedCount, total_courses: totalCourses };
  }
  return { status: 'ready', exam_config_id: pkg.exam_config_id };
}

// 视频/上传文件静态服务（支持 Range，用于视频拖动）
function serveUpload(req, res, pathname) {
  const filename = path.basename(decodeURIComponent(pathname.replace(/^\/uploads\//, '')));
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404);
    res.end(JSON.stringify({ success: false, error: 'File not found' }));
    return;
  }
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
    '.m4v': 'video/mp4', '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo',
    '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif'
  };
  const mime = mimeTypes[ext] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    let start = m && m[1] ? parseInt(m[1]) : 0;
    let end = m && m[2] ? parseInt(m[2]) : stat.size - 1;
    if (isNaN(start) || start < 0) start = 0;
    if (isNaN(end) || end >= stat.size) end = stat.size - 1;
    if (start > end) start = end;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': mime
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': mime,
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

// 路由处理
const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // 健康检查
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, message: 'Backend is running' }));
    return;
  }

  // 获取题库列表
  if (pathname === '/api/question-banks' && req.method === 'GET') {
    const banks = db.loadQuestionBanks();
    const defaultBank = banks.find(b => b.is_default);
    const currentBankId = defaultBank ? defaultBank.id : (banks[0] ? banks[0].id : 1);
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        banks: banks,
        current_bank_id: currentBankId
      }
    }));
    return;
  }

  // 创建新题库
  if (pathname === '/api/question-banks' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const banks = db.loadQuestionBanks();
      const newId = db.nextBankId();
      const newBank = {
        id: newId,
        name: body.name || `新题库${newId}`,
        is_default: false
      };
      banks.push(newBank);
      db.saveQuestionBanks(banks);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: newBank }));
    });
    return;
  }

  // 切换当前题库
  if (pathname === '/api/question-banks/activate' && req.method === 'PUT') {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const banks = db.loadQuestionBanks();
      const bankId = body.bank_id;
      const bank = banks.find(b => b.id === bankId);
      if (!bank) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Bank not found' }));
        return;
      }
      for (const b of banks) {
        b.is_default = (b.id === bankId);
      }
      db.saveQuestionBanks(banks);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: { current_bank_id: bankId } }));
    });
    return;
  }

  // 更新题库（重命名）
  const bankMatch = pathname.match(/^\/api\/question-banks\/(\d+)$/);
  if (bankMatch && req.method === 'PUT') {
    const bankId = parseInt(bankMatch[1]);
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const banks = db.loadQuestionBanks();
      const idx = banks.findIndex(b => b.id === bankId);
      if (idx === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Bank not found' }));
        return;
      }
      if (body.name && body.name.trim()) {
        banks[idx].name = body.name.trim();
      }
      db.saveQuestionBanks(banks);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: banks[idx] }));
    });
    return;
  }

  // 删除题库
  const deleteBankMatch = pathname.match(/^\/api\/question-banks\/(\d+)$/);
  if (deleteBankMatch && req.method === 'DELETE') {
    const bankId = parseInt(deleteBankMatch[1]);
    const banks = db.loadQuestionBanks();
    const idx = banks.findIndex(b => b.id === bankId);
    if (idx === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Bank not found' }));
      return;
    }
    // 不能删除当前活跃题库
    if (banks[idx].is_default) {
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: 'Cannot delete active bank' }));
      return;
    }
    // 从数据库删除该题库的所有题目
    db.db.prepare('DELETE FROM questions WHERE bank_id = ?').run(bankId);
    banks.splice(idx, 1);
    db.saveQuestionBanks(banks);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 获取所有题目
  if (pathname === '/api/questions' && req.method === 'GET') {
    const bankId = query.bank_id ? parseInt(query.bank_id) : 1;
    const data = db.loadQuestionsByBank(bankId);
    const questions = data.questions;

    const single = questions.filter(q => q.type === 'single');
    const multiple = questions.filter(q => q.type === 'multiple');
    const fill = questions.filter(q => q.type === 'fill');
    const essay = questions.filter(q => q.type === 'essay');

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        all: questions,
        single, multiple, fill, essay,
        stats: {
          total: questions.length,
          single: single.length,
          multiple: multiple.length,
          fill: fill.length,
          essay: essay.length
        }
      }
    }));
    return;
  }

  // 新增题目
  if (pathname === '/api/questions' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const newQuestion = {
        id: db.nextQuestionId(),
        bank_id: 1,
        content: body.content || '',
        type: body.type || 'single',
        options: body.options || [],
        answer: body.answer || '',
        key_points: body.key_points || body.keyPoints || '',
        blanks: body.blanks || [],
        enabled: true
      };
      db.saveQuestion(newQuestion);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: newQuestion }));
    });
    return;
  }

  // 批量导入题目（支持 docx / xlsx）
  if (pathname === '/api/questions/import' && req.method === 'POST') {
    console.log('[IMPORT] Request received');
    parseMultipart(req, (err, fields) => {
      console.log('[IMPORT] Multipart parsed:', err ? 'ERROR: ' + err.message : 'OK', 'fields keys:', Object.keys(fields));
      if (err || !fields.file) {
        console.log('[IMPORT] No file field, fields:', fields);
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'No file uploaded' }));
        return;
      }
      const file = fields.file;
      console.log('[IMPORT] File received:', file.filename, 'size:', file.buffer.length);
      const filename = file.filename || '';
      const ext = path.extname(filename).toLowerCase();
      let fileType;
      if (ext === '.docx') fileType = 'docx';
      else if (ext === '.xlsx') fileType = 'xlsx';
      else {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: '仅支持 .docx 和 .xlsx 文件' }));
        return;
      }
      
      const tmpId = Date.now();
      const tmpPath = path.join(__dirname, '..', 'tmp_import_' + tmpId + '.' + fileType);
      const outputPath = path.join(__dirname, '..', 'tmp_output_' + tmpId + '.json');
      
      fs.writeFileSync(tmpPath, file.buffer);
      console.log('[IMPORT] Temp file saved:', tmpPath);
      
      findPython((err, pythonPath) => {
        if (err) {
          console.log('[IMPORT] findPython failed:', err.message);
          try { fs.unlinkSync(tmpPath); } catch (e) {}
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: err.message }));
          return;
        }
        console.log('[IMPORT] Python found:', pythonPath);
        const scriptPath = path.join(__dirname, 'parse_import.py');
        execFile(pythonPath, [scriptPath, tmpPath, fileType, outputPath], { timeout: 30000, windowsHide: true }, (error, stdout, stderr) => {
          console.log('[IMPORT] Python exec done. error:', error ? error.message : 'none', 'stdout:', stdout, 'stderr:', stderr);
          try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (e) {}
          if (error) {
            console.error('[IMPORT] Python exec error:', error, stderr);
            try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: stderr || '解析失败' }));
            return;
          }
          try {
            const outputExists = fs.existsSync(outputPath);
            console.log('[IMPORT] Output file exists:', outputExists);
            if (!outputExists) {
              res.writeHead(500);
              res.end(JSON.stringify({ success: false, error: '解析输出文件丢失' }));
              return;
            }
            const result = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            console.log('[IMPORT] Output parsed, questions count:', (result.questions || []).length);
            try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
            const questions = result.questions || [];
            if (questions.length === 0) {
              res.writeHead(200);
              res.end(JSON.stringify({ success: false, error: '文件中未识别到题目' }));
              return;
            }
            const beforeCount = db.getTotalQuestionsCount(1);
            console.log('[IMPORT] Current bank questions before:', beforeCount);
            for (const q of questions) {
              const newQuestion = {
                id: db.nextQuestionId(),
                bank_id: 1,
                content: q.content || '',
                type: q.type || 'single',
                options: q.options || [],
                answer: q.answer || '',
                key_points: q.key_points || '',
                blanks: q.blanks || [],
                enabled: true
              };
              db.saveQuestion(newQuestion);
            }
            const afterCount = db.getTotalQuestionsCount(1);
            console.log('[IMPORT] Saved, total questions now:', afterCount);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: { imported: questions.length } }));
          } catch (e) {
            console.error('[IMPORT] Parse result error:', e);
            try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: '解析结果无效: ' + e.message }));
          }
        });
      });
    });
    return;
  }

  // 更新题目
  const questionMatch = pathname.match(/^\/api\/questions\/(\d+)$/);
  if (questionMatch && req.method === 'PUT') {
    const qId = parseInt(questionMatch[1]);
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const data = loadQuestions();
      const idx = data.questions.findIndex(q => q.id === qId);
      if (idx === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Question not found' }));
        return;
      }
      // 合并更新，保留 id
      const updatedQuestion = { ...data.questions[idx], ...body, id: qId };
      db.saveQuestion(updatedQuestion);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: updatedQuestion }));
    });
    return;
  }

  // 删除题目
  if (questionMatch && req.method === 'DELETE') {
    const qId = parseInt(questionMatch[1]);
    db.deleteQuestion(qId);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 获取考试配置列表
  if (pathname === '/api/exam-configs' && req.method === 'GET') {
    const configs = db.loadExamConfigs();
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: configs }));
    return;
  }

  // 创建考试配置
  if (pathname === '/api/exam-configs' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const banks = db.loadQuestionBanks();
      const defaultBank = banks.find(b => b.is_default) || banks[0] || { id: 1 };
      const newConfig = {
        id: db.nextExamConfigId(),
        name: body.name || '未命名试卷',
        single: typeof body.single === 'number' ? body.single : 10,
        multiple: typeof body.multiple === 'number' ? body.multiple : 0,
        fill: typeof body.fill === 'number' ? body.fill : 5,
        essay: typeof body.essay === 'number' ? body.essay : 5,
        score_single: typeof body.score_single === 'number' ? body.score_single : 5,
        score_multiple: typeof body.score_multiple === 'number' ? body.score_multiple : 5,
        score_fill: typeof body.score_fill === 'number' ? body.score_fill : 5,
        score_essay: typeof body.score_essay === 'number' ? body.score_essay : 5,
        timeLimit: body.timeLimit || 0,
        bank_id: body.bank_id || defaultBank.id,
        status: 'draft',
        publish_at: body.publish_at || null,      // 定时发布时间
        stop_at: body.stop_at || null,             // 定时截止时间
        created_at: new Date().toISOString()
      };
      db.saveExamConfig(newConfig);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: newConfig }));
    });
    return;
  }

  // 更新考试配置
  const examConfigMatch = pathname.match(/^\/api\/exam-configs\/(\d+)$/);
  if (examConfigMatch && req.method === 'PUT') {
    const configId = parseInt(examConfigMatch[1]);
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const configs = db.loadExamConfigs();
      const idx = configs.findIndex(c => c.id === configId);
      if (idx === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Config not found' }));
        return;
      }
      // 多试卷可同时发布（姐妹团/培训师并行开考），不再互斥停止其他试卷
      if (body.status === 'published') {
        configs[idx] = { ...configs[idx], ...body, id: configId, status: 'published' };
      } else if (body.status === 'stopped') {
        configs[idx] = { ...configs[idx], ...body, id: configId, status: 'stopped' };
      } else if (body.status === 'draft') {
        configs[idx] = { ...configs[idx], ...body, id: configId, status: 'draft' };
      } else {
        // 没有传 status，只更新其他字段，保持原有状态
        configs[idx] = { ...configs[idx], ...body, id: configId };
      }
      db.saveExamConfigs(configs);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: configs[idx] }));
    });
    return;
  }

  // 删除考试配置（移入回收站）
  if (examConfigMatch && req.method === 'DELETE') {
    const configId = parseInt(examConfigMatch[1]);
    const configs = db.loadExamConfigs();
    const idx = configs.findIndex(c => c.id === configId);
    if (idx === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Config not found' }));
      return;
    }
    // 放入回收站
    const deletedConfig = configs[idx];
    db.addToRecycleBin('exam_config', deletedConfig);
    db.deleteExamConfig(configId);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 检查考生资格（进入考试前调用，同时检查 UID 和设备指纹）
  if (pathname === '/api/check-eligibility' && req.method === 'GET') {
    const uid = query.uid || '';
    const deviceId = query.device_id || '';
    const clientIp = getClientIp(req);
    const isAdminTest = query.admin_mode === '1' || query.admin_mode === 'true';

    // 管理员测试模式：跳过所有反作弊检查
    if (isAdminTest) {
      console.log('[ADMIN] 管理员测试模式，跳过反作弊检查');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, admin_mode: true }));
      return;
    }

    // 1. 检查设备指纹是否已被其他 UID 使用（同一设备只能绑定一个 UID）
    if (deviceId) {
      const existingByDevice = db.checkDeviceUsed(deviceId, uid);
      if (existingByDevice) {
        res.writeHead(200);
        res.end(JSON.stringify({
          success: false,
          code: 'DEVICE_USED',
          error: '检测到该设备已有人提交过考试。每台设备仅限一位考生答题。',
          detail: {
            used_by: existingByDevice.user_name || existingByDevice.user_uid,
            time: existingByDevice.created_at
          }
        }));
        return;
      }
    }

  // 2. 检查该UID是否已参加过目标试卷（多试卷并行发布，优先按请求 exam_id 定位）
    const examConfigs = db.loadExamConfigs();
    const reqExamId = query.exam_id ? parseInt(query.exam_id) : null;
    const publishedExam = reqExamId
      ? examConfigs.find(c => c.id === reqExamId)
      : examConfigs.find(c => c.status === 'published');
    const examId = publishedExam ? publishedExam.id : (reqExamId || 1);
    if (uid && examId) {
      // 课包关联试卷走课程解锁闸门（含冷却重考规则），未关联的保持原有"同试卷仅1次"规则
      const gate = checkPackageGate(uid, examId);
      if (gate.gated) {
        if (!gate.allowed) {
          res.writeHead(200);
          res.end(JSON.stringify({
            success: false,
            code: gate.code,
            error: gate.error,
            remaining_seconds: gate.remaining_seconds || 0,
            remaining_courses: gate.remaining_courses || 0
          }));
          return;
        }
      } else if (db.checkExamTaken(uid, examId)) {
        res.writeHead(200);
        res.end(JSON.stringify({
          success: false,
          code: 'EXAM_TAKEN',
          error: '您已参加过该试卷的考试。同一试卷仅限答题1次，请等待管理员发布新试卷后再考。'
        }));
        return;
      }
    }

    // 3. IP 辅助检查（仅预警，不阻止进入）
    let ipWarning = false;
    const ipResults = db.getRecentResultsByIp(clientIp, 24);
    if (ipResults.length >= 5) {
      ipWarning = true;
    }

    res.writeHead(200);
    res.end(JSON.stringify({ success: true, ip_warning: ipWarning, exam_id: examId }));
    return;
  }

  // 获取考试配置（随机抽题），支持 exam_id 参数，只抽 enabled 的题目
  if (pathname === '/api/exam-config' && req.method === 'GET') {
    const examId = query.exam_id ? parseInt(query.exam_id) : null;
    const configs = db.loadExamConfigs();
    // 只找已发布的试卷；指定 exam_id 时必须命中该试卷，不串到其他试卷
    const publishedConfigs = configs.filter(c => c.status === 'published');
    let config;
    if (examId) {
      config = publishedConfigs.find(c => c.id === examId);
    } else {
      config = publishedConfigs[0];
    }
    if (!config) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'No published exam available' }));
      return;
    }

    // 检查定时截止时间
    const now = new Date();
    if (config.stop_at) {
      const stopAt = new Date(config.stop_at);
      if (now > stopAt) {
        res.writeHead(403);
        res.end(JSON.stringify({ success: false, error: '该考试已截止，不再接受答题' }));
        return;
      }
    }
    // 检查定时发布时间（一般已发布的已经过了发布时间，但以防万一）
    if (config.publish_at) {
      const publishAt = new Date(config.publish_at);
      if (now < publishAt) {
        res.writeHead(403);
        res.end(JSON.stringify({ success: false, error: '该考试尚未开始，请等待' }));
        return;
      }
    }

    // 课包考试闸门：关联课包的试卷需完成必修课、过冷却期、过晋级链
    const gateUid = query.uid || '';
    const gateAdminMode = query.admin_mode === '1' || query.admin_mode === 'true';
    if (gateUid && !gateAdminMode) {
      const gate = checkPackageGate(gateUid, config.id);
      if (gate.gated && !gate.allowed) {
        res.writeHead(403);
        res.end(JSON.stringify({
          success: false,
          code: gate.code,
          error: gate.error,
          remaining_seconds: gate.remaining_seconds || 0,
          remaining_courses: gate.remaining_courses || 0,
          percentage: gate.percentage
        }));
        return;
      }
    }
    // 根据配置关联的题库加载题目
    const bankId = config.bank_id || 1;
    const data = db.loadQuestionsByBank(bankId);
    const enabledQuestions = data.questions.filter(q => q.enabled !== false);

    const single = shuffle(enabledQuestions.filter(q => q.type === 'single')).slice(0, config.single || 0);
    const multiple = shuffle(enabledQuestions.filter(q => q.type === 'multiple')).slice(0, config.multiple || 0);
    const fill = shuffle(enabledQuestions.filter(q => q.type === 'fill')).slice(0, config.fill || 0);
    const essay = shuffle(enabledQuestions.filter(q => q.type === 'essay')).slice(0, config.essay || 0);

    let allQuestions = shuffle([...single, ...multiple, ...fill, ...essay]);

    // 转换为前端期望的格式，并附加分值
    const scoreMap = {
      single: config.score_single || 5,
      multiple: config.score_multiple || 5,
      fill: config.score_fill || 5,
      essay: config.score_essay || 5
    };
    allQuestions = allQuestions.map(q => ({
      id: q.id,
      content: q.content,
      type: q.type,
      options: q.options || [],
      answer: q.answer || '',
      keyPoints: q.key_points || '',
      blanks: q.blanks || [],
      difficulty: 1,
      score: scoreMap[q.type] || 5
    }));

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        questions: allQuestions,
        timeLimit: config.timeLimit || 0,
        totalQuestions: allQuestions.length,
        exam_id: config.id,
        exam_name: config.name
      }
    }));
    return;
  }

  // 预览考试配置抽题结果
  const previewMatch = pathname.match(/^\/api\/exam-configs\/(\d+)\/preview$/);
  if (previewMatch && req.method === 'GET') {
    const configId = parseInt(previewMatch[1]);
    const configs = db.loadExamConfigs();
    const config = configs.find(c => c.id === configId);
    if (!config) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Config not found' }));
      return;
    }
    const bankId = config.bank_id || 1;
    const data = db.loadQuestionsByBank(bankId);
    const enabledQuestions = data.questions.filter(q => q.enabled !== false);

    const single = shuffle(enabledQuestions.filter(q => q.type === 'single')).slice(0, config.single || 0);
    const multiple = shuffle(enabledQuestions.filter(q => q.type === 'multiple')).slice(0, config.multiple || 0);
    const fill = shuffle(enabledQuestions.filter(q => q.type === 'fill')).slice(0, config.fill || 0);
    const essay = shuffle(enabledQuestions.filter(q => q.type === 'essay')).slice(0, config.essay || 0);

    let allQuestions = [...single, ...multiple, ...fill, ...essay];

    const scoreMap = {
      single: config.score_single || 5,
      multiple: config.score_multiple || 5,
      fill: config.score_fill || 5,
      essay: config.score_essay || 5
    };

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        config: { id: config.id, name: config.name, bank_id: config.bank_id },
        questions: allQuestions.map(q => ({
          id: q.id,
          content: q.content,
          type: q.type,
          options: q.options || [],
          answer: q.answer || '',
          key_points: q.key_points || '',
          blanks: q.blanks || [],
          score: scoreMap[q.type] || 5
        })),
        totalQuestions: allQuestions.length
      }
    }));
    return;
  }

  // 发布试卷
  const publishMatch = pathname.match(/^\/api\/exam-configs\/(\d+)\/publish$/);
  if (publishMatch && req.method === 'POST') {
    const configId = parseInt(publishMatch[1]);
    const configs = db.loadExamConfigs();
    const idx = configs.findIndex(c => c.id === configId);
    if (idx === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Config not found' }));
      return;
    }
    // 多试卷可同时发布（姐妹团/培训师并行开考），不再互斥
    configs[idx].status = 'published';
    db.saveExamConfigs(configs);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: configs[idx] }));
    return;
  }

  // 停止试卷
  const stopMatch = pathname.match(/^\/api\/exam-configs\/(\d+)\/stop$/);
  if (stopMatch && req.method === 'POST') {
    const configId = parseInt(stopMatch[1]);
    const configs = db.loadExamConfigs();
    const idx = configs.findIndex(c => c.id === configId);
    if (idx === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Config not found' }));
      return;
    }
    configs[idx].status = 'stopped';
    db.saveExamConfigs(configs);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: configs[idx] }));
    return;
  }

  // 提交考试
  if (pathname === '/api/submit' && req.method === 'POST') {
    parseBody(req, async (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }

      const answers = body.answers || {};
      const userUid = body.userUid || '';
      const deviceId = body.deviceId || req.headers['x-device-id'] || '';
      const clientIp = getClientIp(req);
      const isAdminTest = body.admin_mode === true || body.admin_mode === 'true' || body.admin_mode === 1;

      // 管理员测试模式：跳过反作弊检查
      if (isAdminTest) {
        console.log('[ADMIN] 提交时使用管理员测试模式，跳过反作弊检查');
      } else {
        // 1. 检查设备指纹是否已被其他 UID 使用（反作弊核心：设备只能绑定一个 UID）
        if (deviceId) {
          const existingByDevice = db.checkDeviceUsed(deviceId, userUid);
          if (existingByDevice) {
            res.writeHead(403);
            res.end(JSON.stringify({
              success: false,
              error: '检测到该设备已有人提交过考试。每台设备仅限一位考生答题。',
              code: 'DEVICE_USED',
              detail: {
                used_by: existingByDevice.user_name || existingByDevice.user_uid,
                time: existingByDevice.created_at
              }
            }));
            return;
          }
        }
      }

      // 2. IP 辅助检查：同一 IP 24 小时内超过 5 个不同 UID 则预警（不阻止，仅记录）
      let ipWarning = false;
      if (!isAdminTest) {
        const ipResults = db.getRecentResultsByIp(clientIp, 24);
        if (ipResults.length >= 5) {
          ipWarning = true;
          console.log(`[ANTI-CHEAT] IP ${clientIp} 在24小时内有 ${ipResults.length} 个不同 UID 提交，疑似批量代考`);
        }
      }

      // 根据 examId 找到对应的考试配置，从而确定使用哪个题库和分值
      const examId = body.examId || 1;
      const configs = db.loadExamConfigs();
      const examConfig = configs.find(c => c.id === examId && c.status === 'published');
      if (!examConfig) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Exam not published or not found' }));
        return;
      }
      // 检查定时截止时间
      const now = new Date();
      if (examConfig.stop_at) {
        const stopAt = new Date(examConfig.stop_at);
        if (now > stopAt) {
          res.writeHead(403);
          res.end(JSON.stringify({ success: false, error: '该考试已截止，不再接受答题' }));
          return;
        }
      }
      if (examConfig.publish_at) {
        const publishAt = new Date(examConfig.publish_at);
        if (now < publishAt) {
          res.writeHead(403);
          res.end(JSON.stringify({ success: false, error: '该考试尚未开始，请等待' }));
          return;
        }
      }
      const bankId = (examConfig && examConfig.bank_id) ? examConfig.bank_id : 1;
      const data = db.loadQuestionsByBank(bankId);
      const questionsMap = new Map(data.questions.map(q => [q.id, q]));

      const scoreMap = {
        single: examConfig.score_single || 5,
        multiple: examConfig.score_multiple || 5,
        fill: examConfig.score_fill || 5,
        essay: examConfig.score_essay || 5
      };

      const results = [];
      const essayAIGrades = {};  // 保存 AI 阅卷结果
      const pendingAIEssays = [];  // 收集需要AI异步阅卷的简答题
      let totalScore = 0;
      let maxScore = 0;

      for (const [qId, userAnswer] of Object.entries(answers)) {
        const q = questionsMap.get(parseInt(qId));
        if (!q) continue;

        const qType = q.type;
        const correctAnswer = q.answer || '';
        const keyPoints = q.key_points || '';
        const blanks = q.blanks || [];

        let score = 0;
        let maxQScore = scoreMap[qType] || 5;
        let feedback = '';

        if (qType === 'single') {
          if (String(userAnswer).toUpperCase().trim() === correctAnswer.toUpperCase().trim()) {
            score = maxQScore;
            feedback = '回答正确！';
          } else {
            score = 0;
            feedback = `正确答案：${correctAnswer}`;
          }
        } else if (qType === 'multiple') {
          const userSet = new Set(String(userAnswer).toUpperCase().replace(/[,\s]/g, '').split(''));
          const correctSet = new Set(correctAnswer.toUpperCase().replace(/[,\s]/g, '').split(''));
          const isEqual = userSet.size === correctSet.size && [...userSet].every(x => correctSet.has(x));
          if (isEqual) {
            score = maxQScore;
            feedback = '回答正确！';
          } else {
            score = 0;
            feedback = `正确答案：${correctAnswer}`;
          }
        } else if (qType === 'fill') {
          let correct = true;
          for (const blank of blanks) {
            const blankNo = String(blank.blank_no);
            const blankAnswer = blank.answer;
            const userBlank = userAnswer && typeof userAnswer === 'object' ? userAnswer[blankNo] || '' : '';
            const possibleAnswers = blankAnswer.split('|').map(a => a.trim().toLowerCase());
            if (!possibleAnswers.includes(userBlank.trim().toLowerCase())) {
              correct = false;
              break;
            }
          }
          if (correct && blanks.length > 0) {
            score = maxQScore;
            feedback = '回答正确！';
          } else {
            score = 0;
            feedback = `正确答案：${blanks.map(b => b.answer).join(' / ')}`;
          }
        } else if (qType === 'essay') {
          // 先用本地关键词匹配快速给分（不等AI），AI阅卷异步进行
          let aiScore = null;
          let aiFeedback = '';
          let aiMatched = [];
          let aiMissed = [];
          
          // 本地关键词匹配快速给分（作为初始分数）
          if (keyPoints) {
            const keywords = extractKeywords(keyPoints);
            const userText = String(userAnswer).toLowerCase();
            const matched = keywords.filter(kw => userText.includes(kw)).length;
            const coverage = keywords.length > 0 ? matched / keywords.length : 0;

            if (coverage >= 1) score = maxQScore;
            else if (coverage >= 0.7) score = Math.round(maxQScore * 0.8);
            else if (coverage >= 0.4) score = Math.round(maxQScore * 0.6);
            else if (coverage >= 0.2) score = Math.round(maxQScore * 0.4);
            else score = Math.round(maxQScore * 0.2);

            feedback = `关键词覆盖率：${Math.round(coverage * 100)}%`;
          } else {
            score = Math.round(maxQScore * 0.4);
            feedback = '请等待人工审核';
          }
          
          // 保存 AI 评分详情占位（异步阅卷后会更新）
          essayAIGrades[qId] = {
            ai_score: aiScore,
            ai_feedback: aiFeedback,
            ai_matched: aiMatched,
            ai_missed: aiMissed,
            pending: true  // 标记为待AI阅卷
          };
          
          // 收集需要AI异步阅卷的题目（有评分要点且AI服务可用）
          if (keyPoints && aiService && aiService.gradeEssay) {
            pendingAIEssays.push({
              qId: parseInt(qId),
              content: q.content,
              userAnswer: String(userAnswer),
              keyPoints: keyPoints,
              maxQScore: maxQScore,
              resultIndex: results.length  // 记录在第几个位置，方便后续更新
            });
          }
        }

        totalScore += score;
        maxScore += maxQScore;

        let displayCorrectAnswer;
        if (qType === 'single' || qType === 'multiple') {
          displayCorrectAnswer = correctAnswer;
        } else if (qType === 'fill') {
          displayCorrectAnswer = blanks.map(b => b.answer);
        } else {
          displayCorrectAnswer = keyPoints;
        }

        results.push({
          q_id: parseInt(qId),
          title: q.content || '',
          type: qType,
          user_answer: userAnswer,
          correct_answer: displayCorrectAnswer,
          score,
          max_score: maxQScore,
          feedback,
          key_points: keyPoints,
          is_correct: score === maxQScore,
          ai_grade: essayAIGrades[qId] || null  // AI 阅卷详情
        });
      }

      const percentage = maxScore > 0 ? (totalScore / maxScore * 100) : 0;

      // 检查该 UID 是否已参加过该试卷（同试卷不能重复考，新试卷可补考）
      // 课包关联试卷走课程解锁闸门（挂科冷却后可重考），未关联的保持原规则
      if (!isAdminTest) {
        const gate = checkPackageGate(userUid, examConfig.id);
        if (gate.gated) {
          if (!gate.allowed) {
            res.writeHead(403);
            res.end(JSON.stringify({
              success: false,
              error: gate.error,
              code: gate.code,
              remaining_seconds: gate.remaining_seconds || 0
            }));
            return;
          }
        } else if (db.checkExamTaken(userUid, examConfig.id)) {
          res.writeHead(403);
          res.end(JSON.stringify({
            success: false,
            error: '您已参加过该试卷的考试，同一试卷不能重复提交。请等待管理员发布新试卷后再考。',
            code: 'EXAM_TAKEN'
          }));
          return;
        }
      }

      // 保存结果（新记录）
      let resultId = db.nextResultId();
      const existingResults = db.getResultsByUid(userUid);
      if (existingResults && existingResults.length > 0) {
        // 保留同一设备指纹绑定关系，但使用新记录ID（不同试卷）
        console.log(`[SUBMIT] UID ${userUid} 新试卷考试：插入新记录 #${resultId}`);
      }

      // 保存结果（含设备指纹和 IP）
      const startTime = body.startTime || new Date().toISOString();
      const endTime = new Date().toISOString();
      const resultRecord = {
        id: resultId,
        exam_id: examConfig.id,
        exam_name: examConfig.name,
        user_name: body.userName || '',
        user_uid: userUid,
        total_score: totalScore,
        max_score: maxScore,
        percentage: Math.round(percentage * 10) / 10,
        answers: answers,
        details: results,
        start_time: startTime,
        end_time: endTime,
        time_limit: examConfig.time_limit || 30,
        device_id: deviceId,
        ip_address: clientIp,
        created_at: endTime
      };
      db.saveResult(resultRecord);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: {
          result_id: resultId,
          total_score: totalScore,
          max_score: maxScore,
          percentage: Math.round(percentage * 10) / 10,
          details: results,
          start_time: startTime,
          end_time: endTime,
          time_limit: examConfig.time_limit || 30,
          ip_warning: ipWarning
        }
      }));
      
      // ===== 异步AI阅卷（不阻塞前端跳转）=====
      if (pendingAIEssays.length > 0) {
        setImmediate(async () => {
          console.log(`[AI Async] 开始异步阅卷 ${pendingAIEssays.length} 道简答题...`);
          let aiTotalScore = 0;
          let aiMaxScore = 0;
          
          for (const essay of pendingAIEssays) {
            try {
              console.log(`[AI Async] 异步评分题目 #${essay.qId}...`);
              const aiResult = await aiService.gradeEssay(essay.content, essay.userAnswer, essay.keyPoints, essay.maxQScore);
              if (aiResult && aiResult.score !== undefined) {
                const finalScore = Math.max(0, Math.min(essay.maxQScore, aiResult.score));
                
                // 更新 results 中的分数和反馈
                const idx = essay.resultIndex;
                if (results[idx]) {
                  results[idx].score = finalScore;
                  results[idx].feedback = aiResult.feedback || '';
                  results[idx].ai_grade = {
                    ai_score: finalScore,
                    ai_feedback: aiResult.feedback || '',
                    ai_matched: aiResult.matched_points || [],
                    ai_missed: aiResult.missed_points || [],
                    pending: false
                  };
                  aiTotalScore += finalScore;
                  aiMaxScore += essay.maxQScore;
                  console.log(`[AI Async] 题目 #${essay.qId} AI评分完成: ${finalScore}/${essay.maxQScore}`);
                }
              }
            } catch (aiErr) {
              console.warn(`[AI Async] 题目 #${essay.qId} AI异步评分失败:`, aiErr.message);
            }
          }
          
          // 重新计算总分并更新数据库
          const newTotalScore = results.reduce((sum, r) => sum + r.score, 0);
          const newMaxScore = results.reduce((sum, r) => sum + r.max_score, 0);
          const newPercentage = newMaxScore > 0 ? Math.round((newTotalScore / newMaxScore * 100) * 10) / 10 : 0;
          
          const updatedRecord = {
            ...resultRecord,
            total_score: newTotalScore,
            percentage: newPercentage,
            details: results
          };
          db.saveResult(updatedRecord);
          console.log(`[AI Async] 异步阅卷完成，总分更新: ${newTotalScore}/${newMaxScore} (${newPercentage}%)`);
        });
      }
    });
    return;
  }

  // ===== 智能生题：上传文档解析并生成题目（AI 大模型版）=====
  if (pathname === '/api/generate-questions' && req.method === 'POST') {
    parseMultipart(req, (err, fields) => {
      if (err || !fields.file) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'No file uploaded' }));
        return;
      }
      const file = fields.file;
      const filename = file.filename || '';
      const ext = path.extname(filename).toLowerCase();
      let fileType;
      if (ext === '.docx') fileType = 'docx';
      else if (ext === '.pdf') fileType = 'pdf';
      else {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: '仅支持 .docx 和 .pdf 文件' }));
        return;
      }
      
      // 解析生成参数
      const singleCount = parseInt(fields.single_count || '5');
      const multipleCount = parseInt(fields.multiple_count || '3');
      const fillCount = parseInt(fields.fill_count || '3');
      const essayCount = parseInt(fields.essay_count || '2');
      
      const tmpId = Date.now();
      const tmpPath = path.join(__dirname, '..', 'tmp_ai_' + tmpId + '.' + fileType);
      const outputPath = path.join(__dirname, '..', 'tmp_ai_output_' + tmpId + '.json');
      
      fs.writeFileSync(tmpPath, file.buffer);
      
      findPython((err, pythonPath) => {
        if (err) {
          try { fs.unlinkSync(tmpPath); } catch (e) {}
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: err.message }));
          return;
        }
        const scriptPath = path.join(__dirname, 'parse_doc_for_ai.py');
        execFile(pythonPath, [scriptPath, tmpPath, fileType, outputPath], { timeout: 30000, windowsHide: true }, (error, stdout, stderr) => {
          try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (e) {}
          if (error) {
            try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: stderr || '文档解析失败' }));
            return;
          }
          try {
            if (!fs.existsSync(outputPath)) {
              res.writeHead(500);
              res.end(JSON.stringify({ success: false, error: '解析输出文件丢失' }));
              return;
            }
            const result = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
            
            const text = result.text || '';
            if (!text || text.length < 50) {
              res.writeHead(500);
              res.end(JSON.stringify({ success: false, error: '文档内容太短或无法提取文本' }));
              return;
            }
            
            // 检查 AI 是否可用
            if (!aiService || !aiService.generateQuestions) {
              res.writeHead(500);
              res.end(JSON.stringify({ success: false, error: 'AI 服务未初始化，请配置 SILICONFLOW_API_KEY' }));
              return;
            }
            
            console.log('[AI Gen] 开始调用 AI 大模型生成题目...');
            console.log('[AI Gen] 文档字符数:', text.length, '单选:', singleCount, '多选:', multipleCount, '填空:', fillCount, '简答:', essayCount);
            
            // 调用 AI 大模型生成题目
            aiService.generateQuestions(text, singleCount, multipleCount, fillCount, essayCount).then(aiQuestions => {
              if (!aiQuestions || aiQuestions.length === 0) {
                console.warn('[AI Gen] AI 返回空题目列表');
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, error: 'AI 生成题目失败，请检查 API Key 配置和文档内容' }));
                return;
              }
              
              console.log('[AI Gen] AI 生成题目成功:', aiQuestions.length, '道');
              
              res.writeHead(200);
              res.end(JSON.stringify({
                success: true,
                data: {
                  text_preview: text.substring(0, 3000),
                  questions: aiQuestions
                }
              }));
            }).catch(aiErr => {
              console.error('[AI Gen] AI 生成失败:', aiErr.message);
              res.writeHead(500);
              res.end(JSON.stringify({ success: false, error: 'AI 生成题目失败: ' + aiErr.message }));
            });
            
          } catch (e) {
            try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: '解析结果无效: ' + e.message }));
          }
        });
      });
    });
    return;
  }

  // ===== 基于现有题目生成变体题（相似题替换选项）=====
  if (pathname === '/api/generate-variants' && req.method === 'POST') {
    parseBody(req, async (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      
      const question = body.question;
      const variantCount = parseInt(body.variant_count || '3');
      
      if (!question || !question.content) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: '缺少原题数据' }));
        return;
      }
      
      if (!aiService || !aiService.generateVariants) {
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: 'AI 服务未初始化，请配置 SILICONFLOW_API_KEY' }));
        return;
      }
      
      try {
        const variants = await aiService.generateVariants(question, variantCount);
        if (!variants || variants.length === 0) {
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: 'AI 生成变体题失败' }));
          return;
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: { variants: variants }
        }));
      } catch (aiErr) {
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: 'AI 生成变体题失败: ' + aiErr.message }));
      }
    });
    return;
  }

  // ===== 基于文档智能更新题库 =====
  if (pathname === '/api/update-questions-from-doc' && req.method === 'POST') {
    parseMultipart(req, (err, fields) => {
      if (err || !fields.file) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'No file uploaded' }));
        return;
      }
      const file = fields.file;
      const filename = file.filename || '';
      const ext = path.extname(filename).toLowerCase();
      let fileType;
      if (ext === '.docx') fileType = 'docx';
      else if (ext === '.pdf') fileType = 'pdf';
      else {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: '仅支持 .docx 和 .pdf 文件' }));
        return;
      }
      
      const tmpId = Date.now();
      const tmpPath = path.join(__dirname, '..', 'tmp_ai_' + tmpId + '.' + fileType);
      const outputPath = path.join(__dirname, '..', 'tmp_ai_output_' + tmpId + '.json');
      
      fs.writeFileSync(tmpPath, file.buffer);
      
      findPython((err, pythonPath) => {
        if (err) {
          try { fs.unlinkSync(tmpPath); } catch (e) {}
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: err.message }));
          return;
        }
        const scriptPath = path.join(__dirname, 'parse_doc_for_ai.py');
        execFile(pythonPath, [scriptPath, tmpPath, fileType, outputPath], { timeout: 30000, windowsHide: true }, (error, stdout, stderr) => {
          try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (e) {}
          if (error) {
            try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: stderr || '文档解析失败' }));
            return;
          }
          try {
            if (!fs.existsSync(outputPath)) {
              res.writeHead(500);
              res.end(JSON.stringify({ success: false, error: '解析输出文件丢失' }));
              return;
            }
            const result = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
            
            const text = result.text || '';
            if (!text || text.length < 50) {
              res.writeHead(500);
              res.end(JSON.stringify({ success: false, error: '文档内容太短或无法提取文本' }));
              return;
            }
            
            // 检查 AI 是否可用
            if (!aiService || !aiService.updateQuestionsFromDoc) {
              res.writeHead(500);
              res.end(JSON.stringify({ success: false, error: 'AI 服务未初始化，请配置 SILICONFLOW_API_KEY' }));
              return;
            }
            
            // 获取当前题库题目
            const bankQuestions = db.loadQuestionsByBank(1).questions || [];
            const existingQuestions = bankQuestions.map(q => ({
              id: q.id,
              type: q.type,
              title: q.content || '',
              options: q.options || [],
              answer: q.answer || '',
              keyPoints: q.key_points || '',
              blanks: q.blanks || []
            }));
            
            console.log('[AI Update] 开始智能更新题库...');
            console.log('[AI Update] 文档字符数:', text.length, '现有题目数:', existingQuestions.length);
            
            aiService.updateQuestionsFromDoc(text, existingQuestions).then(updateResult => {
              const updated = updateResult.updated || [];
              const added = updateResult.added || [];
              
              console.log(`[AI Update] 智能更新完成: 更新 ${updated.length} 题, 新增 ${added.length} 题`);
              
              res.writeHead(200);
              res.end(JSON.stringify({
                success: true,
                data: {
                  text_preview: text.substring(0, 3000),
                  updated: updated,
                  added: added
                }
              }));
            }).catch(aiErr => {
              console.error('[AI Update] AI 更新失败:', aiErr.message);
              res.writeHead(500);
              res.end(JSON.stringify({ success: false, error: 'AI 更新题库失败: ' + aiErr.message }));
            });
            
          } catch (e) {
            try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: '解析结果无效: ' + e.message }));
          }
        });
      });
    });
    return;
  }

  // 获取所有结果（支持 exam_id 筛选）
  if (pathname === '/api/results' && req.method === 'GET') {
    let results = db.loadResults().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (query.exam_id) {
      const examId = parseInt(query.exam_id);
      results = results.filter(r => r.exam_id === examId);
    }
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: results }));
    return;
  }

  // 获取单个结果
  const resultMatch = pathname.match(/^\/api\/results\/(\d+)$/);
  if (resultMatch && req.method === 'GET') {
    const resultId = parseInt(resultMatch[1]);
    const results = db.loadResults();
    const result = results.find(r => r.id === resultId);
    if (!result) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Result not found' }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: result }));
    return;
  }

  // ===== 回收站 API =====

  // 删除考试结果（移入回收站）
  const deleteResultMatch = pathname.match(/^\/api\/results\/(\d+)$/);
  if (deleteResultMatch && req.method === 'DELETE') {
    const resultId = parseInt(deleteResultMatch[1]);
    const results = db.loadResults();
    const idx = results.findIndex(r => r.id === resultId);
    if (idx === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Result not found' }));
      return;
    }
    // 放入回收站
    const deletedResult = results[idx];
    db.addToRecycleBin('exam_result', deletedResult);
    db.deleteResult(resultId);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 获取回收站列表
  if (pathname === '/api/recycle-bin' && req.method === 'GET') {
    const bin = db.loadRecycleBin();
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: bin.items }));
    return;
  }

  // 获取回收站设置
  if (pathname === '/api/recycle-bin/settings' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: recycleBinSettings }));
    return;
  }

  // 更新回收站设置
  if (pathname === '/api/recycle-bin/settings' && req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.retention_days !== undefined) {
          recycleBinSettings.retention_days = Math.max(1, Math.min(365, parseInt(data.retention_days) || 30));
        }
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: recycleBinSettings }));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid settings' }));
      }
    });
    return;
  }

  // 恢复回收站项目
  const restoreMatch = pathname.match(/^\/api\/recycle-bin\/(\d+)\/restore$/);
  if (restoreMatch && req.method === 'POST') {
    const itemId = parseInt(restoreMatch[1]);
    const item = db.restoreFromRecycleBin(itemId);
    if (!item) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Item not found' }));
      return;
    }
    if (item.type === 'exam_config') {
      db.saveExamConfig(item.data);
    } else if (item.type === 'exam_result') {
      db.saveResult(item.data);
    }
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 彻底删除回收站项目
  const recycleBinItemMatch = pathname.match(/^\/api\/recycle-bin\/(\d+)$/);
  if (recycleBinItemMatch && req.method === 'DELETE') {
    const itemId = parseInt(recycleBinItemMatch[1]);
    db.deleteRecycleBinItem(itemId);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 清空回收站（彻底删除所有）
  if (pathname === '/api/recycle-bin/clear' && req.method === 'DELETE') {
    db.db.prepare('DELETE FROM recycle_bin').run();
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 获取结果（按 UID 查询）
  if (pathname === '/api/results/by-uid' && req.method === 'GET') {
    const uid = query.uid || '';
    if (!uid) {
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: 'UID is required' }));
      return;
    }
    let results = db.getResultsByUid(uid);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: results }));
    return;
  }

  // ===== 课程学习模块 API =====

  // 学习首页数据：两个课包 + 进度 + 考试状态 + 成绩记录
  if (pathname === '/api/learn/home' && req.method === 'GET') {
    const uid = query.uid || '';
    const packages = db.loadCoursePackages(true).map(p => buildPackageState(p, uid));
    const myResults = uid ? db.getResultsByUid(uid).map(r => ({
      id: r.id,
      exam_id: r.exam_id,
      exam_name: r.exam_name,
      total_score: r.total_score,
      max_score: r.max_score,
      percentage: r.percentage,
      passed: r.percentage >= PASS_SCORE,
      created_at: r.created_at
    })) : [];
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: { packages, results: myResults } }));
    return;
  }

  // ===== 资质申请 =====
  // 提交申请：需该课包考试已通过（≥60），且无待审核/已通过的同课包申请
  if (pathname === '/api/apply' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const uid = String(body.uid || '').trim();
      const pkgKey = String(body.package_key || '').trim();
      if (!uid || !pkgKey) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: '缺少 uid 或 package_key' }));
        return;
      }
      const pkg = db.loadCoursePackages().find(p => p.key === pkgKey);
      if (!pkg) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: '课包不存在' }));
        return;
      }
      if (!pkg.exam_config_id) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: '该课包还未配置考试' }));
        return;
      }
      const latest = db.getLatestResult(uid, pkg.exam_config_id);
      if (!latest || latest.percentage < PASS_SCORE) {
        res.writeHead(403);
        res.end(JSON.stringify({ success: false, error: '考试通过后才能申请资质' }));
        return;
      }
      if (db.hasActiveApplication(uid, pkgKey)) {
        res.writeHead(409);
        res.end(JSON.stringify({ success: false, error: '已有待审核或已通过的申请，请勿重复提交' }));
        return;
      }
      const id = db.createApplication({
        uid, nickname: String(body.nickname || '').trim(), package_key: pkgKey,
        exam_result_id: latest.id, percentage: latest.percentage
      });
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: { id } }));
    });
    return;
  }

  // 申请状态查询（按 uid 返回各课包最新申请）
  if (pathname === '/api/apply/status' && req.method === 'GET') {
    const uid = String(query.uid || '').trim();
    const data = {};
    for (const key of ['sister', 'trainer']) {
      const app = uid ? db.getLatestApplication(uid, key) : null;
      if (app) {
        data[key] = {
          id: app.id, status: app.status, reason: app.reason || '',
          percentage: app.percentage, created_at: app.created_at, reviewed_at: app.reviewed_at
        };
      }
    }
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data }));
    return;
  }

  // 管理端：申请列表（培训师系统服务端拉取）
  if (pathname === '/api/admin/applications' && req.method === 'GET') {
    const items = db.loadApplications(query.status || null);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: items }));
    return;
  }

  // 管理端：审核（approve / reject + reason）
  const reviewMatch = pathname.match(/^\/api\/admin\/applications\/(\d+)\/review$/);
  if (reviewMatch && req.method === 'POST') {
    const appId = parseInt(reviewMatch[1]);
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const action = body.action === 'approve' ? 'approve' : 'reject';
      if (action === 'reject' && !String(body.reason || '').trim()) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: '驳回需填写原因' }));
        return;
      }
      const ok = db.reviewApplication(appId, action, String(body.reason || '').trim());
      if (!ok) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: '申请不存在' }));
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
    });
    return;
  }

  // 图文课心跳：仅页面可见时前端发送，累计停留时长，达标自动完成
  if (pathname === '/api/learn/heartbeat' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const uid = body.uid || '';
      const courseId = parseInt(body.course_id);
      const seconds = Number(body.seconds) || 0;
      if (!uid || !courseId || seconds <= 0 || seconds > 60) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'uid、course_id、seconds(0-60) 必填' }));
        return;
      }
      const course = db.getCourseById(courseId);
      if (!course || course.enabled === false) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Course not found' }));
        return;
      }
      const requiredSeconds = (course.duration_minutes || 0) * 60;
      const progress = db.addHeartbeat(uid, body.nickname || '', courseId, seconds, requiredSeconds);
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: {
          course_id: courseId,
          watched_seconds: progress.watched_seconds,
          progress_percent: progress.progress_percent,
          completed: progress.completed === 1,
          required_seconds: requiredSeconds
        }
      }));
    });
    return;
  }

  // 视频课进度上报：按真实播放时长累计，>=90% 自动完成
  if (pathname === '/api/learn/video-progress' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const uid = body.uid || '';
      const courseId = parseInt(body.course_id);
      if (!uid || !courseId) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'uid、course_id 必填' }));
        return;
      }
      const course = db.getCourseById(courseId);
      if (!course || course.enabled === false) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Course not found' }));
        return;
      }
      const progress = db.saveVideoProgress(
        uid, body.nickname || '', courseId,
        Number(body.watched_seconds) || 0,
        Number(body.progress_percent) || 0
      );
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: {
          course_id: courseId,
          watched_seconds: progress.watched_seconds,
          progress_percent: progress.progress_percent,
          completed: progress.completed === 1
        }
      }));
    });
    return;
  }

  // ===== 管理端：课程包 CRUD =====

  if (pathname === '/api/admin/packages' && req.method === 'GET') {
    const packages = db.loadCoursePackages().map(p => ({
      ...p,
      courses: db.loadCourses(p.id)
    }));
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: packages }));
    return;
  }

  if (pathname === '/api/admin/packages' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const pkg = {
        key: body.key || null,
        name: body.name || '未命名课包',
        description: body.description || '',
        cooldown_days: typeof body.cooldown_days === 'number' ? body.cooldown_days : 1,
        exam_config_id: body.exam_config_id || null,
        sort: body.sort || 0,
        enabled: body.enabled !== false
      };
      const id = db.saveCoursePackage(pkg);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: db.getCoursePackageById(id) }));
    });
    return;
  }

  const packageMatch = pathname.match(/^\/api\/admin\/packages\/(\d+)$/);
  if (packageMatch && req.method === 'PUT') {
    const pkgId = parseInt(packageMatch[1]);
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const existing = db.getCoursePackageById(pkgId);
      if (!existing) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Package not found' }));
        return;
      }
      const updated = { ...existing, ...body, id: pkgId, key: existing.key };
      db.saveCoursePackage(updated);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: db.getCoursePackageById(pkgId) }));
    });
    return;
  }

  if (packageMatch && req.method === 'DELETE') {
    const pkgId = parseInt(packageMatch[1]);
    const existing = db.getCoursePackageById(pkgId);
    if (!existing) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Package not found' }));
      return;
    }
    db.deleteCoursePackage(pkgId); // 级联删除课程与进度
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // ===== 管理端：课程 CRUD =====

  if (pathname === '/api/admin/courses' && req.method === 'GET') {
    const packageId = query.package_id ? parseInt(query.package_id) : null;
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: db.loadCourses(packageId) }));
    return;
  }

  if (pathname === '/api/admin/courses' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const packageId = parseInt(body.package_id);
      if (!packageId || !db.getCoursePackageById(packageId)) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'package_id 无效' }));
        return;
      }
      const course = {
        package_id: packageId,
        title: body.title || '未命名课程',
        type: body.type === 'article' ? 'article' : 'video',
        video_path: body.video_path || '',
        content: body.content || '',
        duration_minutes: typeof body.duration_minutes === 'number' ? body.duration_minutes : 0,
        sort: body.sort || 0,
        category: body.category === 'optional' ? 'optional' : 'required',
        enabled: body.enabled !== false
      };
      const id = db.saveCourse(course);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: db.getCourseById(id) }));
    });
    return;
  }

  const courseMatch = pathname.match(/^\/api\/admin\/courses\/(\d+)$/);
  if (courseMatch && req.method === 'PUT') {
    const courseId = parseInt(courseMatch[1]);
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
        return;
      }
      const existing = db.getCourseById(courseId);
      if (!existing) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Course not found' }));
        return;
      }
      const updated = { ...existing, ...body, id: courseId, package_id: existing.package_id };
      db.saveCourse(updated);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: db.getCourseById(courseId) }));
    });
    return;
  }

  if (courseMatch && req.method === 'DELETE') {
    const courseId = parseInt(courseMatch[1]);
    if (!db.getCourseById(courseId)) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Course not found' }));
      return;
    }
    db.deleteCourse(courseId);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // ===== 管理端：视频上传（原生 http，raw body 直传）=====
  if (pathname === '/api/admin/upload-video' && req.method === 'POST') {
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    const rawName = decodeURIComponent(req.headers['x-filename'] || 'video.mp4');
    const ext = path.extname(rawName).toLowerCase();
    const allowedExts = ['.mp4', '.webm', '.mov', '.m4v', '.mkv', '.avi'];
    if (!allowedExts.includes(ext)) {
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: '仅支持视频文件：' + allowedExts.join(' ') }));
      req.resume();
      return;
    }
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > MAX_SIZE) {
      res.writeHead(413);
      res.end(JSON.stringify({ success: false, error: '文件超过 500MB 限制' }));
      req.resume();
      return;
    }
    const safeName = Date.now() + '_' + path.basename(rawName).replace(/[^\w.\-]/g, '_');
    const filePath = path.join(UPLOADS_DIR, safeName);
    const ws = fs.createWriteStream(filePath);
    let size = 0;
    let rejected = false;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_SIZE && !rejected) {
        rejected = true;
        req.unpipe(ws);
        req.destroy();
        ws.destroy();
        fs.unlink(filePath, () => {});
        res.writeHead(413);
        res.end(JSON.stringify({ success: false, error: '文件超过 500MB 限制' }));
      }
    });
    req.pipe(ws);
    ws.on('finish', () => {
      if (rejected || res.writableEnded) return;
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: { path: '/uploads/' + safeName, size } }));
    });
    ws.on('error', (e) => {
      if (res.writableEnded) return;
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: '写入文件失败: ' + e.message }));
    });
    req.on('error', () => { ws.destroy(); fs.unlink(filePath, () => {}); });
    return;
  }

  // ===== 管理端：学员学习进度 =====
  if (pathname === '/api/admin/learn-progress' && req.method === 'GET') {
    const filterUid = query.uid || '';
    const filterPackageId = query.package_id ? parseInt(query.package_id) : null;
    const packages = db.loadCoursePackages().filter(p => !filterPackageId || p.id === filterPackageId);
    const allProgress = db.getAllProgress();

    // 按 uid 聚合学员
    const studentMap = new Map();
    for (const row of allProgress) {
      if (filterUid && row.uid !== filterUid) continue;
      if (!studentMap.has(row.uid)) {
        studentMap.set(row.uid, { uid: row.uid, nickname: row.nickname || '', packages: [] });
      }
    }
    // 有成绩但无学习记录的 uid 也纳入（按 uid 查询时）
    if (filterUid && !studentMap.has(filterUid)) {
      studentMap.set(filterUid, { uid: filterUid, nickname: '', packages: [] });
    }

    for (const student of studentMap.values()) {
      student.packages = packages.map(p => {
        const state = buildPackageState(p, student.uid);
        if (!student.nickname) {
          const row = allProgress.find(r => r.uid === student.uid && r.nickname);
          if (row) student.nickname = row.nickname;
        }
        return {
          package_id: p.id,
          package_key: p.key,
          package_name: p.name,
          total_courses: state.total_courses,
          completed_courses: state.completed_courses,
          all_completed: state.all_completed,
          exam_status: state.exam_status,
          courses: state.courses.map(c => ({
            course_id: c.id,
            title: c.title,
            type: c.type,
            progress_percent: c.progress_percent,
            completed: c.completed
          }))
        };
      });
    }

    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: { students: [...studentMap.values()] } }));
    return;
  }

  // 上传的视频文件（支持 Range 拖动播放）
  if (pathname.startsWith('/uploads/')) {
    serveUpload(req, res, pathname);
    return;
  }

  // 尝试 serve 前端静态文件（Docker 部署时使用）
  if (serveStatic(req, res, pathname)) {
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ success: false, error: 'Not found' }));
});

// 定时任务：自动发布/截止试卷（每分钟检查一次）
function checkScheduledExams() {
  const configs = db.loadExamConfigs();
  const now = new Date();
  let changed = false;

  for (const c of configs) {
    // 草稿 → 发布：到达 publish_at 时间
    if (c.status === 'draft' && c.publish_at) {
      const publishAt = new Date(c.publish_at);
      if (now >= publishAt) {
        // 多试卷可同时发布（姐妹团/培训师并行开考），不再互斥
        c.status = 'published';
        c.publish_at = null; // 发布后清除定时
        changed = true;
      }
    }
    // 已发布 → 停止：到达 stop_at 时间
    if (c.status === 'published' && c.stop_at) {
      const stopAt = new Date(c.stop_at);
      if (now >= stopAt) {
        c.status = 'stopped';
        c.stop_at = null; // 停止后清除定时
        changed = true;
      }
    }
  }

  if (changed) {
    db.saveExamConfigs(configs);
    console.log(`[${new Date().toISOString()}] 定时任务已处理试卷状态变更`);
  }
}

// 每分钟执行一次
setInterval(checkScheduledExams, 60 * 1000);
// 启动时也立即检查一次
checkScheduledExams();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`考试系统后端运行在 http://localhost:${PORT}`);
  console.log(`API 基础路径: http://localhost:${PORT}/api`);
  console.log(`题库数量: ${db.loadQuestionsByBank(1).questions.length} 题`);
});
