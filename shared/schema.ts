import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const botProjects = pgTable("bot_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  data: jsonb("data").notNull(),
  botToken: text("bot_token"), // Сохраненный токен бота
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const botInstances = pgTable("bot_instances", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => botProjects.id).notNull(),
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
  lastUsedAt: timestamp("last_used_at"), // Время последнего использования
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
  // Сохраненные данные из user-input узлов
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

export const insertBotProjectSchema = createInsertSchema(botProjects).pick({
  name: true,
  description: true,
  data: true,
  botToken: true,
}).extend({
  botToken: z.string().nullish(),
});

export const insertBotInstanceSchema = createInsertSchema(botInstances).pick({
  projectId: true,
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
}).extend({
  name: z.string().min(1, "Имя токена обязательно"),
  token: z.string().min(1, "Токен обязателен"),
  isDefault: z.number().min(0).max(1).default(0),
  isActive: z.number().min(0).max(1).default(1),
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

// Bot structure schemas
export const buttonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.enum(['goto', 'command', 'url', 'contact', 'location']),
  target: z.string().optional(),
  url: z.string().optional(),
  requestContact: z.boolean().optional(),
  requestLocation: z.boolean().optional(),
});

export const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(['start', 'message', 'photo', 'video', 'audio', 'document', 'keyboard', 'condition', 'input', 'command', 'sticker', 'voice', 'animation', 'location', 'contact', 'poll', 'dice', 'user-input']),
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
    duration: z.number().optional(),
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
      keyboardType: z.enum(['reply', 'inline', 'none']).default('none'), // Тип клавиатуры для условного сообщения
      buttons: z.array(buttonSchema).default([]), // Кнопки для условного сообщения
      priority: z.number().default(0) // Приоритет проверки (чем больше, тем выше приоритет)
    })).default([]), // Массив условных сообщений
    fallbackMessage: z.string().optional(), // Сообщение по умолчанию, если ни одно условие не выполнено
    saveToDatabase: z.boolean().default(false), // Сохранять ли в базу данных
    allowSkip: z.boolean().default(false), // Разрешить пропуск ввода
    
    // Универсальные настройки сбора ввода для всех типов узлов
    collectUserInput: z.boolean().default(false), // Включить сбор пользовательского ввода
    inputTargetNodeId: z.string().optional(), // ID узла, к которому переходить после сбора ввода
    inputButtonType: z.enum(['inline', 'reply']).default('inline'), // Тип кнопок для ответов
    minLength: z.number().optional(), // Минимальная длина текста
    maxLength: z.number().optional(), // Максимальная длина текста
    placeholder: z.string().optional(), // Подсказка для ввода
    defaultValue: z.string().optional() // Значение по умолчанию
  }),
});

export const connectionSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export const botDataSchema = z.object({
  nodes: z.array(nodeSchema),
  connections: z.array(connectionSchema),
});

export type Button = z.infer<typeof buttonSchema>;
export type Node = z.infer<typeof nodeSchema>;
export type Connection = z.infer<typeof connectionSchema>;
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
