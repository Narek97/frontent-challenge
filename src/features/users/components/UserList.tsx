import { Link } from '@tanstack/react-router'
import type { User } from '../../../types/user'
import { useUsers } from '../api/useUsers'
import { getAvailableCities, selectVisibleUsers } from '../lib/deriveVisibleUsers'
import { getEffectiveUser } from '../lib/userNameEdits'
import { useUsersViewStore } from '../store/useUsersViewStore'
import { UsersFilters } from './UsersFilters'
import './UserList.css'

function UserListItem({ user }: { user: User }) {
  return (
    <li className="user-list__item">
      <Link
        className="user-list__link"
        to="/users/$userId"
        params={{ userId: String(user.id) }}
      >
        <p className="user-list__name">{user.name}</p>
        <p className="user-list__email">{user.email}</p>
        <p className="user-list__city">{user.address.city}</p>
      </Link>
    </li>
  )
}

export function UserList() {
  const { data, isPending, isError, error, refetch, isFetching } = useUsers()
  const search = useUsersViewStore((state) => state.search)
  const selectedCity = useUsersViewStore((state) => state.selectedCity)
  const sortDirection = useUsersViewStore((state) => state.sortDirection)

  if (isPending) {
    return (
      <p className="user-list__status" role="status">
        Loading users…
      </p>
    )
  }

  if (isError) {
    return (
      <div className="user-list__status user-list__status--error" role="alert">
        <p>Something went wrong while loading users: {error.message}</p>
        <button type="button" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <p className="user-list__status" role="status">
        No users found.
      </p>
    )
  }

  const effectiveUsers = data.map(getEffectiveUser)
  const availableCities = getAvailableCities(effectiveUsers)
  const visibleUsers = selectVisibleUsers(effectiveUsers, { search, selectedCity, sortDirection })

  return (
    <>
      <UsersFilters availableCities={availableCities} />
      {visibleUsers.length === 0 ? (
        <p className="user-list__status" role="status">
          No users match your search or filters.
        </p>
      ) : (
        <ul className="user-list">
          {visibleUsers.map((user) => (
            <UserListItem key={user.id} user={user} />
          ))}
        </ul>
      )}
    </>
  )
}
