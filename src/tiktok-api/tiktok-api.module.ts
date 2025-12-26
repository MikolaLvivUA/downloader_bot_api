import { Module } from '@nestjs/common';
import { TikTokApiService } from './tiktok-api.service';

@Module({
  providers: [TikTokApiService],
  exports: [TikTokApiService]
})
export class TikTokApiModule {}
