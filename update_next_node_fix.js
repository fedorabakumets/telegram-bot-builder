import { updateTemplatesWithFixedVariables } from './server/seed-templates.js';

console.log('🔄 Обновляем шаблоны с исправленными nextNodeId...');
updateTemplatesWithFixedVariables()
  .then(() => {
    console.log('✅ Шаблоны обновлены с правильными переходами');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка при обновлении:', error);
    process.exit(1);
  });