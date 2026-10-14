import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { join } from 'node:path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule, ObserveInstrument } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        instrument: ObserveInstrument,
    });
    app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
    const config = app.get(ConfigService);
    app.setGlobalPrefix('api');
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.enableCors({
        origin: config.getOrThrow('FRONTEND_ORIGIN'),
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    if (config.get('TRUST_PROXY') === 'true') {
        app.getHttpAdapter().getInstance().set('trust proxy', 1);
    }
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());
    const swaggerEnabled = config.get('NODE_ENV') !== 'production' ||
        config.get('SWAGGER_ENABLED') === 'true';
    if (swaggerEnabled) {
        const document = SwaggerModule.createDocument(app, new DocumentBuilder()
            .setTitle('PoetMatrix API')
            .setDescription('Versioned API for PoetMatrix')
            .setVersion('1.0')
            .addBearerAuth()
            .build());
        SwaggerModule.setup('docs', app, document);
    }
    await app.listen(config.getOrThrow('PORT'));
}
await bootstrap();
//# sourceMappingURL=main.js.map