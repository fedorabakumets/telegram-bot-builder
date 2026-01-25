import { updateTemplatesWithFixedVariables } from './server/seed-templates.js';

console.log('🔄 Обновляем поля nextNodeId в шаблоне...');
updateTemplatesWithFixedVariables()
  .then(() => {
    console.log('✅ Поля nextNodeId успешно обновлены');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка при обновлении nextNodeId:', error);
    process.exit(1);
  });