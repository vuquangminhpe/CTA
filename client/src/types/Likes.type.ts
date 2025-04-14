import { user_info_comment } from './Utils.type'

export interface Likes {
  _id?: string
  user_id: string
  tweet_id: string
  created_at?: Date
  updated_at?: Date
  user_info: user_info_comment
}
