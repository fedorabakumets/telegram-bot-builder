import { z } from 'zod';
import { botDataSchema } from './schema.js';

// Расширенная схема для валидации структуры бота
const extendedBotDataSchema = botDataSchema.extend({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    data: z.record(z.any()),
  })).min(1, "Шаблон должен содержать хотя бы один узел"),
  connections: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().optional(),
    targetHandle: z.string().optional(),
  })),
});

// Схема для экспорта/импорта шаблона
export const templateExportSchema = z.object({
  // Основная информация о шаблоне
  name: z.string().min(1, "Название шаблона обязательно").max(100, "Название слишком длинное"),
  description: z.string().max(500, "Описание слишком длинное").optional(),
  
  // Структура бота с расширенной валидацией
  botData: extendedBotDataSchema,
  
  // Метаданные
  metadata: z.object({
    version: z.string().default("1.0.0"),
    author: z.string().max(50, "Имя автора слишком длинное").optional(),
    category: z.enum(["custom", "business", "entertainment", "education", "utility", "games", "official", "community"]).default("custom"),
    difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
    language: z.enum(["ru", "en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"]).default("ru"),
    tags: z.array(z.string().max(20, "Тег слишком длинный")).max(10, "Слишком много тегов").default([]),
    complexity: z.number().min(1).max(10).default(1),
    estimatedTime: z.number().min(1).max(480).default(5), // Увеличено до 8 часов
    requiresToken: z.boolean().default(true),
    createdAt: z.string().optional(),
    exportedAt: z.string().default(() => new Date().toISOString()),
    // Новые поля
    nodeCount: z.number().min(0).optional(),
    connectionCount: z.number().min(0).optional(),
    hasAdvancedFeatures: z.boolean().default(false),
    supportedCommands: z.array(z.string()).default([]),
    previewImage: z.string().optional(), // Base64 или URL превью
    license: z.enum(["MIT", "GPL", "Apache", "CC", "Proprietary", "Free"]).default("Free"),
    minAppVersion: z.string().default("1.0.0"),
  }),
  
  // Дополнительная информация для импорта
  exportInfo: z.object({
    exportedBy: z.string().default("Telegram Bot Builder"),
    formatVersion: z.string().default("1.1"), // Обновлена версия формата
    compatibilityNote: z.string().optional(),
    exportMethod: z.enum(["manual", "auto", "scheduled"]).default("manual"),
    fileSize: z.number().optional(),
    checksum: z.string().optional(), // Для проверки целостности
  }),
  
  // Опциональные дополнительные данные
  additionalData: z.object({
    screenshots: z.array(z.string()).default([]), // Base64 скриншоты
    documentation: z.string().optional(), // Markdown документация
    changelog: z.array(z.object({
      version: z.string(),
      date: z.string(),
      changes: z.array(z.string()),
    })).default([]),
    dependencies: z.array(z.string()).default([]),
    settings: z.record(z.any()).default({}),
  }).optional(),
});

export type TemplateExport = z.infer<typeof templateExportSchema>;

// Схема для пакетного экспорта
export const batchExportSchema = z.object({
  templates: z.array(templateExportSchema),
  batchInfo: z.object({
    name: z.string(),
    description: z.string().optional(),
    exportedAt: z.string().default(() => new Date().toISOString()),
    totalTemplates: z.number(),
    totalSize: z.number().optional(),
  }),
});

export type BatchExport = z.infer<typeof batchExportSchema>;

// Функция для анализа структуры бота
export function analyzeBotStructure(botData: any) {
  const nodes = botData?.nodes || [];
  const connections = botData?.connections || [];
  
  // Подсчет различных типов узлов
  const nodeTypes = nodes.reduce((acc: Record<string, number>, node: any) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});
  
  // Поиск команд
  const commands = nodes
    .filter((node: any) => node.type === 'command')
    .map((node: any) => node.data?.command || 'unknown')
    .filter((cmd: string) => cmd !== 'unknown');
  
  // Определение сложности
  const complexity = Math.min(10, Math.max(1, 
    nodes.length * 0.3 + 
    connections.length * 0.2 + 
    Object.keys(nodeTypes).length * 0.5
  ));
  
  // Определение продвинутых функций
  const hasAdvancedFeatures = nodes.some((node: any) => 
    ['condition', 'input', 'photo', 'file'].includes(node.type)
  );
  
  return {
    nodeCount: nodes.length,
    connectionCount: connections.length,
    nodeTypes,
    supportedCommands: commands,
    complexity: Math.round(complexity),
    hasAdvancedFeatures,
    estimatedTime: Math.max(5, Math.min(480, nodes.length * 2 + connections.length)),
  };
}

// Функция для создания экспортируемого шаблона
export function createTemplateExport(
  name: string,
  description: string,
  botData: any,
  metadata: Partial<TemplateExport['metadata']> = {},
  author?: string,
  options: {
    includeScreenshots?: boolean;
    includeDocumentation?: boolean;
    generateChecksum?: boolean;
  } = {}
): TemplateExport {
  const analysis = analyzeBotStructure(botData);
  const jsonString = JSON.stringify(botData);
  const fileSize = new Blob([jsonString]).size;
  
  // Генерация контрольной суммы если нужно
  let checksum: string | undefined;
  if (options.generateChecksum) {
    // Используем Buffer для безопасного кодирования Unicode символов
    checksum = Buffer.from(jsonString, 'utf8').toString('base64').slice(0, 16); // Простая контрольная сумма
  }
  
  const baseTemplate: TemplateExport = {
    name,
    description,
    botData,
    metadata: {
      version: "1.0.0",
      author,
      category: "custom" as const,
      difficulty: (analysis.complexity <= 3 ? "easy" : analysis.complexity <= 6 ? "medium" : "hard") as "easy" | "medium" | "hard",
      language: "ru" as const,
      tags: [],
      complexity: analysis.complexity,
      estimatedTime: analysis.estimatedTime,
      requiresToken: true,
      exportedAt: new Date().toISOString(),
      nodeCount: analysis.nodeCount,
      connectionCount: analysis.connectionCount,
      hasAdvancedFeatures: analysis.hasAdvancedFeatures,
      supportedCommands: analysis.supportedCommands,
      license: "Free" as const,
      minAppVersion: "1.0.0",
      ...metadata,
    },
    exportInfo: {
      exportedBy: "Telegram Bot Builder",
      formatVersion: "1.1",
      compatibilityNote: "Совместим с Telegram Bot Builder v1.0+",
      exportMethod: "manual" as const,
      fileSize,
      checksum,
    },
  };
  
  // Добавляем дополнительные данные если нужно
  if (options.includeScreenshots || options.includeDocumentation) {
    baseTemplate.additionalData = {
      screenshots: [],
      documentation: options.includeDocumentation ? generateBasicDocumentation(botData, analysis) : undefined,
      changelog: [{
        version: "1.0.0",
        date: new Date().toISOString().split('T')[0],
        changes: ["Создан шаблон"],
      }],
      dependencies: [],
      settings: {},
    };
  }
  
  return baseTemplate;
}

// Функция для генерации базовой документации
function generateBasicDocumentation(botData: any, analysis: any): string {
  const nodes = botData?.nodes || [];
  const commands = analysis.supportedCommands;
  
  let doc = `# Документация бота\n\n`;
  doc += `## Обзор\n`;
  doc += `- Узлов: ${analysis.nodeCount}\n`;
  doc += `- Связей: ${analysis.connectionCount}\n`;
  doc += `- Сложность: ${analysis.complexity}/10\n\n`;
  
  if (commands.length > 0) {
    doc += `## Поддерживаемые команды\n`;
    commands.forEach((cmd: string) => {
      doc += `- /${cmd}\n`;
    });
    doc += `\n`;
  }
  
  if (Object.keys(analysis.nodeTypes).length > 0) {
    doc += `## Структура\n`;
    Object.entries(analysis.nodeTypes).forEach(([type, count]) => {
      doc += `- ${type}: ${count}\n`;
    });
  }
  
  return doc;
}

// Расширенная функция для валидации импортируемого шаблона
export function validateTemplateImport(data: unknown): {
  isValid: boolean;
  template?: TemplateExport;
  errors: string[];
  warnings: string[];
} {
  try {
    const template = templateExportSchema.parse(data);
    const warnings: string[] = [];
    
    // Дополнительные проверки
    if (template.metadata.nodeCount !== template.botData.nodes.length) {
      warnings.push("Количество узлов не соответствует метаданным");
    }
    
    if (template.metadata.connectionCount !== template.botData.connections.length) {
      warnings.push("Количество связей не соответствует метаданным");
    }
    
    // Проверка версии формата
    if (template.exportInfo.formatVersion < "1.0") {
      warnings.push("Устаревший формат файла, возможны проблемы совместимости");
    }
    
    // Проверка контрольной суммы
    if (template.exportInfo.checksum) {
      const currentChecksum = Buffer.from(JSON.stringify(template.botData), 'utf8').toString('base64').slice(0, 16);
      if (currentChecksum !== template.exportInfo.checksum) {
        warnings.push("Контрольная сумма не совпадает, файл мог быть поврежден");
      }
    }
    
    return {
      isValid: true,
      template,
      errors: [],
      warnings,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return {
        isValid: false,
        errors,
        warnings: [],
      };
    }
    
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : "Неизвестная ошибка валидации"],
      warnings: [],
    };
  }
}

// Функция для создания пакетного экспорта
export function createBatchExport(
  templates: TemplateExport[],
  name: string,
  description?: string
): BatchExport {
  const totalSize = templates.reduce((sum, template) => {
    return sum + (template.exportInfo.fileSize || 0);
  }, 0);
  
  return {
    templates,
    batchInfo: {
      name,
      description,
      exportedAt: new Date().toISOString(),
      totalTemplates: templates.length,
      totalSize,
    },
  };
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
  // Принимаем как .tbb.json, так и обычные .json файлы
  const isTemplate = fileName.endsWith('.tbb.json') || fileName.endsWith('.json');
  let name = fileName;
  
  if (isTemplate) {
    // Убираем расширение
    name = fileName.replace(/\.(tbb\.)?json$/, '');
    // Убираем дату если есть
    name = name.replace(/_\d{8}$/, ''); // Формат YYYYMMDD
    name = name.replace(/_\d{4}-\d{2}-\d{2}$/, ''); // Формат YYYY-MM-DD
    // Заменяем подчеркивания на пробелы
    name = name.replace(/_/g, ' ');
  }
  
  return { name, isTemplate };
}