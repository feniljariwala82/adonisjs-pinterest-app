interface StoreProfileType {
  firstName: string
  lastName: string
  userId?: number
  avatarUrl?: string
  socialAuth?: string
  storagePrefix?: string
}

interface StorePostType {
  id: number
  title: string
  description: string
  tags: string[]
  storagePrefix: string
}

interface UpdatePostType {
  id: number
  title: string
  description: string
  tags: string[]
  storagePrefix?: string
}

interface CreateUser {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface UpdateUser {
  firstName?: string
  lastName?: string
  password?: string
}
