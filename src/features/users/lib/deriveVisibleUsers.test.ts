import { describe, expect, it } from 'vitest'
import type { User } from '../../../types/user'
import { ALL_CITIES } from '../store/useUsersViewStore'
import { getAvailableCities, selectVisibleUsers } from './deriveVisibleUsers'

function makeUser(overrides: Partial<User>): User {
  return {
    id: 1,
    name: 'Default Name',
    email: 'default@example.com',
    address: { city: 'Defaultville' },
    ...overrides,
  }
}

const users: User[] = [
  makeUser({ id: 1, name: 'Leanne Graham', email: 'Sincere@april.biz', address: { city: 'Gwenborough' } }),
  makeUser({ id: 2, name: 'Ervin Howell', email: 'Shanna@melissa.tv', address: { city: 'Wisokyburgh' } }),
  makeUser({ id: 3, name: 'Clementine Bauch', email: 'Nathan@yesenia.net', address: { city: 'Gwenborough' } }),
]

const noopFilter = { search: '', selectedCity: ALL_CITIES, sortDirection: 'asc' as const }

describe('selectVisibleUsers', () => {
  it('searches by name, case-insensitively', () => {
    const result = selectVisibleUsers(users, { ...noopFilter, search: 'leanne' })
    expect(result.map((u) => u.id)).toEqual([1])
  })

  it('searches by email, case-insensitively', () => {
    const result = selectVisibleUsers(users, { ...noopFilter, search: 'MELISSA.TV' })
    expect(result.map((u) => u.id)).toEqual([2])
  })

  it('trims whitespace from the search term before matching', () => {
    const result = selectVisibleUsers(users, { ...noopFilter, search: '  leanne  ' })
    expect(result.map((u) => u.id)).toEqual([1])
  })

  it('treats a whitespace-only search as no search', () => {
    const result = selectVisibleUsers(users, { ...noopFilter, search: '   ' })
    expect(result).toHaveLength(3)
  })

  it('filters by exact city', () => {
    const result = selectVisibleUsers(users, { ...noopFilter, selectedCity: 'Gwenborough' })
    expect(result.map((u) => u.id).sort()).toEqual([1, 3])
  })

  it('returns everyone when the city filter is ALL_CITIES', () => {
    const result = selectVisibleUsers(users, { ...noopFilter, selectedCity: ALL_CITIES })
    expect(result).toHaveLength(3)
  })

  it('sorts by name ascending, case-insensitively', () => {
    const result = selectVisibleUsers(users, { ...noopFilter, sortDirection: 'asc' })
    expect(result.map((u) => u.name)).toEqual(['Clementine Bauch', 'Ervin Howell', 'Leanne Graham'])
  })

  it('sorts by name descending', () => {
    const result = selectVisibleUsers(users, { ...noopFilter, sortDirection: 'desc' })
    expect(result.map((u) => u.name)).toEqual(['Leanne Graham', 'Ervin Howell', 'Clementine Bauch'])
  })

  it('combines search, city filter, and sort together', () => {
    const combined: User[] = [
      ...users,
      makeUser({ id: 4, name: 'Leanne Extra', email: 'leanne.extra@example.com', address: { city: 'Gwenborough' } }),
    ]

    const result = selectVisibleUsers(combined, {
      search: 'leanne',
      selectedCity: 'Gwenborough',
      sortDirection: 'desc',
    })

    expect(result.map((u) => u.id)).toEqual([1, 4])
  })

  it('does not mutate the input array', () => {
    const originalCopy = users.map((u) => ({ ...u }))

    const result = selectVisibleUsers(users, { ...noopFilter, sortDirection: 'desc' })

    expect(users).toEqual(originalCopy)
    expect(result).not.toBe(users)
  })
})

describe('getAvailableCities', () => {
  it('returns de-duplicated cities', () => {
    expect(getAvailableCities(users)).toEqual(['Gwenborough', 'Wisokyburgh'])
  })

  it('sorts cities case-insensitively', () => {
    const mixedCase = [
      makeUser({ id: 1, address: { city: 'zeta' } }),
      makeUser({ id: 2, address: { city: 'Alpha' } }),
    ]
    expect(getAvailableCities(mixedCase)).toEqual(['Alpha', 'zeta'])
  })

  it('returns an empty array for an empty input', () => {
    expect(getAvailableCities([])).toEqual([])
  })
})
