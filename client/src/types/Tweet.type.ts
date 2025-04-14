import { TweetAudience, TweetType } from '../constants/enum'
import { Media } from './Medias.type'

export interface Tweets {
  _id?: string
  user_id: string
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string
  hashtags: string[]
  mentions: string[]
  medias: Media[]
  guest_views?: number
  user_views?: number
  created_at?: Date
  updated_at?: Date
  mention_info?: mention_info[]
  hashtag_info?: hashtag_info[]
}
interface mention_info {
  user_name: string
}
interface hashtag_info {
  name: string
}
export interface TweetFormValues {
  _id?: string
  content: string
  images: File[]
  audience: TweetAudience
  hashtags: string[]
  medias: Media[]
  mentions: string[]
  currentHashtag: string
  currentMention: string
  type: TweetType
}

export type createdTweet = Omit<Tweets, 'user_id' | 'created_at' | 'updated_at' | 'guest_views' | 'user_views'>
