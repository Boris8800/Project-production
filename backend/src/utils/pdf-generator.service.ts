import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { InvoiceEntity } from '../database/entities/invoice.entity';

export interface InvoiceData {
  invoice: InvoiceEntity;
  booking?: {
    id: string;
    bookingNumber?: string | null;
    status: string;
    scheduledPickupAt?: Date | null;
    createdAt: Date;
  } | null;
  location?: {
    pickupAddress: string;
    dropoffAddress: string;
  } | null;
  customer?: {
    id: string;
    email: string | null;
    phone: string | null;
  } | null;
}

@Injectable()
export class PdfGeneratorService {
  /**
   * Generate invoice PDF as Buffer
   */
  async generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Company Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('TransferLane', { align: 'left' })
        .fontSize(10)
        .font('Helvetica')
        .text('Premium Executive Travel Services', { align: 'left' })
        .text('United Kingdom', { align: 'left' })
        .moveDown(2);

      // Invoice Title
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE', { align: 'right' })
        .moveDown(0.5);

      // Invoice Details (Right side)
      const invoiceDetailsX = 350;
      const startY = doc.y;

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Invoice Number:', invoiceDetailsX, startY)
        .font('Helvetica')
        .text(data.invoice.invoiceNumber, invoiceDetailsX + 100, startY);

      doc
        .font('Helvetica-Bold')
        .text('Issue Date:', invoiceDetailsX, doc.y)
        .font('Helvetica')
        .text(
          data.invoice.issuedAt.toLocaleDateString('en-GB'),
          invoiceDetailsX + 100,
          doc.y - 12,
        );

      if (data.booking) {
        // Show booking number (trip number) if available, otherwise booking ID
        const displayNumber = data.booking.bookingNumber || data.booking.id.substring(0, 8);
        const label = data.booking.bookingNumber ? 'Trip Number:' : 'Booking ID:';
        
        doc
          .font('Helvetica-Bold')
          .text(label, invoiceDetailsX, doc.y)
          .font('Helvetica')
          .text(displayNumber, invoiceDetailsX + 100, doc.y - 12);
      }

      // Customer Details (Left side)
      doc.y = startY;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Bill To:', 50, doc.y)
        .moveDown(0.3);

      if (data.customer) {
        doc.font('Helvetica').text(data.customer.email || 'N/A', 50);
        if (data.customer.phone) {
          doc.text(data.customer.phone, 50);
        }
      } else {
        doc.font('Helvetica').text('Customer', 50);
      }

      doc.moveDown(2);

      // Journey Details
      if (data.location) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Journey Details', 50)
          .moveDown(0.5);

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Pickup:', 50)
          .font('Helvetica')
          .text(data.location.pickupAddress, 120, doc.y - 12, { width: 400 });

        doc.moveDown(0.5);
        doc
          .font('Helvetica-Bold')
          .text('Destination:', 50)
          .font('Helvetica')
          .text(data.location.dropoffAddress, 120, doc.y - 12, { width: 400 });

        if (data.booking?.scheduledPickupAt) {
          doc.moveDown(0.5);
          doc
            .font('Helvetica-Bold')
            .text('Pickup Time:', 50)
            .font('Helvetica')
            .text(
              data.booking.scheduledPickupAt.toLocaleString('en-GB'),
              120,
              doc.y - 12,
            );
        }

        doc.moveDown(2);
      }

      // Line Items Table
      const tableTop = doc.y;
      const tableHeaders = ['Description', 'Amount'];
      const col1X = 50;
      const col2X = 450;

      // Table Header
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(tableHeaders[0], col1X, tableTop)
        .text(tableHeaders[1], col2X, tableTop, { align: 'right' });

      doc
        .moveTo(col1X, tableTop + 15)
        .lineTo(545, tableTop + 15)
        .stroke();

      // Table Rows
      let currentY = tableTop + 25;

      // Subtotal
      doc
        .font('Helvetica')
        .text('Journey Fare', col1X, currentY)
        .text(
          this.formatCurrency(data.invoice.subtotalPence, data.invoice.currency),
          col2X,
          currentY,
          { align: 'right' },
        );
      currentY += 20;

      // Tax
      doc
        .text('VAT (20%)', col1X, currentY)
        .text(
          this.formatCurrency(data.invoice.taxPence, data.invoice.currency),
          col2X,
          currentY,
          { align: 'right' },
        );
      currentY += 20;

      // Line before total
      doc
        .moveTo(col1X, currentY)
        .lineTo(545, currentY)
        .stroke();
      currentY += 15;

      // Total
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total', col1X, currentY)
        .text(
          this.formatCurrency(data.invoice.totalPence, data.invoice.currency),
          col2X,
          currentY,
          { align: 'right' },
        );

      // Footer
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          'Thank you for choosing TransferLane. For questions about this invoice, please contact support@transferlane.com',
          50,
          700,
          { align: 'center', width: 500 },
        );

      doc.end();
    });
  }

  /**
   * Format pence to currency string
   */
  private formatCurrency(pence: number, currency: string): string {
    const amount = (pence / 100).toFixed(2);
    const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
    return `${symbol}${amount}`;
  }
}
