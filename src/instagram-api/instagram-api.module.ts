import { Module } from '@nestjs/common';
import { InstagramApiService } from './instagram-api.service';

@Module({
  providers: [InstagramApiService],
  exports: [InstagramApiService]
})
export class InstagramApiModule {}
