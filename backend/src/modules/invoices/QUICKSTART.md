# Invoice System - Quick Setup Guide

## Installation Steps

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `pdfkit` - PDF generation library
- `nodemailer` - Email sending library
- `@types/pdfkit` - TypeScript types
- `@types/nodemailer` - TypeScript types

### 2. Configure Email (Optional for Development)

**For Development:**
- No configuration needed!
- System uses Ethereal Email automatically
- Preview URLs logged to console

**For Production:**
Copy email configuration to your `.env` file:

```bash
# See .env.email.example for provider-specific examples
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Transferline <noreply@transferline.com>"
```

### 3. Integrate with Trip Completion

Edit `backend/src/modules/trips/trips.service.ts`:

```typescript
import { InvoicesService } from '../invoices/invoices.service';

@Injectable()
export class TripsService {
  constructor(
    // ... existing dependencies
    private readonly invoicesService: InvoicesService,
  ) {}

  async completeTrip(driverId: string, tripId: string) {
    // ... existing trip completion code ...
    
    booking.status = BookingStatus.Completed;
    await this.bookings.save(booking);
    
    // AUTO-EMAIL INVOICE TO CUSTOMER
    try {
      const result = await this.invoicesService.generateAndEmailInvoice(booking.id);
      if (result.emailSent) {
        this.logger.log(`Invoice ${result.invoice.invoiceNumber} emailed to customer`);
      }
    } catch (error) {
      this.logger.error('Failed to email invoice:', error);
    }
    
    return trip;
  }
}
```

Edit `backend/src/modules/trips/trips.module.ts`:

```typescript
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TripEntity, BookingEntity]),
    RealtimeModule,
    InvoicesModule,  // Add this line
  ],
  controllers: [TripsController],
  providers: [TripsService],
})
export class TripsModule {}
```

### 4. Build and Test

```bash
# Build the backend
npm run build

# Start the backend
npm run start:dev

# Complete a test trip and check console logs
```

### 5. Verify Email Delivery

**Development:**
1. Complete a trip
2. Check console for: `[EmailService] Preview URL: https://ethereal.email/message/...`
3. Open the URL to see the email
4. Verify PDF attachment

**Production:**
1. Configure SMTP in `.env`
2. Complete a trip
3. Check customer's email inbox
4. Verify professional email with PDF

## Testing Endpoints (Admin Only)

### Generate and Email Invoice
```bash
curl -X POST http://localhost:4000/v1/invoices/generate/{bookingId}/email \
  -H "Authorization: Bearer {admin-token}"
```

### Resend Invoice Email
```bash
curl -X POST http://localhost:4000/v1/invoices/{invoiceId}/resend \
  -H "Authorization: Bearer {admin-token}"
```

### List All Invoices
```bash
curl http://localhost:4000/v1/invoices \
  -H "Authorization: Bearer {admin-token}"
```

## Troubleshooting

### Dependencies Not Installing
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Email Not Sending
1. Check SMTP credentials in `.env`
2. Verify port (587 for TLS, 465 for SSL)
3. For Gmail: Use "App Password", not regular password
4. Check console logs for detailed errors

### PDF Not Generating
1. Verify `pdfkit` is installed
2. Check booking has fare data
3. Review console logs for errors

## Next Steps

1. ✅ Install dependencies
2. ✅ Integrate with trip completion
3. ✅ Test in development mode
4. ✅ Configure production SMTP
5. ✅ Deploy and monitor

## Support

- **Documentation**: See README.md and INTEGRATION.md
- **Email Examples**: See .env.email.example
- **Issues**: Check console logs for errors

---

**Ready to go!** Install dependencies and start testing.
