import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAuthAndContent1760400000000 implements MigrationInterface {
  name = 'InitAuthAndContent1760400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" character varying(320) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" character varying(32) NOT NULL DEFAULT 'reader',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "users_role_check" CHECK ("role" IN ('reader', 'writer', 'superAdmin'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_email"
      ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(64) NOT NULL,
        "family_id" uuid NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "replaced_by_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_refresh_tokens_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_refresh_tokens_token_hash"
      ON "refresh_tokens" ("token_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_user_id"
      ON "refresh_tokens" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_family_id"
      ON "refresh_tokens" ("family_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(64) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "used_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_password_reset_tokens_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_password_reset_tokens_token_hash"
      ON "password_reset_tokens" ("token_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_password_reset_tokens_user_id"
      ON "password_reset_tokens" ("user_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" character varying NOT NULL,
        "genre" character varying NOT NULL,
        "save_as" character varying NOT NULL,
        "writings" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "contents"
      ADD COLUMN IF NOT EXISTS "author_id" uuid
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_contents_author'
        ) THEN
          ALTER TABLE "contents"
            ADD CONSTRAINT "FK_contents_author"
            FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
      END $$
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contents_author_id"
      ON "contents" ("author_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contents_save_as"
      ON "contents" ("save_as")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contents" DROP CONSTRAINT IF EXISTS "FK_contents_author"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_contents_author_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_contents_save_as"
    `);
    await queryRunner.query(`
      ALTER TABLE "contents" DROP COLUMN IF EXISTS "author_id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
