#!/usr/bin/env node

/**
 * Скрипт для разбиения монстр-функции generatePythonCode на модули
 * Самая критическая часть рефакторинга - 7,635 строк кода!
 */

const fs = require('fs');
const path = require('path');

class MainFunctionSplitter {
  constructor() {
    this.sourceFile = 'client/src/lib/bot-generator.ts';
    this.backupFile = 'client/src/lib/bot-generator.ts.backup-main-split';
    this.outputDir = 'client/src/lib/bot-generator';
    
    // План разбиения функции generatePythonCode
    // ОБНОВЛЕНО: Актуальные маркеры на основе текущего кода (10,941 строка)
    this.splitPlan = {
      // Секция 1: Импорты и заголовки (строки ~1184-1233)
      'core/imports-generator.ts': {
        description: 'Генератор импортов и заголовков Python кода',
        functions: ['generateImportsAndHeaders'],
        startMarker: 'let code = \'#!/usr/bin/env python3\\n\';',
        endMarker: '// Добавляем safe_edit_or_send если есть inline кнопки ИЛИ автопереходы',
        lines: '~50'
      },
      
      // Секция 2: Генерация обработчиков (строки ~1234-8800) - САМАЯ БОЛЬШАЯ
      'core/handlers-generator.ts': {
        description: 'Генератор обработчиков узлов (основная логика)',
        functions: ['generateNodeHandlers', 'generateCallbackHandlers'],
        startMarker: '// Добавляем safe_edit_or_send если есть inline кнопки ИЛИ автопереходы',
        endMarker: 'code += \'if __name__ == "__main__":\\n\';',
        lines: '~7566'
      },
      
      // Секция 3: Основной цикл (строки ~8800-8816)
      'core/main-loop-generator.ts': {
        description: 'Генератор основного цикла и запуска бота',
        functions: ['generateMainLoop', 'generateBotStartup'],
        startMarker: 'code += \'if __name__ == "__main__":\\n\';',
        endMarker: 'return code;',
        lines: '~16'
      }
    };
  }

  // Создаем резервную копию
  createBackup() {
    console.log('💾 Создаем резервную копию перед разбиением...');
    
    if (fs.existsSync(this.backupFile)) {
      console.log('  ⚠️ Резервная копия уже существует');
    } else {
      fs.copyFileSync(this.sourceFile, this.backupFile);
      console.log('  ✅ Резервная копия создана');
    }
  }

  // Читаем и анализируем функцию generatePythonCode
  analyzePythonCodeFunction() {
    console.log('🔍 Анализируем функцию generatePythonCode...');
    
    const content = fs.readFileSync(this.sourceFile, 'utf8');
    
    // Находим начало функции
    const functionStart = content.indexOf('export function generatePythonCode(');
    if (functionStart === -1) {
      throw new Error('Функция generatePythonCode не найдена!');
    }
    
    // Находим конец функции
    const functionEnd = this.findFunctionEnd(content, functionStart);
    if (functionEnd === -1) {
      throw new Error('Не найден конец функции generatePythonCode!');
    }
    
    const functionCode = content.substring(functionStart, functionEnd);
    const functionLines = functionCode.split('\\n').length;
    
    console.log(`  📊 Размер функции: ${functionLines} строк`);
    console.log(`  📍 Позиция: ${functionStart} - ${functionEnd}`);
    
    return {
      content,
      functionStart,
      functionEnd,
      functionCode,
      functionLines
    };
  }

  // Находим конец функции
  findFunctionEnd(content, startPos) {
    // Ищем строку "return code;" которая завершает функцию generatePythonCode
    const returnCodePattern = /return code;\s*\n\s*}/g;
    returnCodePattern.lastIndex = startPos;
    
    const match = returnCodePattern.exec(content);
    if (match) {
      return match.index + match[0].length;
    }
    
    // Если не нашли, используем старый метод подсчета скобок
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    let foundFirstBrace = false;
    
    for (let i = startPos; i < content.length; i++) {
      const char = content[i];
      const prevChar = i > 0 ? content[i - 1] : '';
      
      // Обработка строк
      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
        continue;
      }
      if (inString && char === stringChar && prevChar !== '\\\\') {
        inString = false;
        continue;
      }
      if (inString) continue;
      
      // Подсчет скобок
      if (char === '{') {
        braceCount++;
        foundFirstBrace = true;
      } else if (char === '}' && foundFirstBrace) {
        braceCount--;
        if (braceCount === 0) {
          return i + 1;
        }
      }
    }
    
    return -1;
  }

  // Извлекаем секцию кода по маркерам
  extractSection(functionCode, startMarker, endMarker) {
    const startPos = functionCode.indexOf(startMarker);
    if (startPos === -1) {
      console.log(`  ⚠️ Не найден начальный маркер: ${startMarker.substring(0, 50)}...`);
      return null;
    }
    
    let endPos;
    if (endMarker === 'return code;') {
      // Особый случай для последней секции
      endPos = functionCode.lastIndexOf('return code;');
    } else {
      endPos = functionCode.indexOf(endMarker, startPos);
    }
    
    if (endPos === -1) {
      console.log(`  ⚠️ Не найден конечный маркер: ${endMarker.substring(0, 50)}...`);
      return null;
    }
    
    const sectionCode = functionCode.substring(startPos, endPos);
    const sectionLines = sectionCode.split('\\n').length;
    
    return {
      code: sectionCode,
      lines: sectionLines,
      startPos,
      endPos
    };
  }

  // Генерируем код модуля для секции
  generateModuleCode(modulePath, moduleConfig, sectionData) {
    const functionName = moduleConfig.functions[0]; // Берем первую функцию как основную
    
    let code = `/**
 * ${moduleConfig.description}
 * Извлечено из generatePythonCode (${moduleConfig.lines} строк)
 * 
 * Это часть разбиения монстр-функции generatePythonCode
 * Приоритет: CRITICAL_RISK
 */

import { BotData, Node, BotGroup } from '../../../shared/schema';

// Импорты утилит (используем реальные пути из текущей структуры)
import { formatTextForPython } from '../../formatTextForPython';
import { extractNodesAndConnections } from '../../extractNodesAndConnections';
import { generateBotFatherCommands } from '../../commands';
import { generateButtonText } from '../../generateButtonText';

// Временные импорты (заменить на правильные)
// TODO: Добавить недостающие импорты после анализа зависимостей

/**
 * ${moduleConfig.description}
 * Извлечено из оригинальной функции generatePythonCode
 */
export function ${functionName}(
  botData: BotData,
  botName: string = "MyBot",
  groups: BotGroup[] = [],
  userDatabaseEnabled: boolean = false,
  projectId: number | null = null,
  enableLogging: boolean = false
): string {
  // Извлеченный код из generatePythonCode
${sectionData.code.split('\\n').map(line => '  ' + line).join('\\n')}
}

// TODO: Добавить дополнительные функции если необходимо
`;

    return code;
  }

  // Создаем новую главную функцию generatePythonCode
  generateNewMainFunction() {
    console.log('🔧 Создаем новую главную функцию...');
    
    const newMainFunction = `/**
 * Главная функция генерации Python кода для Telegram бота
 * Рефакторирована из монолитной функции в модульную архитектуру
 */
export function generatePythonCode(
  botData: BotData, 
  botName: string = "MyBot", 
  groups: BotGroup[] = [], 
  userDatabaseEnabled: boolean = false, 
  projectId: number | null = null, 
  enableLogging: boolean = false
): string {
  // Set global logging flag for this generation run
  globalLoggingEnabled = enableLogging;

  try {
    // 1. Генерируем импорты и заголовки
    const importsAndHeaders = generateImportsAndHeaders(botData, botName, groups, userDatabaseEnabled, projectId, enableLogging);
    
    // 2. Анализируем данные бота
    const analysisResult = analyzeBotData(botData, botName, groups, userDatabaseEnabled, projectId, enableLogging);
    
    // 3. Генерируем обработчики узлов (основная логика)
    const nodeHandlers = generateNodeHandlers(botData, botName, groups, userDatabaseEnabled, projectId, enableLogging);
    
    // 4. Генерируем основной цикл и запуск
    const mainLoop = generateMainLoop(botData, botName, groups, userDatabaseEnabled, projectId, enableLogging);
    
    // Объединяем все части
    const fullCode = importsAndHeaders + analysisResult + nodeHandlers + mainLoop;
    
    if (enableLogging) {
      console.log('🎉 Генерация завершена успешно (модульная архитектура)');
      console.log(\`📊 Размер кода: \${fullCode.length} символов\`);
    }
    
    return fullCode;
    
  } catch (error) {
    console.error('❌ Ошибка генерации:', error);
    throw error;
  }
}`;

    return newMainFunction;
  }

  // Создаем директории для новых модулей
  ensureDirectories() {
    const dirs = [
      this.outputDir,
      path.join(this.outputDir, 'core'),
      path.join(this.outputDir, 'handlers'),
      path.join(this.outputDir, 'keyboards'),
      path.join(this.outputDir, 'utils'),
      path.join(this.outputDir, 'logic'),
      path.join(this.outputDir, 'media')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Создана директория: ${dir}`);
      }
    });
  }

  // Записываем модуль
  writeModule(modulePath, code) {
    const fullPath = path.join(this.outputDir, modulePath);
    fs.writeFileSync(fullPath, code, 'utf8');
    console.log(`💾 Создан модуль: ${fullPath}`);
  }

  // Обновляем главный файл
  updateMainFile(analysis, newMainFunction) {
    console.log('🔄 Обновляем главный файл...');
    
    const { content, functionStart, functionEnd } = analysis;
    
    // Добавляем импорты для новых модулей
    const newImports = `
// Импорты для модульной архитектуры generatePythonCode
import { generateImportsAndHeaders } from './bot-generator/core/imports-generator';
import { analyzeBotData } from './bot-generator/core/data-analyzer';
import { generateNodeHandlers } from './bot-generator/core/handlers-generator';
import { generateMainLoop } from './bot-generator/core/main-loop-generator';
`;
    
    // Заменяем старую функцию на новую
    const beforeFunction = content.substring(0, functionStart);
    const afterFunction = content.substring(functionEnd);
    
    // Добавляем импорты после существующих
    const importInsertPos = beforeFunction.lastIndexOf('import');
    const importEndPos = beforeFunction.indexOf(';', importInsertPos) + 1;
    
    const updatedBefore = beforeFunction.substring(0, importEndPos) + newImports + beforeFunction.substring(importEndPos);
    
    const newContent = updatedBefore + newMainFunction + afterFunction;
    
    fs.writeFileSync(this.sourceFile, newContent);
    console.log('  ✅ Главный файл обновлен');
  }

  // Создаем временные заглушки для модулей
  createTemporaryStubs() {
    console.log('🔧 Создаем временные заглушки для модулей...');
    
    Object.entries(this.splitPlan).forEach(([modulePath, moduleConfig]) => {
      const functionName = moduleConfig.functions[0];
      
      const stubCode = `/**
 * ${moduleConfig.description}
 * ВРЕМЕННАЯ ЗАГЛУШКА - требует реализации
 */

import { BotData, Node, BotGroup } from '../../../shared/schema';
import { generateBotFatherCommands } from '../../commands';

/**
 * ${moduleConfig.description}
 * TODO: Реализовать извлечение из generatePythonCode
 */
export function ${functionName}(
  botData: BotData,
  botName: string = "MyBot",
  groups: BotGroup[] = [],
  userDatabaseEnabled: boolean = false,
  projectId: number | null = null,
  enableLogging: boolean = false
): string {
  // ВРЕМЕННАЯ ЗАГЛУШКА
  console.warn('⚠️ Вызвана заглушка функции ${functionName}');
  console.warn('TODO: Реализовать извлечение из оригинальной generatePythonCode');
  
  return \`
# TODO: Реализовать ${moduleConfig.description}
# Эта секция должна быть извлечена из оригинальной функции
# Примерный размер: ${moduleConfig.lines} строк

pass  # Временная заглушка
\`;
}
`;
      
      this.writeModule(modulePath, stubCode);
    });
  }

  // Обновляем index.ts
  updateIndex() {
    console.log('🔄 Обновляем index.ts...');
    
    const indexPath = path.join(this.outputDir, 'index.ts');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Добавляем экспорты новых модулей
    const newExports = `
// Модульная архитектура generatePythonCode
export * from './core/imports-generator';
export * from './core/data-analyzer';
export * from './core/handlers-generator';
export * from './core/main-loop-generator';
`;
    
    indexContent += newExports;
    fs.writeFileSync(indexPath, indexContent);
    console.log('  ✅ Index.ts обновлен');
  }

  // Создаем план дальнейшей работы
  createImplementationPlan() {
    console.log('📋 Создаем план реализации...');
    
    const planContent = `# План реализации модульной архитектуры generatePythonCode

## 🎯 Цель
Разбить монстр-функцию generatePythonCode (7,635 строк) на 4 модуля

## 📊 Текущий статус: ЗАГЛУШКИ СОЗДАНЫ

### Созданные модули:

1. **core/imports-generator.ts** (${this.splitPlan['core/imports-generator.ts'].lines} строк)
   - Функция: generateImportsAndHeaders
   - Описание: ${this.splitPlan['core/imports-generator.ts'].description}
   - Статус: 🟡 ЗАГЛУШКА

2. **core/data-analyzer.ts** (${this.splitPlan['core/data-analyzer.ts'].lines} строк)
   - Функция: analyzeBotData
   - Описание: ${this.splitPlan['core/data-analyzer.ts'].description}
   - Статус: 🟡 ЗАГЛУШКА

3. **core/handlers-generator.ts** (${this.splitPlan['core/handlers-generator.ts'].lines} строк)
   - Функция: generateNodeHandlers
   - Описание: ${this.splitPlan['core/handlers-generator.ts'].description}
   - Статус: 🟡 ЗАГЛУШКА (САМЫЙ БОЛЬШОЙ МОДУЛЬ!)

4. **core/main-loop-generator.ts** (${this.splitPlan['core/main-loop-generator.ts'].lines} строк)
   - Функция: generateMainLoop
   - Описание: ${this.splitPlan['core/main-loop-generator.ts'].description}
   - Статус: 🟡 ЗАГЛУШКА

## 🚀 Следующие шаги:

### Этап 1: Извлечение imports-generator (НИЗКИЙ РИСК)
\`\`\`bash
# Извлечь секцию генерации импортов и заголовков
# Маркеры: "${this.splitPlan['core/imports-generator.ts'].startMarker}" -> "${this.splitPlan['core/imports-generator.ts'].endMarker}"
\`\`\`

### Этап 2: Извлечение data-analyzer (СРЕДНИЙ РИСК)
\`\`\`bash
# Извлечь секцию анализа данных
# Маркеры: "${this.splitPlan['core/data-analyzer.ts'].startMarker}" -> "${this.splitPlan['core/data-analyzer.ts'].endMarker}"
\`\`\`

### Этап 3: Извлечение main-loop-generator (СРЕДНИЙ РИСК)
\`\`\`bash
# Извлечь секцию основного цикла
# Маркеры: "${this.splitPlan['core/main-loop-generator.ts'].startMarker}" -> "${this.splitPlan['core/main-loop-generator.ts'].endMarker}"
\`\`\`

### Этап 4: Извлечение handlers-generator (КРИТИЧЕСКИЙ РИСК!)
\`\`\`bash
# Извлечь САМУЮ БОЛЬШУЮ секцию - генерацию обработчиков
# Маркеры: "${this.splitPlan['core/handlers-generator.ts'].startMarker}" -> "${this.splitPlan['core/handlers-generator.ts'].endMarker}"
# ⚠️ ОСТОРОЖНО: 6300+ строк кода!
\`\`\`

## 🧪 Тестирование после каждого этапа:
1. npm run check - проверка TypeScript
2. Тест генерации простого бота
3. Тест генерации сложного бота

## 🔄 Откат при проблемах:
\`\`\`bash
node scripts/rollback-main-split.cjs
\`\`\`

## 📈 Ожидаемые результаты:
- Сокращение основного файла на ~7,600 строк
- Модульная архитектура вместо монолита
- Упрощение поддержки и разработки
- Возможность параллельной работы над модулями
`;

    fs.writeFileSync('MAIN_FUNCTION_SPLIT_PLAN.md', planContent);
    console.log('  ✅ План сохранен в MAIN_FUNCTION_SPLIT_PLAN.md');
  }

  // Создаем скрипт отката
  createRollbackScript() {
    console.log('🔄 Создаем скрипт отката...');
    
    const rollbackScript = `#!/usr/bin/env node

/**
 * Скрипт для отката разбиения главной функции generatePythonCode
 */

const fs = require('fs');

console.log('🔄 Откат разбиения главной функции...');

if (fs.existsSync('${this.backupFile}')) {
  fs.copyFileSync('${this.backupFile}', '${this.sourceFile}');
  console.log('✅ Главный файл восстановлен из резервной копии');
  
  // Удаляем созданные модули
  const modulesToRemove = [
    'client/src/lib/bot-generator/core/imports-generator.ts',
    'client/src/lib/bot-generator/core/data-analyzer.ts', 
    'client/src/lib/bot-generator/core/handlers-generator.ts',
    'client/src/lib/bot-generator/core/main-loop-generator.ts'
  ];
  
  modulesToRemove.forEach(module => {
    if (fs.existsSync(module)) {
      fs.unlinkSync(module);
      console.log(\`🗑️ Удален модуль: \${module}\`);
    }
  });
  
  console.log('📊 Монолитная функция generatePythonCode восстановлена');
} else {
  console.log('❌ Резервная копия не найдена!');
  process.exit(1);
}
`;
    
    fs.writeFileSync('scripts/rollback-main-split.cjs', rollbackScript);
    console.log('  ✅ Скрипт отката создан');
  }

  // Основной метод выполнения
  async run() {
    try {
      console.log('\\n🚀 РАЗБИЕНИЕ МОНСТР-ФУНКЦИИ generatePythonCode\\n');
      console.log('⚠️ КРИТИЧЕСКИЙ ЭТАП: 7,635 строк кода!\\n');
      
      this.createBackup();
      
      const analysis = this.analyzePythonCodeFunction();
      
      this.ensureDirectories();
      this.createTemporaryStubs();
      
      const newMainFunction = this.generateNewMainFunction();
      this.updateMainFile(analysis, newMainFunction);
      
      this.updateIndex();
      this.createImplementationPlan();
      this.createRollbackScript();
      
      console.log('\\n🎉 Создание модульной архитектуры завершено!');
      console.log('\\n📋 Что сделано:');
      console.log('- ✅ Создана модульная архитектура (4 модуля)');
      console.log('- ✅ Главная функция переписана для использования модулей');
      console.log('- ✅ Созданы временные заглушки');
      console.log('- ✅ Создан план реализации');
      console.log('- ✅ Создан скрипт отката');
      
      console.log('\\n⚠️ ВАЖНО:');
      console.log('1. Сейчас используются ЗАГЛУШКИ - бот не будет работать!');
      console.log('2. Нужно реализовать каждый модуль по плану');
      console.log('3. Начните с imports-generator (самый простой)');
      console.log('4. При проблемах: node scripts/rollback-main-split.cjs');
      
      console.log('\\n📖 Следующие шаги:');
      console.log('1. Изучите MAIN_FUNCTION_SPLIT_PLAN.md');
      console.log('2. Реализуйте модули по очереди');
      console.log('3. Тестируйте после каждого модуля');
      
    } catch (error) {
      console.error('❌ Ошибка при разбиении функции:', error.message);
      console.error('\\n🔄 Для отката используйте: node scripts/rollback-main-split.cjs');
      process.exit(1);
    }
  }
}

// Запускаем разбиение
if (require.main === module) {
  const splitter = new MainFunctionSplitter();
  splitter.run();
}

module.exports = MainFunctionSplitter;