<script setup lang="ts">
import { useCamera } from '@/composables/useCamera'
import { useDarkMode } from '@/composables/useDarkMode'

const emit = defineEmits<{
  logout: []
}>()

const { systemInfo, connectionState, disconnect } = useCamera()
const { isDark, toggle } = useDarkMode()

const handleLogout = () => {
  disconnect()
  // Don't clear saved settings - let user reconnect easily
  emit('logout')
}
</script>

<template>
  <nav class="navbar border-bottom">
    <div class="container-fluid">
      <span class="navbar-brand mb-0 h1">
        <i class="bi bi-camera-reels me-2"></i>
        Retro IP Camera Admin
      </span>

      <div class="d-flex align-items-center gap-2">
        <!-- Connection Status -->
        <span>
          <span
            class="badge"
            :class="{
              'bg-success': connectionState === 'connected',
              'bg-warning': connectionState === 'connecting',
              'bg-danger': connectionState === 'error',
              'bg-secondary': connectionState === 'disconnected'
            }"
          >
            {{ connectionState.toUpperCase() }}
          </span>
        </span>

        <!-- System Info -->
        <span v-if="systemInfo.deviceType" class="text-muted d-none d-md-inline">
          {{ systemInfo.deviceType }}
          <span v-if="systemInfo.softwareVersion">
            ({{ systemInfo.softwareVersion }})
          </span>
        </span>

        <!-- Dark Mode Toggle -->
        <button
          class="btn btn-outline-secondary btn-sm"
          @click="toggle"
          :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <i :class="isDark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill'"></i>
        </button>

        <!-- Logout Button -->
        <button
          class="btn btn-outline-secondary btn-sm"
          @click="handleLogout"
          title="Logout"
        >
          <i class="bi bi-box-arrow-right me-1"></i>
          Logout
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
