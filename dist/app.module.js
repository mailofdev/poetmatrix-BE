var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentModule } from './content/content.module.js';
export const { ObserveModule, ObserveInstrument } = createObserveModule();
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ObserveModule.forRoot({
                appKey: 'YOUR_APP_KEY',
                appSecret: 'YOUR_APP_SECRET',
                serviceId: 'poetmatrix-be',
            }),
            ConfigModule.forRoot({
                isGlobal: true,
            }),
            TypeOrmModule.forRootAsync({
                inject: [ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST'),
                    port: Number(config.get('DB_PORT') ?? 5432),
                    username: config.get('DB_USERNAME'),
                    password: config.get('DB_PASSWORD'),
                    database: config.get('DB_NAME'),
                    autoLoadEntities: true,
                    synchronize: true,
                }),
            }),
            ContentModule,
        ],
        controllers: [AppController],
        providers: [AppService],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map