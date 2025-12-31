import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class DispatchLinkRequestDto {
  @IsString()
  @MinLength(8)
  bookingId!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class DispatchMagicLinkRequestDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  bookingNumber?: string;
}
