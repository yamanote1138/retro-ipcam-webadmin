/**
 * Parser for Amcrest key=value response format
 *
 * Amcrest APIs return responses like:
 * status.Focus=0.5
 * status.Zoom=0.5
 * Encode[0].MainFormat[0].Video.Width=1920
 *
 * This parser converts them to JavaScript objects
 */

import { logger } from './logger'

export function parseKeyValueResponse(text: string): Record<string, any> {
  const result: Record<string, any> = {}

  if (!text || text.trim() === '' || text.trim() === 'OK') {
    return result
  }

  const lines = text.split('\n').filter(line => line.trim() !== '')

  for (const line of lines) {
    // Skip error messages
    if (line.trim() === 'Error') continue

    // Parse key=value format
    const equalsIndex = line.indexOf('=')
    if (equalsIndex === -1) continue

    const key = line.substring(0, equalsIndex).trim()
    const value = line.substring(equalsIndex + 1).trim()

    if (!key) continue

    // Handle different value types
    const parsedValue = parseValue(value)

    // Handle array notation: Config[0].Property
    if (key.includes('[') && key.includes(']')) {
      setNestedArrayValue(result, key, parsedValue)
    }
    // Handle dot notation: status.Focus
    else if (key.includes('.')) {
      setNestedValue(result, key, parsedValue)
    }
    // Simple key
    else {
      result[key] = parsedValue
    }
  }

  return result
}

function parseValue(value: string): any {
  // Boolean
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false

  // Number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value)
  }

  // String (remove quotes if present)
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1)
  }

  return value
}

function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  const parts = path.split('.')
  let current = obj

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!part) continue
    if (!(part in current)) {
      current[part] = {}
    }
    current = current[part]
  }

  const lastPart = parts[parts.length - 1]
  if (lastPart) {
    current[lastPart] = value
  }
}

function setNestedArrayValue(obj: Record<string, any>, path: string, value: any): void {
  // Parse path like "Encode[0].MainFormat[1].Video.Width"
  const parts = path.split('.')
  let current: any = obj

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part) continue

    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/)

    if (arrayMatch) {
      // Handle array notation
      const arrayName = arrayMatch[1]
      const indexStr = arrayMatch[2]
      if (!arrayName || !indexStr) continue

      const index = parseInt(indexStr, 10)

      if (!(arrayName in current)) {
        current[arrayName] = []
      }

      if (!current[arrayName][index]) {
        current[arrayName][index] = {}
      }

      if (i === parts.length - 1) {
        current[arrayName][index] = value
      } else {
        current = current[arrayName][index]
      }
    } else {
      // Regular property
      if (i === parts.length - 1) {
        current[part] = value
      } else {
        if (!(part in current)) {
          current[part] = {}
        }
        current = current[part]
      }
    }
  }
}

/**
 * Extract simple key-value pairs from response
 * Useful for simple responses like device type, serial number, etc.
 */
export function extractSimpleValues(parsed: Record<string, any>, prefix: string = ''): Record<string, string> {
  const result: Record<string, string> = {}

  function traverse(obj: any, path: string = '') {
    for (const key in obj) {
      const value = obj[key]
      const fullPath = path ? `${path}.${key}` : key

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        traverse(value, fullPath)
      } else if (typeof value !== 'object') {
        result[fullPath] = String(value)
      }
    }
  }

  traverse(parsed, prefix)
  return result
}

/**
 * Parse JSON response (for newer API endpoints)
 */
export function parseJsonResponse(text: string): any {
  try {
    return JSON.parse(text)
  } catch (error) {
    logger.warn('Failed to parse JSON response:', error)
    return null
  }
}
