<template>
  <div class="min-h-screen bg-soft relative">
    <!-- 顶部栏 -->
    <header class="relative z-20">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
        <img src="/logo.png" alt="点点开黑" class="w-9 h-9 object-contain rounded-xl shadow">
        <div>
          <h1 class="text-base font-bold text-accent leading-tight">考试中心</h1>
          <p class="text-xs text-accent/60">{{ userName || '未登录' }} · UID: {{ uid || '-' }}</p>
        </div>
      </div>
    </header>

    <!-- Tab 栏：考试科目 / 我的成绩 -->
    <div class="tab-bar max-w-3xl mx-auto">
      <button class="tab-item" :class="{ on: activeTab === 'subjects' }" @click="switchTab('subjects')">考试科目</button>
      <button class="tab-item" :class="{ on: activeTab === 'grades' }" @click="switchTab('grades')">我的成绩</button>
      <span class="tab-ink" :class="{ right: activeTab === 'grades' }"></span>
    </div>

    <main class="max-w-3xl mx-auto px-4 py-5 relative z-10 pb-24">
      <Transition name="tab-swap" mode="out-in">
        <!-- ============ Tab 1：考试科目 ============ -->
        <div v-if="activeTab === 'subjects'" key="subjects">
          <div v-if="loading" class="glass-card p-10 text-center text-gray-400 font-bold">加载中…</div>

          <div v-else class="space-y-4">
            <!-- 考试卡：左文右人物抠图（与课包卡同款） -->
            <div v-for="(pkg, i) in packages" :key="pkg.id"
              class="exam-card anim-card relative rounded-3xl overflow-hidden border-2 transition-all"
              :style="{ animationDelay: (i * 70) + 'ms' }"
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
              <p class="text-xs text-gray-400">考完出分后可在「我的成绩」查看每题明细</p>
              <button @click="switchTab('grades')" class="mt-2 text-sm font-bold text-primary">查看我的成绩 →</button>
            </div>
          </div>
        </div>

        <!-- ============ Tab 2：我的成绩 ============ -->
        <div v-else key="grades">
          <div v-if="results === null" class="glass-card p-10 text-center text-gray-400 font-bold">加载中…</div>

          <div v-else-if="results.length === 0" class="glass-card p-10 text-center">
            <p class="text-gray-400 text-sm font-bold">暂无考试记录</p>
            <p class="text-xs text-gray-300 mt-1.5">去「考试科目」参加你的第一场考试吧</p>
            <button @click="switchTab('subjects')"
              class="mt-4 px-6 h-10 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold rounded-2xl shadow shadow-primary/25">
              去考试科目
            </button>
          </div>

          <div v-else class="space-y-2.5">
            <div v-for="(r, i) in results" :key="r.id"
              class="result-row anim-card flex items-center justify-between p-4 rounded-2xl bg-white/85 border border-white/60 shadow-sm cursor-pointer"
              :style="{ animationDelay: (i * 50) + 'ms' }"
              @click="showQueryDetail(r)">
              <div class="min-w-0">
                <p class="font-bold text-gray-800 text-sm truncate">{{ r.exam_name || '未知试卷' }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ formatTime(r.created_at) }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-base font-extrabold tabular-nums" :class="r.percentage >= 60 ? 'text-success' : 'text-danger'">{{ r.percentage }}<span class="text-xs">分</span></span>
                <span class="text-xs font-bold px-2 py-1 rounded-full" :class="r.percentage >= 60 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'">{{ r.percentage >= 60 ? '及格' : '未及格' }}</span>
              </div>
            </div>
            <p class="text-xs text-gray-400 text-center pt-1">点击记录可查看每题明细</p>
            <p class="text-xs text-gray-300 text-center pb-2">已经到底啦</p>
          </div>
        </div>
      </Transition>
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

// Tab：subjects 考试科目 / grades 我的成绩
const activeTab = ref('subjects')
const results = ref(null)
const queryDetailResult = ref(null)

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'grades') loadResults()
}

async function loadResults() {
  if (results.value !== null) return
  try {
    const res = await fetch(`/api/results/by-uid?uid=${encodeURIComponent(uid.value)}`)
    const data = await res.json()
    results.value = data.success ? (data.data || []) : []
  } catch (e) {
    results.value = []
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
  // 支持 ?tab=grades 直达成绩页
  if (route.query.tab === 'grades') switchTab('grades')
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

/* ===== Tab 栏（仿订单页：激活加粗 + 渐变短下划线滑动） ===== */
.tab-bar {
  position: relative;
  display: flex;
  padding: 2px 16px 0;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.7);
}
.tab-item {
  flex: 1;
  padding: 12px 0 13px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(42, 33, 64, 0.45);
  transition: color 0.2s ease, transform 0.18s var(--spring);
}
.tab-item.on {
  color: #2A2140;
  font-weight: 800;
}
.tab-ink {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 50%;
  height: 3px;
  display: flex;
  justify-content: center;
  transition: transform 0.32s var(--spring);
}
.tab-ink.right {
  transform: translateX(100%);
}
.tab-ink::after {
  content: '';
  width: 28px;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, #8E6BC8, #F5B301);
}

/* Tab 内容切换 */
.tab-swap-enter-active { transition: all 0.24s var(--spring); }
.tab-swap-leave-active { transition: all 0.12s ease; }
.tab-swap-enter-from { opacity: 0; transform: translateY(10px); }
.tab-swap-leave-to { opacity: 0; }

/* 成绩行按压反馈 */
.result-row {
  transition: transform 0.18s var(--spring), box-shadow 0.18s ease;
}
.result-row:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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

/* 明细弹窗 */
.fade-scale-enter-active, .fade-scale-leave-active { transition: all 0.25s var(--spring); }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: scale(0.95); }
</style>
