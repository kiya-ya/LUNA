<template>
  <div class="min-h-screen bg-white relative" @click="menuOpen = false">
    <!-- 顶部栏 -->
    <header class="absolute top-0 left-0 right-0 z-20">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img src="/logo.png" alt="点点开黑" class="w-9 h-9 object-contain rounded-xl shadow">
          <div>
            <h1 class="text-base font-bold text-white leading-tight">我的</h1>
            <p class="text-xs text-white/70">{{ userName || '未登录' }} · UID: {{ uid || '-' }}</p>
          </div>
        </div>
        <div class="relative">
          <button @click.stop="menuOpen = !menuOpen" class="p-2 flex flex-col gap-[5px]" aria-label="菜单">
            <i class="block w-[22px] h-[2px] rounded bg-white"></i>
            <i class="block w-[22px] h-[2px] rounded bg-white"></i>
            <i class="block w-[22px] h-[2px] rounded bg-white"></i>
          </button>
          <div v-if="menuOpen" class="absolute right-0 top-full mt-1.5 z-50 bg-[#fffaf2] rounded-2xl shadow-xl border border-white/80 p-2.5 flex flex-col gap-2 min-w-[140px]">
            <button @click="menuOpen = false; router.push('/learn')" class="px-4 py-2.5 text-sm font-bold text-accent bg-white/70 hover:bg-white rounded-xl transition-all">学习中心</button>
            <button @click="menuOpen = false; logout()" class="px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all">切换账号</button>
          </div>
        </div>
      </div>
    </header>

    <!-- 顶部粉橙账号区 -->
    <div class="mine-hero relative z-10">
      <div class="max-w-3xl mx-auto px-4 pt-16 pb-14 flex items-center gap-3">
        <img src="/logo.png" alt="头像" class="w-14 h-14 rounded-2xl shadow-lg border-2 border-white/60">
        <div class="flex-1 min-w-0">
          <p class="font-extrabold text-white text-lg drop-shadow">{{ userName || '未填写昵称' }}</p>
          <p class="text-xs text-white/75 mt-0.5">UID: {{ uid }}</p>
        </div>
        
      </div>
    </div>

    <!-- 下方白底功能区 -->
    <main class="mine-body max-w-3xl mx-auto px-4 relative z-10 pb-24">

      <!-- 我的资质进度（学习 → 考试 → 申请 → 激活） -->
      <div class="glass-card p-5 mb-4 -mt-10">
        <h3 class="text-base font-extrabold text-gray-900 mb-1">我的资质进度</h3>
        <p class="text-xs text-gray-400 mb-4">学习 → 考试 → 申请 → 激活，四步走完即获得资质</p>
        <div v-for="pkg in applyPackages" :key="pkg.key" class="py-3 border-t first:border-0 border-gray-100">
          <div class="flex items-center justify-between gap-3 mb-2.5">
            <p class="font-bold text-gray-800 text-sm">{{ pkg.name }}</p>
            <button
              class="h-9 px-4 rounded-xl font-bold text-xs shrink-0 transition-all"
              :disabled="!pkg.canApply"
              :class="pkg.canApply ? 'bg-gradient-to-r from-primary to-secondary text-white shadow' : 'bg-gray-100 text-gray-400'"
              @click="applyFor(pkg)"
            >{{ pkg.btnText }}</button>
          </div>
          <div class="flex items-center">
            <template v-for="(step, i) in pkg.steps" :key="i">
              <div class="flex flex-col items-center gap-1 shrink-0">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold"
                  :class="step.done ? 'bg-success text-white' : step.active ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'">
                  {{ step.done ? '✓' : i + 1 }}
                </div>
                <span class="text-[10px] font-bold" :class="step.done ? 'text-success' : step.active ? 'text-primary' : 'text-gray-400'">{{ step.label }}</span>
              </div>
              <div v-if="i < pkg.steps.length - 1" class="flex-1 h-0.5 mx-1 rounded"
                :class="step.done ? 'bg-success/60' : 'bg-gray-200'"></div>
            </template>
          </div>
          <p v-if="pkg.app && pkg.app.status === 'rejected'" class="text-xs text-danger mt-2">已驳回：{{ pkg.app.reason || '未填写原因' }}（可重新申请）</p>
          <p v-else-if="pkg.app && pkg.app.status === 'pending'" class="text-xs text-primary mt-2">申请已提交（{{ pkg.app.created_at }}），等待管理员审核</p>
        </div>
      </div>

      <!-- 我的成绩 -->
      <div class="glass-card p-5 mb-4">
        <h3 class="text-base font-extrabold text-gray-900 mb-3">我的成绩</h3>
        <div v-if="results === null" class="text-center text-gray-400 py-6 text-sm">加载中…</div>
        <div v-else-if="results.length === 0" class="text-center text-gray-400 py-6 text-sm font-bold">暂无考试记录</div>
        <div v-else class="space-y-2.5">
          <div v-for="r in results" :key="r.id" class="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer hover:shadow-md transition-all" @click="showQueryDetail(r)">
            <div>
              <p class="font-bold text-gray-800 text-sm">{{ r.exam_name || '未知试卷' }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ formatTime(r.created_at) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-extrabold" :class="r.percentage >= 60 ? 'text-success' : 'text-danger'">{{ r.percentage }}分</span>
              <span class="text-xs font-bold px-2 py-1 rounded-full" :class="r.percentage >= 60 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'">{{ r.percentage >= 60 ? '及格' : '未及格' }}</span>
            </div>
          </div>
          <p class="text-xs text-gray-400 text-center pt-1">点击记录可查看每题明细</p>
        </div>
      </div>

      <!-- 统一入口 -->
      <div class="glass-card p-5">
        <h3 class="text-base font-extrabold text-gray-900 mb-2">更多功能</h3>
        <p class="text-xs text-gray-400 mb-3">绑定妹妹、名额管理等功能在统一入口（需 UID + 密码登录）</p>
        <button @click="goPortal" class="w-full h-11 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-2xl hover:shadow-lg transition-all">前往统一入口</button>
        <button @click="logout" class="mt-3 w-full h-11 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all">切换账号</button>
      </div>
    </main>

    <!-- 答题明细弹窗 -->
    <Transition name="fade-scale">
      <div v-if="queryDetailResult" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" @click.self="queryDetailResult = null">
        <div class="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-gray-900">答题明细</h3>
            <button @click="queryDetailResult = null" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">×</button>
          </div>
          <div class="mb-5 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-primary/10">
            <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span><span class="text-gray-500">试卷：</span><span class="font-bold text-gray-900">{{ queryDetailResult.exam_name || '未知试卷' }}</span></span>
              <span><span class="text-gray-500">总分：</span><span class="font-bold" :class="queryDetailResult.percentage >= 60 ? 'text-success' : 'text-danger'">{{ queryDetailResult.total_score }} / {{ queryDetailResult.max_score }}</span></span>
              <span><span class="text-gray-500">正确率：</span><span class="font-bold">{{ queryDetailResult.percentage }}%</span></span>
              <span><span class="text-gray-500">时间：</span><span class="font-bold">{{ formatTime(queryDetailResult.created_at) }}</span></span>
            </div>
          </div>
          <div v-if="queryDetailResult.details && queryDetailResult.details.length > 0" class="space-y-3">
            <div v-for="(d, idx) in queryDetailResult.details" :key="idx" class="p-4 rounded-2xl border-2 transition-all" :class="d.is_correct ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <span class="text-xs font-bold text-gray-400 mr-2">{{ idx + 1 }}.</span>
                  <span class="text-sm font-bold text-gray-800">{{ d.title || '题目 ' + d.q_id }}</span>
                </div>
                <span class="text-xs px-2.5 py-1 rounded-full font-bold ml-2 shrink-0" :class="d.is_correct ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'">{{ d.is_correct ? '正确' : '错误' }}</span>
              </div>
              <div class="grid grid-cols-1 gap-2 text-sm pl-5">
                <div><span class="text-gray-500">你的答案：</span><span class="font-bold break-all" :class="d.is_correct ? 'text-success' : 'text-danger'">{{ formatAnswerDisplay(d.user_answer) || '(未作答)' }}</span></div>
                <div><span class="text-gray-500">正确答案：</span><span class="font-bold text-success break-all">{{ formatAnswerDisplay(d.correct_answer) || '-' }}</span></div>
                <div v-if="d.key_points"><span class="text-gray-500">解析：</span><span class="text-gray-600 break-all whitespace-pre-wrap">{{ d.key_points }}</span></div>
                <div v-if="d.feedback"><span class="text-gray-500">反馈：</span><span class="text-gray-600 break-all">{{ d.feedback }}</span></div>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-400 py-8">暂无答题明细</div>
        </div>
      </div>
    </Transition>

    <BottomNav active="mine" :uid="uid" />
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExamStore } from '../stores/exam.js'
import BottomNav from '../components/BottomNav.vue'

// 统一入口（培训师系统 v2）
const PORTAL_URL = 'http://192.168.100.117:5000/portal-v2'

const router = useRouter()
const route = useRoute()
const store = useExamStore()
const showToast = inject('showToast')

const uid = ref('')
const userName = ref('')
const applyPackages = ref([])
const menuOpen = ref(false)
const results = ref(null)
const queryDetailResult = ref(null)

async function loadAll() {
  try {
    const [homeRes, statusRes, resultsRes] = await Promise.all([
      fetch(`/api/learn/home?uid=${encodeURIComponent(uid.value)}`).then(r => r.json()),
      fetch(`/api/apply/status?uid=${encodeURIComponent(uid.value)}`).then(r => r.json()),
      fetch(`/api/results/by-uid?uid=${encodeURIComponent(uid.value)}`).then(r => r.json()),
    ])
    const pkgs = homeRes.success ? homeRes.data.packages : []
    const apps = statusRes.success ? statusRes.data : {}
    results.value = resultsRes.success ? resultsRes.data : []
    applyPackages.value = pkgs.map((p) => {
      const es = p.exam_status || {}
      const passed = es.status === 'passed'
      const app = apps[p.key] || null
      const activated = app && app.status === 'approved'
      let btnText = '申请资质'
      let canApply = false
      if (activated) btnText = '已激活'
      else if (app && app.status === 'pending') btnText = '审核中'
      else if (passed) { canApply = true; btnText = app && app.status === 'rejected' ? '重新申请' : '申请资质' }
      const steps = [
        { label: `课程 ${p.completed_courses}/${p.total_courses}`, done: p.all_completed, active: !p.all_completed },
        { label: passed ? `考试 ${es.percentage}分` : '考试', done: passed, active: p.all_completed && !passed },
        { label: activated ? '已通过' : app && app.status === 'pending' ? '审核中' : '申请', done: Boolean(app && (app.status === 'pending' || activated)), active: passed && !app },
        { label: '激活', done: activated, active: false },
      ]
      return { key: p.key, name: p.name, passed, percentage: es.percentage, app, canApply, btnText, steps }
    })
  } catch (e) { /* 忽略 */ }
}

async function applyFor(pkg) {
  if (!pkg.canApply) return
  if (!confirm(`确认申请「${pkg.name}」资质？管理员审核通过后即激活`)) return
  try {
    const res = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uid.value, nickname: userName.value, package_key: pkg.key }),
    })
    const data = await res.json()
    if (data.success) {
      showToast('申请已提交，请等待审核', 'success')
      loadAll()
    } else {
      showToast(data.error || '申请失败', 'error')
    }
  } catch (e) {
    showToast('网络错误，请稍后重试', 'error')
  }
}

async function showQueryDetail(result) {
  try {
    const res = await fetch(`/api/results/${result.id}`)
    const data = await res.json()
    queryDetailResult.value = data.success ? data.data : result
  } catch (err) {
    queryDetailResult.value = result
  }
}

function formatAnswerDisplay(ans) {
  if (typeof ans === 'object' && ans !== null) {
    return Object.entries(ans).map(([k, v]) => `空${k}:${v}`).join(' ')
  }
  return String(ans)
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function goPortal() {
  location.href = PORTAL_URL
}

function logout() {
  localStorage.removeItem('learn_user')
  store.setUserInfo('', '')
  location.href = PORTAL_URL
}

onMounted(() => {
  let name = store.userName
  let id = store.userPhone
  // 支持 URL 带 uid 移交身份
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
    router.push('/')
    return
  }
  userName.value = name
  uid.value = id
  loadAll()
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
.mine-hero {
  background: linear-gradient(135deg, #f9a8d4 0%, #f6b26b 60%, #f5b301 100%);
  border-radius: 0 0 28px 28px;
}
.glass-soft {
  background: rgba(247, 243, 252, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.fade-scale-enter-active, .fade-scale-leave-active { transition: all 0.25s ease; }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: scale(0.95); }
</style>
