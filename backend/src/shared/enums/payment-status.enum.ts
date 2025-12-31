export enum PaymentStatus {
  RequiresPaymentMethod = 'requires_payment_method',
  RequiresConfirmation = 'requires_confirmation',
  Processing = 'processing',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Refunded = 'refunded',
  Cancelled = 'cancelled',
}
