import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { router } from './router.ts'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="bottom-center" />
    </>
  )
}

export default App
