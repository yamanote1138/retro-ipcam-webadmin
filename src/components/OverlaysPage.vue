<script setup lang="ts">
import VideoPreview from '@/components/VideoPreview.vue'
import VideoOverlaySettings from '@/components/VideoOverlaySettings.vue'
</script>

<template>
  <div class="container-fluid mt-4">
    <!-- Video Preview on Top -->
    <div class="row mb-4">
      <div class="col-12">
        <VideoPreview />
      </div>
    </div>

    <!-- Overlay Controls Below -->
    <div class="row">
      <div class="col-12">
        <VideoOverlaySettings />
      </div>
    </div>
  </div>
</template>
