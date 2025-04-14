export interface Conversation {
  _id: string | number
  content: string
  created_at: Date
  updated_at: Date
  emoji: string
  sender_id: string
  receive_id: string
}

export interface ConversationResponse {
  message: string
  result: {
    total_pages: number
    page: number
    conversations: Conversation[]
  }
}
