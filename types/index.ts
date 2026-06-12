export interface GenerateRequest {
  prompt: string;
  negative_prompt?: string;
  duration?: number;
  fps?: number;
  resolution?: string;
  seed?: number;
  aspect_ratio?: string;
  init_image_url?: string;
}

export interface GenerateResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  prompt: string;
  video_url?: string;
  thumbnail_url?: string;
  error_msg?: string;
  duration: number;
  fps: number;
  resolution: string;
  seed?: number;
  aspect_ratio: string;
  init_image_url?: string;
  created_at: string;
  completed_at?: string;
  gpu_sec?: number;
  cost_usd?: number;
}

export interface VideoListItem {
  id: string;
  job_id: string;
  prompt: string;
  video_url?: string;
  thumbnail_url?: string;
  status: string;
  created_at: string;
  duration: number;
  resolution: string;
}
