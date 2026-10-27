<template>
  <div class="min-h-screen relative overflow-hidden" style="background: linear-gradient(135deg, #FF7B35 0%, #FF9A5A 40%, #FFC87A 100%);">
    <!-- 背景装饰（静态） -->
    <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-300/20 blur-3xl"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-300/20 blur-3xl"></div>
    
    <!-- 顶部固定栏（带安全区域） -->
    <header class="fixed top-0 left-0 right-0 z-50 safe-area-top">
      <div class="glass-header max-w-3xl mx-auto px-4 pt-safe-top pb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-white/90">第 {{ store.currentIndex + 1 }}/{{ store.totalQuestions }} 题</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-white/70">已答 <span class="font-bold text-white">{{ store.answeredCount }}</span> 题</span>
        </div>
      </div>
      <!-- 进度条 -->
      <div class="h-1 bg-white/10 max-w-3xl mx-auto">
        <div class="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" :style="{ width: ((store.currentIndex + 1) / store.totalQuestions * 100) + '%' }"></div>
      </div>
    </header>

    <!-- 主体内容区（键盘弹起时动态调整） -->
    <main class="max-w-3xl mx-auto px-4 pt-safe-header pb-safe-bottom" :style="{ paddingBottom: keyboardHeight > 0 ? '20px' : '2rem' }">
      <div class="glass-card-exam rounded-3xl p-5 md:p-6 relative z-10" v-if="store.currentQuestion" :key="store.currentQuestion.id">
        
        <!-- 题号 + 题型标签 + 分值（第一行） -->
        <div class="flex items-center gap-2 mb-3">
          <span class="w-10 h-10 bg-gradient-to-br from-primary to-secondary text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shrink-0">{{ store.currentIndex + 1 }}</span>
          <span class="px-3 py-1.5 bg-orange-100 text-primary text-xs font-bold rounded-full shrink-0">
            {{ typeLabel }}
          </span>
          <span class="px-3 py-1.5 bg-yellow-100 text-orange-600 text-xs font-bold rounded-full shrink-0">
            {{ store.currentQuestion.score || 5 }} 分
          </span>
        </div>

        <!-- 导航按钮（第二行） -->
        <div class="flex items-center justify-between gap-2 mb-4">
          <button 
            @click="goPrev"
            :disabled="store.isFirst"
            class="h-10 px-3 bg-white/90 hover:bg-white disabled:opacity-30 disabled:pointer-events-none text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border border-gray-200/80 shadow-sm touch-target"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            <span class="hidden sm:inline">上一题</span>
          </button>
          <button 
            v-if="!store.isLast"
            @click="goNext"
            class="h-10 px-3 bg-white/90 hover:bg-white text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border border-gray-200/80 shadow-sm touch-target"
          >
            <span class="hidden sm:inline">下一题</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
          <button 
            v-else
            @click="confirmSubmit"
            class="h-10 px-4 bg-success hover:bg-success/90 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 border border-success/50 shadow-sm touch-target"
          >
            <span>交卷</span>
          </button>
        </div>

        <!-- 题干 -->
        <h2 class="text-lg md:text-xl font-bold text-gray-900 leading-relaxed mb-5">
          {{ store.currentQuestion.title }}
        </h2>

        <!-- 单选题选项区 -->
        <div v-if="store.currentQuestion.type === 'single'" class="space-y-3">
          <div 
            v-for="(opt, i) in store.currentQuestion.options" 
            :key="'s-' + store.currentQuestion.id + '-' + i"
            @click="selectOption(String.fromCharCode(65 + i))"
            class="option-glass w-full p-4 md:p-5 border-2 rounded-2xl cursor-pointer flex items-center gap-3 transition-all duration-200 hover:bg-white hover:border-gray-300 touch-target"
            :class="store.userAnswers[store.currentIndex] === String.fromCharCode(65 + i) ? 'border-primary bg-primary/10 shadow-md' : 'border-gray-200 bg-white/70'"
          >
            <span 
              class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all"
              :class="store.userAnswers[store.currentIndex] === String.fromCharCode(65 + i) ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-md' : 'bg-gray-100 text-gray-600'"
            >
              {{ String.fromCharCode(65 + i) }}
            </span>
            <span class="text-base md:text-lg text-gray-800 leading-relaxed">{{ opt }}</span>
          </div>
        </div>

        <!-- 多选题选项区 -->
        <div v-else-if="store.currentQuestion.type === 'multiple'" class="space-y-3">
          <div 
            v-for="(opt, i) in store.currentQuestion.options" 
            :key="'m-' + store.currentQuestion.id + '-' + i"
            @click="toggleMultipleOption(String.fromCharCode(65 + i))"
            class="option-glass w-full p-4 md:p-5 border-2 rounded-2xl cursor-pointer flex items-center gap-3 transition-all duration-200 hover:bg-white hover:border-gray-300 touch-target"
            :class="isMultipleSelected(String.fromCharCode(65 + i)) ? 'border-primary bg-primary/10 shadow-md' : 'border-gray-200 bg-white/70'"
          >
            <span 
              class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all"
              :class="isMultipleSelected(String.fromCharCode(65 + i)) ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-md' : 'bg-gray-100 text-gray-600'"
            >
              {{ isMultipleSelected(String.fromCharCode(65 + i)) ? '✓' : String.fromCharCode(65 + i) }}
            </span>
            <span class="text-base md:text-lg text-gray-800 leading-relaxed">{{ opt }}</span>
          </div>
        </div>

        <!-- 填空题输入区 -->
        <div v-else-if="store.currentQuestion.type === 'fill'" class="space-y-4">
          <div v-for="blank in store.currentQuestion.blanks" :key="'f-' + store.currentQuestion.id + '-' + blank.blank_no" class="flex items-center gap-3">
            <span class="text-sm font-bold text-gray-700 shrink-0">空{{ blank.blank_no }}:</span>
            <input
              v-model="fillAnswers[blank.blank_no]"
              @input="onFillInput"
              @focus="onInputFocus"
              @blur="onInputBlur"
              type="text"
              :placeholder="`请输入第${blank.blank_no}空答案`"
              class="flex-1 h-12 px-4 text-base border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        <!-- 简答题输入区 -->
        <div v-else-if="store.currentQuestion.type === 'essay'">
          <textarea 
            v-model="textAnswer"
            @input="onTextInput"
            @focus="onInputFocus"
            @blur="onInputBlur"
            placeholder="请在此输入你的答案..."
            :style="{ height: keyboardHeight > 0 ? '120px' : '160px' }"
            class="w-full p-4 text-base border-2 border-gray-200 rounded-2xl resize-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white text-gray-900 placeholder-gray-400"
          ></textarea>
          <p class="text-xs text-gray-400 mt-2 text-right">已输入 {{ textCount }} 字</p>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-else-if="store.isLoading" class="glass-card-exam rounded-3xl p-8 text-center relative z-10">
        <div class="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-white/80">正在加载题目...</p>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="store.loadError" class="glass-card-exam rounded-3xl p-8 text-center relative z-10">
        <p class="text-gray-800 mb-4">{{ store.loadError }}</p>
        <button @click="store.fetchExamConfig()" class="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl transition-all">重试</button>
      </div>
    </main>

    <!-- 底部题号导航 -->
    <div class="max-w-3xl mx-auto px-4 mb-4 safe-area-bottom">
      <div class="glass-nav p-3 rounded-2xl">
        <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          <button 
            v-for="i in store.totalQuestions" 
            :key="'nav-' + i"
            @click="goToQuestion(i - 1)"
            class="w-10 h-10 rounded-xl text-sm font-bold flex-shrink-0 flex items-center justify-center transition-all border border-transparent touch-target"
            :class="navClass(i - 1)"
          >
            {{ i }}
          </button>
        </div>
      </div>
    </div>

    <!-- 切屏警告弹窗 -->
    <div v-if="showLeaveWarning" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div class="glass-modal rounded-3xl p-6 max-w-sm w-full text-center relative z-10">
        <div class="w-14 h-14 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">⚠️</span>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">切屏警告</h3>
        <p class="text-gray-600 mb-4">你已离开考试页面 <span class="font-bold text-warning">{{ store.leaveCount }}</span> 次</p>
        <p class="text-sm text-gray-500 mb-4">累计 5 次将强制交卷，请专注答题。</p>
        <button @click="showLeaveWarning = false" class="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl">我知道了</button>
      </div>
    </div>

    <!-- 提交确认弹窗 -->
    <div v-if="showSubmitConfirm" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div class="glass-modal rounded-3xl p-6 max-w-sm w-full relative z-10">
        <h3 class="text-lg font-bold text-gray-900 mb-2 text-center">确认交卷？</h3>
        <p class="text-gray-600 text-center mb-2">你还有 <span class="font-bold text-warning">{{ store.unansweredCount }}</span> 题未作答</p>
        <p class="text-sm text-gray-500 text-center mb-6">未作答题目将按 0 分计算</p>
        <div class="flex gap-3">
          <button @click="showSubmitConfirm = false" class="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all">继续答题</button>
          <button @click="submitExam" class="flex-1 h-12 bg-gradient-to-r from-success to-secondary text-white font-bold rounded-2xl transition-all">确认交卷</button>
        </div>
      </div>
    </div>

    <!-- 正在阅卷中弹窗 -->
    <div v-if="showGradingLoading" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div class="glass-modal rounded-3xl p-8 max-w-sm w-full text-center relative z-10">
        <div class="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span class="text-3xl">📝</span>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">正在阅卷中...</h3>
        <p class="text-gray-600 text-sm mb-4">AI 正在批改您的简答题，请稍候</p>
        <div class="flex justify-center">
          <div class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExamStore } from '../stores/exam.js'

const router = useRouter()
const store = useExamStore()

const textAnswer = ref('')
const textCount = ref(0)
const fillAnswers = ref({})
const showLeaveWarning = ref(false)
const showSubmitConfirm = ref(false)
const showGradingLoading = ref(false)
const keyboardHeight = ref(0)

// 题型标签
const typeLabel = computed(() => {
  const t = store.currentQuestion?.type
  if (t === 'single') return '单选题'
  if (t === 'multiple') return '多选题'
  if (t === 'fill') return '填空题'
  if (t === 'essay') return '简答题'
  return '题目'
})

// 简答题输入
function onTextInput() {
  textCount.value = textAnswer.value.length
  store.selectAnswer(store.currentIndex, textAnswer.value)
}

// 单选
function selectOption(letter) {
  store.selectAnswer(store.currentIndex, letter)
}

// 多选
function isMultipleSelected(letter) {
  const ans = store.userAnswers[store.currentIndex]
  if (!ans) return false
  const arr = String(ans).toUpperCase().split('')
  return arr.includes(letter)
}

function toggleMultipleOption(letter) {
  let current = String(store.userAnswers[store.currentIndex] || '')
  const arr = current.split('')
  const idx = arr.indexOf(letter)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push(letter)
  }
  arr.sort()
  store.selectAnswer(store.currentIndex, arr.join(''))
}

// 填空题
function onFillInput() {
  store.selectAnswer(store.currentIndex, { ...fillAnswers.value })
}

// 导航
function goToQuestion(index) {
  saveCurrentAnswer()
  store.goTo(index)
  loadCurrentAnswer()
}

function goPrev() {
  saveCurrentAnswer()
  store.goPrev()
  loadCurrentAnswer()
}

function goNext() {
  saveCurrentAnswer()
  store.goNext()
  loadCurrentAnswer()
}

function saveCurrentAnswer() {
  if (!store.currentQuestion) return
  const t = store.currentQuestion.type
  if (t === 'essay') {
    store.selectAnswer(store.currentIndex, textAnswer.value)
  } else if (t === 'fill') {
    store.selectAnswer(store.currentIndex, { ...fillAnswers.value })
  }
}

function loadCurrentAnswer() {
  if (!store.currentQuestion) return
  const t = store.currentQuestion.type
  const saved = store.userAnswers[store.currentIndex]
  if (t === 'essay') {
    textAnswer.value = saved || ''
    textCount.value = textAnswer.value.length
  } else if (t === 'fill') {
    fillAnswers.value = saved && typeof saved === 'object' ? { ...saved } : {}
  }
}

function navClass(index) {
  if (index === store.currentIndex) return 'bg-gradient-to-br from-primary to-secondary text-white shadow-md'
  const ans = store.userAnswers[index]
  const hasAnswer = ans !== undefined && ans !== '' && ans !== null && (typeof ans !== 'object' || Object.keys(ans).length > 0)
  if (hasAnswer) return 'bg-success/20 text-success border border-success/30'
  return 'bg-gray-50 text-gray-500 border border-gray-200'
}

function confirmSubmit() {
  saveCurrentAnswer()
  showSubmitConfirm.value = true
}

async function submitExam() {
  showSubmitConfirm.value = false
  showGradingLoading.value = true
  try {
    await store.submit()
  } catch (err) {
    console.error('提交失败', err)
  } finally {
    showGradingLoading.value = false
    router.push('/result')
  }
}

// ========== 输入法弹起保护 ==========
function onInputFocus(e) {
  setTimeout(() => {
    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 300)
}

function onInputBlur() {
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 100)
}

// 使用 visualViewport API 检测键盘高度
function onVisualViewportResize() {
  if (window.visualViewport) {
    const vh = window.visualViewport.height
    const wh = window.innerHeight
    const diff = wh - vh
    if (diff > 150) {
      keyboardHeight.value = diff
    } else {
      keyboardHeight.value = 0
    }
  }
}

// 触摸滑动切换题目
const touchStartX = ref(0)
const touchStartY = ref(0)
const isSwiping = ref(false)

function onTouchStart(e) {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isSwiping.value = true
}

function onTouchMove(e) {
  if (!isSwiping.value) return
}

function onTouchEnd(e) {
  if (!isSwiping.value) return
  isSwiping.value = false
  const endX = e.changedTouches[0].clientX
  const endY = e.changedTouches[0].clientY
  const deltaX = endX - touchStartX.value
  const deltaY = endY - touchStartY.value
  if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0 && !store.isLast) {
      goNext()
    } else if (deltaX > 0 && !store.isFirst) {
      goPrev()
    }
  }
}

function onVisibilityChange() {
  if (document.hidden) {
    store.addLeave()
    if (store.leaveCount >= 3) {
      showLeaveWarning.value = true
    }
    if (store.leaveCount >= 5) {
      submitExam()
    }
  }
}

function onCopy(e) { e.preventDefault() }
function onCut(e) { e.preventDefault() }
function onKeyDown(e) {
  // 禁用 Ctrl/Cmd + C/V/X/A/P/S
  if ((e.ctrlKey || e.metaKey) && ['c','v','x','a','p','s'].includes(e.key.toLowerCase())) {
    e.preventDefault()
  }
  // 禁用 F12（开发者工具）
  if (e.key === 'F12') {
    e.preventDefault()
  }
}

onMounted(() => {
  loadCurrentAnswer()
  
  document.addEventListener('visibilitychange', onVisibilityChange)
  document.addEventListener('contextmenu', e => e.preventDefault())
  document.addEventListener('copy', onCopy)
  document.addEventListener('cut', onCut)
  document.addEventListener('keydown', onKeyDown)
  history.pushState(null, null, document.URL)
  window.addEventListener('popstate', () => history.pushState(null, null, document.URL))
  
  document.addEventListener('touchstart', onTouchStart, { passive: true })
  document.addEventListener('touchmove', onTouchMove, { passive: true })
  document.addEventListener('touchend', onTouchEnd, { passive: true })
  
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onVisualViewportResize)
  }
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  document.removeEventListener('copy', onCopy)
  document.removeEventListener('cut', onCut)
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('touchstart', onTouchStart)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', onVisualViewportResize)
  }
})
</script>

<style scoped>
/* 玻璃卡片 */
.glass-card-exam {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
}
.glass-card-exam::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.2) 40%,
    rgba(255, 255, 255, 0) 100%
  );
  border-radius: inherit;
  pointer-events: none;
}

/* 选项卡片 */
.option-glass {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.option-glass:hover {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.15);
}
.option-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0) 60%
  );
  border-radius: inherit;
  pointer-events: none;
}

/* 玻璃头部 */
.glass-header {
  background: rgba(255, 107, 53, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

/* 玻璃导航 */
.glass-nav {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 玻璃弹窗 */
.glass-modal {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

/* ========== 安全区域适配 ========== */
.safe-area-top {
  padding-top: env(safe-area-inset-top, 0px);
}

.pt-safe-top {
  padding-top: max(0.75rem, env(safe-area-inset-top, 0px));
}

.pt-safe-header {
  padding-top: calc(4rem + env(safe-area-inset-top, 0px));
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.pb-safe-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));
}

/* ========== 触摸目标大小（最小 44px） ========== */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* ========== 手机端适配 ========== */
@media (max-width: 480px) {
  .glass-card-exam {
    border-radius: 1.5rem;
    padding: 1.25rem;
  }
  .glass-header {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* ========== 横屏适配 ========== */
@media (orientation: landscape) and (max-height: 500px) {
  .glass-card-exam {
    padding: 1rem;
  }
  .pt-safe-header {
    padding-top: calc(3.5rem + env(safe-area-inset-top, 0px));
  }
}

/* ========== 滚动条隐藏 ========== */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
