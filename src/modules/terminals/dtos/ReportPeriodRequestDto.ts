import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ReportPeriodRequestDto {
  // @IsNotEmpty()
  @ApiProperty({
    example: '2022-01-23T19:00:00.000Z',
  })
  dateFrom: string;

  // @IsNotEmpty()
  @ApiProperty({
    example: '2022-01-23T19:00:00.000Z',
  })
  dateTo: string;

  terminal?: string;

  project?: string;

}