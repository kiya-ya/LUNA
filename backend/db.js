/**
 * 数据库模块 - 使用 Node.js 内置的 node:sqlite (v22.5+)
 * 迁移所有 JSON 文件存储到 SQLite 数据库
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data.db');
const db = new DatabaseSync(DB_PATH);

// 启用外键约束
db.exec('PRAGMA foreign_keys = ON;');

// 事务辅助函数
function runInTransaction(fn) {
  db.exec('BEGIN');
  try {
    fn();
    db.exec('COMMIT');
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch (rollbackErr) { /* ignore */ }
    throw e;
  }
}

// ============ 初始化表结构 ============
function initTables() {
  // 1. 题库列表
  db.exec(`
    CREATE TABLE IF NOT EXISTS question_banks (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 2. 题目
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_id INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL DEFAULT 'single',
      content TEXT NOT NULL DEFAULT '',
      options TEXT,
      answer TEXT,
      key_points TEXT,
      blanks TEXT,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 3. 考试配置
  db.exec(`
    CREATE TABLE IF NOT EXISTS exam_configs (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '未命名试卷',
      single INTEGER DEFAULT 10,
      multiple INTEGER DEFAULT 0,
      fill INTEGER DEFAULT 5,
      essay INTEGER DEFAULT 5,
      score_single INTEGER DEFAULT 5,
      score_multiple INTEGER DEFAULT 5,
      score_fill INTEGER DEFAULT 5,
      score_essay INTEGER DEFAULT 5,
      timeLimit INTEGER DEFAULT 0,
      bank_id INTEGER DEFAULT 1,
      status TEXT DEFAULT 'draft',
      publish_at TEXT,
      stop_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 4. 考试结果
  db.exec(`
    CREATE TABLE IF NOT EXISTS exam_results (
      id INTEGER PRIMARY KEY,
      exam_id INTEGER,
      exam_name TEXT,
      user_name TEXT,
      user_uid TEXT,
      total_score REAL DEFAULT 0,
      max_score REAL DEFAULT 0,
      percentage REAL DEFAULT 0,
      answers TEXT,
      details TEXT,
      start_time TEXT,
      end_time TEXT,
      time_limit INTEGER DEFAULT 30,
      device_id TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 兼容旧表：添加 device_id 和 ip_address 列（如果表已存在但缺少这些列）
  try { db.exec(`ALTER TABLE exam_results ADD COLUMN device_id TEXT`); } catch (e) { /* ignore */ }
  try { db.exec(`ALTER TABLE exam_results ADD COLUMN ip_address TEXT`); } catch (e) { /* ignore */ }

  // 5. 回收站
  db.exec(`
    CREATE TABLE IF NOT EXISTS recycle_bin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      deleted_at TEXT DEFAULT (datetime('now')),
      expire_at TEXT
    )
  `);

  console.log('[DB] 表初始化完成');
}

initTables();

// ============ 题库操作 ============

function loadQuestionBanks() {
  const stmt = db.prepare('SELECT * FROM question_banks ORDER BY id');
  return stmt.all().map(b => ({
    id: b.id,
    name: b.name,
    is_default: Boolean(b.is_default)
  }));
}

function saveQuestionBanks(banks) {
  const insert = db.prepare('INSERT OR REPLACE INTO question_banks (id, name, is_default) VALUES (?, ?, ?)');
  runInTransaction(() => {
    for (const b of banks) {
      insert.run(b.id, b.name, b.is_default ? 1 : 0);
    }
  })
}

function nextBankId() {
  const row = db.prepare('SELECT MAX(id) as max_id FROM question_banks').get();
  return (row.max_id || 0) + 1;
}

// ============ 题目操作 ============

function loadQuestionsByBank(bankId) {
  const stmt = db.prepare('SELECT * FROM questions WHERE bank_id = ? ORDER BY id');
  const rows = stmt.all(bankId);
  return {
    questions: rows.map(q => ({
      id: q.id,
      bank_id: q.bank_id,
      type: q.type,
      content: q.content,
      options: q.options ? JSON.parse(q.options) : [],
      answer: q.answer || '',
      key_points: q.key_points || '',
      blanks: q.blanks ? JSON.parse(q.blanks) : [],
      enabled: q.enabled !== 0
    }))
  };
}

function loadAllQuestions() {
  const stmt = db.prepare('SELECT * FROM questions ORDER BY id');
  const rows = stmt.all();
  return rows.map(q => ({
    id: q.id,
    bank_id: q.bank_id,
    type: q.type,
    content: q.content,
    options: q.options ? JSON.parse(q.options) : [],
    answer: q.answer || '',
    key_points: q.key_points || '',
    blanks: q.blanks ? JSON.parse(q.blanks) : [],
    enabled: q.enabled !== 0
  }));
}

function saveQuestion(question) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO questions
    (id, bank_id, type, content, options, answer, key_points, blanks, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    question.id || null,
    question.bank_id || 1,
    question.type || 'single',
    question.content || '',
    question.options ? JSON.stringify(question.options) : null,
    question.answer || null,
    question.key_points || null,
    question.blanks ? JSON.stringify(question.blanks) : null,
    question.enabled !== false ? 1 : 0
  );
}

function deleteQuestion(id) {
  db.prepare('DELETE FROM questions WHERE id = ?').run(id);
}

function nextQuestionId() {
  const row = db.prepare('SELECT MAX(id) as max_id FROM questions').get();
  return (row.max_id || 0) + 1;
}

function getTotalQuestionsCount(bankId) {
  if (bankId) {
    return db.prepare('SELECT COUNT(*) as count FROM questions WHERE bank_id = ?').get(bankId).count;
  }
  return db.prepare('SELECT COUNT(*) as count FROM questions').get().count;
}

function getQuestionCountsByType(bankId) {
  const stmt = db.prepare(`
    SELECT type, COUNT(*) as count FROM questions
    WHERE bank_id = ? GROUP BY type
  `);
  const rows = stmt.all(bankId);
  const counts = { single: 0, multiple: 0, fill: 0, essay: 0 };
  for (const r of rows) {
    counts[r.type] = r.count;
  }
  return counts;
}

function updateQuestionEnabled(id, enabled) {
  db.prepare('UPDATE questions SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
}

// ============ 考试配置操作 ============

function loadExamConfigs() {
  const stmt = db.prepare('SELECT * FROM exam_configs ORDER BY created_at DESC');
  const rows = stmt.all();
  return rows.map(c => ({
    id: c.id,
    name: c.name,
    single: c.single,
    multiple: c.multiple,
    fill: c.fill,
    essay: c.essay,
    score_single: c.score_single,
    score_multiple: c.score_multiple,
    score_fill: c.score_fill,
    score_essay: c.score_essay,
    timeLimit: c.timeLimit,
    bank_id: c.bank_id,
    status: c.status,
    publish_at: c.publish_at,
    stop_at: c.stop_at,
    created_at: c.created_at
  }));
}

function saveExamConfig(config) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO exam_configs
    (id, name, single, multiple, fill, essay, score_single, score_multiple, score_fill, score_essay, timeLimit, bank_id, status, publish_at, stop_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    config.id || null,
    config.name || '未命名试卷',
    config.single || 0,
    config.multiple || 0,
    config.fill || 0,
    config.essay || 0,
    config.score_single || 5,
    config.score_multiple || 5,
    config.score_fill || 5,
    config.score_essay || 5,
    config.timeLimit || 0,
    config.bank_id || 1,
    config.status || 'draft',
    config.publish_at || null,
    config.stop_at || null,
    config.created_at || new Date().toISOString()
  );
}

function saveExamConfigs(configs) {
  runInTransaction(() => {
    for (const c of configs) {
      saveExamConfig(c);
    }
  })
}

function deleteExamConfig(id) {
  db.prepare('DELETE FROM exam_configs WHERE id = ?').run(id);
}

function nextExamConfigId() {
  const row = db.prepare('SELECT MAX(id) as max_id FROM exam_configs').get();
  return (row.max_id || 0) + 1;
}

// ============ 考试结果操作 ============

function loadResults() {
  const stmt = db.prepare('SELECT * FROM exam_results ORDER BY created_at DESC');
  const rows = stmt.all();
  return rows.map(r => ({
    id: r.id,
    exam_id: r.exam_id,
    exam_name: r.exam_name,
    user_name: r.user_name,
    user_uid: r.user_uid,
    total_score: r.total_score,
    max_score: r.max_score,
    percentage: r.percentage,
    answers: r.answers ? JSON.parse(r.answers) : {},
    details: r.details ? JSON.parse(r.details) : [],
    start_time: r.start_time,
    end_time: r.end_time,
    time_limit: r.time_limit,
    device_id: r.device_id || '',
    ip_address: r.ip_address || '',
    created_at: r.created_at
  }));
}

function saveResult(result) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO exam_results
    (id, exam_id, exam_name, user_name, user_uid, total_score, max_score, percentage, answers, details, start_time, end_time, time_limit, device_id, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    result.id || null,
    result.exam_id || null,
    result.exam_name || '',
    result.user_name || '',
    result.user_uid || '',
    result.total_score || 0,
    result.max_score || 0,
    result.percentage || 0,
    result.answers ? JSON.stringify(result.answers) : '{}',
    result.details ? JSON.stringify(result.details) : '[]',
    result.start_time || null,
    result.end_time || null,
    result.time_limit || 30,
    result.device_id || '',
    result.ip_address || '',
    result.created_at || new Date().toISOString()
  );
}

function saveResults(results) {
  runInTransaction(() => {
    for (const r of results) {
      saveResult(r);
    }
  })
}

function deleteResult(id) {
  db.prepare('DELETE FROM exam_results WHERE id = ?').run(id);
}

function nextResultId() {
  const row = db.prepare('SELECT MAX(id) as max_id FROM exam_results').get();
  return (row.max_id || 0) + 1;
}

function getResultsByUid(uid) {
  const stmt = db.prepare('SELECT * FROM exam_results WHERE user_uid = ? ORDER BY created_at DESC');
  const rows = stmt.all(uid);
  return rows.map(r => ({
    id: r.id,
    exam_id: r.exam_id,
    exam_name: r.exam_name,
    user_name: r.user_name,
    user_uid: r.user_uid,
    total_score: r.total_score,
    max_score: r.max_score,
    percentage: r.percentage,
    answers: r.answers ? JSON.parse(r.answers) : {},
    details: r.details ? JSON.parse(r.details) : [],
    start_time: r.start_time,
    end_time: r.end_time,
    time_limit: r.time_limit,
    device_id: r.device_id || '',
    ip_address: r.ip_address || '',
    created_at: r.created_at
  }));
}

// 检查设备指纹是否已被其他 UID 使用过
function checkDeviceUsed(deviceId, excludeUid) {
  if (!deviceId) return null;
  const stmt = db.prepare('SELECT user_uid, user_name, created_at FROM exam_results WHERE device_id = ? AND user_uid != ? LIMIT 1');
  return stmt.get(deviceId, excludeUid || '') || null;
}

// 检查同一 IP 在最近 N 小时内是否有大量不同 UID 提交（防批量代考）
function getRecentResultsByIp(ipAddress, hours = 24) {
  if (!ipAddress) return [];
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const stmt = db.prepare('SELECT DISTINCT user_uid FROM exam_results WHERE ip_address = ? AND created_at > ?');
  return stmt.all(ipAddress, since);
}

// ============ 回收站操作 ============

function loadRecycleBin() {
  const stmt = db.prepare('SELECT * FROM recycle_bin ORDER BY deleted_at DESC');
  const rows = stmt.all();
  return {
    items: rows.map(i => ({
      id: i.id,
      type: i.type,
      data: i.data ? JSON.parse(i.data) : null,
      deleted_at: i.deleted_at,
      expire_at: i.expire_at
    }))
  };
}

function addToRecycleBin(type, data) {
  const expireDays = 7; // 默认保留7天
  const expireAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000).toISOString();
  const stmt = db.prepare(`
    INSERT INTO recycle_bin (type, data, expire_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(type, JSON.stringify(data), expireAt);
}

function restoreFromRecycleBin(id) {
  const row = db.prepare('SELECT * FROM recycle_bin WHERE id = ?').get(id);
  if (!row) return null;
  const data = JSON.parse(row.data);
  db.prepare('DELETE FROM recycle_bin WHERE id = ?').run(id);
  return { type: row.type, data };
}

function deleteRecycleBinItem(id) {
  db.prepare('DELETE FROM recycle_bin WHERE id = ?').run(id);
}

function cleanupExpiredRecycleBin() {
  const now = new Date().toISOString();
  const stmt = db.prepare('DELETE FROM recycle_bin WHERE expire_at < ?');
  stmt.run(now);
}

function getRecycleBinItemCount() {
  return db.prepare('SELECT COUNT(*) as count FROM recycle_bin').get().count;
}

// ============ 数据迁移（从JSON到SQLite） ============
function migrateFromJSON() {
  // 检查是否已迁移（有数据则跳过）
  const bankCount = db.prepare('SELECT COUNT(*) as count FROM question_banks').get().count;
  if (bankCount > 0) {
    console.log('[DB] 已有数据，跳过JSON迁移');
    return;
  }

  console.log('[DB] 开始从JSON迁移到SQLite...');

  // 1. 迁移题库
  const banksPath = path.join(__dirname, '..', 'question_banks.json');
  if (fs.existsSync(banksPath)) {
    try {
      const banks = JSON.parse(fs.readFileSync(banksPath, 'utf-8'));
      const insert = db.prepare('INSERT INTO question_banks (id, name, is_default) VALUES (?, ?, ?)');
      runInTransaction(() => {
        for (const b of banks) {
          insert.run(b.id, b.name, b.is_default ? 1 : 0);
        }
      })
      console.log(`[DB] 迁移 ${banks.length} 个题库`);
    } catch (e) {
      console.log('[DB] 题库迁移失败:', e.message);
    }
  }

  // 2. 迁移题目
  const banks = loadQuestionBanks();
  for (const bank of banks) {
    const qPath = path.join(__dirname, '..', `questions_bank_${bank.id}.json`);
    if (fs.existsSync(qPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(qPath, 'utf-8'));
        const questions = data.questions || [];
        const insert = db.prepare(`
          INSERT INTO questions (bank_id, type, content, options, answer, key_points, blanks, enabled)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        runInTransaction(() => {
          for (const q of questions) {
            insert.run(
              bank.id,
              q.type || 'single',
              q.content || q.title || '',
              q.options ? JSON.stringify(q.options) : null,
              q.answer || null,
              q.key_points || q.keyPoints || null,
              q.blanks ? JSON.stringify(q.blanks) : null,
              q.enabled !== false ? 1 : 0
            );
          }
        })
        console.log(`[DB] 迁移题库 ${bank.id} 的 ${questions.length} 道题目`);
      } catch (e) {
        console.log(`[DB] 题库 ${bank.id} 题目迁移失败:`, e.message);
      }
    }
  }

  // 3. 迁移考试配置
  const configsPath = path.join(__dirname, '..', 'exam_configs.json');
  if (fs.existsSync(configsPath)) {
    try {
      const configs = JSON.parse(fs.readFileSync(configsPath, 'utf-8'));
      const insert = db.prepare(`
        INSERT INTO exam_configs (id, name, single, multiple, fill, essay, score_single, score_multiple, score_fill, score_essay, timeLimit, bank_id, status, publish_at, stop_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      runInTransaction(() => {
        for (const c of configs) {
          insert.run(
            c.id,
            c.name,
            c.single || 0,
            c.multiple || 0,
            c.fill || 0,
            c.essay || 0,
            c.score_single || 5,
            c.score_multiple || 5,
            c.score_fill || 5,
            c.score_essay || 5,
            c.timeLimit || 0,
            c.bank_id || 1,
            c.status || 'draft',
            c.publish_at || null,
            c.stop_at || null,
            c.created_at || new Date().toISOString()
          );
        }
      })
      console.log(`[DB] 迁移 ${configs.length} 个考试配置`);
    } catch (e) {
      console.log('[DB] 考试配置迁移失败:', e.message);
    }
  }

  // 4. 迁移考试结果
  const resultsPath = path.join(__dirname, '..', 'exam_results.json');
  if (fs.existsSync(resultsPath)) {
    try {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      const insert = db.prepare(`
        INSERT INTO exam_results (id, exam_id, exam_name, user_name, user_uid, total_score, max_score, percentage, answers, details, start_time, end_time, time_limit, device_id, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      runInTransaction(() => {
        for (const r of results) {
          insert.run(
            r.id,
            r.exam_id,
            r.exam_name || '',
            r.user_name || '',
            r.user_uid || '',
            r.total_score || 0,
            r.max_score || 0,
            r.percentage || 0,
            r.answers ? JSON.stringify(r.answers) : '{}',
            r.details ? JSON.stringify(r.details) : '[]',
            r.start_time || null,
            r.end_time || null,
            r.time_limit || 30,
            r.device_id || '',
            r.ip_address || '',
            r.created_at || new Date().toISOString()
          );
        }
      })
      console.log(`[DB] 迁移 ${results.length} 条考试结果`);
    } catch (e) {
      console.log('[DB] 考试结果迁移失败:', e.message);
    }
  }

  // 5. 迁移回收站
  const binPath = path.join(__dirname, '..', 'recycle_bin.json');
  if (fs.existsSync(binPath)) {
    try {
      const bin = JSON.parse(fs.readFileSync(binPath, 'utf-8'));
      const items = bin.items || [];
      const insert = db.prepare('INSERT INTO recycle_bin (type, data, deleted_at, expire_at) VALUES (?, ?, ?, ?)');
      runInTransaction(() => {
        for (const item of items) {
          insert.run(item.type, JSON.stringify(item.data), item.deleted_at, item.expire_at);
        }
      })
      console.log(`[DB] 迁移 ${items.length} 条回收站记录`);
    } catch (e) {
      console.log('[DB] 回收站迁移失败:', e.message);
    }
  }

  console.log('[DB] JSON迁移完成');
}

// 启动时自动迁移
migrateFromJSON();

module.exports = {
  db,
  // 题库
  loadQuestionBanks,
  saveQuestionBanks,
  nextBankId,
  // 题目
  loadQuestionsByBank,
  loadAllQuestions,
  saveQuestion,
  deleteQuestion,
  nextQuestionId,
  getTotalQuestionsCount,
  getQuestionCountsByType,
  updateQuestionEnabled,
  // 考试配置
  loadExamConfigs,
  saveExamConfig,
  saveExamConfigs,
  deleteExamConfig,
  nextExamConfigId,
  // 考试结果
  loadResults,
  saveResult,
  saveResults,
  deleteResult,
  nextResultId,
  getResultsByUid,
  checkDeviceUsed,
  getRecentResultsByIp,
  // 回收站
  loadRecycleBin,
  addToRecycleBin,
  restoreFromRecycleBin,
  deleteRecycleBinItem,
  cleanupExpiredRecycleBin,
  getRecycleBinItemCount,
  // 迁移
  migrateFromJSON
};
