import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter?: Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || 'noreply@transferlane.com';

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn('SMTP credentials not configured. Email sending will be disabled.');
      // Create a test account for development
      this.createTestAccount();
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    this.logger.log(`Email service initialized with SMTP host: ${smtpHost}`);
  }

  private async createTestAccount() {
    try {
      // Create a test account for development (ethereal.email)
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      this.logger.log(`Using test email account: ${testAccount.user}`);
      this.logger.log('Preview emails at: https://ethereal.email');
    } catch (error) {
      this.logger.error('Failed to create test email account:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error('Email transporter not initialized');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"TransferLane" <noreply@transferlane.com>',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });

      this.logger.log(`Email sent to ${options.to}: ${info.messageId}`);
      
      // Preview URL for ethereal.email
      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          this.logger.log(`Preview URL: ${previewUrl}`);
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(
    recipientEmail: string,
    invoiceNumber: string,
    pdfBuffer: Buffer,
    details: {
      customerName?: string;
      bookingNumber?: string;
      totalAmount: string;
      pickupAddress: string;
      dropoffAddress: string;
      journeyDate?: string;
    },
  ): Promise<boolean> {
    const subject = `Your TransferLane Invoice - ${invoiceNumber}`;
    
    const html = this.generateInvoiceEmailHtml(invoiceNumber, details);
    const text = this.generateInvoiceEmailText(invoiceNumber, details);

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text,
      attachments: [
        {
          filename: `TransferLane-Invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  private generateInvoiceEmailHtml(
    invoiceNumber: string,
    details: {
      customerName?: string;
      bookingNumber?: string;
      totalAmount: string;
      pickupAddress: string;
      dropoffAddress: string;
      journeyDate?: string;
    },
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { text-align: center; padding-bottom: 20px; border-bottom: 3px solid #0066cc; }
          .header h1 { margin: 0; color: #0066cc; font-size: 28px; }
          .header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
          .content { padding: 30px 0; }
          .greeting { font-size: 16px; margin-bottom: 20px; }
          .invoice-details { background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .invoice-details h2 { margin: 0 0 15px 0; color: #0066cc; font-size: 18px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; }
          .total { background: #0066cc; color: white; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; }
          .total-label { font-size: 14px; margin-bottom: 5px; }
          .total-amount { font-size: 32px; font-weight: bold; }
          .attachment-notice { background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TransferLane</h1>
            <p>Premium Executive Travel Services</p>
          </div>
          
          <div class="content">
            <p class="greeting">
              Dear ${details.customerName || 'Valued Customer'},
            </p>
            
            <p>
              Thank you for choosing TransferLane for your recent journey. We hope you had a pleasant and comfortable experience.
            </p>
            
            <div class="invoice-details">
              <h2>Invoice Details</h2>
              <div class="detail-row">
                <span class="detail-label">Invoice Number:</span>
                <span class="detail-value">${invoiceNumber}</span>
              </div>
              ${details.bookingNumber ? `
              <div class="detail-row">
                <span class="detail-label">Trip Number:</span>
                <span class="detail-value"><strong>${details.bookingNumber}</strong></span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Pickup:</span>
                <span class="detail-value">${details.pickupAddress}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Destination:</span>
                <span class="detail-value">${details.dropoffAddress}</span>
              </div>
              ${details.journeyDate ? `
              <div class="detail-row">
                <span class="detail-label">Journey Date:</span>
                <span class="detail-value">${details.journeyDate}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="total">
              <div class="total-label">Total Amount (including VAT)</div>
              <div class="total-amount">${details.totalAmount}</div>
            </div>
            
            <div class="attachment-notice">
              <strong>📄 Invoice Attached</strong><br>
              Your detailed invoice is attached to this email as a PDF document. Please save it for your records.
            </div>
            
            <p>
              If you have any questions about this invoice or your journey, please don't hesitate to contact our support team.
            </p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The TransferLane Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>TransferLane Premium Executive Travel</p>
            <p>United Kingdom</p>
            <p>
              <a href="mailto:support@transferlane.com" style="color: #0066cc;">support@transferlane.com</a>
            </p>
            <p style="margin-top: 15px; font-size: 11px; color: #999;">
              This is an automated email. Please do not reply directly to this message.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateInvoiceEmailText(
    invoiceNumber: string,
    details: {
      customerName?: string;
      bookingNumber?: string;
      totalAmount: string;
      pickupAddress: string;
      dropoffAddress: string;
      journeyDate?: string;
    },
  ): string {
    return `
TransferLane - Premium Executive Travel

Dear ${details.customerName || 'Valued Customer'},

Thank you for choosing TransferLane for your recent journey.

INVOICE DETAILS
Invoice Number: ${invoiceNumber}
${details.bookingNumber ? `Trip Number: ${details.bookingNumber}\n` : ''}Pickup: ${details.pickupAddress}
Destination: ${details.dropoffAddress}
${details.journeyDate ? `Journey Date: ${details.journeyDate}` : ''}

TOTAL AMOUNT (including VAT): ${details.totalAmount}

Your detailed invoice is attached to this email as a PDF document.

If you have any questions, please contact us at support@transferlane.com

Best regards,
The TransferLane Team

---
TransferLane Premium Executive Travel
United Kingdom
    `.trim();
  }

  /**
   * Send trip completion notification
   */
  async sendTripCompletionEmail(
    recipientEmail: string,
    details: {
      customerName?: string;
      pickupAddress: string;
      dropoffAddress: string;
      driverName?: string;
    },
  ): Promise<boolean> {
    const subject = 'Journey Completed - Thank You for Choosing TransferLane';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Journey Completed</h1>
          </div>
          <div class="content">
            <p>Dear ${details.customerName || 'Valued Customer'},</p>
            <p>Your journey from <strong>${details.pickupAddress}</strong> to <strong>${details.dropoffAddress}</strong> has been completed successfully.</p>
            ${details.driverName ? `<p>Your chauffeur, ${details.driverName}, thanks you for your business.</p>` : ''}
            <p>Your invoice will be sent to you shortly in a separate email.</p>
            <p>We hope you had a pleasant experience and look forward to serving you again.</p>
            <p>Best regards,<br>The TransferLane Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }
}
