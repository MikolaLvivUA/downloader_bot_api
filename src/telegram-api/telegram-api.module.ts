import { Module } from '@nestjs/common';
import { TelegramApiService } from './telegram-api.service';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { InstagramApiModule } from '../instagram-api/instagram-api.module';
import { TikTokApiModule } from '../tiktok-api/tiktok-api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    TelegrafModule.forRoot({
      middlewares: [session()],
      token: process.env.TELEGRAM_BOT_TOKEN || '',
      launchOptions: { dropPendingUpdates: true }
    }),
    InstagramApiModule,
    TikTokApiModule,
  ],
  providers: [TelegramApiService]
})
export class TelegramApiModule {}
