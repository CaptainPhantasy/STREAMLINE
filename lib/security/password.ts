const GROUPS = [
  'ABCDEFGHJKLMNPQRSTUVWXYZ',
  'abcdefghijkmnopqrstuvwxyz',
  '23456789',
  '!@#$%^&*',
] as const

function secureIndex(length: number): number {
  if (!Number.isSafeInteger(length) || length < 1 || length > 256) {
    throw new RangeError('Invalid character set length')
  }

  const limit = 256 - (256 % length)
  const byte = new Uint8Array(1)
  do crypto.getRandomValues(byte)
  while (byte[0] >= limit)
  return byte[0] % length
}

export function generateSecurePassword(length = 20): string {
  if (!Number.isSafeInteger(length) || length < 12 || length > 128) {
    throw new RangeError('Password length must be between 12 and 128')
  }

  const all = GROUPS.join('')
  const password = GROUPS.map(group => group[secureIndex(group.length)])
  while (password.length < length) password.push(all[secureIndex(all.length)])

  for (let i = password.length - 1; i > 0; i -= 1) {
    const j = secureIndex(i + 1)
    ;[password[i], password[j]] = [password[j], password[i]]
  }
  return password.join('')
}
