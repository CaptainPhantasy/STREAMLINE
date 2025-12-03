export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  delayMs = 1000
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        return response
      }

      // Retry on 5xx errors
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`)
      }

      return response
    } catch (error: any) {
      lastError = error

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error('Network request failed')
}
