import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Equals } from 'class-validator';

class ReviewFields {
  @IsNotEmpty()
  terminal_name: string;

  @IsNotEmpty()
  terminal_id: string;

  @IsNotEmpty()
  project: string;

  @IsNotEmpty()
  product: number;

  @IsNotEmpty()
  service: number;

  @IsNotEmpty()
  courier: number;

  @IsNotEmpty()
  iiko_id: string;

  @IsNotEmpty()
  city_slug: string;
}

export class IndexReviewRequestDto {
  @IsNotEmpty()
  @Equals('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9', {
    message: 'Token is not valid'
  })
  @ApiProperty({
    example: '-hLRlbofxDc3eSXnWhLtHzPVJ6QpmgS2ChdIfVnYByo',
  })
  readonly token: string;

  @IsNotEmpty()
  @ApiProperty({
    example: {
      terminal_name: '',
      terminal_id: '',
      project: '',
      product: 5,
      service: 5,
      courier: 5
    },
  })
  readonly item: ReviewFields;

  @IsNotEmpty()
  readonly itemId: string;
}