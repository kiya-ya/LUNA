<template>
  <div class="min-h-screen bg-soft relative" @click="menuOpen = false">
    <!-- 背景装饰 -->
    <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 blur-3xl animate-pulse-slow"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-200/30 blur-3xl animate-pulse-slow" style="animation-delay: 2s;"></div>

    <!-- 顶栏：透明 + 三横线 -->
    <header class="relative z-50 shrink-0">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img src="/logo.png" alt="点点开黑" class="w-9 h-9 object-contain rounded-xl shadow">
          <div>
            <h1 class="text-base font-bold text-accent leading-tight">新人培训中心</h1>
            <p class="text-xs text-accent/60">{{ userName }} · UID: {{ uid }}</p>
          </div>
        </div>
        <div class="relative">
          <button @click.stop="menuOpen = !menuOpen" class="p-2 flex flex-col gap-[5px]" aria-label="菜单">
            <i class="block w-[22px] h-[2px] rounded bg-accent"></i>
            <i class="block w-[22px] h-[2px] rounded bg-accent"></i>
            <i class="block w-[22px] h-[2px] rounded bg-accent"></i>
          </button>
          <div v-if="menuOpen" class="absolute right-0 top-full mt-1.5 z-50 bg-[#fffaf2] rounded-2xl shadow-xl border border-white/80 p-2.5 flex flex-col gap-2 min-w-[140px]">
            <button @click="menuOpen = false; goQuery()" class="px-4 py-2.5 text-sm font-bold text-accent bg-white/70 hover:bg-white rounded-xl transition-all">成绩查询</button>
            <button @click="menuOpen = false; logout()" class="px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all">切换账号</button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-3xl w-full mx-auto px-4 pt-1 pb-44 relative z-10">
      <!-- 加载中 -->
      <div v-if="loading" class="glass-card p-10 text-center text-gray-500 font-bold shrink-0">课程加载中…</div>

      <template v-else>
        <!-- 上部：双大卡选课包（固定不滚） -->
        <div class="grid grid-cols-2 gap-3 sm:gap-4 mb-2 shrink-0">
          <div
            v-for="p in packages" :key="p.id"
            @click="selectPackage(p)"
            class="glass-card relative p-3.5 sm:p-4 cursor-pointer transition-all duration-300 border-2 rounded-3xl"
            :class="pkg && pkg.id === p.id ? 'border-primary shadow-xl' : 'border-transparent hover:shadow-lg'"
          >
            <div class="flex items-center gap-2.5 mb-2">
              <div class="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center text-[11px] font-extrabold text-white shadow-inner"
                :class="p.key === 'sister' ? 'bg-gradient-to-br from-pink-300 to-rose-400' : 'bg-gradient-to-br from-indigo-300 to-purple-400'">
                <svg v-if="p.key === 'sister'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px"><circle cx="8.5" cy="8" r="3.2"/><circle cx="16" cy="9" r="2.6"/><path d="M3.5 19c1-3.2 3-4.5 5-4.5s4 1.3 5 4.5"/><path d="M14.2 15.2c2.3.2 4 1.6 4.8 4"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px"><path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11.2v4.3c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-4.3"/><path d="M21 9.2v5"/></svg>
              </div>
              <h2 class="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">{{ p.name }}</h2>
            </div>
            <div class="mb-2">
              <div class="flex justify-between text-xs font-bold mb-1">
                <span class="text-gray-500">课程进度</span>
                <span :class="p.all_completed ? 'text-success' : 'text-primary'">{{ p.completed_courses }}/{{ p.total_courses }}</span>
              </div>
              <div class="h-2 bg-gray-200/70 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                  :class="p.all_completed ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-gradient-to-r from-primary to-secondary'"
                  :style="{ width: p.total_courses ? (p.completed_courses / p.total_courses * 100) + '%' : '0%' }"></div>
              </div>
            </div>
            <div>
              <span v-if="p.chain_locked" class="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-500">需先通过姐妹团考试</span>
              <span v-else-if="p.exam_status.status === 'passed'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-success/10 text-success">已通过 {{ p.exam_status.percentage }}分</span>
              <span v-else-if="p.exam_status.status === 'ready'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-success/10 text-success animate-pulse">考试已解锁</span>
              <span v-else-if="p.exam_status.status === 'cooldown'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-danger/10 text-danger">冷却中</span>
              <span v-else-if="p.exam_status.status === 'no_exam'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-400/10 text-gray-400">未配置考试</span>
              <span v-else class="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">完成课程解锁考试</span>
            </div>
          </div>
        </div>

        <!-- 过渡装饰：渐变线段 + 当前课包名 -->
        <div class="deco-divider">
          <span class="seg gold"></span>
          <em>{{ pkg ? pkg.name + ' · 课程明细' : '课程明细' }}</em>
          <span class="seg brown"></span>
          <span class="seg pink"></span>
        </div>

        <!-- 下部：点单式课程明细（左右独立滚动，整页不滚） -->
        <div v-if="pkg && pkg.chain_locked" class="glass-card p-10 text-center shrink-0">
          <p class="font-extrabold text-gray-700 mb-2">{{ pkg.name }}未解锁</p>
          <p class="text-sm text-gray-500">需先通过姐妹团考试</p>
        </div>
        <div v-else-if="pkg" class="flex gap-3 items-start">
          <!-- 左侧大纲：固定 + 独立滚动 -->
          <aside ref="asideRef" class="w-[86px] shrink-0 sticky sidebar-stick overflow-y-auto scrollbar-hide pb-2">
            <template v-for="group in courseGroups" :key="group.name">
              <div class="text-[10px] font-extrabold text-accent/60 px-2 pt-2 pb-1">{{ group.name }}</div>
              <button
                v-for="c in group.list" :key="c.id"
                @click="scrollToCourse(c.id)"
                class="w-full text-left px-2.5 py-2.5 rounded-xl text-xs font-bold mb-1.5 transition-all leading-snug"
                :class="activeCourseId === c.id ? 'bg-primary text-white shadow' : 'bg-white/60 text-gray-500'"
              >{{ c.title }}</button>
            </template>
            <div v-if="pkg.courses.length === 0" class="text-xs text-gray-400 px-2 py-3">暂无课程</div>
          </aside>

          <!-- 右侧课程卡片：独立滚动 -->
          <section ref="listRef" class="flex-1 min-w-0 pb-3 pr-0.5">
            <div class="space-y-3">
              <div v-if="pkg.courses.length === 0" class="glass-card p-8 text-center text-gray-400 font-bold">课程筹备中，敬请期待</div>
              <div
                v-for="(course, idx) in pkg.courses" :key="course.id"
                :ref="el => setCourseRef(course.id, el)"
                class="glass-card p-4 cursor-pointer transition-all hover:shadow-xl"
                @click="openCourse(course)"
              >
                <div class="flex gap-3">
                  <div class="w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center text-xs font-extrabold shadow-inner"
                    :class="course.completed ? 'bg-success/15 text-success' : course.type === 'video' ? 'bg-rose-100 text-rose-500' : 'bg-sky-100 text-sky-500'">
                    {{ course.completed ? '已完成' : course.type === 'video' ? '视频课' : '图文课' }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-gray-800 text-sm"><span class="text-gray-400 text-xs mr-1">{{ idx + 1 }}.</span>{{ course.title }}</p>
                    <p class="text-xs text-gray-400 mt-1">{{ course.category === 'optional' ? '选修' : '必修' }}<span v-if="course.duration_minutes"> · 约 {{ course.duration_minutes }} 分钟</span></p>
                    <div v-if="!course.completed && course.progress_percent > 0" class="mt-2 flex items-center gap-2">
                      <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-primary to-secondary rounded-full" :style="{ width: course.progress_percent + '%' }"></div>
                      </div>
                      <span class="text-xs font-bold text-primary">{{ Math.floor(course.progress_percent) }}%</span>
                    </div>
                  </div>
                </div>
                <button class="mt-3 w-full h-10 rounded-xl font-bold text-sm transition-all"
                  :class="course.completed ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary hover:bg-primary/20'">
                  {{ course.completed ? '复习一遍' : course.progress_percent > 0 ? '继续学习' : '开始学习' }}
                </button>
              </div>
            </div>
          </section>
        </div>
      </template>
    </main>

    <!-- 回到顶部悬浮按钮（作用于右侧课程列表） -->
    <button v-if="pkg && !pkg.chain_locked" @click="scrollTop"
      class="fixed right-4 z-40 w-10 h-10 rounded-full bg-white/85 backdrop-blur border border-white/70 shadow-lg text-accent font-bold text-lg hover:scale-105 transition-all"
      style="bottom: calc(150px + env(safe-area-inset-bottom));" title="回到顶部">↑</button>

    <!-- 底部固定栏：成绩记录图标 + 学习进度 + 去考试 -->
    <div v-if="pkg" class="fixed left-0 right-0 z-40 px-4" style="bottom: calc(64px + env(safe-area-inset-bottom));">
      <div class="max-w-3xl mx-auto glass-card !rounded-2xl p-3 flex items-center gap-3">
        <button @click="showRecords = true"
          class="w-11 h-11 shrink-0 rounded-xl bg-accent/10 text-accent font-bold text-xs flex flex-col items-center justify-center leading-none hover:bg-accent/20 transition-all"
          title="我的成绩记录">
          <span class="text-base">%</span><span class="text-[10px] mt-0.5">成绩</span>
        </button>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between text-xs font-bold mb-1">
            <span class="text-gray-500">学习进度</span>
            <span :class="pkg.all_completed ? 'text-success' : 'text-primary'">{{ pkg.completed_courses }}/{{ pkg.total_courses }}</span>
          </div>
          <div class="h-2 bg-gray-200/70 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500"
              :class="pkg.all_completed ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-gradient-to-r from-primary to-secondary'"
              :style="{ width: pkg.total_courses ? (pkg.completed_courses / pkg.total_courses * 100) + '%' : '0%' }"></div>
          </div>
        </div>
        <button v-if="pkg.exam_status.status === 'passed'" disabled
          class="h-11 px-4 rounded-xl font-bold text-sm bg-success/10 text-success shrink-0">已通过 {{ pkg.exam_status.percentage }}分</button>
        <button v-else-if="pkg.exam_status.status === 'cooldown'" disabled
          class="h-11 px-4 rounded-xl font-bold text-sm bg-danger/10 text-danger shrink-0">冷却中 {{ cooldownText }}</button>
        <button v-else-if="pkg.exam_status.status === 'ready'" @click="startExam" :disabled="startingExam"
          class="h-11 px-5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all">
          {{ startingExam ? '正在进入…' : '去考试' }}
        </button>
        <button v-else disabled class="h-11 px-4 rounded-xl font-bold text-sm bg-gray-200 text-gray-400 shrink-0">
          {{ pkg.chain_locked ? '未解锁' : pkg.exam_status.status === 'no_exam' ? '考试未配置' : `还差 ${pkg.exam_status.remaining_courses} 门` }}
        </button>
      </div>
    </div>

    <!-- 成绩记录弹窗 -->
    <div v-if="showRecords" class="fixed inset-0 z-[70] flex items-center justify-center p-4" style="background:rgba(63,42,20,.35)" @click.self="showRecords = false">
      <div class="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-900">我的成绩记录</h3>
          <button @click="showRecords = false" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">×</button>
        </div>
        <div v-if="results.length === 0" class="text-center text-gray-400 py-8 font-bold">暂无考试记录</div>
        <div v-else class="space-y-2.5">
          <div v-for="r in results" :key="r.id" class="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
            <div>
              <p class="font-bold text-gray-800 text-sm">{{ r.exam_name || '未知试卷' }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ formatTime(r.created_at) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-extrabold" :class="r.passed ? 'text-success' : 'text-danger'">{{ r.percentage }}分</span>
              <span class="text-xs font-bold px-2 py-1 rounded-full" :class="r.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'">{{ r.passed ? '及格' : '未及格' }}</span>
            </div>
          </div>
        </div>
        <button @click="goQuery" class="mt-4 w-full h-11 bg-primary/10 text-primary font-bold rounded-2xl hover:bg-primary/20 transition-all">查看答题明细</button>
      </div>
    </div>

    <BottomNav active="learn" :uid="uid" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExamStore } from '../stores/exam.js'
import BottomNav from '../components/BottomNav.vue'

// 统一入口（培训师系统 v2）
const PORTAL_URL = 'http://192.168.100.117:5000/portal-v2'

const route = useRoute()
const router = useRouter()
const store = useExamStore()
const showToast = inject('showToast')

const uid = ref('')
const userName = ref('')
const loading = ref(true)
const packages = ref([])
const results = ref([])
const pkg = ref(null)
const menuOpen = ref(false)
const showRecords = ref(false)
const startingExam = ref(false)
const activeCourseId = ref(null)
const now = ref(Date.now())
const listRef = ref(null)
const asideRef = ref(null)
let clockTimer = null
let loadedAt = Date.now()
const courseRefs = {}

const courseGroups = computed(() => {
  if (!pkg.value) return []
  const req = pkg.value.courses.filter(c => c.category !== 'optional')
  const opt = pkg.value.courses.filter(c => c.category === 'optional')
  const groups = []
  if (req.length) groups.push({ name: '必修课', list: req })
  if (opt.length) groups.push({ name: '选修课', list: opt })
  return groups
})

const cooldownText = computed(() => {
  if (!pkg.value || pkg.value.exam_status.status !== 'cooldown') return ''
  const remain = Math.max(0, pkg.value.exam_status.remaining_seconds - Math.floor((now.value - loadedAt) / 1000))
  const d = Math.floor(remain / 86400)
  const h = Math.floor((remain % 86400) / 3600)
  const m = Math.floor((remain % 3600) / 60)
  if (d > 0) return `${d}天${h}时`
  if (h > 0) return `${h}时${m}分`
  return `${m}分`
})

function setCourseRef(id, el) {
  if (el) courseRefs[id] = el
}

function scrollToCourse(id) {
  activeCourseId.value = id
  const el = courseRefs[id]
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function selectPackage(p) {
  if (pkg.value && pkg.value.id === p.id) return
  pkg.value = p
  if (route.path !== '/learn') router.replace(`/learn/package/${p.key}`)
}

function openCourse(course) {
  router.push(`/learn/course/${course.id}`)
}

function goQuery() {
  router.push({ path: '/query', query: { uid: uid.value } })
}

function logout() {
  localStorage.removeItem('learn_user')
  store.setUserInfo('', '')
  location.href = PORTAL_URL
}

async function startExam() {
  if (!pkg.value || !pkg.value.exam_config_id) return
  startingExam.value = true
  try {
    store.setUserInfo(userName.value, uid.value)
    await store.fetchExamConfig(pkg.value.exam_config_id)
    if (store.loadError) {
      showToast(store.loadError, 'error')
      return
    }
    router.push('/exam')
  } finally {
    startingExam.value = false
  }
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function load() {
  loading.value = true
  try {
    const res = await fetch(`/api/learn/home?uid=${encodeURIComponent(uid.value)}`)
    const data = await res.json()
    if (data.success) {
      packages.value = data.data.packages || []
      results.value = data.data.results || []
      loadedAt = Date.now()
      now.value = Date.now()
      const key = route.params.key
      pkg.value = packages.value.find(p => p.key === key)
        || packages.value.find(p => p.key === 'sister')
        || packages.value[0] || null
    } else {
      showToast(data.error || '加载失败', 'error')
    }
  } catch (e) {
    showToast('网络错误，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  let name = store.userName
  let id = store.userPhone
  // 支持 URL 带 uid 移交身份（来自培训师系统跳转）
  if (route.query.uid) {
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
  load()
  clockTimer = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-radius: 1.5rem;
}
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { scrollbar-width: none; }
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
@keyframes pulse-slow {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}
.animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }

/* 课包与课程明细之间的过渡装饰（吸顶） */
.deco-divider {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 8px 0 10px;
  position: sticky; top: 0; z-index: 30;
  background: linear-gradient(160deg, #EFE9F8 0%, #F8F2FC 60%, #FBF5EA 100%);
}
/* 左侧大纲吸顶（过渡栏下方） */
.sidebar-stick { top: 46px; max-height: calc(100vh - 200px); }
/* 课程卡定位时避开吸顶栏 */
section .glass-card { scroll-margin-top: 56px; }
.deco-divider em {
  font-style: normal; font-size: 11px; font-weight: 700;
  color: rgba(91, 42, 6, .55); letter-spacing: 2px;
}
.deco-divider .seg { display: block; border-radius: 999px; }
.deco-divider .seg.gold { width: 56px; height: 4px; background: linear-gradient(90deg, #ffc53d, #f5b301); }
.deco-divider .seg.brown { width: 28px; height: 3px; background: #7a3e12; opacity: .65; }
.deco-divider .seg.pink { width: 14px; height: 3px; background: #f48a8a; opacity: .8; }
</style>
