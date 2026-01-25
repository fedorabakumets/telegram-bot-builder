#!/usr/bin/env node

/**
 * Скрипт для исправления импортов в извлеченных модулях
 * Автоматически добавляет недостающие импорты и экспорты
 */

const fs = require('fs');
const path = require('path');

class ImportFixer {
  constructor() {
    this.modulesDir = 'client/src/lib/bot-generator';
    this.fixes = 0;
  }

  // Исправляем импорты в logic/variables.ts
  fixVariablesModule() {
    console.log('🔧 Исправляем logic/variables.ts...');
    
    const filePath = path.join(this.modulesDir, 'logic/variables.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Добавляем экспорт для generateUniversalVariableReplacement
    content = content.replace(
      'function generateUniversalVariableReplacement(',
      'export function generateUniversalVariableReplacement('
    );
    
    // Добавляем экспорт для generateVariableReplacement
    content = content.replace(
      'function generateVariableReplacement(',
      'export function generateVariableReplacement('
    );
    
    // Добавляем экспорт для generateWaitingStateCode
    content = content.replace(
      'function generateWaitingStateCode(',
      'export function generateWaitingStateCode('
    );
    
    fs.writeFileSync(filePath, content);
    console.log('  ✅ Добавлены экспорты функций');
    this.fixes++;
  }

  // Исправляем импорты в core/keyboard-generator.ts
  fixKeyboardGeneratorModule() {
    console.log('🔧 Исправляем core/keyboard-generator.ts...');
    
    const filePath = path.join(this.modulesDir, 'core/keyboard-generator.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Добавляем недостающие импорты в начало файла
    const newImports = `import { Node } from '@shared/schema';
import { z } from 'zod';
import { buttonSchema } from '@shared/schema';
import { toPythonBoolean, escapeForPython } from '../utils/string-utils';
import { generateButtonText, calculateOptimalColumns } from '../keyboards/keyboard-utils';
import { generateUniversalVariableReplacement, generateWaitingStateCode } from '../logic/variables';

type Button = z.infer<typeof buttonSchema>;

// Global variable for logging state
let globalLoggingEnabled = false;

// Utility function to check if debug logging is enabled
const isLoggingEnabled = (): boolean => {
  if (globalLoggingEnabled) return true;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('botcraft-generator-logs') === 'true';
  }
  return false;
};

// Функция для генерации логики условных сообщений (временная заглушка)
function generateConditionalMessageLogic(conditionalMessages: any[], indentLevel: string, nodeData?: any): string {
  // TODO: Импортировать из logic/conditional когда будет создан
  return '    # Условная логика будет добавлена позже\\n';
}

`;
    
    // Заменяем существующие импорты
    content = content.replace(/^\/\*\*[\s\S]*?\*\/\n\n/, newImports);
    
    // Добавляем экспорт для generateKeyboard
    content = content.replace(
      'function generateKeyboard(',
      'export function generateKeyboard('
    );
    
    fs.writeFileSync(filePath, content);
    console.log('  ✅ Добавлены импорты и экспорты');
    this.fixes++;
  }

  // Исправляем импорты в handlers/message-handlers.ts
  fixMessageHandlersModule() {
    console.log('🔧 Исправляем handlers/message-handlers.ts...');
    
    const filePath = path.join(this.modulesDir, 'handlers/message-handlers.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Заменяем проблемные импорты
    content = content.replace(
      "import { generateConditionalMessageLogic } from '../logic/conditional';",
      "// import { generateConditionalMessageLogic } from '../logic/conditional'; // TODO: Создать модуль"
    );
    
    content = content.replace(
      "import { generateKeyboard } from '../core/keyboard-generator';",
      "import { generateKeyboard } from '../core/keyboard-generator';"
    );
    
    // Добавляем недостающие импорты
    const additionalImports = `import { generateButtonText } from '../keyboards/keyboard-utils';
import { stripHtmlTags, getParseMode } from '../utils/string-utils';
import { generateUniversalVariableReplacement } from '../logic/variables';

// Временная заглушка для generateConditionalMessageLogic
function generateConditionalMessageLogic(conditionalMessages: any[], indentLevel: string, nodeData?: any): string {
  return '    # Условная логика будет добавлена позже\\n';
}

`;
    
    // Добавляем импорты после существующих
    content = content.replace(
      /^(import.*\n)+/m,
      (match) => match + additionalImports
    );
    
    // Добавляем экспорты
    content = content.replace(/function (generate\w+Handler)/g, 'export function $1');
    content = content.replace(/function (generateSynonymHandler)/g, 'export function $1');
    
    fs.writeFileSync(filePath, content);
    console.log('  ✅ Исправлены импорты и добавлены экспорты');
    this.fixes++;
  }

  // Исправляем импорты в handlers/media-handlers.ts
  fixMediaHandlersModule() {
    console.log('🔧 Исправляем handlers/media-handlers.ts...');
    
    const filePath = path.join(this.modulesDir, 'handlers/media-handlers.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Добавляем недостающие импорты
    const additionalImports = `import { generateButtonText } from '../keyboards/keyboard-utils';

`;
    
    content = content.replace(
      /^(import.*\n)+/m,
      (match) => match + additionalImports
    );
    
    // Исправляем импорт generateUniversalVariableReplacement
    content = content.replace(
      'import { generateUniversalVariableReplacement } from \'../logic/variables\';',
      'import { generateUniversalVariableReplacement } from \'../logic/variables\';'
    );
    
    // Добавляем экспорты
    content = content.replace(/function (generate\w+Handler)/g, 'export function $1');
    
    fs.writeFileSync(filePath, content);
    console.log('  ✅ Исправлены импорты и добавлены экспорты');
    this.fixes++;
  }

  // Исправляем импорты в handlers/admin-handlers.ts
  fixAdminHandlersModule() {
    console.log('🔧 Исправляем handlers/admin-handlers.ts...');
    
    const filePath = path.join(this.modulesDir, 'handlers/admin-handlers.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Добавляем недостающие импорты
    const additionalImports = `import { createSafeFunctionName } from '../utils/node-utils';

`;
    
    content = content.replace(
      /^(import.*\n)+/m,
      (match) => match + additionalImports
    );
    
    // Добавляем экспорты
    content = content.replace(/function (generate\w+Handler)/g, 'export function $1');
    
    fs.writeFileSync(filePath, content);
    console.log('  ✅ Исправлены импорты и добавлены экспорты');
    this.fixes++;
  }

  // Исправляем импорты в handlers/user-management.ts
  fixUserManagementModule() {
    console.log('🔧 Исправляем handlers/user-management.ts...');
    
    const filePath = path.join(this.modulesDir, 'handlers/user-management.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Добавляем экспорты
    content = content.replace(/function (generate\w+Handler)/g, 'export function $1');
    
    fs.writeFileSync(filePath, content);
    console.log('  ✅ Добавлены экспорты');
    this.fixes++;
  }

  // Исправляем импорты в handlers/content-management.ts
  fixContentManagementModule() {
    console.log('🔧 Исправляем handlers/content-management.ts...');
    
    const filePath = path.join(this.modulesDir, 'handlers/content-management.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Добавляем экспорты
    content = content.replace(/function (generate\w+Handler)/g, 'export function $1');
    
    fs.writeFileSync(filePath, content);
    console.log('  ✅ Добавлены экспорты');
    this.fixes++;
  }

  // Исправляем импорты в generators/documentation.ts
  fixDocumentationModule() {
    console.log('🔧 Исправляем generators/documentation.ts...');
    
    const filePath = path.join(this.modulesDir, 'generators/documentation.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Добавляем недостающие импорты
    const additionalImports = `
// Временная заглушка для generateBotFatherCommands
function generateBotFatherCommands(botData: any): string {
  return '# BotFather команды будут добавлены позже';
}

`;
    
    content = content.replace(
      /^(import.*\n)+/m,
      (match) => match + additionalImports
    );
    
    // Добавляем экспорты
    content = content.replace(/function (generate\w+)/g, 'export function $1');
    
    fs.writeFileSync(filePath, content);
    console.log('  ✅ Исправлены импорты и добавлены экспорты');
    this.fixes++;
  }

  // Добавляем недостающие функции в string-utils.ts
  fixStringUtilsModule() {
    console.log('🔧 Дополняем utils/string-utils.ts...');
    
    const filePath = path.join(this.modulesDir, 'utils/string-utils.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Добавляем недостающие функции
    const additionalFunctions = `
/**
 * Функция для удаления HTML тегов из текста
 */
export function stripHtmlTags(text: string): string {
  if (!text) return text;
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Функция для получения режима парсинга
 */
export function getParseMode(formatMode: string): string {
  if (formatMode === 'html') {
    return ', parse_mode=ParseMode.HTML';
  } else if (formatMode === 'markdown') {
    return ', parse_mode=ParseMode.MARKDOWN';
  }
  return '';
}
`;
    
    content += additionalFunctions;
    
    fs.writeFileSync(filePath, content);
    console.log('  ✅ Добавлены недостающие функции');
    this.fixes++;
  }

  // Основной метод выполнения
  async run() {
    try {
      console.log('🚀 Исправление импортов в извлеченных модулях...\n');
      
      this.fixStringUtilsModule();
      this.fixVariablesModule();
      this.fixKeyboardGeneratorModule();
      this.fixMessageHandlersModule();
      this.fixMediaHandlersModule();
      this.fixAdminHandlersModule();
      this.fixUserManagementModule();
      this.fixContentManagementModule();
      this.fixDocumentationModule();
      
      console.log(`\n🎉 Исправление завершено!`);
      console.log(`📊 Исправлено модулей: ${this.fixes}`);
      
      console.log('\n⚠️ Следующие шаги:');
      console.log('1. Проверьте TypeScript: npm run check');
      console.log('2. Протестируйте генерацию ботов');
      
    } catch (error) {
      console.error('❌ Ошибка при исправлении импортов:', error.message);
      process.exit(1);
    }
  }
}

// Запускаем исправление импортов
if (require.main === module) {
  const fixer = new ImportFixer();
  fixer.run();
}

module.exports = ImportFixer;