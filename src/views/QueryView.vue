<template>
  <div class="min-h-screen bg-soft relative">
    <!-- 顶部栏 -->
    <header class="relative z-10 sticky top-0 glass-soft">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <button @click="goBack" class="text-accent font-bold text-sm bg-accent/10 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-all shrink-0">返回</button>
        <h1 class="text-sm sm:text-base font-bold text-accent truncate flex-1 text-center">成绩查询</h1>
        <span class="w-14 shrink-0"></span>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-5 relative z-10 pb-24">
      <!-- 查询输入 -->
      <div class="glass-card p-4 mb-4">
        <div class="flex gap-2">
          <input
            v-model="queryUid"
            type="text"
            placeholder="输入点点 UID，查成绩 / 申请资质"
            class="flex-1 h-[48px] px-4 text-base border border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            @keyup.enter="doQuery"
          >
          <button @click="doQuery" :disabled="queryLoading" class="h-[48px] px-6 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2">
            <svg v-if="queryLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span>{{ queryLoading ? '查询中' : '查询' }}</span>
          </button>
        </div>
      </div>

      <!-- 资质进度（学习 → 考试 → 申请 → 激活） -->
      <div v-if="queryResults" class="glass-card p-5 mb-4">
        <h3 class="text-base font-extrabold text-gray-900 mb-1">我的资质进度</h3>
        <p class="text-xs text-gray-400 mb-4">学习 → 考试 → 申请 → 激活，四步走完即获得资质</p>
        <div v-for="pkg in applyPackages" :key="pkg.key" class="py-3 border-t first:border-0 border-gray-100">
          <div class="flex items-center justify-between gap-3 mb-2.5">
            <p class="font-bold text-gray-800 text-sm">{{ pkg.name }}</p>
            <!-- 操作按钮 -->
            <button
              class="h-9 px-4 rounded-xl font-bold text-xs shrink-0 transition-all"
              :disabled="!pkg.canApply"
              :class="pkg.canApply ? 'bg-gradient-to-r from-primary to-secondary text-white shadow' : 'bg-gray-100 text-gray-400'"
              @click="applyFor(pkg)"
            >{{ pkg.btnText }}</button>
          </div>
          <!-- 步骤条 -->
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
          <!-- 驳回原因 -->
          <p v-if="pkg.app && pkg.app.status === 'rejected'" class="text-xs text-danger mt-2">已驳回：{{ pkg.app.reason || '未填写原因' }}（可重新申请）</p>
          <p v-else-if="pkg.app && pkg.app.status === 'pending'" class="text-xs text-primary mt-2">申请已提交（{{ pkg.app.created_at }}），等待管理员审核</p>
        </div>
      </div>

      <!-- 成绩列表 -->
      <div v-if="queryResults && queryResults.length > 0" class="space-y-3">
        <p class="text-sm text-gray-500 font-medium px-1">共 {{ queryResults.length }} 条考试记录</p>
        <div v-for="r in queryResults" :key="r.id" class="glass-card p-4 cursor-pointer hover:shadow-xl transition-all" @click="showQueryDetail(r)">
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-gray-900">{{ r.exam_name || '未知试卷' }}</span>
            <span class="text-xs px-3 py-1.5 rounded-full font-bold" :class="r.percentage >= 80 ? 'bg-success/10 text-success' : r.percentage >= 60 ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'">{{ r.total_score }} / {{ r.max_score }} 分</span>
          </div>
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span class="flex items-center gap-1">
              <span>正确率</span>
              <span class="font-bold" :class="r.percentage >= 80 ? 'text-success' : r.percentage >= 60 ? 'text-primary' : 'text-danger'">{{ r.percentage }}%</span>
            </span>
            <span>{{ formatTime(r.created_at) }}</span>
          </div>
        </div>
        <button @click="queryResults = null; queryUid = ''" class="w-full h-12 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all">重新查询</button>
      </div>
      <div v-else-if="queryResults && queryResults.length === 0" class="glass-card p-10 text-center text-gray-400">
        <p class="text-lg font-medium">未找到考试记录</p>
        <p class="text-sm mt-1">请检查UID是否正确</p>
        <button @click="queryResults = null; queryUid = ''" class="w-full h-12 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all mt-5">重新查询</button>
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
              <span><span class="text-gray-500">总分：</span><span class="font-bold" :class="queryDetailResult.percentage >= 80 ? 'text-success' : queryDetailResult.percentage >= 60 ? 'text-primary' : 'text-danger'">{{ queryDetailResult.total_score }} / {{ queryDetailResult.max_score }}</span></span>
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

    <BottomNav active="query" :uid="queryUid" />
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BottomNav from '../components/BottomNav.vue'

const router = useRouter()
const route = useRoute()
const showToast = inject('showToast')

const queryUid = ref(String(route.query.uid || ''))
const queryLoading = ref(false)
const queryResults = ref(null)
const queryDetailResult = ref(null)
const applyPackages = ref([])

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

// 组装两个课包的资质进度（学习 → 考试 → 申请 → 激活）
async function loadApplyStatus() {
  try {
    const [homeRes, statusRes] = await Promise.all([
      fetch(`/api/learn/home?uid=${encodeURIComponent(queryUid.value.trim())}`).then(r => r.json()),
      fetch(`/api/apply/status?uid=${encodeURIComponent(queryUid.value.trim())}`).then(r => r.json()),
    ])
    const pkgs = homeRes.success ? homeRes.data.packages : []
    const apps = statusRes.success ? statusRes.data : {}
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
  } catch (e) { /* 申请区不阻塞查询 */ }
}

async function applyFor(pkg) {
  if (!pkg.canApply) return
  if (!confirm(`确认申请「${pkg.name}」资质？管理员审核通过后即激活`)) return
  try {
    const res = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: queryUid.value.trim(), package_key: pkg.key }),
    })
    const data = await res.json()
    if (data.success) {
      showToast('申请已提交，请等待审核', 'success')
      loadApplyStatus()
    } else {
      showToast(data.error || '申请失败', 'error')
    }
  } catch (e) {
    showToast('网络错误，请稍后重试', 'error')
  }
}

async function doQuery() {
  if (!queryUid.value.trim()) {
    showToast('请输入UID', 'warning')
    return
  }
  queryLoading.value = true
  try {
    const res = await fetch(`/api/results/by-uid?uid=${encodeURIComponent(queryUid.value.trim())}`)
    const data = await res.json()
    if (data.success) {
      queryResults.value = data.data
      loadApplyStatus()
    } else {
      showToast(data.error || '查询失败', 'error')
    }
  } catch (err) {
    console.error('查询失败', err)
    showToast('查询失败', 'error')
  } finally {
    queryLoading.value = false
  }
}

async function showQueryDetail(result) {
  try {
    const res = await fetch(`/api/results/${result.id}`)
    const data = await res.json()
    if (data.success) {
      queryDetailResult.value = data.data
    } else {
      queryDetailResult.value = result
    }
  } catch (err) {
    console.error('获取详情失败', err)
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

// 带 uid 参数进入时自动查询
if (queryUid.value) doQuery()
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
.fade-scale-enter-active, .fade-scale-leave-active { transition: all 0.25s ease; }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: scale(0.95); }
</style>
