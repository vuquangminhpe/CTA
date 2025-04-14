export interface DashboardStats {
  users: {
    total: number
    new_today: number
    active_24h: number
  }
  content: {
    total_tweets: number
    new_tweets_today: number
  }
  interactions: {
    total_likes: number
    new_likes_today: number
  }
  revenue: {
    today: number
    yesterday: number
    growth_percentage: number
  }
  trends: {
    users: { date: string; new_users: number }[]
    tweets: { date: string; new_tweets: number }[]
  }
  subscription_distribution: {
    free: number
    premium: number
    platinum: number
  }
}

export interface UserStats {
  total_users: number
  by_verification_status: {
    unverified: number
    verified: number
    banned: number
  }
  by_account_type: {
    free: number
    premium: number
    platinum: number
  }
  growth_over_time: { date: string; new_users: number }[]
}

export interface ContentStats {
  total_tweets: number
  tweets_with_media: number
  by_tweet_type: {
    tweet: number
    retweet: number
    comment: number
    quote_tweet: number
  }
  growth_over_time: { date: string; new_tweets: number }[]
  popular_hashtags: { hashtag: string; count: number }[]
}

export interface InteractionStats {
  total_likes: number
  total_bookmarks: number
  total_comments: number
  total_follows: number
  interactions_over_time: {
    likes: { date: string; count: number }[]
    bookmarks: { date: string; count: number }[]
    comments: { date: string; count: number }[]
  }
  top_engaged_tweets: {
    _id: string
    content: string
    created_at: string
    user_name: string
    likes_count: number
    bookmarks_count: number
    comments_count: number
    total_engagement: number
  }[]
}

export interface RevenueStats {
  total_revenue: number
  by_subscription_type: {
    premium: number
    platinum: number
  }
  revenue_over_time: {
    date: string
    premium: number
    platinum: number
  }[]
  conversion_rates: {
    free_percentage: number
    premium_percentage: number
    platinum_percentage: number
  }
}

export interface User {
  _id: string
  name: string
  username: string
  email: string
  bio: string
  avatar: string
  verify: number
  typeAccount: number
  created_at: string
  last_active: string
}

export interface UserListResponse {
  users: User[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export interface ReportedContent {
  _id: string
  content_id: string
  content_type: string
  reporter_id: string
  reason: string
  description: string
  status: string
  created_at: string
  updated_at: string
  content: {
    _id: string
    content: string
    user: {
      _id: string
      name: string
      username: string
      avatar: string
    }
  }
  reporter: {
    _id: string
    name: string
    username: string
    avatar: string
  }
}

export interface ReportedContentResponse {
  reports: ReportedContent[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export interface ModerationStats {
  reports_by_status: {
    pending: number
    reviewed: number
    ignored: number
    removed: number
  }
  reports_by_content_type: {
    tweet: number
    comment: number
    user_bio: number
    story: number
  }
  reports_by_reason: { _id: string; count: number }[]
  report_trend: { _id: string; count: number }[]
  banned_users_count: number
  active_bans_count: number
}

export interface DateRangeParams {
  from_date?: string
  to_date?: string
  interval?: 'daily' | 'weekly' | 'monthly'
}

export interface UserStatsParams extends DateRangeParams {
  account_type?: '0' | '1' | '2'
  verification_status?: '0' | '1' | '2'
}

export interface ContentStatsParams extends DateRangeParams {
  content_type?: '0' | '1' | '2' | '3'
  has_media?: 'true' | 'false'
}

export interface InteractionStatsParams extends DateRangeParams {
  interaction_type?: 'like' | 'bookmark' | 'comment' | 'follow'
}

export interface RevenueStatsParams extends DateRangeParams {
  subscription_type?: '1' | '2'
}

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  account_type?: '0' | '1' | '2'
  verification_status?: '0' | '1' | '2'
}

export interface ReportParams {
  report_type: string
  from_date: string
  to_date: string
  format: 'json' | 'csv'
}

export interface ReportedContentParams {
  content_type?: 'tweet' | 'comment' | 'user_bio' | 'story'
  status?: 'pending' | 'reviewed' | 'ignored' | 'removed'
  from_date?: string
  to_date?: string
  page?: number
  limit?: number
}
