#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Скрипт для исправления неправильного optional chaining
 * Заменяет property? || defaultValue на (property ?? defaultValue)
 */

const FILES_TO_FIX = [
  'client/src/lib/bot-generator.ts',
  'client/src/pages/bot-preview.tsx'
];

function fixOptionalChaining(filePath) {
  console.log(`🔧 Исправляем optional chaining в: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл ${filePath} не найден, пропускаем`);
    return 0;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fixesApplied = 0;
  
  // Создаем резервную копию
  const backupPath = filePath + '.backup3';
  fs.writeFileSync(backupPath, content);
  
  // Исправляем неправильный синтаксис property? || defaultValue
  const patterns = [
    // Основной паттерн: property? || defaultValue
    {
      pattern: /(\w+\.data\.\w+)\?\s*\|\|\s*([^;,\n\)]+)/g,
      replacement: '($1 ?? $2)'
    },
    // Паттерн для !== сравнений: property? !== value
    {
      pattern: /(\w+\.data\.\w+)\?\s*(!==)\s*([^;,\n\)]+)/g,
      replacement: '($1 $2 $3)'
    },
    // Паттерн для === сравнений: property? === value
    {
      pattern: /(\w+\.data\.\w+)\?\s*(===)\s*([^;,\n\)]+)/g,
      replacement: '($1 $2 $3)'
    },
    // Паттерн для простых условий: if (property?)
    {
      pattern: /if\s*\(\s*(\w+\.data\.\w+)\?\s*\)/g,
      replacement: 'if ($1)'
    },
    // Паттерн для логических операций: property? &&
    {
      pattern: /(\w+\.data\.\w+)\?\s*&&/g,
      replacement: '$1 &&'
    },
    // Паттерн для одиночных property? в конце строки
    {
      pattern: /(\w+\.data\.\w+)\?\s*;/g,
      replacement: '$1;'
    },
    // Паттерн для property? в условиях
    {
      pattern: /(\w+\.data\.\w+)\?\s*\)/g,
      replacement: '$1)'
    }
  ];
  
  patterns.forEach((fix, index) => {
    const matches = content.match(fix.pattern);
    if (matches) {
      console.log(`  ✅ Найдено ${matches.length} совпадений для паттерна ${index + 1}`);
      content = content.replace(fix.pattern, fix.replacement);
      fixesApplied += matches.length;
    }
  });
  
  // Специальные исправления для конкретных случаев
  const specialFixes = [
    // Исправляем duration: node.data.duration
    {
      pattern: /duration:\s*node\.data\.duration\?\s*$/gm,
      replacement: 'duration: node.data.duration'
    },
    // Исправляем emoji: node.data.emoji
    {
      pattern: /emoji:\s*node\.data\.emoji\?\s*$/gm,
      replacement: 'emoji: node.data.emoji'
    }
  ];
  
  specialFixes.forEach((fix, index) => {
    const matches = content.match(fix.pattern);
    if (matches) {
      console.log(`  ✅ Найдено ${matches.length} специальных совпадений ${index + 1}`);
      content = content.replace(fix.pattern, fix.replacement);
      fixesApplied += matches.length;
    }
  });
  
  // Записываем исправленный файл
  fs.writeFileSync(filePath, content);
  
  console.log(`  📊 Применено исправлений: ${fixesApplied}`);
  console.log(`  💾 Резервная копия: ${backupPath}`);
  
  return fixesApplied;
}

function fixAllOptionalChaining() {
  console.log('🔧 Начинаем исправление неправильного optional chaining...');
  
  let totalFixes = 0;
  
  FILES_TO_FIX.forEach(filePath => {
    const fixes = fixOptionalChaining(filePath);
    totalFixes += fixes;
  });
  
  console.log(`✅ Все исправления применены!`);
  console.log(`📊 Всего исправлений: ${totalFixes}`);
}

// Запускаем скрипт
if (require.main === module) {
  fixAllOptionalChaining();
}

module.exports = { fixAllOptionalChaining };