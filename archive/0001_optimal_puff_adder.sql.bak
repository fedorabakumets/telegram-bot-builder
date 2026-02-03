CREATE TABLE "bot_message_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"media_file_id" integer NOT NULL,
	"media_kind" text NOT NULL,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bot_messages" (
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
--> statement-breakpoint
CREATE TABLE "telegram_users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"username" text,
	"photo_url" text,
	"auth_date" bigint,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bot_instances" DROP CONSTRAINT "bot_instances_project_id_bot_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "bot_projects" ALTER COLUMN "user_database_enabled" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "bot_projects" ADD COLUMN "owner_id" bigint;--> statement-breakpoint
ALTER TABLE "bot_templates" ADD COLUMN "owner_id" bigint;--> statement-breakpoint
ALTER TABLE "bot_tokens" ADD COLUMN "owner_id" bigint;--> statement-breakpoint
ALTER TABLE "bot_tokens" ADD COLUMN "track_execution_time" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "bot_tokens" ADD COLUMN "total_execution_seconds" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "bot_message_media" ADD CONSTRAINT "bot_message_media_message_id_bot_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."bot_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_message_media" ADD CONSTRAINT "bot_message_media_media_file_id_media_files_id_fk" FOREIGN KEY ("media_file_id") REFERENCES "public"."media_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_messages" ADD CONSTRAINT "bot_messages_project_id_bot_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."bot_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_messages" ADD CONSTRAINT "bot_messages_primary_media_id_media_files_id_fk" FOREIGN KEY ("primary_media_id") REFERENCES "public"."media_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_instances" ADD CONSTRAINT "bot_instances_project_id_bot_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."bot_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_projects" ADD CONSTRAINT "bot_projects_owner_id_telegram_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."telegram_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_templates" ADD CONSTRAINT "bot_templates_owner_id_telegram_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."telegram_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_tokens" ADD CONSTRAINT "bot_tokens_owner_id_telegram_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."telegram_users"("id") ON DELETE cascade ON UPDATE no action;