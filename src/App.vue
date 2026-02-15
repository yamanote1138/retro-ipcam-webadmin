<script setup lang="ts">
import { ref } from 'vue'
import { useCamera } from '@/composables/useCamera'
import ConnectionSetup from '@/components/ConnectionSetup.vue'
import StatusBar from '@/components/StatusBar.vue'
import CameraInfoPage from '@/components/CameraInfoPage.vue'
import OverlaysPage from '@/components/OverlaysPage.vue'

const { isConnected } = useCamera()
const showSetup = ref(!isConnected.value)
const currentPage = ref<'camera-info' | 'overlays'>('camera-info')

const handleConnected = () => {
  showSetup.value = false
}

const handleLogout = () => {
  showSetup.value = true
}
</script>

<template>
  <div id="app">
    <!-- Connection Setup Screen -->
    <ConnectionSetup
      v-if="showSetup"
      @connected="handleConnected"
    />

    <!-- Main Application -->
    <div v-else class="main-app">
      <StatusBar @logout="handleLogout" />

      <!-- Tab Navigation -->
      <div class="nav-tabs-container">
        <ul class="nav nav-tabs container-fluid">
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: currentPage === 'camera-info' }"
              @click="currentPage = 'camera-info'"
            >
              <i class="bi bi-camera-video me-2"></i>
              Camera Info
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: currentPage === 'overlays' }"
              @click="currentPage = 'overlays'"
            >
              <i class="bi bi-badge-cc me-2"></i>
              Overlays
            </button>
          </li>
        </ul>
      </div>

      <!-- Page Content -->
      <CameraInfoPage v-if="currentPage === 'camera-info'" />
      <OverlaysPage v-if="currentPage === 'overlays'" />
    </div>
  </div>
</template>

<style>
#app {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.main-app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.nav-tabs-container {
  background-color: var(--bs-body-bg);
  border-bottom: 1px solid var(--bs-border-color);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

body.dark-mode .nav-tabs-container {
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.nav-tabs {
  border-bottom: none;
  margin-bottom: 0;
}

.nav-tabs .nav-link {
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--bs-secondary-color);
  padding: 1rem 1.5rem;
  background: none;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-tabs .nav-link:hover {
  border-bottom-color: var(--bs-border-color);
  color: var(--bs-body-color);
}

.nav-tabs .nav-link.active {
  color: var(--bs-primary);
  border-bottom-color: var(--bs-primary);
  background: none;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
