const { seedDefaultTemplates } = require('./server/seed-templates.ts');
const { createPostgreSQLStorage } = require('./server/storage.ts');

async function recreateTemplates() {
  try {
    console.log('Создаем подключение к базе данных...');
    const storage = createPostgreSQLStorage();
    
    console.log('Удаляем старые шаблоны VProgulke Bot...');
    await storage.db.delete(storage.botTemplatesTable).where(
      storage.sql`name LIKE '%VProgulke Bot%'`
    );
    
    console.log('Пересоздаем шаблоны с исправленными полями...');
    await seedDefaultTemplates(storage, true);
    
    console.log('✅ Шаблоны успешно пересозданы!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при пересоздании шаблонов:', error);
    process.exit(1);
  }
}

recreateTemplates();