import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../shared/enums/roles.enum';
import { DispatchService } from './dispatch.service';
import {
  DispatchDriverLinkRequestDto,
  DispatchLinkRequestDto,
  DispatchMagicLinkRequestDto,
  DispatchStatusUpdateDto,
} from './dto';

@ApiTags('dispatch')
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatch: DispatchService) {}

  @Post('link')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  async requestLink(@Body() dto: DispatchLinkRequestDto) {
    return this.dispatch.issueAndSendLink(dto.bookingId, dto.email);
  }

  @Post('driver-link')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  async requestDriverLink(@Body() dto: DispatchDriverLinkRequestDto) {
    return this.dispatch.issueAndSendDriverLink(dto.bookingId, dto.email);
  }

  @Post('magic-link')
  async requestMagicLink(@Body() dto: DispatchMagicLinkRequestDto) {
    return this.dispatch.requestMagicLinkByEmail(dto.email, dto.bookingNumber);
  }

  // Public endpoints (token-auth via Redis)
  @Get(':token')
  async getSummary(@Param('token') token: string) {
    return this.dispatch.getPublicSummary(token);
  }

  @Get(':token/updates')
  async getUpdates(@Param('token') token: string) {
    return this.dispatch.getPublicUpdates(token);
  }

  // Driver token can submit status updates via HTTP as a fallback to websockets.
  @Post(':token/status')
  async updateStatus(@Param('token') token: string, @Body() dto: DispatchStatusUpdateDto) {
    return this.dispatch.updateStatusFromToken(token, dto.status);
  }
}
