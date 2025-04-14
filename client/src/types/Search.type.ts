import { MediaType } from '../constants/enum'

export interface SearchRequest {
  content: string
  limit: number
  page: number
  media_type?: MediaType
}
