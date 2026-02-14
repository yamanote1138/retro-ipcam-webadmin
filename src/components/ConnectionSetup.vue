<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCamera } from '@/composables/useCamera'
import type { ConnectionSettings } from '@/types/camera'

const emit = defineEmits<{
  connected: []
}>()

const { connect, loadSavedSettings, errorMessage } = useCamera()

// Form fields
const host = ref('')
const port = ref(80)
const username = ref('admin')
const password = ref('')
const secure = ref(false)
const debugEnabled = ref(false)

// UI state
const showPassword = ref(false)
const attemptingConnection = ref(false)

// Load saved settings on mount
onMounted(() => {
  const saved = loadSavedSettings()
  if (saved) {
    host.value = saved.host
    port.value = saved.port
    username.value = saved.username
    password.value = saved.password
    secure.value = saved.secure
    debugEnabled.value = saved.debugEnabled
  }
})

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
    <div class="row justify-content-center mt-5">
      <div class="col-md-6 col-lg-5">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h2 class="card-title text-center mb-4">
              Retro IP Camera Admin
            </h2>
            <p class="text-muted text-center mb-4">
              Connect to your Amcrest or compatible camera
            </p>

            <form @submit.prevent="handleConnect">
              <!-- Host -->
              <div class="mb-3">
                <label for="host" class="form-label">Camera Host/IP</label>
                <input
                  id="host"
                  v-model="host"
                  type="text"
                  class="form-control"
                  placeholder="192.168.1.10 or camera.local"
                  required
                  :disabled="attemptingConnection"
                />
                <div class="form-text">IP address or hostname of your camera</div>
              </div>

              <!-- Port & Secure -->
              <div class="row mb-3">
                <div class="col-8">
                  <label for="port" class="form-label">Port</label>
                  <input
                    id="port"
                    v-model.number="port"
                    type="number"
                    class="form-control"
                    min="1"
                    max="65535"
                    required
                    :disabled="attemptingConnection"
                  />
                </div>
                <div class="col-4 d-flex align-items-end">
                  <div class="form-check">
                    <input
                      id="secure"
                      v-model="secure"
                      type="checkbox"
                      class="form-check-input"
                      :disabled="attemptingConnection"
                    />
                    <label for="secure" class="form-check-label">HTTPS</label>
                  </div>
                </div>
              </div>

              <!-- Username -->
              <div class="mb-3">
                <label for="username" class="form-label">Username</label>
                <input
                  id="username"
                  v-model="username"
                  type="text"
                  class="form-control"
                  placeholder="admin"
                  required
                  autocomplete="username"
                  :disabled="attemptingConnection"
                />
              </div>

              <!-- Password -->
              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <div class="input-group">
                  <input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    class="form-control"
                    placeholder="Enter camera password"
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

              <!-- Debug Mode -->
              <div class="mb-3">
                <div class="form-check">
                  <input
                    id="debug"
                    v-model="debugEnabled"
                    type="checkbox"
                    class="form-check-input"
                    :disabled="attemptingConnection"
                  />
                  <label for="debug" class="form-check-label">
                    Enable debug logging
                  </label>
                </div>
              </div>

              <!-- Error Message -->
              <div v-if="errorMessage" class="alert alert-danger" role="alert">
                <strong>Connection failed:</strong> {{ errorMessage }}
              </div>

              <!-- Security Warning -->
              <div class="alert alert-warning" role="alert">
                <small>
                  <strong>Security Note:</strong> Credentials are stored in browser localStorage
                  (not encrypted). Use only on trusted devices.
                </small>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn btn-primary w-100"
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
}
</style>
