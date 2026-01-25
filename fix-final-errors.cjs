#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Скрипт для исправления финальных ошибок TypeScript
 */

function fixBotGenerator() {
  const filePath = 'client/src/lib/bot-generator.ts';
  console.log(`🔧 Исправляем финальные ошибки в: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fixesApplied = 0;
  
  // Создаем резервную копию
  const backupPath = filePath + '.backup4';
  fs.writeFileSync(backupPath, content);
  
  // Исправляем конкретные проблемы
  const fixes = [
    // Исправляем строки с неправильными скобками в массивах
    {
      pattern: /const synonyms = \(node\.data\.synonyms \?\? \['([^']+)'\), '([^']+)', '([^']+)'\];/g,
      replacement: "const synonyms = node.data.synonyms ?? ['$1', '$2', '$3'];"
    },
    // Исправляем строки с неправильными скобками в строках
    {
      pattern: /const synonyms = \(node\.data\.synonyms \?\? '([^']+)'\), ([^;]+);/g,
      replacement: "const synonyms = node.data.synonyms ?? '$1, $2';"
    },
    // Исправляем canInviteUsers2 и canPinMessages2
    {
      pattern: /const canInviteUsers2 = node\.data\.canInviteUsers\?2\? \|\| false;/g,
      replacement: 'const canInviteUsers2 = node.data.canInviteUsers2 ?? false;'
    },
    {
      pattern: /const canPinMessages2 = node\.data\.canPinMessages\?2\? \|\| false;/g,
      replacement: 'const canPinMessages2 = node.data.canPinMessages2 ?? false;'
    },
    // Исправляем строки в template literals
    {
      pattern: /\$\{node\.data\.command\?\}/g,
      replacement: '${node.data.command ?? ""}'
    },
    // Исправляем неправильные скобки в template literals
    {
      pattern: /\$\{\(node\.data\.command \?\? '([^']+)'\}\n`\);/g,
      replacement: '${node.data.command ?? "$1"}\n`;'
    },
    // Исправляем responseOptions?
    {
      pattern: /node\.data\.responseOptions\?\,/g,
      replacement: 'node.data.responseOptions,'
    },
    // Исправляем allowMultipleSelection в логах
    {
      pattern: /\$\{node\.data\.allowMultipleSelection\?\}/g,
      replacement: '${node.data.allowMultipleSelection ?? false}'
    },
    // Исправляем проблемы с условиями
    {
      pattern: /\)\s*Array\.isArray\(node\.data\.responseOptions\)/g,
      replacement: ') && Array.isArray(node.data.responseOptions)'
    },
    // Исправляем ошибки в командах
    {
      pattern: /\$\{node\.data\.command\?\}": \$\{err\}/g,
      replacement: '${node.data.command ?? ""}": ${err}'
    }
  ];
  
  fixes.forEach((fix, index) => {
    const matches = content.match(fix.pattern);
    if (matches) {
      console.log(`  ✅ Найдено ${matches.length} совпадений для исправления ${index + 1}`);
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

function fixBotPreview() {
  const filePath = 'client/src/pages/bot-preview.tsx';
  console.log(`🔧 Исправляем финальные ошибки в: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fixesApplied = 0;
  
  // Создаем резервную копию
  const backupPath = filePath + '.backup4';
  fs.writeFileSync(backupPath, content);
  
  // Исправляем конкретные проблемы
  const fixes = [
    // Исправляем неправильные скобки в options
    {
      pattern: /options: \(node\.data\.options \?\? \['([^']+)'\]\), '([^']+)'\]/g,
      replacement: "options: node.data.options ?? ['$1', '$2']"
    },
    // Исправляем isAnonymous
    {
      pattern: /isAnonymous: \(node\.data\.isAnonymous \?\? true\),/g,
      replacement: 'isAnonymous: node.data.isAnonymous ?? true,'
    }
  ];
  
  fixes.forEach((fix, index) => {
    const matches = content.match(fix.pattern);
    if (matches) {
      console.log(`  ✅ Найдено ${matches.length} совпадений для исправления ${index + 1}`);
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

function fixFinalErrors() {
  console.log('🔧 Начинаем исправление финальных ошибок TypeScript...');
  
  let totalFixes = 0;
  
  totalFixes += fixBotGenerator();
  totalFixes += fixBotPreview();
  
  console.log(`✅ Все финальные исправления применены!`);
  console.log(`📊 Всего исправлений: ${totalFixes}`);
}

// Запускаем скрипт
if (require.main === module) {
  fixFinalErrors();
}

module.exports = { fixFinalErrors };