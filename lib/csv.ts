export function parseCSV(input: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < input.length; i += 1) {
    const character = input[i]
    if (quoted) {
      if (character === '"' && input[i + 1] === '"') {
        field += '"'
        i += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
      continue
    }

    if (character === '"' && field.length === 0) quoted = true
    else if (character === ',') {
      row.push(field.trim())
      field = ''
    } else if (character === '\n') {
      row.push(field.trim())
      if (row.some(value => value.length > 0)) rows.push(row)
      row = []
      field = ''
    } else if (character !== '\r') field += character
  }

  if (quoted) throw new Error('CSV contains an unterminated quoted field')
  row.push(field.trim())
  if (row.some(value => value.length > 0)) rows.push(row)
  return rows
}
