import { Body, Controller, Delete, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../shared/enums/roles.enum';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Create invoice manually (Admin)' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  async create(@Body() dto: CreateInvoiceDto) {
    return this.invoices.createInvoice(dto);
  }

  @Post('generate/:bookingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Generate invoice for a booking (Admin)' })
  @ApiResponse({ status: 201, description: 'Invoice generated successfully' })
  async generateForBooking(@Param('bookingId') bookingId: string) {
    return this.invoices.generateInvoiceForBooking(bookingId);
  }

  @Post('generate/:bookingId/email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Generate invoice and email to customer (Admin)' })
  @ApiResponse({ status: 201, description: 'Invoice generated and emailed successfully' })
  async generateAndEmail(@Param('bookingId') bookingId: string) {
    return this.invoices.generateAndEmailInvoice(bookingId);
  }

  @Post(':id/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Resend invoice email (Admin)' })
  @ApiResponse({ status: 200, description: 'Invoice email resent successfully' })
  async resend(@Param('id') id: string) {
    const sent = await this.invoices.resendInvoiceEmail(id);
    return { success: sent, message: sent ? 'Invoice email sent' : 'Failed to send email' };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'List all invoices (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async list(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const take = limit ? Number(limit) : 50;
    const skip = offset ? Number(offset) : 0;
    return this.invoices.listInvoices(take, skip);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get invoice by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  async get(@Param('id') id: string) {
    return this.invoices.getInvoice(id);
  }

  @Get(':id/details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get invoice with full booking details (Admin only)' })
  @ApiResponse({ status: 200, description: 'Invoice with booking and customer details' })
  async getDetails(@Param('id') id: string) {
    return this.invoices.getInvoiceWithDetails(id);
  }

  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get invoice by booking ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Invoice for the booking' })
  async getByBooking(@Param('bookingId') bookingId: string) {
    const invoice = await this.invoices.getInvoiceByBooking(bookingId);
    if (!invoice) {
      return { message: 'No invoice found for this booking' };
    }
    return invoice;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin)
  @ApiOperation({ summary: 'Delete invoice (SuperAdmin only)' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully' })
  async delete(@Param('id') id: string) {
    await this.invoices.deleteInvoice(id);
    return { message: 'Invoice deleted successfully' };
  }
}
