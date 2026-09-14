import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchUsers } from './usersApi'

const validUser = {
  id: 1,
  name: 'Leanne Graham',
  email: 'Sincere@april.biz',
  address: { city: 'Gwenborough' },
}

function mockFetchResponse(body: unknown, init: { ok?: boolean; status?: number; statusText?: string } = {}) {
  const { ok = true, status = 200, statusText = 'OK' } = init

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      statusText,
      json: () => Promise.resolve(body),
    }),
  )
}

beforeEach(() => {
  // DEV network simulation is read from the URL on every call and DEV is true
  // under Vitest by default, so every test must start from a clean slate.
  vi.stubGlobal('location', { search: '' })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchUsers', () => {
  it('parses a valid response into the expected User shape', async () => {
    mockFetchResponse([validUser])

    const result = await fetchUsers()

    expect(result).toEqual([validUser])
  })

  it('rejects when the response is not ok', async () => {
    mockFetchResponse(null, { ok: false, status: 500, statusText: 'Internal Server Error' })

    await expect(fetchUsers()).rejects.toThrow(/500/)
  })

  it('rejects when the response body is not an array', async () => {
    mockFetchResponse({ not: 'an array' })

    await expect(fetchUsers()).rejects.toThrow(/unexpected response shape/i)
  })

  it('rejects when an item in the response is missing required fields', async () => {
    mockFetchResponse([{ id: 1, name: 'Missing email and address' }])

    await expect(fetchUsers()).rejects.toThrow(/unexpected response shape/i)
  })

  describe('development network simulation', () => {
    it('rejects deterministically when ?fail=1 is present, without calling fetch', async () => {
      vi.stubGlobal('location', { search: '?fail=1' })
      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)

      await expect(fetchUsers()).rejects.toThrow(/simulated network failure/i)
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('expands the dataset when ?many=N is present and larger than the real result', async () => {
      vi.stubGlobal('location', { search: '?many=5' })
      mockFetchResponse([validUser])

      const result = await fetchUsers()

      expect(result).toHaveLength(5)
      expect(result[0]).toEqual(validUser)
      const ids = result.map((user) => user.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('does not expand the dataset when ?many=N is smaller than the real result', async () => {
      vi.stubGlobal('location', { search: '?many=1' })
      mockFetchResponse([validUser, { ...validUser, id: 2 }])

      const result = await fetchUsers()

      expect(result).toHaveLength(2)
    })
  })
})
