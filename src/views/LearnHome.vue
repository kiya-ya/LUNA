<template> <div class="min-h-screen bg-soft relative overflow-x-hidden" @click="menuOpen = false"> <!-- 背景装饰 --> <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 blur-3xl animate-pulse-slow"></div> <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-200/30 blur-3xl animate-pulse-slow" style="animation-delay: 2s;"></div> <!-- 顶部栏 --> <header class="relative z-50"> <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between"> <div class="flex items-center gap-2"> <img src="/logo.png" alt="点点开黑" class="w-9 h-9 object-contain rounded-xl shadow"> <div> <h1 class="text-base font-bold text-accent leading-tight">新人培训中心</h1> <p class="text-xs text-accent/60">{{ userName }} · UID: {{ uid }}</p> </div> </div> <div class="relative"> <button @click.stop="menuOpen = !menuOpen" class="p-2 flex flex-col gap-[5px]" aria-label="菜单"> <i class="block w-[22px] h-[2px] rounded bg-accent"></i> <i class="block w-[22px] h-[2px] rounded bg-accent"></i> <i class="block w-[22px] h-[2px] rounded bg-accent"></i> </button> <div v-if="menuOpen" class="absolute right-0 top-full mt-1.5 z-50 bg-[#fffaf2] rounded-2xl shadow-xl border border-white/80 p-2.5 flex flex-col gap-2 min-w-[140px]"> <button @click="menuOpen = false; goQuery()" class="px-4 py-2.5 text-sm font-bold text-accent bg-white/70 hover:bg-white rounded-xl transition-all">成绩查询</button> <button @click="menuOpen = false; logout()" class="px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all">切换账号</button> </div> </div> </div> </header> <main class="max-w-3xl mx-auto px-4 py-5 relative z-10 pb-10"> <!-- 加载中 --> <div v-if="loading" class="glass-card p-10 text-center text-gray-500 font-bold"> <div class="text-4xl mb-3 animate-bounce"></div>
        课程加载中…
      </div> <template v-else> <!-- 双课包大卡 --> <div class="grid grid-cols-2 gap-3 sm:gap-4 mb-5"> <div
            v-for="pkg in packages" :key="pkg.id"
            @click="selectPackage(pkg)"
            class="glass-card relative p-4 sm:p-6 cursor-pointer transition-all duration-300 border-2 rounded-3xl overflow-hidden"
            :class="[
              selectedId === pkg.id ? 'border-primary shadow-xl scale-[1.02]' : 'border-transparent hover:scale-[1.01]',
              pkg.chain_locked ? 'opacity-90' : ''
            ]"
          > <!-- 锁定遮罩角标 --> <div v-if="pkg.chain_locked" class="absolute top-3 right-3 w-9 h-9 bg-gray-500/80 rounded-full flex items-center justify-center text-lg shadow z-10"></div> <div v-else-if="pkg.exam_status.status === 'passed'" class="absolute top-3 right-3 w-9 h-9 bg-success rounded-full flex items-center justify-center text-lg shadow z-10 text-white"></div> <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl mb-3 shadow-inner"
              :class="pkg.key === 'sister' ? 'bg-gradient-to-br from-pink-100 to-rose-200' : 'bg-gradient-to-br from-indigo-100 to-blue-200'">
              {{ pkg.key === 'sister' ? '' : '' }}
            </div> <h2 class="text-base sm:text-xl font-extrabold text-gray-900 mb-1">{{ pkg.name }}</h2> <p class="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2rem]">{{ pkg.description }}</p> <!-- 进度 --> <div class="mb-2"> <div class="flex justify-between text-xs font-bold mb-1"> <span class="text-gray-500">课程进度</span> <span :class="pkg.all_completed ? 'text-success' : 'text-primary'">{{ pkg.completed_courses }}/{{ pkg.total_courses }}</span> </div> <div class="h-2 bg-gray-200/70 rounded-full overflow-hidden"> <div class="h-full rounded-full transition-all duration-500"
                  :class="pkg.all_completed ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-gradient-to-r from-primary to-secondary'"
                  :style="{ width: pkg.total_courses ? (pkg.completed_courses / pkg.total_courses * 100) + '%' : '0%' }"></div> </div> </div> <!-- 考试状态小徽章 --> <div class="mt-2"> <span v-if="pkg.chain_locked" class="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-500"> 需先通过姐妹团考试</span> <span v-else-if="pkg.exam_status.status === 'passed'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-success/10 text-success">已通过 {{ pkg.exam_status.percentage }}分</span> <span v-else-if="pkg.exam_status.status === 'ready'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-success/10 text-success animate-pulse"> 考试已解锁</span> <span v-else-if="pkg.exam_status.status === 'cooldown'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-danger/10 text-danger">冷却中</span> <span v-else-if="pkg.exam_status.status === 'no_exam'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-400/10 text-gray-400">未配置考试</span> <span v-else class="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">完成课程解锁考试</span> </div> </div> </div> <!-- 选中课包细节 --> <div v-if="selectedPackage" class="glass-card p-5 sm:p-6 mb-5"> <div class="flex items-center justify-between mb-4"> <h3 class="text-lg font-extrabold text-gray-900 flex items-center gap-2"> <span>{{ selectedPackage.key === 'sister' ? '' : '' }}</span>
              {{ selectedPackage.name }} · 课程列表
            </h3> <button @click="loadHome" class="text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all"> 刷新</button> </div> <!-- 课程列表 --> <div v-if="selectedPackage.courses.length === 0" class="text-center text-gray-400 py-8"> <div class="text-4xl mb-2"></div> <p class="font-bold">课程筹备中，敬请期待</p> </div> <div v-else class="space-y-3 mb-5"> <div
              v-for="(course, idx) in selectedPackage.courses" :key="course.id"
              @click="openCourse(course)"
              class="flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md group"
              :class="course.completed ? 'border-success/30 bg-success/5' : 'border-gray-100 bg-white/60 hover:border-primary/30'"
            > <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                :class="course.completed ? 'bg-success/15' : course.type === 'video' ? 'bg-rose-100' : 'bg-sky-100'">
                {{ course.completed ? '' : course.type === 'video' ? '' : '' }}
              </div> <div class="flex-1 min-w-0"> <div class="flex items-center gap-2"> <span class="text-xs font-bold text-gray-400">{{ idx + 1 }}.</span> <p class="font-bold text-gray-800 text-sm truncate">{{ course.title }}</p> </div> <div class="flex items-center gap-2 mt-1"> <span class="text-xs text-gray-400">{{ course.type === 'video' ? '视频课' : '图文课' }}</span> <span v-if="course.duration_minutes" class="text-xs text-gray-400">· 约 {{ course.duration_minutes }} 分钟</span> </div> <!-- 进度条 --> <div v-if="!course.completed && course.progress_percent > 0" class="mt-1.5 flex items-center gap-2"> <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden"> <div class="h-full bg-gradient-to-r from-primary to-secondary rounded-full" :style="{ width: course.progress_percent + '%' }"></div> </div> <span class="text-xs font-bold text-primary">{{ Math.floor(course.progress_percent) }}%</span> </div> </div> <span class="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                :class="course.completed ? 'bg-success/10 text-success' : course.progress_percent > 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'">
                {{ course.completed ? '已完成' : course.progress_percent > 0 ? '学习中' : '未开始' }}
              </span> </div> </div> <!-- 考试入口按钮 --> <div class="border-t border-gray-100 pt-4"> <!-- 已通过 --> <div v-if="selectedPackage.exam_status.status === 'passed'" class="flex items-center justify-between bg-success/5 border border-success/20 rounded-2xl p-4"> <div> <p class="font-extrabold text-success"> 考试已通过</p> <p class="text-xs text-gray-500 mt-0.5">{{ selectedPackage.exam_status.exam_name || '考试' }} · {{ selectedPackage.exam_status.total_score }}/{{ selectedPackage.exam_status.max_score }} 分</p> </div> <span class="text-2xl font-extrabold text-success">{{ selectedPackage.exam_status.percentage }}<span class="text-sm">分</span></span> </div> <!-- 冷却中 --> <div v-else-if="selectedPackage.exam_status.status === 'cooldown'" class="bg-danger/5 border border-danger/20 rounded-2xl p-4 text-center"> <p class="font-extrabold text-danger mb-1"> 上次考试未及格（{{ selectedPackage.exam_status.last_percentage }}分）</p> <p class="text-sm text-gray-600">冷却期剩余 <span class="font-extrabold text-danger tabular-nums">{{ cooldownText }}</span></p> </div> <!-- 未配置考试 --> <button v-else-if="selectedPackage.exam_status.status === 'no_exam'" disabled
              class="w-full h-[52px] bg-gray-200 text-gray-400 font-bold rounded-2xl cursor-not-allowed">
              考试未配置，请联系管理员
            </button> <!-- 未解锁 --> <button v-else-if="selectedPackage.exam_status.status === 'locked'" disabled
              class="w-full h-[52px] bg-gray-200 text-gray-400 font-bold rounded-2xl cursor-not-allowed flex items-center justify-center gap-2"> <span></span> <span v-if="selectedPackage.exam_status.chain_locked">需先通过姐妹团考试</span> <span v-else>完成全部课程后解锁考试（还差 {{ selectedPackage.exam_status.remaining_courses }} 门）</span> </button> <!-- 可考 --> <button v-else-if="selectedPackage.exam_status.status === 'ready'" @click="startExam(selectedPackage)" :disabled="startingExam"
              class="w-full h-[52px] bg-gradient-to-r from-primary to-secondary text-white text-lg font-extrabold rounded-2xl shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"> <span></span> {{ startingExam ? '正在进入…' : '开始考试（60分及格）' }}
            </button> </div> </div> <!-- 我的成绩记录 --> <div class="glass-card p-5 sm:p-6"> <h3 class="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2"> 我的成绩记录</h3> <div v-if="results.length === 0" class="text-center text-gray-400 py-6 font-bold">暂无考试记录</div> <div v-else class="space-y-2.5"> <div v-for="r in results" :key="r.id" class="flex items-center justify-between p-3.5 rounded-2xl bg-white/60 border border-gray-100"> <div> <p class="font-bold text-gray-800 text-sm">{{ r.exam_name || '未知试卷' }}</p> <p class="text-xs text-gray-400 mt-0.5">{{ formatTime(r.created_at) }}</p> </div> <div class="flex items-center gap-2"> <span class="text-sm font-extrabold" :class="r.passed ? 'text-success' : 'text-danger'">{{ r.percentage }}分</span> <span class="text-xs font-bold px-2 py-1 rounded-full" :class="r.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'">
                  {{ r.passed ? ' 及格' : ' 未及格' }}
                </span> </div> </div> </div> </div> </template> </main> </div>
</template> <script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useExamStore } from '../stores/exam.js'

const router = useRouter()

function goQuery() {
  router.push({ path: '/query', query: { uid: uid.value } })
}
const store = useExamStore()
const showToast = inject('showToast')

const userName = ref('')
const menuOpen = ref(false)
const uid = ref('')
const loading = ref(true)
const packages = ref([])
const results = ref([])
const selectedId = ref(null)
const startingExam = ref(false)
const now = ref(Date.now())
let clockTimer = null

const selectedPackage = computed(() => packages.value.find(p => p.id === selectedId.value) || null)

// 冷却倒计时显示
const cooldownText = computed(() => {
  const pkg = selectedPackage.value
  if (!pkg || pkg.exam_status.status !== 'cooldown') return ''
  const remain = Math.max(0, pkg.exam_status.remaining_seconds - Math.floor((now.value - loadedAt) / 1000))
  const d = Math.floor(remain / 86400)
  const h = Math.floor((remain % 86400) / 3600)
  const m = Math.floor((remain % 3600) / 60)
  const s = remain % 60
  if (d > 0) return `${d}天 ${h}时 ${m}分`
  if (h > 0) return `${h}时 ${m}分 ${s}秒`
  return `${m}分 ${s}秒`
})
let loadedAt = Date.now()

function selectPackage(pkg) {
  selectedId.value = pkg.id
}

function openCourse(course) {
  router.push(`/learn/course/${course.id}`)
}

async function loadHome() {
  try {
    const res = await fetch(`/api/learn/home?uid=${encodeURIComponent(uid.value)}`)
    const data = await res.json()
    if (data.success) {
      packages.value = data.data.packages || []
      results.value = data.data.results || []
      loadedAt = Date.now()
      now.value = Date.now()
      if (!selectedId.value && packages.value.length > 0) {
        // 默认选中姐妹团，若已通过则选中培训师
        const sister = packages.value.find(p => p.key === 'sister') || packages.value[0]
        const trainer = packages.value.find(p => p.key === 'trainer')
        selectedId.value = (sister.exam_status.status === 'passed' && trainer) ? trainer.id : sister.id
      }
    } else {
      showToast(data.error || '加载失败', 'error')
    }
  } catch (e) {
    console.error('加载学习首页失败', e)
    showToast('网络错误，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

async function startExam(pkg) {
  startingExam.value = true
  try {
    store.setUserInfo(userName.value, uid.value)
    await store.fetchExamConfig(pkg.exam_config_id)
    if (store.loadError) {
      showToast(store.loadError, 'error')
      return
    }
    router.push('/exam')
  } finally {
    startingExam.value = false
  }
}

function logout() {
  localStorage.removeItem('learn_user')
  store.setUserInfo('', '')
  router.push('/')
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  // 从 store 或 localStorage 恢复身份
  let name = store.userName
  let id = store.userPhone
  if (!id) {
    try {
      const saved = JSON.parse(localStorage.getItem('learn_user') || 'null')
      if (saved && saved.uid) {
        name = saved.name
        id = saved.uid
        store.setUserInfo(name, id)
      }
    } catch (e) { /* ignore */ }
  }
  if (!id) {
    showToast('请先填写昵称和UID', 'warning')
    router.push('/')
    return
  }
  userName.value = name
  uid.value = id
  loadHome()
  clockTimer = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script> <style scoped>
@keyframes pulse-slow {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}
.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}
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
.glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-radius: 1.5rem;
}
.glass-nav {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
