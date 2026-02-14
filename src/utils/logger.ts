/**
 * Centralized logging utility
 *
 * Debug messages only show when localStorage.getItem('camera-debug-enabled') === 'true'
 * Info, warn, error always shown
 */

const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('camera-debug-enabled') === 'true'
}

export const logger = {
  debug: (...args: any[]) => {
    if (isDebugEnabled()) {
      console.log('[DEBUG]', ...args)
    }
  },

  info: (...args: any[]) => {
    console.info('[INFO]', ...args)
  },

  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args)
  },

  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  }
}
