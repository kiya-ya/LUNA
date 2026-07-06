<template>
  <Teleport to="body">
    <div class="fixed top-6 left-1/2 -translate-x-1/2 z-[999] flex flex-col items-center gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="item in toasts"
          :key="item.id"
          class="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg text-sm font-bold backdrop-blur-sm border transition-all"
          :class="toastClass(item.type)"
        >
          <span class="text-lg">{{ iconMap[item.type] }}</span>
          <span>{{ item.message }}</span>
          <button @click="remove(item.id)" class="ml-1 opacity-50 hover:opacity-100 transition-opacity">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'

const toasts = ref([])
let id = 0

const iconMap = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: '💡'
}

function toastClass(type) {
  switch (type) {
    case 'success': return 'bg-success/90 text-white border-success'
    case 'error': return 'bg-danger/90 text-white border-danger'
    case 'warning': return 'bg-warning/90 text-white border-warning'
    default: return 'bg-primary/90 text-white border-primary'
  }
}

function show(message, type = 'info', duration = 2500) {
  const item = { id: ++id, message, type }
  toasts.value.push(item)
  if (duration > 0) {
    setTimeout(() => remove(item.id), duration)
  }
  return item.id
}

function remove(id) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx > -1) toasts.value.splice(idx, 1)
}

defineExpose({ show, remove })
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
