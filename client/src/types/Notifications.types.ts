/* eslint-disable @typescript-eslint/no-explicit-any */
export interface NotificationData {
  _id: string
  userId: string
  senderId: string
  actionType: ActionType
  targetId: string
  content: string
  timestamp: Date
  status: NotificationStatus
  sender: {
    _id: string
    name: string
    username: string
    avatar: string
  }
  targetData: any
  createdAt: Date
}

export interface PaginationData {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UseNotificationsProps {
  userId: string
  limit?: number
}

export enum ActionType {
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  FRIEND_REQUEST_ACCEPTED = 'FRIEND_REQUEST_ACCEPTED',
  FRIEND_REQUEST_REJECTED = 'FRIEND_REQUEST_REJECTED',
  FOLLOW = 'FOLLOW',
  UNFOLLOW = 'UNFOLLOW',
  LIKE = 'LIKE',
  UNLIKE = 'UNLIKE',
  COMMENT = 'COMMENT',
  REPLY = 'REPLY',
  RETWEET = 'RETWEET',
  TWEET = 'TWEET',
  QUOTE = 'QUOTE',
  MENTION = 'MENTION',
  TAG = 'TAG',
  SHARE = 'SHARE',
  REPORT = 'REPORT',
  BLOCK = 'BLOCK',
  UNBLOCK = 'UNBLOCK',
  MUTE = 'MUTE',
  UNMUTE = 'UNMUTE',
  STORY = 'STORY',
  STORY_REPLY = 'STORY_REPLY',
  BOOKMARK = 'BOOKMARK',
  UNBOOKMARK = 'UNBOOKMARK'
}

export enum NotificationStatus {
  Unread,
  Read
}
