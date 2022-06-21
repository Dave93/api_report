import { Module } from '@nestjs/common';
import { TerminalsController } from './terminals.controller';
import {ConfigService} from "@nestjs/config";
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRepository } from '@admin/access/users/users.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UsersRepository])],
  controllers: [TerminalsController],
  providers:[ConfigService]
})
export class TerminalsModule {
  constructor() {
  }
}

