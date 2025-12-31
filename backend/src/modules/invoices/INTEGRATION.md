# Invoice Auto-Generation and Email Delivery Integration

## Overview

The invoice system automatically generates invoices and **emails them to customers** when trips are completed. Invoices are sent as PDF attachments via email, eliminating the need for customers to access them through the web API.

## Email-First Approach

**Key Changes:**
- ✅ Invoices are automatically emailed to customers after trip completion
- ✅ Professional email template with invoice PDF attachment
- ✅ Web API endpoints restricted to Admin-only access
- ✅ Customers receive invoices directly in their inbox
- ✅ No customer-facing invoice download pages needed

## Email Configuration

### Required Environment Variables

Add these to your `.env` file:

```bash
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com           # Your SMTP server
SMTP_PORT=587                      # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER=your-email@gmail.com     # SMTP username
SMTP_PASS=your-app-password        # SMTP password or app-specific password
SMTP_FROM="TransferLane <noreply@transferlane.com>"  # Sender email
```

### Email Provider Examples

#### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password  # Generate in Google Account settings
SMTP_FROM="TransferLane <noreply@transferlane.com>"
```

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM="TransferLane <noreply@transferlane.com>"
```

#### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
SMTP_FROM="TransferLane <noreply@transferlane.com>"
```

#### Development (No Config Needed)
If SMTP is not configured, the system automatically uses **Ethereal Email** (a test email service):
- Emails won't actually be delivered
- Preview URLs are logged to console
- Perfect for testing without real email setup

## Automatic Invoice Email on Trip Completion

### Integration with TripsService

Modify your trip completion logic in `trips.service.ts`:

```typescript
// backend/src/modules/trips/trips.service.ts

import { InvoicesService } from '../invoices/invoices.service';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(TripEntity) private readonly trips: Repository<TripEntity>,
    @InjectRepository(BookingEntity) private readonly bookings: Repository<BookingEntity>,
    private readonly realtime: RealtimeGateway,
    private readonly invoicesService: InvoicesService, // Add this
  ) {}

  async completeTrip(driverId: string, tripId: string) {
    const trip = await this.getTrip(tripId);
    
    // Existing validation...
    
    // Update trip status
    trip.status = TripStatus.Completed;
    trip.actualEndAt = new Date();
    await this.trips.save(trip);

    // Update booking status
    const booking = await this.bookings.findOne({ where: { id: trip.bookingId } });
    if (booking) {
      booking.status = BookingStatus.Completed;
      await this.bookings.save(booking);

      // AUTO-GENERATE AND EMAIL INVOICE
      try {
        const result = await this.invoicesService.generateAndEmailInvoice(booking.id);
        
        if (result.emailSent) {
          console.log(`Invoice ${result.invoice.invoiceNumber} emailed to customer`);
        } else {
          console.warn(`Invoice ${result.invoice.invoiceNumber} generated but email failed`);
          // Could queue for retry or alert admin
        }
      } catch (error) {
        // Log error but don't fail the trip completion
        console.error('Failed to auto-generate/email invoice:', error);
      }
    }

    // Emit completion events...
    return trip;
  }
}
```

### Update Trips Module

Import InvoicesModule in `trips.module.ts`:

```typescript
// backend/src/modules/trips/trips.module.ts
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TripEntity, BookingEntity]),
    RealtimeModule,
    InvoicesModule, // Add this
  ],
  controllers: [TripsController],
  providers: [TripsService],
})
export class TripsModule {}
```

## What Customers Receive

When a trip completes, customers automatically receive an email with:

### Email Content:
- Professional TransferLane branding
- Journey details (pickup, destination, date)
- Total amount with VAT breakdown
- PDF invoice attached
- Support contact information

### PDF Invoice Includes:
- Company header
- Invoice number (e.g., INV-2025-000001)
- Customer details
- Journey information
- Line items (fare + 20% VAT)
- Total amount

## Admin Functions

Admins have full access to invoice management through API endpoints:

### Generate and Email Invoice Manually
```bash
POST /v1/invoices/generate/{bookingId}/email
Authorization: Bearer {admin-token}
```

### Resend Invoice Email
```bash
POST /v1/invoices/{invoiceId}/resend
Authorization: Bearer {admin-token}
```

### View All Invoices
```bash
GET /v1/invoices
Authorization: Bearer {admin-token}
```

### View Specific Invoice
```bash
GET /v1/invoices/{invoiceId}/details
Authorization: Bearer {admin-token}
```

## API Access Control

**All invoice endpoints are Admin-only:**
- ❌ Customers cannot access invoices via API
- ✅ Customers receive invoices via email
- ✅ Admins can view, generate, and resend all invoices
- ✅ SuperAdmins can delete invoices

## Testing Email Delivery

### Development Testing (No SMTP Config)

If you don't configure SMTP, the system uses Ethereal Email automatically:

1. Complete a trip
2. Check console logs for preview URL
3. Open the URL to see the email
4. Verify PDF attachment

Example console output:
```
[InvoicesService] Invoice INV-2025-000001 emailed to customer@example.com
[EmailService] Email sent to customer@example.com: <message-id>
[EmailService] Preview URL: https://ethereal.email/message/xxxxx
```

### Production Testing (With SMTP)

1. Configure SMTP environment variables
2. Complete a trip
3. Check customer's email inbox
4. Verify professional email with PDF attachment

## Error Handling

The system handles email failures gracefully:

```typescript
const result = await invoicesService.generateAndEmailInvoice(bookingId);

if (!result.emailSent) {
  // Email failed but invoice was still created
  // Options:
  // 1. Queue for retry
  // 2. Alert admin
  // 3. Log for manual follow-up
}
```

## Email Template Customization

To customize the email template, edit:
- `backend/src/utils/email.service.ts` → `generateInvoiceEmailHtml()`
- Modify HTML, styling, branding, copy
- Update text version in `generateInvoiceEmailText()`

## Monitoring and Logs

The system logs all email activities:

```typescript
// Success
[InvoicesService] Invoice INV-2025-000001 emailed to customer@example.com

// Warning (no email)
[InvoicesService] Cannot email invoice INV-2025-000001: customer has no email

// Error
[InvoicesService] Error emailing invoice INV-2025-000001: SMTP connection failed
```

## Security Notes

- All email attachments are generated on-the-fly (not stored)
- Customer email addresses are validated
- SMTP credentials should be kept secure in environment variables
- Use app-specific passwords for Gmail (not account password)
- Consider rate limiting for production email sending

## Future Enhancements

Consider adding:
- [ ] Email delivery tracking (open rates, bounces)
- [ ] Retry queue for failed emails
- [ ] Customer email preferences (opt-in/opt-out)
- [ ] Email templates in multiple languages
- [ ] BCC to accounting department
- [ ] Monthly invoice summaries
