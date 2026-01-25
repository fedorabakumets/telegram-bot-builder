#!/usr/bin/env node

/**
 * Скрипт для отката разбиения главной функции generatePythonCode
 */

const fs = require('fs');

console.log('🔄 Откат разбиения главной функции...');

if (fs.existsSync('client/src/lib/bot-generator.ts.backup-main-split')) {
  fs.copyFileSync('client/src/lib/bot-generator.ts.backup-main-split', 'client/src/lib/bot-generator.ts');
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
      console.log(`🗑️ Удален модуль: ${module}`);
    }
  });
  
  console.log('📊 Монолитная функция generatePythonCode восстановлена');
} else {
  console.log('❌ Резервная копия не найдена!');
  process.exit(1);
}
