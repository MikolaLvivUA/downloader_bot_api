import { Injectable, Logger } from '@nestjs/common';
import { Downloader } from '@tobyg74/tiktok-api-dl';
import { DownloadResult, MediaData } from '../common/interfaces/media-download.interface';
import { DownloadFailedException } from '../common/exceptions/download-failed.exception';

@Injectable()
export class TikTokApiService {
  private readonly logger = new Logger(TikTokApiService.name);

  async getVideoUrl(url: string): Promise<DownloadResult> {
    try {
      this.logger.log(`Fetching TikTok video from: ${url}`);

      const result = await Downloader(url, {
        version: 'v3' // Using v3 for better reliability
      });

        if (!result || result.status !== 'success') {
        throw new DownloadFailedException('Failed to fetch TikTok video');
      }

      const media: MediaData[] = this.parseTikTokResponse(result);

      if (media.length === 0) {
        throw new DownloadFailedException('No video found in TikTok link');
      }

      return {
        success: true,
        media,
      };
    } catch (error) {
      this.logger.error(`TikTok download error: ${error.message}`, error.stack);

      if (error instanceof DownloadFailedException) {
        throw error;
      }

      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new DownloadFailedException('TikTok video not found. The link may be invalid or deleted.');
      }

      if (error.message?.includes('rate limit')) {
        throw new DownloadFailedException('TikTok rate limit reached. Please try again later.');
      }

      throw new DownloadFailedException('Failed to download TikTok video. Please check the link and try again.');
    }
  }

  private parseTikTokResponse(result: any): MediaData[] {
    const media: MediaData[] = [];

    // @tobyg74/tiktok-api-dl v3 returns { status, result: { type, videoHD, videoSD, videoWatermark, images, author } }
    if (result.result) {
      const data = result.result;

      // Handle video - prefer SD over HD, avoid watermark
      const videoUrl = data.videoSD || data.videoHD;

      if (videoUrl) {
        media.push({
          url: videoUrl,
          type: 'video',
          thumbnail: data.author?.avatar,
        });
      }
      // Handle slideshow/images (for TikTok photo posts)
      else if (data.images && Array.isArray(data.images)) {
        for (const imageUrl of data.images) {
          media.push({
            url: imageUrl,
            type: 'photo',
            thumbnail: data.author?.avatar,
          });
        }
      }
    }

    return media;
  }
}
