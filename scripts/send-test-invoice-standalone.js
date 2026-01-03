(async () => {
  try {
    const path = require('path');
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (e) {
      // fallback to backend node_modules when running from different cwd
      nodemailer = require(path.join(__dirname, '..', 'backend', 'node_modules', 'nodemailer'));
    }
    const EmailServiceCompiled = require(path.join(__dirname, '..', 'backend', 'dist', 'src', 'utils', 'email.service.js'));
    const EmailServicePrototype = EmailServiceCompiled && EmailServiceCompiled.EmailService && EmailServiceCompiled.EmailService.prototype;

    const testAccount = await nodemailer.createTestAccount();
    console.log('Using Ethereal test account:', testAccount.user);

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const invoiceNumber = 'INV-TEST-001-2';
    const details = {
      customerName: 'Test Customer',
      bookingNumber: 'BOOK-12345',
      totalAmount: '£100.00',
      pickupAddress: 'Heathrow Airport',
      dropoffAddress: 'Central London',
      journeyDate: new Date().toISOString().split('T')[0],
    };

    const html = EmailServicePrototype
      ? EmailServicePrototype.generateInvoiceEmailHtml.call({}, invoiceNumber, details)
      : `<p>Test invoice for ${invoiceNumber}</p>`;

    const text = EmailServicePrototype
      ? EmailServicePrototype.generateInvoiceEmailText.call({}, invoiceNumber, details)
      : `Test invoice for ${invoiceNumber}`;

    const pdfBuffer = Buffer.from('%PDF-1.4\n%Test Invoice PDF content\n');

    const info = await transporter.sendMail({
      from: '"Transferline" <noreply@transferline.com>',
      to: 'test@example.com',
      subject: `Your Transferline Invoice - ${invoiceNumber}`,
      html,
      text,
      attachments: [
        {
          filename: `Transferline-Invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log('Message sent, id:', info.messageId);
    const preview = nodemailer.getTestMessageUrl(info);
    console.log('Preview URL:', preview);
  } catch (err) {
    console.error('Error in standalone send:', err);
    process.exit(1);
  }
})();