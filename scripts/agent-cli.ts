#!/usr/bin/env tsx
/**
 * Agent CLI Script
 * 
 * Executable script for @agent commands
 * Usage: tsx scripts/agent-cli.ts "@agent create ticket <description>"
 */

import { createCLIInterface } from '../lib/agents/orchestrator/cli-interface'

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('Usage: tsx scripts/agent-cli.ts "@agent <command>"')
    console.log('')
    console.log('Commands:')
    console.log('  @agent create ticket <description>  - Create new work item')
    console.log('  @agent fix ticket <ticket-id>       - Execute fix')
    console.log('  @agent generate <component|api|migration> - Generate code')
    console.log('  @agent deploy [staging|production]    - Deploy changes')
    console.log('  @agent status                        - View all agent status')
    console.log('  @agent logs <agent-id>               - View agent logs')
    console.log('  @agent health                        - System health check')
    console.log('  @agent rollback <ticket-id>          - Emergency rollback')
    console.log('')
    console.log('Or use natural language:')
    console.log('  @agent I need to fix the AI estimate persistence issue')
    process.exit(1)
  }

  const command = args.join(' ')
  const cli = createCLIInterface()

  try {
    const result = await cli.handleCommand(command)
    
    if (result.success) {
      console.log(`✓ ${result.message}`)
      if (result.data) {
        console.log(JSON.stringify(result.data, null, 2))
      }
      process.exit(0)
    } else {
      console.error(`✗ ${result.message}`)
      if (result.data) {
        console.error(JSON.stringify(result.data, null, 2))
      }
      process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()

