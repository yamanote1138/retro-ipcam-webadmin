<script setup lang="ts">
import { computed } from 'vue'
import { useCamera } from '@/composables/useCamera'

const { systemInfo } = useCamera()

// Helper to format keys nicely
const formatKey = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

// Convert systemInfo object to array for display
const infoEntries = computed(() => {
  return Object.entries(systemInfo.value)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([key, value]) => ({
      label: formatKey(key),
      value: String(value)
    }))
})
</script>

<template>
  <div class="card shadow-sm">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">
        <i class="bi bi-camera-video me-2"></i>
        Camera Information
      </h5>
    </div>
    <div class="card-body">
      <div v-if="infoEntries.length === 0" class="text-muted">
        Loading camera information...
      </div>
      <table v-else class="table table-sm table-borderless mb-0">
        <tbody>
          <tr v-for="entry in infoEntries" :key="entry.label">
            <td class="text-muted" style="width: 40%">{{ entry.label }}</td>
            <td class="fw-medium">{{ entry.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.card-header {
  border-radius: 8px 8px 0 0;
}

.table td {
  padding: 0.5rem 0.75rem;
}
</style>
