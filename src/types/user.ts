export interface UserAddress {
  city: string
}

export interface User {
  id: number
  name: string
  email: string
  address: UserAddress
}
