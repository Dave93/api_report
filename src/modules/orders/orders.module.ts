import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import {ConfigService} from "@nestjs/config";

@Module({
  controllers: [OrdersController],
  providers:[ConfigService]
})
export class OrdersModule {}
