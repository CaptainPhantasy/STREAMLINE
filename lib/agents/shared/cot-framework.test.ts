import { describe, expect, it } from 'vitest'
import { createCOTExecution } from './cot-framework'

describe('COTFramework', () => {
  it('blocks out-of-order phases and completes all six verified phases', async () => {
    const cot = createCOTExecution('recover a workspace')
    expect(cot.canProceedToPhase('analyze')).toBe(false)

    expect((await cot.understand(['repo'], { dirty: true }, { published: true }, 'preserve work', 1)).passed).toBe(true)
    expect(cot.canProceedToPhase('analyze')).toBe(true)
    expect((await cot.analyze([{ from: 'source', to: 'test', type: 'verification' }], [], { source: 0.1 })).passed).toBe(true)
    expect((await cot.plan([{ scenario: 'gate fails', probability: 0.2, impact: 'blocked' }], [{ scenario: 'gate fails', strategy: 'repair' }], 'preserve donor', { time: 1, cost: 0 })).passed).toBe(true)
    expect((await cot.validate(true, true, true, 100)).passed).toBe(true)
    expect((await cot.execute(true, true, true, [])).passed).toBe(true)
    expect((await cot.verify(true, false, [], true)).passed).toBe(true)

    expect(cot.getExecution()).toMatchObject({ canProceed: true, overallConfidence: 100 })
  })
})
