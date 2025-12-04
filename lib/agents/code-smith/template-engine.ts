/**
 * Template Engine
 * 
 * Generates code using project patterns and templates
 */

export interface ComponentSpec {
  name: string
  type: 'component' | 'api' | 'hook' | 'util'
  props?: Record<string, unknown>
  description?: string
}

export interface GeneratedCode {
  code: string
  tests: string
  documentation: string
  filePath: string
}

/**
 * Template Engine class
 */
export class TemplateEngine {
  /**
   * Generate component code
   */
  generateComponent(spec: ComponentSpec): GeneratedCode {
    const componentName = this.capitalizeFirst(spec.name)
    const filePath = this.getFilePath(spec)

    const code = this.generateComponentCode(componentName, spec)
    const tests = this.generateTests(componentName, spec)
    const documentation = this.generateDocumentation(componentName, spec)

    return {
      code,
      tests,
      documentation,
      filePath
    }
  }

  /**
   * Generate API route code
   */
  generateAPI(spec: ComponentSpec): GeneratedCode {
    const routeName = spec.name
    const filePath = `app/api/${routeName}/route.ts`

    const code = this.generateAPICode(routeName)
    const tests = this.generateAPITests(routeName)
    const documentation = this.generateAPIDocumentation(routeName)

    return {
      code,
      tests,
      documentation,
      filePath
    }
  }

  /**
   * Generate hook code
   */
  generateHook(spec: ComponentSpec): GeneratedCode {
    const hookName = `use${this.capitalizeFirst(spec.name)}`
    const filePath = `lib/hooks/${hookName}.ts`

    const code = this.generateHookCode(hookName, spec)
    const tests = this.generateHookTests(hookName, spec)
    const documentation = this.generateHookDocumentation(hookName, spec)

    return {
      code,
      tests,
      documentation,
      filePath
    }
  }

  /**
   * Generate component code
   */
  private generateComponentCode(name: string, spec: ComponentSpec): string {
    return `'use client'

import { cn } from '@/lib/utils'

export interface ${name}Props {
  className?: string
  // Add props as needed
}

/**
 * ${name} - ${spec.description || 'Component description'}
 *
 * @example
 * \`\`\`tsx
 * <${name} className="custom-class" />
 * \`\`\`
 */
export function ${name}({ className }: ${name}Props) {
  return (
    <div className={cn('default-styles', className)}>
      {/* Component implementation */}
    </div>
  )
}
`
  }

  /**
   * Generate API route code
   */
  private generateAPICode(routeName: string, spec: ComponentSpec): string {
    return `import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // API implementation
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // API implementation
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
`
  }

  /**
   * Generate hook code
   */
  private generateHookCode(hookName: string, spec: ComponentSpec): string {
    return `import { useState, useEffect } from 'react'

export interface Use${this.capitalizeFirst(spec.name)}Return {
  // Return type definition
}

/**
 * ${hookName} - ${spec.description || 'Hook description'}
 */
export function ${hookName}(): Use${this.capitalizeFirst(spec.name)}Return {
  const [state, setState] = useState(null)

  useEffect(() => {
    // Hook implementation
  }, [])

  return {
    // Return values
  }
}
`
  }

  /**
   * Generate tests
   */
  private generateTests(componentName: string, spec: ComponentSpec): string {
    return `import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ${componentName} } from './${componentName}'

describe('${componentName}', () => {
  it('should render correctly', () => {
    render(<${componentName} />)
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  it('should accept className prop', () => {
    render(<${componentName} className="test-class" />)
    const element = screen.getByRole('generic')
    expect(element).toHaveClass('test-class')
  })
})
`
  }

  /**
   * Generate API tests
   */
  private generateAPITests(routeName: string, spec: ComponentSpec): string {
    return `import { describe, it, expect } from 'vitest'
import { GET, POST } from './route'

describe('${routeName} API', () => {
  it('should handle GET request', async () => {
    const request = new Request('http://localhost/api/${routeName}')
    const response = await GET(request)
    expect(response.status).toBe(200)
  })

  it('should handle POST request', async () => {
    const request = new Request('http://localhost/api/${routeName}', {
      method: 'POST',
      body: JSON.stringify({})
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
`
  }

  /**
   * Generate hook tests
   */
  private generateHookTests(hookName: string, spec: ComponentSpec): string {
    return `import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { ${hookName} } from './${hookName}'

describe('${hookName}', () => {
  it('should return expected structure', () => {
    const { result } = renderHook(() => ${hookName}())
    expect(result.current).toBeDefined()
  })
})
`
  }

  /**
   * Generate documentation
   */
  private generateDocumentation(componentName: string, spec: ComponentSpec): string {
    return `# ${componentName}

${spec.description || 'Component description'}

## Usage

\`\`\`tsx
import { ${componentName} } from '@/components/${spec.name}'

<${componentName} />
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | undefined | Additional CSS classes |

## Examples

### Basic Usage

\`\`\`tsx
<${componentName} />
\`\`\`

### With Custom Styling

\`\`\`tsx
<${componentName} className="custom-class" />
\`\`\`
`
  }

  /**
   * Generate API documentation
   */
  private generateAPIDocumentation(routeName: string, spec: ComponentSpec): string {
    return `# ${routeName} API

${spec.description || 'API endpoint description'}

## Endpoints

### GET /api/${routeName}

Description of GET endpoint.

**Response:**
\`\`\`json
{
  "success": true
}
\`\`\`

### POST /api/${routeName}

Description of POST endpoint.

**Request Body:**
\`\`\`json
{}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true
}
\`\`\`
`
  }

  /**
   * Generate hook documentation
   */
  private generateHookDocumentation(hookName: string, spec: ComponentSpec): string {
    return `# ${hookName}

${spec.description || 'Hook description'}

## Usage

\`\`\`tsx
import { ${hookName} } from '@/lib/hooks/${hookName}'

function Component() {
  const { } = ${hookName}()
  
  return <div>...</div>
}
\`\`\`

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| - | - | - |
`
  }

  /**
   * Get file path for component
   */
  private getFilePath(spec: ComponentSpec): string {
    switch (spec.type) {
      case 'component':
        return `components/${spec.name}/${this.capitalizeFirst(spec.name)}.tsx`
      case 'api':
        return `app/api/${spec.name}/route.ts`
      case 'hook':
        return `lib/hooks/use${this.capitalizeFirst(spec.name)}.ts`
      case 'util':
        return `lib/utils/${spec.name}.ts`
      default:
        return `components/${spec.name}.tsx`
    }
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}

