/**
 * Shared types for TBWC events (Facebook API and app)
 */

export interface EventPlace {
  name?: string
  location?: {
    city?: string
    country?: string
    state?: string
    street?: string
    zip?: string
  }
}

export interface EventCover {
  source: string
  id?: string
  offset_x?: number
  offset_y?: number
}

export interface TBWCEvent {
  id: string
  name: string
  description: string
  start_time: string
  end_time: string | null
  formatted_date: string
  formatted_time: string
  formatted_end_time: string | null
  formatted_end_date: string | null
  is_multi_day: boolean
  attending_count: number
  interested_count: number
  place: EventPlace | null
  cover: EventCover | null
  is_cancelled?: boolean
}
