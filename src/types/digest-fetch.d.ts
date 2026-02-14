declare module 'digest-fetch' {
  export default class DigestClient {
    constructor(username: string, password: string, options?: any)
    fetch(url: string, options?: RequestInit): Promise<Response>
  }
}
