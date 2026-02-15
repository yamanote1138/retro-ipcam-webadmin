import { ref, watch } from 'vue'

const isDark = ref(false)

// Check localStorage and system preference on load
const initDarkMode = () => {
  const stored = localStorage.getItem('dark-mode')

  if (stored !== null) {
    // Use stored preference
    isDark.value = stored === 'true'
  } else {
    // Use system preference
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  applyDarkMode()
}

const applyDarkMode = () => {
  if (isDark.value) {
    document.documentElement.setAttribute('data-bs-theme', 'dark')
    document.body.classList.add('dark-mode')
  } else {
    document.documentElement.removeAttribute('data-bs-theme')
    document.body.classList.remove('dark-mode')
  }
}

// Watch for changes and persist
watch(isDark, () => {
  localStorage.setItem('dark-mode', String(isDark.value))
  applyDarkMode()
})

// Initialize on first import
initDarkMode()

export function useDarkMode() {
  const toggle = () => {
    isDark.value = !isDark.value
  }

  return {
    isDark,
    toggle
  }
}
