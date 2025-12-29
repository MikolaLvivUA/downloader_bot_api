import { Injectable, Logger } from '@nestjs/common';
import { instagramGetUrl } from 'instagram-url-direct';
import { DownloadResult, MediaData } from '../common/interfaces/media-download.interface';
import { DownloadFailedException } from '../common/exceptions/download-failed.exception';
import { PrivateContentException } from '../common/exceptions/private-content.exception';

@Injectable()
export class InstagramApiService {
  private readonly logger = new Logger(InstagramApiService.name);

  async getMediaUrls(url: string): Promise<DownloadResult> {
    try {
      this.logger.log(`Fetching Instagram media from: ${url}`);

      const result = await instagramGetUrl(url);

      if (!result || !result.url_list || result.url_list.length === 0) {
        throw new DownloadFailedException('No media found in Instagram post');
      }

      const media: MediaData[] = this.parseInstagramResponse(result);

      if (media.length === 0) {
        throw new DownloadFailedException('No media found in Instagram post');
      }

      return {
        success: true,
        media,
      };
    } catch (error) {
      this.logger.error(`Instagram download error: ${error.message}`, error.stack);

      if (error instanceof PrivateContentException || error instanceof DownloadFailedException) {
        throw error;
      }

      if (error.message?.includes('private') || error.message?.includes('login')) {
        throw new PrivateContentException(
          'This Instagram post is private or requires login. I cannot download it.'
        );
      }

      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new DownloadFailedException('Instagram post not found. The link may be invalid or deleted.');
      }

      if (error.message?.includes('rate limit')) {
        throw new DownloadFailedException('Instagram rate limit reached. Please try again later.');
      }

      throw new DownloadFailedException('Failed to download Instagram media. Please check the link and try again.');
    }
  }

  private parseInstagramResponse(result: any): MediaData[] {
    const media: MediaData[] = [];

    // Extract caption from post_info if available
    const caption = result.post_info?.caption || undefined;

    // instagram-url-direct returns { url_list: string[], thumbnail?: string, post_info: { caption, ... } }
    if (result.url_list && Array.isArray(result.url_list)) {
      for (const mediaUrl of result.url_list) {
        media.push({
          url: mediaUrl,
          type: this.determineMediaTypeFromUrl(mediaUrl),
          thumbnail: result.thumbnail,
          caption: caption,
        });
      }
    }

    return media;
  }

  private determineMediaTypeFromUrl(url: string): 'photo' | 'video' {
    // Check file extension to determine media type
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') || lowerUrl.includes('video')) {
      return 'video';
    }
    return 'photo';
  }
}
