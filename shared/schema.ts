import { pgTable, text, serial, integer, jsonb, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const botProjects = pgTable("bot_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  data: jsonb("data").notNull(),
  botToken: text("bot_token"), // Сохраненный токен бота
  userDatabaseEnabled: integer("user_database_enabled").default(1), // 0 = выключена, 1 = включена
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// MIGRATION REQUIRED: После изменения этой схемы необходимо применить миграцию к базе данных!
// Выполните вручную: ALTER TABLE bot_instances DROP CONSTRAINT bot_instances_project_id_bot_projects_id_fk; 
// ALTER TABLE bot_instances ADD CONSTRAINT bot_instances_project_id_bot_projects_id_fk FOREIGN KEY (project_id) REFERENCES bot_projects(id) ON DELETE CASCADE;
// ИЛИ пересоздайте базу данных (с потерей данных).
export const botInstances = pgTable("bot_instances", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  tokenId: integer("token_id").references(() => botTokens.id, { onDelete: "cascade" }).notNull(),
  status: text("status").notNull(), // "running", "stopped", "error"
  token: text("token").notNull(),
  processId: text("process_id"),
  startedAt: timestamp("started_at").defaultNow(),
  stoppedAt: timestamp("stopped_at"),
  errorMessage: text("error_message"),
});

export const botTemplates = pgTable("bot_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  data: jsonb("data").notNull(),
  category: text("category").default("custom"), // "official", "community", "custom", "business", "entertainment", "education", "utility", "games"
  tags: text("tags").array(),
  isPublic: integer("is_public").default(0), // 0 = private, 1 = public
  difficulty: text("difficulty").default("easy"), // "easy", "medium", "hard"
  authorId: text("author_id"), // ID автора шаблона
  authorName: text("author_name"), // Имя автора
  useCount: integer("use_count").notNull().default(0), // Количество использований
  rating: integer("rating").notNull().default(0), // Рейтинг от 1 до 5
  ratingCount: integer("rating_count").notNull().default(0), // Количество оценок
  featured: integer("featured").notNull().default(0), // 0 = не рекомендуемый, 1 = рекомендуемый
  version: text("version").default("1.0.0"), // Версия шаблона
  previewImage: text("preview_image"), // URL изображения для предварительного просмотра
  lastUsedAt: timestamp("last_used_at"), // Время последнего использования
  downloadCount: integer("download_count").notNull().default(0), // Количество скачиваний
  likeCount: integer("like_count").notNull().default(0), // Количество лайков
  bookmarkCount: integer("bookmark_count").notNull().default(0), // Количество закладок
  viewCount: integer("view_count").notNull().default(0), // Количество просмотров
  language: text("language").default("ru"), // Язык шаблона
  requiresToken: integer("requires_token").notNull().default(0), // Требует ли бот токен
  complexity: integer("complexity").notNull().default(1), // Сложность от 1 до 10
  estimatedTime: integer("estimated_time").notNull().default(5), // Примерное время настройки в минутах
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const botTokens = pgTable("bot_tokens", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // Пользовательское имя для токена
  token: text("token").notNull(), // Сам токен
  isDefault: integer("is_default").default(0), // 0 = нет, 1 = да (токен по умолчанию)
  isActive: integer("is_active").default(1), // 0 = неактивен, 1 = активен
  description: text("description"), // Описание токена
  // Информация о боте из Telegram API
  botFirstName: text("bot_first_name"), // Имя бота
  botUsername: text("bot_username"), // @username бота
  botDescription: text("bot_description"), // Полное описание бота
  botShortDescription: text("bot_short_description"), // Короткое описание бота
  botPhotoUrl: text("bot_photo_url"), // URL аватарки бота
  botCanJoinGroups: integer("bot_can_join_groups"), // Может ли бот присоединяться к группам
  botCanReadAllGroupMessages: integer("bot_can_read_all_group_messages"), // Может ли читать все сообщения в группах
  botSupportsInlineQueries: integer("bot_supports_inline_queries"), // Поддерживает ли инлайн запросы
  botHasMainWebApp: integer("bot_has_main_web_app"), // Есть ли главное веб-приложение
  lastUsedAt: timestamp("last_used_at"), // Время последнего использования
  // Отслеживание времени выполнения
  trackExecutionTime: integer("track_execution_time").default(0), // 0 = выключено, 1 = включено
  totalExecutionSeconds: integer("total_execution_seconds").default(0), // Общее время выполнения в секундах
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  fileName: text("file_name").notNull(), // Оригинальное имя файла
  fileType: text("file_type").notNull(), // photo, video, audio, document
  filePath: text("file_path").notNull(), // Путь к файлу на сервере
  fileSize: integer("file_size").notNull(), // Размер файла в байтах
  mimeType: text("mime_type").notNull(), // MIME тип файла
  url: text("url").notNull(), // URL для доступа к файлу
  description: text("description"), // Описание файла
  tags: text("tags").array().default([]), // Теги для поиска
  isPublic: integer("is_public").default(0), // 0 = приватный, 1 = публичный
  usageCount: integer("usage_count").default(0), // Количество использований
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userBotData = pgTable("user_bot_data", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").notNull(), // Telegram user ID
  userName: text("user_name"), // Имя пользователя в Telegram
  firstName: text("first_name"), // Имя пользователя
  lastName: text("last_name"), // Фамилия пользователя
  languageCode: text("language_code"), // Код языка пользователя
  isBot: integer("is_bot").default(0), // 0 = человек, 1 = бот
  isPremium: integer("is_premium").default(0), // 0 = обычный, 1 = премиум
  // Данные взаимодействий
  lastInteraction: timestamp("last_interaction").defaultNow(),
  interactionCount: integer("interaction_count").default(0),
  // Сохраненные данные из узлов сбора ввода
  userData: jsonb("user_data").default({}), // Пользовательские данные (ответы на вопросы, формы и т.д.)
  // Настройки и состояние
  currentState: text("current_state"), // Текущее состояние в диалоге с ботом
  preferences: jsonb("preferences").default({}), // Пользовательские настройки
  // Статистика
  commandsUsed: jsonb("commands_used").default({}), // Статистика использования команд
  sessionsCount: integer("sessions_count").default(1), // Количество сессий
  totalMessagesSent: integer("total_messages_sent").default(0), // Общее количество отправленных сообщений
  totalMessagesReceived: integer("total_messages_received").default(0), // Общее количество полученных сообщений
  // Метаданные
  deviceInfo: text("device_info"), // Информация об устройстве
  locationData: jsonb("location_data"), // Данные геолокации (если предоставлены)
  contactData: jsonb("contact_data"), // Контактные данные (если предоставлены)
  isBlocked: integer("is_blocked").default(0), // 0 = не заблокирован, 1 = заблокирован
  isActive: integer("is_active").default(1), // 0 = неактивен, 1 = активен
  tags: text("tags").array().default([]), // Теги для категоризации пользователей
  notes: text("notes"), // Заметки администратора
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const botUsers = pgTable("bot_users", {
  userId: bigint("user_id", { mode: "number" }).primaryKey(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  registeredAt: timestamp("registered_at").defaultNow(),
  lastInteraction: timestamp("last_interaction").defaultNow(),
  interactionCount: integer("interaction_count").default(0),
  userData: jsonb("user_data").default({}),
  isActive: integer("is_active").default(1),
});

export const botGroups = pgTable("bot_groups", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  groupId: text("group_id"), // Telegram group ID
  name: text("name").notNull(), // Отображаемое название группы
  url: text("url").notNull(), // Ссылка на группу
  isAdmin: integer("is_admin").default(0), // 0 = участник, 1 = администратор
  memberCount: integer("member_count"), // Количество участников
  isActive: integer("is_active").default(1), // 0 = неактивная, 1 = активная
  description: text("description"), // Описание группы
  settings: jsonb("settings").default({}), // Настройки группы
  // Расширенные поля для управления группами
  avatarUrl: text("avatar_url"), // URL аватарки группы
  chatType: text("chat_type").default("group"), // "group", "supergroup", "channel"
  inviteLink: text("invite_link"), // Пригласительная ссылка
  // Права администратора бота в группе
  adminRights: jsonb("admin_rights").default({
    can_manage_chat: false,
    can_change_info: false,
    can_delete_messages: false,
    can_invite_users: false,
    can_restrict_members: false,
    can_pin_messages: false,
    can_promote_members: false,
    can_manage_video_chats: false
  }),
  // Статистика группы
  messagesCount: integer("messages_count").default(0),
  activeUsers: integer("active_users").default(0),
  lastActivity: timestamp("last_activity"),
  // Дополнительные настройки
  isPublic: integer("is_public").default(0), // 0 = частная, 1 = публичная
  language: text("language").default("ru"), // Основной язык группы
  timezone: text("timezone"), // Часовой пояс группы
  tags: text("tags").array().default([]), // Теги для категоризации
  notes: text("notes"), // Заметки администратора
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблица участников групп
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => botGroups.id, { onDelete: "cascade" }).notNull(),
  userId: bigint("user_id", { mode: "number" }).notNull(), // Telegram user ID
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  status: text("status").default("member"), // "creator", "administrator", "member", "restricted", "left", "kicked"
  isBot: integer("is_bot").default(0),
  // Права администратора (если пользователь админ)
  adminRights: jsonb("admin_rights").default({}),
  customTitle: text("custom_title"), // Кастомный титул администратора
  // Ограничения (если пользователь ограничен)
  restrictions: jsonb("restrictions").default({}),
  restrictedUntil: timestamp("restricted_until"),
  // Метаданные
  joinedAt: timestamp("joined_at").defaultNow(),
  lastSeen: timestamp("last_seen"),
  messageCount: integer("message_count").default(0),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблица пользовательских настроек для Telegram Client API
export const userTelegramSettings = pgTable("user_telegram_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // Уникальный ID пользователя (например, email или внутренний ID)
  apiId: text("api_id"), // Telegram API ID
  apiHash: text("api_hash"), // Telegram API Hash
  phoneNumber: text("phone_number"), // Номер телефона для авторизации
  sessionString: text("session_string"), // Сохраненная сессия
  isActive: integer("is_active").default(1), // 0 = неактивен, 1 = активен
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблица истории сообщений между ботом и пользователями
export const botMessages = pgTable("bot_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").notNull(), // Telegram user ID
  messageType: text("message_type").notNull(), // "user" или "bot"
  messageText: text("message_text"), // Текст сообщения
  messageData: jsonb("message_data"), // Дополнительные данные (медиа, кнопки и т.д.)
  nodeId: text("node_id"), // ID узла бота, который отправил сообщение
  primaryMediaId: integer("primary_media_id").references(() => mediaFiles.id, { onDelete: "set null" }), // Основное медиа (фото/видео) для быстрого доступа
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица связи сообщений с медиафайлами (для множественных медиа)
export const botMessageMedia = pgTable("bot_message_media", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => botMessages.id, { onDelete: "cascade" }).notNull(),
  mediaFileId: integer("media_file_id").references(() => mediaFiles.id, { onDelete: "cascade" }).notNull(),
  mediaKind: text("media_kind").notNull(), // "photo", "video", "audio", "document"
  orderIndex: integer("order_index").default(0), // Порядок для множественных медиа
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBotProjectSchema = createInsertSchema(botProjects).pick({
  name: true,
  description: true,
  data: true,
  botToken: true,
  userDatabaseEnabled: true,
}).extend({
  botToken: z.string().nullish(),
  userDatabaseEnabled: z.number().min(0).max(1).default(1),
});

export const insertBotInstanceSchema = createInsertSchema(botInstances).pick({
  projectId: true,
  tokenId: true,
  status: true,
  token: true,
  processId: true,
  errorMessage: true,
  startedAt: true,
  stoppedAt: true,
});

export const insertBotTemplateSchema = createInsertSchema(botTemplates).pick({
  name: true,
  description: true,
  data: true,
  category: true,
  tags: true,
  isPublic: true,
  difficulty: true,
  authorId: true,
  authorName: true,
  version: true,
  previewImage: true,
  featured: true,
  language: true,
  requiresToken: true,
  complexity: true,
  estimatedTime: true,
}).extend({
  category: z.enum(["custom", "business", "entertainment", "education", "utility", "games", "official", "community"]).default("custom"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  language: z.enum(["ru", "en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"]).default("ru"),
  complexity: z.number().min(1).max(10).default(1),
  estimatedTime: z.number().min(1).max(120).default(5),
  rating: z.number().min(1).max(5).optional(),
});

export const insertBotTokenSchema = createInsertSchema(botTokens).pick({
  projectId: true,
  name: true,
  token: true,
  isDefault: true,
  isActive: true,
  description: true,
  botFirstName: true,
  botUsername: true,
  botDescription: true,
  botShortDescription: true,
  botPhotoUrl: true,
  botCanJoinGroups: true,
  botCanReadAllGroupMessages: true,
  botSupportsInlineQueries: true,
  botHasMainWebApp: true,
  trackExecutionTime: true,
  totalExecutionSeconds: true,
}).extend({
  name: z.string().min(1, "Имя токена обязательно"),
  token: z.string().min(1, "Токен обязателен"),
  isDefault: z.number().min(0).max(1).default(0),
  isActive: z.number().min(0).max(1).default(1),
  botCanJoinGroups: z.number().min(0).max(1).optional(),
  botCanReadAllGroupMessages: z.number().min(0).max(1).optional(),
  botSupportsInlineQueries: z.number().min(0).max(1).optional(),
  botHasMainWebApp: z.number().min(0).max(1).optional(),
  trackExecutionTime: z.number().min(0).max(1).default(0),
  totalExecutionSeconds: z.number().min(0).default(0),
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).pick({
  projectId: true,
  fileName: true,
  fileType: true,
  filePath: true,
  fileSize: true,
  mimeType: true,
  url: true,
  description: true,
  tags: true,
  isPublic: true,
}).extend({
  fileName: z.string().min(1, "Имя файла обязательно"),
  fileType: z.enum(["photo", "video", "audio", "document"]),
  filePath: z.string().min(1, "Путь к файлу обязателен"),
  fileSize: z.number().min(1, "Размер файла должен быть больше 0"),
  mimeType: z.string().min(1, "MIME тип обязателен"),
  url: z.string().url("Некорректный URL"),
  tags: z.array(z.string()).default([]),
  isPublic: z.number().min(0).max(1).default(0),
});

export const insertUserBotDataSchema = createInsertSchema(userBotData).pick({
  projectId: true,
  userId: true,
  userName: true,
  firstName: true,
  lastName: true,
  languageCode: true,
  isBot: true,
  isPremium: true,
  interactionCount: true,
  userData: true,
  currentState: true,
  preferences: true,
  commandsUsed: true,
  sessionsCount: true,
  totalMessagesSent: true,
  totalMessagesReceived: true,
  deviceInfo: true,
  locationData: true,
  contactData: true,
  isBlocked: true,
  isActive: true,
  tags: true,
  notes: true,
}).extend({
  userId: z.string().min(1, "ID пользователя обязателен"),
  userData: z.record(z.any()).default({}),
  preferences: z.record(z.any()).default({}),
  commandsUsed: z.record(z.any()).default({}),
  tags: z.array(z.string()).default([]),
  isBot: z.number().min(0).max(1).default(0),
  isPremium: z.number().min(0).max(1).default(0),
  isBlocked: z.number().min(0).max(1).default(0),
  isActive: z.number().min(0).max(1).default(1),
  sessionsCount: z.number().min(1).default(1),
  totalMessagesSent: z.number().min(0).default(0),
  totalMessagesReceived: z.number().min(0).default(0),
});

export const insertBotUserSchema = createInsertSchema(botUsers).pick({
  userId: true,
  username: true,
  firstName: true,
  lastName: true,
  interactionCount: true,
  userData: true,
  isActive: true,
}).extend({
  userId: z.number().positive("ID пользователя должен быть положительным числом"),
  userData: z.record(z.any()).default({}),
  isActive: z.number().min(0).max(1).default(1),
  interactionCount: z.number().min(0).default(0),
});

export const insertBotGroupSchema = createInsertSchema(botGroups).pick({
  projectId: true,
  groupId: true,
  name: true,
  url: true,
  isAdmin: true,
  memberCount: true,
  isActive: true,
  description: true,
  settings: true,
  avatarUrl: true,
  chatType: true,
  inviteLink: true,
  adminRights: true,
  messagesCount: true,
  activeUsers: true,
  lastActivity: true,
  isPublic: true,
  language: true,
  timezone: true,
  tags: true,
  notes: true,
}).extend({
  name: z.string().min(1, "Название группы обязательно"),
  url: z.string().optional().default(""), // Ссылка может быть пустой для числовых ID групп
  isAdmin: z.number().min(0).max(1).default(0),
  isActive: z.number().min(0).max(1).default(1),
  isPublic: z.number().min(0).max(1).default(0),
  settings: z.record(z.any()).default({}),
  adminRights: z.record(z.any()).default({
    can_manage_chat: false,
    can_change_info: false,
    can_delete_messages: false,
    can_invite_users: false,
    can_restrict_members: false,
    can_pin_messages: false,
    can_promote_members: false,
    can_manage_video_chats: false
  }),
  language: z.enum(["ru", "en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"]).default("ru"),
  chatType: z.enum(["group", "supergroup", "channel"]).default("group"),
  tags: z.array(z.string()).default([]),
  messagesCount: z.number().min(0).default(0),
  activeUsers: z.number().min(0).default(0),
});

// Схема для участников групп
export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
  username: true,
  firstName: true,
  lastName: true,
  status: true,
  isBot: true,
  adminRights: true,
  customTitle: true,
  restrictions: true,
  restrictedUntil: true,
  joinedAt: true,
  lastSeen: true,
  messageCount: true,
  isActive: true,
}).extend({
  userId: z.number().positive("ID пользователя должен быть положительным числом"),
  status: z.enum(["creator", "administrator", "member", "restricted", "left", "kicked"]).default("member"),
  isBot: z.number().min(0).max(1).default(0),
  isActive: z.number().min(0).max(1).default(1),
  adminRights: z.record(z.any()).default({}),
  restrictions: z.record(z.any()).default({}),
  messageCount: z.number().min(0).default(0),
});

// Схема для пользовательских настроек Telegram API
export const insertUserTelegramSettingsSchema = createInsertSchema(userTelegramSettings).pick({
  userId: true,
  apiId: true,
  apiHash: true,
  phoneNumber: true,
  sessionString: true,
  isActive: true,
}).extend({
  userId: z.string().min(1, "ID пользователя обязателен"),
  apiId: z.string().min(1, "API ID обязателен"),
  apiHash: z.string().min(1, "API Hash обязателен"),
  phoneNumber: z.string().optional(),
  isActive: z.number().min(0).max(1).default(1),
});

// Схема для сообщений бота
export const insertBotMessageSchema = createInsertSchema(botMessages).pick({
  projectId: true,
  userId: true,
  messageType: true,
  messageText: true,
  messageData: true,
  nodeId: true,
  primaryMediaId: true,
}).extend({
  projectId: z.number().positive("ID проекта должен быть положительным числом"),
  userId: z.string().min(1, "ID пользователя обязателен"),
  messageType: z.enum(["user", "bot"]),
  messageText: z.string().optional(),
  messageData: z.record(z.any()).optional(),
  nodeId: z.string().nullish(),
  primaryMediaId: z.number().positive().optional(),
});

// Схема для связи сообщений с медиафайлами
export const insertBotMessageMediaSchema = createInsertSchema(botMessageMedia).pick({
  messageId: true,
  mediaFileId: true,
  mediaKind: true,
  orderIndex: true,
}).extend({
  messageId: z.number().positive("ID сообщения должен быть положительным числом"),
  mediaFileId: z.number().positive("ID медиафайла должен быть положительным числом"),
  mediaKind: z.enum(["photo", "video", "audio", "document"]),
  orderIndex: z.number().min(0).default(0),
});

// Схема для оценки шаблона
export const rateTemplateSchema = z.object({
  templateId: z.number(),
  rating: z.number().min(1).max(5),
});

export type InsertBotProject = z.infer<typeof insertBotProjectSchema>;
export type BotProject = typeof botProjects.$inferSelect;
export type InsertBotInstance = z.infer<typeof insertBotInstanceSchema>;
export type BotInstance = typeof botInstances.$inferSelect;
export type InsertBotTemplate = z.infer<typeof insertBotTemplateSchema>;
export type BotTemplate = typeof botTemplates.$inferSelect;
export type InsertBotToken = z.infer<typeof insertBotTokenSchema>;
export type BotToken = typeof botTokens.$inferSelect;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertUserBotData = z.infer<typeof insertUserBotDataSchema>;
export type UserBotData = typeof userBotData.$inferSelect;
export type InsertBotUser = z.infer<typeof insertBotUserSchema>;
export type BotUser = typeof botUsers.$inferSelect;
export type InsertBotGroup = z.infer<typeof insertBotGroupSchema>;
export type BotGroup = typeof botGroups.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertUserTelegramSettings = z.infer<typeof insertUserTelegramSettingsSchema>;
export type UserTelegramSettings = typeof userTelegramSettings.$inferSelect;
export type InsertBotMessage = z.infer<typeof insertBotMessageSchema>;
export type BotMessage = typeof botMessages.$inferSelect;
export type InsertBotMessageMedia = z.infer<typeof insertBotMessageMediaSchema>;
export type BotMessageMedia = typeof botMessageMedia.$inferSelect;

// Bot structure schemas
export const buttonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.enum(['goto', 'command', 'url', 'contact', 'location', 'selection']),
  target: z.string().optional(),
  url: z.string().optional(),
  requestContact: z.boolean().optional(),
  requestLocation: z.boolean().optional(),
  buttonType: z.enum(['normal', 'option', 'complete']).default('normal'),
  skipDataCollection: z.boolean().default(false), // Отключить сбор ответов для этой кнопки
  hideAfterClick: z.boolean().default(false), // Скрыть кнопку после использования
});

export const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(['start', 'message', 'command', 'sticker', 'voice', 'animation', 'location', 'contact', 'pin_message', 'unpin_message', 'delete_message', 'ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user', 'promote_user', 'demote_user', 'admin_rights']),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    command: z.string().optional(),
    description: z.string().optional(),
    messageText: z.string().optional(),
    imageUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    audioUrl: z.string().optional(),
    documentUrl: z.string().optional(),
    documentName: z.string().optional(),
    mediaCaption: z.string().optional(),
    keyboardType: z.enum(['reply', 'inline', 'none']).default('none'),
    buttons: z.array(buttonSchema).default([]),
    oneTimeKeyboard: z.boolean().default(false),
    resizeKeyboard: z.boolean().default(true),
    markdown: z.boolean().default(false),
    formatMode: z.enum(['html', 'markdown', 'none']).default('none'),
    // Синонимы для команд - текстовые сообщения, которые будут вызывать ту же функцию
    synonyms: z.array(z.string()).default([]),
    // Дополнительные настройки безопасности
    isPrivateOnly: z.boolean().default(false),
    adminOnly: z.boolean().default(false),
    requiresAuth: z.boolean().default(false),
    showInMenu: z.boolean().default(true),
    // Настройки команд
    commandTimeout: z.number().optional(), // Время ожидания выполнения команды в секундах
    cooldownTime: z.number().optional(), // Время перезарядки команды в секундах
    maxUsagesPerDay: z.number().optional(), // Максимальное количество использований в день
    enableStatistics: z.boolean().default(true), // Включить сбор статистики
    customParameters: z.array(z.string()).default([]), // Дополнительные параметры команды
    // Поля для управления контентом в группах
    targetMessageId: z.string().optional(), // ID сообщения для закрепления/удаления
    messageIdSource: z.enum(['manual', 'variable', 'last_message']).default('last_message'), // Источник ID сообщения
    variableName: z.string().optional(), // Имя переменной с ID сообщения
    disableNotification: z.boolean().default(false), // Отключить уведомления
    // Поля для управления пользователями в группах
    targetUserId: z.string().optional(), // ID пользователя для модерации
    userIdSource: z.enum(['manual', 'variable', 'last_message']).default('last_message'), // Источник ID пользователя
    userVariableName: z.string().optional(), // Имя переменной с ID пользователя
    targetGroupId: z.string().optional(), // ID группы для отправки сообщений
    // Дополнительные поля для новых типов узлов
    stickerUrl: z.string().optional(),
    stickerFileId: z.string().optional(),
    voiceUrl: z.string().optional(),
    animationUrl: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    title: z.string().optional(),
    address: z.string().optional(),
    foursquareId: z.string().optional(),
    foursquareType: z.string().optional(),
    // Поддержка различных картографических сервисов
    mapService: z.enum(['yandex', 'google', '2gis', 'custom']).default('custom'),
    yandexMapUrl: z.string().optional(),
    googleMapUrl: z.string().optional(),
    gisMapUrl: z.string().optional(), // 2ГИС
    mapZoom: z.number().min(1).max(20).default(15),
    showDirections: z.boolean().default(false),
    generateMapPreview: z.boolean().default(true),
    phoneNumber: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    userId: z.number().optional(),
    vcard: z.string().optional(),
    question: z.string().optional(),
    options: z.array(z.string()).default([]),
    allowsMultipleAnswers: z.boolean().default(false),
    anonymousVoting: z.boolean().default(true),
    emoji: z.string().optional(),
    mediaDuration: z.number().optional(), // Длительность медиа-файла в секундах
    width: z.number().optional(),
    height: z.number().optional(),
    performer: z.string().optional(),
    fileSize: z.number().optional(),
    filename: z.string().optional(),
    // Настройки для сбора пользовательского ввода
    inputType: z.enum(['text', 'number', 'email', 'phone', 'photo', 'video', 'audio', 'document', 'location', 'contact', 'any']).default('text'),
    responseType: z.enum(['text', 'buttons']).default('text'), // Тип ответа: текстовый ввод или кнопки
    responseOptions: z.array(z.object({
      id: z.string(),
      text: z.string(),
      value: z.string().optional(),
      action: z.enum(['goto', 'command', 'url']).default('goto'),
      target: z.string().optional(),
      url: z.string().optional()
    })).default([]), // Варианты ответов для кнопок
    allowMultipleSelection: z.boolean().default(false), // Разрешить множественный выбор
    multiSelectVariable: z.string().optional(), // Имя переменной для сохранения множественного выбора
    continueButtonText: z.string().optional(), // Текст кнопки завершения выбора
    continueButtonTarget: z.string().optional(), // Узел для перехода после завершения выбора
    inputVariable: z.string().optional(), // Имя переменной для сохранения ответа
    inputPrompt: z.string().optional(), // Текст запроса ввода
    inputValidation: z.string().optional(), // Правило валидации (regex или описание)
    inputRequired: z.boolean().default(true), // Обязательность ввода
    inputTimeout: z.number().optional(), // Таймаут ожидания ввода в секундах
    inputRetryMessage: z.string().optional(), // Сообщение при неверном вводе
    inputSuccessMessage: z.string().optional(), // Сообщение при успешном вводе
    // Условные сообщения на основе пользовательских данных
    enableConditionalMessages: z.boolean().default(false), // Включить условные сообщения
    conditionalMessages: z.array(z.object({
      id: z.string(),
      condition: z.enum(['user_data_exists', 'user_data_equals', 'user_data_not_exists', 'user_data_contains', 'first_time', 'returning_user']).default('user_data_exists'), // Тип условия
      variableName: z.string().optional(), // Имя переменной для проверки (для обратной совместимости)
      variableNames: z.array(z.string()).default([]), // Массив имен переменных для проверки нескольких вопросов
      logicOperator: z.enum(['AND', 'OR']).default('AND'), // Логический оператор для проверки нескольких переменных
      expectedValue: z.string().optional(), // Ожидаемое значение для сравнения
      messageText: z.string(), // Текст сообщения для этого условия
      formatMode: z.enum(['text', 'markdown', 'html']).default('text'), // Режим форматирования текста условного сообщения
      keyboardType: z.enum(['reply', 'inline', 'none']).default('none'), // Тип клавиатуры для условного сообщения
      buttons: z.array(buttonSchema).default([]), // Кнопки для условного сообщения
      resizeKeyboard: z.boolean().default(true).optional(), // Автоматически подбирать размер клавиатуры
      oneTimeKeyboard: z.boolean().default(false).optional(), // Скрыть клавиатуру после использования
      waitForTextInput: z.boolean().default(false), // Ожидание текстового ввода после показа сообщения
      textInputVariable: z.string().optional(), // Переменная для сохранения текстового ввода
      nextNodeAfterInput: z.string().optional(), // ID узла, к которому перейти после получения ввода
      priority: z.number().default(0) // Приоритет проверки (чем больше, тем выше приоритет)
    })).default([]), // Массив условных сообщений
    fallbackMessage: z.string().optional(), // Сообщение по умолчанию, если ни одно условие не выполнено
    saveToDatabase: z.boolean().default(false), // Сохранять ли в базу данных
    allowSkip: z.boolean().default(false), // Разрешить пропуск ввода
    
    // Универсальные настройки сбора ввода для всех типов узлов
    collectUserInput: z.boolean().default(false), // Включить сбор пользовательского ввода
    inputTargetNodeId: z.string().optional(), // ID узла, к которому переходить после сбора ввода
    inputButtonType: z.enum(['inline', 'reply']).default('inline'), // Тип кнопок для ответов
    
    // Автопереход - отправка сообщения и автоматический переход к следующему узлу без ожидания ввода
    enableAutoTransition: z.boolean().default(false), // Включить автопереход
    autoTransitionTo: z.string().optional(), // ID узла для автоматического перехода после отправки сообщения
    minLength: z.number().optional(), // Минимальная длина текста
    maxLength: z.number().optional(), // Максимальная длина текста
    placeholder: z.string().optional(), // Подсказка для ввода
    defaultValue: z.string().optional(), // Значение по умолчанию
    
    
    // Настройки пользовательских действий
    enableUserActions: z.boolean().default(false), // Включить пользовательские действия
    actionTrigger: z.enum(['join', 'leave', 'message', 'button_click', 'custom']).optional(), // Триггер действия
    triggerText: z.string().optional(), // Текст триггера
    userActionType: z.enum(['message', 'command', 'button', 'media']).optional(), // Тип пользовательского действия
    actionTag: z.string().optional(), // Тег действия
    actionMessage: z.string().optional(), // Сообщение действия
    silentAction: z.boolean().default(false), // Беззвучное действие
    
    // Дополнительные поля для различных типов узлов
    mimeType: z.string().optional(),
    stickerSetName: z.string().optional(),
    fileName: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    enableTextInput: z.boolean().optional(),
    enablePhotoInput: z.boolean().optional(), // Включить ввод фото
    enableVideoInput: z.boolean().optional(), // Включить ввод видео
    enableAudioInput: z.boolean().optional(), // Включить ввод аудио
    enableDocumentInput: z.boolean().optional(), // Включить ввод документа
    photoInputVariable: z.string().optional(), // Переменная для сохранения file_id фото
    videoInputVariable: z.string().optional(), // Переменная для сохранения file_id видео
    audioInputVariable: z.string().optional(), // Переменная для сохранения file_id аудио
    documentInputVariable: z.string().optional(), // Переменная для сохранения file_id документа
    name: z.string().optional(),
    label: z.string().optional(),
    checkmarkSymbol: z.string().optional(),
    multiSelectCheckmark: z.string().optional(),
    
    // Поля для управления пользователями (ID определяется автоматически из контекста)
    duration: z.number().optional(), // Длительность действия в секундах
    muteDuration: z.number().optional(), // Длительность действия (для mute) в секундах
    reason: z.string().optional(), // Причина действия (бан, мут и т.д.)
    // Права для promote/demote
    canChangeInfo: z.boolean().default(false), // Может изменять информацию о группе
    canDeleteMessages: z.boolean().default(false), // Может удалять сообщения
    canBanUsers: z.boolean().default(false), // Может банить пользователей
    canInviteUsers: z.boolean().default(false), // Может приглашать пользователей
    canPinMessages: z.boolean().default(false), // Может закреплять сообщения
    canAddAdmins: z.boolean().default(false), // Может добавлять администраторов
    canRestrictMembers: z.boolean().default(false), // Может ограничивать участников
    canPromoteMembers: z.boolean().default(false), // Может повышать участников
    canManageVideoChats: z.boolean().default(false), // Может управлять видеочатами
    canManageTopics: z.boolean().default(false), // Может управлять темами (для форумов)
    isAnonymous: z.boolean().default(false), // Анонимные права администратора
    // Ограничения для restrict пользователей
    canSendMessages: z.boolean().default(true), // Может отправлять сообщения
    canSendMediaMessages: z.boolean().default(true), // Может отправлять медиа
    canSendPolls: z.boolean().default(true), // Может отправлять опросы
    canSendOtherMessages: z.boolean().default(true), // Может отправлять другие сообщения
    canAddWebPagePreviews: z.boolean().default(true), // Может добавлять превью веб-страниц
    canChangeGroupInfo: z.boolean().default(true), // Может изменять информацию о группе
    canInviteUsers2: z.boolean().default(true), // Может приглашать пользователей (дубликат для restrict)
    canPinMessages2: z.boolean().default(true), // Может закреплять сообщения (дубликат для restrict)
    untilDate: z.number().optional(), // Дата окончания ограничения (Unix timestamp)
    
    // Поля для узла admin_rights - управление правами администратора (в соответствии с Telegram Bot API)
    adminTargetUserId: z.string().optional(), // ID пользователя для изменения прав
    adminUserIdSource: z.enum(['manual', 'variable', 'last_message']).default('last_message'), // Источник ID пользователя
    adminUserVariableName: z.string().optional(), // Имя переменной с ID пользователя
    // Права администратора согласно Telegram Bot API (promoteChatMember)
    can_manage_chat: z.boolean().default(false), // Может управлять чатом
    can_post_messages: z.boolean().default(false), // Может публиковать сообщения (только каналы)
    can_edit_messages: z.boolean().default(false), // Может редактировать сообщения (только каналы)
    can_delete_messages: z.boolean().default(false), // Может удалять сообщения
    can_post_stories: z.boolean().default(false), // Может публиковать истории
    can_edit_stories: z.boolean().default(false), // Может редактировать истории
    can_delete_stories: z.boolean().default(false), // Может удалять истории
    can_manage_video_chats: z.boolean().default(false), // Может управлять видеочатами
    can_restrict_members: z.boolean().default(false), // Может ограничивать участников
    can_promote_members: z.boolean().default(false), // Может повышать участников
    can_change_info: z.boolean().default(false), // Может изменять информацию чата
    can_invite_users: z.boolean().default(false), // Может приглашать пользователей
    can_pin_messages: z.boolean().default(false), // Может закреплять сообщения
    can_manage_topics: z.boolean().default(false), // Может управлять темами (только супергруппы)
    is_anonymous: z.boolean().default(false), // Может быть анонимным
    // Связка с конкретным чатом или группой
    adminChatId: z.string().optional(), // ID чата для применения прав
    adminChatIdSource: z.enum(['manual', 'variable', 'current_chat']).default('current_chat'), // Источник ID чата
    adminChatVariableName: z.string().optional(), // Имя переменной с ID чата
    
    // Прикрепленные медиапеременные (для отправки медиафайлов)
    attachedMedia: z.array(z.string()).default([]) // Список имен медиапеременных для прикрепления к сообщению
  }),
});

export const connectionSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  // Поддержка межлистовых соединений
  sourceSheetId: z.string().optional(), // ID листа источника (если не указан, то текущий лист)
  targetSheetId: z.string().optional(), // ID листа назначения (если не указан, то текущий лист)
  isInterSheet: z.boolean().default(false), // Флаг межлистового соединения
  // Поддержка автоматически сгенерированных соединений для autoTransitionTo
  isAutoGenerated: z.boolean().default(false), // Флаг автоматически созданного соединения
});

// Схема для состояния вида листа (позиция и масштаб)
export const sheetViewStateSchema = z.object({
  pan: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
  }).default({ x: 0, y: 0 }),
  zoom: z.number().default(100),
});

// Схема для отдельного листа холста
export const canvasSheetSchema = z.object({
  id: z.string(),
  name: z.string(),
  nodes: z.array(nodeSchema).default([]),
  connections: z.array(connectionSchema).default([]),
  viewState: sheetViewStateSchema.default({ pan: { x: 0, y: 0 }, zoom: 100 }),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Обновленная схема данных бота с поддержкой листов
export const botDataWithSheetsSchema = z.object({
  sheets: z.array(canvasSheetSchema).default([]),
  activeSheetId: z.string().optional(),
  // Версия структуры данных для миграции
  version: z.number().default(2),
});

// Старая схема для обратной совместимости
export const botDataSchema = z.object({
  nodes: z.array(nodeSchema),
  connections: z.array(connectionSchema),
});

export type Button = z.infer<typeof buttonSchema>;
export type Node = z.infer<typeof nodeSchema>;
export type Connection = z.infer<typeof connectionSchema>;
export type SheetViewState = z.infer<typeof sheetViewStateSchema>;
export type CanvasSheet = z.infer<typeof canvasSheetSchema>;
export type BotDataWithSheets = z.infer<typeof botDataWithSheetsSchema>;
export type BotData = z.infer<typeof botDataSchema>;

// Component definition for drag and drop
export interface ComponentDefinition {
  id: string;
  type: Node['type'];
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultData?: any;
  [key: string]: any; // Allow additional properties for compatibility
}

// Schema for sending message to user from admin panel
export const sendMessageSchema = z.object({
  messageText: z.string().min(1, "Message text is required").max(4096, "Message text is too long"),
});

export type SendMessage = z.infer<typeof sendMessageSchema>;

// Telegram authenticated users table
export const telegramUsers = pgTable("telegram_users", {
  id: bigint("id", { mode: "number" }).primaryKey(), // Telegram user ID
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  username: text("username"),
  photoUrl: text("photo_url"),
  authDate: bigint("auth_date", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type TelegramUserDB = typeof telegramUsers.$inferSelect;
export const insertTelegramUserSchema = createInsertSchema(telegramUsers).omit({ createdAt: true, updatedAt: true });
export type InsertTelegramUser = z.infer<typeof insertTelegramUserSchema>;
