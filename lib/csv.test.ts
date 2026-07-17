import { describe, expect, it } from 'vitest'
import { parseCSV } from './csv'

describe('parseCSV', () => {
  it('parses CRLF rows, quoted commas, and escaped quotes', () => {
    expect(parseCSV('name,notes\r\n"Doe, Jane","Said ""hello"""\r\n')).toEqual([
      ['name', 'notes'],
      ['Doe, Jane', 'Said "hello"'],
    ])
  })

  it('ignores empty rows', () => {
    expect(parseCSV('a,b\n\n1,2\n')).toEqual([['a', 'b'], ['1', '2']])
  })

  it('rejects unterminated quotes', () => {
    expect(() => parseCSV('a,"broken')).toThrow('unterminated')
  })
})
