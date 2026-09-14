import type { User } from '../types/user'

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
  const response = await fetch(USERS_ENDPOINT)

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`)
  }

  const data: unknown = await response.json()

  if (!Array.isArray(data) || !data.every(isUser)) {
    throw new Error('Received an unexpected response shape from the users endpoint')
  }

  return data
}
