import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, MagicLinkConsumeDto, MagicLinkRequestDto, RefreshDto, RegisterDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly rateLimit: RateLimitGuard,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.auth.registerWithPassword(dto);
  }

  @Post('login')
  @UseGuards(RateLimitGuard)
  async login(@Req() req: Request, @Body() dto: LoginDto) {
    return this.auth.loginWithPassword(dto, req);
  }

  @Post('magic-link')
  async requestMagicLink(@Body() dto: MagicLinkRequestDto) {
    return this.auth.requestMagicLink(dto);
  }

  @Post('magic-link/consume')
  async consumeMagicLink(@Body() dto: MagicLinkConsumeDto) {
    return this.auth.consumeMagicLink(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user?: unknown }) {
    return this.auth.me(req.user);
  }
}
