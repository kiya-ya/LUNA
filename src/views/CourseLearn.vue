<template> <div class="min-h-screen bg-animated relative"> <!-- 顶部栏 --> <header class="glass-nav relative z-10 sticky top-0"> <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3"> <button @click="goBack" class="text-white font-bold text-sm bg-white/15 px-3 py-1.5 rounded-lg hover:bg-white/25 transition-all shrink-0"> 返回</button> <h1 class="text-sm sm:text-base font-bold text-white truncate flex-1 text-center">{{ course ? course.title : '课程学习' }}</h1> <span v-if="completed" class="text-xs font-bold px-2.5 py-1 rounded-full bg-success text-white shrink-0"> 已完成</span> <span v-else class="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white shrink-0">学习中</span> </div> </header> <main class="max-w-3xl mx-auto px-4 py-5 relative z-10 pb-12"> <div v-if="loading" class="glass-card p-10 text-center text-gray-500 font-bold"> <div class="text-4xl mb-3 animate-bounce"></div>加载中…
      </div> <div v-else-if="!course" class="glass-card p-10 text-center"> <div class="text-4xl mb-3"></div> <p class="font-bold text-gray-500">课程不存在或已下线</p> <button @click="goBack" class="mt-4 px-6 h-11 bg-primary text-white font-bold rounded-2xl">返回课程列表</button> </div> <template v-else> <!-- ===== 视频课 ===== --> <div v-if="course.type === 'video'" class="glass-card p-4 sm:p-5 mb-4"> <div class="rounded-2xl overflow-hidden bg-black shadow-lg"> <video
              ref="videoRef"
              :src="course.video_path"
              controls
              playsinline
              class="w-full max-h-[60vh]"
              @timeupdate="onTimeUpdate"
              @play="onPlay"
              @pause="onPauseOrEnd"
              @ended="onPauseOrEnd"
              @ratechange="onRateChange"
              @loadedmetadata="onLoadedMetadata"
            ></video> </div> <div class="mt-4"> <div class="flex justify-between text-xs font-bold mb-1.5"> <span class="text-gray-500">观看进度（实际播放时长，看到 90% 即完成）</span> <span :class="completed ? 'text-success' : 'text-primary'">{{ Math.floor(progressPercent) }}%</span> </div> <div class="h-2.5 bg-gray-200 rounded-full overflow-hidden"> <div class="h-full rounded-full transition-all duration-500"
                :class="completed ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-gradient-to-r from-primary to-secondary'"
                :style="{ width: Math.min(100, progressPercent) + '%' }"></div> </div> <p class="text-xs text-gray-400 mt-2"> 倍速最高 2x，切出页面自动暂停；已累计观看 {{ formatSeconds(watchedSeconds) }}</p> </div> </div> <!-- ===== 图文课 ===== --> <div v-else class="glass-card p-5 sm:p-6 mb-4"> <!-- 倒计时 --> <div class="mb-4 p-3.5 rounded-2xl flex items-center justify-between"
            :class="completed ? 'bg-success/10 border border-success/20' : 'bg-primary/5 border border-primary/15'"> <span class="text-sm font-bold" :class="completed ? 'text-success' : 'text-gray-600'">
              {{ completed ? ' 学习时长已达标' : ' 还需学习' }}
            </span> <span v-if="!completed" class="text-lg font-extrabold text-primary tabular-nums">{{ remainText }}</span> </div> <div class="h-2 bg-gray-200 rounded-full overflow-hidden mb-5"> <div class="h-full rounded-full transition-all duration-500"
              :class="completed ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-gradient-to-r from-primary to-secondary'"
              :style="{ width: Math.min(100, progressPercent) + '%' }"></div> </div> <!-- 图文内容 --> <article class="article-content text-gray-800" v-html="course.content"></article> <p v-if="!completed" class="text-xs text-gray-400 mt-5 text-center"> 停留在本页面即可累计学习时长，切出页面暂停计时</p> </div> <!-- 完成提示 + 返回 --> <div v-if="completed" class="glass-card p-6 text-center"> <div class="text-5xl mb-3"></div> <p class="text-lg font-extrabold text-success mb-1">恭喜完成本课程！</p> <p class="text-sm text-gray-500 mb-5">返回课程列表继续学习，全部完成后解锁考试</p> <button @click="goBack" class="px-8 h-12 bg-gradient-to-r from-primary to-secondary text-white font-extrabold rounded-2xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all">
            返回课程列表
          </button> </div> </template> </main> </div>
</template> <script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const showToast = inject('showToast')

const courseId = parseInt(route.params.id)
const uid = ref('')
const nickname = ref('')
const course = ref(null)
const loading = ref(true)
const completed = ref(false)
const progressPercent = ref(0)
const watchedSeconds = ref(0)

// 视频状态
const videoRef = ref(null)
const videoDuration = ref(0)
let lastTime = 0
let playing = false
let reportTimer = null
let heartbeatTimer = null

const requiredSeconds = computed(() => (course.value ? (course.value.duration_minutes || 0) * 60 : 0))

const remainText = computed(() => {
  const remain = Math.max(0, requiredSeconds.value - watchedSeconds.value)
  const m = Math.floor(remain / 60)
  const s = Math.ceil(remain % 60)
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`
})

function goBack() {
  router.push('/learn')
}

function formatSeconds(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}

async function loadCourse() {
  try {
    const res = await fetch(`/api/learn/home?uid=${encodeURIComponent(uid.value)}`)
    const data = await res.json()
    if (data.success) {
      for (const pkg of data.data.packages || []) {
        const found = (pkg.courses || []).find(c => c.id === courseId)
        if (found) {
          course.value = found
          watchedSeconds.value = found.watched_seconds || 0
          progressPercent.value = found.progress_percent || 0
          completed.value = !!found.completed
          break
        }
      }
    }
  } catch (e) {
    console.error('加载课程失败', e)
    showToast('网络错误，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

// ===== 视频课逻辑 =====
function onLoadedMetadata() {
  const v = videoRef.value
  if (v && v.duration && isFinite(v.duration)) {
    videoDuration.value = v.duration
  }
  lastTime = v ? v.currentTime : 0
}

function onPlay() {
  playing = true
  lastTime = videoRef.value ? videoRef.value.currentTime : 0
}

function onTimeUpdate() {
  const v = videoRef.value
  if (!v || !playing) return
  const cur = v.currentTime
  const delta = cur - lastTime
  lastTime = cur
  // 只累计正常播放的时长（排除拖动进度条造成的跳变）
  if (delta > 0 && delta < 2) {
    watchedSeconds.value += delta
    updatePercent()
  }
}

function updatePercent() {
  // 优先按视频实际时长计算；无元数据时按配置时长兜底
  const base = videoDuration.value > 0 ? videoDuration.value : requiredSeconds.value
  if (base > 0) {
    progressPercent.value = Math.min(100, watchedSeconds.value / base * 100)
  }
}

function onRateChange() {
  const v = videoRef.value
  if (v && v.playbackRate > 2) {
    v.playbackRate = 2
    showToast('倍速最高 2x', 'warning')
  }
}

function onPauseOrEnd() {
  playing = false
  reportVideoProgress()
}

async function reportVideoProgress() {
  if (!course.value || course.value.type !== 'video' || completed.value) return
  try {
    const res = await fetch('/api/learn/video-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: uid.value,
        nickname: nickname.value,
        course_id: courseId,
        watched_seconds: Math.round(watchedSeconds.value * 10) / 10,
        progress_percent: Math.round(progressPercent.value * 10) / 10
      })
    })
    const data = await res.json()
    if (data.success && data.data) {
      progressPercent.value = Math.max(progressPercent.value, data.data.progress_percent)
      watchedSeconds.value = Math.max(watchedSeconds.value, data.data.watched_seconds)
      if (data.data.completed && !completed.value) {
        completed.value = true
        if (videoRef.value) videoRef.value.pause()
      }
    }
  } catch (e) {
    console.error('上报视频进度失败', e)
  }
}

// ===== 图文课逻辑 =====
async function sendHeartbeat() {
  if (completed.value || document.visibilityState !== 'visible') return
  try {
    const res = await fetch('/api/learn/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uid.value, nickname: nickname.value, course_id: courseId, seconds: 5 })
    })
    const data = await res.json()
    if (data.success && data.data) {
      watchedSeconds.value = data.data.watched_seconds
      progressPercent.value = data.data.progress_percent
      if (data.data.completed && !completed.value) {
        completed.value = true
        showToast(' 本课程学习完成！', 'success')
      }
    }
  } catch (e) {
    console.error('心跳上报失败', e)
  }
}

function onVisibilityChange() {
  if (document.visibilityState !== 'visible') {
    // 切出页面：视频暂停 + 立刻上报一次
    if (videoRef.value && !videoRef.value.paused) {
      videoRef.value.pause()
    }
  }
}

onMounted(() => {
  // 恢复身份
  try {
    const saved = JSON.parse(localStorage.getItem('learn_user') || 'null')
    if (saved && saved.uid) {
      uid.value = saved.uid
      nickname.value = saved.name || ''
    }
  } catch (e) { /* ignore */ }
  if (!uid.value) {
    showToast('请先填写昵称和UID', 'warning')
    router.push('/')
    return
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
  loadCourse().then(() => {
    if (course.value && course.value.type === 'video') {
      // 每 10 秒定时上报视频进度
      reportTimer = setInterval(() => {
        if (playing) reportVideoProgress()
      }, 10000)
    } else if (course.value && course.value.type === 'article') {
      // 每 5 秒心跳 +5 秒（仅页面可见时）
      heartbeatTimer = setInterval(sendHeartbeat, 5000)
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (reportTimer) clearInterval(reportTimer)
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  // 离开页面前最后上报一次视频进度
  if (course.value && course.value.type === 'video' && watchedSeconds.value > 0) {
    const body = JSON.stringify({
      uid: uid.value, nickname: nickname.value, course_id: courseId,
      watched_seconds: Math.round(watchedSeconds.value * 10) / 10,
      progress_percent: Math.round(progressPercent.value * 10) / 10
    })
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/learn/video-progress', new Blob([body], { type: 'application/json' }))
    }
  }
})
</script> <style scoped>
.bg-animated {
  background: linear-gradient(-45deg, #FF5E3A, #FF8C42, #FFB347, #FF6B6B, #FFA502);
  background-size: 300% 300%;
  animation: gradient-flow 6s ease infinite;
}
@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  25% { background-position: 50% 100%; }
  50% { background-position: 100% 50%; }
  75% { background-position: 50% 0%; }
  100% { background-position: 0% 50%; }
}
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-radius: 1.5rem;
}
.glass-nav {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}
.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  font-weight: 800;
  margin: 1rem 0 0.5rem;
  color: #1f2937;
}
.article-content :deep(p) {
  margin: 0.6rem 0;
  line-height: 1.8;
  font-size: 0.95rem;
}
.article-content :deep(img) {
  max-width: 100%;
  border-radius: 0.75rem;
  margin: 0.5rem 0;
}
.article-content :deep(ul),
.article-content :deep(ol) {
  padding-left: 1.25rem;
  margin: 0.6rem 0;
  line-height: 1.8;
}
.article-content :deep(a) {
  color: #FF5E3A;
  text-decoration: underline;
}
</style>
