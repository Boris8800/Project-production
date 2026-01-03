(async () => {
  try {
    const path = require('path');
    const EmailService = require(path.join(__dirname, '..', 'backend', 'dist', 'src', 'utils', 'email.service.js')).EmailService;

    if (!EmailService) {
      console.error('EmailService not found in compiled backend dist.');
      process.exit(1);
    }

    const email = new EmailService();

    // Create a small PDF-like buffer for testing
    const pdfBuffer = Buffer.from('%PDF-1.4\n%Test PDF content\n');

    const success = await email.sendInvoiceEmail(
      'test@example.com',
      'INV-TEST-001',
      pdfBuffer,
      {
        customerName: 'Test Customer',
        bookingNumber: 'BOOK-12345',
        totalAmount: '£100.00',
        pickupAddress: 'Heathrow Airport',
        dropoffAddress: 'Central London',
        journeyDate: new Date().toISOString().split('T')[0],
      }
    );

    console.log('sendInvoiceEmail returned:', success);
  } catch (err) {
    console.error('Error sending test invoice:', err);
    process.exit(1);
  }
})();