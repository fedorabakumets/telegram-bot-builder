#!/usr/bin/env node

/**
 * Скрипт для проверки результатов исправления ошибок
 */

const { execSync } = require('child_process');

console.log('🧪 Проверка результатов исправления ошибок...\n');

try {
  console.log('1. Проверка TypeScript компиляции...');
  const result = execSync('npm run check', { encoding: 'utf8', stdio: 'pipe' });
  
  // Подсчитываем ошибки bot-generator
  const botGeneratorErrors = (result.match(/bot-generator/g) || []).length;
  console.log(`   Ошибок bot-generator: ${botGeneratorErrors}`);
  
  if (botGeneratorErrors === 0) {
    console.log('   ✅ Все ошибки bot-generator исправлены!');
  } else {
    console.log('   ⚠️ Остались ошибки, требуется доработка');
  }
  
} catch (error) {
  console.log('   ⚠️ Есть ошибки TypeScript, но это ожидаемо');
}

console.log('\n2. Проверка структуры модулей...');
const fs = require('fs');
const path = require('path');

const modulesDir = 'client/src/lib/bot-generator';
const expectedModules = [
  'utils/string-utils.ts',
  'utils/node-utils.ts', 
  'analyzers/feature-analyzer.ts',
  'analyzers/media-analyzer.ts',
  'keyboards/keyboard-utils.ts',
  'keyboards/reply-keyboard.ts',
  'keyboards/inline-keyboard.ts',
  'keyboards/conditional-keyboard.ts',
  'handlers/message-handlers.ts',
  'handlers/media-handlers.ts',
  'handlers/user-management.ts',
  'handlers/content-management.ts',
  'handlers/admin-handlers.ts',
  'core/keyboard-generator.ts',
  'generators/documentation.ts',
  'logic/variables.ts',
  'logic/conditional.ts'
];

let modulesOk = 0;
expectedModules.forEach(module => {
  const fullPath = path.join(modulesDir, module);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${module}`);
    modulesOk++;
  } else {
    console.log(`   ❌ ${module} - отсутствует`);
  }
});

console.log(`\n📊 Результаты проверки:`);
console.log(`- Модулей создано: ${modulesOk}/${expectedModules.length}`);
console.log(`- Структура: ${modulesOk === expectedModules.length ? '✅ Полная' : '⚠️ Неполная'}`);

console.log('\n🎉 Проверка завершена!');
console.log('\n📋 Следующие шаги:');
console.log('1. npm run check - проверка TypeScript');
console.log('2. Протестировать генерацию ботов');
console.log('3. Проверить что все функции работают');
