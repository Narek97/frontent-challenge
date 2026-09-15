import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { RootLayout } from './RootLayout'
import { UserDetailPage } from './features/users/components/UserDetailPage'
import { UserListPage } from './features/users/components/UserListPage'
import { ALL_CITIES, type SortDirection } from './features/users/lib/deriveVisibleUsers'

// All fields are optional so defaults never appear in the URL — `/users`
// stays clean and a navigate() call can omit a field to clear it.
export interface UsersSearchParams {
  search?: string
  city?: string
  sort?: SortDirection
  page?: number
}

function sanitizePage(value: unknown): number | undefined {
  const page = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isInteger(page) && page > 1 ? page : undefined
}

// The URL is the source of truth for search/city/sort/page, but any value
// coming from it (missing, malformed, or hand-edited) must resolve to
// something safe — never throw, never crash the route. Anything invalid is
// dropped rather than surfaced, so callers can apply their own defaults when
// reading.
function validateUsersSearch(raw: Record<string, unknown>): UsersSearchParams {
  const result: UsersSearchParams = {}

  if (typeof raw.search === 'string' && raw.search !== '') {
    result.search = raw.search
  }

  if (typeof raw.city === 'string' && raw.city.trim() !== '' && raw.city !== ALL_CITIES) {
    result.city = raw.city
  }

  if (raw.sort === 'desc') {
    result.sort = 'desc'
  }

  const page = sanitizePage(raw.page)
  if (page !== undefined) {
    result.page = page
  }

  return result
}

const rootRoute = createRootRoute({ component: RootLayout })

const rootIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/users' })
  },
})

export const usersListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  validateSearch: validateUsersSearch,
  component: UserListPage,
})

export const userDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  component: UserDetailPage,
})

const routeTree = rootRoute.addChildren([rootIndexRoute, usersListRoute, userDetailRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
