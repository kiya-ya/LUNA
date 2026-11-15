<template>
  <div class="min-h-screen bg-soft relative">
    <!-- 顶部栏 -->
    <header class="relative z-10 sticky top-0">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <button @click="goBack" class="text-accent bg-accent/10 p-2 rounded-lg hover:bg-accent/20 transition-all shrink-0" aria-label="返回"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg></button>
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
          <div ref="playerRef" class="rounded-2xl overflow-hidden bg-black shadow-lg relative">
            <video
              ref="videoRef"
              :src="course.video_path"
              playsinline
              class="w-full max-h-[60vh] bg-black"
              @timeupdate="onTimeUpdate"
              @play="onPlay"
              @pause="onPauseOrEnd"
              @ended="onPauseOrEnd"
              @ratechange="onRateChange"
              @loadedmetadata="onLoadedMetadata"
              @click="togglePlay"
            ></video>
            <!-- 中央播放钮（暂停时显示） -->
            <button v-if="!isPlaying" @click="togglePlay" class="absolute inset-0 flex items-center justify-center bg-black/25" aria-label="播放">
              <span class="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                <svg class="w-7 h-7 text-[#2A2140] ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </span>
            </button>
            <!-- 定制控制条 -->
            <div class="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-8 bg-gradient-to-t from-black/75 to-transparent">
              <input type="range" class="player-seek w-full" min="0" :max="videoDuration || 0" step="0.1" :value="currentTime" @input="onSeek" aria-label="播放进度">
              <div class="flex items-center gap-3 mt-1 text-white text-xs">
                <button @click="togglePlay" class="p-1" aria-label="播放/暂停">
                  <svg v-if="isPlaying" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
                  <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </button>
                <span class="tabular-nums text-white/85">{{ fmtTime(currentTime) }} / {{ fmtTime(videoDuration) }}</span>
                <span class="flex-1"></span>
                <button @click="cycleRate" class="px-2 py-0.5 rounded-md bg-white/15 font-bold">{{ playbackRate }}x</button>
                <button @click="toggleFullscreen" class="p-1" aria-label="全屏（手机横屏）">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>
                </button>
              </div>
            </div>
          </div>
          <!-- 观看进度（极简：条 + 百分比/完成态） -->
          <div class="mt-3 flex items-center gap-3">
            <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500"
                :class="completed ? 'bg-success' : 'bg-gradient-to-r from-primary to-secondary'"
                :style="{ width: Math.min(100, progressPercent) + '%' }"></div>
            </div>
            <span class="text-xs font-bold shrink-0" :class="completed ? 'text-success' : 'text-primary'">{{ completed ? '已完成' : Math.floor(progressPercent) + '%' }}</span>
          </div>
          <p class="text-xs text-gray-400 mt-1.5">看到 90% 即完成 · 切出页面自动暂停</p>
          <!-- 视频下方说明文案 -->
          <article v-if="course.content" class="article-content text-gray-800 mt-4 pt-4 border-t border-gray-100" v-html="course.content"></article>
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
          <div v-if="social.comments.length === 0" class="text-center text-gray-400 py-6 text-sm font-bold">
            <MessageCircleIcon :size="40" color="#B39DF0" class="mx-auto mb-2" />
            还没有评论，来抢沙发
          </div>
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
          <svg class="w-12 h-12 mx-auto mb-2 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" opacity=".25"/><path d="m8 12.5 3 3 5-6"/></svg>
          <p class="text-lg font-extrabold text-success mb-1">已完成</p>
          <p class="text-xs text-gray-400 mb-4">全部必修课完成后解锁考试</p>
          <button @click="goBack" class="px-8 h-11 bg-gradient-to-r from-primary to-secondary text-white font-extrabold rounded-2xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all">返回课程列表</button>
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
              <span class="shrink-0 flex items-center justify-center w-5">
                <svg v-if="c.completed" class="w-5 h-5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                <i v-else class="block w-2 h-2 rounded-full" :class="c.progress_percent > 0 ? 'bg-primary' : 'bg-gray-300'"></i>
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
import { MessageCircleIcon } from 'naive-icons-vue'
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
const playerRef = ref(null)
const videoDuration = ref(0)
const isPlaying = ref(false)
const currentTime = ref(0)
const playbackRate = ref(1)
let lastTime = 0
let playing = false
let reportTimer = null
let heartbeatTimer = null

function togglePlay() {
  const v = videoRef.value
  if (!v) return
  if (v.paused) v.play()
  else v.pause()
}

function onSeek(e) {
  const v = videoRef.value
  if (!v) return
  v.currentTime = Number(e.target.value)
  currentTime.value = Number(e.target.value)
}

function cycleRate() {
  const v = videoRef.value
  if (!v) return
  const rates = [1, 1.5, 2]
  playbackRate.value = rates[(rates.indexOf(playbackRate.value) + 1) % rates.length]
  v.playbackRate = playbackRate.value
}

function fmtTime(sec) {
  if (!sec || !isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// 全屏：进入时尝试锁定横屏，退出时解锁回竖屏；iOS 走原生全屏（自行处理旋转）
async function toggleFullscreen() {
  const el = playerRef.value
  const v = videoRef.value
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else if (el && el.requestFullscreen) {
      await el.requestFullscreen()
      if (screen.orientation && screen.orientation.lock) {
        try { await screen.orientation.lock('landscape') } catch (e) { /* iOS 等不支持时忽略 */ }
      }
    } else if (v && v.webkitEnterFullscreen) {
      v.webkitEnterFullscreen()
    }
  } catch (e) {
    if (v && v.webkitEnterFullscreen) v.webkitEnterFullscreen()
  }
}

function onFullscreenChange() {
  if (!document.fullscreenElement && screen.orientation && screen.orientation.unlock) {
    try { screen.orientation.unlock() } catch (e) { /* ignore */ }
  }
}

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
  currentTime.value = v ? v.currentTime : 0
}

function onPlay() {
  playing = true
  isPlaying.value = true
  lastTime = videoRef.value ? videoRef.value.currentTime : 0
}

function onTimeUpdate() {
  const v = videoRef.value
  if (!v) return
  const cur = v.currentTime
  currentTime.value = cur
  if (!playing) return
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
  isPlaying.value = false
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
  document.addEventListener('fullscreenchange', onFullscreenChange)
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
  document.removeEventListener('fullscreenchange', onFullscreenChange)
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

/* 定制播放器 */
.player-seek {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .3);
  cursor: pointer;
}
.player-seek::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px; height: 12px; border-radius: 50%;
  background: #F5B301;
  box-shadow: 0 0 6px rgba(245, 179, 1, .6);
}
.player-seek::-moz-range-thumb {
  width: 12px; height: 12px; border: none; border-radius: 50%;
  background: #F5B301;
}

/* 全屏时视频铺满（横屏观看） */
:fullscreen video {
  max-height: 100vh !important;
  height: 100%;
  object-fit: contain;
}
:fullscreen .rounded-2xl { border-radius: 0; }
</style>
