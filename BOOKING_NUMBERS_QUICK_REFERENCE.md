## 🎯 Booking Numbers - Quick Reference

### When are booking numbers assigned?
**ONLY after payment is confirmed** (status changes to `confirmed`)

### What's the format?
**B203, B204, B205...** (starts from B203)

### What happens to unpaid bookings?
They **never get a booking number** - prevents gaps in sequence

---

## 🔄 Flow

```
Create Booking → bookingNumber: null
      ↓
Confirm Payment → bookingNumber: "B203" ✓
```

---

## 💻 Code Examples

### Confirming Payment (triggers number assignment)
```typescript
await bookingsService.updateBookingStatus(bookingId, BookingStatus.Confirmed);
// Booking number automatically assigned: B203
```

### Admin Panel
```typescript
await adminService.setBookingStatus(bookingId, BookingStatus.Confirmed);
// Same result - uses BookingsService internally
```

### Payment Webhook
```typescript
// Stripe/PayPal confirms payment
async onPaymentSuccess(bookingId: string) {
  await bookingsService.updateBookingStatus(bookingId, BookingStatus.Confirmed);
  // Send email: "Your booking B203 is confirmed!"
}
```

---

## 📱 Frontend Display

Shows `B203` for paid bookings, UUID for unpaid:
```tsx
<div>{booking.bookingNumber || booking.id}</div>
```

---

## 🧪 Quick Test

1. Create booking → Shows UUID
2. Admin confirms → Shows B203
3. Create another → Confirm → Shows B204
4. Create but don't confirm → Still shows UUID
5. Next confirmed booking → Shows B205 (no gap!)

---

## 📊 Why This Approach?

| Old Way (Number at Creation) | New Way (Number at Payment) |
|-------------------------------|------------------------------|
| B1, B2, B3, B4... | B203, B204, B205... |
| Unpaid bookings waste numbers | Only paid bookings get numbers |
| Gaps: B1, B3, B5 (B2, B4 cancelled) | No gaps: B203, B204, B205 |
| ❌ Unprofessional | ✅ Professional |

---

**Modified Files:**
- `backend/src/modules/bookings/bookings.service.ts`
- `backend/src/modules/admin/admin.service.ts`
- `backend/src/modules/admin/admin.module.ts`
- `database/add-booking-numbers.sql`

**Status:** ✅ Ready to use
