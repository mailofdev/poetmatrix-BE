import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from '../activity/activity.module.js';
import { UsersModule } from '../users/users.module.js';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { PaymentIntent } from './payment-intent.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentIntent]),
    UsersModule,
    ActivityModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
