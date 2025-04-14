import { MediaType } from '../constants/enum'
import { Media } from './Medias.type'
import { User } from './User.type'

export interface CreateNewStoryResBody {
  content: string
  media_url: string
  media_type: Media[]
  caption: string
  privacy: string[]
}

export interface ViewAndStatusStoryResBody {
  story_id: string
  content: string
  view_status: string
}

export interface ViewerType {
  viewer_id: string[]
  seen_at: Date
  content: string
  view_status: string
}

export interface StoryType {
  _id?: string
  user_id: string
  media_url: string
  media_type: Media[]
  caption?: string
  content: string
  created_at?: Date
  expires_at?: Date
  update_at?: Date
  viewer: ViewerType[]
  is_active: boolean
  privacy: string[]
  user: User
}

export interface ViewerType {
  viewer_id: string[]
  seen_at: Date
  content: string
  view_status: string
}

export interface StorySummary {
  _id: string
  user: {
    _id: string
    name: string
    username: string
    avatar?: string
  }
  lastUpdated: Date
  isViewed: boolean
  mediaUrl?: string
  mediaType?: MediaType
}

export interface StoryGroup {
  userId: string
  username: string
  userAvatar?: string
  stories: StorySummary[]
  hasUnviewedStories: boolean
  lastUpdated: Date
}
