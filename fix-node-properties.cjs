#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Скрипт для исправления отсутствующих свойств в типах узлов
 * Добавляет безопасный доступ к свойствам через optional chaining
 */

const BOT_GENERATOR_PATH = 'client/src/lib/bot-generator.ts';

// Список свойств, которые нужно исправить с безопасным доступом
const MISSING_PROPERTIES = [
  'targetGroupId',
  'synonyms', 
  'canSendMessages',
  'canSendMediaMessages',
  'canSendPolls',
  'canSendOtherMessages',
  'canAddWebPagePreviews',
  'canChangeGroupInfo',
  'canInviteUsers2',
  'canPinMessages2',
  'reason',
  'canChangeInfo',
  'canDeleteMessages',
  'canBanUsers',
  'canInviteUsers',
  'canPinMessages',
  'canAddAdmins',
  'canRestrictMembers',
  'canPromoteMembers',
  'canManageVideoChats',
  'canManageTopics',
  'isAnonymous',
  'command',
  'responseType',
  'responseOptions',
  'inputButtonType',
  'allowMultipleSelection',
  'continueButtonText',
  'multiSelectVariable',
  'duration',
  'question',
  'options',
  'allowsMultipleAnswers',
  'emoji'
];

function fixNodeProperties() {
  console.log('🔧 Начинаем исправление отсутствующих свойств узлов...');
  
  // Проверяем существование файла
  if (!fs.existsSync(BOT_GENERATOR_PATH)) {
    console.error(`❌ Файл ${BOT_GENERATOR_PATH} не найден!`);
    process.exit(1);
  }
  
  // Читаем содержимое файла
  let content = fs.readFileSync(BOT_GENERATOR_PATH, 'utf8');
  console.log(`📖 Прочитан файл ${BOT_GENERATOR_PATH} (${content.length} символов)`);
  
  let fixesApplied = 0;
  
  // Исправляем каждое свойство
  MISSING_PROPERTIES.forEach(property => {
    console.log(`🔄 Исправляем свойство: ${property}`);
    
    // Паттерн для поиска прямого доступа к свойству
    const directAccessPattern = new RegExp(`node\\.data\\.${property}(?!\\?)`, 'g');
    const matches = content.match(directAccessPattern);
    
    if (matches) {
      console.log(`  ✅ Найдено ${matches.length} использований свойства ${property}`);
      // Заменяем на безопасный доступ с optional chaining
      content = content.replace(directAccessPattern, `node.data.${property}?`);
      fixesApplied += matches.length;
    }
  });
  
  // Специальные исправления для конкретных случаев
  console.log('🔄 Применяем специальные исправления...');
  
  // Исправляем доступ к свойствам через (node.data as any)
  const specialFixes = [
    {
      pattern: /\(node\.data as any\)\.(\w+)/g,
      replacement: 'node.data.$1?'
    },
    // Исправляем проблемы с ResponseOption
    {
      pattern: /option\.id/g,
      replacement: '(option as any).id'
    },
    // Исправляем проблемы с forEach для строк
    {
      pattern: /lines\.forEach\(\(line: ButtonSchema, index: number\) =>/g,
      replacement: 'lines.forEach((line: string, index: number) =>'
    },
    // Исправляем проблемы с match на строках
    {
      pattern: /line\.match/g,
      replacement: '(line as string).match'
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
  
  // Создаем резервную копию
  const backupPath = BOT_GENERATOR_PATH + '.backup2';
  fs.writeFileSync(backupPath, fs.readFileSync(BOT_GENERATOR_PATH));
  console.log(`💾 Создана резервная копия: ${backupPath}`);
  
  // Записываем исправленный файл
  fs.writeFileSync(BOT_GENERATOR_PATH, content);
  
  console.log(`✅ Исправления применены успешно!`);
  console.log(`📊 Всего исправлений: ${fixesApplied}`);
  console.log(`💾 Файл сохранен: ${BOT_GENERATOR_PATH}`);
  console.log(`🔙 Резервная копия: ${backupPath}`);
  
  if (fixesApplied === 0) {
    console.log('ℹ️  Возможно, все свойства уже исправлены или паттерны не найдены.');
  }
}

// Запускаем скрипт
if (require.main === module) {
  fixNodeProperties();
}

module.exports = { fixNodeProperties };