/**
 * Camera API types and interfaces
 */

// Connection settings stored in localStorage
export interface ConnectionSettings {
  host: string           // e.g., '192.168.1.10'
  port: number           // Default: 80
  secure: boolean        // false = http, true = https
  username: string       // e.g., 'admin'
  password: string       // Stored in localStorage (not encrypted)
  debugEnabled: boolean  // Enable debug logging
}

// System information from camera
export interface SystemInfo {
  deviceType?: string
  serialNumber?: string
  hardwareVersion?: string
  softwareVersion?: string
  buildDate?: string
  deviceClass?: string
}

// Video encode configuration
export interface EncodeConfig {
  videoCodec?: string
  resolution?: string
  frameRate?: number
  bitRate?: number
  bitrateControl?: string
}

// Network configuration
export interface NetworkConfig {
  address?: string
  subnet?: string
  gateway?: string
  dhcp?: boolean
  macAddress?: string
}

// Generic config response (key=value format)
export interface ConfigResponse {
  [key: string]: any
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Connection state
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}
