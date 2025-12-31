import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InvoiceEntity } from '../../database/entities/invoice.entity';
import { BookingEntity } from '../../database/entities/booking.entity';
import { BookingLocationEntity } from '../../database/entities/booking-location.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { PdfGeneratorService } from '../../utils/pdf-generator.service';
import { EmailService } from '../../utils/email.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvoiceEntity, BookingEntity, BookingLocationEntity, UserEntity]),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, PdfGeneratorService, EmailService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
