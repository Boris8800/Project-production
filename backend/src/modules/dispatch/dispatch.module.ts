import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookingEntity } from '../../database/entities/booking.entity';
import { BookingLocationEntity } from '../../database/entities/booking-location.entity';
import { TripEntity } from '../../database/entities/trip.entity';
import { DriverLocationEntity } from '../../database/entities/driver-location.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { RedisModule } from '../../shared/redis/redis.module';
import { EmailService } from '../../utils/email.service';
import { DispatchController } from './dispatch.controller';
import { DispatchGateway } from './dispatch.gateway';
import { DispatchService } from './dispatch.service';

@Module({
  imports: [
    RedisModule,
    TypeOrmModule.forFeature([BookingEntity, BookingLocationEntity, TripEntity, DriverLocationEntity, UserEntity]),
  ],
  controllers: [DispatchController],
  providers: [DispatchService, DispatchGateway, EmailService],
  exports: [DispatchService],
})
export class DispatchModule {}
