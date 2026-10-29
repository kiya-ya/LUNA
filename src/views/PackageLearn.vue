<template>
  <div class="min-h-screen bg-soft relative overflow-x-hidden" @click="menuOpen = false">
    <!-- 顶栏：透明 + 返回 + 三横线 -->
    <header class="relative z-50">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <button @click="goBack" class="text-accent font-bold text-sm bg-accent/10 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-all shrink-0">返回</button>
        <h1 class="text-sm sm:text-base font-bold text-accent truncate flex-1 text-center">{{ pkg ? pkg.name : '课程' }}</h1>
        <div class="relative">
          <button @click.stop="menuOpen = !menuOpen" class="p-2 flex flex-col gap-[5px]" aria-label="菜单">
            <i class="block w-[22px] h-[2px] rounded bg-accent"></i>
            <i class="block w-[22px] h-[2px] rounded bg-accent"></i>
            <i class="block w-[22px] h-[2px] rounded bg-accent"></i>
          </button>
          <div v-if="menuOpen" class="absolute right-0 top-full mt-1.5 z-50 bg-[#fffaf2] rounded-2xl shadow-xl border border-white/80 p-2.5 flex flex-col gap-2 min-w-[140px]">
            <button @click="menuOpen = false; goQuery()" class="px-4 py-2.5 text-sm font-bold text-accent bg-white/70 hover:bg-white rounded-xl transition-all">成绩查询</button>
            <button @click="menuOpen = false; goHome()" class="px-4 py-2.5 text-sm font-bold text-accent bg-white/70 hover:bg-white rounded-xl transition-all">学习中心</button>
          </div>
        </div>
      </div>
    </header>

    <!-- 课包切换（自取/外卖式） -->
    <div class="max-w-3xl mx-auto px-4 relative z-10">
      <div class="flex gap-2.5 mb-4">
        <button
          v-for="p in packages" :key="p.id"
          @click="switchPackage(p)"
          class="flex-1 h-11 rounded-2xl font-bold text-sm transition-all"
          :class="pkg && pkg.id === p.id ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white/70 text-accent/60'"
        >{{ p.name }}</button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="glass-card p-10 text-center text-gray-500 font-bold max-w-3xl mx-auto mx-4">加载中…</div>

    <!-- 锁定提示 -->
    <div v-else-if="pkg && pkg.chain_locked" class="max-w-3xl mx-auto px-4">
      <div class="glass-card p-10 text-center">
        <p class="font-extrabold text-gray-700 mb-2">该课包未解锁</p>
        <p class="text-sm text-gray-500">需先通过姐妹团考试</p>
        <button @click="goHome" class="mt-5 px-6 h-11 bg-primary text-white font-bold rounded-2xl">返回学习中心</button>
      </div>
    </div>

    <!-- 点单式布局：左侧大纲 + 右侧课程 -->
    <div v-else-if="pkg" class="max-w-3xl mx-auto px-4 relative z-10 flex gap-3 pb-40">
      <!-- 左侧大纲 -->
      <aside class="w-[86px] shrink-0 sticky top-[60px] self-start max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-hide">
        <button
          v-for="(c, i) in pkg.courses" :key="c.id"
          @click="scrollToCourse(c.id)"
          class="w-full text-left px-2.5 py-3 rounded-xl text-xs font-bold mb-1.5 transition-all leading-snug"
          :class="activeCourseId === c.id ? 'bg-primary text-white shadow' : 'bg-white/60 text-gray-500'"
        >
          <span class="block text-[10px] opacity-70 mb-0.5">{{ i + 1 }}</span>
          {{ c.title }}
        </button>
        <div v-if="pkg.courses.length === 0" class="text-xs text-gray-400 px-2 py-3">暂无课程</div>
      </aside>

      <!-- 右侧课程卡片 -->
      <section class="flex-1 min-w-0 space-y-3">
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
              <p class="text-xs text-gray-400 mt-1">必修<span v-if="course.duration_minutes"> · 约 {{ course.duration_minutes }} 分钟</span></p>
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
      </section>
    </div>

    <!-- 底部学习进度 + 去考试（固定在底部导航上方） -->
    <div v-if="pkg && !pkg.chain_locked" class="fixed left-0 right-0 z-40 px-4" style="bottom: calc(64px + env(safe-area-inset-bottom));">
      <div class="max-w-3xl mx-auto glass-card !rounded-2xl p-3 flex items-center gap-3">
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
        <!-- 去考试按钮（各状态） -->
        <button v-if="pkg.exam_status.status === 'passed'" disabled
          class="h-11 px-4 rounded-xl font-bold text-sm bg-success/10 text-success shrink-0">
          已通过 {{ pkg.exam_status.percentage }}分
        </button>
        <button v-else-if="pkg.exam_status.status === 'cooldown'" disabled
          class="h-11 px-4 rounded-xl font-bold text-sm bg-danger/10 text-danger shrink-0">
          冷却中 {{ cooldownText }}
        </button>
        <button v-else-if="pkg.exam_status.status === 'ready'" @click="startExam" :disabled="startingExam"
          class="h-11 px-5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all">
          {{ startingExam ? '正在进入…' : '去考试' }}
        </button>
        <button v-else disabled
          class="h-11 px-4 rounded-xl font-bold text-sm bg-gray-200 text-gray-400 shrink-0">
          {{ pkg.exam_status.status === 'no_exam' ? '考试未配置' : `还差 ${pkg.exam_status.remaining_courses} 门` }}
        </button>
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

const route = useRoute()
const router = useRouter()
const store = useExamStore()
const showToast = inject('showToast')

const uid = ref('')
const userName = ref('')
const loading = ref(true)
const packages = ref([])
const pkg = ref(null)
const menuOpen = ref(false)
const startingExam = ref(false)
const activeCourseId = ref(null)
const now = ref(Date.now())
let clockTimer = null
let loadedAt = Date.now()
const courseRefs = {}

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

function switchPackage(p) {
  if (pkg.value && pkg.value.id === p.id) return
  router.push(`/learn/package/${p.key}`)
}

function openCourse(course) {
  router.push(`/learn/course/${course.id}`)
}

function goBack() {
  router.push('/learn')
}
function goHome() {
  router.push('/learn')
}
function goQuery() {
  router.push({ path: '/query', query: { uid: uid.value } })
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

async function load() {
  loading.value = true
  try {
    const res = await fetch(`/api/learn/home?uid=${encodeURIComponent(uid.value)}`)
    const data = await res.json()
    if (data.success) {
      packages.value = data.data.packages || []
      loadedAt = Date.now()
      now.value = Date.now()
      const key = route.params.key
      pkg.value = packages.value.find(p => p.key === key) || packages.value[0] || null
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
</style>
