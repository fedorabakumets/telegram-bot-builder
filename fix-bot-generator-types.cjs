#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Скрипт для автоматического исправления проблем с типизацией в bot-generator.ts
 * Исправляет неявные типы any в функциях обратного вызова (forEach, map, filter)
 */

const BOT_GENERATOR_PATH = 'client/src/lib/bot-generator.ts';

// Паттерны для поиска и замены неявных типов any
const FIXES = [
  // forEach с кнопками
  {
    pattern: /\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: '.forEach(($1: ButtonSchema) =>'
  },
  {
    pattern: /\.forEach\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: '.forEach(($1: ButtonSchema, $2: number) =>'
  },
  
  // forEach с узлами
  {
    pattern: /nodes\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'nodes.forEach(($1: Node) =>'
  },
  {
    pattern: /nodes\.forEach\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: 'nodes.forEach(($1: Node, $2: number) =>'
  },
  
  // forEach с листами (sheets)
  {
    pattern: /sheets\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'sheets.forEach(($1: Sheet) =>'
  },
  {
    pattern: /sheets\.forEach\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: 'sheets.forEach(($1: Sheet, $2: number) =>'
  },
  
  // forEach с условными сообщениями
  {
    pattern: /conditionalMessages\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'conditionalMessages.forEach(($1: ConditionalMessage) =>'
  },
  {
    pattern: /conditionalMessages\.forEach\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: 'conditionalMessages.forEach(($1: ConditionalMessage, $2: number) =>'
  },
  
  // forEach с соединениями
  {
    pattern: /connections\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'connections.forEach(($1: Connection) =>'
  },
  {
    pattern: /connections\.forEach\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: 'connections.forEach(($1: Connection, $2: number) =>'
  },
  
  // map с кнопками
  {
    pattern: /\.map\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: '.map(($1: ButtonSchema) =>'
  },
  {
    pattern: /\.map\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: '.map(($1: ButtonSchema, $2: number) =>'
  },
  
  // map с узлами
  {
    pattern: /nodes\.map\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'nodes.map(($1: Node) =>'
  },
  {
    pattern: /nodes\.map\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: 'nodes.map(($1: Node, $2: number) =>'
  },
  
  // filter с кнопками
  {
    pattern: /\.filter\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: '.filter(($1: ButtonSchema) =>'
  },
  {
    pattern: /\.filter\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: '.filter(($1: ButtonSchema, $2: number) =>'
  },
  
  // filter с узлами
  {
    pattern: /nodes\.filter\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'nodes.filter(($1: Node) =>'
  },
  {
    pattern: /nodes\.filter\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: 'nodes.filter(($1: Node, $2: number) =>'
  },
  
  // some с кнопками
  {
    pattern: /\.some\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: '.some(($1: ButtonSchema) =>'
  },
  {
    pattern: /\.some\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: '.some(($1: ButtonSchema, $2: number) =>'
  },
  
  // some с узлами
  {
    pattern: /nodes\.some\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'nodes.some(($1: Node) =>'
  },
  {
    pattern: /nodes\.some\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: 'nodes.some(($1: Node, $2: number) =>'
  },
  
  // every с кнопками
  {
    pattern: /\.every\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: '.every(($1: ButtonSchema) =>'
  },
  {
    pattern: /\.every\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: '.every(($1: ButtonSchema, $2: number) =>'
  },
  
  // every с узлами
  {
    pattern: /nodes\.every\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'nodes.every(($1: Node) =>'
  },
  {
    pattern: /nodes\.every\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: 'nodes.every(($1: Node, $2: number) =>'
  },
  
  // find с кнопками
  {
    pattern: /\.find\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: '.find(($1: ButtonSchema) =>'
  },
  {
    pattern: /\.find\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: '.find(($1: ButtonSchema, $2: number) =>'
  },
  
  // find с узлами
  {
    pattern: /nodes\.find\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'nodes.find(($1: Node) =>'
  },
  {
    pattern: /nodes\.find\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    replacement: 'nodes.find(($1: Node, $2: number) =>'
  },
  
  // Специальные случаи для allNodeIds
  {
    pattern: /allNodeIds\.filter\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'allNodeIds.filter(($1: string) =>'
  },
  {
    pattern: /allNodeIds\.map\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'allNodeIds.map(($1: string) =>'
  },
  
  // Специальные случаи для modes массива
  {
    pattern: /modes\.map\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'modes.map(($1: string) =>'
  },
  
  // Специальные случаи для foundMedia массива
  {
    pattern: /foundMedia\.some\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'foundMedia.some(($1: { variable: string; type: string }) =>'
  }
];

// Дополнительные исправления для специфических контекстов
const CONTEXT_FIXES = [
  // Исправления для работы с user_vars
  {
    pattern: /user_vars\.items\(\)\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'user_vars.items().forEach(($1: [string, any]) =>'
  },
  
  // Исправления для работы с selections
  {
    pattern: /selections_str\.split\(","\)\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'selections_str.split(",").forEach(($1: string) =>'
  },
  
  // Исправления для работы с массивами строк
  {
    pattern: /saved_selections\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>/g,
    replacement: 'saved_selections.forEach(($1: string) =>'
  }
];

function fixBotGeneratorTypes() {
  console.log('🔧 Начинаем автоматическое исправление типов в bot-generator.ts...');
  
  // Проверяем существование файла
  if (!fs.existsSync(BOT_GENERATOR_PATH)) {
    console.error(`❌ Файл ${BOT_GENERATOR_PATH} не найден!`);
    process.exit(1);
  }
  
  // Читаем содержимое файла
  let content = fs.readFileSync(BOT_GENERATOR_PATH, 'utf8');
  console.log(`📖 Прочитан файл ${BOT_GENERATOR_PATH} (${content.length} символов)`);
  
  let fixesApplied = 0;
  
  // Применяем основные исправления
  console.log('🔄 Применяем основные исправления типов...');
  FIXES.forEach((fix, index) => {
    const matches = content.match(fix.pattern);
    if (matches) {
      console.log(`  ✅ Найдено ${matches.length} совпадений для паттерна ${index + 1}`);
      content = content.replace(fix.pattern, fix.replacement);
      fixesApplied += matches.length;
    }
  });
  
  // Применяем контекстные исправления
  console.log('🔄 Применяем контекстные исправления...');
  CONTEXT_FIXES.forEach((fix, index) => {
    const matches = content.match(fix.pattern);
    if (matches) {
      console.log(`  ✅ Найдено ${matches.length} контекстных совпадений для паттерна ${index + 1}`);
      content = content.replace(fix.pattern, fix.replacement);
      fixesApplied += matches.length;
    }
  });
  
  // Специальные исправления для конкретных случаев в bot-generator.ts
  console.log('🔄 Применяем специальные исправления...');
  
  // Исправляем forEach для buttons в различных контекстах
  const buttonForEachPatterns = [
    {
      pattern: /node\.data\.buttons\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>/g,
      replacement: 'node.data.buttons.forEach(($1: Button) =>'
    },
    {
      pattern: /node\.data\.buttons\.forEach\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
      replacement: 'node.data.buttons.forEach(($1: Button, $2: number) =>'
    },
    {
      pattern: /buttons\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>/g,
      replacement: 'buttons.forEach(($1: ButtonSchema) =>'
    },
    {
      pattern: /buttons\.forEach\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
      replacement: 'buttons.forEach(($1: ButtonSchema, $2: number) =>'
    }
  ];
  
  buttonForEachPatterns.forEach((fix, index) => {
    const matches = content.match(fix.pattern);
    if (matches) {
      console.log(`  ✅ Найдено ${matches.length} специальных совпадений для кнопок ${index + 1}`);
      content = content.replace(fix.pattern, fix.replacement);
      fixesApplied += matches.length;
    }
  });
  
  // Исправляем forEach для условных сообщений
  const conditionalMessagePatterns = [
    {
      pattern: /node\.data\.conditionalMessages\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>/g,
      replacement: 'node.data.conditionalMessages.forEach(($1: ConditionalMessage) =>'
    },
    {
      pattern: /conditions\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>/g,
      replacement: 'conditions.forEach(($1: ConditionalMessage) =>'
    },
    {
      pattern: /cond\.buttons\.forEach\(\s*\(\s*(\w+)\s*\)\s*=>/g,
      replacement: 'cond.buttons.forEach(($1: Button) =>'
    }
  ];
  
  conditionalMessagePatterns.forEach((fix, index) => {
    const matches = content.match(fix.pattern);
    if (matches) {
      console.log(`  ✅ Найдено ${matches.length} специальных совпадений для условных сообщений ${index + 1}`);
      content = content.replace(fix.pattern, fix.replacement);
      fixesApplied += matches.length;
    }
  });
  
  // Создаем резервную копию
  const backupPath = BOT_GENERATOR_PATH + '.backup';
  fs.writeFileSync(backupPath, fs.readFileSync(BOT_GENERATOR_PATH));
  console.log(`💾 Создана резервная копия: ${backupPath}`);
  
  // Записываем исправленный файл
  fs.writeFileSync(BOT_GENERATOR_PATH, content);
  
  console.log(`✅ Исправления применены успешно!`);
  console.log(`📊 Всего исправлений: ${fixesApplied}`);
  console.log(`💾 Файл сохранен: ${BOT_GENERATOR_PATH}`);
  console.log(`🔙 Резервная копия: ${backupPath}`);
  
  if (fixesApplied === 0) {
    console.log('ℹ️  Возможно, все типы уже исправлены или паттерны не найдены.');
  }
}

// Запускаем скрипт
if (require.main === module) {
  fixBotGeneratorTypes();
}

module.exports = { fixBotGeneratorTypes };