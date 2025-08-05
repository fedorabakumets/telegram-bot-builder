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

    // Создаем шаблон со сбором интересов
    await storage.createBotTemplate({
      name: "Сбор интересов пользователя",
      description: "Шаблон для сбора интересов пользователя с множественным выбором",
      category: "utility",
      tags: ["интересы", "сбор данных", "множественный выбор"],
      isPublic: 1,
      difficulty: "easy",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 2,
      estimatedTime: 3,
      data: {
        nodes: [
          {
            id: "start",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Сбор интересов",
              messageText: "👋 Добро пожаловать!\n\nРасскажите нам о ваших интересах. Выберите все, что вам подходит:",
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "user_interests",
              continueButtonTarget: "interests_result",
              buttons: [
                {
                  id: "btn-sport",
                  text: "⚽ Спорт",
                  action: "selection",
                  buttonType: "option",
                  target: "sport"
                },
                {
                  id: "btn-music",
                  text: "🎵 Музыка",
                  action: "selection",
                  buttonType: "option",
                  target: "music"
                },
                {
                  id: "btn-books",
                  text: "📚 Книги",
                  action: "selection",
                  buttonType: "option",
                  target: "books"
                },
                {
                  id: "btn-travel",
                  text: "✈️ Путешествия",
                  action: "selection",
                  buttonType: "option",
                  target: "travel"
                },
                {
                  id: "btn-tech",
                  text: "💻 Технологии",
                  action: "selection",
                  buttonType: "option",
                  target: "tech"
                },
                {
                  id: "btn-cooking",
                  text: "🍳 Кулинария",
                  action: "selection",
                  buttonType: "option",
                  target: "cooking"
                },
                {
                  id: "btn-art",
                  text: "🎨 Искусство",
                  action: "selection",
                  buttonType: "option",
                  target: "art"
                },
                {
                  id: "btn-games",
                  text: "🎮 Игры",
                  action: "selection",
                  buttonType: "option",
                  target: "games"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "interests_result",
            type: "message",
            position: { x: 400, y: 100 },
            data: {
              messageText: "🎯 Ваши интересы:\n\n{user_interests}\n\nСпасибо за информацию! Теперь мы сможем предложить вам более подходящий контент.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-continue",
                  text: "👍 Продолжить",
                  action: "goto",
                  target: "final_message"
                },
                {
                  id: "btn-edit",
                  text: "✏️ Изменить выбор",
                  action: "goto",
                  target: "start"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "final_message",
            type: "message",
            position: { x: 700, y: 100 },
            data: {
              messageText: "✅ Отлично! Ваши предпочтения сохранены.\n\nТеперь вы будете получать персонализированные рекомендации на основе ваших интересов.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-restart",
                  text: "🔄 Начать заново",
                  action: "goto",
                  target: "start"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          }
        ],
        connections: [
          {
            id: "conn-1",
            sourceNodeId: "start",
            targetNodeId: "interests_result",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-2",
            sourceNodeId: "interests_result",
            targetNodeId: "final_message",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-3",
            sourceNodeId: "interests_result",
            targetNodeId: "start",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-4",
            sourceNodeId: "final_message",
            targetNodeId: "start",
            sourceHandle: "source",
            targetHandle: "target"
          }
        ]
      }
    });

    console.log('✅ Шаблон сбора интересов создан');
    console.log('✅ Системные шаблоны созданы');

  } catch (error) {
    console.error('Ошибка при создании шаблонов:', error);
  }
}