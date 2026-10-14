var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
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
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.getOrThrow('DB_HOST'),
                    port: config.getOrThrow('DB_PORT'),
                    username: config.getOrThrow('DB_USERNAME'),
                    password: config.getOrThrow('DB_PASSWORD'),
                    database: config.getOrThrow('DB_NAME'),
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
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map