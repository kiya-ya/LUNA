<template>
  <div class="min-h-screen bg-soft relative">
    <!-- 顶部栏 -->
    <header class="relative z-10 sticky top-0 glass-soft">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <span class="w-14 shrink-0"></span>
        <h1 class="text-sm sm:text-base font-bold text-accent truncate flex-1 text-center">考试中心</h1>
        <span class="w-14 shrink-0"></span>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-5 relative z-10 pb-24">
      <div v-if="loading" class="glass-card p-10 text-center text-gray-500 font-bold">加载中…</div>

      <div v-else class="space-y-4">
        <div v-for="pkg in packages" :key="pkg.id" class="glass-card p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center text-[11px] font-extrabold text-white shadow-inner"
              :class="pkg.key === 'sister' ? 'bg-gradient-to-br from-pink-300 to-rose-400' : 'bg-gradient-to-br from-indigo-300 to-purple-400'">
              <svg v-if="pkg.key === 'sister'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px"><circle cx="8.5" cy="8" r="3.2"/><circle cx="16" cy="9" r="2.6"/><path d="M3.5 19c1-3.2 3-4.5 5-4.5s4 1.3 5 4.5"/><path d="M14.2 15.2c2.3.2 4 1.6 4.8 4"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px"><path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11.2v4.3c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-4.3"/><path d="M21 9.2v5"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-extrabold text-gray-900">{{ pkg.exam_name || pkg.name + '考试' }}</p>
              <p class="text-xs text-gray-400 mt-0.5">60 分及格 · 一次机会 · 挂科冷却 {{ pkg.cooldown_days }} 天</p>
            </div>
          </div>

          <!-- 已通过 -->
          <div v-if="pkg.exam_status.status === 'passed'" class="bg-success/5 border border-success/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p class="font-extrabold text-success">已通过</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ pkg.exam_status.exam_name }} · {{ pkg.exam_status.total_score }}/{{ pkg.exam_status.max_score }} 分</p>
            </div>
            <span class="text-2xl font-extrabold text-success">{{ pkg.exam_status.percentage }}<span class="text-sm">分</span></span>
          </div>
          <!-- 冷却中 -->
          <div v-else-if="pkg.exam_status.status === 'cooldown'" class="bg-danger/5 border border-danger/20 rounded-2xl p-4 text-center">
            <p class="font-extrabold text-danger mb-1">上次未及格（{{ pkg.exam_status.last_percentage }}分）</p>
            <p class="text-sm text-gray-600">冷却剩余 <span class="font-extrabold text-danger tabular-nums">{{ cooldownText(pkg) }}</span></p>
          </div>
          <!-- 可考 -->
          <button v-else-if="pkg.exam_status.status === 'ready'" @click="startExam(pkg)" :disabled="startingExam"
            class="w-full h-[52px] bg-gradient-to-r from-primary to-secondary text-white text-lg font-extrabold rounded-2xl shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60">
            {{ startingExam ? '正在进入…' : '开始考试' }}
          </button>
          <!-- 未解锁 -->
          <button v-else disabled class="w-full h-[52px] bg-gray-200 text-gray-400 font-bold rounded-2xl cursor-not-allowed">
            {{ pkg.chain_locked ? '需先通过姐妹团考试' : pkg.exam_status.status === 'no_exam' ? '考试未配置，请联系管理员' : `完成全部必修课后解锁（还差 ${pkg.exam_status.remaining_courses} 门）` }}
          </button>
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

const route = useRoute()
const router = useRouter()
const store = useExamStore()
const showToast = inject('showToast')

const uid = ref('')
const userName = ref('')
const loading = ref(true)
const packages = ref([])
const startingExam = ref(false)
const now = ref(Date.now())
let clockTimer = null
let loadedAt = Date.now()

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
</style>
