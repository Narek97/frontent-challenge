import { UserList } from './UserList'

export function UserListPage() {
  return (
    <div className="flex h-full flex-col">
      <h1 className="mb-4 shrink-0">Users</h1>
      <div className="min-h-0 flex-1">
        <UserList />
      </div>
    </div>
  )
}
