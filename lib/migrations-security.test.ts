import { readFile, readdir } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('database migration publication boundary', () => {
  it('pins every security definer search path and contains no identity bootstrap', async () => {
    const files = (await readdir('supabase/migrations'))
      .filter(file => file.endsWith('.sql'))
      .map(file => `supabase/migrations/${file}`)
    expect(files.length).toBeGreaterThan(0)

    for (const file of files) {
      const sql = await readFile(file, 'utf8')
      const definers = sql.match(/SECURITY\s+DEFINER/gi) || []
      const pinned = sql.match(/SECURITY\s+DEFINER\s+STABLE\s+SET\s+search_path\s*=\s*public,\s*pg_temp/gi) || []
      expect(pinned, `${file} must pin every definer search path`).toHaveLength(definers.length)
      expect(sql, `${file} must not hard-code a user UUID`).not.toMatch(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i)
      expect((sql.match(/\$\$/g) || []).length % 2, `${file} has unbalanced dollar quotes`).toBe(0)
    }
  })
})
