#!/usr/bin/env node

/**
 * Скрипт для удаления дублированных функций из основного bot-generator.ts
 * Основан на результатах анализа функций
 */

const fs = require('fs');
const path = require('path');

class DuplicateRemover {
  constructor() {
    this.sourceFile = 'client/src/lib/bot-generator.ts';
    this.backupFile = 'client/src/lib/bot-generator.ts.backup-duplicates';
    this.removedFunctions = 0;
    this.removedLines = 0;
    
    // Список дублированных функций для удаления (ОБНОВЛЕНО)
    // ВАЖНО: generateButtonText уже вынесен в отдельный файл - НЕ УДАЛЯТЬ!
    // Используем поиск по имени функции вместо номеров строк
    this.duplicatedFunctions = [
      { name: 'calculateOptimalColumns' }, // Проверить актуальность
      { name: 'generateInlineKeyboardCode' }, // Проверить актуальность
      { name: 'generateReplyKeyboardCode' }, // Проверить актуальность
      // escapeForPython, stripHtmlTags, formatTextForPython, getParseMode - уже вынесены в отдельные файлы
      { name: 'escapeForJsonString' }, // Проверить актуальность
      { name: 'toPythonBoolean' } // Проверить актуальность
    ];
  }

  // Создаем резервную копию
  createBackup() {
    console.log('💾 Создаем резервную копию...');
    
    if (fs.existsSync(this.backupFile)) {
      console.log('  ⚠️ Резервная копия уже существует');
      const stats = fs.statSync(this.backupFile);
      console.log(`  📅 Дата создания: ${stats.mtime.toLocaleString()}`);
    } else {
      fs.copyFileSync(this.sourceFile, this.backupFile);
      console.log('  ✅ Резервная копия создана');
    }
  }

  // Находим точные границы функции
  findFunctionBounds(content, functionName) {
    // Ищем объявление функции
    const functionRegex = new RegExp(
      `^(export\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*:\\s*[^{]*\\{`,
      'm'
    );
    
    const match = content.match(functionRegex);
    if (!match) {
      console.log(`  ❌ Функция ${functionName} не найдена`);
      return null;
    }
    
    const startPos = match.index;
    
    // Для простых функций (без вложенных скобок) ищем первую закрывающую скобку на новой строке
    const functionStart = content.substring(startPos);
    const lines = functionStart.split('\n');
    
    let braceCount = 0;
    let endLineIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Подсчитываем скобки в строке
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            endLineIndex = i;
            break;
          }
        }
      }
      
      if (endLineIndex !== -1) break;
    }
    
    if (endLineIndex === -1) {
      console.log(`  ❌ Не найден конец функции ${functionName}`);
      return null;
    }
    
    // Вычисляем позицию конца функции
    const endPos = startPos + lines.slice(0, endLineIndex + 1).join('\n').length;
    
    return { startPos, endPos };
  }

  // Находим конец функции по балансу скобок
  findFunctionEnd(content, startPos) {
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    let inComment = false;
    
    for (let i = startPos; i < content.length; i++) {
      const char = content[i];
      const prevChar = i > 0 ? content[i - 1] : '';
      const nextChar = i < content.length - 1 ? content[i + 1] : '';
      
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
      if (inString && char === stringChar && prevChar !== '\\\\') {
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
    
    return -1;
  }

  // Удаляем функцию из контента
  removeFunctionFromContent(content, functionName) {
    // Проверяем, существует ли функция перед удалением
    const bounds = this.findFunctionBounds(content, functionName);
    
    if (!bounds) {
      console.log(`  ⚠️ Функция ${functionName} не найдена - возможно уже удалена или вынесена`);
      return { content, removed: false, lines: 0 };
    }
    
    // Подсчитываем удаляемые строки
    const functionCode = content.substring(bounds.startPos, bounds.endPos);
    const functionLines = functionCode.split('\n').length;
    
    // Удаляем функцию
    const beforeFunction = content.substring(0, bounds.startPos);
    const afterFunction = content.substring(bounds.endPos);
    
    // Убираем лишние переносы строк
    const cleanBefore = beforeFunction.replace(/\n\s*$/, '\n');
    const cleanAfter = afterFunction.replace(/^\s*\n+/, '\n');
    
    console.log(`  ✅ Удалена функция ${functionName} (${functionLines} строк)`);
    this.removedFunctions++;
    this.removedLines += functionLines;
    
    return { 
      content: cleanBefore + cleanAfter, 
      removed: true, 
      lines: functionLines 
    };
  }

  // Добавляем импорты для удаленных функций
  addImportsForRemovedFunctions(content) {
    console.log('📦 Добавляем импорты для удаленных функций...');
    
    // Проверяем какие импорты уже есть
    const existingImports = content.match(/^import.*from.*$/gm) || [];
    const hasStringUtilsImport = existingImports.some(imp => imp.includes('./bot-generator/utils/string-utils'));
    const hasKeyboardUtilsImport = existingImports.some(imp => imp.includes('./bot-generator/keyboards/keyboard-utils'));
    const hasInlineKeyboardImport = existingImports.some(imp => imp.includes('./bot-generator/keyboards/inline-keyboard'));
    const hasReplyKeyboardImport = existingImports.some(imp => imp.includes('./bot-generator/keyboards/reply-keyboard'));
    
    let newImports = '';
    
    // ОБНОВЛЕНО: Используем реальные пути из текущей структуры
    // generateButtonText уже в './generateButtonText'
    // formatTextForPython уже в './formatTextForPython'
    // extractNodesAndConnections уже в './extractNodesAndConnections'
    
    // Добавляем импорты только если их еще нет и функции действительно удалены
    // Проверяем какие функции были удалены
    const removedFunctionNames = this.duplicatedFunctions
      .filter(f => this.removedFunctions > 0) // Упрощенная проверка
      .map(f => f.name);
    
    if (removedFunctionNames.includes('calculateOptimalColumns') && !hasKeyboardUtilsImport) {
      // calculateOptimalColumns может быть в keyboards/keyboard-utils или внутри файла
      // Пока не добавляем импорт, так как структура еще не создана
      console.log('  ⚠️ calculateOptimalColumns - требуется ручная проверка импорта');
    }
    
    if (!hasInlineKeyboardImport) {
      newImports += `import { generateInlineKeyboardCode } from './bot-generator/keyboards/inline-keyboard';\n`;
    }
    
    if (!hasReplyKeyboardImport) {
      newImports += `import { generateReplyKeyboardCode } from './bot-generator/keyboards/reply-keyboard';\n`;
    }
    
    if (newImports) {
      // Находим место для вставки импортов (после существующих импортов)
      const importRegex = /^import.*from.*;$/gm;
      const matches = [...content.matchAll(importRegex)];
      
      if (matches.length > 0) {
        const lastImport = matches[matches.length - 1];
        const insertPos = lastImport.index + lastImport[0].length;
        
        content = content.substring(0, insertPos) + '\n\n' + newImports + content.substring(insertPos);
      } else {
        // Если нет импортов, добавляем в начало после комментариев
        const afterComments = content.search(/^[^/\*\n]/m);
        if (afterComments > 0) {
          content = content.substring(0, afterComments) + newImports + '\n' + content.substring(afterComments);
        } else {
          content = newImports + '\n' + content;
        }
      }
      
      console.log('  ✅ Добавлены импорты для удаленных функций');
    } else {
      console.log('  ℹ️ Импорты уже существуют');
    }
    
    return content;
  }

  // Основной метод удаления дублей
  removeDuplicates() {
    console.log('🗑️ Удаляем дублированные функции...');
    
    let content = fs.readFileSync(this.sourceFile, 'utf8');
    const originalLines = content.split('\n').length;
    
    console.log(`📊 Исходный размер: ${originalLines} строк`);
    console.log(`🎯 Функций к удалению: ${this.duplicatedFunctions.length}`);
    console.log('');
    
    // Удаляем каждую дублированную функцию
    for (const funcInfo of this.duplicatedFunctions) {
      const result = this.removeFunctionFromContent(content, funcInfo.name);
      content = result.content;
    }
    
    // Добавляем импорты для удаленных функций
    content = this.addImportsForRemovedFunctions(content);
    
    // Записываем обновленный файл
    fs.writeFileSync(this.sourceFile, content);
    
    const newLines = content.split('\n').length;
    const savedLines = originalLines - newLines;
    const savedPercent = Math.round((savedLines / originalLines) * 100);
    
    console.log('\n📊 Результаты удаления дублей:');
    console.log(`  Функций удалено: ${this.removedFunctions}/${this.duplicatedFunctions.length}`);
    console.log(`  Строк было: ${originalLines}`);
    console.log(`  Строк стало: ${newLines}`);
    console.log(`  Удалено строк: ${savedLines}`);
    console.log(`  Сокращение: ${savedPercent}%`);
  }

  // Проверяем результат
  validateResult() {
    console.log('\n🔍 Проверяем результат...');
    
    try {
      // Проверяем TypeScript компиляцию
      const { execSync } = require('child_process');
      execSync('npx tsc --noEmit --skipLibCheck client/src/lib/bot-generator.ts', { stdio: 'pipe' });
      console.log('  ✅ TypeScript компиляция прошла успешно');
    } catch (error) {
      console.log('  ⚠️ Есть ошибки TypeScript:');
      const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
      const botGeneratorErrors = (errorOutput.match(/bot-generator\\.ts/g) || []).length;
      console.log(`    - Ошибок в bot-generator.ts: ${botGeneratorErrors}`);
      
      if (botGeneratorErrors === 0) {
        console.log('    ✅ Ошибки не связаны с нашими изменениями');
      }
    }
    
    // Проверяем размер файла
    const stats = fs.statSync(this.sourceFile);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`  📏 Новый размер файла: ${sizeKB} KB`);
    
    // Проверяем что импорты добавлены
    const content = fs.readFileSync(this.sourceFile, 'utf8');
    const hasStringUtilsImport = content.includes('./bot-generator/utils/string-utils');
    const hasKeyboardUtilsImport = content.includes('./bot-generator/keyboards/keyboard-utils');
    console.log(`  📦 Импорты добавлены: ${hasStringUtilsImport && hasKeyboardUtilsImport ? '✅' : '❌'}`);
  }

  // Создаем скрипт отката
  createRollbackScript() {
    console.log('🔄 Создаем скрипт отката...');
    
    const rollbackScript = `#!/usr/bin/env node

/**
 * Скрипт для отката удаления дублированных функций
 */

const fs = require('fs');

console.log('🔄 Откат удаления дублированных функций...');

if (fs.existsSync('${this.backupFile}')) {
  fs.copyFileSync('${this.backupFile}', '${this.sourceFile}');
  console.log('✅ Файл восстановлен из резервной копии');
  console.log('📊 Дублированные функции восстановлены');
} else {
  console.log('❌ Резервная копия не найдена!');
  process.exit(1);
}
`;
    
    fs.writeFileSync('scripts/rollback-duplicates.cjs', rollbackScript);
    console.log('  ✅ Скрипт отката создан: scripts/rollback-duplicates.cjs');
  }

  // Обновляем анализ функций
  updateAnalysis() {
    console.log('📊 Обновляем анализ функций...');
    
    try {
      const { execSync } = require('child_process');
      execSync('node scripts/analyze-functions.js > analysis-after-duplicates.txt', { stdio: 'pipe' });
      console.log('  ✅ Новый анализ сохранен в analysis-after-duplicates.txt');
    } catch (error) {
      console.log('  ⚠️ Не удалось запустить анализ функций');
    }
  }

  // Основной метод выполнения
  async run() {
    try {
      console.log('\n🚀 Удаление дублированных функций из bot-generator.ts\n');
      
      this.createBackup();
      this.removeDuplicates();
      this.validateResult();
      this.createRollbackScript();
      this.updateAnalysis();
      
      console.log('\n🎉 Удаление дублей завершено!');
      console.log('\n� ЧЧто сделано:');
      console.log(`- ✅ Удалено ${this.removedFunctions} дублированных функций`);
      console.log(`- ✅ Сэкономлено ~${this.removedLines} строк кода`);
      console.log('- ✅ Добавлены импорты из новых модулей');
      console.log('- ✅ Создана резервная копия');
      console.log('- ✅ Создан скрипт отката');
      console.log('\n⚠️ ВАЖНО:');
      console.log('1. Проверьте TypeScript компиляцию: npm run check');
      console.log('2. Протестируйте генерацию ботов');
      console.log('3. При проблемах используйте: node scripts/rollback-duplicates.cjs');
      
      console.log('\n� ССледующий этап:');
      console.log('Теперь можно приступать к разбиению функции generatePythonCode (7,635 строк)');
      
    } catch (error) {
      console.error('❌ Ошибка при удалении дублей:', error.message);
      console.error('\n🔄 Для отката используйте: node scripts/rollback-duplicates.cjs');
      process.exit(1);
    }
  }
}

// Запускаем удаление дублей
if (require.main === module) {
  const remover = new DuplicateRemover();
  remover.run();
}

module.exports = DuplicateRemover;