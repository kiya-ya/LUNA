<template>
  <nav class="bottom-nav">
    <button class="bnav-item" :class="{ active: active === 'home' }" @click="goPortal()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/></svg>
      <span>首页</span>
    </button>
    <button class="bnav-item" :class="{ active: active === 'learn' }" @click="go('/learn')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 5.5S5 4 8.5 4s6 1.5 6 1.5v15s-2.5-1.5-6-1.5-6 1.5-6 1.5z"/><path d="M21.5 5.5S19 4 15.5 4s-6 1.5-6 1.5v15"/></svg>
      <span>学习</span>
    </button>
    <button class="bnav-item" :class="{ active: active === 'exam' }" @click="goExam">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="m9.5 13.5 2 2 4-4.5"/></svg>
      <span>考试</span>
    </button>
    <button class="bnav-item" :class="{ active: active === 'mine' }" @click="go('/mine')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.5-3.5 4.5-5 7.5-5s6 1.5 7.5 5"/></svg>
      <span>我的</span>
    </button>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'

// 统一入口（培训师系统 v2）
const PORTAL_URL = 'http://192.168.100.117:5000/portal-v2'

const props = defineProps({
  active: { type: String, default: 'learn' },  // home / learn / exam / mine
  uid: { type: String, default: '' },
})

const router = useRouter()

function go(path) {
  router.push(path)
}
function goExam() {
  router.push({ path: '/exam-center', query: props.uid ? { uid: props.uid } : {} })
}
function goPortal() {
  location.href = PORTAL_URL
}
</script>

<style scoped>
.bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 88;
  display: flex; justify-content: space-around;
  background: rgba(255, 255, 255, .85);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border-top: 1px solid rgba(255, 255, 255, .65);
  box-shadow: 0 -4px 16px rgba(91, 42, 6, .08);
  padding: 5px 0 calc(5px + env(safe-area-inset-bottom));
}
.bnav-item {
  flex: 1; max-width: 140px; padding: 5px 0 4px; border: none; background: none;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  font-size: 11px; font-weight: 600; color: rgba(91, 42, 6, .5); cursor: pointer;
  border-radius: 12px; transition: color .15s ease, background .15s ease;
}
.bnav-item svg { width: 22px; height: 22px; }
.bnav-item.active { color: #5B2A06; background: rgba(245, 179, 1, .16); }
</style>
