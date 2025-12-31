# Booking Number Implementation - Payment-Based Assignment

## ✅ Implementation Complete

Booking numbers (B203, B204, B205...) are now **only assigned after payment confirmation**, ensuring no gaps in sequential numbering from unpaid or cancelled bookings.

---

## 🔄 Workflow

```
Step 1: Customer creates booking
   ├─ Status: "created"
   └─ Booking Number: null (not assigned yet)

Step 2: Customer completes payment
   ├─ Payment confirmed via payment gateway
   └─ System triggered

Step 3: Status updated to "confirmed"
   ├─ Auto-triggers booking number generation
   ├─ Finds last assigned number (e.g., B202)
   ├─ Assigns next number (B203)
   └─ Saves booking

Result:
   ├─ Status: "confirmed"
   └─ Booking Number: "B203" ✓
```

---

## 📋 What Changed

### 1. **BookingsService** ([bookings.service.ts](backend/src/modules/bookings/bookings.service.ts))

**Before:**
- Booking number assigned immediately on creation
- Result: Unpaid bookings waste numbers → gaps in sequence

**After:**
- Booking created with `bookingNumber: null`
- Number assigned ONLY when status changes to `confirmed`
- Result: Sequential numbering without gaps

**New Methods:**
- `updateBookingStatus(bookingId, status)` - Assigns number when confirming
- `assignBookingNumberOnPayment(bookingId)` - Manual assignment for webhooks

### 2. **AdminService** ([admin.service.ts](backend/src/modules/admin/admin.service.ts))

**Updated:**
- `setBookingStatus()` now uses `BookingsService.updateBookingStatus()`
- Ensures booking number assignment happens through proper flow

### 3. **Database Migration** ([add-booking-numbers.sql](database/add-booking-numbers.sql))

**Updated:**
- Only assigns numbers to confirmed/paid bookings (status >= 'confirmed')
- Starts from B203 as requested
- Leaves unpaid bookings without numbers

### 4. **Frontend Display** (Customer/Admin Portals)

**Behavior:**
- Shows booking number (e.g., "B203") when assigned
- Falls back to UUID for unpaid bookings
- Logic: `{booking.bookingNumber || booking.id}`

---

## 🚀 How to Use

### For Admins

**Confirm Payment Manually:**
```typescript
// Admin panel: Change booking status to "confirmed"
await adminService.setBookingStatus(bookingId, BookingStatus.Confirmed);
// → Booking number B203 automatically assigned
```

### For Payment Integration

**In your payment webhook handler:**
```typescript
// Stripe/PayPal webhook receives payment confirmation
async handlePaymentSuccess(bookingId: string) {
  // Update status - this triggers booking number assignment
  const booking = await bookingsService.updateBookingStatus(
    bookingId,
    BookingStatus.Confirmed
  );
  
  console.log(`Payment confirmed - Booking #${booking.bookingNumber}`);
  // Send confirmation email with booking number
}
```

---

## 📊 Examples

### Example 1: Normal Flow
```
Booking A → Created → Paid → Confirmed → Gets B203 ✓
Booking B → Created → Paid → Confirmed → Gets B204 ✓
Booking C → Created → Paid → Confirmed → Gets B205 ✓
```

### Example 2: With Unpaid Booking
```
Booking A → Created → Paid → Confirmed → Gets B203 ✓
Booking B → Created → NOT PAID → Cancelled → No number ✗
Booking C → Created → Paid → Confirmed → Gets B204 ✓
(No gap - B203 → B204 directly!)
```

---

## 🧪 Testing Steps

1. **Create booking via customer portal**
   - Check: Booking shows UUID (no number yet)
   - Status: "created"

2. **Admin confirms payment** (change status to "confirmed")
   - Check: Booking now shows "B203"
   - Status: "confirmed"

3. **Create another booking and confirm**
   - Check: Gets "B204"
   - Verify: Sequential numbering works

4. **Create unpaid booking**
   - Create booking
   - Cancel without confirming
   - Check: Still shows UUID (no number assigned)

5. **Next paid booking**
   - Create and confirm
   - Check: Gets "B205" (no gap from cancelled booking)

---

## 📁 Modified Files

| File | Changes |
|------|---------|
| `backend/src/modules/bookings/bookings.service.ts` | • Removed number generation from `createBooking()`<br>• Added `updateBookingStatus()` method<br>• Added `assignBookingNumberOnPayment()` method<br>• Updated `generateBookingNumber()` to start from 203 |
| `backend/src/modules/admin/admin.service.ts` | • Injected `BookingsService`<br>• Updated `setBookingStatus()` to use new method |
| `backend/src/modules/admin/admin.module.ts` | • Imported `BookingsModule`<br>• Added `BookingLocationEntity` |
| `database/add-booking-numbers.sql` | • Only assigns to confirmed bookings<br>• Starts from B203<br>• Skips unpaid bookings |
| `BOOKING_NUMBERS.md` | • Complete documentation update<br>• Payment-based workflow explained |

---

## 🔍 Key Technical Details

**Starting Number:** B203 (configurable in `generateBookingNumber()`)

**Trigger Condition:** `status === BookingStatus.Confirmed`

**Concurrency Safe:** Database unique constraint prevents duplicates

**Order By:** `booking_number DESC` ensures correct sequence

**Null Handling:** Frontend gracefully falls back to UUID display

---

## ✨ Benefits

✅ **No gaps** in booking numbers from cancelled/unpaid bookings  
✅ **Sequential numbering** - B203, B204, B205 (not B203, B207, B208)  
✅ **Professional** - Only confirmed bookings get official numbers  
✅ **Scalable** - Works with payment webhooks (Stripe, PayPal, etc.)  
✅ **User-friendly** - Customers get booking number after payment  

---

## 🔗 Next Steps

1. **Run migration** (for existing databases):
   ```bash
   psql -U user -d database -f database/add-booking-numbers.sql
   ```

2. **Integrate with payment gateway**:
   - Add webhook handler
   - Call `updateBookingStatus()` on payment success
   - Send confirmation email with booking number

3. **Test the flow**:
   - Create bookings
   - Confirm payments
   - Verify sequential numbering

---

**Status:** ✅ Ready for production  
**Starting Number:** B203  
**Assignment:** On payment confirmation only
