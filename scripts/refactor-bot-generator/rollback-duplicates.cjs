#!/usr/bin/env node

/**
 * Скрипт для отката удаления дублированных функций
 */

const fs = require('fs');

console.log('🔄 Откат удаления дублированных функций...');

if (fs.existsSync('client/src/lib/bot-generator.ts.backup-duplicates')) {
  fs.copyFileSync('client/src/lib/bot-generator.ts.backup-duplicates', 'client/src/lib/bot-generator.ts');
  console.log('✅ Файл восстановлен из резервной копии');
  console.log('📊 Дублированные функции восстановлены');
} else {
  console.log('❌ Резервная копия не найдена!');
  process.exit(1);
}
