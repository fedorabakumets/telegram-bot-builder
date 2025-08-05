import { storage } from "./storage";

// Стандартные шаблоны для демонстрации
export async function seedDefaultTemplates(force = false) {
  try {
    console.log(`📋 seedDefaultTemplates вызван с force=${force}`);
    const existingTemplates = await storage.getAllBotTemplates();
    
    // Проверяем, есть ли уже системные шаблоны
    const systemTemplates = existingTemplates.filter(t => t.authorName === 'Система');
    console.log(`📊 Найдено ${systemTemplates.length} системных шаблонов`);
    
    if (force) {
      console.log('🔄 Принудительное обновление системных шаблонов...');
      // Удаляем существующие системные шаблоны
      for (const template of systemTemplates) {
        await storage.deleteBotTemplate(template.id);
      }
      console.log(`🗑️ Удалено ${systemTemplates.length} старых системных шаблонов`);
    } else if (systemTemplates.length >= 1) {
      console.log('Системные шаблоны уже существуют, пропускаем инициализацию');
      return;
    }

    console.log('✅ Системные шаблоны очищены');
  } catch (error) {
    console.error('Ошибка при создании шаблонов:', error);
  }
}