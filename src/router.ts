import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { RootLayout } from './RootLayout'
import { UserDetailPage } from './features/users/components/UserDetailPage'
import { UserListPage } from './features/users/components/UserListPage'

const rootRoute = createRootRoute({ component: RootLayout })

const rootIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/users' })
  },
})

const usersListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
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
