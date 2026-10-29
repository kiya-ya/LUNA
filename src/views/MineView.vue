<template>
  <div class="min-h-screen bg-soft relative">
    <!-- 顶部栏 -->
    <header class="relative z-10 sticky top-0 glass-soft">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <span class="w-14 shrink-0"></span>
        <h1 class="text-sm sm:text-base font-bold text-accent truncate flex-1 text-center">我的</h1>
        <span class="w-14 shrink-0"></span>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-5 relative z-10 pb-24">
      <!-- 账号卡 -->
      <div class="glass-card p-5 mb-4 flex items-center gap-3">
        <img src="/logo.png" alt="头像" class="w-12 h-12 rounded-2xl shadow">
        <div class="flex-1 min-w-0">
          <p class="font-extrabold text-gray-900">{{ userName || '未填写昵称' }}</p>
          <p class="text-xs text-gray-400 mt-0.5">UID: {{ uid }}</p>
        </div>
        <button @click="logout" class="h-9 px-4 rounded-xl font-bold text-xs bg-red-600 text-white hover:bg-red-700 transition-all shrink-0">切换账号</button>
      </div>

      <!-- 我的资质 -->
      <div class="glass-card p-5 mb-4">
        <h3 class="text-base font-extrabold text-gray-900 mb-3">我的资质</h3>
        <div v-for="row in applyRows" :key="row.key" class="flex items-center justify-between gap-3 py-3 border-t first:border-0 border-gray-100">
          <div>
            <p class="font-bold text-gray-800 text-sm">{{ row.label }}</p>
            <p v-if="row.app && row.app.status === 'rejected'" class="text-xs text-danger mt-0.5">驳回原因：{{ row.app.reason || '未填写' }}</p>
          </div>
          <span class="text-xs font-bold shrink-0" :class="row.cls">{{ row.text }}</span>
        </div>
        <p class="text-xs text-gray-400 mt-3">考试通过后在「查询」页提交资质申请，管理员审核通过即激活</p>
      </div>

      <!-- 统一入口 -->
      <div class="glass-card p-5">
        <h3 class="text-base font-extrabold text-gray-900 mb-2">更多功能</h3>
        <p class="text-xs text-gray-400 mb-3">绑定妹妹、名额管理等功能在统一入口（需 UID + 密码登录）</p>
        <button @click="goPortal" class="w-full h-11 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-2xl hover:shadow-lg transition-all">前往统一入口</button>
      </div>
    </main>

    <BottomNav active="mine" :uid="uid" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExamStore } from '../stores/exam.js'
import BottomNav from '../components/BottomNav.vue'

// 统一入口（培训师系统 v2）
const PORTAL_URL = 'http://192.168.100.117:5000/portal-v2'

const router = useRouter()
const store = useExamStore()

const uid = ref('')
const userName = ref('')
const applyRows = ref([
  { key: 'sister', label: '姐妹团姐姐', app: null, text: '加载中…', cls: 'text-gray-400' },
  { key: 'trainer', label: '培训师', app: null, text: '加载中…', cls: 'text-gray-400' },
])

const STATUS_MAP = {
  pending: ['审核中', 'text-amber-600'],
  approved: ['已通过（已激活）', 'text-success'],
  rejected: ['已驳回', 'text-danger'],
}

async function loadStatus() {
  try {
    const res = await fetch(`/api/apply/status?uid=${encodeURIComponent(uid.value)}`)
    const data = await res.json()
    const d = data.success ? data.data : {}
    applyRows.value = applyRows.value.map((row) => {
      const app = d[row.key] || null
      if (!app) return { ...row, app: null, text: '未申请', cls: 'text-gray-400' }
      const [text, cls] = STATUS_MAP[app.status] || [app.status, 'text-gray-400']
      return { ...row, app, text, cls }
    })
  } catch (e) { /* 忽略 */ }
}

function goPortal() {
  location.href = PORTAL_URL
}

function logout() {
  localStorage.removeItem('learn_user')
  store.setUserInfo('', '')
  router.push('/')
}

onMounted(() => {
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
    router.push('/')
    return
  }
  userName.value = name
  uid.value = id
  loadStatus()
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
