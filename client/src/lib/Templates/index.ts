/**
 * Templates Module - Система шаблонов для генерации кода ботов
 * 
 * Экспортирует все шаблоны и интерфейсы для переиспользования
 */

// Экспорт основных шаблонов
export {
  PythonTemplates,
  pythonTemplates,
  type IPythonTemplates
} from './PythonTemplates';

export {
  BotStructureTemplate,
  botStructureTemplate,
  type IBotStructureTemplate
} from './BotStructureTemplate';

// Импорты для создания объекта templates
import { pythonTemplates } from './PythonTemplates';
import { botStructureTemplate } from './BotStructureTemplate';

// Удобные re-exports для быстрого доступа
export const templates = {
  python: pythonTemplates,
  structure: botStructureTemplate
};

/**
 * Утилитарные функции для работы с шаблонами
 */
export class TemplateUtils {
  /**
   * Заменить плейсхолдеры в шаблоне
   */
  static replacePlaceholders(template: string, replacements: Record<string, string>): string {
    let result = template;
    
    for (const [placeholder, replacement] of Object.entries(replacements)) {
      const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
      result = result.replace(regex, replacement);
    }
    
    return result;
  }
  
  /**
   * Очистить все кэши шаблонов
   */
  static clearAllCaches(): void {
    pythonTemplates.clearCache();
  }
  
  /**
   * Получить информацию о размерах кэшей
   */
  static getCacheInfo(): { python: number } {
    return {
      python: pythonTemplates.getCacheSize()
    };
  }
  
  /**
   * Валидировать шаблон на наличие обязательных плейсхолдеров
   */
  static validateTemplate(template: string, requiredPlaceholders: string[]): string[] {
    const missing: string[] = [];
    
    for (const placeholder of requiredPlaceholders) {
      const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
      if (!regex.test(template)) {
        missing.push(placeholder);
      }
    }
    
    return missing;
  }
  
  /**
   * Извлечь все плейсхолдеры из шаблона
   */
  static extractPlaceholders(template: string): string[] {
    const regex = /\{([^}]+)\}/g;
    const placeholders: string[] = [];
    let match;
    
    while ((match = regex.exec(template)) !== null) {
      if (!placeholders.includes(match[1])) {
        placeholders.push(match[1]);
      }
    }
    
    return placeholders;
  }
}