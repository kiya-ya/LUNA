import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useExamStore = defineStore('exam', () => {
  // 状态
  const userName = ref('')
  const userPhone = ref('')
  const currentIndex = ref(0)
  const timeLeft = ref(0)
  const leaveCount = ref(0)
  const isSubmitted = ref(false)
  const isLoading = ref(false)
  const loadError = ref('')
  const examResult = ref(null)
  const examId = ref(1)
  const examName = ref('')
  const startTime = ref(null)
  const deviceId = ref('') // 设备指纹

  const questions = ref([])
  const userAnswers = ref({})

  // 计算属性
  const totalQuestions = computed(() => questions.value.length)
  const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
  const isFirst = computed(() => currentIndex.value === 0)
  const isLast = computed(() => currentIndex.value === questions.value.length - 1)
  const answeredCount = computed(() => Object.keys(userAnswers.value).filter(k => {
    const v = userAnswers.value[k]
    return v !== '' && v !== null && v !== undefined && (typeof v !== 'object' || Object.keys(v).length > 0)
  }).length)
  const unansweredCount = computed(() => totalQuestions.value - answeredCount.value)

  const timerText = computed(() => '不限时')

  const timerClass = computed(() => 'text-gray-500')

  const isWarning = computed(() => false)
  const isDanger = computed(() => false)

  // 清理选项文本中的重复前缀
  function cleanOption(opt, index) {
    if (!opt) return ''
    const letter = String.fromCharCode(65 + index) // A, B, C, D
    // 匹配开头的 A. 或 A 或 A: 等形式
    const regex = new RegExp(`^${letter}[.．:：\\s]*`)
    return opt.replace(regex, '').trim()
  }

  // API 调用
  async function fetchExamConfig(selectedExamId = null) {
    isLoading.value = true
    loadError.value = ''
    initDeviceId()
    try {
      let url = selectedExamId ? `/api/exam-config?exam_id=${selectedExamId}` : '/api/exam-config'
      // 课包考试闸门需要 uid；管理员测试模式跳过闸门
      const params = []
      if (userPhone.value) params.push(`uid=${encodeURIComponent(userPhone.value)}`)
      if (localStorage.getItem('exam_admin_test') === '1') params.push('admin_mode=1')
      if (params.length > 0) url += (url.includes('?') ? '&' : '?') + params.join('&')
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        // 转换后端数据格式为前端格式
        questions.value = data.data.questions.map(q => ({
          id: q.id,
          type: q.type === 'single' ? 'single' : q.type === 'multiple' ? 'multiple' : q.type === 'fill' ? 'fill' : 'essay',
          title: q.content,
          options: (q.options || []).map((opt, i) => cleanOption(opt, i)),
          answer: q.answer || '',
          keyPoints: q.keyPoints || '',
          blanks: q.blanks || []
        }))
        timeLeft.value = data.data.timeLimit || 0
        examId.value = data.data.exam_id || 1
        examName.value = data.data.exam_name || ''
        currentIndex.value = 0
        userAnswers.value = {}
        startTime.value = new Date().toISOString()
        localStorage.setItem('exam_start_time', startTime.value)
      } else {
        loadError.value = data.error || '加载失败'
      }
    } catch (err) {
      loadError.value = '网络错误：无法连接后端服务器，请确认后端已启动（node backend/server.js）'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  // 生成设备指纹（轻量方案，无需额外库）
  function generateDeviceId() {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('DeviceFingerprint', 2, 2)
      const canvasData = canvas.toDataURL()

      const features = [
        navigator.userAgent,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        navigator.language,
        new Date().getTimezoneOffset(),
        canvasData,
        !!window.localStorage,
        !!window.sessionStorage,
        navigator.hardwareConcurrency || '',
        navigator.platform || ''
      ].join('###')

      // 简单哈希
      let hash = 0
      for (let i = 0; i < features.length; i++) {
        const char = features.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return 'fp_' + Math.abs(hash).toString(16)
    } catch (e) {
      console.error('生成设备指纹失败', e)
      return 'fp_unknown_' + Math.random().toString(36).slice(2)
    }
  }

  // 初始化设备指纹
  function initDeviceId() {
    if (!deviceId.value) {
      // 尝试从 localStorage 读取（同一浏览器保持一致）
      const saved = localStorage.getItem('exam_device_id')
      if (saved) {
        deviceId.value = saved
      } else {
        deviceId.value = generateDeviceId()
        localStorage.setItem('exam_device_id', deviceId.value)
      }
    }
  }

  function setUserInfo(name, phone) {
    userName.value = name
    userPhone.value = phone
    initDeviceId()
  }

  function selectAnswer(index, answer) {
    userAnswers.value[index] = answer
    saveToStorage()
  }

  function goTo(index) {
    // 保存当前简答题/填空题
    if (currentQuestion.value) {
      const q = currentQuestion.value
      if (q.type === 'essay') {
        const textarea = document.getElementById('textAnswer')
        if (textarea) {
          userAnswers.value[currentIndex.value] = textarea.value
        }
      } else if (q.type === 'fill') {
        // 填空题答案已在组件中实时保存
      }
    }
    currentIndex.value = index
  }

  function goPrev() {
    if (!isFirst.value) goTo(currentIndex.value - 1)
  }

  function goNext() {
    if (!isLast.value) goTo(currentIndex.value + 1)
  }

  function tick() {
    // 不再倒计时，考试时间由管理员手动截止
  }

  function addLeave() {
    leaveCount.value++
  }

  async function submit() {
    // 保存当前题目答案
    if (currentQuestion.value) {
      const q = currentQuestion.value
      if (q.type === 'essay') {
        const textarea = document.getElementById('textAnswer')
        if (textarea) {
          userAnswers.value[currentIndex.value] = textarea.value
        }
      }
    }

    isSubmitted.value = true

    // 构建答案映射（用题目ID而不是索引）
    const answers = {}
    questions.value.forEach((q, idx) => {
      answers[q.id] = userAnswers.value[idx] || ''
    })

    // 检查是否是管理员测试模式
    const isAdminTest = localStorage.getItem('exam_admin_test') === '1'

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName.value,
          userUid: userPhone.value,
          examId: examId.value,
          startTime: startTime.value,
          deviceId: deviceId.value,
          admin_mode: isAdminTest,
          answers
        })
      })
      const data = await res.json()
      if (data.success) {
        examResult.value = data.data
        // 保存完整结果到 localStorage（防止刷新后数据丢失）
        localStorage.setItem('exam_result_full', JSON.stringify(data.data))
      }
    } catch (err) {
      console.error('提交失败', err)
    }

    // 保存到 localStorage
    localStorage.setItem('exam_result', JSON.stringify({
      userName: userName.value,
      userPhone: userPhone.value,
      answers: userAnswers.value,
      timeUsed: 0,
      questions: questions.value.map(q => ({ id: q.id, title: q.title, type: q.type }))
    }))
  }

  function saveToStorage() {
    localStorage.setItem('exam_answers', JSON.stringify(userAnswers.value))
    localStorage.setItem('exam_questions', JSON.stringify(questions.value))
  }

  function loadFromStorage() {
    const savedAnswers = localStorage.getItem('exam_answers')
    if (savedAnswers) {
      try { userAnswers.value = JSON.parse(savedAnswers) } catch (e) {}
    }
    const savedQuestions = localStorage.getItem('exam_questions')
    if (savedQuestions) {
      try { questions.value = JSON.parse(savedQuestions) } catch (e) {}
    }
  }

  // AI 评分（本地备用）
  function aiGrade(answer, keyPoints) {
    if (!answer || !keyPoints) return 1
    const text = answer.toLowerCase()
    const points = keyPoints.toLowerCase().split(/[,，、\s]+/).filter(p => p.length > 1)
    if (points.length === 0) return 3
    const covered = points.filter(p => text.includes(p)).length
    const ratio = covered / points.length
    if (ratio >= 1.0) return 5
    if (ratio >= 0.7) return 4
    if (ratio >= 0.4) return 3
    if (ratio >= 0.2) return 2
    return 1
  }

  // 计算总分（本地备用，满分100）
  function calculateScore() {
    let total = 0
    questions.value.forEach((q, i) => {
      const ans = userAnswers.value[i]
      if (!ans) return
      if (q.type === 'single' || q.type === 'multiple') {
        if (ans === q.answer) total += 5
      } else if (q.type === 'fill') {
        total += 5
      } else {
        total += aiGrade(ans, q.keyPoints)
      }
    })
    return total
  }

  return {
    userName, userPhone, currentIndex, timeLeft, leaveCount, isSubmitted,
    isLoading, loadError, examResult, examId, examName, startTime, deviceId,
    questions, userAnswers,
    totalQuestions, currentQuestion, isFirst, isLast, answeredCount, unansweredCount,
    timerText, timerClass, isWarning, isDanger,
    fetchExamConfig, setUserInfo, selectAnswer, goTo, goPrev, goNext, tick, addLeave, submit,
    initDeviceId, generateDeviceId, saveToStorage, loadFromStorage, aiGrade, calculateScore
  }
})
