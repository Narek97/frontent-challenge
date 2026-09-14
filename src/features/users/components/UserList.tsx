import type { User } from '../../../types/user'
import { useUsers } from '../api/useUsers'
import './UserList.css'

function UserListItem({ user }: { user: User }) {
  return (
    <li className="user-list__item">
      <p className="user-list__name">{user.name}</p>
      <p className="user-list__email">{user.email}</p>
      <p className="user-list__city">{user.address.city}</p>
    </li>
  )
}

export function UserList() {
  const { data, isPending, isError, error, refetch, isFetching } = useUsers()

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

  return (
    <ul className="user-list">
      {data.map((user) => (
        <UserListItem key={user.id} user={user} />
      ))}
    </ul>
  )
}
