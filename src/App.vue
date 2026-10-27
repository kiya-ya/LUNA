<template>
  <router-view />
  <Toast ref="toastRef" />
</template>

<script setup>
import { ref, provide } from 'vue'
import Toast from './components/Toast.vue'

const toastRef = ref(null)

function showToast(message, type = 'info', duration = 2500) {
  if (toastRef.value) {
    toastRef.value.show(message, type, duration)
  }
}

provide('showToast', showToast)
</script>