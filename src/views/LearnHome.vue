<template> <div class="min-h-screen bg-soft relative overflow-x-hidden" @click="menuOpen = false"> <!-- 背景装饰 --> <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 blur-3xl animate-pulse-slow"></div> <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-200/30 blur-3xl animate-pulse-slow" style="animation-delay: 2s;"></div> <!-- 顶部栏 --> <header class="relative z-50"> <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between"> <div class="flex items-center gap-2"> <img src="/logo.png" alt="点点开黑" class="w-9 h-9 object-contain rounded-xl shadow"> <div> <h1 class="text-base font-bold text-accent leading-tight">新人培训中心</h1> <p class="text-xs text-accent/60">{{ userName }} · UID: {{ uid }}</p> </div> </div> <div class="relative"> <button @click.stop="menuOpen = !menuOpen" class="p-2 flex flex-col gap-[5px]" aria-label="菜单"> <i class="block w-[22px] h-[2px] rounded bg-accent"></i> <i class="block w-[22px] h-[2px] rounded bg-accent"></i> <i class="block w-[22px] h-[2px] rounded bg-accent"></i> </button> <div v-if="menuOpen" class="absolute right-0 top-full mt-1.5 z-50 bg-[#fffaf2] rounded-2xl shadow-xl border border-white/80 p-2.5 flex flex-col gap-2 min-w-[140px]"> <button @click="menuOpen = false; goQuery()" class="px-4 py-2.5 text-sm font-bold text-accent bg-white/70 hover:bg-white rounded-xl transition-all">成绩查询</button> <button @click="menuOpen = false; logout()" class="px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all">切换账号</button> </div> </div> </div> </header> <main class="max-w-3xl mx-auto px-4 py-5 relative z-10 pb-24"> <!-- 加载中 --> <div v-if="loading" class="glass-card p-10 text-center text-gray-500 font-bold"> <div class="text-4xl mb-3 animate-bounce"></div>
        课程加载中…
      </div> <template v-else> <!-- 双课包大卡 --> <div class="grid grid-cols-2 gap-3 sm:gap-4 mb-5"> <div
            v-for="pkg in packages" :key="pkg.id"
            @click="selectPackage(pkg)"
            class="glass-card relative p-4 sm:p-6 cursor-pointer transition-all duration-300 border-2 rounded-3xl overflow-hidden"
            :class="[
              'border-transparent hover:scale-[1.01]',
              pkg.chain_locked ? 'opacity-90' : ''
            ]"
          > <!-- 锁定遮罩角标 --> <div v-if="pkg.chain_locked" class="absolute top-3 right-3 w-9 h-9 bg-gray-500/80 rounded-full flex items-center justify-center text-lg shadow z-10"></div> <div v-else-if="pkg.exam_status.status === 'passed'" class="absolute top-3 right-3 w-9 h-9 bg-success rounded-full flex items-center justify-center text-lg shadow z-10 text-white"></div> <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl mb-3 shadow-inner"
              :class="pkg.key === 'sister' ? 'bg-gradient-to-br from-pink-100 to-rose-200' : 'bg-gradient-to-br from-indigo-100 to-blue-200'">
              {{ pkg.key === 'sister' ? '' : '' }}
            </div> <h2 class="text-base sm:text-xl font-extrabold text-gray-900 mb-1">{{ pkg.name }}</h2> <p class="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2rem]">{{ pkg.description }}</p> <!-- 进度 --> <div class="mb-2"> <div class="flex justify-between text-xs font-bold mb-1"> <span class="text-gray-500">课程进度</span> <span :class="pkg.all_completed ? 'text-success' : 'text-primary'">{{ pkg.completed_courses }}/{{ pkg.total_courses }}</span> </div> <div class="h-2 bg-gray-200/70 rounded-full overflow-hidden"> <div class="h-full rounded-full transition-all duration-500"
                  :class="pkg.all_completed ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-gradient-to-r from-primary to-secondary'"
                  :style="{ width: pkg.total_courses ? (pkg.completed_courses / pkg.total_courses * 100) + '%' : '0%' }"></div> </div> </div> <!-- 考试状态小徽章 --> <div class="mt-2"> <span v-if="pkg.chain_locked" class="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-500"> 需先通过姐妹团考试</span> <span v-else-if="pkg.exam_status.status === 'passed'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-success/10 text-success">已通过 {{ pkg.exam_status.percentage }}分</span> <span v-else-if="pkg.exam_status.status === 'ready'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-success/10 text-success animate-pulse"> 考试已解锁</span> <span v-else-if="pkg.exam_status.status === 'cooldown'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-danger/10 text-danger">冷却中</span> <span v-else-if="pkg.exam_status.status === 'no_exam'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-400/10 text-gray-400">未配置考试</span> <span v-else class="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">完成课程解锁考试</span> </div> </div> </div> <!-- 我的成绩记录 --> <div class="glass-card p-5 sm:p-6"> <h3 class="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2"> 我的成绩记录</h3> <div v-if="results.length === 0" class="text-center text-gray-400 py-6 font-bold">暂无考试记录</div> <div v-else class="space-y-2.5"> <div v-for="r in results" :key="r.id" class="flex items-center justify-between p-3.5 rounded-2xl bg-white/60 border border-gray-100"> <div> <p class="font-bold text-gray-800 text-sm">{{ r.exam_name || '未知试卷' }}</p> <p class="text-xs text-gray-400 mt-0.5">{{ formatTime(r.created_at) }}</p> </div> <div class="flex items-center gap-2"> <span class="text-sm font-extrabold" :class="r.passed ? 'text-success' : 'text-danger'">{{ r.percentage }}分</span> <span class="text-xs font-bold px-2 py-1 rounded-full" :class="r.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'">
                  {{ r.passed ? ' 及格' : ' 未及格' }}
                </span> </div> </div> </div> </div> </template> </main> <BottomNav active="learn" :uid="uid" /> </div>
</template> <script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExamStore } from '../stores/exam.js'
import BottomNav from '../components/BottomNav.vue'

const router = useRouter()
const route = useRoute()

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
  router.push(`/learn/package/${pkg.key}`)
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
  // 支持 URL 带 uid 移交身份（来自培训师系统跳转）
  if (route && route.query && route.query.uid) {
    id = String(route.query.uid)
    if (route.query.nickname) name = String(route.query.nickname)
    store.setUserInfo(name, id)
    try { localStorage.setItem('learn_user', JSON.stringify({ name, uid: id })) } catch (e) { /* ignore */ }
  }
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
