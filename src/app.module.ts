import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ActivityModule } from './activity/activity.module.js';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BillingModule } from './billing/billing.module.js';
import { CommunityModule } from './community/community.module.js';
import { DiscoveryModule } from './discovery/discovery.module.js';
import { EngagementModule } from './engagement/engagement.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { validateEnv } from './config/env.schema.js';
import { ContentModule } from './content/content.module.js';
import { HealthModule } from './health/health.module.js';
import { MailModule } from './mail/mail.module.js';
import { PlatformModule } from './platform/platform.module.js';
import { SocialModule } from './social/social.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

const observeKey = process.env.OBSERVE_APP_KEY?.trim();
const observeSecret = process.env.OBSERVE_APP_SECRET?.trim();

@Module({
  imports: [
    ...(observeKey && observeSecret
      ? [
          ObserveModule.forRoot({
            appKey: observeKey,
            appSecret: observeSecret,
            serviceId: 'poetmatrix-be',
          }),
        ]
      : []),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
        logging: ['error'],
      }),
    }),
    MailModule,
    PlatformModule,
    ActivityModule,
    AuthModule,
    ContentModule,
    SocialModule,
    EngagementModule,
    BillingModule,
    DiscoveryModule,
    CommunityModule,
    AdminModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
