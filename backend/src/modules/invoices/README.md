# Invoice Generation System

## Overview

The invoice generation system automatically creates invoices and **emails them to customers** when trips are completed. Invoices are delivered as professional PDF attachments via email, eliminating the need for customer-facing web endpoints.

## Key Features

- ✅ **Email-First Design**: Invoices automatically emailed to customers
- ✅ Professional email templates with PDF attachments
- ✅ Automatic invoice number generation (Format: `INV-YYYY-NNNNNN`)
- ✅ Auto-calculation of 20% VAT for UK
- ✅ Admin-only API access (no customer web access)
- ✅ Beautiful PDF invoice generation
- ✅ Development mode with test email preview

## How It Works

1. **Trip Completes** → System triggers invoice generation
2. **Invoice Created** → Unique number assigned, VAT calculated
3. **PDF Generated** → Professional invoice PDF created
4. **Email Sent** → Customer receives email with PDF attachment
5. **Admin Access** → Admins can view/resend via API

## Email Configuration

### Quick Start (Development)

No configuration needed! The system automatically uses **Ethereal Email** for testing:
- Preview URLs logged to console
- No real emails sent
- Perfect for development

### Production Setup

Add to your `.env` file:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="TransferLane <noreply@transferlane.com>"
```

See [INTEGRATION.md](./INTEGRATION.md) for provider-specific examples (Gmail, SendGrid, AWS SES).

## API Endpoints (Admin Only)

## API Endpoints (Admin Only)

**Note:** All endpoints require Admin or SuperAdmin role. Customers receive invoices via email only.

### Generate and Email Invoice (Recommended)
```http
POST /v1/invoices/generate/{bookingId}/email
Authorization: Bearer {admin-token}
```

Generates invoice and emails it to customer automatically.

**Response:**
```json
{
  "invoice": {
    "id": "uuid",
    "invoiceNumber": "INV-2025-000001",
    "totalPence": 16800
  },
  "emailSent": true
}
```

### Resend Invoice Email
```http
POST /v1/invoices/{invoiceId}/resend
Authorization: Bearer {admin-token}
```

Resends invoice email to customer.

### List All Invoices (Admin)
```http
GET /v1/invoices?limit=50&offset=0
Authorization: Bearer {admin-token}
```

### View Invoice Details (Admin)
```http
GET /v1/invoices/{id}/details
Authorization: Bearer {admin-token}
```

Returns invoice with full booking and customer information.

### Get Invoice by Booking (Admin)
```http
GET /v1/invoices/booking/{bookingId}
Authorization: Bearer {admin-token}
```

## Invoice Generation Flow

### Automatic Generation (Recommended)
When a booking is completed:
1. System calls `InvoicesService.generateInvoiceForBooking(bookingId)`
2. Invoice number is auto-generated
3. Fare is taken from `finalFarePence` or `quotedFarePence`
4. VAT is calculated at 20%
5. Invoice is saved to database

### Manual Generation
Admin can manually create invoices with custom amounts:
1. POST to `/v1/invoices` with booking ID and amounts
2. System validates booking exists
3. Ensures no duplicate invoice for the booking
4. Creates Email Content

### What Customers Receive

Professional email with:AndEmailInvoice(bookingId)`
2. Invoice number is auto-generated (e.g., INV-2025-000001)
3. Fare is taken from `finalFarePence` or `quotedFarePence`
4. VAT is calculated at 20%
5. Invoice is saved to database
6. **PDF is generated on-the-fly**
7. **Email is sent to customer with PDF attached**
8. Success/failure logged

### Manual Generation (Admin)

Admin can manually trigger:
```bash
POST /v1/invoices/generate/{bookingId}/email
```

## Email Delivery Monitoring

Check logs for delivery status:

```
[InvoicesService] Invoice INV-2025-000001 emailed to customer@example.com
[EmailService] Email sent successfully
[EmailService] Preview URL: https://ethereal.email/message/... (dev mode)
```

## Development Testing

1. Complete a trip (no SMTP config needed)
2. Check console for preview URL
3. Open URL to see email
4. Verify PDF attachment
5. Check email formatting

## Production Deployment

1. Configure SMTP credentials in `.env`
2. Test with real email address
3. Verify delivery to customer inbox
4. Check spam folder if needed
5. Monitor email delivery logsiew all invoices via API
- Resend invoices if customer didn't receive
- Generate invoices manually if needed
- Delete invoices (SuperAdmin only)
- Access full invoice details

## Invoice Generation Flow

### Automatic Generation (After Trip Completion

The PDF generator creates professional invoices with:
- **Company Header**: TransferLane branding
- **Invoice Details**: Number, date, booking ID
- **Customer Information**: Email and phone
- *Security

- **Email-Only for Customers**: No web access to invoices
- **Admin API Access**: Role-based authentication required
- **JWT tokens**: All endpoints protected
- **SMTP Security**: Credentials in environment variables
- **PDF Generation**: On-the-fly, not stored (unless configured)
- **No customer data exposure**: Emails sent only to booking customer

## Dependencies

Required npm packages:

```json
{
  "dependencies": {
    "pdfkit": "^0.15.0",
    "nodemailer": "^6.9.16"
  },
  "devDependencies": {
    "@types/pdfkit": "^0.13.4",
    "@types/nodemailer": "^6.4.16"
  }
}
```

Install with:
```bash
cd backend
npm install
```

## Database Schema

The `invoices` table (already exists in migrations):
- `Future Enhancements

- [ ] Email delivery tracking (opens, bounces)
- [ ] Retry queue for failed emails
- [ ] Cloud storage for PDFs (S3, Azure Blob)
- [ ] Multi-language email templates
- [ ] Monthly invoice summaries
- [ ] Customer email preferences
- [ ] SMS notifications for invoice delivery
- [ ] Integration with accounting software

## Troubleshooting

### Email Not Sending

1. Check SMTP credentials in `.env`
2. Verify SMTP port (587 for TLS, 465 for SSL)
3. Check firewall/network allows SMTP connections
4. For Gmail: Enable "App Passwords" in Google Account
5. Check console logs for detailed error messages

### Customer Not Receiving

1. Check spam/junk folder
2. Verify customer email address in database
3. Check email logs for delivery confirmation
4. Use "resend" endpoint to retry

### PDF Not Generating

1. Ensure `pdfkit` is installed
2. Check booking has fare data
3. Verify all required booking/location data exists
4. Check console for PDF generation errors

## Support

For issues or questions:
- Check [INTEGRATION.md](./INTEGRATION.md) for setup guide
- Review console logs for error details
- Contact: support@transferlane.com
## Currency Support

The system supports multiple currencies (GBP, EUR, USD) with proper symbol formatting:
- GBP: £
- EUR: €
- USD: $

## Tax Calculation

Currently configured for UK VAT:
- **Rate**: 20%
- **Calculation**: `taxPence = Math.round(subtotalPence * 0.2)`

To change tax rate, modify `calculateTax()` in `invoices.service.ts`.

## Currency Support

The system supports multiple currencies (GBP, EUR, USD) with proper symbol formatting in PDFs:
- GBP: £
- EUR: €
- USD: $

## Security

- **Role-based access**: Customers see only their invoices, admins see all
- **JWT authentication**: All endpoints require valid tokens
- **Deletion restricted**: Only SuperAdmins can delete invoices

## Dependencies

Required npm packages (add to backend/package.json):
```json
{
  "dependencies": {
    "pdfkit": "^0.15.0"
  },
  "devDependencies": {
    "@types/pdfkit": "^0.13.4"
  }
}
```

## Testing

Example test scenarios:
1. Generate invoice for completed booking
2. Prevent duplicate invoices for same booking
3. Calculate correct VAT
4. Generate sequential invoice numbers
5. Download PDF successfully
6. Customer can only see their own invoices

## Future Enhancements

- [ ] Email invoice PDFs to customers
- [ ] Store PDFs in cloud storage (S3, Azure Blob)
- [ ] Support for discounts and promotions
- [ ] Multi-currency tax calculations
- [ ] Invoice templates customization
- [ ] Batch invoice generation
- [ ] Invoice reminders for unpaid bookings
