import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { userDetailRoute } from '../../../router.ts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useUsers } from '../api/useUsers'
import { getEffectiveUser } from '../lib/userNameEdits'
import { EditUserNameForm } from './EditUserNameForm'

function BackLink() {
  return (
    <Link
      to="/users"
      className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-1.5 rounded-sm text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to users
    </Link>
  )
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

export function UserDetailPage() {
  const { userId } = userDetailRoute.useParams()
  const { data, isPending, isError, error, refetch, isFetching } = useUsers()
  const [justSaved, setJustSaved] = useState<{ userId: number; name: string } | null>(null)

  if (isPending) {
    return (
      <>
        <BackLink />
        <div role="status">
          <span className="sr-only">Loading user…</span>
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="mt-6 h-4 w-56" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
      </>
    )
  }

  if (isError) {
    return (
      <>
        <BackLink />
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            <p>We couldn&rsquo;t load this user: {error.message}</p>
            <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Retrying…' : 'Retry'}
            </Button>
          </AlertDescription>
        </Alert>
      </>
    )
  }

  const numericUserId = Number(userId)
  const rawUser = data.find((candidate) => candidate.id === numericUserId)

  if (!rawUser) {
    return (
      <>
        <BackLink />
        <Alert>
          <AlertTriangle />
          <AlertTitle>User not found</AlertTitle>
          <AlertDescription>No user found with id &quot;{userId}&quot;.</AlertDescription>
        </Alert>
      </>
    )
  }

  const user = getEffectiveUser(rawUser)
  const displayName = justSaved?.userId === user.id ? justSaved.name : user.name

  return (
    <>
      <BackLink />

      <div className="mb-5 flex items-center gap-4">
        <span
          className="bg-muted text-foreground flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold"
          aria-hidden="true"
        >
          {initialOf(displayName)}
        </span>
        <h1>{displayName}</h1>
      </div>

      <dl className="mb-6 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="text-foreground break-words">{user.email}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Phone</dt>
          <dd className="text-foreground break-words">{user.phone}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">City</dt>
          <dd className="text-foreground break-words">{user.address.city}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Company</dt>
          <dd className="text-foreground break-words">{user.company.name}</dd>
        </div>
      </dl>

      <Separator className="mb-6" />

      <Card>
        <CardHeader>
          <CardTitle>Edit name</CardTitle>
        </CardHeader>
        <CardContent>
          <EditUserNameForm
            key={user.id}
            userId={user.id}
            currentName={user.name}
            onSaved={(name) => setJustSaved({ userId: user.id, name })}
          />
        </CardContent>
      </Card>
    </>
  )
}
