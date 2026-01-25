#!/usr/bin/env node

/**
 * Скрипт для автоматического парсинга и извлечения функций из bot-generator.ts
 * Создает модульную структуру с сохранением всей функциональности
 */

const fs = require('fs');
const path = require('path');

// Конфигурация парсинга
const CONFIG = {
  sourceFile: 'client/src/lib/bot-generator.ts',
  outputDir: 'client/src/lib/bot-generator',
  
  // Определяем какие функции в какие модули должны попасть
  modules: {
    'handlers/message-handlers.ts': {
      functions: [
        'generateStartHandler',
        'generateCommandHandler',
        'generateMessageHandler'
      ],
      imports: [
        "import { Node } from '@shared/schema';",
        "import { escapeForPython, formatTextForPython } from '../utils/string-utils';",
        "import { generateReplyKeyboardCode } from '../keyboards/reply-keyboard';",
        "import { generateInlineKeyboardCode } from '../keyboards/inline-keyboard';"
      ]
    },
    
    'handlers/media-handlers.ts': {
      functions: [
        'generateStickerHandler',
        'generateVoiceHandler', 
        'generateAnimationHandler',
        'generateLocationHandler',
        'generateContactHandler'
      ],
      imports: [
        "import { Node } from '@shared/schema';",
        "import { escapeForPython, formatTextForPython } from '../utils/string-utils';"
      ]
    },
    
    'handlers/user-management.ts': {
      functions: [
        'generateBanUserHandler',
        'generateUnbanUserHandler',
        'generateMuteUserHandler',
        'generateUnmuteUserHandler',
        'generateKickUserHandler'
      ],
      imports: [
        "import { Node } from '@shared/schema';",
        "import { escapeForPython } from '../utils/string-utils';"
      ]
    },
    
    'handlers/content-management.ts': {
      functions: [
        'generatePinMessageHandler',
        'generateUnpinMessageHandler', 
        'generateDeleteMessageHandler'
      ],
      imports: [
        "import { Node } from '@shared/schema';",
        "import { escapeForPython } from '../utils/string-utils';"
      ]
    },
    
    'logic/conditional.ts': {
      functions: [
        'generateConditionalMessageLogic',
        'generateVariableReplacement',
        'generateUniversalVariableReplacement'
      ],
      imports: [
        "import { escapeForPython, formatTextForPython } from '../utils/string-utils';",
        "import { generateConditionalKeyboard } from '../keyboards/conditional-keyboard';"
      ]
    },
    
    'logic/variables.ts': {
      functions: [
        'generateWaitingStateCode'
      ],
      imports: [
        "import { escapeForPython } from '../utils/string-utils';"
      ]
    }
  }
};

class BotGeneratorParser {
  constructor() {
    this.sourceCode = '';
    this.functions = new Map();
    this.parsedFunctions = new Map();
  }

  // Читаем исходный файл
  readSourceFile() {
    console.log('📖 Читаем исходный файл bot-generator.ts...');
    
    if (!fs.existsSync(CONFIG.sourceFile)) {
      throw new Error(`Файл ${CONFIG.sourceFile} не найден!`);
    }
    
    this.sourceCode = fs.readFileSync(CONFIG.sourceFile, 'utf8');
    console.log(`✅ Прочитано ${this.sourceCode.length} символов`);
  }

  // Парсим функции из исходного кода
  parseFunctions() {
    console.log('🔍 Парсим функции...');
    
    // Регулярное выражение для поиска функций
    const functionRegex = /^(export\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*:\s*[^{]*\{/gm;
    
    let match;
    let functionCount = 0;
    
    while ((match = functionRegex.exec(this.sourceCode)) !== null) {
      const functionName = match[2];
      const startPos = match.index;
      
      // Находим конец функции (подсчитываем скобки)
      const endPos = this.findFunctionEnd(startPos);
      
      if (endPos > startPos) {
        const functionCode = this.sourceCode.substring(startPos, endPos);
        this.functions.set(functionName, {
          code: functionCode,
          startPos,
          endPos
        });
        
        functionCount++;
        console.log(`  ✓ Найдена функция: ${functionName}`);
      }
    }
    
    console.log(`✅ Найдено ${functionCount} функций`);
  }

  // Находим конец функции по балансу скобок
  findFunctionEnd(startPos) {
    let braceCount = 0;
    let inString = false;
    let inComment = false;
    let stringChar = '';
    
    for (let i = startPos; i < this.sourceCode.length; i++) {
      const char = this.sourceCode[i];
      const prevChar = i > 0 ? this.sourceCode[i - 1] : '';
      const nextChar = i < this.sourceCode.length - 1 ? this.sourceCode[i + 1] : '';
      
      // Обработка комментариев
      if (!inString && char === '/' && nextChar === '/') {
        inComment = 'line';
        continue;
      }
      if (!inString && char === '/' && nextChar === '*') {
        inComment = 'block';
        continue;
      }
      if (inComment === 'line' && char === '\n') {
        inComment = false;
        continue;
      }
      if (inComment === 'block' && char === '*' && nextChar === '/') {
        inComment = false;
        i++; // Пропускаем следующий символ
        continue;
      }
      if (inComment) continue;
      
      // Обработка строк
      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
        continue;
      }
      if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = '';
        continue;
      }
      if (inString) continue;
      
      // Подсчет скобок
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          return i + 1; // Включаем закрывающую скобку
        }
      }
    }
    
    return -1; // Не найден конец функции
  }

  // Извлекаем функции для конкретного модуля
  extractFunctionsForModule(modulePath, moduleConfig) {
    console.log(`\n🔧 Обрабатываем модуль: ${modulePath}`);
    
    const extractedFunctions = [];
    const notFoundFunctions = [];
    
    for (const functionName of moduleConfig.functions) {
      if (this.functions.has(functionName)) {
        const functionData = this.functions.get(functionName);
        extractedFunctions.push({
          name: functionName,
          code: functionData.code
        });
        console.log(`  ✓ Извлечена: ${functionName}`);
      } else {
        notFoundFunctions.push(functionName);
        console.log(`  ❌ Не найдена: ${functionName}`);
      }
    }
    
    if (notFoundFunctions.length > 0) {
      console.log(`  ⚠️ Не найдено функций: ${notFoundFunctions.join(', ')}`);
    }
    
    return extractedFunctions;
  }

  // Генерируем код модуля
  generateModuleCode(modulePath, moduleConfig, extractedFunctions) {
    const moduleDescription = this.getModuleDescription(modulePath);
    
    let code = `/**\n * ${moduleDescription}\n * Автоматически извлечено из bot-generator.ts\n */\n\n`;
    
    // Добавляем импорты
    if (moduleConfig.imports && moduleConfig.imports.length > 0) {
      code += moduleConfig.imports.join('\n') + '\n\n';
    }
    
    // Добавляем функции
    extractedFunctions.forEach(func => {
      code += func.code + '\n\n';
    });
    
    return code;
  }

  // Получаем описание модуля
  getModuleDescription(modulePath) {
    const descriptions = {
      'handlers/message-handlers.ts': 'Обработчики сообщений для Telegram ботов',
      'handlers/media-handlers.ts': 'Обработчики медиа-контента для Telegram ботов',
      'handlers/user-management.ts': 'Обработчики управления пользователями',
      'handlers/content-management.ts': 'Обработчики управления контентом',
      'logic/conditional.ts': 'Логика условных сообщений и переходов',
      'logic/variables.ts': 'Логика работы с переменными и состояниями'
    };
    
    return descriptions[modulePath] || 'Модуль генератора ботов';
  }

  // Создаем директории если их нет
  ensureDirectories() {
    const dirs = [
      'client/src/lib/bot-generator/handlers',
      'client/src/lib/bot-generator/logic'
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Создана директория: ${dir}`);
      }
    });
  }

  // Записываем модуль в файл
  writeModule(modulePath, code) {
    const fullPath = path.join(CONFIG.outputDir, modulePath);
    
    fs.writeFileSync(fullPath, code, 'utf8');
    console.log(`💾 Записан модуль: ${fullPath}`);
  }

  // Обновляем главный index.ts
  updateMainIndex() {
    console.log('\n🔄 Обновляем главный index.ts...');
    
    const indexPath = path.join(CONFIG.outputDir, 'index.ts');
    
    let indexCode = `// Главный экспорт для bot-generator модуля
// Этот файл обеспечивает обратную совместимость во время рефакторинга

// Пока что просто реэкспортируем оригинальные функции
export { generatePythonCode, parsePythonCodeToJson } from '../bot-generator';

// Экспортируем утилиты из новых модулей
export * from './utils/string-utils';
export * from './utils/node-utils';

// Экспортируем анализаторы
export * from './analyzers/feature-analyzer';
export * from './analyzers/media-analyzer';

// Экспортируем генераторы клавиатур
export * from './keyboards/keyboard-utils';
export * from './keyboards/reply-keyboard';
export * from './keyboards/inline-keyboard';
export * from './keyboards/conditional-keyboard';

// Экспортируем обработчики (новые модули)
export * from './handlers/message-handlers';
export * from './handlers/media-handlers';
export * from './handlers/user-management';
export * from './handlers/content-management';

// Экспортируем логику
export * from './logic/conditional';
export * from './logic/variables';

// В будущем здесь будут импорты из модульной структуры:
// export { generatePythonCode } from './core/generator';
// export { parsePythonCodeToJson } from './core/parser';
`;

    fs.writeFileSync(indexPath, indexCode, 'utf8');
    console.log('✅ Обновлен index.ts');
  }

  // Основной метод выполнения
  async run() {
    try {
      console.log('🚀 Запуск автоматического парсинга bot-generator.ts\n');
      
      // Читаем исходный файл
      this.readSourceFile();
      
      // Парсим функции
      this.parseFunctions();
      
      // Создаем необходимые директории
      this.ensureDirectories();
      
      // Обрабатываем каждый модуль
      for (const [modulePath, moduleConfig] of Object.entries(CONFIG.modules)) {
        const extractedFunctions = this.extractFunctionsForModule(modulePath, moduleConfig);
        
        if (extractedFunctions.length > 0) {
          const moduleCode = this.generateModuleCode(modulePath, moduleConfig, extractedFunctions);
          this.writeModule(modulePath, moduleCode);
        }
      }
      
      // Обновляем главный index.ts
      this.updateMainIndex();
      
      console.log('\n🎉 Парсинг завершен успешно!');
      console.log('\n📊 Статистика:');
      console.log(`- Всего функций найдено: ${this.functions.size}`);
      console.log(`- Модулей создано: ${Object.keys(CONFIG.modules).length}`);
      console.log(`- Функций извлечено: ${Object.values(CONFIG.modules).reduce((sum, mod) => sum + mod.functions.length, 0)}`);
      
    } catch (error) {
      console.error('❌ Ошибка при парсинге:', error.message);
      process.exit(1);
    }
  }
}

// Запускаем парсер если скрипт вызван напрямую
if (require.main === module) {
  const parser = new BotGeneratorParser();
  parser.run();
}

module.exports = BotGeneratorParser;