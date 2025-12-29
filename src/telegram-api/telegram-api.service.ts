import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Telegraf, Context, session } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { LinksRegExEnum } from './enums/links-regEx.enum';
import { InstagramApiService } from '../instagram-api/instagram-api.service';
import { TikTokApiService } from '../tiktok-api/tiktok-api.service';
import { MediaData } from '../common/interfaces/media-download.interface';
import { DownloadFailedException } from '../common/exceptions/download-failed.exception';
import { PrivateContentException } from '../common/exceptions/private-content.exception';

@Injectable()
export class TelegramApiService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramApiService.name);
  private bot: Telegraf;

  constructor(
    private readonly instagramService: InstagramApiService,
    private readonly tiktokService: TikTokApiService,
    private readonly configService: ConfigService,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined');
    }
    this.bot = new Telegraf(token);
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    this.bot.use(session());
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing Telegram bot...');
    this.registerHandlers();
    await this.bot.launch({ dropPendingUpdates: true });
    this.logger.log('Telegram bot started successfully');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Stopping Telegram bot...');
    await this.bot.stop('SIGTERM');
    this.logger.log('Telegram bot stopped');
  }

  private registerHandlers(): void {
    // Bot invitation handler
    this.bot.on('my_chat_member', (ctx) => {
      this.logger.log('bot invited:', JSON.stringify(ctx.update));
      this.logger.log('bot invited');
    });

    // Instagram link handler
    this.bot.hears(
      new RegExp(LinksRegExEnum.INSTAGRAM_LINK_REGEX, 'i'),
      async (ctx, next) => {
        await this.handleInstagramMessage(ctx, next);
      }
    );

    // TikTok link handler
    this.bot.hears(
      new RegExp(LinksRegExEnum.TIKTOK_LINK_REGEX, 'i'),
      async (ctx, next) => {
        await this.handleTikTokMessage(ctx, next);
      }
    );
  }

  private async handleInstagramMessage(ctx: Context, next: () => Promise<void>): Promise<void> {
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

  private async handleTikTokMessage(ctx: Context, next: () => Promise<void>): Promise<void> {
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
        // Single media - send with caption as reply to original message
        const item = media[0];
        const options: any = {
          ...(ctx.message?.message_id && {
            reply_parameters: { message_id: ctx.message.message_id }
          }),
          ...(item.caption && { caption: item.caption })
        };

        if (item.type === 'photo') {
          await ctx.replyWithPhoto({ url: item.url }, options);
        } else {
          await ctx.replyWithVideo({ url: item.url }, options);
        }
      } else {
        // Multiple media - media group with caption on the first item
        const mediaGroup = media.map((item, index) => ({
          type: item.type,
          media: { url: item.url },
          ...(index === 0 && item.caption && { caption: item.caption })
        }));

        const replyOptions = ctx.message?.message_id
          ? { reply_parameters: { message_id: ctx.message.message_id } }
          : {};

        await ctx.replyWithMediaGroup(mediaGroup, replyOptions);
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

