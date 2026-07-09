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

// 调用 AI 大模型
async function callAI(prompt, model = MODEL_PRIMARY, systemPrompt = null, maxTokens = 1024) {
  if (!API_KEY) {
    throw new Error('AI API Key 未配置');
  }

  const defaultSystem = '你是一个专业的考试阅卷助手。请根据题目、用户答案和评分要点，给出公正的评分。严格按照满分范围评分，不要超出。';
  
  const requestBody = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt || defaultSystem },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: maxTokens
  };

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    throw new Error('AI 返回格式错误');
  } catch (err) {
    console.error(`[AI] ${model} 调用失败:`, err.message);
    throw err;
  }
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
2. 如果用户答案完全未提及评分要点，请给 0 分
3. 如果用户答案部分正确，请给出适当分数（不要非 0 即满分）`;

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

// 本地简答题评分（关键词匹配）
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

  let score;
  if (coverage >= 1) score = maxScore;
  else if (coverage >= 0.7) score = Math.round(maxScore * 0.8);
  else if (coverage >= 0.4) score = Math.round(maxScore * 0.6);
  else if (coverage >= 0.2) score = Math.round(maxScore * 0.4);
  else score = Math.round(maxScore * 0.2);

  return {
    score,
    feedback: `关键词覆盖率：${Math.round(coverage * 100)}%`,
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

module.exports = {
  isAIAvailable,
  gradeEssay,
  generateQuestions
};
