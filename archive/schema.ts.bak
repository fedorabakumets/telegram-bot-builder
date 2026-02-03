import { pgTable, foreignKey, serial, integer, text, timestamp, bigint, jsonb, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const botInstances = pgTable("bot_instances", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	tokenId: integer("token_id").notNull(),
	status: text().notNull(),
	token: text().notNull(),
	processId: text("process_id"),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow(),
	stoppedAt: timestamp("stopped_at", { mode: 'string' }),
	errorMessage: text("error_message"),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [botProjects.id],
			name: "bot_instances_project_id_bot_projects_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tokenId],
			foreignColumns: [botTokens.id],
			name: "bot_instances_token_id_bot_tokens_id_fk"
		}).onDelete("cascade"),
]);

export const botTokens = pgTable("bot_tokens", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ownerId: bigint("owner_id", { mode: "number" }),
	name: text().notNull(),
	token: text().notNull(),
	isDefault: integer("is_default").default(0),
	isActive: integer("is_active").default(1),
	description: text(),
	botFirstName: text("bot_first_name"),
	botUsername: text("bot_username"),
	botDescription: text("bot_description"),
	botShortDescription: text("bot_short_description"),
	botPhotoUrl: text("bot_photo_url"),
	botCanJoinGroups: integer("bot_can_join_groups"),
	botCanReadAllGroupMessages: integer("bot_can_read_all_group_messages"),
	botSupportsInlineQueries: integer("bot_supports_inline_queries"),
	botHasMainWebApp: integer("bot_has_main_web_app"),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	trackExecutionTime: integer("track_execution_time").default(0),
	totalExecutionSeconds: integer("total_execution_seconds").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [botProjects.id],
			name: "bot_tokens_project_id_bot_projects_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [telegramUsers.id],
			name: "bot_tokens_owner_id_telegram_users_id_fk"
		}).onDelete("cascade"),
]);

export const botTemplates = pgTable("bot_templates", {
	id: serial().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ownerId: bigint("owner_id", { mode: "number" }),
	name: text().notNull(),
	description: text(),
	data: jsonb().notNull(),
	category: text().default('custom'),
	tags: text().array(),
	isPublic: integer("is_public").default(0),
	difficulty: text().default('easy'),
	authorId: text("author_id"),
	authorName: text("author_name"),
	useCount: integer("use_count").default(0).notNull(),
	rating: integer().default(0).notNull(),
	ratingCount: integer("rating_count").default(0).notNull(),
	featured: integer().default(0).notNull(),
	version: text().default('1.0.0'),
	previewImage: text("preview_image"),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	downloadCount: integer("download_count").default(0).notNull(),
	likeCount: integer("like_count").default(0).notNull(),
	bookmarkCount: integer("bookmark_count").default(0).notNull(),
	viewCount: integer("view_count").default(0).notNull(),
	language: text().default('ru'),
	requiresToken: integer("requires_token").default(0).notNull(),
	complexity: integer().default(1).notNull(),
	estimatedTime: integer("estimated_time").default(5).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [telegramUsers.id],
			name: "bot_templates_owner_id_telegram_users_id_fk"
		}).onDelete("cascade"),
]);

export const botMessages = pgTable("bot_messages", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	userId: text("user_id").notNull(),
	messageType: text("message_type").notNull(),
	messageText: text("message_text"),
	messageData: jsonb("message_data"),
	nodeId: text("node_id"),
	primaryMediaId: integer("primary_media_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [botProjects.id],
			name: "bot_messages_project_id_bot_projects_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.primaryMediaId],
			foreignColumns: [mediaFiles.id],
			name: "bot_messages_primary_media_id_media_files_id_fk"
		}).onDelete("set null"),
]);

export const botMessageMedia = pgTable("bot_message_media", {
	id: serial().primaryKey().notNull(),
	messageId: integer("message_id").notNull(),
	mediaFileId: integer("media_file_id").notNull(),
	mediaKind: text("media_kind").notNull(),
	orderIndex: integer("order_index").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [botMessages.id],
			name: "bot_message_media_message_id_bot_messages_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.mediaFileId],
			foreignColumns: [mediaFiles.id],
			name: "bot_message_media_media_file_id_media_files_id_fk"
		}).onDelete("cascade"),
]);

export const botUsers = pgTable("bot_users", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).primaryKey().notNull(),
	username: text(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	registeredAt: timestamp("registered_at", { mode: 'string' }).defaultNow(),
	lastInteraction: timestamp("last_interaction", { mode: 'string' }).defaultNow(),
	interactionCount: integer("interaction_count").default(0),
	userData: jsonb("user_data").default({}),
	isActive: integer("is_active").default(1),
});

export const botProjects = pgTable("bot_projects", {
	id: serial().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ownerId: bigint("owner_id", { mode: "number" }),
	name: text().notNull(),
	description: text(),
	data: jsonb().notNull(),
	botToken: text("bot_token"),
	userDatabaseEnabled: integer("user_database_enabled").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [telegramUsers.id],
			name: "bot_projects_owner_id_telegram_users_id_fk"
		}).onDelete("cascade"),
]);

export const telegramUsers = pgTable("telegram_users", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name"),
	username: text(),
	photoUrl: text("photo_url"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	authDate: bigint("auth_date", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const groupMembers = pgTable("group_members", {
	id: serial().primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
	username: text(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	status: text().default('member'),
	isBot: integer("is_bot").default(0),
	adminRights: jsonb("admin_rights").default({}),
	customTitle: text("custom_title"),
	restrictions: jsonb().default({}),
	restrictedUntil: timestamp("restricted_until", { mode: 'string' }),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
	lastSeen: timestamp("last_seen", { mode: 'string' }),
	messageCount: integer("message_count").default(0),
	isActive: integer("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [botGroups.id],
			name: "group_members_group_id_bot_groups_id_fk"
		}).onDelete("cascade"),
]);

export const userBotData = pgTable("user_bot_data", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	userId: text("user_id").notNull(),
	userName: text("user_name"),
	firstName: text("first_name"),
	lastName: text("last_name"),
	languageCode: text("language_code"),
	isBot: integer("is_bot").default(0),
	isPremium: integer("is_premium").default(0),
	lastInteraction: timestamp("last_interaction", { mode: 'string' }).defaultNow(),
	interactionCount: integer("interaction_count").default(0),
	userData: jsonb("user_data").default({}),
	currentState: text("current_state"),
	preferences: jsonb().default({}),
	commandsUsed: jsonb("commands_used").default({}),
	sessionsCount: integer("sessions_count").default(1),
	totalMessagesSent: integer("total_messages_sent").default(0),
	totalMessagesReceived: integer("total_messages_received").default(0),
	deviceInfo: text("device_info"),
	locationData: jsonb("location_data"),
	contactData: jsonb("contact_data"),
	isBlocked: integer("is_blocked").default(0),
	isActive: integer("is_active").default(1),
	tags: text().array().default([""]),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [botProjects.id],
			name: "user_bot_data_project_id_bot_projects_id_fk"
		}).onDelete("cascade"),
]);

export const userTelegramSettings = pgTable("user_telegram_settings", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	apiId: text("api_id"),
	apiHash: text("api_hash"),
	phoneNumber: text("phone_number"),
	sessionString: text("session_string"),
	isActive: integer("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("user_telegram_settings_user_id_unique").on(table.userId),
]);

export const botGroups = pgTable("bot_groups", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	groupId: text("group_id"),
	name: text().notNull(),
	url: text().notNull(),
	isAdmin: integer("is_admin").default(0),
	memberCount: integer("member_count"),
	isActive: integer("is_active").default(1),
	description: text(),
	settings: jsonb().default({}),
	avatarUrl: text("avatar_url"),
	chatType: text("chat_type").default('group'),
	inviteLink: text("invite_link"),
	adminRights: jsonb("admin_rights").default({"can_change_info":false,"can_manage_chat":false,"can_invite_users":false,"can_pin_messages":false,"can_delete_messages":false,"can_promote_members":false,"can_restrict_members":false,"can_manage_video_chats":false}),
	messagesCount: integer("messages_count").default(0),
	activeUsers: integer("active_users").default(0),
	lastActivity: timestamp("last_activity", { mode: 'string' }),
	isPublic: integer("is_public").default(0),
	language: text().default('ru'),
	timezone: text(),
	tags: text().array().default([""]),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [botProjects.id],
			name: "bot_groups_project_id_bot_projects_id_fk"
		}).onDelete("cascade"),
]);

export const mediaFiles = pgTable("media_files", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	fileName: text("file_name").notNull(),
	fileType: text("file_type").notNull(),
	filePath: text("file_path").notNull(),
	fileSize: integer("file_size").notNull(),
	mimeType: text("mime_type").notNull(),
	url: text().notNull(),
	description: text(),
	tags: text().array().default([""]),
	isPublic: integer("is_public").default(0),
	usageCount: integer("usage_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [botProjects.id],
			name: "media_files_project_id_bot_projects_id_fk"
		}).onDelete("cascade"),
]);
