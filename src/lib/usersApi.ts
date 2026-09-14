import type { User } from '../types/user'
import { delay, expandUsers, getSimulationParams, simulatedNetworkFailure } from './devNetworkSimulation'

const USERS_ENDPOINT = 'https://jsonplaceholder.typicode.com/users'

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.address === 'object' &&
    candidate.address !== null &&
    typeof (candidate.address as Record<string, unknown>).city === 'string'
  )
}

export async function fetchUsers(): Promise<User[]> {
  if (import.meta.env.DEV) {
    const { delayMs, shouldFail } = getSimulationParams()

    if (delayMs) {
      await delay(delayMs)
    }

    if (shouldFail) {
      throw simulatedNetworkFailure()
    }
  }

  const response = await fetch(USERS_ENDPOINT)

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`)
  }

  const data: unknown = await response.json()

  if (!Array.isArray(data) || !data.every(isUser)) {
    throw new Error('Received an unexpected response shape from the users endpoint')
  }

  if (import.meta.env.DEV) {
    const { userCount } = getSimulationParams()

    if (userCount && userCount > data.length) {
      return expandUsers(data, userCount)
    }
  }

  return data
}
