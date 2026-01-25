import { seedDefaultTemplates } from './server/seed-templates';

async function main() {
  console.log('🔄 Принудительное пересоздание шаблонов...');
  
  try {
    await seedDefaultTemplates(true);
    console.log('✅ Шаблоны успешно пересозданы!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
  
  process.exit(0);
}

main();