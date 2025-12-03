import { User, Job } from './index'

export interface JobPhoto {
  id: string
  account_id: string
  job_id: string
  photo_url: string
  thumbnail_url: string | null
  caption: string | null
  taken_at: string
  taken_by: string | null
  created_at: string
  // Relations
  job?: Job
  taken_by_user?: User
}

export interface JobPhotoCreateRequest {
  jobId: string
  photoUrl: string
  thumbnailUrl?: string
  caption?: string
}

export interface JobPhotoUpdateRequest {
  caption?: string
}

export interface JobPhotoListResponse {
  photos: JobPhoto[]
}

export interface JobPhotoDetailResponse {
  photo: JobPhoto
}

export interface JobPhotoCreateResponse {
  success: true
  photo: JobPhoto
}

