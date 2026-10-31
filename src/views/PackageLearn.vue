<template>
  <div class="min-h-screen bg-soft relative" @click="menuOpen = false">
    <!-- 顶栏：透明 + 三横线 -->
    <header class="relative z-50">
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
            <i class="block w-[22px] h-[2px] rounded bg-white"></i>
            <i class="block w-[22px] h-[2px] rounded bg-white"></i>
          </button>
          <div v-if="menuOpen" class="absolute right-0 top-full mt-1.5 z-50 bg-[#fffaf2] rounded-2xl shadow-xl border border-white/80 p-2.5 flex flex-col gap-2 min-w-[140px]">
            <button @click="menuOpen = false; router.push('/mine')" class="px-4 py-2.5 text-sm font-bold text-accent bg-white/70 hover:bg-white rounded-xl transition-all">成绩与申请</button>
            <button @click="menuOpen = false; logout()" class="px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all">切换账号</button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-3xl w-full mx-auto px-4 pt-1 pb-44 relative z-10">
      <!-- 加载中 -->
      <div v-if="loading" class="course-card p-10 text-center text-gray-400 font-bold">课程加载中…</div>

      <template v-else>
        <!-- 顶部轮播（占位图，后续可换重点提示/注意事项） -->
        <div class="banner-carousel mb-4" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
          <div class="banner-track" :style="{ transform: `translateX(-${bannerIdx * 100}%)` }">
            <div v-for="(b, i) in banners" :key="i" class="banner-slide">
              <img :src="b.img" :alt="b.alt" class="w-full h-full object-cover">
              <div v-if="b.text" class="banner-text">{{ b.text }}</div>
            </div>
          </div>
          <div class="banner-dots">
            <i v-for="(b, i) in banners" :key="i" :class="{ on: bannerIdx === i }" @click="bannerIdx = i"></i>
          </div>
        </div>

        <!-- 上部：双大卡选课包（背景图 + 深色渐变罩） -->
        <div class="grid grid-cols-2 gap-3 sm:gap-4 mb-2">
          <div
            v-for="p in packages" :key="p.id"
            @click="selectPackage(p)"
            class="pkg-card relative cursor-pointer transition-all duration-300 border-2 rounded-3xl overflow-hidden"
            :class="[pkg && pkg.id === p.id ? 'border-secondary shadow-xl shadow-secondary/20' : 'border-white/10 hover:border-white/25',
                     p.key === 'sister' ? 'pkg-bg-sister' : 'pkg-bg-trainer']"
          >
            <img :src="p.key === 'sister' ? '/img/pkg-sister-cutout.png' : '/img/pkg-trainer-cutout.png'" :alt="p.name"
              class="pkg-figure">
            <div class="relative z-10 p-3.5 sm:p-4">
              <h2 class="text-sm sm:text-base font-extrabold leading-tight drop-shadow"
                :class="p.key === 'sister' ? 'text-[#5b2a06]' : 'text-white'">{{ p.name }}</h2>
              <div class="mt-2 mb-2">
                <div class="flex justify-between text-xs font-bold mb-1">
                  <span :class="p.key === 'sister' ? 'text-[#5b2a06]/70' : 'text-white/70'">课程进度</span>
                  <span :class="p.key === 'sister' ? 'text-[#5b2a06]' : 'text-white'">{{ p.completed_courses }}/{{ p.total_courses }}</span>
                </div>
                <div class="h-2 bg-black/15 rounded-full overflow-hidden pkg-progress-bar">
                  <div class="h-full rounded-full transition-all duration-500"
                    :class="p.all_completed ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-gradient-to-r from-secondary to-amber-300'"
                    :style="{ width: p.total_courses ? (p.completed_courses / p.total_courses * 100) + '%' : '0%' }"></div>
                </div>
              </div>
              <div>
                <span v-if="p.chain_locked" class="text-xs font-bold px-2.5 py-1 rounded-full bg-black/40 text-white/70">需先通过姐妹团考试</span>
                <span v-else-if="p.exam_status.status === 'passed'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-success/80 text-white">已通过 {{ p.exam_status.percentage }}分</span>
                <span v-else-if="p.exam_status.status === 'ready'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-secondary text-[#2A2140] animate-pulse">考试已解锁</span>
                <span v-else-if="p.exam_status.status === 'cooldown'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-danger/80 text-white">冷却中</span>
                <span v-else-if="p.exam_status.status === 'no_exam'" class="text-xs font-bold px-2.5 py-1 rounded-full bg-black/40 text-white/50">未配置考试</span>
                <span v-else class="text-xs font-bold px-2.5 py-1 rounded-full bg-black/40 text-white/80">完成课程解锁考试</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 过渡装饰（吸顶） -->
        <div class="deco-divider">
          <span class="seg gold"></span>
          <em>{{ pkg ? pkg.name + ' · 课程明细' : '课程明细' }}</em>
          <span class="seg purple"></span>
          <span class="seg pink"></span>
        </div>

        <!-- 下部：点单式课程明细 -->
        <div v-if="pkg && pkg.chain_locked" class="course-card p-10 text-center">
          <p class="font-extrabold text-gray-700 mb-2">{{ pkg.name }}未解锁</p>
          <p class="text-sm text-gray-400">需先通过姐妹团考试</p>
        </div>
        <div v-else-if="pkg" class="flex gap-3 items-start">
          <!-- 左侧大纲：吸顶 + 内部滚动 -->
          <aside ref="asideRef" class="w-[92px] shrink-0 sticky sidebar-stick overflow-y-auto scrollbar-hide pb-2 -ml-4 bg-[#F6F3F0] border-r border-black/5 rounded-none">
            <template v-for="group in courseGroups" :key="group.name">
              <div class="px-1.5 pt-2 pb-1.5">
              <span class="block text-center text-[11px] font-extrabold py-1 rounded-lg tracking-widest"
                :class="group.name === '必修课' ? 'bg-secondary text-[#2A2140]' : 'bg-[#2A2140]/70 text-white'">{{ group.name }}</span>
            </div>
              <button
                v-for="c in group.list" :key="c.id"
                @click="scrollToCourse(c.id)"
                class="side-item"
                :class="{ on: activeCourseId === c.id }"
              >{{ c.title }}</button>
            </template>
            <div v-if="pkg.courses.length === 0" class="text-xs text-white/50 px-2 py-3">暂无课程</div>
          </aside>

          <!-- 右侧课程卡片 -->
          <section ref="listRef" class="flex-1 min-w-0 pb-3 pr-0.5">
            <div class="space-y-3">
              <div v-if="pkg.courses.length === 0" class="course-card p-8 text-center text-gray-400 font-bold">课程筹备中，敬请期待</div>
              <div
                v-for="(course, idx) in pkg.courses" :key="course.id"
                :ref="el => setCourseRef(course.id, el)"
                class="course-card p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
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
                      <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-secondary to-amber-300 rounded-full" :style="{ width: course.progress_percent + '%' }"></div>
                      </div>
                      <span class="text-xs font-bold text-secondary">{{ Math.floor(course.progress_percent) }}%</span>
                    </div>
                  </div>
                </div>
                <button class="mt-3 w-full h-10 rounded-xl font-bold text-sm transition-all"
                  :class="course.completed ? 'bg-success/10 text-success' : 'bg-secondary text-[#2A2140] hover:bg-amber-400'">
                  {{ course.completed ? '复习一遍' : course.progress_percent > 0 ? '继续学习' : '开始学习' }}
                </button>
              </div>
            </div>
          </section>
        </div>
      </template>
    </main>

    <!-- 回到顶部 -->
    <button v-if="pkg && !pkg.chain_locked" @click="scrollTop"
      class="fixed right-4 z-40 w-10 h-10 rounded-full bg-white/85 backdrop-blur border border-white/70 shadow-lg text-accent font-bold text-lg hover:scale-105 transition-all"
      style="bottom: calc(150px + env(safe-area-inset-bottom));" title="回到顶部">↑</button>

    <!-- 底部固定栏：成绩奖杯图标 + 学习进度 + 去考试 -->
    <div v-if="pkg" class="fixed left-0 right-0 z-40 px-4" style="bottom: calc(64px + env(safe-area-inset-bottom));">
      <div class="max-w-3xl mx-auto bottom-bar p-3 flex items-center gap-3">
        <button @click="showRecords = true"
          class="w-11 h-11 shrink-0 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center hover:bg-secondary/25 transition-all"
          title="我的成绩记录">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
            <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 5H4a2 2 0 0 0 2 4h1M17 5h3a2 2 0 0 1-2 4h-1"/>
          </svg>
        </button>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between text-xs font-bold mb-1">
            <span class="text-gray-500">学习进度</span>
            <span :class="pkg.all_completed ? 'text-success' : 'text-secondary'">{{ pkg.completed_courses }}/{{ pkg.total_courses }}</span>
          </div>
          <div class="h-2 bg-gray-200/70 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500"
              :class="pkg.all_completed ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-gradient-to-r from-secondary to-amber-300'"
              :style="{ width: pkg.total_courses ? (pkg.completed_courses / pkg.total_courses * 100) + '%' : '0%' }"></div>
          </div>
        </div>
        <button v-if="pkg.exam_status.status === 'passed'" disabled
          class="h-11 px-4 rounded-xl font-bold text-sm bg-success/15 text-success shrink-0">已通过 {{ pkg.exam_status.percentage }}分</button>
        <button v-else-if="pkg.exam_status.status === 'cooldown'" disabled
          class="h-11 px-4 rounded-xl font-bold text-sm bg-danger/15 text-danger shrink-0">冷却中 {{ cooldownText }}</button>
        <button v-else-if="pkg.exam_status.status === 'ready'" @click="startExam" :disabled="startingExam"
          class="h-11 px-5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-secondary to-amber-400 text-[#2A2140] shadow-lg shadow-secondary/30 shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all">
          {{ startingExam ? '正在进入…' : '去考试' }}
        </button>
        <button v-else disabled class="h-11 px-4 rounded-xl font-bold text-sm bg-white/10 text-white/40 shrink-0">
          {{ pkg.chain_locked ? '未解锁' : pkg.exam_status.status === 'no_exam' ? '考试未配置' : `还差 ${pkg.exam_status.remaining_courses} 门` }}
        </button>
      </div>
    </div>

    <!-- 成绩记录弹窗 -->
    <div v-if="showRecords" class="fixed inset-0 z-[70] flex items-center justify-center p-4" style="background:rgba(20,12,40,.55)" @click.self="showRecords = false">
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
        <button @click="router.push('/mine')" class="mt-4 w-full h-11 bg-primary/10 text-primary font-bold rounded-2xl hover:bg-primary/20 transition-all">查看答题明细</button>
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

// 顶部轮播（图像占位，后续可换重点提示/注意事项）
const banners = ref([
  { img: '/img/banner-learn.jpg', alt: '新人培训中心', text: '' },
  { img: '/img/pkg-sister.jpg', alt: '姐妹团', text: '' },
  { img: '/img/pkg-trainer.jpg', alt: '培训师', text: '' },
])
const bannerIdx = ref(0)
let bannerTimer = null
let touchStartX = 0
function onTouchStart(e) { touchStartX = e.touches[0].clientX }
function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) < 40) return
  if (dx < 0) bannerIdx.value = (bannerIdx.value + 1) % banners.length
  else bannerIdx.value = (bannerIdx.value - 1 + banners.length) % banners.length
}

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
  bannerTimer = setInterval(() => { bannerIdx.value = (bannerIdx.value + 1) % banners.value.length }, 4000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (bannerTimer) clearInterval(bannerTimer)
})
</script>

<style scoped>
/* 浅色背景（内页弱化） */
.bg-soft {
  background: linear-gradient(160deg, #EFE9F8 0%, #FAF6FD 50%, #FDF8EE 100%);
}
/* 底部栏浅色玻璃 */
.bottom-bar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-radius: 1.5rem;
}

/* 深色玻璃卡 */
.glass-dark {
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(20, 12, 40, 0.25);
  border-radius: 1.5rem;
}

/* 课程明细卡：浅色实卡（深色背景上的高对比） */
.course-card {
  background: #FFF9EE;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 1.25rem;
  box-shadow: 0 6px 20px rgba(20, 12, 40, 0.28);
}

/* 课包卡：上文下人物抠图（KFC 式） */
.pkg-card { min-height: 150px; }
.pkg-bg-sister { background: linear-gradient(160deg, #fbc2eb 0%, #f8a5c8 55%, #f48a8a 100%); }
.pkg-bg-trainer { background: linear-gradient(160deg, #a18cd1 0%, #8E6BC8 55%, #7451A8 100%); }
.pkg-figure {
  position: absolute; right: -6px; bottom: 0; z-index: 1;
  height: 88%; width: auto; pointer-events: none;
  filter: drop-shadow(0 6px 12px rgba(20, 12, 40, .3));
}
.pkg-progress-bar { width: 58%; }

/* 顶部轮播 */
.banner-carousel {
  position: relative; border-radius: 1.5rem; overflow: hidden;
  aspect-ratio: 21/9; box-shadow: 0 10px 30px rgba(20, 12, 40, .35);
}
.banner-track {
  display: flex; height: 100%;
  transition: transform .5s ease;
}
.banner-slide { position: relative; width: 100%; flex-shrink: 0; height: 100%; }
.banner-slide img { display: block; }
.banner-text {
  position: absolute; left: 14px; bottom: 12px; z-index: 2;
  color: #fff; font-weight: 800; font-size: 15px; text-shadow: 0 2px 8px rgba(0,0,0,.5);
}
.banner-dots {
  position: absolute; right: 12px; bottom: 10px; z-index: 2;
  display: flex; gap: 5px;
}
.banner-dots i {
  width: 6px; height: 6px; border-radius: 999px;
  background: rgba(255, 255, 255, .45); cursor: pointer; transition: all .2s;
}
.banner-dots i.on { width: 16px; background: #F5B301; }

/* 过渡装饰（吸顶，深色版） */
.deco-divider {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 8px 0 10px;
  position: sticky; top: 0; z-index: 30;
  background: linear-gradient(160deg, #EFE9F8 0%, #F8F2FC 60%, #FBF5EA 100%);
}
.deco-divider em {
  font-style: normal; font-size: 11px; font-weight: 700;
  color: rgba(91, 42, 6, .55); letter-spacing: 2px;
}
.deco-divider .seg { display: block; border-radius: 999px; }
.deco-divider .seg.gold { width: 56px; height: 4px; background: linear-gradient(90deg, #ffc53d, #f5b301); }
.deco-divider .seg.purple { width: 28px; height: 3px; background: #B39DF0; opacity: .8; }
.deco-divider .seg.pink { width: 14px; height: 3px; background: #f48a8a; opacity: .9; }

/* 侧边栏通栏行（贴合页面左缘，KFC 式） */
.side-item {
  display: block; width: 100%; text-align: center;
  padding: 14px 4px; font-size: 12px; font-weight: 700; line-height: 1.4;
  color: rgba(42, 33, 64, .65); background: transparent; border: none; cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, .04);
  border-left: 3px solid transparent;
  transition: all .15s ease;
}
.side-item.on {
  background: #fff; color: #2A2140;
  border-left-color: #F5B301;
}

/* 左侧大纲吸顶（过渡栏下方） */
.sidebar-stick { top: 46px; max-height: calc(100vh - 200px); }
/* 课程卡定位时避开吸顶栏 */
section .course-card { scroll-margin-top: 56px; }

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { scrollbar-width: none; }
</style>
