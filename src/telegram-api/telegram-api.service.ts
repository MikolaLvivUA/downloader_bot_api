import { Injectable, Logger } from '@nestjs/common';
import { Ctx, Hears, On, Update, Next } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { LinksRegExEnum } from './enums/links-regEx.enum';
import { InstagramApiService } from '../instagram-api/instagram-api.service';
import { TikTokApiService } from '../tiktok-api/tiktok-api.service';
import { MediaData } from '../common/interfaces/media-download.interface';
import { DownloadFailedException } from '../common/exceptions/download-failed.exception';
import { PrivateContentException } from '../common/exceptions/private-content.exception';

@Injectable()
@Update()
export class TelegramApiService {
  private readonly logger = new Logger(TelegramApiService.name);

  constructor(
    private readonly instagramService: InstagramApiService,
    private readonly tiktokService: TikTokApiService,
  ) {}

  @On('my_chat_member')
  async onBotInvited(@Ctx() ctx: Context) {
    console.log('bot invited:', JSON.stringify((ctx as any).update));
    console.log('bot invited');
  }

  @Hears(new RegExp(LinksRegExEnum.INSTAGRAM_LINK_REGEX, 'i'))
  async onInstagramMessage(@Ctx() ctx: Context, @Next() next: () => Promise<void>) {
    const messageText = (ctx.message as any)?.text;
    if (!messageText) return next();

    const url = this.extractUrl(messageText, new RegExp(LinksRegExEnum.INSTAGRAM_LINK_REGEX, 'i'));
    if (!url) return next();

    try {
      const result = await this.instagramService.getMediaUrls(url);

      if (!result.success || result.media.length === 0) {
        await this.sendErrorMessage(ctx, result.error || 'No media found');
        return;
      }

      await this.sendMediaToChat(ctx, result.media);
    } catch (error) {
      this.logger.error('Instagram download error', error);

      if (error instanceof PrivateContentException) {
        await this.sendErrorMessage(ctx, '🔒 ' + error.message);
      } else if (error instanceof DownloadFailedException) {
        await this.sendErrorMessage(ctx, '❌ ' + error.message);
      } else {
        await this.sendErrorMessage(ctx, '❌ Failed to download Instagram media. Please try again later.');
      }
    }
  }

  @Hears(new RegExp(LinksRegExEnum.TIKTOK_LINK_REGEX, 'i'))
  async onTikTokMessage(@Ctx() ctx: Context, @Next() next: () => Promise<void>) {
    const messageText = (ctx.message as any)?.text;
    if (!messageText) return next();

    const url = this.extractUrl(messageText, new RegExp(LinksRegExEnum.TIKTOK_LINK_REGEX, 'i'));
    if (!url) return next();

    try {
      const result = await this.tiktokService.getVideoUrl(url);

      if (!result.success || result.media.length === 0) {
        await this.sendErrorMessage(ctx, result.error || 'No video found');
        return;
      }

      await this.sendMediaToChat(ctx, result.media);
    } catch (error) {
      this.logger.error('TikTok download error', error);

      if (error instanceof DownloadFailedException) {
        await this.sendErrorMessage(ctx, '❌ ' + error.message);
      } else {
        await this.sendErrorMessage(ctx, '❌ Failed to download TikTok video. Please try again later.');
      }
    }
  }

  private async sendMediaToChat(ctx: Context, media: MediaData[]): Promise<void> {
    try {
      if (media.length === 1) {
        // Single media
        const item = media[0];
        if (item.type === 'photo') {
          await ctx.replyWithPhoto({ url: item.url });
        } else {
          await ctx.replyWithVideo({ url: item.url });
        }
      } else {
        // Multiple media (carousel)
        const mediaGroup = media.map((item) => ({
          type: item.type,
          media: { url: item.url },
        }));

        await ctx.replyWithMediaGroup(mediaGroup as any);
      }
    } catch (error) {
      this.logger.error('Error sending media to chat', error);
      await this.sendErrorMessage(ctx, '❌ Failed to send media. The file might be too large or unavailable.');
    }
  }

  private async sendErrorMessage(ctx: Context, message: string): Promise<void> {
    try {
      await ctx.reply(message);
    } catch (error) {
      this.logger.error('Error sending error message', error);
    }
  }

  private extractUrl(text: string, regex: RegExp): string | null {
    const match = text.match(regex);
    return match ? match[0] : null;
  }
}
