import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../shared/enums/roles.enum';
import { SecurityMonitoringService } from './security-monitoring.service';

@ApiTags('security')
@ApiBearerAuth()
@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
export class SecurityMonitoringController {
  constructor(private readonly security: SecurityMonitoringService) {}

  @Get('login-attempts')
  async getLoginAttempts(
    @Query('limit') limit?: string,
    @Query('date') date?: string,
  ) {
    const take = limit ? parseInt(limit, 10) : 100;
    const targetDate = date ? new Date(date) : new Date();
    return this.security.getLoginAttempts(take, targetDate);
  }

  @Get('login-attempts/stats')
  async getLoginStats(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 7;
    return this.security.getLoginStats(numDays);
  }

  @Get('blocked-ips')
  async getBlockedIPs() {
    return this.security.getBlockedIPs();
  }

  @Get('online-users')
  async getOnlineUsers() {
    return this.security.getOnlineUsers();
  }

  @Post('block-ip')
  async blockIP(@Body() body: { ip: string; reason?: string; duration?: number }) {
    return this.security.manualBlockIP(body.ip, body.reason, body.duration);
  }

  @Delete('block-ip/:ip')
  async unblockIP(@Param('ip') ip: string) {
    return this.security.unblockIP(ip);
  }

  @Get('suspicious-ips')
  async getSuspiciousIPs() {
    return this.security.getSuspiciousIPs();
  }

  @Get('activity-log')
  async getActivityLog(@Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 100;
    return this.security.getActivityLog(take);
  }
}
