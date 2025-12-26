import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramApiModule } from './telegram-api/telegram-api.module';
import { InstagramApiModule } from './instagram-api/instagram-api.module';
import { TikTokApiModule } from './tiktok-api/tiktok-api.module';

@Module({
  imports: [TelegramApiModule, InstagramApiModule, TikTokApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
