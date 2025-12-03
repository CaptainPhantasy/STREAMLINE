import type { Prompt } from '@modelcontextprotocol/sdk/types.js'

export const allPrompts: Prompt[] = [{
  name: 'your_prompt',
  description: 'Prompt desc',
  arguments: [{ name: 'arg1', description: 'Arg desc', required: true }]
}]

export function getPrompt(name: string) {
  return allPrompts.find(p => p.name === name)
}

export function getPromptTemplate(name: string): string {
  return name === 'your_prompt' ? 'Template with {{arg1}}' : ''
}

export function listPrompts() { return allPrompts }

