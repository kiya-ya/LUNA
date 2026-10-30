<template> <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-animated"> <!-- 动态背景光晕 --> <div class="absolute inset-0 overflow-hidden pointer-events-none"> <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 animate-pulse-slow" style="background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);"></div> <div class="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-20 animate-pulse-slow" style="background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%); animation-delay: 2s;"></div> <div class="absolute top-1/2 left-1/2 w-64 h-64 rounded-full opacity-15 animate-pulse-slow" style="background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%); animation-delay: 4s;"></div> </div> <div class="w-full max-w-[440px] relative z-10"> <!-- 主卡片 --> <div class="glass-card rounded-[2rem] p-6 md:p-8 shadow-2xl"> <!-- 星星评分区域（取代原来的考试完成标题） --> <div class="text-center mb-6"> <!-- 满分皇冠 --> <div v-if="isPerfect" class="mb-3"> <div class="crown-anim text-5xl mb-2"></div> <div class="text-sm font-bold text-yellow-500 crown-anim" style="animation-delay: 0.2s;">满分达成！</div> </div> <!-- 星星 --> <div class="flex items-center justify-center gap-3 mb-4"> <div
              v-for="n in 3" :key="n"
              class="star-item"
              :class="{
                'star-filled': n <= starCount,
                'star-empty': n > starCount,
                'star-pop': starAnimReady
              }"
              :style="{ animationDelay: (n * 0.2) + 's' }"
            > <span class="text-4xl">{{ n <= starCount ? '●' : '○' }}</span> </div> </div> <!-- 评级文字 --> <div class="star-text" :class="{ 'star-pop': starAnimReady }" style="animation-delay: 0.8s;"> <h1 class="text-2xl font-bold mb-1" :style="{ color: gradeColor }">
              {{ gradeTitle }}
            </h1> <p class="text-sm" style="color: #333333;">{{ gradeSubtitle }}</p> </div> </div> <!-- 分数大字 --> <div class="text-center mb-6"> <div class="text-6xl font-bold mb-1" style="color: #8E6BC8; text-shadow: 0 2px 8px rgba(142,107,200,0.3);">{{ examScore }}</div> <div class="text-sm mb-2" style="color: #333333;">满分 {{ examMaxScore }} 分</div> </div> <!-- 统计信息 --> <div class="grid grid-cols-3 gap-3 mb-6"> <div class="rounded-2xl p-3 text-center" style="background: rgba(142,107,200,0.08);"> <div class="text-xl font-bold" style="color: #8E6BC8;">{{ correctCount }}</div> <div class="text-xs" style="color: #444444;">正确</div> </div> <div class="rounded-2xl p-3 text-center" style="background: rgba(255,59,48,0.08);"> <div class="text-xl font-bold" style="color: #FF3B30;">{{ totalQuestions - correctCount }}</div> <div class="text-xs" style="color: #444444;">错误</div> </div> <div class="rounded-2xl p-3 text-center" style="background: rgba(0,122,255,0.08);"> <div class="text-xl font-bold" style="color: #007AFF;">{{ timeUsed }}</div> <div class="text-xs" style="color: #444444;">用时</div> </div> </div> <!-- 用时详情 --> <div class="rounded-2xl p-4 mb-6" style="background: rgba(245, 245, 245, 0.95); border: 1px solid rgba(0,0,0,0.05);"> <div class="flex items-center justify-between mb-2"> <span class="text-sm font-medium" style="color: #1a1a2e;"> 答题用时</span> <span class="text-sm font-bold" style="color: #8E6BC8;">{{ timeUsed }}</span> </div> <div class="w-full h-2 rounded-full overflow-hidden" style="background: rgba(142,107,200,0.15);"> <div class="h-full rounded-full transition-all duration-500" :style="{ width: timePercent + '%', background: 'linear-gradient(90deg, #8E6BC8, #7451A8)' }"></div> </div> <div class="flex justify-between mt-1"> <span class="text-xs" style="color: #444444;">开始: {{ startTimeStr }}</span> <span class="text-xs" style="color: #444444;">结束: {{ endTimeStr }}</span> </div> </div> <!-- 答题明细 --> <div class="rounded-2xl overflow-hidden mb-6" style="background: rgba(245, 245, 245, 0.95); border: 1px solid rgba(0,0,0,0.05);"> <button @click="showDetail = !showDetail" class="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-white/30 transition-colors"> <span class="flex items-center gap-2 font-medium" style="color: #1a1a2e;"> <span></span> 查看答题明细
            </span> <svg :class="showDetail ? 'rotate-180' : ''" class="w-4 h-4 transform transition-transform" style="color: #444444;" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path> </svg> </button> <div v-show="showDetail" class="px-4 pb-4"> <div v-for="(q, i) in detail" :key="i" class="py-3 border-b last:border-0" style="border-color: rgba(0,0,0,0.05);"> <div class="flex items-start gap-2"> <span class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  :class="q.statusClass === 'text-success' ? 'bg-success/10 text-success' : (q.statusClass === 'text-warning' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger')">
                  {{ i + 1 }}
                </span> <div class="flex-1 min-w-0"> <div class="flex items-center justify-between mb-1"> <p class="text-sm font-bold" style="color: #1a1a2e;">{{ q.title }}</p> <span class="text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ml-2"
                      :class="q.score === q.maxScore ? 'bg-success/10 text-success' : (q.score > 0 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger')"
                      style="border: 1px solid currentColor;">
                      {{ q.score !== undefined ? q.score : '?' }}/{{ q.maxScore !== undefined ? q.maxScore : '?' }}分
                    </span> </div> <p class="text-xs" :class="q.statusClass"> <span class="font-bold">{{ q.statusText }}</span> <span v-if="q.userAnswer && q.type !== 'essay'" class="ml-1">{{ formatAnswer(q.userAnswer) }}</span> <span v-else-if="!q.userAnswer">未作答</span> </p> <!-- 简答题：显示你的答案、遗漏要点、答案解析 --> <template v-if="q.type === 'essay'"> <p v-if="q.userAnswer" class="text-xs mt-1" style="color: #444444;"> <span class="font-bold" style="color: #1a1a2e;"> 你的答案：</span> <span class="whitespace-pre-wrap">{{ q.userAnswer }}</span> </p> <p v-if="q.aiGrade && q.aiGrade.ai_missed && q.aiGrade.ai_missed.length > 0" class="text-xs mt-1" style="color: #CC4444;"> <span class="font-bold"> 遗漏要点：</span> <span>{{ q.aiGrade.ai_missed.join('、') }}</span> </p> <p v-if="q.keyPoints && q.keyPoints.length > 0" class="text-xs mt-1" style="color: #444444;"> <span class="font-bold" style="color: #B8860B;"> 答案解析：</span> <span class="whitespace-pre-wrap">{{ q.keyPoints }}</span> </p> </template> <!-- 非简答题：显示正确答案和反馈 --> <template v-else> <p v-if="!q.isCorrect && q.correctAnswer" class="text-xs mt-1" style="color: #444444;">
                       正确答案：{{ formatCorrectAnswer(q.correctAnswer) }}
                    </p> <p v-if="q.feedback" class="text-xs mt-1" style="color: #444444;">
                       {{ q.feedback }}
                    </p> </template> <!-- 简答题 AI 评分反馈（仅保留反馈文字，匹配/遗漏已单独显示） --> <div v-if="q.type === 'essay' && q.aiGrade && q.aiGrade.ai_feedback" class="mt-2 p-2 rounded-lg" style="background: rgba(100,200,255,0.15); border: 1px solid rgba(100,200,255,0.3);"> <p class="text-xs font-bold mb-1" style="color: #0066CC;"> AI 评分反馈：</p> <p class="text-xs" style="color: #1a1a2e;">{{ q.aiGrade.ai_feedback }}</p> <div v-if="q.aiGrade.ai_matched && q.aiGrade.ai_matched.length > 0" class="mt-1"> <p class="text-xs" style="color: #228B22;"> 匹配要点：</p> <p class="text-xs pl-2" style="color: #1a1a2e;">{{ q.aiGrade.ai_matched.join('、') }}</p> </div> </div> <!-- 非简答题的答案解析 --> <div v-if="q.type !== 'essay' && q.keyPoints && q.keyPoints.length > 0" class="mt-2 p-2 rounded-lg" style="background: rgba(245,179,1,0.15); border: 1px solid rgba(245,179,1,0.3);"> <p class="text-xs font-bold mb-1" style="color: #B8860B;"> 答案解析：</p> <p class="text-xs whitespace-pre-wrap" style="color: #1a1a2e;">{{ q.keyPoints }}</p> </div> </div> </div> </div> </div> </div> <!-- 按钮 --> <button
          @click="goHome"
          class="w-full h-12 rounded-xl font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
          style="background: linear-gradient(135deg, #8E6BC8, #7451A8);"
        > <span class="flex items-center justify-center gap-2"> <span></span> <span>查看成绩与申请资质</span> </span> </button> </div> <!-- 底部文字 --> <div class="mt-6 text-center"> <p class="text-xs text-white/60">点点开黑 · 姐姐团考核系统</p> <p class="text-xs text-white/40 mt-1">design by Lu deng</p> </div> </div> </div>
</template> <script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExamStore } from '../stores/exam.js'

const router = useRouter()
const store = useExamStore()
const showDetail = ref(false)
const starAnimReady = ref(false)

onMounted(() => {
  // 延迟触发动画，确保元素已渲染
  setTimeout(() => { starAnimReady.value = true }, 100)

  // 从 localStorage 恢复考试结果（防止刷新后数据丢失）
  const storedFull = localStorage.getItem('exam_result_full')
  if (storedFull && !store.examResult) {
    try {
      store.examResult = JSON.parse(storedFull)
    } catch (e) {
      console.warn('恢复考试结果失败', e)
    }
  }
})

const isAdmin = computed(() => {
  return location.search.includes('admin=1') || localStorage.getItem('exam_admin') === '1'
})

const examScore = computed(() => store.examResult?.total_score ?? store.calculateScore())
const examMaxScore = computed(() => store.examResult?.max_score ?? 100)
const examPercentage = computed(() => {
  const max = examMaxScore.value
  return max > 0 ? Math.round((examScore.value / max) * 100) : 0
})
const totalQuestions = computed(() => store.questions.length)

// 满分检测
const isPerfect = computed(() => examPercentage.value === 100)

// 星级评分逻辑
const starCount = computed(() => {
  const p = examPercentage.value
  if (p >= 60) return 3
  if (p >= 40) return 2
  return 1
})

const gradeTitle = computed(() => {
  const p = examPercentage.value
  if (p === 100) return '完美通关！'
  if (p >= 60) return '考试完成！'
  if (p >= 40) return '再接再厉！'
  return '继续加油！'
})

const gradeSubtitle = computed(() => {
  const p = examPercentage.value
  if (p === 100) return '你太棒了！全部答对！'
  if (p >= 60) return '恭喜你完成了本次考核'
  if (p >= 40) return '还有进步空间，继续加油'
  return '不要气馁，下次一定更好'
})

const gradeColor = computed(() => {
  const p = examPercentage.value
  if (p === 100) return '#F5B301'
  if (p >= 60) return '#1a1a2e'
  if (p >= 40) return '#A88BD8'
  return '#FF3B30'
})

const correctCount = computed(() => {
  return store.questions.filter((q, i) => {
    const ans = store.userAnswers[i]
    if (!ans) return false
    if (q.type === 'single' || q.type === 'multiple') return ans === q.answer
    if (q.type === 'fill') return true
    return store.aiGrade(ans, q.keyPoints) >= 3
  }).length
})

// 实际用时计算
const timeUsed = computed(() => {
  const start = store.examResult?.start_time || store.startTime || localStorage.getItem('exam_start_time')
  const end = store.examResult?.end_time || Date.now()

  let usedSeconds = 0
  if (start) {
    const startTime = new Date(start).getTime()
    const endTime = typeof end === 'string' ? new Date(end).getTime() : end
    usedSeconds = Math.max(0, Math.floor((endTime - startTime) / 1000))
  } else {
    const limit = store.examResult?.time_limit || 30
    usedSeconds = limit * 60 - store.timeLeft
  }

  if (usedSeconds < 60) return usedSeconds + '秒'
  const minutes = Math.floor(usedSeconds / 60)
  const seconds = usedSeconds % 60
  if (seconds === 0) return minutes + '分钟'
  return minutes + '分' + seconds + '秒'
})

const timePercent = computed(() => {
  const start = store.examResult?.start_time || store.startTime || localStorage.getItem('exam_start_time')
  if (!start) return 50
  const startTime = new Date(start).getTime()
  const endTime = store.examResult?.end_time ? new Date(store.examResult.end_time).getTime() : Date.now()
  const usedSeconds = Math.floor((endTime - startTime) / 1000)
  const limit = (store.examResult?.time_limit || 30) * 60
  return limit > 0 ? Math.min(100, Math.round((usedSeconds / limit) * 100)) : 50
})

const startTimeStr = computed(() => {
  const start = store.examResult?.start_time || store.startTime || localStorage.getItem('exam_start_time')
  if (!start) return '--:--'
  const d = new Date(start)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})

const endTimeStr = computed(() => {
  const end = store.examResult?.end_time
  if (end) {
    const d = new Date(end)
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})

function formatAnswer(ans) {
  if (typeof ans === 'object' && ans !== null) {
    return Object.entries(ans).map(([k, v]) => `空${k}:${v}`).join(' ')
  }
  return String(ans)
}

function formatCorrectAnswer(ans) {
  if (Array.isArray(ans)) {
    return ans.join(' / ')
  }
  return String(ans)
}

const detail = computed(() => {
  // 优先使用后端返回的 details（包含完整评分和AI阅卷结果）
  if (store.examResult?.details && store.examResult.details.length > 0) {
    return store.examResult.details.map((d, i) => {
      // 简答题状态：根据得分比例显示不同状态
      let statusText = ''
      let statusClass = ''
      if (d.type === 'essay') {
        if (d.score === 0) {
          statusText = '回答错误'
          statusClass = 'text-danger'
        } else if (d.score >= d.max_score) {
          statusText = '回答正确'
          statusClass = 'text-success'
        } else {
          statusText = '部分正确'
          statusClass = 'text-warning'
        }
      } else {
        // 单选/多选/填空：只有对或错
        if (d.score >= d.max_score) {
          statusText = '回答正确'
          statusClass = 'text-success'
        } else {
          statusText = '回答错误'
          statusClass = 'text-danger'
        }
      }

      return {
        title: d.title || d.content || `题目 ${d.q_id}`,
        type: d.type,
        userAnswer: d.user_answer,
        correctAnswer: d.correct_answer,
        score: d.score,
        maxScore: d.max_score,
        feedback: d.feedback,
        keyPoints: d.key_points || '',
        isCorrect: d.score >= d.max_score,
        statusText,
        statusClass,
        aiGrade: d.ai_grade || null
      }
    })
  }

  // 备用：从 store.questions 和 store.userAnswers 构建
  return store.questions.map((q, i) => {
    const ans = store.userAnswers[i] || ''
    let isCorrect = false
    let score = 0
    let correctAnswer = ''
    let statusText = ''
    let statusClass = ''
    const maxScore = q.score || 5

    if (q.type === 'single' || q.type === 'multiple') {
      isCorrect = ans === q.answer
      score = isCorrect ? maxScore : 0
      correctAnswer = q.answer
      statusText = isCorrect ? '回答正确' : '回答错误'
      statusClass = isCorrect ? 'text-success' : 'text-danger'
    } else if (q.type === 'fill') {
      isCorrect = true
      score = maxScore
      correctAnswer = q.blanks?.map(b => b.answer).join(' / ') || ''
      statusText = '回答正确'
      statusClass = 'text-success'
    } else {
      // 简答题：根据得分比例显示状态
      score = store.aiGrade(ans, q.keyPoints)
      if (score >= maxScore) {
        score = maxScore
        isCorrect = true
        statusText = '回答正确'
        statusClass = 'text-success'
      } else if (score >= maxScore * 0.4) {
        isCorrect = false
        statusText = '部分正确'
        statusClass = 'text-warning'
      } else {
        isCorrect = false
        statusText = '回答错误'
        statusClass = 'text-danger'
      }
      correctAnswer = q.keyPoints
    }

    return {
      title: q.title,
      type: q.type,
      userAnswer: ans,
      correctAnswer,
      score,
      maxScore,
      feedback: '',
      keyPoints: q.keyPoints || '',
      isCorrect,
      statusText,
      statusClass,
      aiGrade: null
    }
  })
})

function goHome() {
  router.push('/mine')
}
</script> <style scoped>
/* 动态渐变背景 */
.bg-animated {
  background: linear-gradient(-45deg, #8E6BC8, #A88BD8, #C9A7EB, #F48A8A, #F5B301);
  background-size: 300% 300%;
  animation: gradient-flow 6s ease infinite;
}
@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  25% { background-position: 50% 100%; }
  50% { background-position: 100% 50%; }
  75% { background-position: 50% 0%; }
  100% { background-position: 0% 50%; }
}

/* 光晕动画 */
@keyframes pulse-slow {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(1.15); }
}
.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}

/* 星星动画 */
.star-item {
  display: inline-block;
  opacity: 0;
  transform: scale(0) rotate(-30deg);
  transition: transform 0.3s ease;
}
.star-item.star-pop {
  animation: star-pop-in 0.6s ease forwards;
}
.star-filled {
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
}
.star-empty {
  color: #cccccc;
  opacity: 1;
}
@keyframes star-pop-in {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-30deg) translateY(20px);
  }
  50% {
    opacity: 1;
    transform: scale(1.3) rotate(10deg) translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg) translateY(0);
  }
}

/* 文字动画 */
.star-text {
  opacity: 0;
  transform: translateY(10px);
}
.star-text.star-pop {
  animation: text-fade-in 0.5s ease forwards;
}
@keyframes text-fade-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 皇冠动画 */
.crown-anim {
  opacity: 0;
  transform: scale(0) translateY(10px);
}
.crown-anim.star-pop {
  animation: crown-bounce 0.7s ease forwards;
}
@keyframes crown-bounce {
  0% { opacity: 0; transform: scale(0) translateY(20px); }
  40% { opacity: 1; transform: scale(1.3) translateY(-10px); }
  70% { transform: scale(0.9) translateY(5px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* 玻璃拟态卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.70);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
}
.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 40%,
    rgba(255, 255, 255, 0) 100%
  );
  border-radius: inherit;
  pointer-events: none;
}

/* 安全区域适配 */
@supports (padding: max(0px)) {
  .bg-animated {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
}
</style>