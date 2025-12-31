import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Booking ID for this invoice' })
  @IsUUID()
  @IsNotEmpty()
  bookingId!: string;

  @ApiProperty({ description: 'Subtotal in pence', example: 14000 })
  @IsNumber()
  @Min(0)
  subtotalPence!: number;

  @ApiProperty({ description: 'Tax amount in pence', example: 2800, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxPence?: number;

  @ApiProperty({ description: 'Currency code', example: 'GBP', required: false })
  @IsString()
  @IsOptional()
  currency?: string;
}
