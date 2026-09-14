import type { User } from '../../../types/user'
import { ALL_CITIES, type SortDirection } from '../store/useUsersViewStore'

interface VisibleUsersParams {
  search: string
  selectedCity: string
  sortDirection: SortDirection
}

export function selectVisibleUsers(users: User[], params: VisibleUsersParams): User[] {
  const normalizedSearch = params.search.trim().toLowerCase()

  const searched = normalizedSearch
    ? users.filter(
        (user) =>
          user.name.toLowerCase().includes(normalizedSearch) ||
          user.email.toLowerCase().includes(normalizedSearch),
      )
    : users

  const filtered =
    params.selectedCity === ALL_CITIES
      ? searched
      : searched.filter((user) => user.address.city === params.selectedCity)

  return [...filtered].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    return params.sortDirection === 'asc' ? comparison : -comparison
  })
}

export function getAvailableCities(users: User[]): string[] {
  const cities = new Set(users.map((user) => user.address.city))
  return [...cities].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}
