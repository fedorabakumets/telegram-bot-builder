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
  category: text("category").default("custom"), // "official", "community", "custom"
  tags: text("tags").array(),
  isPublic: integer("is_public").default(0), // 0 = private, 1 = public
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
});

export const insertBotTemplateSchema = createInsertSchema(botTemplates).pick({
  name: true,
  description: true,
  data: true,
  category: true,
  tags: true,
  isPublic: true,
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
