import { ALL_CITIES, useUsersViewStore } from '../store/useUsersViewStore'
import './UsersFilters.css'

interface UsersFiltersProps {
  availableCities: string[]
}

export function UsersFilters({ availableCities }: UsersFiltersProps) {
  const search = useUsersViewStore((state) => state.search)
  const setSearch = useUsersViewStore((state) => state.setSearch)
  const selectedCity = useUsersViewStore((state) => state.selectedCity)
  const setSelectedCity = useUsersViewStore((state) => state.setSelectedCity)
  const sortDirection = useUsersViewStore((state) => state.sortDirection)
  const toggleSortDirection = useUsersViewStore((state) => state.toggleSortDirection)

  return (
    <div className="users-filters">
      <label className="users-filters__field">
        <span>Search by name or email</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="e.g. Leanne or Sincere@april.biz"
        />
      </label>

      <label className="users-filters__field">
        <span>City</span>
        <select value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)}>
          <option value={ALL_CITIES}>All cities</option>
          {availableCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      <button type="button" className="btn" onClick={toggleSortDirection}>
        Name {sortDirection === 'asc' ? '↑ A–Z' : '↓ Z–A'}
      </button>
    </div>
  )
}
