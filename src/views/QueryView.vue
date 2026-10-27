<template>
  <div class="min-h-screen bg-soft relative">
    <!-- 顶部栏 -->
    <header class="relative z-10 sticky top-0">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <button @click="goBack" class="text-accent font-bold text-sm bg-accent/10 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-all shrink-0">返回</button>
        <h1 class="text-sm sm:text-base font-bold text-accent truncate flex-1 text-center">成绩查询</h1>
        <span class="w-14 shrink-0"></span>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-5 relative z-10 pb-24">
      <!-- 查询输入 -->
      <div class="glass-card p-5 mb-4">
        <label class="block text-sm font-bold text-gray-700 mb-3">请输入你的点点UID</label>
        <div class="flex gap-2">
          <input
            v-model="queryUid"
            type="text"
            placeholder="请输入UID"
            class="flex-1 h-[52px] px-4 text-base border border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            @keyup.enter="doQuery"
          >
          <button @click="doQuery" :disabled="queryLoading" class="h-[52px] px-6 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2">
            <svg v-if="queryLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span>{{ queryLoading ? '查询中' : '查询' }}</span>
          </button>
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

    <BottomNav active="query" :uid="queryUid" />

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

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
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
.fade-scale-enter-active, .fade-scale-leave-active { transition: all 0.25s ease; }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: scale(0.95); }
</style>
