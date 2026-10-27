// backend/ai_service.js
// AI 大模型接口（硅基流动）- 用于简答题阅卷和智能生题

const API_KEY = process.env.SILICONFLOW_API_KEY || '';
const BASE_URL = 'https://api.siliconflow.cn/v1';
const MODEL_PRIMARY = 'zai-org/GLM-4.5-Air';
const MODEL_FALLBACK = 'zai-org/GLM-4.5-Air';

// 检查 AI 是否可用
function isAIAvailable() {
  return !!API_KEY;
}

// 调用 AI 大模型（带重试机制）
async function callAI(prompt, model = MODEL_PRIMARY, systemPrompt = null, maxTokens = 1024, retryCount = 3) {
  if (!API_KEY) {
    throw new Error('AI API Key 未配置');
  }

  const defaultSystem = '你是一个富有同理心的考试阅卷助手。你明白考生可能紧张、表达不够完美，但用心作答值得鼓励。评分时请兼顾：答案准确性、回答字数（至少要有一定篇幅）、答题态度（是否认真对待）。对于态度认真、字数充足但要点匹配不全的答案，请给予人情分。严格按照满分范围评分，不要超出。';
  
  const requestBody = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt || defaultSystem },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: maxTokens
  };

  let lastError = null;
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const bodyStr = JSON.stringify(requestBody);
      console.log(`[AI] 第${attempt}/${retryCount}次尝试，请求体大小: ${Buffer.byteLength(bodyStr, 'utf8')} bytes, prompt长度: ${prompt.length} 字符`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90秒超时
      
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: bodyStr,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        // 根据 HTTP 状态码分类错误
        if (res.status === 429) {
          throw new Error('硅基流动API限流(429)：请求频率过高，请稍后再试');
        } else if (res.status === 401) {
          throw new Error('硅基流动API密钥无效(401)：请检查SILICONFLOW_API_KEY是否过期或配额已用完');
        } else if (res.status === 503) {
          throw new Error('硅基流动服务暂时不可用(503)：平台负载高，请稍后重试');
        } else if (res.status >= 500) {
          throw new Error(`硅基流动服务器错误(${res.status})：平台内部错误，请稍后重试`);
        }
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        console.log(`[AI] ${model} 调用成功`);
        return data.choices[0].message.content;
      }
      throw new Error('AI 返回格式错误');
    } catch (err) {
      lastError = err;
      if (err.name === 'AbortError') {
        console.error(`[AI] ${model} 第${attempt}次尝试超时(90秒)`);
        lastError = new Error('硅基流动API响应超时(90秒)：平台处理慢，请稍后重试');
      } else {
        console.error(`[AI] ${model} 第${attempt}次尝试失败:`, err.message);
      }
      
      // 如果是 401，直接抛出不重试（Key 问题不会通过重试解决）
      if (err.message && err.message.includes('401')) {
        throw err;
      }
      
      // 不是最后一次尝试，等待后重试（指数退避）
      if (attempt < retryCount) {
        const delay = attempt * 2000; // 2秒、4秒
        console.log(`[AI] 等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('AI 调用失败，已重试耗尽');
}

// 回退调用
async function callAIWithFallback(prompt, systemPrompt = null, maxTokens = 1024) {
  try {
    console.log(`[AI] 尝试使用 ${MODEL_PRIMARY}...`);
    return await callAI(prompt, MODEL_PRIMARY, systemPrompt, maxTokens);
  } catch (err) {
    console.log(`[AI] ${MODEL_PRIMARY} 失败，回退到 ${MODEL_FALLBACK}...`);
    return await callAI(prompt, MODEL_FALLBACK, systemPrompt, maxTokens);
  }
}

// 提取关键词（本地备用）
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

// AI 简答题阅卷
async function gradeEssay(question, userAnswer, keyPoints, maxScore = 10) {
  if (!userAnswer || !userAnswer.trim()) {
    return {
      score: 0,
      feedback: '未作答',
      matched_points: [],
      missed_points: []
    };
  }

  if (!isAIAvailable()) {
    console.warn('[AI] API Key 未配置，回退到本地评分');
    return localGradeEssay(userAnswer, keyPoints, maxScore);
  }

  const prompt = `请对以下简答题进行评分：

题目：${question}
用户答案：${userAnswer}
评分要点：${keyPoints}
满分：${maxScore}分

请严格按照以下格式返回结果（不要添加其他内容）：
分数: [0-${maxScore}之间的整数]
反馈: [简要评价，50字以内]
匹配要点: [用户答案中提到的要点，用中文逗号分隔]
遗漏要点: [用户答案中遗漏的要点，用中文逗号分隔]

注意：
1. 请严格按照满分${maxScore}分来评分，不要给出超出范围的分值
2. 评分维度（综合判断，不要只看要点匹配）：
   - 要点匹配度（最重要）：用户答案是否提到了评分要点
   - 回答字数：用户是否认真写了足够多的内容（字数多说明态度认真）
   - 答题态度：是否围绕题目展开，有没有敷衍（如只写"不知道""不会"等）
3. 给分规则（非常宽松，鼓励为主）：
   - 要点匹配60%以上：给满分或接近满分（90%-100%）
   - 要点匹配30%-60%：给70%-90%的分数
   - 要点匹配较少但字数充足、态度认真：给50%-70%的人情分
   - 要点完全没匹配但字数较多且态度认真：给30%-50%的人情分（辛苦分）
   - 完全空白、或只写"不会""不知道"等敷衍答案：给0分
4. 鼓励性评分：只要用户认真作答、围绕题目写了内容，即使要点没完全匹配，也至少给满分的30%-40%
5. 反馈要温和，指出遗漏要点的同时也要肯定用户的努力`;

  try {
    const response = await callAIWithFallback(prompt);
    console.log('[AI Grade] 原始响应:', response.substring(0, 200));

    // 解析结果
    const scoreMatch = response.match(/分数[:：]\s*(\d+)/);
    const feedbackMatch = response.match(/反馈[:：]\s*(.+)/);
    const matchedMatch = response.match(/匹配要点[:：]\s*(.+)/);
    const missedMatch = response.match(/遗漏要点[:：]\s*(.+)/);

    let score = scoreMatch ? parseInt(scoreMatch[1]) : Math.round(maxScore * 0.4);
    // 确保分数在范围内
    score = Math.max(0, Math.min(maxScore, score));

    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'AI 评分完成';
    const matched_points = matchedMatch
      ? matchedMatch[1].split(/[,，、]/).map(s => s.trim()).filter(s => s && s.length > 0)
      : [];
    const missed_points = missedMatch
      ? missedMatch[1].split(/[,，、]/).map(s => s.trim()).filter(s => s && s.length > 0)
      : [];

    console.log(`[AI Grade] 评分结果: ${score}/${maxScore}, 反馈: ${feedback.substring(0, 50)}`);

    return { score, feedback, matched_points, missed_points };
  } catch (err) {
    console.warn('[AI Grade] AI 评分失败，回退到本地评分:', err.message);
    return localGradeEssay(userAnswer, keyPoints, maxScore);
  }
}

// 本地简答题评分（关键词匹配 + 人情分）
function localGradeEssay(userAnswer, keyPoints, maxScore) {
  if (!userAnswer || !keyPoints) {
    return {
      score: 0,
      feedback: '未作答或缺少评分要点',
      matched_points: [],
      missed_points: []
    };
  }

  const keywords = extractKeywords(keyPoints);
  const userText = String(userAnswer).toLowerCase();
  const matched = keywords.filter(kw => userText.includes(kw));
  const missed = keywords.filter(kw => !userText.includes(kw));
  const coverage = keywords.length > 0 ? matched.length / keywords.length : 0;
  
  // 计算回答字数（用于人情分）
  const userAnswerLen = String(userAnswer).trim().length;
  const hasContent = userAnswerLen > 20; // 超过20字认为有认真作答
  const isPerfunctory = /不知道|不会|不懂|没学过|不清楚|不会写|略|无/.test(userAnswer);
  
  // 基础分（根据要点匹配）
  let baseScore;
  if (coverage >= 1) baseScore = maxScore;
  else if (coverage >= 0.6) baseScore = Math.round(maxScore * 0.9);
  else if (coverage >= 0.4) baseScore = Math.round(maxScore * 0.75);
  else if (coverage >= 0.2) baseScore = Math.round(maxScore * 0.6);
  else if (coverage > 0) baseScore = Math.round(maxScore * 0.45);
  else baseScore = 0;
  
  // 人情分加成（字数 + 态度）
  let bonusScore = 0;
  if (!isPerfunctory && hasContent) {
    if (coverage === 0) {
      // 完全没匹配到要点，但字数充足且态度认真 → 给辛苦分 30%-45%
      bonusScore = Math.round(maxScore * 0.4);
    } else if (coverage < 0.2) {
      // 匹配很少，但有认真写 → 额外加 10%-15%
      bonusScore = Math.round(maxScore * 0.15);
    }
  }
  
  // 敷衍答案直接0分
  let score;
  if (isPerfunctory && coverage === 0) {
    score = 0;
  } else {
    score = Math.min(maxScore, baseScore + bonusScore);
  }
  
  // 构建反馈
  let feedbackMsg = `要点匹配${Math.round(coverage * 100)}%`;
  if (bonusScore > 0) {
    feedbackMsg += `，含人情分（${userAnswerLen}字）`;
  }
  if (isPerfunctory) {
    feedbackMsg = '答案过于敷衍';
  }

  return {
    score,
    feedback: feedbackMsg,
    matched_points: matched,
    missed_points: missed
  };
}

// AI 智能生题（基于文档内容生成题目）- 调用硅基流动大模型
async function generateQuestions(text, singleCount = 5, multipleCount = 3, fillCount = 3, essayCount = 2) {
  if (!isAIAvailable()) {
    console.warn('[AI] API Key 未配置，无法使用 AI 生题');
    return [];
  }

  const systemPrompt = '你是一位资深的教育培训专家，擅长根据学习材料设计高质量的考试题目。请严格按照用户要求的格式输出 JSON。';

  const prompt = `请根据以下材料生成考试题目。

## 材料内容
${text.substring(0, 4000)}

## 要求
请生成以下类型的题目，题目必须与材料内容紧密相关：
- 单选题：${singleCount} 道（每题4个选项，只有1个正确答案）
- 多选题：${multipleCount} 道（每题4个选项，2个或以上正确答案，answer用逗号分隔如"A,B,C"）
- 填空题：${fillCount} 道（每题1-2个空，用 ____ 表示空，需明确标注每个空的答案）
- 简答题：${essayCount} 道（给出评分要点作为key_points）

## 输出格式
请严格按照以下 JSON 格式返回，不要添加任何其他文字说明：

{\n  "questions": [\n    {\n      "type": "single",\n      "content": "单选题题干",\n      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],\n      "answer": "A",\n      "key_points": "正确答案解析",\n      "blanks": []\n    },\n    {\n      "type": "multiple",\n      "content": "多选题题干",\n      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],\n      "answer": "A,B",\n      "key_points": "正确答案解析",\n      "blanks": []\n    },\n    {\n      "type": "fill",\n      "content": "填空题题干，第1空____，第2空____",\n      "options": [],\n      "answer": "",\n      "key_points": "答案解析",\n      "blanks": [{"blank_no": 1, "answer": "答案1"}, {"blank_no": 2, "answer": "答案2"}]\n    },\n    {\n      "type": "essay",\n      "content": "简答题题干",\n      "options": [],\n      "answer": "",\n      "key_points": "评分要点1\\n评分要点2\\n评分要点3",\n      "blanks": []\n    }\n  ]\n}

## 注意事项
1. 单选题和多选题必须有4个选项
2. 填空题用 ____ 表示空，blanks数组中的blank_no对应第几个空
3. 简答题的key_points是评分要点，用于AI阅卷
4. 确保 JSON 格式正确，可以被 JSON.parse 解析`;

  try {
    console.log('[AI Gen] 开始调用 AI 大模型生成题目...');
    const response = await callAIWithFallback(prompt, systemPrompt, 2048);
    console.log('[AI Gen] 原始响应前500字:', response.substring(0, 500));

    // 提取 JSON 部分
    let jsonStr = response;
    const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    } else {
      // 尝试提取最外层的大括号
      const braceMatch = response.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonStr = braceMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr);
    const questions = parsed.questions || [];

    console.log(`[AI Gen] AI 返回 ${questions.length} 道题目`);

    // 标准化题目格式，确保所有字段都存在
    return questions.map((q, idx) => {
      const type = q.type || 'single';
      const content = q.content || q.title || `题目 ${idx + 1}`;
      const options = q.options || [];
      const answer = q.answer || '';
      const key_points = q.key_points || q.keyPoints || q.analysis || '暂无解析';
      const blanks = q.blanks || [];
      
      // 确保填空题有 blanks
      if (type === 'fill' && blanks.length === 0) {
        // 尝试从 content 中提取 ____ 作为空
        const blankCount = (content.match(/____/g) || []).length;
        for (let i = 1; i <= blankCount; i++) {
          blanks.push({ blank_no: i, answer: '待填写' });
        }
      }
      
      return {
        type: type,
        content: content,
        options: options,
        answer: answer,
        key_points: key_points,
        blanks: blanks,
        source: text.substring(0, 200)
      };
    });
  } catch (err) {
    console.error('[AI Gen] 生成题目失败:', err.message);
    return [];
  }
}

// 基于现有题目生成变体题（相似题替换选项）
async function generateVariants(question, variantCount = 3) {
  if (!isAIAvailable()) {
    console.warn('[AI] API Key 未配置，无法使用变体生成');
    return [];
  }

  const systemPrompt = '你是一位资深的教育培训专家，擅长基于现有题目生成高质量的变体题。请严格按照用户要求的格式输出 JSON。';

  const typeLabel = question.type === 'single' ? '单选题' : question.type === 'multiple' ? '多选题' : question.type === 'fill' ? '填空题' : '简答题';
  
  let questionDesc = `题目类型：${typeLabel}\n题干：${question.content}\n`;
  if (question.options && question.options.length > 0) {
    questionDesc += `选项：\n${question.options.join('\n')}\n`;
  }
  questionDesc += `正确答案：${question.answer || '-'}\n`;
  if (question.key_points) {
    questionDesc += `解析/要点：${question.key_points}\n`;
  }
  if (question.blanks && question.blanks.length > 0) {
    questionDesc += `填空答案：${question.blanks.map(b => `空${b.blank_no}: ${b.answer}`).join(', ')}\n`;
  }

  const prompt = `请基于以下现有题目生成 ${variantCount} 道变体题。\n\n## 原题\n${questionDesc}\n\n## 变体要求\n1. 变体题必须与原题考查相同的知识点，但题干、选项或答案必须有所不同\n2. 对于选择题：可以更换题干表述方式，替换选项内容，确保正确答案不同（与原题答案不同）\n3. 对于填空题：可以改变题干，更换填空内容，确保答案不同\n4. 对于简答题：可以更换问法角度，确保考查点相同但答案组织方式不同\n5. 每道变体题都是独立的，可以单独使用\n6. 变体题的难度应与原题相近\n\n## 输出格式\n请严格按照以下 JSON 格式返回，不要添加任何其他文字说明：\n\n{\n  "variants": [\n    {\n      "type": "${question.type}",\n      "content": "变体题1题干",\n      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],\n      "answer": "A",\n      "key_points": "解析",\n      "blanks": []\n    }\n  ]\n}\n\n## 注意事项\n1. 变体题必须与原文考查相同知识点\n2. 选择题必须有4个选项\n3. 多选题答案用逗号分隔\n4. 填空题用 ____ 表示空\n5. 简答题的key_points是评分要点\n6. 确保 JSON 格式正确，可以被 JSON.parse 解析`;

  try {
    console.log('[AI Variant] 开始生成变体题...');
    const response = await callAIWithFallback(prompt, systemPrompt, 2048);
    console.log('[AI Variant] 原始响应前500字:', response.substring(0, 500));

    let jsonStr = response;
    const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    } else {
      const braceMatch = response.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonStr = braceMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr);
    let variants = parsed.variants || [];
    
    // 过滤掉 null/undefined/非对象元素
    variants = variants.filter(q => q && typeof q === 'object');

    console.log(`[AI Variant] AI 返回 ${variants.length} 道变体题`);

    return variants.map((q, idx) => {
      const type = q.type || question.type;
      const content = q.content || `变体题 ${idx + 1}`;
      const options = q.options || [];
      const answer = q.answer || '';
      const key_points = q.key_points || q.keyPoints || '暂无解析';
      const blanks = q.blanks || [];
      
      if (type === 'fill' && blanks.length === 0) {
        const blankCount = (content.match(/____/g) || []).length;
        for (let i = 1; i <= blankCount; i++) {
          blanks.push({ blank_no: i, answer: '待填写' });
        }
      }
      
      return {
        type: type,
        content: content,
        options: options,
        answer: answer,
        key_points: key_points,
        blanks: blanks,
        variant_of: question.id || null,
        source: 'variant'
      };
    });
  } catch (err) {
    console.error('[AI Variant] 生成变体题失败:', err.message);
    return [];
  }
}

// 基于文档内容更新题库中的题目（智能匹配并更新）
async function updateQuestionsFromDoc(text, existingQuestions) {
  if (!isAIAvailable()) {
    console.warn('[AI] API Key 未配置，无法使用智能更新');
    return { updated: [], added: [] };
  }

  // 限制现有题目数量，避免 token 过多
  const limitedQuestions = existingQuestions.slice(0, 10);
  
  const systemPrompt = '你是一位资深的教育培训专家，擅长根据最新材料评估和更新考试题库。请严格按照用户要求的格式输出 JSON。';

  // 构建现有题目描述
  let questionsDesc = '';
  for (let i = 0; i < limitedQuestions.length; i++) {
    const q = limitedQuestions[i];
    questionsDesc += `\n[题${i + 1}]ID:${q.id}类型:${q.type}\n题干:${q.title}\n`;
    if (q.options && q.options.length > 0) {
      questionsDesc += `选项:${q.options.join(' | ')}\n`;
    }
    questionsDesc += `答案:${q.answer || '-'}\n`;
  }

  const prompt = `根据最新材料评估现有题库，判断哪些题目需要更新，哪些知识点需要新增题目。

## 最新材料（前1500字）
${text.substring(0, 1500)}

## 现有题库（共${limitedQuestions.length}题）
${questionsDesc}

## 任务
1. 更新：题干表述过时、选项错误、答案与材料不一致的题目
2. 新增：材料中有但题库未覆盖的重要知识点
3. 只返回确实有变更的题目

## 输出格式（严格JSON，不要其他文字）
{
  "updated": [
    {
      "original_id": 1,
      "type": "single",
      "content": "更新后的题干",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "A",
      "key_points": "解析",
      "blanks": [],
      "update_reason": "原因"
    }
  ],
  "added": [
    {
      "type": "single",
      "content": "新题干",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "A",
      "key_points": "解析",
      "blanks": []
    }
  ]
}

注意事项：
- updated 中的 original_id 必须是现有题目ID
- 无需更新/新增时返回空数组
- 选择题必须有4个选项
- 确保JSON可解析`;

  try {
    console.log('[AI Update] 开始智能更新题库...');
    console.log('[AI Update] 文档字符数:', text.length, '现有题目数:', limitedQuestions.length, 'prompt估算字符数:', prompt.length);
    
    const response = await callAIWithFallback(prompt, systemPrompt, 2048);
    console.log('[AI Update] 原始响应前500字:', response.substring(0, 500));

    let jsonStr = response;
    const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    } else {
      const braceMatch = response.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonStr = braceMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr);
    let updated = parsed.updated || [];
    let added = parsed.added || [];
    
    // 过滤掉 null/undefined/非对象元素
    updated = updated.filter(q => q && typeof q === 'object');
    added = added.filter(q => q && typeof q === 'object');

    console.log(`[AI Update] AI 返回: 更新 ${updated.length} 题, 新增 ${added.length} 题`);

    // 标准化格式
    const normalize = (q, idx) => ({
      type: q.type || 'single',
      content: q.content || q.title || `题目 ${idx + 1}`,
      options: q.options || [],
      answer: q.answer || '',
      key_points: q.key_points || q.keyPoints || '暂无解析',
      blanks: q.blanks || [],
      original_id: q.original_id || null,
      update_reason: q.update_reason || '根据最新材料更新',
      source: 'update'
    });

    return {
      updated: updated.map(normalize),
      added: added.map(normalize)
    };
  } catch (err) {
    console.error('[AI Update] 智能更新失败:', err.message);
    return { updated: [], added: [] };
  }
}

module.exports = {
  isAIAvailable,
  gradeEssay,
  generateQuestions,
  generateVariants,
  updateQuestionsFromDoc
};
