<template>
  <nav class="bottom-nav">
    <button class="bnav-item" :class="{ active: active === 'home' }" @click="goPortal('')">首页</button>
    <button class="bnav-item" :class="{ active: active === 'learn' }" @click="go('/learn')">学习</button>
    <button class="bnav-item" :class="{ active: active === 'query' }" @click="goQuery">查询</button>
    <button class="bnav-item" :class="{ active: active === 'mine' }" @click="go('/mine')">我的</button>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'

// 培训师系统统一入口（v2 灰度页会按身份自动分流：培训师→管理页，新人→主页面）
const PORTAL_URL = 'http://192.168.100.117:5000/portal-v2'

const props = defineProps({
  active: { type: String, default: 'learn' },  // learn / query / mine
  uid: { type: String, default: '' },
})

const router = useRouter()

function go(path) {
  router.push(path)
}
function goQuery() {
  router.push({ path: '/query', query: props.uid ? { uid: props.uid } : {} })
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
  padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
}
.bnav-item {
  flex: 1; max-width: 140px; padding: 9px 0; border: none; background: none;
  font-size: 14px; font-weight: 600; color: rgba(91, 42, 6, .5); cursor: pointer;
  border-radius: 12px; transition: color .15s ease, background .15s ease;
}
.bnav-item.active { color: #5B2A06; background: rgba(245, 179, 1, .16); }
</style>
