import type { Resource } from '@modelcontextprotocol/sdk/types.js'

export const allResources: Resource[] = [{
  uri: 'data://*',
  name: 'Data',
  description: 'Data resource',
  mimeType: 'application/json'
}]

export async function readResource(uri: string) {
  const [scheme, id] = uri.split('://')
  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ id, data: 'your data' })
    }]
  }
}

export function listResources() { return allResources }

