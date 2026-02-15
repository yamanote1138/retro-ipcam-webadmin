/**
 * Camera API Client using HTTP Digest Authentication
 *
 * Uses digest-fetch for automatic digest auth handling
 */

import DigestClient from 'digest-fetch'
import { logger } from './logger'
import { parseKeyValueResponse, extractSimpleValues } from './parser'
import type { ConnectionSettings, SystemInfo, ConfigResponse } from '@/types/camera'

export class CameraApiClient {
  private baseUrl: string
  private client: DigestClient | null = null
  private connected: boolean = false
  private proxyMode: boolean
  private authHeader: string

  constructor(settings: ConnectionSettings) {
    const protocol = settings.secure ? 'https' : 'http'
    const port = settings.port || 80
    this.proxyMode = settings.proxyMode

    if (this.proxyMode) {
      // Use proxy server for non-standard cameras
      this.baseUrl = `http://localhost:3001/proxy/${settings.host}/${port}`
      logger.info('Using CORS proxy mode:', this.baseUrl)
    } else {
      // Direct connection
      this.baseUrl = `${protocol}://${settings.host}:${port}`
      // Initialize digest-fetch client for direct mode
      this.client = new DigestClient(settings.username, settings.password, {})
      logger.debug('CameraApiClient initialized (direct mode):', this.baseUrl)
    }

    // Prepare auth header for proxy mode
    const credentials = btoa(`${settings.username}:${settings.password}`)
    this.authHeader = `Basic ${credentials}`
  }

  /**
   * Test connection by fetching device type
   */
  async testConnection(): Promise<boolean> {
    try {
      const deviceType = await this.getDeviceType()
      this.connected = !!deviceType
      return this.connected
    } catch (error) {
      logger.error('Connection test failed:', error)
      this.connected = false
      return false
    }
  }

  /**
   * Make a CGI-style API request (key=value format)
   */
  private async cgiRequest(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<string> {
    const queryString = new URLSearchParams(params).toString()
    const url = `${this.baseUrl}/cgi-bin/${endpoint}.cgi${queryString ? '?' + queryString : ''}`

    logger.debug('CGI Request:', url)

    try {
      let response: Response

      if (this.proxyMode) {
        // Use native fetch with auth header for proxy mode
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'x-camera-auth': this.authHeader
          }
        })
      } else {
        // Use digest-fetch for direct mode
        if (!this.client) {
          throw new Error('Digest client not initialized')
        }
        response = await this.client.fetch(url, {
          method: 'GET'
        })
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const text = await response.text()
      logger.debug('CGI Response:', text.substring(0, 200))

      return text
    } catch (error) {
      logger.error('CGI request failed:', error)
      throw error
    }
  }

  /**
   * Get device type
   */
  async getDeviceType(): Promise<string | null> {
    try {
      const text = await this.cgiRequest('magicBox', { action: 'getDeviceType' })
      const parsed = parseKeyValueResponse(text)
      return parsed.type || null
    } catch (error) {
      logger.error('Failed to get device type:', error)
      return null
    }
  }

  /**
   * Get comprehensive system information
   */
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const [deviceType, serialNo, hwVersion, swVersion] = await Promise.all([
        this.getDeviceType(),
        this.getSerialNumber(),
        this.getHardwareVersion(),
        this.getSoftwareVersion()
      ])

      return {
        deviceType: deviceType || undefined,
        serialNumber: serialNo || undefined,
        hardwareVersion: hwVersion || undefined,
        softwareVersion: swVersion || undefined
      }
    } catch (error) {
      logger.error('Failed to get system info:', error)
      return {}
    }
  }

  /**
   * Get serial number
   */
  async getSerialNumber(): Promise<string | null> {
    try {
      const text = await this.cgiRequest('magicBox', { action: 'getSerialNo' })
      const parsed = parseKeyValueResponse(text)
      return parsed.sn || null
    } catch (error) {
      logger.error('Failed to get serial number:', error)
      return null
    }
  }

  /**
   * Get hardware version
   */
  async getHardwareVersion(): Promise<string | null> {
    try {
      const text = await this.cgiRequest('magicBox', { action: 'getHardwareVersion' })
      const parsed = parseKeyValueResponse(text)
      return parsed.version || null
    } catch (error) {
      logger.error('Failed to get hardware version:', error)
      return null
    }
  }

  /**
   * Get software/firmware version
   */
  async getSoftwareVersion(): Promise<string | null> {
    try {
      const text = await this.cgiRequest('magicBox', { action: 'getSoftwareVersion' })
      const parsed = parseKeyValueResponse(text)
      const values = extractSimpleValues(parsed)

      // Try different possible keys
      return values.version || values['Version'] || values.Build || null
    } catch (error) {
      logger.error('Failed to get software version:', error)
      return null
    }
  }

  /**
   * Get configuration by name
   */
  async getConfig(name: string): Promise<ConfigResponse> {
    try {
      const text = await this.cgiRequest('configManager', {
        action: 'getConfig',
        name
      })
      return parseKeyValueResponse(text)
    } catch (error) {
      logger.error(`Failed to get config ${name}:`, error)
      throw error
    }
  }

  /**
   * Set configuration
   */
  async setConfig(params: Record<string, string>): Promise<boolean> {
    try {
      const text = await this.cgiRequest('configManager', {
        action: 'setConfig',
        ...params
      })
      return text.includes('OK') || text.includes('ok')
    } catch (error) {
      logger.error('Failed to set config:', error)
      return false
    }
  }

  /**
   * Get snapshot image URL (with auth)
   */
  getSnapshotUrl(channel: number = 1): string {
    return `${this.baseUrl}/cgi-bin/snapshot.cgi?channel=${channel}`
  }

  /**
   * Fetch snapshot as Blob
   */
  async getSnapshot(channel: number = 1): Promise<Blob | null> {
    try {
      const url = this.getSnapshotUrl(channel)
      logger.debug('Fetching snapshot:', url)

      let response: Response

      if (this.proxyMode) {
        // Use native fetch with auth header for proxy mode
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'x-camera-auth': this.authHeader
          }
        })
      } else {
        // Use digest-fetch for direct mode
        if (!this.client) {
          throw new Error('Digest client not initialized')
        }
        response = await this.client.fetch(url, {
          method: 'GET'
        })
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.blob()
    } catch (error) {
      logger.error('Failed to get snapshot:', error)
      return null
    }
  }

  /**
   * Get MJPEG stream URL
   */
  getMjpegStreamUrl(channel: number = 1, subtype: number = 1): string {
    return `${this.baseUrl}/cgi-bin/mjpg/video.cgi?channel=${channel}&subtype=${subtype}`
  }

  /**
   * Reboot the camera
   */
  async reboot(): Promise<boolean> {
    try {
      await this.cgiRequest('magicBox', { action: 'reboot' })
      return true
    } catch (error) {
      logger.error('Failed to reboot:', error)
      return false
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected
  }
}
