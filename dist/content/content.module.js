var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from '../activity/activity.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { SocialModule } from '../social/social.module.js';
import { UsersModule } from '../users/users.module.js';
import { Content, PublishUsage, SearchIndex } from './content.entity.js';
import { ContentController } from './content.controller.js';
import { ContentService } from './content.service.js';
let ContentModule = class ContentModule {
};
ContentModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forFeature([Content, PublishUsage, SearchIndex]),
            AuthModule,
            UsersModule,
            ActivityModule,
            PlatformModule,
            SocialModule,
        ],
        controllers: [ContentController],
        providers: [ContentService],
        exports: [ContentService],
    })
], ContentModule);
export { ContentModule };
//# sourceMappingURL=content.module.js.map