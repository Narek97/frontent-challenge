import { useQuery } from '@tanstack/react-query'
import { fetchUsers } from '../../../lib/usersApi'

export const usersQueryKey = ['users'] as const

export function useUsers() {
  return useQuery({
    queryKey: usersQueryKey,
    queryFn: fetchUsers,
  })
}
