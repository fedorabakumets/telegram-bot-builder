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
    } else if (systemTemplates.length >= 9) {
      console.log('Системные шаблоны уже существуют, пропускаем инициализацию');
      return;
    }

    // Простой информационный бот
    await storage.createBotTemplate({
      name: "Базовый шаблон бота",
      description: "Современный базовый шаблон с улучшенной навигацией и сбором пользовательских данных",
      category: "business",
      tags: ["базовый", "навигация", "данные"],
      isPublic: 1,
      difficulty: "easy",
      authorName: "Система",
      version: "2.0.0",
      featured: 1,
      language: "ru",
      complexity: 4,
      estimatedTime: 12,
      data: {
        nodes: [
          {
            id: "start-node",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Начальный узел бота",
              messageText: "Добро пожаловать! 👋\n\nЯ ваш помощник. Выберите действие:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-info",
                  text: "📋 Информация",
                  action: "goto",
                  target: "info-node"
                },
                {
                  id: "btn-survey",
                  text: "📝 Заполнить анкету",
                  action: "goto",
                  target: "survey-start"
                },
                {
                  id: "btn-profile",
                  text: "👤 Мой профиль",
                  action: "command",
                  target: "/profile"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "info-node",
            type: "message",
            position: { x: 400, y: 100 },
            data: {
              messageText: "ℹ️ Информация о сервисе\n\nМы предоставляем качественные услуги и помогаем пользователям решать их задачи.\n\nВыберите раздел для получения подробной информации:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-contacts",
                  text: "📞 Контакты",
                  action: "goto",
                  target: "contacts-node"
                },
                {
                  id: "btn-services",
                  text: "🛍️ Услуги",
                  action: "goto",
                  target: "services-node"
                },
                {
                  id: "btn-back-main",
                  text: "◀️ Главное меню",
                  action: "goto",
                  target: "start-node"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "contacts-node",
            type: "message",
            position: { x: 700, y: 50 },
            data: {
              messageText: "📞 Контактная информация:\n\n📧 Email: support@example.com\n📱 Телефон: +7 (999) 123-45-67\n🌐 Сайт: www.example.com\n💬 Telegram: @support_bot",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-back-info",
                  text: "◀️ Назад к информации",
                  action: "goto",
                  target: "info-node"
                },
                {
                  id: "btn-main-menu",
                  text: "🏠 Главное меню",
                  action: "goto",
                  target: "start-node"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "services-node",
            type: "message",
            position: { x: 700, y: 200 },
            data: {
              messageText: "🛍️ Наши услуги:\n\n• Консультации\n• Техническая поддержка\n• Обучение\n• Индивидуальные решения\n\nВсе услуги предоставляются профессиональными специалистами.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-back-info-2",
                  text: "◀️ Назад к информации",
                  action: "goto",
                  target: "info-node"
                },
                {
                  id: "btn-contact-us",
                  text: "📞 Связаться с нами",
                  action: "goto",
                  target: "contacts-node"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "survey-start",
            type: "keyboard",
            position: { x: 100, y: 400 },
            data: {
              messageText: "📝 Давайте познакомимся!\n\nКак вас зовут?",
              keyboardType: "none",
              buttons: [],
              markdown: false,
              inputVariable: "имя",
              enableTextInput: true,
              collectUserInput: true,
              inputTargetNodeId: "survey-age",
              resizeKeyboard: true,
              oneTimeKeyboard: false
            }
          },
          {
            id: "survey-age",
            type: "keyboard",
            position: { x: 400, y: 400 },
            data: {
              messageText: "Приятно познакомиться! 😊\n\nСколько вам лет?",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-age-18-25",
                  text: "18-25",
                  action: "goto",
                  target: "survey-complete"
                },
                {
                  id: "btn-age-26-35",
                  text: "26-35",
                  action: "goto",
                  target: "survey-complete"
                },
                {
                  id: "btn-age-36-50",
                  text: "36-50",
                  action: "goto",
                  target: "survey-complete"
                },
                {
                  id: "btn-age-50+",
                  text: "50+",
                  action: "goto",
                  target: "survey-complete"
                }
              ],
              markdown: false,
              inputVariable: "возраст",
              collectUserInput: true,
              resizeKeyboard: true,
              oneTimeKeyboard: false
            }
          },
          {
            id: "survey-complete",
            type: "message",
            position: { x: 700, y: 400 },
            data: {
              messageText: "Спасибо за заполнение анкеты! 🎉\n\nВаши данные сохранены. Теперь вы можете воспользоваться всеми функциями бота.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-view-profile",
                  text: "👤 Посмотреть профиль",
                  action: "command",
                  target: "/profile"
                },
                {
                  id: "btn-main-menu-final",
                  text: "🏠 Главное меню",
                  action: "goto",
                  target: "start-node"
                }
              ],
              markdown: false,
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
              messageText: "❓ Справка\n\nИспользуйте кнопки меню для навигации по боту.\n\nДоступные команды:\n/start - Главное меню\n/help - Эта справка",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-menu",
                  text: "📋 Главное меню",
                  action: "goto",
                  target: "start-1"
                }
              ],
              formatMode: "none",
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
              messageText: "💻 Технические вопросы:\n\n• Проблемы с входом\n• Ошибки в работе\n• Настройка аккаунта\n\nВыберите вопрос:",
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
              formatMode: "none",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "billing-1",
            type: "message",
            position: { x: 400, y: 150 },
            data: {
              messageText: "💳 Вопросы оплаты:\n\n• Способы оплаты\n• Возврат средств\n• Тарифы\n\nВыберите вопрос:",
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
              formatMode: "none",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "general-1",
            type: "message",
            position: { x: 400, y: 250 },
            data: {
              messageText: "❓ Общие вопросы:\n\n• О компании\n• Контакты\n• Часы работы",
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
              formatMode: "none",
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
            position: { x: 400, y: 50 },
            data: {
              messageText: "📦 Каталог товаров:\n\n• Электроника\n• Одежда\n• Книги\n• Товары для дома\n\nВыберите категорию:",
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
                  id: "btn-back-catalog",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              formatMode: "none",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "cart-1",
            type: "message",
            position: { x: 400, y: 150 },
            data: {
              messageText: "🛒 Ваша корзина пуста\n\nДобавьте товары из каталога!",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-to-catalog",
                  text: "📦 Перейти в каталог",
                  action: "goto",
                  target: "catalog-1"
                },
                {
                  id: "btn-back-cart",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              formatMode: "none",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "delivery-1",
            type: "message",
            position: { x: 400, y: 250 },
            data: {
              messageText: "🚚 Информация о доставке:\n\n• Доставка по всей России\n• Бесплатная доставка от 2000₽\n• Сроки доставки: 3-7 дней\n• Оплата при получении",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-back-delivery",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              formatMode: "none",
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

    // Образовательный бот
    await storage.createBotTemplate({
      name: "Образовательный бот",
      description: "Бот для обучения с уроками, тестами и прогрессом",
      category: "education",
      tags: ["обучение", "тесты", "образование"],
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
              description: "Главное меню обучения",
              messageText: "📚 Добро пожаловать в образовательный бот!\n\nВыберите раздел:",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-lessons",
                  text: "📖 Уроки",
                  action: "goto",
                  target: "lessons-1"
                },
                {
                  id: "btn-tests",
                  text: "📝 Тесты",
                  action: "goto",
                  target: "tests-1"
                },
                {
                  id: "btn-progress",
                  text: "📊 Прогресс",
                  action: "goto",
                  target: "progress-1"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "lessons-1",
            type: "message",
            position: { x: 400, y: 50 },
            data: {
              messageText: "📖 Доступные уроки:\n\n1. Основы программирования\n2. Работа с данными\n3. Алгоритмы\n\nВыберите урок:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-lesson-1",
                  text: "1️⃣ Основы программирования",
                  action: "goto",
                  target: "lesson-detail-1"
                },
                {
                  id: "btn-back-lessons",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              formatMode: "none",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "tests-1",
            type: "message",
            position: { x: 400, y: 150 },
            data: {
              messageText: "📝 Доступные тесты:\n\n• Тест по основам\n• Тест по алгоритмам\n• Итоговый тест\n\nВыберите тест:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-test-1",
                  text: "📝 Тест по основам",
                  action: "goto",
                  target: "test-detail-1"
                },
                {
                  id: "btn-back-tests",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              formatMode: "none",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "progress-1",
            type: "message",
            position: { x: 400, y: 250 },
            data: {
              messageText: "📊 Ваш прогресс:\n\n✅ Уроки: 0/3\n✅ Тесты: 0/3\n📈 Общий прогресс: 0%\n\nПродолжите обучение!",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-back-progress",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              formatMode: "none",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          }
        ],
        connections: [
          {
            id: "conn-1",
            source: "start-1",
            target: "lessons-1"
          },
          {
            id: "conn-2",
            source: "start-1",
            target: "tests-1"
          },
          {
            id: "conn-3",
            source: "start-1",
            target: "progress-1"
          }
        ]
      }
    });

    // Политический шаблон
    await storage.createBotTemplate({
      name: "Политический бот",
      description: "Бот для освещения политических новостей и событий",
      category: "utility",
      tags: ["новости", "политика", "события"],
      isPublic: 1,
      difficulty: "easy",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 4,
      estimatedTime: 12,
      data: {
        nodes: [
          {
            id: "start-1",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Главное меню политических новостей",
              messageText: "🏛️ Добро пожаловать в политический информационный бот!\n\nВыберите раздел:",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-news",
                  text: "📰 Новости",
                  action: "goto",
                  target: "news-1"
                },
                {
                  id: "btn-events",
                  text: "📅 События",
                  action: "goto",
                  target: "events-1"
                },
                {
                  id: "btn-analysis",
                  text: "📊 Аналитика",
                  action: "goto",
                  target: "analysis-1"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "news-1",
            type: "message",
            position: { x: 400, y: 50 },
            data: {
              messageText: "📰 <b>Последние политические новости:</b>\n\n• <i>Новые законодательные инициативы</i>\n• <i>Международные отношения</i>\n• <i>Экономическая политика</i>\n\nВыберите категорию:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-domestic",
                  text: "🏠 Внутренняя политика",
                  action: "goto",
                  target: "domestic-1"
                },
                {
                  id: "btn-international",
                  text: "🌍 Международная политика",
                  action: "goto",
                  target: "international-1"
                },
                {
                  id: "btn-back-news",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              formatMode: "html",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "events-1",
            type: "message",
            position: { x: 400, y: 150 },
            data: {
              messageText: "📅 <b>Предстоящие политические события:</b>\n\n• <i>Парламентские слушания</i>\n• <i>Международные саммиты</i>\n• <i>Выборы и референдумы</i>",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-back-events",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              formatMode: "html",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "analysis-1",
            type: "message",
            position: { x: 400, y: 250 },
            data: {
              messageText: "📊 <b>Политическая аналитика:</b>\n\n• <i>Рейтинги партий</i>\n• <i>Социологические опросы</i>\n• <i>Экспертные мнения</i>",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-back-analysis",
                  text: "◀️ Назад",
                  action: "goto",
                  target: "start-1"
                }
              ],
              formatMode: "html",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          }
        ],
        connections: [
          {
            id: "conn-1",
            source: "start-1",
            target: "news-1"
          },
          {
            id: "conn-2",
            source: "start-1",
            target: "events-1"
          },
          {
            id: "conn-3",
            source: "start-1",
            target: "analysis-1"
          }
        ]
      }
    });

    // Опрос с текстовым вводом
    await storage.createBotTemplate({
      name: "📝 Опрос с текстовым вводом",
      description: "Простой шаблон для сбора текстовых отзывов от пользователей",
      category: "business",
      tags: ["опрос", "отзывы", "сбор данных"],
      isPublic: 1,
      difficulty: "medium",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 4,
      estimatedTime: 10,
      data: {
        nodes: [
          {
            id: "start-1",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Начало опроса",
              messageText: "📝 Добро пожаловать в опрос!\n\nМы ценим ваше мнение и хотели бы узнать больше о вашем опыте.\n\nГотовы ответить на несколько вопросов?",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-start-survey",
                  text: "✅ Начать опрос",
                  action: "goto",
                  target: "survey-question"
                },
                {
                  id: "btn-maybe-later",
                  text: "⏰ Может быть позже",
                  action: "goto",
                  target: "thank-you"
                }
              ],
              formatMode: "none",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "survey-question",
            type: "message",
            position: { x: 400, y: 100 },
            data: {
              messageText: "📋 Расскажите нам о своем опыте:\n\nЧто вам больше всего понравилось в нашем сервисе?\n\nВы можете поделиться своими впечатлениями, предложениями или пожеланиями.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-provide-feedback",
                  text: "💬 Оставить отзыв",
                  action: "goto",
                  target: "feedback-input"
                },
                {
                  id: "btn-skip",
                  text: "⏭️ Пропустить",
                  action: "goto",
                  target: "thank-you"
                }
              ],
              formatMode: "none",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "feedback-input",
            type: "user-input",
            position: { x: 700, y: 100 },
            data: {
              messageText: "✍️ Напишите ваш отзыв:\n\nМы внимательно прочитаем каждое сообщение и учтем ваши пожелания при улучшении сервиса.\n\nПожалуйста, поделитесь своими мыслями (минимум 10 символов):",
              responseType: "text",
              inputType: "text",
              inputVariable: "user_feedback",
              placeholder: "Введите ваш отзыв...",
              isRequired: true,
              minLength: 10,
              maxLength: 500,
              validationMessage: "Отзыв должен содержать от 10 до 500 символов",
              timeoutSeconds: 300,
              timeoutMessage: "⏰ Время ввода истекло. Переходим к завершению.",
              saveToDatabase: true,
              successTarget: "thank-you",
              errorTarget: "feedback-error",
              formatMode: "none"
            }
          },
          {
            id: "feedback-error",
            type: "message",
            position: { x: 700, y: 250 },
            data: {
              messageText: "❌ Ошибка ввода отзыва\n\nПожалуйста, введите отзыв длиной от 10 до 500 символов.\n\nМы действительно ценим ваше мнение!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-retry",
                  text: "🔄 Попробовать снова",
                  action: "goto",
                  target: "feedback-input"
                },
                {
                  id: "btn-skip-final",
                  text: "⏭️ Пропустить",
                  action: "goto",
                  target: "thank-you"
                }
              ],
              formatMode: "none",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "thank-you",
            type: "message",
            position: { x: 1000, y: 100 },
            data: {
              messageText: "🙏 Спасибо за участие!\n\nВаше мнение очень важно для нас. Мы постоянно работаем над улучшением наших услуг.\n\nХотите пройти опрос еще раз или у вас есть дополнительные вопросы?",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-restart",
                  text: "🔄 Начать заново",
                  action: "command",
                  target: "/help"
                }
              ],
              formatMode: "none",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          }
        ],
        connections: [
          {
            id: "conn-1",
            source: "start-1",
            target: "survey-question"
          },
          {
            id: "conn-2",
            source: "start-1",
            target: "thank-you"
          },
          {
            id: "conn-3",
            source: "survey-question",
            target: "feedback-input"
          },
          {
            id: "conn-4",
            source: "feedback-input",
            target: "thank-you"
          },
          {
            id: "conn-5",
            source: "feedback-input",
            target: "feedback-error"
          },
          {
            id: "conn-6",
            source: "feedback-error",
            target: "feedback-input"
          },
          {
            id: "conn-7",
            source: "feedback-error",
            target: "thank-you"
          },
          {
            id: "conn-8",
            source: "thank-you",
            target: "start-1"
          }
        ]
      }
    });

    // Шаблон с условными сообщениями
    await storage.createBotTemplate({
      name: "Персональные приветствия",
      description: "Демонстрирует условные сообщения - бот запоминает источник пользователя и показывает разные приветствия для новых и постоянных пользователей",
      category: "education",
      tags: ["условные сообщения", "персонализация", "обучение"],
      isPublic: 1,
      difficulty: "medium",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 6,
      estimatedTime: 15,
      data: {
        nodes: [
          {
            id: "start_node",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Запуск бота с условными сообщениями",
              messageText: "Привет! Добро пожаловать!",
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "returning_with_source",
                  condition: "user_data_exists",
                  variableName: "источник",
                  messageText: "С возвращением! 👋\nВы пришли к нам из источника: {источник}\n\nРады видеть вас снова!",
                  priority: 10
                },
                {
                  id: "returning_user",
                  condition: "returning_user", 
                  messageText: "Рады видеть вас снова! 🎉\nВы уже не новичок в нашем боте.",
                  priority: 5
                }
              ],
              fallbackMessage: "Привет! 🌟\nДобро пожаловать в наш бот!\nОткуда вы узнали о нас?",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_search",
                  text: "🔍 Поиск в интернете",
                  action: "callback",
                  callback_data: "set_source_search"
                },
                {
                  id: "btn_friends",
                  text: "👥 Друзья", 
                  action: "callback",
                  callback_data: "set_source_friends"
                },
                {
                  id: "btn_ads",
                  text: "📱 Реклама",
                  action: "callback", 
                  callback_data: "set_source_ads"
                }
              ]
            }
          },
          {
            id: "source_search",
            type: "message",
            position: { x: 400, y: 50 },
            data: {
              messageText: "Отлично! 🎯\nТеперь мы знаем, что вы нашли нас через поиск.\n\nПопробуйте снова написать /start чтобы увидеть персонализированное приветствие!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_try_again",
                  text: "🔄 Попробовать /start снова",
                  action: "command",
                  target: "/start"
                }
              ]
            }
          },
          {
            id: "source_friends",
            type: "message",
            position: { x: 400, y: 150 },
            data: {
              messageText: "Замечательно! 👥\nЗначит, вас порекомендовали друзья!\n\nТеперь попробуйте /start еще раз - увидите, как изменится приветствие!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_try_again2",
                  text: "🔄 Попробовать /start снова", 
                  action: "command",
                  target: "/start"
                }
              ]
            }
          },
          {
            id: "source_ads",
            type: "message",
            position: { x: 400, y: 250 },
            data: {
              messageText: "Понятно! 📱\nВы пришли из рекламы.\n\nВведите /start снова, чтобы увидеть персональное сообщение!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_try_again3",
                  text: "🔄 Попробовать /start снова",
                  action: "command",
                  target: "/start"
                }
              ]
            }
          },
          {
            id: "help_command",
            type: "command",
            position: { x: 700, y: 100 },
            data: {
              command: "/help",
              description: "Помощь по условным сообщениям",
              messageText: "📖 Базовая справка",
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "help_for_experienced",
                  condition: "user_data_exists",
                  variableName: "источник",
                  messageText: "📖 Расширенная справка\n\nВы уже знакомы с ботом! Вот дополнительные возможности:\n\n🔄 /start - персональное приветствие\n📊 /stats - ваша статистика",
                  priority: 10
                }
              ],
              fallbackMessage: "📖 Базовая справка\n\nЭтот бот показывает, как работают условные сообщения:\n\n1. При первом /start вы увидите обычное приветствие\n2. Выберите источник\n3. При повторном /start - персональное сообщение\n\nКоманды:\n🔄 /start - запуск\n❓ /help - эта справка\n📊 /stats - статистика",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_back_to_start",
                  text: "◀️ Назад к началу",
                  action: "command",
                  target: "/start"
                }
              ]
            }
          },
          {
            id: "stats_command",
            type: "command",
            position: { x: 700, y: 250 },
            data: {
              command: "/stats",
              description: "Статистика пользователя",
              messageText: "📊 Статистика недоступна",
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "stats_available",
                  condition: "user_data_exists",
                  variableName: "источник",
                  messageText: "📊 Ваша статистика:\n\n🔍 Источник: {источник}\n👤 Статус: Постоянный пользователь\n🎯 Персонализация: Включена",
                  priority: 10
                }
              ],
              fallbackMessage: "📊 Статистика\n\n👤 Статус: Новый пользователь\n🔍 Источник: Не указан\n🎯 Персонализация: Отключена\n\nВыберите источник в /start для активации персонализации!"
            }
          },
          {
            id: "callback_set_source_search",
            type: "callback",
            position: { x: 400, y: 350 },
            data: {
              callback_data: "set_source_search",
              action: "save_variable",
              variableName: "источник",
              variableValue: "Поиск в интернете",
              successMessage: "Отлично! 🎯\nТеперь мы знаем, что вы нашли нас через поиск.\n\nПопробуйте снова написать /start чтобы увидеть персонализированное приветствие!",
              nextAction: "none"
            }
          },
          {
            id: "callback_set_source_friends", 
            type: "callback",
            position: { x: 400, y: 450 },
            data: {
              callback_data: "set_source_friends",
              action: "save_variable",
              variableName: "источник",
              variableValue: "Друзья",
              successMessage: "Замечательно! 👥\nЗначит, вас порекомендовали друзья!\n\nТеперь попробуйте /start еще раз - увидите, как изменится приветствие!",
              nextAction: "none"
            }
          },
          {
            id: "callback_set_source_ads",
            type: "callback", 
            position: { x: 400, y: 550 },
            data: {
              callback_data: "set_source_ads",
              action: "save_variable",
              variableName: "источник",
              variableValue: "Реклама",
              successMessage: "Понятно! 📱\nВы пришли из рекламы.\n\nВведите /start снова, чтобы увидеть персональное сообщение!",
              nextAction: "none"
            }
          }
        ],
        connections: [
          {
            id: "conn1",
            source: "start_node",
            target: "source_search",
            sourceHandle: "btn_search",
            targetHandle: null
          },
          {
            id: "conn2",
            source: "start_node", 
            target: "source_friends",
            sourceHandle: "btn_friends",
            targetHandle: null
          },
          {
            id: "conn3",
            source: "start_node",
            target: "source_ads", 
            sourceHandle: "btn_ads",
            targetHandle: null
          }
        ]
      }
    });

    // Шаблон "Федя" - бот с условными сообщениями
    await storage.createBotTemplate({
      name: "Федя",
      description: "Умный бот с условными сообщениями и персонализацией на основе источника трафика",
      category: "business",
      tags: ["условные сообщения", "персонализация", "умный бот"],
      isPublic: 1,
      difficulty: "hard",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 8,
      estimatedTime: 30,
      data: {
        nodes: [
          {
            id: "start_node",
            type: "start",
            position: { x: 60, y: 100 },
            data: {
              command: "/start",
              description: "Запуск бота с условными сообщениями",
              messageText: "Привет! 🌟\nДобро пожаловать в наш бот!\nОткуда вы узнали о нас?",
              keyboardType: "inline",
              inputVariable: "источник",
              saveToDatabase: true,
              fallbackMessage: "",
              collectUserInput: true,
              conditionalMessages: [
                {
                  id: "returning_with_source",
                  priority: 10,
                  condition: "user_data_exists",
                  messageText: "С возвращением! 👋\nВы пришли к нам из источника: {источник}\n\nРады видеть вас снова!",
                  variableName: "источник"
                },
                {
                  id: "returning_user",
                  priority: 5,
                  condition: "returning_user",
                  messageText: "Рады видеть вас снова! 🎉\nВы уже не новичок в нашем боте."
                }
              ],
              enableConditionalMessages: true,
              buttons: [
                {
                  id: "btn_search",
                  text: "🔍 Поиск в интернете",
                  action: "goto",
                  target: "source_search",
                  callback_data: "set_source_search"
                },
                {
                  id: "btn_friends",
                  text: "👥 Друзья",
                  action: "goto",
                  target: "source_friends",
                  callback_data: "set_source_friends"
                },
                {
                  id: "btn_ads",
                  text: "📱 Реклама",
                  action: "goto",
                  target: "source_ads",
                  callback_data: "set_source_ads"
                }
              ]
            }
          },
          {
            id: "source_search",
            type: "message",
            position: { x: 400, y: 80 },
            data: {
              messageText: "Отлично! 🎯\nТеперь мы знаем, что вы нашли нас через поиск.\n\nПопробуйте снова написать /start чтобы увидеть персонализированное приветствие!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_try_again",
                  text: "🔄 Попробовать /start снова",
                  action: "command",
                  target: "/start"
                }
              ]
            }
          },
          {
            id: "source_friends",
            type: "message",
            position: { x: 400, y: 480 },
            data: {
              messageText: "Замечательно! 👥\nЗначит, вас порекомендовали друзья!\n\nТеперь попробуйте /start еще раз - увидите, как изменится приветствие!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_try_again2",
                  text: "🔄 Попробовать /start снова",
                  action: "command",
                  target: "/start"
                }
              ]
            }
          },
          {
            id: "source_ads",
            type: "message",
            position: { x: 380, y: 860 },
            data: {
              messageText: "Понятно! 📱\nВы пришли из рекламы.\n\nВведите /start снова, чтобы увидеть персональное сообщение!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_try_again3",
                  text: "🔄 Попробовать /start снова",
                  action: "command",
                  target: "/start"
                }
              ]
            }
          },
          {
            id: "help_command",
            type: "command",
            position: { x: 786, y: 120 },
            data: {
              command: "/help",
              description: "Помощь по условным сообщениям",
              messageText: "📖 Базовая справка",
              keyboardType: "inline",
              fallbackMessage: "📖 Базовая справка\n\nЭтот бот показывает, как работают условные сообщения:\n\n1. При первом /start вы увидите обычное приветствие\n2. Выберите источник\n3. При повторном /start - персональное сообщение\n\nКоманды:\n🔄 /start - запуск\n❓ /help - эта справка\n📊 /stats - статистика",
              conditionalMessages: [
                {
                  id: "help_for_experienced",
                  priority: 10,
                  condition: "user_data_exists",
                  messageText: "📖 Расширенная справка\n\nВы уже знакомы с ботом! Вот дополнительные возможности:\n\n🔄 /start - персональное приветствие\n📊 /stats - ваша статистика",
                  variableName: "источник"
                }
              ],
              enableConditionalMessages: true,
              buttons: [
                {
                  id: "btn_back_to_start",
                  text: "◀️ Назад к началу",
                  action: "command",
                  target: "/start"
                }
              ]
            }
          },
          {
            id: "stats_command",
            type: "command",
            position: { x: 760, y: 400 },
            data: {
              command: "/stats",
              description: "Статистика пользователя",
              messageText: "📊 Статистика недоступна",
              fallbackMessage: "📊 Статистика\n\n👤 Статус: Новый пользователь\n🔍 Источник: Не указан\n🎯 Персонализация: Отключена\n\nВыберите источник в /start для активации персонализации!",
              conditionalMessages: [
                {
                  id: "stats_available",
                  priority: 10,
                  condition: "user_data_exists",
                  messageText: "📊 Ваша статистика:\n\n🔍 Источник: {источник}\n👤 Статус: Постоянный пользователь\n🎯 Персонализация: Включена",
                  variableName: "источник"
                }
              ],
              enableConditionalMessages: true
            }
          }
        ],
        connections: [
          {
            id: "conn1",
            source: "start_node",
            target: "source_search",
            sourceHandle: "btn_search",
            targetHandle: null
          },
          {
            id: "conn2",
            source: "start_node",
            target: "source_friends",
            sourceHandle: "btn_friends",
            targetHandle: null
          },
          {
            id: "conn3",
            source: "start_node",
            target: "source_ads",
            sourceHandle: "btn_ads",
            targetHandle: null
          }
        ]
      }
    });

    // Шаблон "Саша" - сбор информации о пользователе
    await storage.createBotTemplate({
      name: "Опрос пользователей",
      description: "Интерактивный бот для сбора информации о пользователях с условными переходами",
      category: "business",
      tags: ["опрос", "сбор данных", "интерактив"],
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
            id: "start_node",
            type: "start",
            position: { x: 60, y: 100 },
            data: {
              command: "/start",
              description: "Запуск бота с условными сообщениями",
              messageText: "Привет! 🌟\nДобро пожаловать в наш бот!\nОткуда вы узнали о нас?",
              keyboardType: "none",
              buttons: [],
              inputVariable: "источник",
              saveToDatabase: true,
              enableTextInput: true,
              fallbackMessage: "",
              collectUserInput: true,
              inputTargetNodeId: "--2N9FeeykMHVVlsVnSQW",
              conditionalMessages: [],
              enableConditionalMessages: false
            }
          },
          {
            id: "--2N9FeeykMHVVlsVnSQW",
            type: "keyboard",
            position: { x: 60, y: 420 },
            data: {
              messageText: "Ты хочешься продолжить свою жизнь с чатом?",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-1",
                  text: "Да",
                  action: "goto",
                  target: "nr3wIiTfBYYmpkkXMNH7n"
                },
                {
                  id: "btn-2",
                  text: "Нет",
                  action: "goto",
                  target: "1BHSLWPMao9qQvSAzuzRl"
                }
              ],
              markdown: false,
              inputVariable: "желание",
              resizeKeyboard: true,
              oneTimeKeyboard: false,
              collectUserInput: true
            }
          },
          {
            id: "nr3wIiTfBYYmpkkXMNH7n",
            type: "keyboard",
            position: { x: 60, y: 800 },
            data: {
              messageText: "Какой твой пол?",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-female",
                  text: "Женщина",
                  action: "goto",
                  target: "XDSrTrNly5EtDtr85nN4P"
                },
                {
                  id: "btn-male",
                  text: "Мужчина",
                  action: "goto",
                  target: "XDSrTrNly5EtDtr85nN4P"
                }
              ],
              markdown: false,
              inputVariable: "пол",
              resizeKeyboard: true,
              oneTimeKeyboard: false,
              collectUserInput: true,
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "gender_already_set",
                  condition: "user_data_exists",
                  variableName: "пол",
                  messageText: "Вы уже указали свой пол: {пол}\n\nВаш профиль заполнен. Посмотреть профиль?",
                  priority: 10,
                  buttons: [
                    {
                      id: "btn-view-profile-gender",
                      text: "👤 Посмотреть профиль",
                      action: "command",
                      target: "/profile"
                    },
                    {
                      id: "btn-change-gender",
                      text: "✏️ Изменить пол",
                      action: "goto",
                      target: "XDSrTrNly5EtDtr85nN4P"
                    }
                  ]
                }
              ],
              fallbackMessage: "Какой твой пол?"
            }
          },
          {
            id: "1BHSLWPMao9qQvSAzuzRl",
            type: "message",
            position: { x: 440, y: 460 },
            data: {
              messageText: "Печально, если что напиши /start или /profile для просмотра профиля",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-restart-no",
                  text: "🔄 Начать заново",
                  action: "command",
                  target: "/start"
                },
                {
                  id: "btn-profile-no",
                  text: "👤 Профиль",
                  action: "command",
                  target: "/profile"
                }
              ],
              markdown: false,
              resizeKeyboard: true,
              oneTimeKeyboard: false
            }
          },
          {
            id: "XDSrTrNly5EtDtr85nN4P",
            type: "keyboard",
            position: { x: 60, y: 1120 },
            data: {
              messageText: "Как тебя зовут?",
              keyboardType: "none",
              buttons: [
                {
                  id: "btn-1",
                  text: "Кнопка 1",
                  action: "goto",
                  target: ""
                },
                {
                  id: "btn-2",
                  text: "Кнопка 2",
                  action: "goto",
                  target: ""
                }
              ],
              markdown: false,
              inputVariable: "имя",
              resizeKeyboard: true,
              enableTextInput: true,
              oneTimeKeyboard: false,
              collectUserInput: true,
              inputTargetNodeId: "final-message-node",
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "name_already_exists",
                  priority: 60,
                  condition: "user_data_exists",
                  variableNames: ["имя"],
                  logicOperator: "AND",
                  messageText: "У вас уже есть имя: {имя}. Введите новое имя:",
                  waitForTextInput: true,
                  textInputVariable: "имя",
                  nextNodeAfterInput: "profile_command",
                  formatMode: "text"
                }
              ]
            }
          },
          {
            id: "final-message-node",
            type: "message",
            position: { x: 80, y: 1900 },
            data: {
              messageText: "Спасибо за предоставленную информацию! 🎉\n\nВаш профиль сохранен. Теперь вы можете воспользоваться командой /profile чтобы посмотреть свой профиль.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-view-profile",
                  text: "👤 Посмотреть профиль",
                  action: "command",
                  target: "/profile"
                },
                {
                  id: "btn-restart",
                  text: "🔄 Начать заново",
                  action: "command", 
                  target: "/start"
                }
              ],
              resizeKeyboard: true,
              oneTimeKeyboard: false,
              markdown: false
            }
          },
          {
            id: "profile_command",
            type: "command",
            position: { x: 700, y: 100 },
            data: {
              command: "/profile",
              description: "Показать профиль пользователя с собранными данными",
              messageText: "👤 Профиль недоступен\n\nПохоже, вы еще не прошли опрос. Пожалуйста, введите /start чтобы заполнить профиль.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-start-survey",
                  text: "📝 Пройти опрос",
                  action: "command",
                  target: "/start"
                },
                {
                  id: "btn-edit-name-default",
                  text: "✏️ Редактировать имя",
                  action: "goto",
                  target: "XDSrTrNly5EtDtr85nN4P"
                }
              ],
              fallbackMessage: "👤 Профиль недоступен\n\nПохоже, вы еще не прошли опрос. Пожалуйста, введите /start чтобы заполнить профиль.",
              fallbackButtons: [
                {
                  id: "btn-start-survey-fallback",
                  text: "📝 Пройти опрос",
                  action: "command",
                  target: "/start"
                },
                {
                  id: "btn-edit-name-fallback",
                  text: "✏️ Редактировать имя",
                  action: "goto",
                  target: "XDSrTrNly5EtDtr85nN4P"
                }
              ],
              conditionalMessages: [
                {
                  id: "profile_with_all_data",
                  priority: 50,
                  condition: "user_data_exists",
                  variableNames: ["источник", "желание", "пол", "имя"],
                  logicOperator: "AND",
                  messageText: "👤 Ваш профиль:\n\n🔍 Источник: {источник}\n💭 Желание продолжить: {желание}\n⚧️ Пол: {пол}\n👋 Имя: {имя}\n\nПрофиль полностью заполнен! ✅",
                  buttons: [
                    {
                      id: "btn-edit-name-full",
                      text: "✏️ Редактировать имя",
                      action: "goto",
                      target: "XDSrTrNly5EtDtr85nN4P"
                    },
                    {
                      id: "btn-restart-full",
                      text: "🔄 Пройти опрос заново",
                      action: "command",
                      target: "/start"
                    }
                  ]
                },
                {
                  id: "profile_basic_info",
                  priority: 40,
                  condition: "user_data_exists",
                  variableNames: ["имя"],
                  logicOperator: "AND",
                  messageText: "👤 Ваш профиль:\n\n👋 Имя: {имя}\n\nОсновная информация заполнена. Хотите пройти полный опрос?",
                  buttons: [
                    {
                      id: "btn-edit-name-basic",
                      text: "✏️ Редактировать имя",
                      action: "goto",
                      target: "XDSrTrNly5EtDtr85nN4P"
                    },
                    {
                      id: "btn-full-survey-basic",
                      text: "📝 Полный опрос",
                      action: "command",
                      target: "/start"
                    }
                  ]
                },
                {
                  id: "profile_partial",
                  priority: 30,
                  condition: "user_data_exists",
                  variableNames: ["источник"],
                  logicOperator: "OR",
                  messageText: "👤 Частичный профиль:\n\n🔍 Источник: {источник}\n\nПрофиль заполнен частично. Пройдите полный опрос для получения более детальной информации.",
                  buttons: [
                    {
                      id: "btn-edit-name-partial",
                      text: "✏️ Редактировать имя",
                      action: "goto",
                      target: "XDSrTrNly5EtDtr85nN4P"
                    },
                    {
                      id: "btn-complete-survey-partial",
                      text: "📝 Завершить опрос",
                      action: "command",
                      target: "/start"
                    }
                  ]
                },
                {
                  id: "profile_any_data",
                  priority: 10,
                  condition: "user_data_exists", 
                  variableNames: ["источник", "желание", "пол", "имя"],
                  logicOperator: "OR",
                  messageText: "👤 Ваш профиль:\n\nУ нас есть некоторая информация о вас. Пройдите полный опрос чтобы заполнить профиль полностью.\n\nИмеющиеся данные:\n🔍 Источник: {источник}\n💭 Желание: {желание}\n⚧️ Пол: {пол}\n👋 Имя: {имя}",
                  buttons: [
                    {
                      id: "btn-edit-name-any",
                      text: "✏️ Редактировать имя",
                      action: "goto",
                      target: "XDSrTrNly5EtDtr85nN4P"
                    },
                    {
                      id: "btn-complete-survey-any",
                      text: "📝 Завершить опрос",
                      action: "command",
                      target: "/start"
                    }
                  ]
                }
              ],
              enableConditionalMessages: true,
              markdown: false
            }
          }
        ],
        connections: [
          {
            id: "conn-start-to-survey",
            source: "start-survey-node",
            target: "--2N9FeeykMHVVlsVnSQW"
          },
          {
            id: "conn-survey-to-gender-yes",
            source: "--2N9FeeykMHVVlsVnSQW",
            target: "nr3wIiTfBYYmpkkXMNH7n"
          },
          {
            id: "conn-survey-to-sad-no",
            source: "--2N9FeeykMHVVlsVnSQW",
            target: "1BHSLWPMao9qQvSAzuzRl"
          },
          {
            id: "conn-gender-to-name",
            source: "nr3wIiTfBYYmpkkXMNH7n",
            target: "XDSrTrNly5EtDtr85nN4P"
          },
          {
            id: "conn-name-to-final",
            source: "XDSrTrNly5EtDtr85nN4P",
            target: "final-message-node"
          },
          {
            id: "conn-name-to-profile",
            source: "XDSrTrNly5EtDtr85nN4P",
            target: "profile_command"
          },
          {
            id: "conn-profile-to-name-edit",
            source: "profile_command",
            target: "XDSrTrNly5EtDtr85nN4P"
          }
        ]
      }
    });

    console.log('Базовые шаблоны успешно созданы');
  } catch (error) {
    console.error('Ошибка при создании шаблонов:', error);
  }
}