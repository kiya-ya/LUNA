<template>
  <div class="min-h-screen bg-soft relative" @click="menuOpen = false">
    <!-- 顶部栏 -->
    <header class="relative z-20">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img src="/logo.png" alt="点点开黑" class="w-9 h-9 object-contain rounded-xl shadow">
          <div>
            <h1 class="text-base font-bold text-accent leading-tight">考试中心</h1>
            <p class="text-xs text-accent/60">{{ userName || '未登录' }} · UID: {{ uid || '-' }}</p>
          </div>
        </div>
        <div class="relative">
          <button @click.stop="menuOpen = !menuOpen" class="p-2 flex flex-col gap-[5px]" aria-label="菜单">
            <i class="block w-[22px] h-[2px] rounded bg-accent"></i>
            <i class="block w-[22px] h-[2px] rounded bg-accent"></i>
            <i class="block w-[22px] h-[2px] rounded bg-accent"></i>
          </button>
          <div v-if="menuOpen" class="absolute right-0 top-full mt-1.5 z-50 bg-[#fffaf2] rounded-2xl shadow-xl border border-white/80 p-2.5 flex flex-col gap-2 min-w-[140px]">
            <button @click="menuOpen = false; router.push('/learn')" class="px-4 py-2.5 text-sm font-bold text-accent bg-white/70 hover:bg-white rounded-xl transition-all">学习中心</button>
            <button @click="menuOpen = false; logout()" class="px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all">切换账号</button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-5 relative z-10 pb-24">
      <div v-if="loading" class="glass-card p-10 text-center text-gray-400 font-bold">加载中…</div>

      <div v-else class="space-y-4">
        <!-- 考试卡：左文右人物抠图（与课包卡同款） -->
        <div v-for="pkg in packages" :key="pkg.id"
          class="exam-card relative rounded-3xl overflow-hidden border-2 transition-all"
          :class="[pkg.key === 'sister' ? 'pkg-bg-sister' : 'pkg-bg-trainer',
                   pkg.exam_status.status === 'ready' ? 'border-secondary shadow-xl shadow-secondary/20' : 'border-white/40']">
          <img :src="pkg.key === 'sister' ? '/img/pkg-sister-cutout.png' : '/img/pkg-trainer-cutout.png'" :alt="pkg.name"
            class="exam-figure">
          <div class="relative z-10 p-4 sm:p-5">
            <h2 class="text-base sm:text-lg font-extrabold leading-tight drop-shadow-sm"
              :class="pkg.key === 'sister' ? 'text-[#5b2a06]' : 'text-white'">{{ pkg.exam_status.exam_name || pkg.name + '考试' }}</h2>
            <p class="text-xs mt-1"
              :class="pkg.key === 'sister' ? 'text-[#5b2a06]/60' : 'text-white/60'">60 分及格 · 一次机会 · 挂科冷却 {{ pkg.cooldown_days }} 天</p>

            <div class="mt-3 exam-status">
              <!-- 已通过 -->
              <div v-if="pkg.exam_status.status === 'passed'" class="status-box status-pass">
                <div>
                  <p class="font-extrabold text-success">已通过</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ pkg.exam_status.exam_name }} · {{ pkg.exam_status.total_score }}/{{ pkg.exam_status.max_score }} 分</p>
                </div>
                <span class="text-2xl font-extrabold text-success">{{ pkg.exam_status.percentage }}<span class="text-sm">分</span></span>
              </div>
              <!-- 冷却中 -->
              <div v-else-if="pkg.exam_status.status === 'cooldown'" class="status-box status-cool text-center">
                <p class="font-extrabold text-danger mb-1">上次未及格（{{ pkg.exam_status.last_percentage }}分）</p>
                <p class="text-sm text-gray-600">冷却剩余 <span class="font-extrabold text-danger tabular-nums">{{ cooldownText(pkg) }}</span></p>
              </div>
              <!-- 可考 -->
              <button v-else-if="pkg.exam_status.status === 'ready'" @click="startExam(pkg)" :disabled="startingExam"
                class="w-full h-[52px] bg-gradient-to-r from-secondary to-amber-400 text-[#2A2140] text-lg font-extrabold rounded-2xl shadow-lg shadow-secondary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60">
                {{ startingExam ? '正在进入…' : '开始考试' }}
              </button>
              <!-- 未解锁 -->
              <button v-else disabled class="w-full h-[52px] bg-white/60 text-gray-500 font-bold rounded-2xl cursor-not-allowed">
                {{ pkg.chain_locked ? '需先通过姐妹团考试' : pkg.exam_status.status === 'no_exam' ? '考试未配置，请联系管理员' : `完成全部必修课后解锁（还差 ${pkg.exam_status.remaining_courses} 门）` }}
              </button>
            </div>
          </div>
        </div>

        <div class="glass-card p-4 text-center">
          <p class="text-xs text-gray-400">考完出分后可直接前往「我的」查看成绩明细并申请资质</p>
          <button @click="router.push('/mine')" class="mt-2 text-sm font-bold text-primary">去「我的」看看 →</button>
        </div>
      </div>
    </main>

    <BottomNav active="exam" :uid="uid" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject } from 'vue'
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
const menuOpen = ref(false)
const packages = ref([])
const startingExam = ref(false)
const now = ref(Date.now())
let clockTimer = null
let loadedAt = Date.now()

function logout() {
  localStorage.removeItem('learn_user')
  store.setUserInfo('', '')
  location.href = PORTAL_URL
}

function cooldownText(pkg) {
  if (pkg.exam_status.status !== 'cooldown') return ''
  const remain = Math.max(0, pkg.exam_status.remaining_seconds - Math.floor((now.value - loadedAt) / 1000))
  const d = Math.floor(remain / 86400)
  const h = Math.floor((remain % 86400) / 3600)
  const m = Math.floor((remain % 3600) / 60)
  if (d > 0) return `${d}天${h}时`
  if (h > 0) return `${h}时${m}分`
  return `${m}分`
}

async function startExam(pkg) {
  if (!pkg.exam_config_id) return
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

onMounted(async () => {
  let name = store.userName
  let id = store.userPhone
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
  try {
    const res = await fetch(`/api/learn/home?uid=${encodeURIComponent(id)}`)
    const data = await res.json()
    if (data.success) {
      packages.value = data.data.packages || []
      loadedAt = Date.now()
      now.value = Date.now()
    }
  } catch (e) {
    showToast('网络错误，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
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
.glass-soft {
  background: rgba(247, 243, 252, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* 考试卡：左文右人物抠图（与课包卡同款） */
.exam-card { min-height: 150px; }
.pkg-bg-sister { background: linear-gradient(160deg, #fbc2eb 0%, #f8a5c8 55%, #f48a8a 100%); }
.pkg-bg-trainer { background: linear-gradient(160deg, #a18cd1 0%, #8E6BC8 55%, #7451A8 100%); }
.exam-figure {
  position: absolute; right: -8px; bottom: 0; z-index: 1;
  height: 96%; width: auto; pointer-events: none;
  filter: drop-shadow(0 6px 12px rgba(20, 12, 40, .25));
}
.exam-status { max-width: 62%; }

/* 状态盒 */
.status-box {
  border-radius: 1rem; padding: 12px 14px;
  background: rgba(255, 255, 255, .75);
  backdrop-filter: blur(8px);
}
.status-pass { display: flex; align-items: center; justify-content: space-between; }
</style>
