<script setup lang="ts">
import { ref } from 'vue'
import { useCamera } from '@/composables/useCamera'
import ConnectionSetup from '@/components/ConnectionSetup.vue'
import StatusBar from '@/components/StatusBar.vue'

const { isConnected } = useCamera()
const showSetup = ref(!isConnected.value)

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

      <div class="container-fluid mt-4">
        <div class="row">
          <div class="col-12">
            <div class="alert alert-info" role="alert">
              <h5>Connected Successfully!</h5>
              <p class="mb-0">
                Camera administration interface will be displayed here.
                More features coming soon!
              </p>
            </div>
          </div>
        </div>
      </div>
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

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
