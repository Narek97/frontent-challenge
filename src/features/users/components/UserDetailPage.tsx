import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { userDetailRoute } from '../../../router.ts'
import { useUsers } from '../api/useUsers'
import { getEffectiveUser } from '../lib/userNameEdits'
import { EditUserNameForm } from './EditUserNameForm'
import './UserDetailPage.css'

export function UserDetailPage() {
  const { userId } = userDetailRoute.useParams()
  const { data, isPending, isError, error, refetch, isFetching } = useUsers()
  const [justSaved, setJustSaved] = useState<{ userId: number; name: string } | null>(null)

  if (isPending) {
    return (
      <p className="user-detail__status" role="status">
        Loading users…
      </p>
    )
  }

  if (isError) {
    return (
      <div className="user-detail__status user-detail__status--error" role="alert">
        <p>Something went wrong while loading users: {error.message}</p>
        <button type="button" className="btn" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    )
  }

  const numericUserId = Number(userId)
  const rawUser = data.find((candidate) => candidate.id === numericUserId)

  if (!rawUser) {
    return (
      <div className="user-detail__status" role="alert">
        <p>No user found with id &quot;{userId}&quot;.</p>
        <Link className="user-detail__back" to="/users">
          Back to users
        </Link>
      </div>
    )
  }

  const user = getEffectiveUser(rawUser)
  const displayName = justSaved?.userId === user.id ? justSaved.name : user.name

  return (
    <>
      <h1>{displayName}</h1>
      <dl className="user-detail__info">
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>City</dt>
        <dd>{user.address.city}</dd>
      </dl>
      <EditUserNameForm
        key={user.id}
        userId={user.id}
        currentName={user.name}
        onSaved={(name) => setJustSaved({ userId: user.id, name })}
      />
      <Link className="user-detail__back" to="/users">
        Back to users
      </Link>
    </>
  )
}
