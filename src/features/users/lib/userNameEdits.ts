import type { User } from '../../../types/user'

export interface UserNameEdit {
  name: string
  editedAt: string
}

type UserNameEditsRecord = Record<string, UserNameEdit>

const STORAGE_KEY = 'users:name-edits'

function isUserNameEdit(value: unknown): value is UserNameEdit {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return typeof candidate.name === 'string' && typeof candidate.editedAt === 'string'
}

function readEditsRecord(): UserNameEditsRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return {}
    }

    const parsed: unknown = JSON.parse(raw)

    if (typeof parsed !== 'object' || parsed === null) {
      return {}
    }

    const edits: UserNameEditsRecord = {}

    for (const [userId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (isUserNameEdit(value)) {
        edits[userId] = value
      }
    }

    return edits
  } catch {
    return {}
  }
}

function writeEditsRecord(edits: UserNameEditsRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(edits))
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded); the
    // edit still applies to the current view but won't survive a reload.
  }
}

export function getUserNameEdit(userId: number): UserNameEdit | undefined {
  return readEditsRecord()[String(userId)]
}

export function saveUserNameEdit(userId: number, name: string): void {
  const edits = readEditsRecord()
  edits[String(userId)] = { name, editedAt: new Date().toISOString() }
  writeEditsRecord(edits)
}

// Conflict policy: local edit wins unconditionally over fresh server data whenever
// one exists, regardless of how recent the server response is (see README).
export function getEffectiveUser(user: User): User {
  const edit = getUserNameEdit(user.id)
  return edit === undefined ? user : { ...user, name: edit.name }
}
