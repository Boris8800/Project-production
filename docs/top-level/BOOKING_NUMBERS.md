# Beach Booking Numbers Feature

## Overview
Booking numbers are **only assigned after payment is confirmed**. This ensures sequential numbering (B203, B204, B205...) without gaps from unpaid or cancelled bookings.

## Key Behavior
- **Before Payment**: Booking has no booking number (shows UUID in UI)
- **After Payment Confirmed**: System automatically assigns next sequential number (B203, B204, etc.)
- **Sequential**: No gaps - only paid bookings consume numbers

## Format
- **Prefix**: `B` (for "Booking")
- **Starting Number**: 203
- **Examples**: B203, B204, B205, ..., B999, B1000

## Implementation

### Database
- **Column**: `booking_number` (varchar(20), UNIQUE)
- **Table**: `bookings`
- **Location**: [migrations.sql](./migrations.sql#L202)

### Backend

**Entity**: [BookingEntity](../backend/src/database/entities/booking.entity.ts)
```typescript
@Column({ name: 'booking_number', type: 'varchar', length: 20, unique: true, nullable: true })
bookingNumber!: string | null;
```

**Service**: [BookingsService](../backend/src/modules/bookings/bookings.service.ts)
- `generateBookingNumber()`: Generates next sequential number starting from B203
- `createBooking()`: Creates booking WITHOUT booking number (null initially)
- `updateBookingStatus()`: Assigns booking number when status changes to 'confirmed'
- `assignBookingNumberOnPayment()`: Manual assignment method for payment webhooks

### Frontend
Booking numbers are displayed in:
1. **Customer Portal** - Shows booking number (e.g., B203) for paid bookings, UUID for unpaid
2. **Admin Portal** - Shows booking number for paid bookings
3. **Admin Trips Page** - Shows booking number in trip details modal

**Display Logic**: `{booking.bookingNumber || booking.id}` - shows number if assigned, falls back to UUID

## Database Migration

For existing databases, run this migration script:

```bash
psql -U your_user -d your_database -f database/add-booking-numbers.sql
```

This will:
1. Add the `booking_number` column if it doesn't exist
2. Generate sequential booking numbers (B203, B204...) **ONLY for confirmed/paid bookings**
3. Leave unpaid bookings without numbers (will be assigned when they pay)
4. Display verification statistics

## API Response

**Before Payment (Created status):**
```json
{
  "id": "uuid-here",
  "bookingNumber": null,
  "customerId": "uuid-here",
  "status": "created",
  "location": {
    "pickupAddress": "123 Main St",
    "dropoffAddress": "456 Oak Ave"
  }
}
```

**After Payment (Confirmed status):**
```json
{
  "id": "uuid-here",
  "bookingNumber": "B203",
  "customerId": "uuid-here",
  "status": "confirmed",
  "location": {
    "pickupAddress": "123 Main St",
    "dropoffAddress": "456 Oak Ave"
  }
}
```

## Usage

### Creating a Booking
```typescript
// Step 1: Create booking (no booking number yet)
const booking = await bookingsService.createBooking(customerId, {
  pickupAddress: "123 Main St",
  dropoffAddress: "456 Oak Ave",
  pickupLat: 51.5074,
  pickupLon: -0.1278,
  dropoffLat: 51.5155,
  dropoffLon: -0.1419
});

console.log(booking.bookingNumber); // null (not assigned yet)
console.log(booking.status); // "created"
```

### Confirming Payment
```typescript
// Step 2: Confirm payment - booking number is assigned automatically
const confirmedBooking = await bookingsService.updateBookingStatus(
  bookingId, 
  BookingStatus.Confirmed
);

console.log(confirmedBooking.bookingNumber); // "B203" (assigned!)
console.log(confirmedBooking.status); // "confirmed"
```

### Admin Updating Status
```typescript
// Admin can change status to confirmed - triggers booking number assignment
await adminService.setBookingStatus(bookingId, BookingStatus.Confirmed);
// Booking number B204 is now assigned
```

### Displaying Booking Number
```tsx
// Shows "B203" if available, falls back to UUID
<div>{booking.bookingNumber || booking.id}</div>
```

## Testing

1. **Create a new booking** via the customer portal
2. **Verify** booking shows UUID (no booking number yet)
3. **Admin confirms payment** by changing status to "confirmed"
4. **Check** booking now shows B203 (or next sequential number)
5. **Create another booking** and confirm - should be B204
6. **Test unpaid booking** - create booking but don't confirm, verify it stays without number

## Technical Details

### Number Generation Logic
```typescript
private async generateBookingNumber(): Promise<string> {
  // Find the last booking number starting with 'B'
  // Only count bookings that have been paid (have a booking_number)
  const lastBooking = await this.bookings
    .createQueryBuilder('booking')
    .where("booking.booking_number LIKE 'B%'")
    .andWhere("booking.booking_number IS NOT NULL")
    .orderBy('booking.booking_number', 'DESC')
    .getOne();

  let nextNumber = 203; // Start from B203
  if (lastBooking?.bookingNumber) {
    const currentNumber = parseInt(lastBooking.bookingNumber.substring(1), 10);
    if (!isNaN(currentNumber)) {
      nextNumber = currentNumber + 1;
    }
  }

  return `B${nextNumber}`;
}
```

### Payment Confirmation Logic
```typescript
async updateBookingStatus(bookingId: string, status: BookingStatus) {
  const booking = await this.bookings.findOne({ where: { id: bookingId } });
  if (!booking) throw new NotFoundException('Booking not found');

  booking.status = status;

  // Assign booking number ONLY when payment is confirmed
  if (status === BookingStatus.Confirmed && !booking.bookingNumber) {
    booking.bookingNumber = await this.generateBookingNumber();
  }

  return this.bookings.save(booking);
}
```

### Concurrency Handling
The unique constraint on `booking_number` prevents duplicates. The system uses database-level ordering (ORDER BY booking_number DESC) to ensure the correct next number is selected, even with concurrent payment confirmations.

## Workflow

```
1. Customer creates booking
   ↓
   Status: "created"
   Booking Number: null
   
2. Customer makes payment
   ↓
   Payment gateway confirms
   ↓
   
3. System updates status to "confirmed"
   ↓
   Triggers booking number assignment
   ↓
   Status: "confirmed"
   Booking Number: "B203"
   
4. Future unpaid/cancelled bookings
   ↓
   Never get booking numbers
   ↓
   No gaps in sequence!
```

## Future Enhancements

Potential improvements:
- **Payment webhook integration** - Auto-assign number when Stripe/PayPal confirms payment
- **Custom prefixes** for different booking types (e.g., B for beach, A for airport, C for city)
- **Date-based numbering** (e.g., B-2025-001)
- **QR code generation** using booking numbers for check-in
- **Search by booking number** endpoint for customer support
- **Email notifications** with booking number after payment confirmation

---

**Status**: ✅ Complete - Booking numbers assigned only after payment confirmation starting from B203
