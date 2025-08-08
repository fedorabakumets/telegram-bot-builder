import { seedDefaultTemplates } from './server/seed-templates';
import { createPostgreSQLStorage } from './server/storage';

async function main() {
  console.log('🔄 Принудительное пересоздание шаблонов...');
  
  const storage = createPostgreSQLStorage();
  
  try {
    await seedDefaultTemplates(storage, true);
    console.log('✅ Шаблоны успешно пересозданы!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
  
  process.exit(0);
}

main();