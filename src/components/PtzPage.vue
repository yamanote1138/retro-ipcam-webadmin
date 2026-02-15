<template>
  <div class="container-fluid py-4">
    <!-- Video Preview -->
    <div class="row mb-4">
      <div class="col-12">
        <VideoPreview />
      </div>
    </div>

    <div class="row g-4">
      <!-- PTZ Controls -->
      <div class="col-12 col-lg-6">
        <div class="card shadow-sm">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">
              <i class="bi bi-joystick me-2"></i>
              PTZ Controls
            </h5>
          </div>
          <div class="card-body">
            <!-- Pan/Tilt Controls -->
            <div class="text-center mb-4">
              <h6 class="text-muted small mb-3">Pan & Tilt</h6>
              <div class="ptz-grid">
                <button class="btn btn-outline-secondary" @mousedown="startMove('LeftUp')" @mouseup="stopMove('LeftUp')" @mouseleave="stopMove('LeftUp')">
                  <i class="bi bi-arrow-up-left"></i>
                </button>
                <button class="btn btn-outline-secondary" @mousedown="startMove('Up')" @mouseup="stopMove('Up')" @mouseleave="stopMove('Up')">
                  <i class="bi bi-arrow-up"></i>
                </button>
                <button class="btn btn-outline-secondary" @mousedown="startMove('RightUp')" @mouseup="stopMove('RightUp')" @mouseleave="stopMove('RightUp')">
                  <i class="bi bi-arrow-up-right"></i>
                </button>

                <button class="btn btn-outline-secondary" @mousedown="startMove('Left')" @mouseup="stopMove('Left')" @mouseleave="stopMove('Left')">
                  <i class="bi bi-arrow-left"></i>
                </button>
                <button class="btn btn-outline-secondary btn-lg" disabled>
                  <i class="bi bi-circle"></i>
                </button>
                <button class="btn btn-outline-secondary" @mousedown="startMove('Right')" @mouseup="stopMove('Right')" @mouseleave="stopMove('Right')">
                  <i class="bi bi-arrow-right"></i>
                </button>

                <button class="btn btn-outline-secondary" @mousedown="startMove('LeftDown')" @mouseup="stopMove('LeftDown')" @mouseleave="stopMove('LeftDown')">
                  <i class="bi bi-arrow-down-left"></i>
                </button>
                <button class="btn btn-outline-secondary" @mousedown="startMove('Down')" @mouseup="stopMove('Down')" @mouseleave="stopMove('Down')">
                  <i class="bi bi-arrow-down"></i>
                </button>
                <button class="btn btn-outline-secondary" @mousedown="startMove('RightDown')" @mouseup="stopMove('RightDown')" @mouseleave="stopMove('RightDown')">
                  <i class="bi bi-arrow-down-right"></i>
                </button>
              </div>
            </div>

            <!-- Zoom Controls -->
            <div class="row mb-3">
              <div class="col-6">
                <h6 class="text-muted small mb-2">Zoom</h6>
                <div class="btn-group d-flex">
                  <button class="btn btn-outline-secondary" @mousedown="startMove('ZoomWide')" @mouseup="stopMove('ZoomWide')" @mouseleave="stopMove('ZoomWide')">
                    <i class="bi bi-zoom-out me-1"></i> Wide
                  </button>
                  <button class="btn btn-outline-secondary" @mousedown="startMove('ZoomTele')" @mouseup="stopMove('ZoomTele')" @mouseleave="stopMove('ZoomTele')">
                    <i class="bi bi-zoom-in me-1"></i> Tele
                  </button>
                </div>
              </div>
              <div class="col-6">
                <h6 class="text-muted small mb-2">Focus</h6>
                <div class="btn-group d-flex">
                  <button class="btn btn-outline-secondary" @mousedown="startMove('FocusNear')" @mouseup="stopMove('FocusNear')" @mouseleave="stopMove('FocusNear')">
                    <i class="fas fa-minus me-1"></i> Near
                  </button>
                  <button class="btn btn-outline-secondary" @mousedown="startMove('FocusFar')" @mouseup="stopMove('FocusFar')" @mouseleave="stopMove('FocusFar')">
                    <i class="fas fa-plus me-1"></i> Far
                  </button>
                </div>
              </div>
            </div>

            <!-- Speed Control -->
            <div class="mb-0">
              <label for="ptzSpeed" class="form-label small fw-semibold">
                Movement Speed
                <span class="text-muted fw-normal">({{ speed }})</span>
              </label>
              <input
                id="ptzSpeed"
                v-model.number="speed"
                type="range"
                class="form-range"
                min="1"
                max="8"
                step="1"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Presets -->
      <div class="col-12 col-lg-6">
        <div class="card shadow-sm">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">
              <i class="bi bi-bookmark me-2"></i>
              Presets
            </h5>
          </div>
          <div class="card-body">
            <!-- Loading State -->
            <div v-if="isLoadingPresets" class="text-center py-3">
              <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
              <span class="ms-2 small">Loading presets...</span>
            </div>

            <!-- Preset List -->
            <div v-else class="preset-list">
              <div v-for="presetNum in 16" :key="presetNum" class="preset-item">
                <div class="d-flex align-items-center gap-2">
                  <span class="preset-number">{{ presetNum }}</span>
                  <button
                    class="btn btn-sm btn-outline-primary flex-grow-1 text-start"
                    :disabled="isMoving"
                    @click="gotoPreset(presetNum)"
                  >
                    <i class="bi bi-play-fill me-1"></i>
                    Go to Preset {{ presetNum }}
                  </button>
                  <button
                    class="btn btn-sm btn-outline-success"
                    :disabled="isMoving"
                    @click="setPreset(presetNum)"
                    title="Save current position"
                  >
                    <i class="bi bi-save"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    :disabled="isMoving"
                    @click="clearPreset(presetNum)"
                    title="Clear preset"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Status Message -->
            <div v-if="message" class="alert mt-3 mb-0" :class="message.type === 'error' ? 'alert-danger' : 'alert-success'">
              {{ message.text }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCamera } from '@/composables/useCamera'
import { logger } from '@/utils/logger'
import VideoPreview from '@/components/VideoPreview.vue'

const { ptzStart, ptzStop, ptzGotoPreset, ptzSetPreset, ptzClearPreset, isConnected } = useCamera()

const isLoadingPresets = ref(false)
const isMoving = ref(false)
const speed = ref(4)
const message = ref<{ type: 'success' | 'error', text: string } | null>(null)
const activeMovement = ref<string | null>(null)

/**
 * Start PTZ movement
 */
const startMove = async (code: string) => {
  if (!isConnected.value || isMoving.value) return

  try {
    activeMovement.value = code
    await ptzStart(code, speed.value)
    logger.debug(`PTZ movement started: ${code}`)
  } catch (error: any) {
    logger.error('PTZ start failed:', error)
    showMessage('error', `PTZ control failed: ${error.message}`)
  }
}

/**
 * Stop PTZ movement
 */
const stopMove = async (code: string) => {
  if (!isConnected.value || activeMovement.value !== code) return

  try {
    await ptzStop(code)
    activeMovement.value = null
    logger.debug(`PTZ movement stopped: ${code}`)
  } catch (error: any) {
    logger.error('PTZ stop failed:', error)
  }
}

/**
 * Go to preset position
 */
const gotoPreset = async (presetNumber: number) => {
  if (!isConnected.value || isMoving.value) return

  try {
    isMoving.value = true
    await ptzGotoPreset(presetNumber)
    showMessage('success', `Moving to preset ${presetNumber}`)
    logger.info(`Moved to preset ${presetNumber}`)

    // Clear moving state after 2 seconds
    setTimeout(() => {
      isMoving.value = false
    }, 2000)
  } catch (error: any) {
    logger.error('Go to preset failed:', error)
    showMessage('error', `Failed to go to preset: ${error.message}`)
    isMoving.value = false
  }
}

/**
 * Save current position as preset
 */
const setPreset = async (presetNumber: number) => {
  if (!isConnected.value || isMoving.value) return

  try {
    isMoving.value = true
    await ptzSetPreset(presetNumber)
    showMessage('success', `Preset ${presetNumber} saved`)
    logger.info(`Set preset ${presetNumber}`)
    isMoving.value = false
  } catch (error: any) {
    logger.error('Set preset failed:', error)
    showMessage('error', `Failed to set preset: ${error.message}`)
    isMoving.value = false
  }
}

/**
 * Clear preset
 */
const clearPreset = async (presetNumber: number) => {
  if (!isConnected.value || isMoving.value) return

  if (!confirm(`Clear preset ${presetNumber}?`)) return

  try {
    isMoving.value = true
    await ptzClearPreset(presetNumber)
    showMessage('success', `Preset ${presetNumber} cleared`)
    logger.info(`Cleared preset ${presetNumber}`)
    isMoving.value = false
  } catch (error: any) {
    logger.error('Clear preset failed:', error)
    showMessage('error', `Failed to clear preset: ${error.message}`)
    isMoving.value = false
  }
}

/**
 * Show status message
 */
const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 3000)
}

// Stop any active movement when component unmounts
onUnmounted(() => {
  if (activeMovement.value) {
    ptzStop(activeMovement.value)
  }
})

onMounted(() => {
  isLoadingPresets.value = false
})
</script>

<style scoped>
.ptz-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
  max-width: 180px;
  margin: 0 auto;
}

.ptz-grid .btn {
  padding: 0.4rem;
  font-size: 0.9rem;
}

.ptz-grid .btn-lg {
  pointer-events: none;
  opacity: 0.3;
}

.preset-list {
  max-height: 500px;
  overflow-y: auto;
}

.preset-item {
  margin-bottom: 0.5rem;
}

.preset-number {
  display: inline-block;
  width: 30px;
  text-align: center;
  font-weight: 600;
  color: var(--bs-secondary);
  font-size: 0.875rem;
}

.preset-item .btn {
  transition: all 0.2s;
}

.preset-item .btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

/* Dark mode adjustments */
body.dark-mode .preset-number {
  color: var(--bs-light);
}
</style>
