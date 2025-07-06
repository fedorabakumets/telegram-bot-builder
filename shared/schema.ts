import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const botProjects = pgTable("bot_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  data: jsonb("data").notNull(),
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

export const insertBotProjectSchema = createInsertSchema(botProjects).pick({
  name: true,
  description: true,
  data: true,
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

// Bot structure schemas
export const buttonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.enum(['goto', 'command', 'url']),
  target: z.string().optional(),
  url: z.string().optional(),
});

export const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(['start', 'message', 'photo', 'keyboard', 'condition', 'input', 'command']),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    command: z.string().optional(),
    description: z.string().optional(),
    messageText: z.string().optional(),
    imageUrl: z.string().optional(),
    keyboardType: z.enum(['reply', 'inline', 'none']).default('none'),
    buttons: z.array(buttonSchema).default([]),
    oneTimeKeyboard: z.boolean().default(false),
    resizeKeyboard: z.boolean().default(true),
    markdown: z.boolean().default(false),
    // Синонимы для команд - текстовые сообщения, которые будут вызывать ту же функцию
    synonyms: z.array(z.string()).default([]),
    // Дополнительные настройки безопасности
    isPrivateOnly: z.boolean().default(false),
    adminOnly: z.boolean().default(false),
    requiresAuth: z.boolean().default(false),
    showInMenu: z.boolean().default(true),
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
