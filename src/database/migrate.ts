import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PasswordResetToken } from '../auth/password-reset-token.entity.js';
import { RefreshToken } from '../auth/refresh-token.entity.js';
import { validateEnv } from '../config/env.schema.js';
import { Content } from '../content/content.entity.js';
import { User } from '../users/user.entity.js';
import { InitAuthAndContent1760400000000 } from './migrations/1760400000000-InitAuthAndContent.js';
import { Product1760500000000 } from './migrations/1760500000000-Product.js';

const env = validateEnv(process.env as Record<string, unknown>);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [User, Content, RefreshToken, PasswordResetToken],
  migrations: [InitAuthAndContent1760400000000, Product1760500000000],
  synchronize: false,
});

const invokedDirectly = process.argv[1]?.includes('migrate');

if (invokedDirectly) {
  const revert = process.argv.includes('revert');
  await AppDataSource.initialize();
  if (revert) {
    await AppDataSource.undoLastMigration();
  } else {
    await AppDataSource.runMigrations();
  }
  await AppDataSource.destroy();
}
