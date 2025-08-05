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

    // Создаем базовый шаблон с опциями выбора
    await storage.createBotTemplate({
      name: "Базовый шаблон с выборами",
      description: "Простой бот с меню выбора и разными сценариями без полей ввода",
      category: "business",
      tags: ["выбор", "меню", "простой"],
      isPublic: 1,
      difficulty: "easy",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 2,
      estimatedTime: 5,
      data: {
        nodes: [
          {
            id: "start",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Стартовое сообщение",
              messageText: "Добро пожаловать! 👋\n\nВыберите интересующий вас раздел:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-1",
                  text: "🔥 Популярное",
                  action: "goto",
                  target: "popular"
                },
                {
                  id: "btn-2", 
                  text: "📚 Каталог",
                  action: "goto",
                  target: "catalog"
                },
                {
                  id: "btn-3",
                  text: "ℹ️ О нас",
                  action: "goto", 
                  target: "about"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "popular",
            type: "message",
            position: { x: 400, y: 50 },
            data: {
              messageText: "🔥 Популярные разделы:\n\nВот самые востребованные категории:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-p1",
                  text: "⭐ Топ товары",
                  action: "goto",
                  target: "top-products"
                },
                {
                  id: "btn-p2",
                  text: "🎯 Акции",
                  action: "goto", 
                  target: "promotions"
                },
                {
                  id: "btn-back1",
                  text: "◀️ Назад в меню",
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
            id: "catalog",
            type: "message", 
            position: { x: 400, y: 150 },
            data: {
              messageText: "📚 Каталог товаров:\n\nВыберите категорию:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-c1",
                  text: "👕 Одежда",
                  action: "goto",
                  target: "clothes"
                },
                {
                  id: "btn-c2",
                  text: "📱 Электроника",
                  action: "goto",
                  target: "electronics"
                },
                {
                  id: "btn-c3",
                  text: "🏠 Дом и сад",
                  action: "goto",
                  target: "home"
                },
                {
                  id: "btn-back2",
                  text: "◀️ Назад в меню",
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
            id: "about",
            type: "message",
            position: { x: 400, y: 250 },
            data: {
              messageText: "ℹ️ О нашей компании:\n\nМы работаем с 2020 года и предлагаем качественные товары по доступным ценам.\n\n✅ Быстрая доставка\n✅ Гарантия качества\n✅ Поддержка 24/7",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-contact",
                  text: "📞 Связаться с нами",
                  action: "goto",
                  target: "contact"
                },
                {
                  id: "btn-back3",
                  text: "◀️ Назад в меню",
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
            id: "top-products",
            type: "message",
            position: { x: 700, y: 50 },
            data: {
              messageText: "⭐ Топ товары:\n\n1. Смартфон XYZ - 25,000₽\n2. Ноутбук ABC - 45,000₽\n3. Наушники DEF - 5,000₽",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-order1",
                  text: "🛒 Заказать",
                  action: "goto",
                  target: "order-info"
                },
                {
                  id: "btn-back-pop",
                  text: "◀️ К популярному",
                  action: "goto",
                  target: "popular"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "promotions",
            type: "message",
            position: { x: 700, y: 150 },
            data: {
              messageText: "🎯 Текущие акции:\n\n🔥 Скидка 20% на электронику\n🎁 Подарок при покупке от 10,000₽\n📦 Бесплатная доставка от 5,000₽",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-promo-details",
                  text: "📋 Подробнее",
                  action: "goto",
                  target: "promo-details"
                },
                {
                  id: "btn-back-pop2",
                  text: "◀️ К популярному",
                  action: "goto",
                  target: "popular"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "clothes",
            type: "message",
            position: { x: 700, y: 250 },
            data: {
              messageText: "👕 Одежда:\n\nУ нас большой выбор качественной одежды:\n\n👔 Мужская одежда\n👗 Женская одежда\n👶 Детская одежда",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-men",
                  text: "👔 Мужская",
                  action: "goto",
                  target: "men-clothes"
                },
                {
                  id: "btn-women",
                  text: "👗 Женская",
                  action: "goto",
                  target: "women-clothes"
                },
                {
                  id: "btn-back-cat1",
                  text: "◀️ К каталогу",
                  action: "goto",
                  target: "catalog"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "electronics",
            type: "message",
            position: { x: 700, y: 350 },
            data: {
              messageText: "📱 Электроника:\n\nШирокий ассортимент электроники:\n\n📱 Смартфоны\n💻 Ноутбуки\n🎧 Аудио техника",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-phones",
                  text: "📱 Смартфоны",
                  action: "goto",
                  target: "phones"
                },
                {
                  id: "btn-laptops",
                  text: "💻 Ноутбуки",
                  action: "goto",
                  target: "laptops"
                },
                {
                  id: "btn-back-cat2",
                  text: "◀️ К каталогу",
                  action: "goto",
                  target: "catalog"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "contact",
            type: "message",
            position: { x: 700, y: 450 },
            data: {
              messageText: "📞 Контактная информация:\n\n📧 Email: support@example.com\n📱 Телефон: +7 (999) 123-45-67\n⏰ Время работы: 9:00 - 21:00\n📍 Адрес: г. Москва, ул. Примерная, 123",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-back-about",
                  text: "◀️ О компании",
                  action: "goto",
                  target: "about"
                },
                {
                  id: "btn-main-menu",
                  text: "🏠 Главное меню",
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
            id: "order-info",
            type: "message",
            position: { x: 1000, y: 100 },
            data: {
              messageText: "🛒 Информация о заказе:\n\nДля оформления заказа свяжитесь с нашими менеджерами:\n\n📞 +7 (999) 123-45-67\n📧 orders@example.com\n\nИли воспользуйтесь нашим сайтом!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-back-top",
                  text: "◀️ К топ товарам",
                  action: "goto",
                  target: "top-products"
                },
                {
                  id: "btn-main-menu2",
                  text: "🏠 Главное меню",
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
            targetNodeId: "popular",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-2", 
            sourceNodeId: "start",
            targetNodeId: "catalog",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-3",
            sourceNodeId: "start",
            targetNodeId: "about",
            sourceHandle: "source", 
            targetHandle: "target"
          },
          {
            id: "conn-4",
            sourceNodeId: "popular",
            targetNodeId: "top-products",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-5",
            sourceNodeId: "popular", 
            targetNodeId: "promotions",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-6",
            sourceNodeId: "catalog",
            targetNodeId: "clothes",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-7",
            sourceNodeId: "catalog",
            targetNodeId: "electronics", 
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-8",
            sourceNodeId: "about",
            targetNodeId: "contact",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-9",
            sourceNodeId: "top-products",
            targetNodeId: "order-info",
            sourceHandle: "source",
            targetHandle: "target"
          }
        ]
      }
    });

    console.log('✅ Базовый шаблон с выборами создан');
    console.log('✅ Системные шаблоны созданы');
  } catch (error) {
    console.error('Ошибка при создании шаблонов:', error);
  }
}