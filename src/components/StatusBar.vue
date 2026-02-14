<script setup lang="ts">
import { useCamera } from '@/composables/useCamera'

const emit = defineEmits<{
  logout: []
}>()

const { systemInfo, connectionState, disconnect, clearSavedSettings } = useCamera()

const handleLogout = () => {
  disconnect()
  clearSavedSettings()
  emit('logout')
}
</script>

<template>
  <nav class="navbar navbar-light bg-light border-bottom">
    <div class="container-fluid">
      <span class="navbar-brand mb-0 h1">
        Retro IP Camera Admin
      </span>

      <div class="d-flex align-items-center">
        <!-- Connection Status -->
        <span class="me-3">
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
        <span v-if="systemInfo.deviceType" class="text-muted me-3 d-none d-md-inline">
          {{ systemInfo.deviceType }}
          <span v-if="systemInfo.softwareVersion">
            ({{ systemInfo.softwareVersion }})
          </span>
        </span>

        <!-- Logout Button -->
        <button
          class="btn btn-outline-secondary btn-sm"
          @click="handleLogout"
          title="Logout"
        >
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
