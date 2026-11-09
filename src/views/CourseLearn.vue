<template>
  <div class="min-h-screen bg-soft relative">
    <!-- 顶部栏 -->
    <header class="relative z-10 sticky top-0">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <button @click="goBack" class="text-accent font-bold text-sm bg-accent/10 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-all shrink-0">返回</button>
        <h1 class="text-sm sm:text-base font-bold text-accent truncate flex-1 text-center">{{ course ? course.title : '课程学习' }}</h1>
        <span v-if="completed" class="text-xs font-bold px-2.5 py-1 rounded-full bg-success text-white shrink-0">已完成</span>
        <span v-else class="text-xs font-bold px-2.5 py-1 rounded-full bg-accent/10 text-accent shrink-0">学习中</span>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-5 relative z-10 pb-24">
      <div v-if="loading" class="glass-card p-10 text-center text-gray-500 font-bold">加载中…</div>
      <div v-else-if="!course" class="glass-card p-10 text-center">
        <p class="font-bold text-gray-500">课程不存在或已下线</p>
        <button @click="goBack" class="mt-4 px-6 h-11 bg-primary text-white font-bold rounded-2xl">返回课程列表</button>
      </div>

      <template v-else>
        <!-- ===== 顶部：视频/图文内容 ===== -->
        <div v-if="course.type === 'video'" class="glass-card p-4 sm:p-5 mb-4">
          <div class="rounded-2xl overflow-hidden bg-black shadow-lg">
            <video
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
            ></video>
          </div>
          <div class="mt-4">
            <div class="flex justify-between text-xs font-bold mb-1.5">
              <span class="text-gray-500">观看进度（实际播放时长，看到 90% 即完成）</span>
              <span :class="completed ? 'text-success' : 'text-primary'">{{ Math.floor(progressPercent) }}%</span>
            </div>
            <div class="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500"
                :class="completed ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-gradient-to-r from-primary to-secondary'"
                :style="{ width: Math.min(100, progressPercent) + '%' }"></div>
            </div>
            <p class="text-xs text-gray-400 mt-2">倍速最高 2x，切出页面自动暂停；已累计观看 {{ formatSeconds(watchedSeconds) }}</p>
          </div>
        </div>
        <div v-else class="glass-card p-5 sm:p-6 mb-4">
          <div class="mb-4 p-3.5 rounded-2xl flex items-center justify-between"
            :class="completed ? 'bg-success/10 border border-success/20' : 'bg-primary/5 border border-primary/15'">
            <span class="text-sm font-bold" :class="completed ? 'text-success' : 'text-gray-600'">{{ completed ? '学习时长已达标' : '还需学习' }}</span>
            <span v-if="!completed" class="text-lg font-extrabold text-primary tabular-nums">{{ remainText }}</span>
          </div>
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden mb-5">
            <div class="h-full rounded-full transition-all duration-500"
              :class="completed ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-gradient-to-r from-primary to-secondary'"
              :style="{ width: Math.min(100, progressPercent) + '%' }"></div>
          </div>
          <article class="article-content text-gray-800" v-html="course.content"></article>
          <p v-if="!completed" class="text-xs text-gray-400 mt-5 text-center">停留在本页面即可累计学习时长，切出页面暂停计时</p>
        </div>

        <!-- ===== 互动栏（B 站式：点赞/拉踩/评论） ===== -->
        <div class="glass-card px-5 py-3.5 mb-4 flex items-center gap-6">
          <button @click="toggleLike(1)" class="act-btn" :class="{ on: social.my_value === 1 }" aria-label="点赞">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3z"/><path d="M7 10l4-7a2 2 0 0 1 2 2v4h6.5a2 2 0 0 1 2 2.4l-1.5 7a2 2 0 0 1-2 1.6H7z"/></svg>
            <span>{{ social.likes }}</span>
          </button>
          <button @click="toggleLike(-1)" class="act-btn" :class="{ on: social.my_value === -1 }" aria-label="点踩">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="transform:scaleY(-1)"><path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3z"/><path d="M7 10l4-7a2 2 0 0 1 2 2v4h6.5a2 2 0 0 1 2 2.4l-1.5 7a2 2 0 0 1-2 1.6H7z"/></svg>
            <span>{{ social.dislikes }}</span>
          </button>
          <button @click="showComments = !showComments" class="act-btn" :class="{ on: showComments }" aria-label="评论">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/></svg>
            <span>{{ social.comment_count }}</span>
          </button>
        </div>

        <!-- ===== 评论区 ===== -->
        <div v-if="showComments" class="glass-card p-5 mb-4">
          <h3 class="text-base font-extrabold text-gray-900 mb-3">评论（{{ social.comment_count }}）</h3>
          <div class="flex gap-2 mb-4">
            <input v-model="commentInput" type="text" maxlength="500" placeholder="说点什么吧…"
              class="flex-1 h-11 px-4 text-sm border border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              @keyup.enter="submitComment">
            <button @click="submitComment" :disabled="commentSending || !commentInput.trim()"
              class="h-11 px-5 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all disabled:opacity-50 shrink-0">
              {{ commentSending ? '发送中' : '发送' }}
            </button>
          </div>
          <div v-if="social.comments.length === 0" class="text-center text-gray-400 py-6 text-sm font-bold">还没有评论，来抢沙发</div>
          <div v-else class="space-y-3">
            <div v-for="c in social.comments" :key="c.id" class="pb-3 border-b border-gray-100 last:border-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-gray-800">{{ c.nickname || '学员' }}</span>
                <span class="text-xs text-gray-400">{{ formatTime(c.created_at) }}</span>
              </div>
              <p class="text-sm text-gray-700 mt-1 leading-relaxed break-words">{{ c.content }}</p>
            </div>
          </div>
        </div>

        <!-- ===== 完成提示 ===== -->
        <div v-if="completed" class="glass-card p-6 text-center mb-4">
          <p class="text-lg font-extrabold text-success mb-1">恭喜完成本课程！</p>
          <p class="text-sm text-gray-500 mb-5">返回课程列表继续学习，全部完成后解锁考试</p>
          <button @click="goBack" class="px-8 h-12 bg-gradient-to-r from-primary to-secondary text-white font-extrabold rounded-2xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all">返回课程列表</button>
        </div>

        <!-- ===== 其余课程概览 ===== -->
        <div v-if="otherCourses.length" class="glass-card p-5">
          <h3 class="text-base font-extrabold text-gray-900 mb-3">其余课程</h3>
          <div class="space-y-2.5">
            <div v-for="c in otherCourses" :key="c.id" @click="goCourse(c)"
              class="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-gray-100 cursor-pointer hover:shadow-md transition-all">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0"
                :class="c.completed ? 'bg-success/15 text-success' : c.type === 'video' ? 'bg-rose-100 text-rose-500' : 'bg-sky-100 text-sky-500'">
                {{ c.completed ? '完' : c.type === 'video' ? '视' : '文' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-gray-800 text-sm truncate">{{ c.title }}</p>
                <p class="text-xs text-gray-400">{{ c.type === 'video' ? '视频课' : '图文课' }}<span v-if="c.duration_minutes"> · 约 {{ c.duration_minutes }} 分钟</span></p>
              </div>
              <span class="text-xs font-bold shrink-0" :class="c.completed ? 'text-success' : c.progress_percent > 0 ? 'text-primary' : 'text-gray-300'">
                {{ c.completed ? '已完成' : c.progress_percent > 0 ? Math.floor(c.progress_percent) + '%' : '未开始' }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </main>

    <BottomNav active="learn" :uid="uid" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BottomNav from '../components/BottomNav.vue'

const route = useRoute()
const router = useRouter()
const showToast = inject('showToast')

const courseId = parseInt(route.params.id)
const uid = ref('')
const nickname = ref('')
const course = ref(null)
const otherCourses = ref([])
const loading = ref(true)
const completed = ref(false)
const progressPercent = ref(0)
const watchedSeconds = ref(0)

// 互动数据
const social = ref({ likes: 0, dislikes: 0, my_value: 0, comments: [], comment_count: 0 })
const showComments = ref(false)
const commentInput = ref('')
const commentSending = ref(false)

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

function goCourse(c) {
  router.push(`/learn/course/${c.id}`)
}

function formatSeconds(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
          otherCourses.value = (pkg.courses || []).filter(c => c.id !== courseId)
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

async function loadSocial() {
  try {
    const res = await fetch(`/api/learn/social?course_id=${courseId}&uid=${encodeURIComponent(uid.value)}`)
    const data = await res.json()
    if (data.success) social.value = data.data
  } catch (e) { /* 忽略 */ }
}

async function toggleLike(v) {
  try {
    const res = await fetch('/api/learn/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uid.value, course_id: courseId, value: v })
    })
    const data = await res.json()
    if (data.success) social.value = data.data
  } catch (e) {
    showToast('网络错误', 'error')
  }
}

async function submitComment() {
  const content = commentInput.value.trim()
  if (!content || commentSending.value) return
  commentSending.value = true
  try {
    const res = await fetch('/api/learn/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uid.value, nickname: nickname.value, course_id: courseId, content })
    })
    const data = await res.json()
    if (data.success) {
      commentInput.value = ''
      showToast('评论成功', 'success')
      loadSocial()
    } else {
      showToast(data.error || '评论失败', 'error')
    }
  } catch (e) {
    showToast('网络错误', 'error')
  } finally {
    commentSending.value = false
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
  if (delta > 0 && delta < 2) {
    watchedSeconds.value += delta
    updatePercent()
  }
}

function updatePercent() {
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
        showToast('本课程学习完成！', 'success')
      }
    }
  } catch (e) {
    console.error('心跳上报失败', e)
  }
}

function onVisibilityChange() {
  if (document.visibilityState !== 'visible') {
    if (videoRef.value && !videoRef.value.paused) {
      videoRef.value.pause()
    }
  }
}

onMounted(() => {
  // 支持 URL 带 uid 移交身份（来自培训师系统/其他页跳转）
  if (route.query.uid) {
    uid.value = String(route.query.uid)
    if (route.query.nickname) nickname.value = String(route.query.nickname)
    try { localStorage.setItem('learn_user', JSON.stringify({ name: nickname.value, uid: uid.value })) } catch (e) { /* ignore */ }
  }
  if (!uid.value) {
    try {
      const saved = JSON.parse(localStorage.getItem('learn_user') || 'null')
      if (saved && saved.uid) {
        uid.value = saved.uid
        nickname.value = saved.name || ''
      }
    } catch (e) { /* ignore */ }
  }
  if (!uid.value) {
    showToast('请先填写昵称和UID', 'warning')
    router.push('/')
    return
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
  loadCourse().then(() => {
    loadSocial()
    if (course.value && course.value.type === 'video') {
      reportTimer = setInterval(() => {
        if (playing) reportVideoProgress()
      }, 10000)
    } else if (course.value && course.value.type === 'article') {
      heartbeatTimer = setInterval(sendHeartbeat, 5000)
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (reportTimer) clearInterval(reportTimer)
  if (heartbeatTimer) clearInterval(heartbeatTimer)
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
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-radius: 1.5rem;
}

/* 互动按钮 */
.act-btn {
  display: flex; align-items: center; gap: 5px;
  background: none; border: none; cursor: pointer;
  color: rgba(91, 42, 6, .55); font-size: 14px; font-weight: 700;
  padding: 4px 2px; transition: color .15s ease, transform .15s ease;
}
.act-btn svg { width: 22px; height: 22px; }
.act-btn:hover { color: #8E6BC8; transform: scale(1.06); }
.act-btn.on { color: #F5B301; }

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
  color: #8E6BC8;
  text-decoration: underline;
}
</style>
