import { Outlet } from '@tanstack/react-router'
import { ThemeToggle } from './ThemeToggle'

export function RootLayout() {
  return (
    <main className="mx-auto flex h-svh w-full max-w-6xl flex-col px-5 sm:px-6">
      <div className="flex shrink-0 justify-end py-4">
        <ThemeToggle />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <Outlet />
      </div>
    </main>
  )
}
