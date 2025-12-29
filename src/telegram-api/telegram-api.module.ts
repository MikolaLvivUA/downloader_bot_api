import { Module } from '@nestjs/common';
import { TelegramApiService } from './telegram-api.service';
import { ConfigModule } from '@nestjs/config';
import { InstagramApiModule } from '../instagram-api/instagram-api.module';
import { TikTokApiModule } from '../tiktok-api/tiktok-api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    InstagramApiModule,
    TikTokApiModule,
  ],
  providers: [TelegramApiService],
  exports: [TelegramApiService],
})
export class TelegramApiModule {}
