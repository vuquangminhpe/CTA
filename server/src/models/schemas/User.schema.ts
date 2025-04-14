import { ObjectId } from 'mongodb'
import { AccountStatus } from '../../constants/enums'

enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

export type UserRole = 'user' | 'admin'

interface UserType {
  _id?: ObjectId
  name?: string
  email: string
  date_of_birth?: Date
  password: string
  created_at?: Date
  updated_at?: Date
  email_verify_token?: string
  forgot_password_token?: string
  verify?: UserVerifyStatus
  twitter_circle?: ObjectId[]
  typeAccount: AccountStatus
  count_type_account: number
  subscription_end_date?: Date
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
  is_online?: boolean
  last_active?: Date
  role?: UserRole
}

export default class User {
  _id?: ObjectId
  name: string
  email: string
  date_of_birth: Date
  password: string
  created_at: Date
  updated_at: Date
  email_verify_token: string
  forgot_password_token: string
  verify: UserVerifyStatus
  twitter_circle: ObjectId[]
  typeAccount: AccountStatus
  count_type_account: number
  subscription_end_date?: Date
  bio: string
  location: string
  website: string
  username: string
  avatar: string
  cover_photo: string
  is_online: boolean
  last_active: Date
  role: UserRole

  constructor(user: UserType) {
    const date = new Date()
    this._id = user._id
    this.name = user.name || ''
    this.email = user.email
    this.date_of_birth = user.date_of_birth || new Date()
    this.password = user.password
    this.created_at = user.created_at || date
    this.updated_at = user.updated_at || date
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.verify = user.verify || UserVerifyStatus.Unverified
    this.twitter_circle = user.twitter_circle || []
    this.typeAccount = user.typeAccount || AccountStatus.FREE
    this.count_type_account = user.count_type_account || 0
    this.subscription_end_date = user.subscription_end_date || date
    this.bio = user.bio || ''
    this.location = user.location || ''
    this.website = user.website || ''
    this.username = user.username || ''
    this.avatar = user.avatar || ''
    this.cover_photo = user.cover_photo || ''
    this.is_online = user.is_online || false
    this.last_active = user.last_active || date
    this.role = user.role || 'user'
  }
}
