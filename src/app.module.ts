import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminModule } from '@admin/admin.module';
import { AuthModule } from '@modules/auth/auth.module';
import { DatabaseModule } from '@database/database.module';
import { TerminalsModule } from '@modules/terminals/terminals.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { ReviewsModule } from '@modules/reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    AdminModule,
    AuthModule,
    TerminalsModule,
    OrdersModule,
    ReviewsModule,
  ],
})
export class AppModule {
  static port: number;
  static apiVersion: string;
  static apiPrefix: string;

  constructor(private readonly configService: ConfigService) {
    AppModule.port = +this.configService.get('API_PORT');
    AppModule.apiVersion = this.configService.get('API_VERSION');
    AppModule.apiPrefix = this.configService.get('API_PREFIX');
  }
}
