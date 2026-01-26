#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Скрипт для анализа всех функций в bot-generator.ts
 * Создает детальный список функций с их размерами и сложностью
 */

const BOT_GENERATOR_PATH = path.join(__dirname, '..', 'client', 'src', 'lib', 'bot-generator.ts');

function analyzeFunctions() {
  console.log('🔍 Анализ функций в bot-generator.ts...\n');
  
  if (!fs.existsSync(BOT_GENERATOR_PATH)) {
    console.error('❌ Файл bot-generator.ts не найден!');
    return;
  }
  
  const content = fs.readFileSync(BOT_GENERATOR_PATH, 'utf8');
  const lines = content.split('\n');
  
  const functions = [];
  let currentFunction = null;
  let braceCount = 0;
  let inFunction = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Поиск начала функции
    const functionMatch = line.match(/^(export\s+)?function\s+(\w+)|^const\s+(\w+)\s*=\s*\(.*?\)\s*:\s*\w+\s*=>\s*{?|^const\s+(\w+)\s*=\s*\(/);
    
    if (functionMatch && !inFunction) {
      const functionName = functionMatch[2] || functionMatch[3] || functionMatch[4];
      currentFunction = {
        name: functionName,
        startLine: lineNumber,
        endLine: null,
        size: 0,
        complexity: 0,
        type: 'function',
        exported: !!functionMatch[1]
      };
      
      // Определяем тип функции
      if (line.includes('const') && line.includes('=>')) {
        currentFunction.type = 'arrow';
      } else if (line.includes('const') && line.includes('(')) {
        currentFunction.type = 'const';
      }
      
      inFunction = true;
      braceCount = 0;
      
      // Считаем открывающие скобки в строке объявления
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
    }
    
    if (inFunction && currentFunction) {
      // Считаем скобки
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      // Считаем сложность (условные операторы, циклы)
      if (line.match(/\b(if|else|for|while|switch|case|catch|try)\b/)) {
        currentFunction.complexity++;
      }
      
      // Если скобки закрылись, функция закончилась
      if (braceCount <= 0 && currentFunction.type !== 'const') {
        currentFunction.endLine = lineNumber;
        currentFunction.size = currentFunction.endLine - currentFunction.startLine + 1;
        functions.push(currentFunction);
        inFunction = false;
        currentFunction = null;
      }
      
      // Для const функций без фигурных скобок
      if (currentFunction.type === 'const' && line.includes(';') && !line.includes('{')) {
        currentFunction.endLine = lineNumber;
        currentFunction.size = currentFunction.endLine - currentFunction.startLine + 1;
        functions.push(currentFunction);
        inFunction = false;
        currentFunction = null;
      }
    }
  }
  
  // Сортируем функции по размеру (от большей к меньшей)
  functions.sort((a, b) => b.size - a.size);
  
  console.log(`📊 Найдено функций: ${functions.length}\n`);
  
  // Статистика
  const totalLines = functions.reduce((sum, fn) => sum + fn.size, 0);
  const avgSize = Math.round(totalLines / functions.length);
  const largestFunction = functions[0];
  const smallestFunction = functions[functions.length - 1];
  
  console.log('📈 СТАТИСТИКА:');
  console.log(`   Общее количество строк в функциях: ${totalLines}`);
  console.log(`   Средний размер функции: ${avgSize} строк`);
  console.log(`   Самая большая функция: ${largestFunction.name} (${largestFunction.size} строк)`);
  console.log(`   Самая маленькая функция: ${smallestFunction.name} (${smallestFunction.size} строк)\n`);
  
  // Категории по размеру
  const huge = functions.filter(f => f.size > 1000);
  const large = functions.filter(f => f.size > 100 && f.size <= 1000);
  const medium = functions.filter(f => f.size > 20 && f.size <= 100);
  const small = functions.filter(f => f.size <= 20);
  
  console.log('📋 КАТЕГОРИИ ПО РАЗМЕРУ:');
  console.log(`   🔴 ОГРОМНЫЕ (>1000 строк): ${huge.length} функций`);
  console.log(`   🟠 БОЛЬШИЕ (100-1000 строк): ${large.length} функций`);
  console.log(`   🟡 СРЕДНИЕ (20-100 строк): ${medium.length} функций`);
  console.log(`   🟢 МАЛЕНЬКИЕ (<20 строк): ${small.length} функций\n`);
  
  // Детальный список всех функций
  console.log('📝 ДЕТАЛЬНЫЙ СПИСОК ФУНКЦИЙ:\n');
  
  functions.forEach((fn, index) => {
    const priority = fn.size > 1000 ? '🔴 КРИТИЧНО' : 
                    fn.size > 100 ? '🟠 ВЫСОКИЙ' :
                    fn.size > 20 ? '🟡 СРЕДНИЙ' : '🟢 НИЗКИЙ';
    
    const complexity = fn.complexity > 20 ? '🔥 ОЧЕНЬ СЛОЖНАЯ' :
                      fn.complexity > 10 ? '⚡ СЛОЖНАЯ' :
                      fn.complexity > 5 ? '📊 СРЕДНЯЯ' : '✅ ПРОСТАЯ';
    
    console.log(`${index + 1}. ${fn.name}`);
    console.log(`   📍 Строки: ${fn.startLine}-${fn.endLine} (${fn.size} строк)`);
    console.log(`   🎯 Приоритет: ${priority}`);
    console.log(`   🧠 Сложность: ${complexity} (${fn.complexity} условий)`);
    console.log(`   📦 Тип: ${fn.type}${fn.exported ? ' (экспортируется)' : ''}`);
    console.log('');
  });
  
  // Рекомендации по рефакторингу
  console.log('💡 РЕКОМЕНДАЦИИ ПО РЕФАКТОРИНГУ:\n');
  
  if (huge.length > 0) {
    console.log('🔴 КРИТИЧЕСКИЕ ФУНКЦИИ (начать с них):');
    huge.forEach(fn => {
      console.log(`   - ${fn.name} (${fn.size} строк) - РАЗБИТЬ НА МОДУЛИ`);
    });
    console.log('');
  }
  
  if (large.length > 0) {
    console.log('🟠 БОЛЬШИЕ ФУНКЦИИ (второй приоритет):');
    large.slice(0, 10).forEach(fn => {
      console.log(`   - ${fn.name} (${fn.size} строк) - извлечь в отдельный модуль`);
    });
    if (large.length > 10) {
      console.log(`   ... и еще ${large.length - 10} функций`);
    }
    console.log('');
  }
  
  console.log('🎯 ПЛАН РЕФАКТОРИНГА:');
  console.log('   1. Начать с самых больших функций (>1000 строк)');
  console.log('   2. Каждую функцию вынести в отдельный модуль');
  console.log('   3. Создать структуру папок по типам функций');
  console.log('   4. Начать с самых простых функций для безопасности');
  console.log('   5. Создать автоматические скрипты для извлечения');
  
  // Сохраняем результат в файл
  const report = {
    timestamp: new Date().toISOString(),
    totalFunctions: functions.length,
    totalLines,
    avgSize,
    categories: {
      huge: huge.length,
      large: large.length,
      medium: medium.length,
      small: small.length
    },
    functions: functions.map(fn => ({
      name: fn.name,
      startLine: fn.startLine,
      endLine: fn.endLine,
      size: fn.size,
      complexity: fn.complexity,
      type: fn.type,
      exported: fn.exported
    }))
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'bot-generator-analysis.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n✅ Анализ завершен! Результат сохранен в bot-generator-analysis.json');
}

if (require.main === module) {
  analyzeFunctions();
}

module.exports = { analyzeFunctions };