import { pgTable, text, serial, integer, jsonb, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Таблица аутентифицированных пользователей Telegram
 */
export const telegramUsers = pgTable("telegram_users", {
  /** Уникальный идентификатор пользователя в Telegram */
  id: bigint("id", { mode: "number" }).primaryKey(),
  /** Имя пользователя */
  firstName: text("first_name").notNull(),
  /** Фамилия пользователя */
  lastName: text("last_name"),
  /** Имя пользователя в Telegram (username) */
  username: text("username"),
  /** URL фотографии пользователя */
  photoUrl: text("photo_url"),
  /** Дата аутентификации */
  authDate: bigint("auth_date", { mode: "number" }),
  /** Дата создания записи */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления записи */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Таблица проектов ботов
 */
export const botProjects = pgTable("bot_projects", {
  /** Уникальный идентификатор проекта */
  id: serial("id").primaryKey(),
  /** Идентификатор владельца проекта (ссылка на telegram_users.id) */
  ownerId: bigint("owner_id", { mode: "number" }).references(() => telegramUsers.id, { onDelete: "cascade" }),
  /** Название проекта */
  name: text("name").notNull(),
  /** Описание проекта */
  description: text("description"),
  /** JSON-данные проекта (структура узлов, соединений и т.д.) */
  data: jsonb("data").notNull(),
  /** Токен бота (сохраняется в зашифрованном виде) */
  botToken: text("bot_token"),
  /** Флаг включения пользовательской базы данных (0 = выключена, 1 = включена) */
  userDatabaseEnabled: integer("user_database_enabled").default(1),
  /** ID последней экспортированной Google Таблицы */
  lastExportedGoogleSheetId: text("last_exported_google_sheet_id"),
  /** URL последней экспортированной Google Таблицы */
  lastExportedGoogleSheetUrl: text("last_exported_google_sheet_url"),
  /** Дата последнего экспорта в Google Таблицы */
  lastExportedAt: timestamp("last_exported_at"),
  /** Дата создания проекта */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления проекта */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Таблица запущенных экземпляров ботов
 *
 * ВАЖНО: После изменения этой схемы необходимо применить миграцию к базе данных!
 * Выполните вручную: ALTER TABLE bot_instances DROP CONSTRAINT bot_instances_project_id_bot_projects_id_fk;
 * ALTER TABLE bot_instances ADD CONSTRAINT bot_instances_project_id_bot_projects_id_fk FOREIGN KEY (project_id) REFERENCES bot_projects(id) ON DELETE CASCADE;
 * ИЛИ пересоздайте базу данных (с потерей данных).
 */
export const botInstances = pgTable("bot_instances", {
  /** Уникальный идентификатор экземпляра */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор токена (ссылка на bot_tokens.id) */
  tokenId: integer("token_id").references(() => botTokens.id, { onDelete: "cascade" }).notNull(),
  /** Статус экземпляра ("running", "stopped", "error") */
  status: text("status").notNull(),
  /** Токен бота */
  token: text("token").notNull(),
  /** Идентификатор процесса (если бот запущен) */
  processId: text("process_id"),
  /** Время запуска экземпляра */
  startedAt: timestamp("started_at").defaultNow(),
  /** Время остановки экземпляра */
  stoppedAt: timestamp("stopped_at"),
  /** Сообщение об ошибке (если есть) */
  errorMessage: text("error_message"),
});

/**
 * Таблица шаблонов ботов
 */
export const botTemplates = pgTable("bot_templates", {
  /** Уникальный идентификатор шаблона */
  id: serial("id").primaryKey(),
  /** Идентификатор владельца шаблона (null для официальных шаблонов) */
  ownerId: bigint("owner_id", { mode: "number" }).references(() => telegramUsers.id, { onDelete: "cascade" }),
  /** Название шаблона */
  name: text("name").notNull(),
  /** Описание шаблона */
  description: text("description"),
  /** JSON-данные шаблона (структура узлов, соединений и т.д.) */
  data: jsonb("data").notNull(),
  /** Категория шаблона ("official", "community", "custom", "business", "entertainment", "education", "utility", "games") */
  category: text("category").default("custom"),
  /** Теги шаблона */
  tags: text("tags").array(),
  /** Флаг публичности (0 = приватный, 1 = публичный) */
  isPublic: integer("is_public").default(0),
  /** Уровень сложности ("easy", "medium", "hard") */
  difficulty: text("difficulty").default("easy"),
  /** Идентификатор автора шаблона (устаревшее, использовать ownerId) */
  authorId: text("author_id"),
  /** Имя автора шаблона */
  authorName: text("author_name"),
  /** Количество использований шаблона */
  useCount: integer("use_count").notNull().default(0),
  /** Рейтинг шаблона (от 1 до 5) */
  rating: integer("rating").notNull().default(0),
  /** Количество оценок шаблона */
  ratingCount: integer("rating_count").notNull().default(0),
  /** Флаг рекомендуемости (0 = не рекомендуемый, 1 = рекомендуемый) */
  featured: integer("featured").notNull().default(0),
  /** Версия шаблона */
  version: text("version").default("1.0.0"),
  /** URL изображения для предварительного просмотра */
  previewImage: text("preview_image"),
  /** Время последнего использования шаблона */
  lastUsedAt: timestamp("last_used_at"),
  /** Количество скачиваний шаблона */
  downloadCount: integer("download_count").notNull().default(0),
  /** Количество лайков шаблона */
  likeCount: integer("like_count").notNull().default(0),
  /** Количество закладок шаблона */
  bookmarkCount: integer("bookmark_count").notNull().default(0),
  /** Количество просмотров шаблона */
  viewCount: integer("view_count").notNull().default(0),
  /** Язык шаблона */
  language: text("language").default("ru"),
  /** Флаг требования токена (0 = не требуется, 1 = требуется) */
  requiresToken: integer("requires_token").notNull().default(0),
  /** Сложность шаблона (от 1 до 10) */
  complexity: integer("complexity").notNull().default(1),
  /** Примерное время настройки в минутах */
  estimatedTime: integer("estimated_time").notNull().default(5),
  /** Дата создания шаблона */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления шаблона */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Таблица токенов ботов
 */
export const botTokens = pgTable("bot_tokens", {
  /** Уникальный идентификатор токена */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор владельца токена (наследуется от проекта) */
  ownerId: bigint("owner_id", { mode: "number" }).references(() => telegramUsers.id, { onDelete: "cascade" }),
  /** Пользовательское имя для токена */
  name: text("name").notNull(),
  /** Токен бота (хранится в зашифрованном виде) */
  token: text("token").notNull(),
  /** Флаг токена по умолчанию (0 = нет, 1 = да) */
  isDefault: integer("is_default").default(0),
  /** Флаг активности токена (0 = неактивен, 1 = активен) */
  isActive: integer("is_active").default(1),
  /** Описание токена */
  description: text("description"),
  /** Имя бота из Telegram API */
  botFirstName: text("bot_first_name"),
  /** Имя пользователя бота (@username) из Telegram API */
  botUsername: text("bot_username"),
  /** Полное описание бота из Telegram API */
  botDescription: text("bot_description"),
  /** Короткое описание бота из Telegram API */
  botShortDescription: text("bot_short_description"),
  /** URL аватарки бота из Telegram API */
  botPhotoUrl: text("bot_photo_url"),
  /** Флаг возможности бота присоединяться к группам */
  botCanJoinGroups: integer("bot_can_join_groups"),
  /** Флаг возможности бота читать все сообщения в группах */
  botCanReadAllGroupMessages: integer("bot_can_read_all_group_messages"),
  /** Флаг поддержки инлайн-запросов ботом */
  botSupportsInlineQueries: integer("bot_supports_inline_queries"),
  /** Флаг наличия главного веб-приложения у бота */
  botHasMainWebApp: integer("bot_has_main_web_app"),
  /** Время последнего использования токена */
  lastUsedAt: timestamp("last_used_at"),
  /** Флаг отслеживания времени выполнения (0 = выключено, 1 = включено) */
  trackExecutionTime: integer("track_execution_time").default(0),
  /** Общее время выполнения в секундах */
  totalExecutionSeconds: integer("total_execution_seconds").default(0),
  /** Дата создания токена */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления токена */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Таблица медиафайлов
 */
export const mediaFiles = pgTable("media_files", {
  /** Уникальный идентификатор файла */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Оригинальное имя файла */
  fileName: text("file_name").notNull(),
  /** Тип файла ("photo", "video", "audio", "document") */
  fileType: text("file_type").notNull(),
  /** Путь к файлу на сервере */
  filePath: text("file_path").notNull(),
  /** Размер файла в байтах */
  fileSize: integer("file_size").notNull(),
  /** MIME тип файла */
  mimeType: text("mime_type").notNull(),
  /** URL для доступа к файлу */
  url: text("url").notNull(),
  /** Описание файла */
  description: text("description"),
  /** Теги для поиска */
  tags: text("tags").array().default([]),
  /** Флаг публичности (0 = приватный, 1 = публичный) */
  isPublic: integer("is_public").default(0),
  /** Количество использований файла */
  usageCount: integer("usage_count").default(0),
  /** Дата создания файла */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления файла */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Таблица пользовательских данных бота
 */
export const userBotData = pgTable("user_bot_data", {
  /** Уникальный идентификатор записи */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор пользователя в Telegram */
  userId: text("user_id").notNull(),
  /** Имя пользователя в Telegram */
  userName: text("user_name"),
  /** Имя пользователя */
  firstName: text("first_name"),
  /** Фамилия пользователя */
  lastName: text("last_name"),
  /** Код языка пользователя */
  languageCode: text("language_code"),
  /** Флаг бота (0 = человек, 1 = бот) */
  isBot: integer("is_bot").default(0),
  /** Флаг премиум-статуса (0 = обычный, 1 = премиум) */
  isPremium: integer("is_premium").default(0),
  /** Время последнего взаимодействия */
  lastInteraction: timestamp("last_interaction").defaultNow(),
  /** Количество взаимодействий */
  interactionCount: integer("interaction_count").default(0),
  /** Пользовательские данные (ответы на вопросы, формы и т.д.) */
  userData: jsonb("user_data").default({}),
  /** Текущее состояние в диалоге с ботом */
  currentState: text("current_state"),
  /** Пользовательские настройки */
  preferences: jsonb("preferences").default({}),
  /** Статистика использования команд */
  commandsUsed: jsonb("commands_used").default({}),
  /** Количество сессий */
  sessionsCount: integer("sessions_count").default(1),
  /** Общее количество отправленных сообщений */
  totalMessagesSent: integer("total_messages_sent").default(0),
  /** Общее количество полученных сообщений */
  totalMessagesReceived: integer("total_messages_received").default(0),
  /** Информация об устройстве */
  deviceInfo: text("device_info"),
  /** Данные геолокации (если предоставлены) */
  locationData: jsonb("location_data"),
  /** Контактные данные (если предоставлены) */
  contactData: jsonb("contact_data"),
  /** Флаг блокировки (0 = не заблокирован, 1 = заблокирован) */
  isBlocked: integer("is_blocked").default(0),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: integer("is_active").default(1),
  /** Теги для категоризации пользователей */
  tags: text("tags").array().default([]),
  /** Заметки администратора */
  notes: text("notes"),
  /** Дата создания записи */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления записи */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Таблица пользователей бота
 */
export const botUsers = pgTable("bot_users", {
  /** Идентификатор пользователя в Telegram */
  userId: bigint("user_id", { mode: "number" }).primaryKey(),
  /** Имя пользователя в Telegram */
  username: text("username"),
  /** Имя пользователя */
  firstName: text("first_name"),
  /** Фамилия пользователя */
  lastName: text("last_name"),
  /** Дата регистрации пользователя */
  registeredAt: timestamp("registered_at").defaultNow(),
  /** Дата последнего взаимодействия */
  lastInteraction: timestamp("last_interaction").defaultNow(),
  /** Количество взаимодействий */
  interactionCount: integer("interaction_count").default(0),
  /** Пользовательские данные */
  userData: jsonb("user_data").default({}),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: integer("is_active").default(1),
});

/**
 * Таблица групп бота
 */
export const botGroups = pgTable("bot_groups", {
  /** Уникальный идентификатор группы */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор группы в Telegram */
  groupId: text("group_id"),
  /** Отображаемое название группы */
  name: text("name").notNull(),
  /** Ссылка на группу */
  url: text("url").notNull(),
  /** Флаг администратора (0 = участник, 1 = администратор) */
  isAdmin: integer("is_admin").default(0),
  /** Количество участников */
  memberCount: integer("member_count"),
  /** Флаг активности (0 = неактивная, 1 = активная) */
  isActive: integer("is_active").default(1),
  /** Описание группы */
  description: text("description"),
  /** Настройки группы */
  settings: jsonb("settings").default({}),
  /** URL аватарки группы */
  avatarUrl: text("avatar_url"),
  /** Тип чата ("group", "supergroup", "channel") */
  chatType: text("chat_type").default("group"),
  /** Пригласительная ссылка */
  inviteLink: text("invite_link"),
  /** Права администратора бота в группе */
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
  /** Количество сообщений в группе */
  messagesCount: integer("messages_count").default(0),
  /** Количество активных пользователей */
  activeUsers: integer("active_users").default(0),
  /** Дата последней активности */
  lastActivity: timestamp("last_activity"),
  /** Флаг публичности (0 = частная, 1 = публичная) */
  isPublic: integer("is_public").default(0),
  /** Основной язык группы */
  language: text("language").default("ru"),
  /** Часовой пояс группы */
  timezone: text("timezone"),
  /** Теги для категоризации */
  tags: text("tags").array().default([]),
  /** Заметки администратора */
  notes: text("notes"),
  /** Дата создания группы */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления группы */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Таблица участников групп
 */
export const groupMembers = pgTable("group_members", {
  /** Уникальный идентификатор участника */
  id: serial("id").primaryKey(),
  /** Идентификатор группы (ссылка на bot_groups.id) */
  groupId: integer("group_id").references(() => botGroups.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор пользователя в Telegram */
  userId: bigint("user_id", { mode: "number" }).notNull(),
  /** Имя пользователя в Telegram */
  username: text("username"),
  /** Имя пользователя */
  firstName: text("first_name"),
  /** Фамилия пользователя */
  lastName: text("last_name"),
  /** Статус участника ("creator", "administrator", "member", "restricted", "left", "kicked") */
  status: text("status").default("member"),
  /** Флаг бота (0 = человек, 1 = бот) */
  isBot: integer("is_bot").default(0),
  /** Права администратора (если пользователь админ) */
  adminRights: jsonb("admin_rights").default({}),
  /** Кастомный титул администратора */
  customTitle: text("custom_title"),
  /** Ограничения (если пользователь ограничен) */
  restrictions: jsonb("restrictions").default({}),
  /** Дата окончания ограничения */
  restrictedUntil: timestamp("restricted_until"),
  /** Дата вступления в группу */
  joinedAt: timestamp("joined_at").defaultNow(),
  /** Дата последнего появления */
  lastSeen: timestamp("last_seen"),
  /** Количество сообщений участника */
  messageCount: integer("message_count").default(0),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: integer("is_active").default(1),
  /** Дата создания записи */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления записи */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Таблица пользовательских настроек для Telegram Client API
 */
export const userTelegramSettings = pgTable("user_telegram_settings", {
  /** Уникальный идентификатор настроек */
  id: serial("id").primaryKey(),
  /** Уникальный ID пользователя (например, email или внутренний ID) */
  userId: text("user_id").notNull().unique(),
  /** Telegram API ID */
  apiId: text("api_id"),
  /** Telegram API Hash */
  apiHash: text("api_hash"),
  /** Номер телефона для авторизации */
  phoneNumber: text("phone_number"),
  /** Сохраненная сессия */
  sessionString: text("session_string"),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: integer("is_active").default(1),
  /** Дата создания настроек */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления настроек */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Таблица истории сообщений между ботом и пользователями
 */
export const botMessages = pgTable("bot_messages", {
  /** Уникальный идентификатор сообщения */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор пользователя в Telegram */
  userId: text("user_id").notNull(),
  /** Тип сообщения ("user" или "bot") */
  messageType: text("message_type").notNull(),
  /** Текст сообщения */
  messageText: text("message_text"),
  /** Дополнительные данные (медиа, кнопки и т.д.) */
  messageData: jsonb("message_data"),
  /** ID узла бота, который отправил сообщение */
  nodeId: text("node_id"),
  /** ID основного медиа (фото/видео) для быстрого доступа */
  primaryMediaId: integer("primary_media_id").references(() => mediaFiles.id, { onDelete: "set null" }),
  /** Дата создания сообщения */
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Таблица связи сообщений с медиафайлами (для множественных медиа)
 */
export const botMessageMedia = pgTable("bot_message_media", {
  /** Уникальный идентификатор связи */
  id: serial("id").primaryKey(),
  /** ID сообщения (ссылка на bot_messages.id) */
  messageId: integer("message_id").references(() => botMessages.id, { onDelete: "cascade" }).notNull(),
  /** ID медиафайла (ссылка на media_files.id) */
  mediaFileId: integer("media_file_id").references(() => mediaFiles.id, { onDelete: "cascade" }).notNull(),
  /** Тип медиа ("photo", "video", "audio", "document") */
  mediaKind: text("media_kind").notNull(),
  /** Порядковый индекс для множественных медиа */
  orderIndex: integer("order_index").default(0),
  /** Дата создания связи */
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Схема для вставки данных проекта бота
 */
export const insertBotProjectSchema = z.object({
  /** Идентификатор владельца проекта */
  ownerId: z.number().nullable().optional(),
  /** Название проекта (обязательное поле) */
  name: z.string().min(1),
  /** Описание проекта */
  description: z.string().optional(),
  /** JSON-данные проекта (обязательное поле с дефолтным значением) */
  data: z.any().default({}),
  /** Токен бота */
  botToken: z.string().nullish(),
  /** Флаг включения пользовательской базы данных (0 = выключена, 1 = включена) */
  userDatabaseEnabled: z.number().min(0).max(1).default(1),
  /** Флаг необходимости перезапуска бота при обновлении (по умолчанию false) */
  restartOnUpdate: z.boolean().default(false).optional(),
});

/**
 * Схема для вставки данных экземпляра бота
 */
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

/**
 * Схема для вставки данных шаблона бота
 */
export const insertBotTemplateSchema = createInsertSchema(botTemplates).pick({
  ownerId: true,
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
  /** Идентификатор владельца шаблона */
  ownerId: z.number().nullable().optional(),
  /** Категория шаблона */
  category: z.enum(["custom", "business", "entertainment", "education", "utility", "games", "official", "community"]).default("custom"),
  /** Уровень сложности */
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  /** Язык шаблона */
  language: z.enum(["ru", "en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"]).default("ru"),
  /** Сложность шаблона (от 1 до 10) */
  complexity: z.number().min(1).max(10).default(1),
  /** Примерное время настройки в минутах */
  estimatedTime: z.number().min(1).max(120).default(5),
  /** Рейтинг шаблона (от 1 до 5) */
  rating: z.number().min(1).max(5).optional(),
});

/**
 * Схема для вставки данных токена бота
 */
export const insertBotTokenSchema = createInsertSchema(botTokens).pick({
  projectId: true,
  ownerId: true,
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
  /** Идентификатор владельца токена */
  ownerId: z.number().nullable().optional(),
  /** Название токена (обязательное поле) */
  name: z.string().min(1, "Имя токена обязательно"),
  /** Токен бота (обязательное поле) */
  token: z.string().min(1, "Токен обязателен"),
  /** Флаг токена по умолчанию (0 = нет, 1 = да) */
  isDefault: z.number().min(0).max(1).default(0),
  /** Флаг активности токена (0 = неактивен, 1 = активен) */
  isActive: z.number().min(0).max(1).default(1),
  /** Флаг возможности бота присоединяться к группам */
  botCanJoinGroups: z.number().min(0).max(1).optional(),
  /** Флаг возможности бота читать все сообщения в группах */
  botCanReadAllGroupMessages: z.number().min(0).max(1).optional(),
  /** Флаг поддержки инлайн-запросов ботом */
  botSupportsInlineQueries: z.number().min(0).max(1).optional(),
  /** Флаг наличия главного веб-приложения у бота */
  botHasMainWebApp: z.number().min(0).max(1).optional(),
  /** Флаг отслеживания времени выполнения (0 = выключено, 1 = включено) */
  trackExecutionTime: z.number().min(0).max(1).default(0),
  /** Общее время выполнения в секундах */
  totalExecutionSeconds: z.number().min(0).default(0),
});

/**
 * Схема для вставки данных медиафайла
 */
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
  /** Имя файла (обязательное поле) */
  fileName: z.string().min(1, "Имя файла обязательно"),
  /** Тип файла ("photo", "video", "audio", "document") */
  fileType: z.enum(["photo", "video", "audio", "document"]),
  /** Путь к файлу (обязательное поле) */
  filePath: z.string().min(1, "Путь к файлу обязателен"),
  /** Размер файла (обязательное поле, должен быть больше 0) */
  fileSize: z.number().min(1, "Размер файла должен быть больше 0"),
  /** MIME тип файла (обязательное поле) */
  mimeType: z.string().min(1, "MIME тип обязателен"),
  /** URL файла (обязательное поле, должен быть корректным URL) */
  url: z.string().url("Некорректный URL"),
  /** Теги файла */
  tags: z.array(z.string()).default([]),
  /** Флаг публичности (0 = приватный, 1 = публичный) */
  isPublic: z.number().min(0).max(1).default(0),
});

/**
 * Схема для вставки данных пользовательских данных бота
 */
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
  /** Идентификатор пользователя (обязательное поле) */
  userId: z.string().min(1, "ID пользователя обязателен"),
  /** Пользовательские данные */
  userData: z.record(z.any()).default({}),
  /** Пользовательские настройки */
  preferences: z.record(z.any()).default({}),
  /** Статистика использования команд */
  commandsUsed: z.record(z.any()).default({}),
  /** Теги пользователя */
  tags: z.array(z.string()).default([]),
  /** Флаг бота (0 = человек, 1 = бот) */
  isBot: z.number().min(0).max(1).default(0),
  /** Флаг премиум-статуса (0 = обычный, 1 = премиум) */
  isPremium: z.number().min(0).max(1).default(0),
  /** Флаг блокировки (0 = не заблокирован, 1 = заблокирован) */
  isBlocked: z.number().min(0).max(1).default(0),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: z.number().min(0).max(1).default(1),
  /** Количество сессий */
  sessionsCount: z.number().min(1).default(1),
  /** Общее количество отправленных сообщений */
  totalMessagesSent: z.number().min(0).default(0),
  /** Общее количество полученных сообщений */
  totalMessagesReceived: z.number().min(0).default(0),
});

/**
 * Схема для вставки данных пользователя бота
 */
export const insertBotUserSchema = createInsertSchema(botUsers).pick({
  userId: true,
  username: true,
  firstName: true,
  lastName: true,
  interactionCount: true,
  userData: true,
  isActive: true,
}).extend({
  /** Идентификатор пользователя (должен быть положительным числом) */
  userId: z.number().positive("ID пользователя должен быть положительным числом"),
  /** Пользовательские данные */
  userData: z.record(z.any()).default({}),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: z.number().min(0).max(1).default(1),
  /** Количество взаимодействий */
  interactionCount: z.number().min(0).default(0),
});

/**
 * Схема для вставки данных группы бота
 */
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
  /** Название группы (обязательное поле) */
  name: z.string().min(1, "Название группы обязательно"),
  /** Ссылка на группу (может быть пустой для числовых ID групп) */
  url: z.string().optional().default(""),
  /** Флаг администратора (0 = участник, 1 = администратор) */
  isAdmin: z.number().min(0).max(1).default(0),
  /** Флаг активности (0 = неактивная, 1 = активная) */
  isActive: z.number().min(0).max(1).default(1),
  /** Флаг публичности (0 = частная, 1 = публичная) */
  isPublic: z.number().min(0).max(1).default(0),
  /** Настройки группы */
  settings: z.record(z.any()).default({}),
  /** Права администратора */
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
  /** Язык группы */
  language: z.enum(["ru", "en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"]).default("ru"),
  /** Тип чата ("group", "supergroup", "channel") */
  chatType: z.enum(["group", "supergroup", "channel"]).default("group"),
  /** Теги группы */
  tags: z.array(z.string()).default([]),
  /** Количество сообщений в группе */
  messagesCount: z.number().min(0).default(0),
  /** Количество активных пользователей */
  activeUsers: z.number().min(0).default(0),
});

/**
 * Схема для вставки данных участника группы
 */
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
  /** Идентификатор пользователя (должен быть положительным числом) */
  userId: z.number().positive("ID пользователя должен быть положительным числом"),
  /** Статус участника ("creator", "administrator", "member", "restricted", "left", "kicked") */
  status: z.enum(["creator", "administrator", "member", "restricted", "left", "kicked"]).default("member"),
  /** Флаг бота (0 = человек, 1 = бот) */
  isBot: z.number().min(0).max(1).default(0),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: z.number().min(0).max(1).default(1),
  /** Права администратора */
  adminRights: z.record(z.any()).default({}),
  /** Ограничения участника */
  restrictions: z.record(z.any()).default({}),
  /** Количество сообщений участника */
  messageCount: z.number().min(0).default(0),
});

/**
 * Схема для вставки данных пользовательских настроек Telegram API
 */
export const insertUserTelegramSettingsSchema = createInsertSchema(userTelegramSettings).pick({
  userId: true,
  apiId: true,
  apiHash: true,
  phoneNumber: true,
  sessionString: true,
  isActive: true,
}).extend({
  /** Идентификатор пользователя (обязательное поле) */
  userId: z.string().min(1, "ID пользователя обязателен"),
  /** Telegram API ID (обязательное поле) */
  apiId: z.string().min(1, "API ID обязателен"),
  /** Telegram API Hash (обязательное поле) */
  apiHash: z.string().min(1, "API Hash обязателен"),
  /** Номер телефона для авторизации */
  phoneNumber: z.string().optional(),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: z.number().min(0).max(1).default(1),
});

/**
 * Схема для вставки данных сообщения бота
 */
export const insertBotMessageSchema = z.object({
  /** Идентификатор проекта */
  projectId: z.number(),
  /** Идентификатор пользователя в Telegram */
  userId: z.string(),
  /** Тип сообщения ("user" или "bot") */
  messageType: z.string(),
  /** Текст сообщения */
  messageText: z.string().nullable().optional(),
  /** Дополнительные данные (медиа, кнопки и т.д.) */
  messageData: z.any().nullable().optional(),
  /** ID узла бота, который отправил сообщение */
  nodeId: z.string().nullable().optional(),
  /** ID основного медиа (фото/видео) для быстрого доступа */
  primaryMediaId: z.number().nullable().optional(),
});

/**
 * Схема для вставки данных связи сообщений с медиафайлами
 */
export const insertBotMessageMediaSchema = createInsertSchema(botMessageMedia).pick({
  messageId: true,
  mediaFileId: true,
  mediaKind: true,
  orderIndex: true,
});

/**
 * Схема для оценки шаблона
 */
export const rateTemplateSchema = z.object({
  /** Идентификатор шаблона */
  templateId: z.number(),
  /** Рейтинг (от 1 до 5) */
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
  action: z.enum(['goto', 'command', 'url', 'contact', 'location', 'selection', 'default']),
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
  type: z.enum(['start', 'message', 'command', 'sticker', 'voice', 'animation', 'location', 'contact', 'pin_message', 'unpin_message', 'delete_message', 'ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user', 'promote_user', 'demote_user', 'admin_rights'
    // , 'photo', 'video', 'audio', 'document', 'keyboard', 'input', 'condition' // Закомментированные типы узлов
  ]),
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
      // Сбор ответов для условного сообщения
      collectUserInput: z.boolean().default(false), // Включить сбор ответов
      enableTextInput: z.boolean().default(false), // Принимать текстовый ввод
      enablePhotoInput: z.boolean().default(false), // Принимать фото
      enableVideoInput: z.boolean().default(false), // Принимать видео
      enableAudioInput: z.boolean().default(false), // Принимать аудио
      enableDocumentInput: z.boolean().default(false), // Принимать документ
      inputVariable: z.string().optional(), // Переменная для сохранения текста
      photoInputVariable: z.string().optional(), // Переменная для сохранения фото
      videoInputVariable: z.string().optional(), // Переменная для сохранения видео
      audioInputVariable: z.string().optional(), // Переменная для сохранения аудио
      documentInputVariable: z.string().optional(), // Переменная для сохранения документа
      waitForTextInput: z.boolean().default(false), // Ожидание текстового ввода после показа сообщения (устаревшее, используйте enableTextInput)
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
    
    // Прикрепленные медиапеременные (для отпра��ки медиафайлов)
    attachedMedia: z.array(z.string()).default([]), // Список имен медиапеременных для прикрепления к сообщению
    
    // Дополнительные поля для совместимости
    text: z.string().optional(), // Альтернативное поле для messageText
    action: z.string().optional(), // Поле для действий (poll, dice, input и т.д.)
    waitForTextInput: z.boolean().optional(), // Устаревшее поле для обратной совместимости
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
  settings: z.object({
    enableGroupHandlers: z.boolean().optional().default(false),
  }).optional(), // Make the entire settings object optional
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

export type TelegramUserDB = typeof telegramUsers.$inferSelect;
export const insertTelegramUserSchema = createInsertSchema(telegramUsers).omit({ createdAt: true, updatedAt: true });
export type InsertTelegramUser = z.infer<typeof insertTelegramUserSchema>;
