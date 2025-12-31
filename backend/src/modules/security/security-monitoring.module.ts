import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { RedisModule } from '../../shared/redis/redis.module';
import { SecurityMonitoringController } from './security-monitoring.controller';
import { SecurityMonitoringService } from './security-monitoring.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), RedisModule],
  controllers: [SecurityMonitoringController],
  providers: [SecurityMonitoringService],
  exports: [SecurityMonitoringService],
})
export class SecurityMonitoringModule {}
