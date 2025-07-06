import { z } from 'zod';
import { botDataSchema } from './schema.js';

// Схема для экспорта/импорта шаблона
export const templateExportSchema = z.object({
  // Основная информация о шаблоне
  name: z.string().min(1, "Название шаблона обязательно"),
  description: z.string().optional(),
  
  // Структура бота
  botData: botDataSchema,
  
  // Метаданные
  metadata: z.object({
    version: z.string().default("1.0.0"),
    author: z.string().optional(),
    category: z.enum(["custom", "business", "entertainment", "education", "utility", "games", "official", "community"]).default("custom"),
    difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
    language: z.enum(["ru", "en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"]).default("ru"),
    tags: z.array(z.string()).default([]),
    complexity: z.number().min(1).max(10).default(1),
    estimatedTime: z.number().min(1).max(120).default(5),
    requiresToken: z.boolean().default(true),
    createdAt: z.string().optional(),
    exportedAt: z.string().default(() => new Date().toISOString()),
  }),
  
  // Дополнительная информация для импорта
  exportInfo: z.object({
    exportedBy: z.string().default("Telegram Bot Builder"),
    formatVersion: z.string().default("1.0"),
    compatibilityNote: z.string().optional(),
  }),
});

export type TemplateExport = z.infer<typeof templateExportSchema>;

// Функция для создания экспортируемого шаблона
export function createTemplateExport(
  name: string,
  description: string,
  botData: any,
  metadata: Partial<TemplateExport['metadata']> = {},
  author?: string
): TemplateExport {
  return {
    name,
    description,
    botData,
    metadata: {
      version: "1.0.0",
      author,
      category: "custom",
      difficulty: "easy",
      language: "ru",
      tags: [],
      complexity: 1,
      estimatedTime: 5,
      requiresToken: true,
      exportedAt: new Date().toISOString(),
      ...metadata,
    },
    exportInfo: {
      exportedBy: "Telegram Bot Builder",
      formatVersion: "1.0",
      compatibilityNote: "Совместим с Telegram Bot Builder v1.0+",
    },
  };
}

// Функция для валидации импортируемого шаблона
export function validateTemplateImport(data: unknown): TemplateExport {
  return templateExportSchema.parse(data);
}

// Функция для создания имени файла
export function createTemplateFileName(templateName: string): string {
  // Заменяем все символы, кроме латинских букв, цифр и дефисов
  const safeName = templateName
    .replace(/[^a-zA-Z0-9-]/g, '_') // Только латинские буквы, цифры и дефисы
    .replace(/_{2,}/g, '_') // Множественные подчеркивания в одно
    .replace(/^_+|_+$/g, '') // Убираем подчеркивания в начале и конце
    .substring(0, 30) // Ограничиваем длину
    .toLowerCase();
  
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `${safeName || 'template'}_${timestamp}.tbb.json`;
}

// Функция для парсинга имени файла шаблона
export function parseTemplateFileName(fileName: string): { name: string; isTemplate: boolean } {
  const isTemplate = fileName.endsWith('.tbb.json');
  let name = fileName;
  
  if (isTemplate) {
    name = fileName.replace('.tbb.json', '');
    // Убираем дату если есть
    name = name.replace(/_\d{4}-\d{2}-\d{2}$/, '');
    // Заменяем подчеркивания на пробелы
    name = name.replace(/_/g, ' ');
  }
  
  return { name, isTemplate };
}