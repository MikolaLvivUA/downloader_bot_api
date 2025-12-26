export interface MediaData {
  url: string;
  type: 'photo' | 'video';
  thumbnail?: string;
}

export interface DownloadResult {
  success: boolean;
  media: MediaData[];
  error?: string;
}
