/**
 * Camera composable - Singleton pattern
 *
 * Manages camera connection state and provides API access
 * Similar to useJmri from the trains project
 */

import { ref, computed } from 'vue'
import { CameraApiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { ConnectionSettings, SystemInfo, ConnectionState } from '@/types/camera'

// Singleton state
const client = ref<CameraApiClient | null>(null)
const connectionState = ref<ConnectionState>('disconnected' as ConnectionState)
const systemInfo = ref<SystemInfo>({})
const errorMessage = ref<string>('')

export function useCamera() {
  /**
   * Initialize connection with settings
   */
  const connect = async (settings: ConnectionSettings): Promise<boolean> => {
    try {
      connectionState.value = 'connecting' as ConnectionState
      errorMessage.value = ''

      logger.info('Connecting to camera:', settings.host)

      // Set debug mode based on settings
      if (settings.debugEnabled) {
        localStorage.setItem('camera-debug-enabled', 'true')
      } else {
        localStorage.removeItem('camera-debug-enabled')
      }

      // Create new client
      client.value = new CameraApiClient(settings)

      // Test connection
      const connected = await client.value.testConnection()

      if (connected) {
        connectionState.value = 'connected' as ConnectionState
        logger.info('Connected to camera successfully')

        // Fetch system info
        await refreshSystemInfo()

        // Save connection settings to localStorage
        localStorage.setItem('camera-connection-settings', JSON.stringify(settings))

        return true
      } else {
        throw new Error('Connection test failed')
      }
    } catch (error: any) {
      connectionState.value = 'error' as ConnectionState
      errorMessage.value = error?.message || 'Failed to connect to camera'
      logger.error('Connection failed:', error)
      return false
    }
  }

  /**
   * Disconnect and clear state
   */
  const disconnect = () => {
    client.value = null
    connectionState.value = 'disconnected' as ConnectionState
    systemInfo.value = {}
    errorMessage.value = ''
    logger.info('Disconnected from camera')
  }

  /**
   * Load saved connection settings from localStorage
   */
  const loadSavedSettings = (): ConnectionSettings | null => {
    try {
      const saved = localStorage.getItem('camera-connection-settings')
      if (saved) {
        return JSON.parse(saved) as ConnectionSettings
      }
    } catch (error) {
      logger.error('Failed to load saved settings:', error)
    }
    return null
  }

  /**
   * Clear saved connection settings
   */
  const clearSavedSettings = () => {
    localStorage.removeItem('camera-connection-settings')
    localStorage.removeItem('camera-debug-enabled')
  }

  /**
   * Refresh system information
   */
  const refreshSystemInfo = async () => {
    if (!client.value) return

    try {
      const info = await client.value.getSystemInfo()
      systemInfo.value = info
      logger.debug('System info:', info)
    } catch (error) {
      logger.error('Failed to refresh system info:', error)
    }
  }

  /**
   * Get snapshot blob
   */
  const getSnapshot = async (channel: number = 1): Promise<Blob | null> => {
    if (!client.value) {
      logger.warn('Cannot get snapshot: not connected')
      return null
    }

    return await client.value.getSnapshot(channel)
  }

  /**
   * Get configuration by name
   */
  const getConfig = async (name: string) => {
    if (!client.value) throw new Error('Not connected')
    return await client.value.getConfig(name)
  }

  /**
   * Set configuration
   */
  const setConfig = async (params: Record<string, string>) => {
    if (!client.value) throw new Error('Not connected')
    return await client.value.setConfig(params)
  }

  /**
   * Reboot camera
   */
  const reboot = async (): Promise<boolean> => {
    if (!client.value) return false
    return await client.value.reboot()
  }

  // Computed properties
  const isConnected = computed(() => connectionState.value === 'connected')
  const isConnecting = computed(() => connectionState.value === 'connecting')
  const hasError = computed(() => connectionState.value === 'error')

  return {
    // State
    client: computed(() => client.value),
    connectionState: computed(() => connectionState.value),
    systemInfo: computed(() => systemInfo.value),
    errorMessage: computed(() => errorMessage.value),

    // Computed
    isConnected,
    isConnecting,
    hasError,

    // Methods
    connect,
    disconnect,
    loadSavedSettings,
    clearSavedSettings,
    refreshSystemInfo,
    getSnapshot,
    getConfig,
    setConfig,
    reboot
  }
}
