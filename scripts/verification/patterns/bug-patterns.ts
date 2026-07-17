export type BugRule = {
  type: 'regex' | 'component'
  pattern: string | RegExp
  fileTypes: string[]
}

export type BugPattern = {
  id: string
  name: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  fixStrategy: 'replace' | 'modify' | 'add' | 'remove'
  patterns: BugRule[]
}

export const BUG_PATTERNS: BugPattern[] = [
  {
    id: 'white-on-white-text',
    name: 'White foreground on white background',
    description: 'Use theme-aware foreground and background colors.',
    severity: 'medium',
    fixStrategy: 'replace',
    patterns: [
      {
        type: 'regex',
        pattern: /(?:text-white[^\n]*bg-white|bg-white[^\n]*text-white)/,
        fileTypes: ['tsx', 'jsx', 'html'],
      },
    ],
  },
  {
    id: 'hardcoded-colors',
    name: 'Hardcoded presentation color',
    description: 'Use a shared theme token for maintainable presentation.',
    severity: 'low',
    fixStrategy: 'replace',
    patterns: [
      {
        type: 'regex',
        pattern: /(?:color|background|borderColor):\s*['"]#[0-9a-fA-F]{3,8}['"]/,
        fileTypes: ['ts', 'tsx', 'js', 'jsx'],
      },
    ],
  },
]
