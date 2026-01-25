#!/usr/bin/env node
/**
 * Скрипт для анализа функций в bot-generator.ts
 * Помогает отслеживать прогресс рефакторинга
 */

import fs from 'fs';
import path from 'path';

const GENERATOR_FILE = 'client/src/lib/bot-generator.ts';

function analyzeFunctions() {
  if (!fs.existsSync(GENERATOR_FILE)) {
    console.error(`❌ Файл ${GENERATOR_FILE} не найден`);
    process.exit(1);
  }

  const content = fs.readFileSync(GENERATOR_FILE, 'utf8');
  const lines = content.split('\n');

  console.log('🔍 АНАЛИЗ ФУНКЦИЙ В bot-generator.ts');
  console.log('=' .repeat(50));
  console.log(`📄 Общее количество строк: ${lines.length}`);
  console.log('');

  // Ищем функции
  const functionPattern = /^(export\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)/;
  const functions = [];
  
  let currentFunction = null;
  let braceCount = 0;
  let inFunction = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(functionPattern);
    
    if (match) {
      // Начало новой функции
      if (currentFunction && inFunction) {
        // Завершаем предыдущую функцию
        currentFunction.endLine = i;
        currentFunction.lines = currentFunction.endLine - currentFunction.startLine;
        functions.push(currentFunction);
      }
      
      currentFunction = {
        name: match[2],
        startLine: i + 1,
        endLine: 0,
        lines: 0,
        isExported: !!match[1]
      };
      inFunction = true;
      braceCount = 0;
    }
    
    if (inFunction && currentFunction) {
      // Считаем фигурные скобки
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceCount += openBraces - closeBraces;
      
      // Если скобки закрылись, функция закончилась
      if (braceCount <= 0 && line.includes('}')) {
        currentFunction.endLine = i + 1;
        currentFunction.lines = currentFunction.endLine - currentFunction.startLine + 1;
        functions.push(currentFunction);
        inFunction = false;
        currentFunction = null;
      }
    }
  }

  // Если функция не закрылась, завершаем её в конце файла
  if (currentFunction && inFunction) {
    currentFunction.endLine = lines.length;
    currentFunction.lines = currentFunction.endLine - currentFunction.startLine + 1;
    functions.push(currentFunction);
  }

  // Сортируем по размеру
  functions.sort((a, b) => b.lines - a.lines);

  console.log('📊 ФУНКЦИИ ПО РАЗМЕРУ:');
  console.log('');

  let totalLines = 0;
  functions.forEach((func, index) => {
    const priority = func.lines > 1000 ? '🔴 КРИТИЧЕСКИЙ' :
                    func.lines > 200 ? '🟡 ОЧЕНЬ ВЫСОКИЙ' :
                    func.lines > 100 ? '🟠 ВЫСОКИЙ' :
                    func.lines > 50 ? '🟡 СРЕДНИЙ' : '🟢 НИЗКИЙ';
    
    const exported = func.isExported ? ' (exported)' : '';
    console.log(`${index + 1}. ${func.name}${exported}: ${func.lines} строк (${func.startLine}-${func.endLine}) ${priority}`);
    totalLines += func.lines;
  });

  console.log('');
  console.log('📈 СТАТИСТИКА:');
  
  const critical = functions.filter(f => f.lines > 1000).length;
  const veryHigh = functions.filter(f => f.lines > 200 && f.lines <= 1000).length;
  const high = functions.filter(f => f.lines > 100 && f.lines <= 200).length;
  const medium = functions.filter(f => f.lines > 50 && f.lines <= 100).length;
  const low = functions.filter(f => f.lines <= 50).length;

  console.log(`🔴 КРИТИЧЕСКИЙ (>1000 строк): ${critical} функций`);
  console.log(`🟡 ОЧЕНЬ ВЫСОКИЙ (200-1000 строк): ${veryHigh} функций`);
  console.log(`🟠 ВЫСОКИЙ (100-200 строк): ${high} функций`);
  console.log(`🟡 СРЕДНИЙ (50-100 строк): ${medium} функций`);
  console.log(`🟢 НИЗКИЙ (<50 строк): ${low} функций`);
  console.log('');
  console.log(`📊 Всего функций: ${functions.length}`);
  console.log(`📏 Строк в функциях: ${totalLines} из ${lines.length} (${Math.round(totalLines/lines.length*100)}%)`);

  // Проверяем дублирование
  console.log('');
  console.log('🔍 ПРОВЕРКА ДУБЛИРОВАНИЯ:');
  
  const moduleFiles = [
    'client/src/lib/bot-generator/keyboards/keyboard-utils.ts',
    'client/src/lib/bot-generator/keyboards/inline-keyboard.ts',
    'client/src/lib/bot-generator/keyboards/reply-keyboard.ts',
    'client/src/lib/bot-generator/utils/string-utils.ts'
  ];

  const duplicates = [];
  
  moduleFiles.forEach(moduleFile => {
    if (fs.existsSync(moduleFile)) {
      const moduleContent = fs.readFileSync(moduleFile, 'utf8');
      const moduleLines = moduleContent.split('\n');
      
      moduleLines.forEach(line => {
        const match = line.match(functionPattern);
        if (match) {
          const funcName = match[2];
          const mainFileFunc = functions.find(f => f.name === funcName);
          if (mainFileFunc) {
            duplicates.push({
              name: funcName,
              mainFile: `${GENERATOR_FILE}:${mainFileFunc.startLine}`,
              moduleFile: moduleFile
            });
          }
        }
      });
    }
  });

  if (duplicates.length > 0) {
    console.log('⚠️ НАЙДЕНЫ ДУБЛИКАТЫ:');
    duplicates.forEach(dup => {
      console.log(`  - ${dup.name}: ${dup.mainFile} ↔ ${dup.moduleFile}`);
    });
  } else {
    console.log('✅ Дубликатов не найдено');
  }

  // Рекомендации
  console.log('');
  console.log('💡 РЕКОМЕНДАЦИИ:');
  
  if (critical > 0) {
    console.log('🔴 СРОЧНО: Разбить критические функции (>1000 строк)');
  }
  
  if (duplicates.length > 0) {
    console.log('⚠️ ВАЖНО: Удалить дублированные функции из основного файла');
  }
  
  if (veryHigh > 0) {
    console.log('🟡 РЕКОМЕНДУЕТСЯ: Вынести очень большие функции (200-1000 строк)');
  }

  return {
    totalFunctions: functions.length,
    totalLines: lines.length,
    functionLines: totalLines,
    critical,
    veryHigh,
    high,
    medium,
    low,
    duplicates: duplicates.length
  };
}

// Запускаем анализ
try {
  const stats = analyzeFunctions();
  
  // Сохраняем результаты в JSON для автоматизации
  const report = {
    timestamp: new Date().toISOString(),
    file: GENERATOR_FILE,
    ...stats
  };
  
  fs.writeFileSync('function-analysis-report.json', JSON.stringify(report, null, 2));
  console.log('');
  console.log('💾 Отчет сохранен в function-analysis-report.json');
  
} catch (error) {
  console.error('❌ Ошибка анализа:', error.message);
  process.exit(1);
}