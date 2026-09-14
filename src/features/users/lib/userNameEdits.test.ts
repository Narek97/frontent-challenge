import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '../../../types/user'
import { getEffectiveUser, getUserNameEdit, saveUserNameEdit } from './userNameEdits'

const STORAGE_KEY = 'users:name-edits'

const user: User = {
  id: 1,
  name: 'Server Name',
  email: 'user@example.com',
  address: { city: 'Serverville' },
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('saveUserNameEdit / getUserNameEdit', () => {
  it('reads back a name that was just saved (write -> read persistence)', () => {
    saveUserNameEdit(1, 'Edited Name')

    const edit = getUserNameEdit(1)

    expect(edit?.name).toBe('Edited Name')
    expect(typeof edit?.editedAt).toBe('string')
  })

  it('returns undefined when no edit has been saved for that user', () => {
    expect(getUserNameEdit(999)).toBeUndefined()
  })
})

describe('getEffectiveUser', () => {
  it('returns the server user unchanged when there is no local edit', () => {
    const result = getEffectiveUser(user)
    expect(result).toEqual(user)
  })

  it('prefers the local edit over the fresh server value', () => {
    saveUserNameEdit(1, 'Locally Edited Name')

    const freshServerUser: User = { ...user, name: 'Fresh Server Name' }
    const result = getEffectiveUser(freshServerUser)

    expect(result.name).toBe('Locally Edited Name')
    // the object passed in must not be mutated
    expect(freshServerUser.name).toBe('Fresh Server Name')
  })
})

describe('malformed localStorage handling', () => {
  it('does not throw when the stored value is invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not json{{{')

    expect(() => getUserNameEdit(1)).not.toThrow()
    expect(getUserNameEdit(1)).toBeUndefined()
  })

  it('does not throw when the stored value is valid JSON but not an object', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('just a string'))

    expect(() => getUserNameEdit(1)).not.toThrow()
    expect(getUserNameEdit(1)).toBeUndefined()
  })

  it('ignores an individual entry with a malformed shape', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        '1': { name: 123, editedAt: '2024-01-01T00:00:00.000Z' },
      }),
    )

    expect(getUserNameEdit(1)).toBeUndefined()
  })

  it('keeps valid entries while ignoring malformed ones in the same record', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        '1': { name: 'Valid Name', editedAt: '2024-01-01T00:00:00.000Z' },
        '2': { name: 42 },
        '3': 'not-even-an-object',
      }),
    )

    expect(getUserNameEdit(1)?.name).toBe('Valid Name')
    expect(getUserNameEdit(2)).toBeUndefined()
    expect(getUserNameEdit(3)).toBeUndefined()
  })

  it('does not throw when localStorage.setItem fails (e.g. quota exceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => saveUserNameEdit(1, 'Name')).not.toThrow()
  })
})
