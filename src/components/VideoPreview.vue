<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useCamera } from '@/composables/useCamera'
import { logger } from '@/utils/logger'

const { getSnapshot, isConnected } = useCamera()

// State
const imageUrl = ref<string | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const isRefreshing = ref(true)
const refreshRate = ref(1000) // milliseconds
const lastUpdate = ref<Date | null>(null)

// Polling
let pollInterval: number | null = null
let previousBlobUrl: string | null = null

// Computed
const timeSinceUpdate = computed(() => {
  if (!lastUpdate.value) return null
  const seconds = Math.floor((Date.now() - lastUpdate.value.getTime()) / 1000)
  return seconds === 0 ? 'just now' : `${seconds}s ago`
})

/**
 * Fetch and display a single snapshot
 */
const fetchSnapshot = async () => {
  if (!isConnected.value) {
    error.value = 'Not connected to camera'
    return
  }

  try {
    error.value = null
    const blob = await getSnapshot(1)

    if (blob) {
      // Revoke previous blob URL to prevent memory leak
      if (previousBlobUrl) {
        URL.revokeObjectURL(previousBlobUrl)
      }

      // Create new blob URL
      const url = URL.createObjectURL(blob)
      imageUrl.value = url
      previousBlobUrl = url
      lastUpdate.value = new Date()
      isLoading.value = false
    } else {
      throw new Error('No snapshot data received')
    }
  } catch (err: any) {
    logger.error('Failed to fetch snapshot:', err)
    error.value = err?.message || 'Failed to fetch snapshot'
    isLoading.value = false
  }
}

/**
 * Start polling for snapshots
 */
const startRefresh = () => {
  if (pollInterval) return

  isRefreshing.value = true
  fetchSnapshot() // Immediate fetch

  pollInterval = window.setInterval(() => {
    fetchSnapshot()
  }, refreshRate.value)
}

/**
 * Stop polling
 */
const stopRefresh = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  isRefreshing.value = false
}

/**
 * Change refresh rate
 */
const changeRefreshRate = (rate: number) => {
  refreshRate.value = rate
  if (isRefreshing.value) {
    stopRefresh()
    startRefresh()
  }
}

// Lifecycle
onMounted(() => {
  if (isConnected.value) {
    startRefresh()
  }
})

onBeforeUnmount(() => {
  stopRefresh()
  // Clean up blob URL
  if (previousBlobUrl) {
    URL.revokeObjectURL(previousBlobUrl)
  }
})
</script>

<template>
  <div class="card shadow-sm">
    <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
      <h5 class="mb-0">
        <i class="bi bi-play-circle me-2"></i>
        Live Preview
      </h5>
      <small v-if="lastUpdate" class="text-white-50">
        {{ timeSinceUpdate }}
      </small>
    </div>

    <div class="card-body p-0 position-relative">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="preview-placeholder d-flex align-items-center justify-content-center"
      >
        <div class="text-center">
          <div class="spinner-border text-primary mb-2" role="status"></div>
          <div class="text-muted">Loading snapshot...</div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="preview-placeholder d-flex align-items-center justify-content-center"
      >
        <div class="text-center text-danger">
          <i class="bi bi-exclamation-triangle fs-1 mb-2"></i>
          <div>{{ error }}</div>
          <button class="btn btn-sm btn-outline-primary mt-2" @click="fetchSnapshot">
            Retry
          </button>
        </div>
      </div>

      <!-- Video Preview -->
      <div v-else-if="imageUrl" class="preview-image">
        <img :src="imageUrl" alt="Camera preview" class="img-fluid" />
      </div>
    </div>

    <!-- Controls -->
    <div class="card-footer bg-light">
      <div class="d-flex justify-content-between align-items-center">
        <div class="btn-group btn-group-sm" role="group">
          <button
            class="btn"
            :class="isRefreshing ? 'btn-danger' : 'btn-success'"
            @click="isRefreshing ? stopRefresh() : startRefresh()"
          >
            <i class="bi" :class="isRefreshing ? 'bi-pause-fill' : 'bi-play-fill'"></i>
            {{ isRefreshing ? 'Pause' : 'Play' }}
          </button>
          <button
            class="btn btn-outline-secondary"
            @click="fetchSnapshot"
            :disabled="isRefreshing"
          >
            <i class="bi bi-arrow-clockwise"></i>
            Refresh
          </button>
        </div>

        <div class="d-flex align-items-center">
          <small class="text-muted me-2">Refresh:</small>
          <div class="btn-group btn-group-sm" role="group">
            <button
              v-for="rate in [500, 1000, 2000]"
              :key="rate"
              class="btn btn-sm"
              :class="refreshRate === rate ? 'btn-primary' : 'btn-outline-secondary'"
              @click="changeRefreshRate(rate)"
            >
              {{ rate === 1000 ? '1s' : rate < 1000 ? `${rate}ms` : `${rate / 1000}s` }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-placeholder {
  aspect-ratio: 16 / 9;
  background-color: #000;
  color: white;
  min-height: 300px;
}

.preview-image {
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 600px;
  overflow: hidden;
}

.preview-image img {
  width: 100%;
  height: auto;
  display: block;
}

.card-header {
  border-radius: 8px 8px 0 0;
}

.card-footer {
  padding: 0.75rem 1rem;
}
</style>
