import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InvoiceEntity } from '../../database/entities/invoice.entity';
import { BookingEntity } from '../../database/entities/booking.entity';
import { BookingLocationEntity } from '../../database/entities/booking-location.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { PdfGeneratorService } from '../../utils/pdf-generator.service';
import { EmailService } from '../../utils/email.service';
import { CreateInvoiceDto } from './dto';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoices: Repository<InvoiceEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookings: Repository<BookingEntity>,
    @InjectRepository(BookingLocationEntity)
    private readonly locations: Repository<BookingLocationEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Generate a unique invoice number
   * Format: INV-YYYY-NNNNNN (e.g., INV-2025-000001)
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    // Find the latest invoice for this year
    const latest = await this.invoices
      .createQueryBuilder('invoice')
      .where('invoice.invoice_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('invoice.invoice_number', 'DESC')
      .getOne();

    let sequence = 1;
    if (latest) {
      const lastNumber = latest.invoiceNumber.split('-')[2];
      sequence = parseInt(lastNumber, 10) + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }

  /**
   * Calculate tax (20% VAT for UK)
   */
  private calculateTax(subtotalPence: number): number {
    return Math.round(subtotalPence * 0.2);
  }

  /**
   * Create invoice manually
   */
  async createInvoice(dto: CreateInvoiceDto): Promise<InvoiceEntity> {
    // Check if booking exists
    const booking = await this.bookings.findOne({ where: { id: dto.bookingId } });
    if (!booking) {
      throw new NotFoundException(`Booking ${dto.bookingId} not found`);
    }

    // Check if invoice already exists for this booking
    const existing = await this.invoices.findOne({ where: { bookingId: dto.bookingId } });
    if (existing) {
      throw new ConflictException(`Invoice already exists for booking ${dto.bookingId}`);
    }

    const invoiceNumber = await this.generateInvoiceNumber();
    const subtotalPence = dto.subtotalPence;
    const taxPence = dto.taxPence ?? this.calculateTax(subtotalPence);
    const totalPence = subtotalPence + taxPence;

    const invoice = this.invoices.create({
      bookingId: dto.bookingId,
      invoiceNumber,
      subtotalPence,
      taxPence,
      totalPence,
      currency: dto.currency ?? 'GBP',
      issuedAt: new Date(),
    });

    return this.invoices.save(invoice);
  }

  /**
   * Auto-generate invoice from completed booking
   */
  async generateInvoiceForBooking(bookingId: string): Promise<InvoiceEntity> {
    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    // Check if invoice already exists
    const existing = await this.invoices.findOne({ where: { bookingId } });
    if (existing) {
      return existing; // Return existing invoice instead of throwing error
    }

    // Use final fare if available, otherwise quoted fare
    const farePence = booking.finalFarePence ?? booking.quotedFarePence;
    if (!farePence) {
      throw new ConflictException('Booking has no fare amount set');
    }

    const invoiceNumber = await this.generateInvoiceNumber();
    const subtotalPence = farePence;
    const taxPence = this.calculateTax(subtotalPence);
    const totalPence = subtotalPence + taxPence;

    const invoice = this.invoices.create({
      bookingId,
      invoiceNumber,
      subtotalPence,
      taxPence,
      totalPence,
      currency: booking.currency,
      issuedAt: new Date(),
    });

    return this.invoices.save(invoice);
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(id: string): Promise<InvoiceEntity> {
    const invoice = await this.invoices.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  /**
   * Get invoice by booking ID
   */
  async getInvoiceByBooking(bookingId: string): Promise<InvoiceEntity | null> {
    return this.invoices.findOne({ where: { bookingId } });
  }

  /**
   * Get invoice with full booking details
   */
  async getInvoiceWithDetails(id: string) {
    const invoice = await this.getInvoice(id);
    const booking = await this.bookings.findOne({ where: { id: invoice.bookingId } });
    const location = await this.locations.findOne({ where: { bookingId: invoice.bookingId } });
    const customer = booking ? await this.users.findOne({ where: { id: booking.customerId } }) : null;

    return {
      invoice,
      booking,
      location,
      customer: customer
        ? {
            id: customer.id,
            email: customer.email,
            phone: customer.phoneE164,
          }
        : null,
    };
  }

  /**
   * List all invoices (admin)
   */
  async listInvoices(limit = 50, offset = 0): Promise<InvoiceEntity[]> {
    return this.invoices.find({
      order: { issuedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * List invoices for a customer
   */
  async listInvoicesForCustomer(customerId: string, limit = 50, offset = 0): Promise<InvoiceEntity[]> {
    const bookings = await this.bookings.find({
      where: { customerId },
      select: ['id'],
    });

    const bookingIds = bookings.map((b) => b.id);
    if (bookingIds.length === 0) return [];

    return this.invoices.find({
      where: bookingIds.map((id) => ({ bookingId: id })),
      order: { issuedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Update invoice PDF URL (after PDF generation)
   */
  async updatePdfUrl(id: string, pdfUrl: string): Promise<InvoiceEntity> {
    const invoice = await this.getInvoice(id);
    invoice.pdfUrl = pdfUrl;
    return this.invoices.save(invoice);
  }

  /**
   * Delete invoice (admin only, for corrections)
   */
  async deleteInvoice(id: string): Promise<void> {
    const invoice = await this.getInvoice(id);
    await this.invoices.remove(invoice);
  }

  /**
   * Generate PDF for an invoice
   */
  async generatePdf(id: string): Promise<Buffer> {
    const details = await this.getInvoiceWithDetails(id);
    return this.pdfGenerator.generateInvoicePdf(details);
  }

  /**
   * Generate invoice and automatically email it to the customer
   * This is the main method to use after trip completion
   */
  async generateAndEmailInvoice(bookingId: string): Promise<{ invoice: InvoiceEntity; emailSent: boolean }> {
    // Generate the invoice
    const invoice = await this.generateInvoiceForBooking(bookingId);
    
    // Get full details for email
    const details = await this.getInvoiceWithDetails(invoice.id);
    
    if (!details.customer?.email) {
      this.logger.warn(`Cannot email invoice ${invoice.invoiceNumber}: customer has no email`);
      return { invoice, emailSent: false };
    }

    try {
      // Generate PDF
      const pdfBuffer = await this.pdfGenerator.generateInvoicePdf(details);
      
      // Format total amount for email
      const totalAmount = this.formatCurrency(invoice.totalPence, invoice.currency);
      
      // Format journey date if available
      const journeyDate = details.booking?.scheduledPickupAt 
        ? new Date(details.booking.scheduledPickupAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : undefined;

      // Send email with invoice PDF
      const emailSent = await this.emailService.sendInvoiceEmail(
        details.customer.email,
        invoice.invoiceNumber,
        pdfBuffer,
        {
          bookingNumber: details.booking?.bookingNumber || undefined,
          totalAmount,
          pickupAddress: details.location?.pickupAddress || 'N/A',
          dropoffAddress: details.location?.dropoffAddress || 'N/A',
          journeyDate,
        },
      );

      if (emailSent) {
        this.logger.log(`Invoice ${invoice.invoiceNumber} emailed to ${details.customer.email}`);
      } else {
        this.logger.error(`Failed to email invoice ${invoice.invoiceNumber} to ${details.customer.email}`);
      }

      return { invoice, emailSent };
    } catch (error) {
      this.logger.error(`Error emailing invoice ${invoice.invoiceNumber}:`, error);
      return { invoice, emailSent: false };
    }
  }

  /**
   * Resend invoice email (for admin use)
   */
  async resendInvoiceEmail(invoiceId: string): Promise<boolean> {
    const details = await this.getInvoiceWithDetails(invoiceId);
    
    if (!details.customer?.email) {
      throw new ConflictException('Customer has no email address');
    }

    const pdfBuffer = await this.pdfGenerator.generateInvoicePdf(details);
    const totalAmount = this.formatCurrency(details.invoice.totalPence, details.invoice.currency);
    
    const journeyDate = details.booking?.scheduledPickupAt 
      ? new Date(details.booking.scheduledPickupAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : undefined;

    return this.emailService.sendInvoiceEmail(
      details.customer.email,
      details.invoice.invoiceNumber,
      pdfBuffer,
      {
        bookingNumber: details.booking?.bookingNumber || undefined,
        totalAmount,
        pickupAddress: details.location?.pickupAddress || 'N/A',
        dropoffAddress: details.location?.dropoffAddress || 'N/A',
        journeyDate,
      },
    );
  }

  /**
   * Format currency for display
   */
  private formatCurrency(pence: number, currency: string): string {
    const amount = (pence / 100).toFixed(2);
    const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
    return `${symbol}${amount}`;
  }
}
