import { MigrationInterface, QueryRunner } from 'typeorm';

export class Product1760500000000 implements MigrationInterface {
  name = 'Product1760500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_check"
    `);
    await queryRunner.query(`
      UPDATE "users" SET "role" = 'superadmin' WHERE "role" = 'superAdmin'
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "roles" text NOT NULL DEFAULT 'reader',
        ADD COLUMN IF NOT EXISTS "mode" character varying(16) NOT NULL DEFAULT 'reader',
        ADD COLUMN IF NOT EXISTS "plan" character varying(16) NOT NULL DEFAULT 'free',
        ADD COLUMN IF NOT EXISTS "reader_subscription" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "writer_subscription" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "display_name" character varying(120),
        ADD COLUMN IF NOT EXISTS "phone" character varying(20),
        ADD COLUMN IF NOT EXISTS "gender" character varying(40),
        ADD COLUMN IF NOT EXISTS "bio" character varying(500),
        ADD COLUMN IF NOT EXISTS "pen_name" character varying(120),
        ADD COLUMN IF NOT EXISTS "photo_path" character varying(500),
        ADD COLUMN IF NOT EXISTS "interests" text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "interests_completed" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "push_enabled" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "theme" character varying(16) NOT NULL DEFAULT 'system',
        ADD COLUMN IF NOT EXISTS "follower_count" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "following_count" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      UPDATE "users"
      SET "roles" = "role",
          "writer_subscription" = CASE WHEN "role" = 'writer' THEN true ELSE "writer_subscription" END,
          "mode" = CASE WHEN "role" = 'writer' THEN 'writer' ELSE "mode" END
      WHERE "roles" = 'reader' AND "role" <> 'reader'
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "users_role_check"
        CHECK ("role" IN ('reader', 'writer', 'admin', 'superadmin'))
    `);

    await queryRunner.query(`
      ALTER TABLE "contents"
        ADD COLUMN IF NOT EXISTS "subtitle" character varying(300) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "type" character varying(16) NOT NULL DEFAULT 'story',
        ADD COLUMN IF NOT EXISTS "article_subtype" character varying(32),
        ADD COLUMN IF NOT EXISTS "tags" text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "cover_path" character varying(500),
        ADD COLUMN IF NOT EXISTS "language" character varying(16) NOT NULL DEFAULT 'en',
        ADD COLUMN IF NOT EXISTS "visibility" character varying(16) NOT NULL DEFAULT 'private',
        ADD COLUMN IF NOT EXISTS "comments_allowed" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "boosted" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "series_title" character varying(200),
        ADD COLUMN IF NOT EXISTS "series_chapter" integer,
        ADD COLUMN IF NOT EXISTS "author_name" character varying(120) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "preview" text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "reading_minutes" integer NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "view_count" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "limit_reason" character varying(64)
    `);
    await queryRunner.query(`
      UPDATE "contents"
      SET "visibility" = 'public'
      WHERE "save_as" = 'published' AND "visibility" = 'private'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "publish_usage" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "content_id" uuid NOT NULL,
        "month_key" character varying(7) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_publish_usage_content_month" UNIQUE ("content_id", "month_key")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "search_index" (
        "content_id" uuid PRIMARY KEY,
        "title" text NOT NULL,
        "genre" character varying NOT NULL DEFAULT '',
        "author_id" uuid,
        "author_name" character varying(120) NOT NULL DEFAULT '',
        CONSTRAINT "FK_search_content" FOREIGN KEY ("content_id")
          REFERENCES "contents"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "likes" (
        "user_id" uuid NOT NULL,
        "content_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("user_id", "content_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "comments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "content_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        "body" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bookmarks" (
        "user_id" uuid NOT NULL,
        "content_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("user_id", "content_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "content_views" (
        "user_id" uuid NOT NULL,
        "content_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("user_id", "content_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reading_progress" (
        "user_id" uuid NOT NULL,
        "content_id" uuid NOT NULL,
        "percent" integer NOT NULL,
        "scroll" integer NOT NULL DEFAULT 0,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("user_id", "content_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "content_id" uuid NOT NULL,
        "reporter_id" uuid NOT NULL,
        "reason" text NOT NULL,
        "status" character varying(16) NOT NULL DEFAULT 'pending',
        "moderator_id" uuid,
        "note" text,
        "moderated_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "follows" (
        "follower_id" uuid NOT NULL,
        "following_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("follower_id", "following_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "read" boolean NOT NULL DEFAULT false,
        "message" text NOT NULL,
        "type" character varying(32) NOT NULL,
        "content_id" uuid,
        "actor_id" uuid,
        "actor_name" character varying(120),
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "device_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token" character varying(512) NOT NULL UNIQUE,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_intents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "plan" character varying(16) NOT NULL,
        "amount" integer NOT NULL,
        "order_id" character varying(64) NOT NULL UNIQUE,
        "payment_id" character varying(64) UNIQUE,
        "status" character varying(16) NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "prompts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" character varying(200) NOT NULL,
        "body" text NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "challenges" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" character varying(200) NOT NULL,
        "description" text NOT NULL,
        "target" integer NOT NULL,
        "type" character varying(32) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "month" character varying(7) NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "challenge_progress" (
        "user_id" uuid NOT NULL,
        "challenge_id" uuid NOT NULL,
        "progress" integer NOT NULL DEFAULT 0,
        PRIMARY KEY ("user_id", "challenge_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "challenge_credits" (
        "user_id" uuid NOT NULL,
        "content_id" uuid NOT NULL,
        PRIMARY KEY ("user_id", "content_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "enquiries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "email" character varying(320) NOT NULL,
        "subject" character varying(200) NOT NULL,
        "message" text NOT NULL,
        "status" character varying(16) NOT NULL DEFAULT 'open',
        "user_id" uuid,
        "ip" character varying(64),
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "activity_log" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "actor_id" uuid,
        "action" character varying(64) NOT NULL,
        "subject_type" character varying(32) NOT NULL,
        "subject_id" character varying(64),
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blocked_keywords" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "word" character varying(80) NOT NULL UNIQUE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "site_config" (
        "id" integer PRIMARY KEY DEFAULT 1,
        "hero_title" character varying(200) NOT NULL DEFAULT 'PoetMatrix',
        "hero_subtitle" character varying(400) NOT NULL DEFAULT 'A public place to discover and read literary work.',
        "about_teaser" text NOT NULL DEFAULT '',
        "policies_note" text NOT NULL DEFAULT '',
        "seo_title" character varying(200) NOT NULL DEFAULT 'PoetMatrix',
        "seo_description" character varying(300) NOT NULL DEFAULT 'Discover and read literary work.',
        "comments_globally_enabled" boolean NOT NULL DEFAULT true,
        "push_master_enabled" boolean NOT NULL DEFAULT false,
        "maintenance_mode" boolean NOT NULL DEFAULT false,
        "require_email_verification" boolean NOT NULL DEFAULT false,
        "session_timeout_minutes" integer,
        "email_notifications" boolean NOT NULL DEFAULT true,
        "role_policy_notes" text NOT NULL DEFAULT ''
      )
    `);
    await queryRunner.query(`
      INSERT INTO "site_config" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "landing_cache" (
        "id" integer PRIMARY KEY DEFAULT 1,
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "refreshed_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "landing_cache"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "site_config"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blocked_keywords"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "enquiries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "challenge_credits"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "challenge_progress"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "challenges"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prompts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_intents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "device_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "follows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reading_progress"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "content_views"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bookmarks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "likes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "search_index"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "publish_usage"`);
  }
}
