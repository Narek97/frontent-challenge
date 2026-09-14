import type { User } from '../types/user'

interface SimulationParams {
  delayMs: number | null
  shouldFail: boolean
  userCount: number | null
}

const DEFAULT_DELAY_MS = 3000
const SYNTHETIC_ID_STRIDE = 10000

export function getSimulationParams(): SimulationParams {
  const params = new URLSearchParams(window.location.search)

  const slow = params.get('slow')
  const many = params.get('many')

  return {
    delayMs: params.has('slow') ? Number(slow) || DEFAULT_DELAY_MS : null,
    shouldFail: params.get('fail') === '1',
    userCount: params.has('many') ? Number(many) || null : null,
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function simulatedNetworkFailure(): Error {
  return new Error('Simulated network failure (dev only, triggered by ?fail=1)')
}

export function expandUsers(users: User[], count: number): User[] {
  if (users.length === 0 || count <= users.length) {
    return users
  }

  const expanded: User[] = [...users]

  for (let i = users.length; i < count; i++) {
    const source = users[i % users.length]
    const copyIndex = Math.floor(i / users.length)

    expanded.push({
      ...source,
      id: source.id + copyIndex * SYNTHETIC_ID_STRIDE,
      name: `${source.name} #${copyIndex + 1}`,
      email: `copy${copyIndex + 1}.${source.email}`,
    })
  }

  return expanded
}
