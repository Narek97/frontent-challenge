import { usersListRoute } from '../../../router'
import { ALL_CITIES, type SortDirection } from './deriveVisibleUsers'

export function useUsersListFilters() {
  const routeSearch = usersListRoute.useSearch()
  const navigate = usersListRoute.useNavigate()

  const search = routeSearch.search ?? ''
  const city = routeSearch.city ?? ALL_CITIES
  const sort = routeSearch.sort ?? 'asc'
  const page = routeSearch.page ?? 1
  const isFiltered = search.trim() !== '' || city !== ALL_CITIES

  // Any change to search/city/sort reshuffles the result set, so the current
  // page number is no longer meaningful — reset to page 1 each time.
  const updateSearch = (value: string) => {
    navigate({
      search: (prev) => ({ ...prev, search: value.trim() === '' ? undefined : value, page: undefined }),
      replace: true,
    })
  }

  const updateCity = (value: string) => {
    navigate({
      search: (prev) => ({ ...prev, city: value === ALL_CITIES ? undefined : value, page: undefined }),
      replace: true,
    })
  }

  const updateSort = (value: SortDirection) => {
    navigate({
      search: (prev) => ({ ...prev, sort: value === 'asc' ? undefined : value, page: undefined }),
      replace: true,
    })
  }

  // Only search/city are "filters" — sort (and, once cleared, page 1) is preserved on clear.
  const clearFilters = () => {
    navigate({
      search: (prev) => ({ ...prev, search: undefined, city: undefined, page: undefined }),
      replace: true,
    })
  }

  const setPage = (nextPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: nextPage <= 1 ? undefined : nextPage }),
      replace: true,
    })
  }

  return {
    search,
    city,
    sort,
    page,
    isFiltered,
    updateSearch,
    updateCity,
    updateSort,
    clearFilters,
    setPage,
  }
}
