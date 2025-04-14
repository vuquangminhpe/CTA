import { User } from './User.type'

export interface LoginReqBody {
  username: string
  password: string
}

export interface RegisterType {
  username: string
  password: string
  confirm_password: string
  name?: string
}

export interface LoginResponse {
  access_token: string
  user: User
}
