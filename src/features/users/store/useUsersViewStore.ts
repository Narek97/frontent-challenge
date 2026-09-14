import { create } from 'zustand'

export type SortDirection = 'asc' | 'desc'

export const ALL_CITIES = 'all'

interface UsersViewState {
  search: string
  selectedCity: string
  sortDirection: SortDirection
  setSearch: (search: string) => void
  setSelectedCity: (city: string) => void
  toggleSortDirection: () => void
}

export const useUsersViewStore = create<UsersViewState>()((set) => ({
  search: '',
  selectedCity: ALL_CITIES,
  sortDirection: 'asc',
  setSearch: (search) => set({ search }),
  setSelectedCity: (selectedCity) => set({ selectedCity }),
  toggleSortDirection: () =>
    set((state) => ({ sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc' })),
}))
