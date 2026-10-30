<template> <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-animated"> <!-- 背景装饰元素 --> <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 blur-3xl animate-pulse-slow"></div> <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-200/30 blur-3xl animate-pulse-slow" style="animation-delay: 2s;"></div> <div class="absolute top-[30%] right-[10%] w-32 h-32 rounded-full bg-purple-300/30 blur-2xl animate-float"></div> <div class="absolute bottom-[20%] left-[15%] w-24 h-24 rounded-full bg-amber-300/30 blur-2xl animate-float" style="animation-delay: 3s;"></div> <!-- 主卡片 --> <div class="w-full max-w-[440px] relative z-10"> <!-- 卡片主体 --> <div class="glass-card rounded-[2rem] p-8 shadow-2xl"> <!-- Logo 区域 --> <div class="text-center mb-8"> <div class="relative w-24 h-24 mx-auto mb-5 group"> <img src="/logo.png" alt="点点开黑" class="w-full h-full object-contain rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300"> <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-secondary to-danger rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white/50">考</div> </div> <h1 class="text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">点点开黑考试</h1> <p class="text-sm text-white/70 mt-2 font-medium">姐姐团 · 在线考核系统</p> </div> <!-- 表单 --> <form @submit.prevent="handleSubmit" class="space-y-5"> <!-- 昵称输入 --> <div class="group"> <label class="block text-sm font-bold text-white/90 mb-2 ml-1 drop-shadow-sm">点点昵称</label> <div class="relative"> <input
                v-model="form.name"
                type="text"
                placeholder="请输入你的点点昵称"
                class="h-[52px] w-full px-4 text-base border border-white/30 rounded-2xl focus:border-white/60 focus:ring-2 focus:ring-white/20 transition-all bg-white/20 backdrop-blur-sm text-white placeholder-white/50"
                required
              > </div> </div> <!-- UID输入 --> <div class="group"> <label class="block text-sm font-bold text-white/90 mb-2 ml-1 drop-shadow-sm">点点UID</label> <div class="relative"> <input
                v-model="form.phone"
                type="text"
                placeholder="请输入你的点点UID"
                class="h-[52px] w-full px-4 text-base border border-white/30 rounded-2xl focus:border-white/60 focus:ring-2 focus:ring-white/20 transition-all bg-white/20 backdrop-blur-sm text-white placeholder-white/50"
                required
              > </div> </div> <!-- 考试须知 --> <div class="bg-white/10 border border-white/20 rounded-2xl overflow-hidden backdrop-blur-sm"> <button type="button" @click="showNotice = !showNotice" class="w-full px-4 py-3.5 flex items-center justify-between text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"> <span class="flex items-center gap-2"> <span class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"></span> <span>考试须知</span> </span> <svg :class="showNotice ? 'rotate-180' : ''" class="w-5 h-5 text-white/60 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path> </svg> </button> <Transition name="slide-down"> <div v-show="showNotice" class="px-4 pb-4 text-sm text-white/80 space-y-2.5"> <div class="flex items-start gap-2"> <p>共 <span class="font-bold text-white">{{ totalQuestions }}道</span> 题目，每人题目顺序不同</p> </div> <div class="flex items-start gap-2"> <p>考试时间由管理员设置，到时间自动截止</p> </div> <div class="flex items-start gap-2"> <p>离开页面 <span class="font-bold text-white">3次</span> 警告，<span class="font-bold text-white">5次</span> 强制交卷</p> </div> <div class="flex items-start gap-2"> <p>答题自动保存，断网可续考</p> </div> <div class="flex items-start gap-2"> <p>每人仅限答题 <span class="font-bold text-white">1次</span>（同一试卷），新试卷发布后可重新考试</p> </div> <div class="flex items-start gap-2"> <p>同一设备仅允许 <span class="font-bold text-white">1个</span> 账号登录</p> </div> </div> </Transition> </div> <!-- 开始学习按钮（先进学习首页，必修课完成后解锁考试） --> <button
            type="submit"
            class="w-full h-[56px] bg-gradient-to-r from-primary to-secondary text-white text-lg font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 group"
          > <span class="text-xl group-hover:rotate-12 transition-transform duration-300"></span> <span>进入学习</span> <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path> </svg> </button> </form> <!-- 隐藏入口：直接考试（不关联课包的旧流程） --> <div class="mt-3 text-center"> <button type="button" @click="handleDirectExam" class="text-xs text-white/40 hover:text-white/70 font-medium transition-colors">直接考试</button> </div> <!-- 查询成绩按钮 --> <div class="mt-6 pt-5 border-t border-white/20"> <button @click="goQuery" class="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-white hover:text-white bg-white/25 hover:bg-white/35 border border-white/30 rounded-2xl transition-all duration-300 group"> <span class="text-lg group-hover:scale-110 transition-transform"></span> <span>查询我的成绩</span> </button> </div> </div> <!-- 底部版权 --> <div class="mt-6 text-center"> <p class="text-xs text-white/60 font-medium">点点开黑 · 姐妹团欢迎你</p> <p class="text-xs text-white/40 mt-1">design by Lu deng</p> </div> </div>  </div>
</template> <script setup>
import { ref, inject, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useExamStore } from '../stores/exam.js'

const router = useRouter()
const store = useExamStore()
const showToast = inject('showToast')

// 每次进入首页时自动清除管理员测试标记（防止残留影响正常考试）
localStorage.removeItem('exam_admin_test')

const form = ref({ name: '', phone: '' })
const showNotice = ref(false)
const examInfo = ref(null)

// 加载已发布考试信息（题目数量等）
onMounted(async () => {
  try {
    const res = await fetch('/api/exam-configs')
    const data = await res.json()
    if (data.success && data.data) {
      const configs = Array.isArray(data.data) ? data.data : []
      const published = configs.find(c => c.status === 'published')
      if (published) {
        examInfo.value = published
      }
    }
  } catch (e) {
    console.log('获取考试信息失败', e)
  }
})

// 计算题目总数
const totalQuestions = computed(() => {
  if (!examInfo.value) return '--'
  const cfg = examInfo.value
  return (cfg.single || 0) + (cfg.multiple || 0) + (cfg.fill || 0) + (cfg.essay || 0)
})

function goQuery() {
  router.push('/mine')
}

async function handleSubmit() {
  const name = form.value.name.trim()
  const phone = form.value.phone.trim()

  if (!name || !phone) {
    showToast('请填写完整信息', 'warning')
    return
  }

  // 保存身份信息，进入学习首页（课程完成后在学习页解锁考试）
  store.setUserInfo(name, phone)
  localStorage.setItem('learn_user', JSON.stringify({ name, uid: phone }))
  router.push('/learn')
}

// 隐藏入口：直接考试（保留原有考试流程，含资格检查）
async function handleDirectExam() {
  const name = form.value.name.trim()
  const phone = form.value.phone.trim()

  if (!name || !phone) {
    showToast('请先填写昵称和UID', 'warning')
    return
  }

  // 初始化设备指纹
  store.initDeviceId()
  const deviceId = store.deviceId

  // 管理员测试模式：跳过反作弊检查
  const isAdminTest = localStorage.getItem('exam_admin_test') === '1'
  if (!isAdminTest) {
    // 统一检查 UID + 设备指纹（进入考试前拦住）
    try {
      const checkRes = await fetch(`/api/check-eligibility?uid=${encodeURIComponent(phone)}&device_id=${encodeURIComponent(deviceId)}`)
      const checkData = await checkRes.json()
      if (!checkData.success) {
        if (checkData.code === 'EXAM_TAKEN') {
          showToast(checkData.error || '您已参加过该试卷的考试', 'warning')
        } else if (checkData.code === 'DEVICE_USED') {
          showToast(checkData.error || '该设备已有人提交过考试', 'error')
        } else {
          showToast(checkData.error || '无法进入考试', 'error')
        }
        return
      }
    } catch (e) {
      console.log('检查考试资格失败', e)
      showToast('检查考试资格失败，请稍后重试', 'error')
      return
    }
  }

  store.setUserInfo(name, phone)
  localStorage.setItem('learn_user', JSON.stringify({ name, uid: phone }))
  await store.fetchExamConfig()

  if (store.loadError) {
    showToast(store.loadError, 'error')
    return
  }

  router.push('/exam')
}
</script> <style scoped>
/* 背景动画 */
@keyframes pulse-slow {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}
.animate-float {
  animation: float 6s ease-in-out infinite;
}

/* 展开动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

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

/* 手机端适配 */
@media (max-width: 480px) {
  .bg-animated {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    padding-top: 0.75rem;
    /* padding-bottom handled by safe-area below */
  }
  .bg-animated > .max-w-\[440px\] {
    max-width: 100%;
  }
  .bg-animated .rounded-\[2rem\] {
    border-radius: 1.5rem;
    padding: 1.5rem;
  }
  .bg-animated h1 {
    font-size: 1.25rem;
  }
  .bg-animated .w-24 {
    width: 5rem;
    height: 5rem;
  }
  .bg-animated .h-\[52px\],
  .bg-animated .h-\[56px\] {
    height: 3rem;
  }
}

/* 玻璃拟态卡片（Apple 风格） */
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
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

/* 安全区域适配（iPhone 刘海屏） */
@supports (padding: max(0px)) {
  .bg-animated {
    padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
  }
}


</style>
