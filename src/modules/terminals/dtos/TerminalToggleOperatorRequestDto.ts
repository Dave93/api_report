import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class TerminalToggleOperatorRequestDto {
  @IsNotEmpty()
  active?: string;
  @IsNotEmpty()
  project: string;
  @IsNotEmpty()
  id: string;
}