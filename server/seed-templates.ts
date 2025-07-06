import { storage } from "./storage";

// Стандартные шаблоны для демонстрации
export async function seedDefaultTemplates() {
  try {
    const existingTemplates = await storage.getAllBotTemplates();
    
    // Проверяем, есть ли уже системные шаблоны
    const systemTemplates = existingTemplates.filter(t => t.authorName === 'Система');
    if (systemTemplates.length >= 4) {
      console.log('Системные шаблоны уже существуют, пропускаем инициализацию');
      return;
    }

    // Простой информационный бот
    await storage.createBotTemplate({
      name: "Простой информационный бот",
      description: "Базовый бот для предоставления информации с главным меню и командами",
      category: "business",
      tags: ["информация", "меню", "базовый"],
      isPublic: 1,
      difficulty: "easy",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 3,
      estimatedTime: 10,
      data: {
        nodes: [
          {
            id: "start-1",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Приветствие пользователя",
              messageText: "Добро пожаловать! 👋\n\nЯ информационный бот. Выберите, что вас интересует:",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-1",
                  text: "📋 Информация",
                  action: "goto",
                  target: "info-1"
                },
                {
                  id: "btn-2",
                  text: "📞 Контакты",
                  action: "goto",
                  target: "contacts-1"
                },
                {
                  id: "btn-3",
                  text: "❓ Помощь",
                  action: "command",
                  target: "/help"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "info-1",
            type: "message",
            position: { x: 350, y: 100 },
            data: {
              messageText: "ℹ️ **Информация о нас**\n\nМы предоставляем качественные услуги и всегда готовы помочь нашим клиентам.",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-back-1",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              markdown: true,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "contacts-1",
            type: "message",
            position: { x: 350, y: 250 },
            data: {
              messageText: "📞 **Наши контакты:**\n\n📧 Email: info@example.com\n📱 Телефон: +7 (999) 123-45-67\n🌐 Сайт: example.com",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-back-2",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              markdown: true,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "help-1",
            type: "command",
            position: { x: 100, y: 250 },
            data: {
              command: "/help",
              description: "Справка по боту",
              messageText: "❓ **Справка**\n\nИспользуйте кнопки меню для навигации по боту.\n\nДоступные команды:\n/start - Главное меню\n/help - Эта справка",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-menu",
                  text: "📋 Главное меню",
                  action: "goto",
                  target: "start-1"
                }
              ],
              markdown: true,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          }
        ],
        connections: [
          {
            id: "conn-1",
            source: "start-1",
            target: "info-1"
          },
          {
            id: "conn-2",
            source: "start-1",
            target: "contacts-1"
          },
          {
            id: "conn-3",
            source: "start-1",
            target: "help-1"
          }
        ]
      }
    });

    // Простой FAQ бот
    await storage.createBotTemplate({
      name: "FAQ бот",
      description: "Бот для ответов на часто задаваемые вопросы с поиском по темам",
      category: "utility",
      tags: ["faq", "вопросы", "поддержка"],
      isPublic: 1,
      difficulty: "medium",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 5,
      estimatedTime: 15,
      data: {
        nodes: [
          {
            id: "start-1",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Главное меню FAQ",
              messageText: "🤖 Привет! Я бот поддержки.\n\nВыберите категорию вопроса:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-tech",
                  text: "💻 Технические вопросы",
                  action: "goto",
                  target: "tech-1"
                },
                {
                  id: "btn-billing",
                  text: "💳 Вопросы оплаты",
                  action: "goto",
                  target: "billing-1"
                },
                {
                  id: "btn-general",
                  text: "❓ Общие вопросы",
                  action: "goto",
                  target: "general-1"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "tech-1",
            type: "message",
            position: { x: 400, y: 50 },
            data: {
              messageText: "💻 **Технические вопросы:**\n\n• Проблемы с входом\n• Ошибки в работе\n• Настройка аккаунта\n\nВыберите вопрос:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-login",
                  text: "🔐 Проблемы с входом",
                  action: "goto",
                  target: "login-help"
                },
                {
                  id: "btn-back-tech",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              markdown: true,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "billing-1",
            type: "message",
            position: { x: 400, y: 150 },
            data: {
              messageText: "💳 **Вопросы оплаты:**\n\n• Способы оплаты\n• Возврат средств\n• Тарифы\n\nВыберите вопрос:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-payment",
                  text: "💰 Способы оплаты",
                  action: "goto",
                  target: "payment-help"
                },
                {
                  id: "btn-back-billing",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              markdown: true,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "general-1",
            type: "message",
            position: { x: 400, y: 250 },
            data: {
              messageText: "❓ **Общие вопросы:**\n\n• О компании\n• Контакты\n• Часы работы",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-contact",
                  text: "📞 Связаться с нами",
                  action: "url",
                  url: "https://t.me/support"
                },
                {
                  id: "btn-back-general",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              markdown: true,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          }
        ],
        connections: [
          {
            id: "conn-1",
            source: "start-1",
            target: "tech-1"
          },
          {
            id: "conn-2",
            source: "start-1",
            target: "billing-1"
          },
          {
            id: "conn-3",
            source: "start-1",
            target: "general-1"
          }
        ]
      }
    });

    // Простой интернет-магазин
    await storage.createBotTemplate({
      name: "Интернет-магазин",
      description: "Базовый шаблон бота для интернет-магазина с каталогом товаров",
      category: "business",
      tags: ["магазин", "товары", "продажи"],
      isPublic: 1,
      difficulty: "medium",
      authorName: "Система", 
      version: "1.0.0",
      language: "ru",
      complexity: 6,
      estimatedTime: 20,
      data: {
        nodes: [
          {
            id: "start-1",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Добро пожаловать в магазин",
              messageText: "🛍️ Добро пожаловать в наш интернет-магазин!\n\nЧто вас интересует?",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-catalog",
                  text: "📦 Каталог товаров",
                  action: "goto",
                  target: "catalog-1"
                },
                {
                  id: "btn-cart",
                  text: "🛒 Корзина",
                  action: "goto",
                  target: "cart-1"
                },
                {
                  id: "btn-info",
                  text: "ℹ️ О доставке",
                  action: "goto",
                  target: "delivery-1"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "catalog-1",
            type: "message",
            position: { x: 400, y: 100 },
            data: {
              messageText: "📦 **Каталог товаров:**\n\n🏷️ Категории:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-electronics",
                  text: "📱 Электроника",
                  action: "goto",
                  target: "electronics-1"
                },
                {
                  id: "btn-clothes",
                  text: "👕 Одежда",
                  action: "goto",
                  target: "clothes-1"
                },
                {
                  id: "btn-home",
                  text: "🏠 Для дома",
                  action: "goto",
                  target: "home-1"
                },
                {
                  id: "btn-back-catalog",
                  text: "◀️ Главное меню",
                  action: "goto",
                  target: "start-1"
                }
              ],
              markdown: true,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "cart-1",
            type: "message",
            position: { x: 400, y: 200 },
            data: {
              messageText: "🛒 **Ваша корзина пуста**\n\nДобавьте товары из каталога!",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-to-catalog",
                  text: "📦 Перейти к каталогу",
                  action: "goto",
                  target: "catalog-1"
                },
                {
                  id: "btn-back-cart",
                  text: "◀️ Главное меню",
                  action: "goto",
                  target: "start-1"
                }
              ],
              markdown: true,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "delivery-1",
            type: "message",
            position: { x: 400, y: 300 },
            data: {
              messageText: "🚚 **Информация о доставке:**\n\n📦 Бесплатная доставка от 2000₽\n⏱️ Доставка 1-3 дня\n📍 Доставляем по всей России\n\n💳 Оплата при получении или картой",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-back-delivery",
                  text: "◀️ Главное меню",
                  action: "goto",
                  target: "start-1"
                }
              ],
              markdown: true,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          }
        ],
        connections: [
          {
            id: "conn-1",
            source: "start-1",
            target: "catalog-1"
          },
          {
            id: "conn-2",
            source: "start-1",
            target: "cart-1"
          },
          {
            id: "conn-3",
            source: "start-1",
            target: "delivery-1"
          }
        ]
      }
    });

    // Простой бот с командой старт и синонимом
    await storage.createBotTemplate({
      name: "Базовый стартовый бот",
      description: "Простой бот с командой /start и синонимом 'старт' для начинающих",
      category: "education",
      tags: ["старт", "базовый", "обучение"],
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
            id: "start-1",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              synonyms: ["старт"],
              description: "Команда запуска бота",
              messageText: "🚀 Привет! Я твой первый бот!\n\nТы можешь написать:\n• /start - чтобы запустить меня\n• старт - это тоже работает!\n\nВыбери действие:",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-info",
                  text: "ℹ️ Информация",
                  action: "goto",
                  target: "info-1"
                },
                {
                  id: "btn-help",
                  text: "❓ Помощь",
                  action: "goto",
                  target: "help-1"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "info-1",
            type: "message",
            position: { x: 350, y: 100 },
            data: {
              messageText: "📋 **Информация о боте:**\n\nЭто простой бот-пример, который показывает:\n• Как работают команды\n• Как использовать синонимы\n• Базовую навигацию\n\nТеперь ты можешь создать своего!",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-back-info",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              markdown: true,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "help-1",
            type: "message",
            position: { x: 350, y: 250 },
            data: {
              messageText: "❓ **Справка:**\n\n🔤 **Команды:**\n• /start или старт - запуск бота\n\n🎯 **Советы:**\n• Используй кнопки для навигации\n• Синонимы делают бота удобнее\n• Экспериментируй с настройками!",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-back-help",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              markdown: true,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          }
        ],
        connections: [
          {
            id: "conn-1",
            source: "start-1",
            target: "info-1"
          },
          {
            id: "conn-2",
            source: "start-1",
            target: "help-1"
          }
        ]
      }
    });

    console.log('✅ Стандартные шаблоны успешно созданы');
  } catch (error) {
    console.error('❌ Ошибка создания стандартных шаблонов:', error);
  }
}