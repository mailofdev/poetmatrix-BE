import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthService } from '../src/auth/auth.service.js';

describe('Auth validation (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { register: () => Promise.resolve({ id: '1' }) },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects registration that tries to claim superAdmin', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'writer@example.com',
        password: 'longpassword1',
        role: 'superAdmin',
      })
      .expect(400);
  });

  it('rejects an empty registration body', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({})
      .expect(400);
  });
});
