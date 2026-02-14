/**
 * Stub for node-fetch - uses browser's native fetch API
 * This prevents Vite from trying to bundle node-fetch (Node.js only package)
 */

export default globalThis.fetch.bind(globalThis)
export { default as fetch } from './fetch-stub'
