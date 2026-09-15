import { Link, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import type { User } from '../../../types/user'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useUsers } from '../api/useUsers'
import { getAvailableCities, getTotalPages, paginateUsers, selectVisibleUsers } from '../lib/deriveVisibleUsers'
import { useUsersListFilters } from '../lib/useUsersListFilters'
import { getEffectiveUser } from '../lib/userNameEdits'
import { UsersFilters } from './UsersFilters'

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

function UserRow({ user }: { user: User }) {
  const navigate = useNavigate()

  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => navigate({ to: '/users/$userId', params: { userId: String(user.id) } })}
    >
      <TableCell>
        <Link
          to="/users/$userId"
          params={{ userId: String(user.id) }}
          className="flex items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(event) => event.stopPropagation()}
        >
          <span
            className="bg-muted text-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            aria-hidden="true"
          >
            {initialOf(user.name)}
          </span>
          <span className="text-foreground font-medium">{user.name}</span>
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground hidden sm:table-cell">{user.email}</TableCell>
      <TableCell className="text-muted-foreground hidden md:table-cell">{user.phone}</TableCell>
      <TableCell className="text-muted-foreground">{user.address.city}</TableCell>
      <TableCell className="text-muted-foreground hidden lg:table-cell">{user.company.name}</TableCell>
    </TableRow>
  )
}

function LoadingSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="hidden sm:table-cell">Email</TableHead>
          <TableHead className="hidden md:table-cell">Phone</TableHead>
          <TableHead>City</TableHead>
          <TableHead className="hidden lg:table-cell">Company</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }, (_, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Skeleton className="h-4 w-36" />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <Skeleton className="h-4 w-24" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function UserList() {
  const { data, isPending, isError, error, refetch, isFetching } = useUsers()
  const { search, city: selectedCity, sort: sortDirection, page, isFiltered, clearFilters, setPage } =
    useUsersListFilters()

  if (isPending) {
    return (
      <div role="status">
        <span className="sr-only">Loading users…</span>
        <LoadingSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          <p>We couldn&rsquo;t load the users list: {error.message}</p>
          <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Retrying…' : 'Retry'}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return <p className="text-muted-foreground py-10 text-center text-sm">No users found.</p>
  }

  const effectiveUsers = data.map(getEffectiveUser)
  const availableCities = getAvailableCities(effectiveUsers)
  const visibleUsers = selectVisibleUsers(effectiveUsers, { search, selectedCity, sortDirection })

  const totalPages = getTotalPages(visibleUsers.length)
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const pagedUsers = paginateUsers(visibleUsers, currentPage)

  return (
    <div className="flex h-full flex-col">
      {/* Filters and the result count stay fixed above the scrolling table — only
          the row content scrolls, so the controls are never lost off-screen with
          a large dataset. */}
      <div className="shrink-0">
        <UsersFilters availableCities={availableCities} />
        <p className="text-muted-foreground mb-2 text-sm">
          {visibleUsers.length === effectiveUsers.length
            ? `${effectiveUsers.length} ${effectiveUsers.length === 1 ? 'person' : 'people'}`
            : `Showing ${visibleUsers.length} of ${effectiveUsers.length}`}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {visibleUsers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-foreground text-sm font-medium">No matches</p>
            <p className="text-muted-foreground text-sm" role="status">
              No users match your search or filters. Try a different name, email, or city.
            </p>
            {isFiltered ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear search and filters
              </Button>
            ) : null}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-background sticky top-0 z-10">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="hidden lg:table-cell">Company</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedUsers.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {visibleUsers.length > 0 && totalPages > 1 ? (
        <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t pt-3">
          <p className="text-muted-foreground text-sm" aria-live="polite">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
