export interface UserAddress {
  city: string
}

export interface UserCompany {
  name: string
}

export interface User {
  id: number
  name: string
  email: string
  phone: string
  address: UserAddress
  company: UserCompany
}
