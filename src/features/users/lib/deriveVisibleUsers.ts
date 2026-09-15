import type { User } from '../../../types/user'

export type SortDirection = 'asc' | 'desc'

export const ALL_CITIES = 'all'

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

export const USERS_PAGE_SIZE = 20

export function getTotalPages(itemCount: number, pageSize: number = USERS_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(itemCount / pageSize))
}

export function paginateUsers(
  users: User[],
  page: number,
  pageSize: number = USERS_PAGE_SIZE,
): User[] {
  const start = (page - 1) * pageSize
  return users.slice(start, start + pageSize)
}
