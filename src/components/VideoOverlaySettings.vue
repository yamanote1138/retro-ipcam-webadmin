<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCamera } from '@/composables/useCamera'
import { logger } from '@/utils/logger'

const { getConfig, setConfig, isConnected } = useCamera()

// Tab state
const activeTab = ref<'camera-name' | 'timestamp' | 'logo'>('camera-name')

// State
const cameraName = ref('')
const originalCameraName = ref('')
const showOverlay = ref(true)
const originalShowOverlay = ref(true)
const showTimestamp = ref(true)
const originalShowTimestamp = ref(true)
const position = ref('top-left')
const originalPosition = ref('top-left')
const timestampPosition = ref('top-right')
const originalTimestampPosition = ref('top-right')
const showLogo = ref(false)
const originalShowLogo = ref(false)
const logoPosition = ref('bottom-right')
const originalLogoPosition = ref('bottom-right')
const overlayOpacity = ref(50)
const originalOverlayOpacity = ref(50)
const overlayBgColor = ref<'black' | 'white'>('black')
const originalOverlayBgColor = ref<'black' | 'white'>('black')
const overlayTextColor = ref<'black' | 'white'>('white')
const originalOverlayTextColor = ref<'black' | 'white'>('white')
const timestampOpacity = ref(50)
const originalTimestampOpacity = ref(50)
const timestampBgColor = ref<'black' | 'white'>('black')
const originalTimestampBgColor = ref<'black' | 'white'>('black')
const timestampTextColor = ref<'black' | 'white'>('white')
const originalTimestampTextColor = ref<'black' | 'white'>('white')
const isLoading = ref(true)
const isSaving = ref(false)
const message = ref<{ type: 'success' | 'error', text: string } | null>(null)

// Position presets (normalized 0-8192 coordinate system with edge spacing)
// Note: Y-coordinate 352 matches the timestamp's vertical offset for consistent spacing
const positionPresets: Record<string, number[]> = {
  'top-left': [256, 352, 2048, 769],
  'top-center': [3072, 352, 5120, 769],
  'top-right': [6144, 352, 7936, 769],
  'bottom-left': [256, 7424, 2048, 7936],
  'bottom-center': [3072, 7424, 5120, 7936],
  'bottom-right': [6144, 7424, 7936, 7936]
}

/**
 * Load current overlay settings from camera
 */
const loadCameraName = async () => {
  if (!isConnected.value) return

  try {
    isLoading.value = true
    message.value = null

    // Load camera name
    const nameConfig = await getConfig('ChannelTitle')
    logger.debug('ChannelTitle config:', nameConfig)

    let name = ''
    if (nameConfig.table?.ChannelTitle?.[0]?.Name !== undefined) {
      name = String(nameConfig.table.ChannelTitle[0].Name).trim()
      logger.info('Loaded camera name:', name)
    }

    cameraName.value = name
    originalCameraName.value = name

    // Load overlay visibility and position
    const widgetConfig = await getConfig('VideoWidget')
    logger.debug('VideoWidget config:', widgetConfig)

    if (widgetConfig.table?.VideoWidget?.[0]) {
      const widget = widgetConfig.table.VideoWidget[0]

      // Load camera name overlay settings
      if (widget.ChannelTitle) {
        const channelTitle = widget.ChannelTitle

        // Load visibility (EncodeBlend = true means shown on video)
        if (channelTitle.EncodeBlend !== undefined) {
          showOverlay.value = Boolean(channelTitle.EncodeBlend)
          originalShowOverlay.value = Boolean(channelTitle.EncodeBlend)
          logger.info('Loaded overlay visibility:', showOverlay.value)
        }

        // Load position
        if (Array.isArray(channelTitle.Rect) && channelTitle.Rect.length === 4) {
          const rect = channelTitle.Rect
          position.value = findClosestPosition(rect)
          originalPosition.value = position.value
          logger.info('Loaded overlay position:', position.value, rect)
        }

        // Load background color and opacity (BackColor = [R, G, B, Alpha])
        if (Array.isArray(channelTitle.BackColor) && channelTitle.BackColor.length === 4) {
          const [r, g, b, alpha] = channelTitle.BackColor
          const opacity = Math.round((alpha / 255) * 100)
          overlayOpacity.value = opacity
          originalOverlayOpacity.value = opacity

          // Determine if color is closer to black or white
          const brightness = (r + g + b) / 3
          const color = brightness > 127 ? 'white' : 'black'
          overlayBgColor.value = color
          originalOverlayBgColor.value = color
          logger.info('Loaded camera name bg opacity:', opacity, 'color:', color)
        }

        // Load text color (FrontColor = [R, G, B, Alpha])
        if (Array.isArray(channelTitle.FrontColor) && channelTitle.FrontColor.length === 4) {
          const [r, g, b] = channelTitle.FrontColor
          // Determine if text color is closer to black or white
          const brightness = (r + g + b) / 3
          const color = brightness > 127 ? 'white' : 'black'
          overlayTextColor.value = color
          originalOverlayTextColor.value = color
          logger.info('Loaded camera name text color:', color)
        }
      }

      // Load timestamp overlay settings
      if (widget.TimeTitle) {
        const timeTitle = widget.TimeTitle

        // Load visibility
        if (timeTitle.EncodeBlend !== undefined) {
          showTimestamp.value = Boolean(timeTitle.EncodeBlend)
          originalShowTimestamp.value = Boolean(timeTitle.EncodeBlend)
          logger.info('Loaded timestamp visibility:', showTimestamp.value)
        }

        // Load position
        if (Array.isArray(timeTitle.Rect) && timeTitle.Rect.length === 4) {
          const rect = timeTitle.Rect
          timestampPosition.value = findClosestPosition(rect)
          originalTimestampPosition.value = timestampPosition.value
          logger.info('Loaded timestamp position:', timestampPosition.value, rect)
        }

        // Load background color and opacity
        if (Array.isArray(timeTitle.BackColor) && timeTitle.BackColor.length === 4) {
          const [r, g, b, alpha] = timeTitle.BackColor
          const opacity = Math.round((alpha / 255) * 100)
          timestampOpacity.value = opacity
          originalTimestampOpacity.value = opacity

          // Determine if color is closer to black or white
          const brightness = (r + g + b) / 3
          const color = brightness > 127 ? 'white' : 'black'
          timestampBgColor.value = color
          originalTimestampBgColor.value = color
          logger.info('Loaded timestamp bg opacity:', opacity, 'color:', color)
        }

        // Load text color (FrontColor = [R, G, B, Alpha])
        if (Array.isArray(timeTitle.FrontColor) && timeTitle.FrontColor.length === 4) {
          const [r, g, b] = timeTitle.FrontColor
          // Determine if text color is closer to black or white
          const brightness = (r + g + b) / 3
          const color = brightness > 127 ? 'white' : 'black'
          timestampTextColor.value = color
          originalTimestampTextColor.value = color
          logger.info('Loaded timestamp text color:', color)
        }
      }

      // Load logo/image overlay settings (PictureTitle)
      if (widget.PictureTitle) {
        const pictureTitle = widget.PictureTitle

        // Load visibility
        if (pictureTitle.EncodeBlend !== undefined) {
          showLogo.value = Boolean(pictureTitle.EncodeBlend)
          originalShowLogo.value = Boolean(pictureTitle.EncodeBlend)
          logger.info('Loaded logo visibility:', showLogo.value)
        }

        // Load position
        if (Array.isArray(pictureTitle.Rect) && pictureTitle.Rect.length === 4) {
          const rect = pictureTitle.Rect
          logoPosition.value = findClosestPosition(rect)
          originalLogoPosition.value = logoPosition.value
          logger.info('Loaded logo position:', logoPosition.value, rect)
        }
      }
    }

    isLoading.value = false
  } catch (error: any) {
    logger.error('Failed to load overlay settings:', error)
    message.value = { type: 'error', text: 'Failed to load overlay settings' }
    isLoading.value = false
  }
}

/**
 * Find closest position preset for given coordinates
 */
const findClosestPosition = (rect: number[]): string => {
  let closest = 'top-left'
  let minDistance = Infinity

  for (const [presetName, presetRect] of Object.entries(positionPresets)) {
    // Calculate distance (simple Manhattan distance on first two coords)
    if (rect[0] !== undefined && rect[1] !== undefined &&
        presetRect[0] !== undefined && presetRect[1] !== undefined) {
      const distance = Math.abs(rect[0] - presetRect[0]) + Math.abs(rect[1] - presetRect[1])
      if (distance < minDistance) {
        minDistance = distance
        closest = presetName
      }
    }
  }

  return closest
}

/**
 * Save overlay settings to camera
 */
const saveCameraName = async () => {
  if (!isConnected.value || !hasChanges()) return

  try {
    isSaving.value = true
    message.value = null

    const params: Record<string, string> = {}

    // Save camera name if changed
    if (cameraName.value !== originalCameraName.value) {
      params['ChannelTitle[0].Name'] = cameraName.value
    }

    // Save camera name visibility if changed
    if (showOverlay.value !== originalShowOverlay.value) {
      params['VideoWidget[0].ChannelTitle.EncodeBlend'] = String(showOverlay.value)
    }

    // Save timestamp visibility if changed
    if (showTimestamp.value !== originalShowTimestamp.value) {
      params['VideoWidget[0].TimeTitle.EncodeBlend'] = String(showTimestamp.value)
    }

    // Save camera name position if changed
    if (position.value !== originalPosition.value) {
      const rect = positionPresets[position.value]
      if (rect) {
        params['VideoWidget[0].ChannelTitle.Rect[0]'] = String(rect[0])
        params['VideoWidget[0].ChannelTitle.Rect[1]'] = String(rect[1])
        params['VideoWidget[0].ChannelTitle.Rect[2]'] = String(rect[2])
        params['VideoWidget[0].ChannelTitle.Rect[3]'] = String(rect[3])
      }
    }

    // Save camera name background color if changed (RGB + alpha)
    if (overlayOpacity.value !== originalOverlayOpacity.value || overlayBgColor.value !== originalOverlayBgColor.value) {
      const alpha = Math.round((overlayOpacity.value / 100) * 255)
      const rgb = overlayBgColor.value === 'white' ? 255 : 0
      params['VideoWidget[0].ChannelTitle.BackColor[0]'] = String(rgb)
      params['VideoWidget[0].ChannelTitle.BackColor[1]'] = String(rgb)
      params['VideoWidget[0].ChannelTitle.BackColor[2]'] = String(rgb)
      params['VideoWidget[0].ChannelTitle.BackColor[3]'] = String(alpha)
    }

    // Save camera name text color if changed (FrontColor RGB)
    if (overlayTextColor.value !== originalOverlayTextColor.value) {
      const rgb = overlayTextColor.value === 'white' ? 255 : 0
      params['VideoWidget[0].ChannelTitle.FrontColor[0]'] = String(rgb)
      params['VideoWidget[0].ChannelTitle.FrontColor[1]'] = String(rgb)
      params['VideoWidget[0].ChannelTitle.FrontColor[2]'] = String(rgb)
    }

    // Save timestamp position if changed
    if (timestampPosition.value !== originalTimestampPosition.value) {
      const rect = positionPresets[timestampPosition.value]
      if (rect) {
        params['VideoWidget[0].TimeTitle.Rect[0]'] = String(rect[0])
        params['VideoWidget[0].TimeTitle.Rect[1]'] = String(rect[1])
        params['VideoWidget[0].TimeTitle.Rect[2]'] = String(rect[2])
        params['VideoWidget[0].TimeTitle.Rect[3]'] = String(rect[3])
      }
    }

    // Save timestamp background color if changed (RGB + alpha)
    if (timestampOpacity.value !== originalTimestampOpacity.value || timestampBgColor.value !== originalTimestampBgColor.value) {
      const alpha = Math.round((timestampOpacity.value / 100) * 255)
      const rgb = timestampBgColor.value === 'white' ? 255 : 0
      params['VideoWidget[0].TimeTitle.BackColor[0]'] = String(rgb)
      params['VideoWidget[0].TimeTitle.BackColor[1]'] = String(rgb)
      params['VideoWidget[0].TimeTitle.BackColor[2]'] = String(rgb)
      params['VideoWidget[0].TimeTitle.BackColor[3]'] = String(alpha)
    }

    // Save timestamp text color if changed (FrontColor RGB)
    if (timestampTextColor.value !== originalTimestampTextColor.value) {
      const rgb = timestampTextColor.value === 'white' ? 255 : 0
      params['VideoWidget[0].TimeTitle.FrontColor[0]'] = String(rgb)
      params['VideoWidget[0].TimeTitle.FrontColor[1]'] = String(rgb)
      params['VideoWidget[0].TimeTitle.FrontColor[2]'] = String(rgb)
    }

    // Save logo visibility if changed
    if (showLogo.value !== originalShowLogo.value) {
      params['VideoWidget[0].PictureTitle.EncodeBlend'] = String(showLogo.value)
    }

    // Save logo position if changed
    if (logoPosition.value !== originalLogoPosition.value) {
      const rect = positionPresets[logoPosition.value]
      if (rect) {
        params['VideoWidget[0].PictureTitle.Rect[0]'] = String(rect[0])
        params['VideoWidget[0].PictureTitle.Rect[1]'] = String(rect[1])
        params['VideoWidget[0].PictureTitle.Rect[2]'] = String(rect[2])
        params['VideoWidget[0].PictureTitle.Rect[3]'] = String(rect[3])
      }
    }

    if (Object.keys(params).length === 0) {
      isSaving.value = false
      return
    }

    const success = await setConfig(params)

    if (success) {
      originalCameraName.value = cameraName.value
      originalShowOverlay.value = showOverlay.value
      originalShowTimestamp.value = showTimestamp.value
      originalPosition.value = position.value
      originalTimestampPosition.value = timestampPosition.value
      originalShowLogo.value = showLogo.value
      originalLogoPosition.value = logoPosition.value
      originalOverlayOpacity.value = overlayOpacity.value
      originalOverlayBgColor.value = overlayBgColor.value
      originalOverlayTextColor.value = overlayTextColor.value
      originalTimestampOpacity.value = timestampOpacity.value
      originalTimestampBgColor.value = timestampBgColor.value
      originalTimestampTextColor.value = timestampTextColor.value
      message.value = { type: 'success', text: 'Overlay settings updated successfully' }
      setTimeout(() => {
        message.value = null
      }, 3000)
    } else {
      throw new Error('Failed to save configuration')
    }

    isSaving.value = false
  } catch (error: any) {
    logger.error('Failed to save overlay settings:', error)
    message.value = { type: 'error', text: error?.message || 'Failed to save overlay settings' }
    isSaving.value = false
  }
}

/**
 * Reset to original values
 */
const resetCameraName = () => {
  cameraName.value = originalCameraName.value
  showOverlay.value = originalShowOverlay.value
  showTimestamp.value = originalShowTimestamp.value
  position.value = originalPosition.value
  timestampPosition.value = originalTimestampPosition.value
  showLogo.value = originalShowLogo.value
  logoPosition.value = originalLogoPosition.value
  overlayOpacity.value = originalOverlayOpacity.value
  overlayBgColor.value = originalOverlayBgColor.value
  overlayTextColor.value = originalOverlayTextColor.value
  timestampOpacity.value = originalTimestampOpacity.value
  timestampBgColor.value = originalTimestampBgColor.value
  timestampTextColor.value = originalTimestampTextColor.value
  message.value = null
}

// Computed
const hasChanges = () => {
  return cameraName.value !== originalCameraName.value ||
         showOverlay.value !== originalShowOverlay.value ||
         showTimestamp.value !== originalShowTimestamp.value ||
         position.value !== originalPosition.value ||
         timestampPosition.value !== originalTimestampPosition.value ||
         showLogo.value !== originalShowLogo.value ||
         logoPosition.value !== originalLogoPosition.value ||
         overlayOpacity.value !== originalOverlayOpacity.value ||
         overlayBgColor.value !== originalOverlayBgColor.value ||
         overlayTextColor.value !== originalOverlayTextColor.value ||
         timestampOpacity.value !== originalTimestampOpacity.value ||
         timestampBgColor.value !== originalTimestampBgColor.value ||
         timestampTextColor.value !== originalTimestampTextColor.value
}

// Lifecycle
onMounted(() => {
  loadCameraName()
})
</script>

<template>
  <div class="card shadow-sm">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">
        <i class="bi bi-badge-cc me-2"></i>
        Video Overlays
      </h5>
    </div>

    <div class="card-body">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-3">
        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
        <div class="text-muted small mt-2">Loading settings...</div>
      </div>

      <!-- Settings Form -->
      <div v-else>
        <!-- Tab Navigation -->
        <ul class="nav nav-pills mb-3" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'camera-name' }"
              @click="activeTab = 'camera-name'"
              type="button"
            >
              <i class="bi bi-badge-cc me-2"></i>
              Camera Name
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'timestamp' }"
              @click="activeTab = 'timestamp'"
              type="button"
            >
              <i class="bi bi-clock me-2"></i>
              Timestamp
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'logo' }"
              @click="activeTab = 'logo'"
              type="button"
            >
              <i class="bi bi-image me-2"></i>
              Logo
            </button>
          </li>
        </ul>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Camera Name Section -->
          <div v-show="activeTab === 'camera-name'" class="overlay-section mb-4">

          <div class="mb-3">
            <label for="cameraName" class="form-label small fw-semibold">
              Name Text
              <span v-if="originalCameraName" class="text-muted fw-normal">
                (currently: {{ originalCameraName }})
              </span>
            </label>
            <input
              id="cameraName"
              v-model="cameraName"
              type="text"
              class="form-control form-control-sm"
              :placeholder="originalCameraName || 'Enter camera name'"
              maxlength="32"
              :disabled="isSaving"
            />
          </div>

          <div class="mb-3">
            <div class="form-check form-switch">
              <input
                id="showOverlay"
                v-model="showOverlay"
                type="checkbox"
                class="form-check-input"
                role="switch"
                :disabled="isSaving"
              />
              <label for="showOverlay" class="form-check-label small fw-semibold">
                Show on video
              </label>
            </div>
          </div>

          <div class="mb-3">
            <label for="position" class="form-label small fw-semibold">
              Position
            </label>
            <select
              id="position"
              v-model="position"
              class="form-select form-select-sm"
              :disabled="isSaving || !showOverlay"
            >
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-semibold">Background Color</label>
            <div class="btn-group d-flex" role="group">
              <button
                type="button"
                class="btn btn-sm"
                :class="overlayBgColor === 'black' ? 'btn-dark' : 'btn-outline-dark'"
                :disabled="isSaving || !showOverlay"
                @click="overlayBgColor = 'black'"
              >
                <i class="bi bi-circle-fill me-1"></i>
                Black
              </button>
              <button
                type="button"
                class="btn btn-sm"
                :class="overlayBgColor === 'white' ? 'btn-light border' : 'btn-outline-secondary'"
                :disabled="isSaving || !showOverlay"
                @click="overlayBgColor = 'white'"
              >
                <i class="bi bi-circle me-1"></i>
                White
              </button>
            </div>
          </div>

          <div class="mb-3">
            <label for="overlayOpacity" class="form-label small fw-semibold">
              Background Opacity
              <span class="text-muted fw-normal">({{ overlayOpacity }}%)</span>
            </label>
            <input
              id="overlayOpacity"
              v-model.number="overlayOpacity"
              type="range"
              class="form-range"
              min="0"
              max="100"
              step="5"
              :disabled="isSaving || !showOverlay"
            />
          </div>

          <div class="mb-0">
            <label class="form-label small fw-semibold">Text Color</label>
            <div class="btn-group d-flex" role="group">
              <button
                type="button"
                class="btn btn-sm"
                :class="overlayTextColor === 'black' ? 'btn-dark' : 'btn-outline-dark'"
                :disabled="isSaving || !showOverlay"
                @click="overlayTextColor = 'black'"
              >
                <i class="bi bi-circle-fill me-1"></i>
                Black
              </button>
              <button
                type="button"
                class="btn btn-sm"
                :class="overlayTextColor === 'white' ? 'btn-light border' : 'btn-outline-secondary'"
                :disabled="isSaving || !showOverlay"
                @click="overlayTextColor = 'white'"
              >
                <i class="bi bi-circle me-1"></i>
                White
              </button>
            </div>
          </div>
        </div>

          <!-- Timestamp Section -->
          <div v-show="activeTab === 'timestamp'" class="overlay-section mb-4">
            <div class="mb-3">
            <div class="form-check form-switch">
              <input
                id="showTimestamp"
                v-model="showTimestamp"
                type="checkbox"
                class="form-check-input"
                role="switch"
                :disabled="isSaving"
              />
              <label for="showTimestamp" class="form-check-label small fw-semibold">
                Show on video
              </label>
            </div>
          </div>

          <div class="mb-3">
            <label for="timestampPosition" class="form-label small fw-semibold">
              Position
            </label>
            <select
              id="timestampPosition"
              v-model="timestampPosition"
              class="form-select form-select-sm"
              :disabled="isSaving || !showTimestamp"
            >
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-semibold">Background Color</label>
            <div class="btn-group d-flex" role="group">
              <button
                type="button"
                class="btn btn-sm"
                :class="timestampBgColor === 'black' ? 'btn-dark' : 'btn-outline-dark'"
                :disabled="isSaving || !showTimestamp"
                @click="timestampBgColor = 'black'"
              >
                <i class="bi bi-circle-fill me-1"></i>
                Black
              </button>
              <button
                type="button"
                class="btn btn-sm"
                :class="timestampBgColor === 'white' ? 'btn-light border' : 'btn-outline-secondary'"
                :disabled="isSaving || !showTimestamp"
                @click="timestampBgColor = 'white'"
              >
                <i class="bi bi-circle me-1"></i>
                White
              </button>
            </div>
          </div>

          <div class="mb-3">
            <label for="timestampOpacity" class="form-label small fw-semibold">
              Background Opacity
              <span class="text-muted fw-normal">({{ timestampOpacity }}%)</span>
            </label>
            <input
              id="timestampOpacity"
              v-model.number="timestampOpacity"
              type="range"
              class="form-range"
              min="0"
              max="100"
              step="5"
              :disabled="isSaving || !showTimestamp"
            />
          </div>

          <div class="mb-0">
            <label class="form-label small fw-semibold">Text Color</label>
            <div class="btn-group d-flex" role="group">
              <button
                type="button"
                class="btn btn-sm"
                :class="timestampTextColor === 'black' ? 'btn-dark' : 'btn-outline-dark'"
                :disabled="isSaving || !showTimestamp"
                @click="timestampTextColor = 'black'"
              >
                <i class="bi bi-circle-fill me-1"></i>
                Black
              </button>
              <button
                type="button"
                class="btn btn-sm"
                :class="timestampTextColor === 'white' ? 'btn-light border' : 'btn-outline-secondary'"
                :disabled="isSaving || !showTimestamp"
                @click="timestampTextColor = 'white'"
              >
                <i class="bi bi-circle me-1"></i>
                White
              </button>
            </div>
          </div>
        </div>

          <!-- Logo Section -->
          <div v-show="activeTab === 'logo'" class="overlay-section mb-4">
            <div class="mb-3">
            <div class="form-check form-switch">
              <input
                id="showLogo"
                v-model="showLogo"
                type="checkbox"
                class="form-check-input"
                role="switch"
                :disabled="isSaving"
              />
              <label for="showLogo" class="form-check-label small fw-semibold">
                Show on video
              </label>
            </div>
          </div>

          <div class="mb-0" v-if="showLogo">
            <label for="logoPosition" class="form-label small fw-semibold">
              Position
            </label>
            <select
              id="logoPosition"
              v-model="logoPosition"
              class="form-select form-select-sm"
              :disabled="isSaving"
            >
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="message" class="alert alert-sm py-2 mb-3" :class="{
          'alert-success': message.type === 'success',
          'alert-danger': message.type === 'error'
        }" role="alert">
          <small>{{ message.text }}</small>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex gap-2">
          <button
            class="btn btn-primary btn-sm"
            @click="saveCameraName"
            :disabled="!hasChanges() || isSaving"
          >
            <span v-if="isSaving" class="spinner-border spinner-border-sm me-1" role="status"></span>
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
          <button
            class="btn btn-outline-secondary btn-sm"
            @click="resetCameraName"
            :disabled="!hasChanges() || isSaving"
          >
            Reset
          </button>
          <button
            class="btn btn-outline-primary btn-sm ms-auto"
            @click="loadCameraName"
            :disabled="isSaving"
            title="Reload settings from camera"
          >
            <i class="bi bi-arrow-clockwise"></i>
            Refresh
          </button>
        </div>

        <!-- Info -->
        <div class="alert alert-info alert-sm mt-3 mb-0 py-2">
          <small>
            <i class="bi bi-info-circle me-1"></i>
            Changes are applied immediately to the camera. You may need to wait a few seconds to see the updated overlay in the video preview.
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-header {
  border-radius: 8px 8px 0 0;
}

.alert-sm {
  font-size: 0.875rem;
}

.gap-2 {
  gap: 0.5rem;
}

.overlay-section {
  padding: 1.5rem;
  border-radius: 6px;
  background-color: var(--bs-secondary-bg);
  border: 1px solid var(--bs-border-color);
}

.nav-pills .nav-link {
  color: var(--bs-body-color);
  transition: all 0.2s;
}

.nav-pills .nav-link:hover {
  background-color: var(--bs-secondary-bg);
}

.nav-pills .nav-link.active {
  background-color: var(--bs-primary);
  color: white;
}

.tab-content {
  min-height: 300px;
}
</style>
