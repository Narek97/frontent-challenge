import { Outlet } from '@tanstack/react-router'

export function RootLayout() {
  return (
    <main>
      <Outlet />
    </main>
  )
}
