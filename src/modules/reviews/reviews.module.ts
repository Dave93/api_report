import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews/reviews.controller';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [ReviewsController],
  providers:[ConfigService]
})
export class ReviewsModule {
  constructor() {
  }
}
