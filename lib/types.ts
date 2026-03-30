export interface Thumbnail {
  id: string
  user_id: string
  prompt: string
  title: string | null
  image_url: string | null
  storage_path: string | null
  status: 'pending' | 'generating' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface GenerateResponse {
  thumbnail?: Thumbnail
  error?: string
}
