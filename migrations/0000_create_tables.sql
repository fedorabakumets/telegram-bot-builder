-- Migration: Create all tables
-- Created: 2026-02-22
-- Description: Создаёт все таблицы для бота

CREATE TABLE IF NOT EXISTS "telegram_users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"username" text,
	"photo_url" text,
	"auth_date" bigint,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "bot_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" bigint,
	"name" text NOT NULL,
	"description" text,
	"data" jsonb NOT NULL,
	"bot_token" text,
	"user_database_enabled" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_exported_google_sheet_id" text,
	"last_exported_google_sheet_url" text,
	"last_exported_at" timestamp,
	"last_exported_structure_sheet_id" text,
	"last_exported_structure_sheet_url" text,
	"last_exported_structure_at" timestamp
);

CREATE TABLE IF NOT EXISTS "bot_instances" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"token_id" integer NOT NULL,
	"status" text NOT NULL,
	"token" text NOT NULL,
	"process_id" text,
	"started_at" timestamp DEFAULT now(),
	"stopped_at" timestamp,
	"error_message" text
);

CREATE TABLE IF NOT EXISTS "bot_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"owner_id" bigint,
	"name" text NOT NULL,
	"token" text NOT NULL,
	"is_default" integer DEFAULT 0,
	"is_active" integer DEFAULT 1,
	"description" text,
	"bot_first_name" text,
	"bot_username" text,
	"bot_description" text,
	"bot_short_description" text,
	"bot_photo_url" text,
	"bot_can_join_groups" integer,
	"bot_can_read_all_group_messages" integer,
	"bot_supports_inline_queries" integer,
	"bot_has_main_web_app" integer,
	"last_used_at" timestamp,
	"track_execution_time" integer DEFAULT 0,
	"total_execution_seconds" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "bot_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" bigint,
	"name" text NOT NULL,
	"description" text,
	"data" jsonb NOT NULL,
	"category" text DEFAULT 'custom',
	"tags" text[],
	"is_public" integer DEFAULT 0,
	"difficulty" text DEFAULT 'easy',
	"author_id" text,
	"author_name" text,
	"use_count" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"featured" integer DEFAULT 0 NOT NULL,
	"version" text DEFAULT '1.0.0',
	"preview_image" text,
	"last_used_at" timestamp,
	"download_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"bookmark_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"language" text DEFAULT 'ru',
	"requires_token" integer DEFAULT 0 NOT NULL,
	"complexity" integer DEFAULT 1 NOT NULL,
	"estimated_time" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "bot_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"message_type" text NOT NULL,
	"message_text" text,
	"message_data" jsonb,
	"node_id" text,
	"primary_media_id" integer,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "bot_message_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"media_file_id" integer NOT NULL,
	"media_kind" text NOT NULL,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "bot_users" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"username" text,
	"first_name" text,
	"last_name" text,
	"registered_at" timestamp DEFAULT now(),
	"last_interaction" timestamp DEFAULT now(),
	"interaction_count" integer DEFAULT 0,
	"user_data" jsonb DEFAULT '{}'::jsonb,
	"is_active" integer DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" bigint NOT NULL,
	"username" text,
	"first_name" text,
	"last_name" text,
	"status" text DEFAULT 'member',
	"is_bot" integer DEFAULT 0,
	"admin_rights" jsonb DEFAULT '{}'::jsonb,
	"custom_title" text,
	"restrictions" jsonb DEFAULT '{}'::jsonb,
	"restricted_until" timestamp,
	"joined_at" timestamp DEFAULT now(),
	"last_seen" timestamp,
	"message_count" integer DEFAULT 0,
	"is_active" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_bot_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text,
	"first_name" text,
	"last_name" text,
	"language_code" text,
	"is_bot" integer DEFAULT 0,
	"is_premium" integer DEFAULT 0,
	"last_interaction" timestamp DEFAULT now(),
	"interaction_count" integer DEFAULT 0,
	"user_data" jsonb DEFAULT '{}'::jsonb,
	"current_state" text,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"commands_used" jsonb DEFAULT '{}'::jsonb,
	"sessions_count" integer DEFAULT 1,
	"total_messages_sent" integer DEFAULT 0,
	"total_messages_received" integer DEFAULT 0,
	"device_info" text,
	"location_data" jsonb,
	"contact_data" jsonb,
	"is_blocked" integer DEFAULT 0,
	"is_active" integer DEFAULT 1,
	"tags" text[] DEFAULT ARRAY['']::text[],
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_telegram_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"api_id" text,
	"api_hash" text,
	"phone_number" text,
	"session_string" text,
	"is_active" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_telegram_settings_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE IF NOT EXISTS "bot_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"group_id" text,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"is_admin" integer DEFAULT 0,
	"member_count" integer,
	"is_active" integer DEFAULT 1,
	"description" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"avatar_url" text,
	"chat_type" text DEFAULT 'group',
	"invite_link" text,
	"admin_rights" jsonb DEFAULT '{"can_change_info":false,"can_manage_chat":false,"can_invite_users":false,"can_pin_messages":false,"can_delete_messages":false,"can_promote_members":false,"can_restrict_members":false,"can_manage_video_chats":false}'::jsonb,
	"messages_count" integer DEFAULT 0,
	"active_users" integer DEFAULT 0,
	"last_activity" timestamp,
	"is_public" integer DEFAULT 0,
	"language" text DEFAULT 'ru',
	"timezone" text,
	"tags" text[] DEFAULT ARRAY['']::text[],
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "media_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"tags" text[] DEFAULT ARRAY['']::text[],
	"is_public" integer DEFAULT 0,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_ids" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"source" text DEFAULT 'manual',
	CONSTRAINT "user_ids_user_unique" UNIQUE("user_id")
);

CREATE INDEX IF NOT EXISTS "user_ids_user_id_idx" ON "user_ids" USING btree ("user_id");

-- Foreign keys
DO $$ BEGIN
 ALTER TABLE "bot_projects" ADD CONSTRAINT "bot_projects_owner_id_telegram_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "telegram_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bot_instances" ADD CONSTRAINT "bot_instances_project_id_bot_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "bot_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bot_instances" ADD CONSTRAINT "bot_instances_token_id_bot_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "bot_tokens"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bot_tokens" ADD CONSTRAINT "bot_tokens_project_id_bot_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "bot_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bot_tokens" ADD CONSTRAINT "bot_tokens_owner_id_telegram_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "telegram_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bot_templates" ADD CONSTRAINT "bot_templates_owner_id_telegram_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "telegram_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bot_messages" ADD CONSTRAINT "bot_messages_project_id_bot_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "bot_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bot_messages" ADD CONSTRAINT "bot_messages_primary_media_id_media_files_id_fk" FOREIGN KEY ("primary_media_id") REFERENCES "media_files"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bot_message_media" ADD CONSTRAINT "bot_message_media_message_id_bot_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "bot_messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bot_message_media" ADD CONSTRAINT "bot_message_media_media_file_id_media_files_id_fk" FOREIGN KEY ("media_file_id") REFERENCES "media_files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_bot_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "bot_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_bot_data" ADD CONSTRAINT "user_bot_data_project_id_bot_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "bot_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bot_groups" ADD CONSTRAINT "bot_groups_project_id_bot_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "bot_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "media_files" ADD CONSTRAINT "media_files_project_id_bot_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "bot_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
