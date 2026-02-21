/**
 * Camera composable - Singleton pattern
 *
 * Manages camera connection state and provides API access
 * Similar to useJmri from the trains project
 */

import { ref, computed } from 'vue'
import { CameraApiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import { encryptSettings, decryptSettings, hasEncryptedSettings } from '@/utils/crypto'
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

        // Encrypt and save connection settings to localStorage
        // Password is used for encryption but never stored
        try {
          const encrypted = await encryptSettings(settings, settings.password)
          localStorage.setItem('camera-connection-settings-encrypted', encrypted)
          // Remove old plaintext settings if they exist
          localStorage.removeItem('camera-connection-settings')
          logger.debug('Connection settings encrypted and saved')
        } catch (error) {
          logger.error('Failed to encrypt settings:', error)
          // Continue anyway - connection succeeded
        }

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
   * This now only handles legacy plaintext settings (for migration)
   * New encrypted settings must be loaded via loadEncryptedSettings()
   */
  const loadSavedSettings = (): ConnectionSettings | null => {
    try {
      // Check for legacy plaintext settings
      const saved = localStorage.getItem('camera-connection-settings')
      if (saved) {
        logger.warn('Found legacy plaintext settings - will be encrypted on next connection')
        return JSON.parse(saved) as ConnectionSettings
      }
    } catch (error) {
      logger.error('Failed to load saved settings:', error)
    }
    return null
  }

  /**
   * Load and decrypt saved connection settings using password
   *
   * @param password - User's password for decryption
   * @returns Decrypted settings (without password field) or null
   */
  const loadEncryptedSettings = async (
    password: string
  ): Promise<Omit<ConnectionSettings, 'password'> | null> => {
    try {
      const encrypted = localStorage.getItem('camera-connection-settings-encrypted')
      if (!encrypted) {
        logger.debug('No encrypted settings found')
        return null
      }

      const settings = await decryptSettings(encrypted, password)
      logger.debug('Settings decrypted successfully')
      return settings
    } catch (error: any) {
      logger.error('Failed to decrypt settings:', error)
      throw error // Propagate to UI for user feedback
    }
  }

  /**
   * Clear saved connection settings (both legacy and encrypted)
   */
  const clearSavedSettings = () => {
    localStorage.removeItem('camera-connection-settings')
    localStorage.removeItem('camera-connection-settings-encrypted')
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

  /**
   * Start PTZ movement
   */
  const ptzStart = async (code: string, speed: number = 4): Promise<boolean> => {
    if (!client.value) {
      logger.warn('Cannot start PTZ: not connected')
      return false
    }
    return await client.value.ptzControl('start', code, 1, 0, speed, 0)
  }

  /**
   * Stop PTZ movement
   */
  const ptzStop = async (code: string): Promise<boolean> => {
    if (!client.value) {
      logger.warn('Cannot stop PTZ: not connected')
      return false
    }
    return await client.value.ptzControl('stop', code, 1, 0, 0, 0)
  }

  /**
   * Go to PTZ preset position
   */
  const ptzGotoPreset = async (presetNumber: number): Promise<boolean> => {
    if (!client.value) {
      logger.warn('Cannot go to preset: not connected')
      return false
    }
    return await client.value.ptzControl('start', 'GotoPreset', 1, 0, presetNumber, 0)
  }

  /**
   * Save current position as PTZ preset
   */
  const ptzSetPreset = async (presetNumber: number): Promise<boolean> => {
    if (!client.value) {
      logger.warn('Cannot set preset: not connected')
      return false
    }
    return await client.value.ptzControl('start', 'SetPreset', 1, 0, presetNumber, 0)
  }

  /**
   * Clear PTZ preset
   */
  const ptzClearPreset = async (presetNumber: number): Promise<boolean> => {
    if (!client.value) {
      logger.warn('Cannot clear preset: not connected')
      return false
    }
    return await client.value.ptzControl('start', 'ClearPreset', 1, 0, presetNumber, 0)
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
    loadEncryptedSettings,
    hasEncryptedSettings,
    clearSavedSettings,
    refreshSystemInfo,
    getSnapshot,
    getConfig,
    setConfig,
    reboot,
    ptzStart,
    ptzStop,
    ptzGotoPreset,
    ptzSetPreset,
    ptzClearPreset
  }
}
