import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookingEntity } from '../../database/entities/booking.entity';
import { BookingLocationEntity } from '../../database/entities/booking-location.entity';
import { TripEntity } from '../../database/entities/trip.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, BookingEntity, BookingLocationEntity, TripEntity]),
    BookingsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
