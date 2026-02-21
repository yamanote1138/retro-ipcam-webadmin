<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCamera } from '@/composables/useCamera'
import type { ConnectionSettings } from '@/types/camera'

const emit = defineEmits<{
  connected: []
}>()

const { connect, loadSavedSettings, loadEncryptedSettings, hasEncryptedSettings, errorMessage } = useCamera()

// Form fields
const host = ref('')
const port = ref(80)
const username = ref('admin')
const password = ref('')
const secure = ref(false)
const debugEnabled = ref(false)
// proxyMode removed - always enabled

// UI state
const showPassword = ref(false)
const attemptingConnection = ref(false)

// Encryption state
const hasEncrypted = ref(false)
const isUnlocking = ref(false)
const unlockPassword = ref('')
const showUnlockPassword = ref(false)
const unlockError = ref('')
const settingsUnlocked = ref(false)

// Load saved settings on mount
onMounted(() => {
  // Check if encrypted settings exist
  hasEncrypted.value = hasEncryptedSettings()

  if (hasEncrypted.value) {
    // Encrypted settings exist - user must unlock them first
    return
  }

  // No encrypted settings - check for legacy plaintext settings
  const saved = loadSavedSettings()
  if (saved) {
    host.value = saved.host
    port.value = saved.port
    username.value = saved.username
    // Don't load password for security - user enters it each time
    secure.value = saved.secure
    debugEnabled.value = saved.debugEnabled
    // proxyMode always enabled - no need to load
  }
})

// Handle unlocking encrypted settings
const handleUnlock = async () => {
  if (!unlockPassword.value) {
    unlockError.value = 'Password is required'
    return
  }

  isUnlocking.value = true
  unlockError.value = ''

  try {
    const settings = await loadEncryptedSettings(unlockPassword.value)

    if (settings) {
      // Auto-fill form with decrypted settings
      host.value = settings.host
      port.value = settings.port
      username.value = settings.username
      secure.value = settings.secure
      debugEnabled.value = settings.debugEnabled
      // proxyMode always enabled - no need to set

      // Store password for connection (not displayed)
      password.value = unlockPassword.value

      // Mark as unlocked
      settingsUnlocked.value = true
      unlockError.value = ''
    }
  } catch (error: any) {
    unlockError.value = error.message || 'Failed to decrypt settings'
  } finally {
    isUnlocking.value = false
  }
}

const handleConnect = async () => {
  if (!host.value || !username.value || !password.value) {
    return
  }

  attemptingConnection.value = true

  const settings: ConnectionSettings = {
    host: host.value.trim(),
    port: port.value,
    username: username.value.trim(),
    password: password.value,
    secure: secure.value,
    debugEnabled: debugEnabled.value
    // proxyMode: always true (no longer configurable)
  }

  const success = await connect(settings)

  attemptingConnection.value = false

  if (success) {
    emit('connected')
  }
}
</script>

<template>
  <div class="container">
    <div class="row justify-content-center mt-4">
      <div class="col-md-6 col-lg-4">
        <div class="card shadow-sm">
          <div class="card-body p-3">
            <h4 class="card-title text-center mb-2">
              Retro IP Camera Admin
            </h4>
            <p class="text-muted text-center small mb-3">
              Connect to your Amcrest or compatible camera
            </p>

            <!-- Unlock Form (shown if encrypted settings exist and not yet unlocked) -->
            <form v-if="hasEncrypted && !settingsUnlocked" @submit.prevent="handleUnlock">
              <div class="alert alert-info alert-sm py-2 mb-3" role="alert">
                <small>
                  <strong>Encrypted settings found.</strong><br>
                  Enter your password to unlock saved connection settings.
                </small>
              </div>

              <!-- Unlock Password -->
              <div class="mb-2">
                <label for="unlockPassword" class="form-label small">Password</label>
                <div class="input-group input-group-sm">
                  <input
                    id="unlockPassword"
                    v-model="unlockPassword"
                    :type="showUnlockPassword ? 'text' : 'password'"
                    class="form-control"
                    placeholder="Enter your password"
                    required
                    autocomplete="current-password"
                    :disabled="isUnlocking"
                  />
                  <button
                    class="btn btn-outline-secondary"
                    type="button"
                    @click="showUnlockPassword = !showUnlockPassword"
                    :disabled="isUnlocking"
                  >
                    {{ showUnlockPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
              </div>

              <!-- Unlock Error -->
              <div v-if="unlockError" class="alert alert-danger alert-sm py-2 mb-2" role="alert">
                <small><strong>Unlock failed:</strong> {{ unlockError }}</small>
              </div>

              <!-- Unlock Button -->
              <button
                type="submit"
                class="btn btn-primary btn-sm w-100 mb-2"
                :disabled="isUnlocking"
              >
                <span v-if="isUnlocking" class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ isUnlocking ? 'Unlocking...' : 'Unlock Settings' }}
              </button>

              <!-- Manual Entry Option -->
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm w-100"
                @click="hasEncrypted = false"
              >
                Enter Connection Details Manually
              </button>
            </form>

            <!-- Connection Form (shown if no encrypted settings or after unlock) -->
            <form v-else @submit.prevent="handleConnect">
              <!-- Host -->
              <div class="mb-2">
                <label for="host" class="form-label small">Camera Host/IP</label>
                <input
                  id="host"
                  v-model="host"
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="192.168.1.10"
                  required
                  :disabled="attemptingConnection"
                />
              </div>

              <!-- Port & Secure -->
              <div class="row mb-2">
                <div class="col-8">
                  <label for="port" class="form-label small">Port</label>
                  <input
                    id="port"
                    v-model.number="port"
                    type="number"
                    class="form-control form-control-sm"
                    min="1"
                    max="65535"
                    required
                    :disabled="attemptingConnection"
                  />
                </div>
                <div class="col-4 d-flex align-items-end">
                  <div class="form-check form-check-sm">
                    <input
                      id="secure"
                      v-model="secure"
                      type="checkbox"
                      class="form-check-input"
                      :disabled="attemptingConnection"
                    />
                    <label for="secure" class="form-check-label small">HTTPS</label>
                  </div>
                </div>
              </div>

              <!-- Username -->
              <div class="mb-2">
                <label for="username" class="form-label small">Username</label>
                <input
                  id="username"
                  v-model="username"
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="admin"
                  required
                  autocomplete="username"
                  :disabled="attemptingConnection"
                />
              </div>

              <!-- Password -->
              <div class="mb-2">
                <label for="password" class="form-label small">Password</label>
                <div class="input-group input-group-sm">
                  <input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    class="form-control"
                    placeholder="Enter password"
                    required
                    autocomplete="current-password"
                    :disabled="attemptingConnection"
                  />
                  <button
                    class="btn btn-outline-secondary"
                    type="button"
                    @click="showPassword = !showPassword"
                    :disabled="attemptingConnection"
                  >
                    {{ showPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
              </div>

              <!-- Options -->
              <div class="mb-2">
                <div class="form-check form-check-sm">
                  <input
                    id="debug"
                    v-model="debugEnabled"
                    type="checkbox"
                    class="form-check-input"
                    :disabled="attemptingConnection"
                  />
                  <label for="debug" class="form-check-label small">
                    Enable debug logging
                  </label>
                </div>
              </div>

              <!-- Error Message -->
              <div v-if="errorMessage" class="alert alert-danger alert-sm py-2 mb-2" role="alert">
                <small><strong>Connection failed:</strong> {{ errorMessage }}</small>
              </div>

              <!-- Security Info -->
              <div class="alert alert-info alert-sm py-1 mb-2" role="alert">
                <small class="text-muted">
                  <strong>Encrypted storage:</strong> Settings are encrypted with your password using AES-256-GCM.
                </small>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn btn-primary btn-sm w-100"
                :disabled="attemptingConnection"
              >
                <span v-if="attemptingConnection" class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ attemptingConnection ? 'Connecting...' : 'Connect' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 8px;
}

.card-title {
  color: #333;
  font-weight: 600;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.25rem;
  text-align: left;
  display: block;
}

.form-check {
  margin-bottom: 0.25rem;
  text-align: left;
  padding-left: 1.5em;
}

.form-check-label {
  text-align: left;
}

.alert-sm {
  font-size: 0.875rem;
  text-align: left;
}
</style>
