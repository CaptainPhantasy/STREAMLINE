/**
 * Comprehensive Bug Pattern Library
 * 
 * Defines ALL visual/UX bug patterns that can be detected in code
 */

export interface BugPattern {
  id: string
  name: string
  category: 'color' | 'visibility' | 'layout' | 'interactive' | 'responsive' | 'accessibility' | 'form' | 'typography' | 'spacing' | 'state'
  severity: 'critical' | 'high' | 'medium' | 'low'
  patterns: PatternRule[]
  fixStrategy: 'replace' | 'add' | 'remove' | 'modify'
  description: string
}

export interface PatternRule {
  type: 'regex' | 'ast' | 'css' | 'component'
  pattern: string | RegExp
  context?: string // Additional context needed
  fileTypes: string[] // Which file types to check
}

export const BUG_PATTERNS: BugPattern[] = [
  // COLOR ISSUES
  {
    id: 'white-on-white-text',
    name: 'White text on white background',
    category: 'color',
    severity: 'critical',
    patterns: [
      {
        type: 'regex',
        pattern: /(?:text-white|color:\s*['"]white['"]|color:\s*#fff|color:\s*#ffffff).*(?:bg-white|background:\s*['"]white['"]|background:\s*#fff|background:\s*#ffffff)/i,
        fileTypes: ['tsx', 'ts', 'css']
      },
      {
        type: 'component',
        pattern: 'className="text-white bg-white"',
        fileTypes: ['tsx']
      }
    ],
    fixStrategy: 'replace',
    description: 'Text is white on white background, making it invisible'
  },
  {
    id: 'low-contrast',
    name: 'Low contrast text',
    category: 'color',
    severity: 'high',
    patterns: [
      {
        type: 'css',
        pattern: 'contrast-ratio-check',
        fileTypes: ['css', 'tsx']
      }
    ],
    fixStrategy: 'modify',
    description: 'Text contrast ratio below WCAG AA minimum (4.5:1)'
  },
  {
    id: 'hardcoded-colors',
    name: 'Hardcoded color values',
    category: 'color',
    severity: 'medium',
    patterns: [
      {
        type: 'regex',
        pattern: /(?:color|background|borderColor):\s*['"](#[0-9a-fA-F]{3,6}|rgb\(|rgba\(|hsl\(|hsla\(|white|black|red|blue|green|yellow|gray|grey)['"]/i,
        fileTypes: ['tsx', 'ts', 'css']
      }
    ],
    fixStrategy: 'replace',
    description: 'Hardcoded color values should use theme variables'
  },

  // VISIBILITY ISSUES
  {
    id: 'hidden-visible-element',
    name: 'Hidden element that should be visible',
    category: 'visibility',
    severity: 'high',
    patterns: [
      {
        type: 'regex',
        pattern: /(?:display:\s*none|visibility:\s*hidden|opacity:\s*0).*(?:button|link|input|interactive)/i,
        fileTypes: ['tsx', 'css']
      },
      {
        type: 'component',
        pattern: 'className="hidden"',
        context: 'interactive element',
        fileTypes: ['tsx']
      }
    ],
    fixStrategy: 'remove',
    description: 'Interactive element is hidden but should be visible'
  },
  {
    id: 'conditional-render-never',
    name: 'Conditional rendering that might never render',
    category: 'visibility',
    severity: 'medium',
    patterns: [
      {
        type: 'ast',
        pattern: 'conditional-render-check',
        fileTypes: ['tsx']
      }
    ],
    fixStrategy: 'modify',
    description: 'Component conditionally rendered but condition might always be false'
  },

  // LAYOUT ISSUES
  {
    id: 'overlapping-elements',
    name: 'Overlapping elements',
    category: 'layout',
    severity: 'high',
    patterns: [
      {
        type: 'css',
        pattern: 'position-overlap-check',
        fileTypes: ['css', 'tsx']
      }
    ],
    fixStrategy: 'modify',
    description: 'Elements positioned to overlap incorrectly'
  },
  {
    id: 'missing-responsive',
    name: 'Missing responsive breakpoints',
    category: 'responsive',
    severity: 'high',
    patterns: [
      {
        type: 'regex',
        pattern: /(?:width|height):\s*\d+px/i,
        context: 'no media query',
        fileTypes: ['css', 'tsx']
      }
    ],
    fixStrategy: 'add',
    description: 'Fixed width/height without responsive breakpoints'
  },

  // INTERACTIVE ISSUES
  {
    id: 'disabled-should-enabled',
    name: 'Button disabled when should be enabled',
    category: 'interactive',
    severity: 'medium',
    patterns: [
      {
        type: 'component',
        pattern: 'disabled={true}',
        context: 'no condition for disabled',
        fileTypes: ['tsx']
      }
    ],
    fixStrategy: 'modify',
    description: 'Button is always disabled but should be conditionally enabled'
  },
  {
    id: 'non-semantic-interactive',
    name: 'Non-semantic interactive element',
    category: 'accessibility',
    severity: 'high',
    patterns: [
      {
        type: 'component',
        pattern: '<div onClick=',
        fileTypes: ['tsx']
      }
    ],
    fixStrategy: 'replace',
    description: 'div with onClick should be button or have role="button"'
  },

  // FORM ISSUES
  {
    id: 'input-without-label',
    name: 'Input without label',
    category: 'form',
    severity: 'high',
    patterns: [
      {
        type: 'component',
        pattern: '<input',
        context: 'no label or aria-label',
        fileTypes: ['tsx']
      }
    ],
    fixStrategy: 'add',
    description: 'Input field missing label or aria-label'
  },

  // ACCESSIBILITY ISSUES
  {
    id: 'missing-aria-label',
    name: 'Missing ARIA label',
    category: 'accessibility',
    severity: 'medium',
    patterns: [
      {
        type: 'component',
        pattern: 'interactive-element',
        context: 'no aria-label or aria-labelledby',
        fileTypes: ['tsx']
      }
    ],
    fixStrategy: 'add',
    description: 'Interactive element missing ARIA label'
  },
  {
    id: 'missing-alt-text',
    name: 'Missing alt text on image',
    category: 'accessibility',
    severity: 'high',
    patterns: [
      {
        type: 'component',
        pattern: '<img',
        context: 'no alt attribute',
        fileTypes: ['tsx']
      }
    ],
    fixStrategy: 'add',
    description: 'Image missing alt attribute'
  },

  // Add more patterns as needed...
]

export function getPatternsByCategory(category: BugPattern['category']): BugPattern[] {
  return BUG_PATTERNS.filter(p => p.category === category)
}

export function getPatternById(id: string): BugPattern | undefined {
  return BUG_PATTERNS.find(p => p.id === id)
}

