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
                  variableNames: ["пол"],
                  logicOperator: "AND",
                  messageText: "Ваш пол: {пол}\n\nВыберите действие:",
                  priority: 10,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-female-profile",
                      text: "Женщина",
                      action: "command",
                      target: "/profile"
                    },
                    {
                      id: "btn-male-profile",
                      text: "Мужчина",
                      action: "command",
                      target: "/profile"
                    }
                  ],
                  formatMode: "text"
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

    // Новый шаблон с множеством условных сообщений
    await storage.createBotTemplate({
      name: "Интерактивный магазин с условными сообщениями",
      description: "Продвинутый шаблон интернет-магазина с умными условными сообщениями и персонализацией",
      category: "business",
      tags: ["магазин", "условные сообщения", "персонализация", "каталог"],
      isPublic: 1,
      difficulty: "hard",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 8,
      estimatedTime: 25,
      data: {
        nodes: [
          {
            id: "start_store",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Главная страница магазина",
              messageText: "🛍️ Добро пожаловать в наш интернет-магазин!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_catalog",
                  text: "📱 Каталог товаров",
                  action: "goto",
                  target: "catalog_main"
                },
                {
                  id: "btn_profile",
                  text: "👤 Мой профиль",
                  action: "goto",
                  target: "user_profile"
                },
                {
                  id: "btn_cart",
                  text: "🛒 Корзина",
                  action: "goto",
                  target: "shopping_cart"
                },
                {
                  id: "btn_support",
                  text: "💬 Поддержка",
                  action: "goto",
                  target: "support_center"
                }
              ],
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "welcome_returning_customer",
                  condition: "user_data_exists",
                  variableName: "имя",
                  messageText: "🎉 С возвращением, {имя}!\n\nВаш последний заказ: {последний_заказ}\nБонусных баллов: {бонусы}",
                  priority: 15,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_last_order",
                      text: "📦 Повторить заказ",
                      action: "goto",
                      target: "repeat_order"
                    },
                    {
                      id: "btn_new_catalog",
                      text: "🆕 Новинки каталога",
                      action: "goto",
                      target: "new_products"
                    },
                    {
                      id: "btn_bonus_shop",
                      text: "🎁 Магазин бонусов",
                      action: "goto",
                      target: "bonus_shop"
                    }
                  ]
                },
                {
                  id: "welcome_vip_customer",
                  condition: "user_data_exists",
                  variableName: "статус",
                  variableValue: "VIP",
                  messageText: "👑 Добро пожаловать, VIP-клиент {имя}!\n\nУ вас есть эксклюзивные предложения!",
                  priority: 20,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_vip_offers",
                      text: "⭐ VIP предложения",
                      action: "goto",
                      target: "vip_offers"
                    },
                    {
                      id: "btn_personal_manager",
                      text: "👨‍💼 Личный менеджер",
                      action: "goto",
                      target: "personal_manager"
                    }
                  ]
                }
              ]
            }
          },
          {
            id: "catalog_main",
            type: "keyboard",
            position: { x: 400, y: 100 },
            data: {
              messageText: "📱 Выберите категорию товаров:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_electronics",
                  text: "📱 Электроника",
                  action: "goto",
                  target: "electronics_category"
                },
                {
                  id: "btn_clothing",
                  text: "👕 Одежда",
                  action: "goto",
                  target: "clothing_category"
                },
                {
                  id: "btn_home",
                  text: "🏠 Дом и сад",
                  action: "goto",
                  target: "home_category"
                },
                {
                  id: "btn_back_main",
                  text: "◀️ Главная",
                  action: "goto",
                  target: "start_store"
                }
              ],
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "personalized_catalog",
                  condition: "user_data_exists",
                  variableName: "предпочтения",
                  messageText: "📱 Персональные рекомендации для вас:\n\nОсновано на ваших предпочтениях: {предпочтения}",
                  priority: 10,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_recommended",
                      text: "⭐ Рекомендованное",
                      action: "goto",
                      target: "recommendations"
                    },
                    {
                      id: "btn_favorites",
                      text: "❤️ Избранное",
                      action: "goto",
                      target: "favorites"
                    },
                    {
                      id: "btn_all_categories",
                      text: "📋 Все категории",
                      action: "goto",
                      target: "catalog_main"
                    }
                  ]
                }
              ]
            }
          },
          {
            id: "electronics_category",
            type: "keyboard",
            position: { x: 700, y: 50 },
            data: {
              messageText: "📱 Электроника - выберите подкатегорию:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_smartphones",
                  text: "📱 Смартфоны",
                  action: "goto",
                  target: "smartphones_list"
                },
                {
                  id: "btn_laptops",
                  text: "💻 Ноутбуки",
                  action: "goto",
                  target: "laptops_list"
                },
                {
                  id: "btn_accessories",
                  text: "🎧 Аксессуары",
                  action: "goto",
                  target: "accessories_list"
                },
                {
                  id: "btn_back_catalog",
                  text: "◀️ К каталогу",
                  action: "goto",
                  target: "catalog_main"
                }
              ],
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "electronics_history",
                  condition: "user_data_exists",
                  variableName: "последняя_покупка_электроника",
                  messageText: "📱 В электронике:\n\nВаша последняя покупка: {последняя_покупка_электроника}\nРекомендуем дополнительные аксессуары!",
                  priority: 12,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_compatible_accessories",
                      text: "🔌 Совместимые аксессуары",
                      action: "goto",
                      target: "compatible_accessories"
                    },
                    {
                      id: "btn_trade_in",
                      text: "🔄 Trade-in",
                      action: "goto",
                      target: "trade_in"
                    }
                  ]
                },
                {
                  id: "electronics_premium",
                  condition: "user_data_exists",
                  variableName: "статус",
                  variableValue: "VIP",
                  messageText: "👑 VIP-раздел электроники:\n\nДоступны эксклюзивные модели и предзаказы!",
                  priority: 15,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_premium_electronics",
                      text: "⭐ Премиум модели",
                      action: "goto",
                      target: "premium_electronics"
                    },
                    {
                      id: "btn_preorders",
                      text: "🚀 Предзаказы",
                      action: "goto",
                      target: "preorders"
                    }
                  ]
                }
              ]
            }
          },
          {
            id: "catalog_main",
            type: "keyboard",
            position: { x: 400, y: 100 },
            data: {
              messageText: "📱 Каталог товаров\n\nВыберите категорию:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_electronics",
                  text: "📱 Электроника",
                  action: "goto",
                  target: "electronics_category"
                },
                {
                  id: "btn_clothing",
                  text: "👕 Одежда",
                  action: "goto",
                  target: "clothing_category"
                },
                {
                  id: "btn_home",
                  text: "🏠 Дом и сад",
                  action: "goto",
                  target: "home_category"
                },
                {
                  id: "btn_sports",
                  text: "⚽ Спорт",
                  action: "goto",
                  target: "sports_category"
                },
                {
                  id: "btn_back_main_catalog",
                  text: "◀️ Главная",
                  action: "goto",
                  target: "start_store"
                }
              ],
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "catalog_personalized",
                  condition: "user_data_exists",
                  variableName: "предпочтения",
                  messageText: "🎯 Рекомендуемые категории для вас:\n\n{рекомендации}\n\nОсновано на ваших покупках",
                  priority: 15,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_recommended",
                      text: "⭐ Рекомендуемое",
                      action: "goto",
                      target: "recommended_products"
                    },
                    {
                      id: "btn_favorites",
                      text: "❤️ Избранные категории",
                      action: "goto",
                      target: "favorite_categories"
                    }
                  ]
                }
              ]
            }
          },
          {
            id: "electronics_category",
            type: "keyboard",
            position: { x: 700, y: 100 },
            data: {
              messageText: "📱 Электроника\n\nВыберите подкатегорию:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_smartphones",
                  text: "📱 Смартфоны",
                  action: "goto",
                  target: "smartphones"
                },
                {
                  id: "btn_laptops",
                  text: "💻 Ноутбуки",
                  action: "goto",
                  target: "laptops"
                },
                {
                  id: "btn_accessories",
                  text: "🎧 Аксессуары",
                  action: "goto",
                  target: "accessories"
                },
                {
                  id: "btn_back_to_catalog",
                  text: "◀️ Назад к каталогу",
                  action: "goto",
                  target: "catalog_main"
                },
                {
                  id: "btn_back_main_electronics",
                  text: "🏠 Главная",
                  action: "goto",
                  target: "start_store"
                }
              ],
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "electronics_sale",
                  condition: "user_data_exists",
                  variableName: "скидка_электроника",
                  variableValue: "активна",
                  messageText: "🔥 Специальное предложение!\n\nСкидка {размер_скидки}% на всю электронику до {дата_окончания}",
                  priority: 20,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_sale_smartphones",
                      text: "📱 Акционные смартфоны",
                      action: "goto",
                      target: "sale_smartphones"
                    },
                    {
                      id: "btn_sale_laptops",
                      text: "💻 Акционные ноутбуки",
                      action: "goto",
                      target: "sale_laptops"
                    }
                  ]
                }
              ]
            }
          },
          {
            id: "user_profile",
            type: "keyboard",
            position: { x: 100, y: 400 },
            data: {
              messageText: "👤 Профиль пользователя",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_edit_profile",
                  text: "✏️ Редактировать",
                  action: "goto",
                  target: "edit_profile"
                },
                {
                  id: "btn_orders_history",
                  text: "📦 История заказов",
                  action: "goto",
                  target: "orders_history"
                },
                {
                  id: "btn_bonus_info",
                  text: "🎁 Бонусы",
                  action: "goto",
                  target: "bonus_info"
                },
                {
                  id: "btn_back_main_profile",
                  text: "◀️ Главная",
                  action: "goto",
                  target: "start_store"
                }
              ],
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "profile_guest",
                  condition: "user_data_not_exists",
                  variableName: "имя",
                  messageText: "👤 Гостевой профиль\n\nСоздайте аккаунт для персональных рекомендаций и скидок!",
                  priority: 10,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_register",
                      text: "📝 Зарегистрироваться",
                      action: "goto",
                      target: "registration"
                    },
                    {
                      id: "btn_guest_continue",
                      text: "👀 Продолжить как гость",
                      action: "goto",
                      target: "start_store"
                    }
                  ]
                },
                {
                  id: "profile_registered",
                  condition: "user_data_exists",
                  variableName: "имя",
                  messageText: "👤 Профиль: {имя}\n📧 Email: {email}\n🎁 Бонусы: {бонусы}\n📊 Статус: {статус}",
                  priority: 15,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_achievements",
                      text: "🏆 Достижения",
                      action: "goto",
                      target: "achievements"
                    },
                    {
                      id: "btn_referral",
                      text: "👥 Пригласить друзей",
                      action: "goto",
                      target: "referral_program"
                    }
                  ]
                },
                {
                  id: "profile_vip",
                  condition: "user_data_exists",
                  variableName: "статус",
                  variableValue: "VIP",
                  messageText: "👑 VIP-профиль: {имя}\n\n⭐ Персональный менеджер\n🚚 Бесплатная доставка\n🎯 Эксклюзивные предложения",
                  priority: 20,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_vip_support",
                      text: "💎 VIP поддержка",
                      action: "goto",
                      target: "vip_support"
                    },
                    {
                      id: "btn_exclusive_catalog",
                      text: "🔒 Закрытый каталог",
                      action: "goto",
                      target: "exclusive_catalog"
                    }
                  ]
                }
              ]
            }
          },
          {
            id: "shopping_cart",
            type: "keyboard",
            position: { x: 400, y: 400 },
            data: {
              messageText: "🛒 Ваша корзина пуста",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_continue_shopping",
                  text: "🛍️ Продолжить покупки",
                  action: "goto",
                  target: "catalog_main"
                },
                {
                  id: "btn_wishlist",
                  text: "❤️ Список желаний",
                  action: "goto",
                  target: "wishlist"
                },
                {
                  id: "btn_back_main_cart",
                  text: "◀️ Главная",
                  action: "goto",
                  target: "start_store"
                }
              ],
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "cart_has_items",
                  condition: "user_data_exists",
                  variableName: "корзина_товары",
                  messageText: "🛒 В корзине: {количество_товаров} товаров\nСумма: {сумма_корзины} ₽\n\n{список_товаров}",
                  priority: 15,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_checkout",
                      text: "💳 Оформить заказ",
                      action: "goto",
                      target: "checkout"
                    },
                    {
                      id: "btn_edit_cart",
                      text: "✏️ Изменить корзину",
                      action: "goto",
                      target: "edit_cart"
                    },
                    {
                      id: "btn_save_for_later",
                      text: "💾 Сохранить на потом",
                      action: "goto",
                      target: "save_cart"
                    }
                  ]
                },
                {
                  id: "cart_discount_available",
                  condition: "user_data_exists",
                  variableName: "скидка_доступна",
                  variableValue: "да",
                  messageText: "🎉 У вас есть скидка {размер_скидки}%!\n\nПрименить к текущей корзине?",
                  priority: 18,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_apply_discount",
                      text: "✅ Применить скидку",
                      action: "goto",
                      target: "apply_discount"
                    },
                    {
                      id: "btn_save_discount",
                      text: "💾 Сохранить на потом",
                      action: "goto",
                      target: "save_discount"
                    }
                  ]
                }
              ]
            }
          },
          {
            id: "support_center",
            type: "keyboard",
            position: { x: 700, y: 400 },
            data: {
              messageText: "💬 Центр поддержки\n\nВыберите способ получения помощи:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_faq",
                  text: "❓ Частые вопросы",
                  action: "goto",
                  target: "faq"
                },
                {
                  id: "btn_chat_support",
                  text: "💬 Чат с оператором",
                  action: "goto",
                  target: "chat_support"
                },
                {
                  id: "btn_callback",
                  text: "📞 Обратный звонок",
                  action: "goto",
                  target: "callback_request"
                },
                {
                  id: "btn_back_main_support",
                  text: "◀️ Главная",
                  action: "goto",
                  target: "start_store"
                }
              ],
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "support_vip",
                  condition: "user_data_exists",
                  variableName: "статус",
                  variableValue: "VIP",
                  messageText: "👑 VIP поддержка\n\nПриоритетное обслуживание и персональный менеджер",
                  priority: 20,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_personal_manager_direct",
                      text: "👨‍💼 Связаться с менеджером",
                      action: "goto",
                      target: "personal_manager_contact"
                    },
                    {
                      id: "btn_priority_support",
                      text: "⚡ Приоритетная поддержка",
                      action: "goto",
                      target: "priority_support"
                    }
                  ]
                },
                {
                  id: "support_order_issue",
                  condition: "user_data_exists",
                  variableName: "активный_заказ",
                  messageText: "📦 У вас есть активный заказ #{номер_заказа}\n\nВопрос касается этого заказа?",
                  priority: 15,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_order_status",
                      text: "📍 Статус заказа",
                      action: "goto",
                      target: "order_status"
                    },
                    {
                      id: "btn_order_change",
                      text: "✏️ Изменить заказ",
                      action: "goto",
                      target: "change_order"
                    },
                    {
                      id: "btn_other_question",
                      text: "❓ Другой вопрос",
                      action: "goto",
                      target: "support_center"
                    }
                  ]
                }
              ]
            }
          },
          {
            id: "bonus_shop",
            type: "keyboard",
            position: { x: 100, y: 700 },
            data: {
              messageText: "🎁 Магазин бонусов\n\nОбменяйте бонусы на товары и скидки!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_bonus_products",
                  text: "🛍️ Товары за бонусы",
                  action: "goto",
                  target: "bonus_products"
                },
                {
                  id: "btn_bonus_discounts",
                  text: "💰 Скидки за бонусы",
                  action: "goto",
                  target: "bonus_discounts"
                },
                {
                  id: "btn_bonus_rules",
                  text: "📋 Правила программы",
                  action: "goto",
                  target: "bonus_rules"
                },
                {
                  id: "btn_back_main_bonus",
                  text: "◀️ Главная",
                  action: "goto",
                  target: "start_store"
                }
              ],
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "bonus_insufficient",
                  condition: "user_data_exists",
                  variableName: "бонусы",
                  variableValue: "0",
                  messageText: "🎁 У вас пока нет бонусов\n\nСовершите покупку, чтобы получить первые бонусы!",
                  priority: 10,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_earn_bonuses",
                      text: "💰 Как заработать бонусы",
                      action: "goto",
                      target: "earn_bonuses"
                    },
                    {
                      id: "btn_shop_now",
                      text: "🛍️ Совершить покупку",
                      action: "goto",
                      target: "catalog_main"
                    }
                  ]
                },
                {
                  id: "bonus_available",
                  condition: "user_data_exists",
                  variableName: "бонусы",
                  messageText: "🎁 Доступно бонусов: {бонусы}\n\nВыберите, что хотите приобрести:",
                  priority: 15,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_special_offers",
                      text: "⭐ Специальные предложения",
                      action: "goto",
                      target: "special_bonus_offers"
                    },
                    {
                      id: "btn_bonus_history",
                      text: "📊 История бонусов",
                      action: "goto",
                      target: "bonus_history"
                    }
                  ]
                }
              ]
            }
          },
          {
            id: "new_products",
            type: "message",
            position: { x: 400, y: 700 },
            data: {
              messageText: "🆕 Новинки нашего магазина:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_this_week",
                  text: "📅 Новинки недели",
                  action: "goto",
                  target: "weekly_new"
                },
                {
                  id: "btn_this_month",
                  text: "📆 Новинки месяца",
                  action: "goto",
                  target: "monthly_new"
                },
                {
                  id: "btn_subscribe_new",
                  text: "🔔 Подписаться на новинки",
                  action: "goto",
                  target: "subscribe_notifications"
                },
                {
                  id: "btn_back_main_new",
                  text: "◀️ Главная",
                  action: "goto",
                  target: "start_store"
                }
              ],
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "personalized_new_products",
                  condition: "user_data_exists",
                  variableName: "предпочтения",
                  messageText: "🎯 Новинки в ваших любимых категориях:\n\n{персональные_новинки}\n\nОсновано на предпочтениях: {предпочтения}",
                  priority: 15,
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn_personal_new",
                      text: "⭐ Персональные новинки",
                      action: "goto",
                      target: "personal_new_products"
                    },
                    {
                      id: "btn_notify_preferences",
                      text: "🔔 Уведомления по интересам",
                      action: "goto",
                      target: "preference_notifications"
                    }
                  ]
                }
              ]
            }
          }
        ],
        connections: [
          {
            id: "conn_start_to_catalog",
            source: "start_store",
            target: "catalog_main"
          },
          {
            id: "conn_start_to_profile",
            source: "start_store",
            target: "user_profile"
          },
          {
            id: "conn_start_to_cart",
            source: "start_store",
            target: "shopping_cart"
          },
          {
            id: "conn_start_to_support",
            source: "start_store",
            target: "support_center"
          },
          {
            id: "conn_catalog_to_electronics",
            source: "catalog_main",
            target: "electronics_category"
          },
          {
            id: "conn_catalog_back_to_start",
            source: "catalog_main",
            target: "start_store"
          },
          {
            id: "conn_electronics_back_to_catalog",
            source: "electronics_category",
            target: "catalog_main"
          },
          {
            id: "conn_profile_back_to_start",
            source: "user_profile",
            target: "start_store"
          },
          {
            id: "conn_cart_to_catalog",
            source: "shopping_cart",
            target: "catalog_main"
          },
          {
            id: "conn_cart_back_to_start",
            source: "shopping_cart",
            target: "start_store"
          },
          {
            id: "conn_support_back_to_start",
            source: "support_center",
            target: "start_store"
          },
          {
            id: "conn_start_to_bonus_shop",
            source: "start_store",
            target: "bonus_shop"
          },
          {
            id: "conn_bonus_shop_back_to_start",
            source: "bonus_shop",
            target: "start_store"
          },
          {
            id: "conn_electronics_back_to_start",
            source: "electronics_category",
            target: "start_store"
          },
          {
            id: "conn_start_to_new_products",
            source: "start_store", 
            target: "new_products"
          },
          {
            id: "conn_new_products_back_to_start",
            source: "new_products",
            target: "start_store"
          },
          {
            id: "conn_bonus_shop_to_catalog",
            source: "bonus_shop",
            target: "catalog_main"
          },
          {
            id: "conn_start_to_new_products",
            source: "start_store",
            target: "new_products"
          },
          {
            id: "conn_bonus_shop_back_to_start",
            source: "bonus_shop",
            target: "start_store"
          },
          {
            id: "conn_bonus_shop_to_catalog",
            source: "bonus_shop",
            target: "catalog_main"
          },
          {
            id: "conn_new_products_back_to_start",
            source: "new_products",
            target: "start_store"
          }
        ]
      }
    });

    // Шаблон знакомств с многоуровневой навигацией (на основе предоставленного скрипта)
    await storage.createBotTemplate({
      name: "Бот знакомств с анкетой",
      description: "Продвинутый бот для знакомств с детальной анкетой, многоуровневыми кнопками и сбором данных пользователя",
      category: "community",
      tags: ["знакомства", "анкета", "профиль", "многоуровневая навигация", "данные пользователя"],
      isPublic: 1,
      difficulty: "hard",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 9,
      estimatedTime: 35,
      data: {
        nodes: [
          {
            id: "start_dating",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Начало регистрации в боте знакомств",
              messageText: "🌟 Добро пожаловать в бот знакомств!\n\nЗдесь вы сможете найти интересных людей и новых друзей. Для начала нужно заполнить анкету.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_start_profile",
                  text: "📝 Создать анкету",
                  action: "goto",
                  target: "ask_join_chat"
                },
                {
                  id: "btn_about",
                  text: "ℹ️ О боте",
                  action: "goto",
                  target: "about_bot"
                }
              ]
            }
          },
          {
            id: "ask_join_chat",
            type: "input",
            position: { x: 400, y: 100 },
            data: {
              messageText: "💬 Хотите ли вы присоединиться к нашему чату знакомств?",
              inputType: "buttons",
              inputVariable: "хочет_в_чат",
              inputPrompt: "Выберите ваш ответ:",
              saveToDatabase: true,
              buttonType: "reply",
              responseOptions: [
                { text: "Да 😎", value: "да" },
                { text: "Нет 🙅", value: "нет" }
              ],
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn_yes_chat",
                  text: "Да 😎",
                  action: "goto",
                  target: "ask_gender"
                },
                {
                  id: "btn_no_chat", 
                  text: "Нет 🙅",
                  action: "goto",
                  target: "ask_gender"
                }
              ]
            }
          },
          {
            id: "ask_gender",
            type: "input",
            position: { x: 700, y: 100 },
            data: {
              messageText: "👤 Выберите ваш пол:",
              inputType: "buttons",
              inputVariable: "пол",
              inputPrompt: "Укажите ваш пол:",
              saveToDatabase: true,
              buttonType: "reply",
              responseOptions: [
                { text: "Мужчина 👨", value: "мужчина" },
                { text: "Женщина 👩", value: "женщина" }
              ],
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn_male",
                  text: "Мужчина 👨",
                  action: "goto",
                  target: "ask_name"
                },
                {
                  id: "btn_female",
                  text: "Женщина 👩", 
                  action: "goto",
                  target: "ask_name"
                }
              ]
            }
          },
          {
            id: "ask_name",
            type: "input",
            position: { x: 100, y: 300 },
            data: {
              messageText: "✏️ Как вас зовут?",
              inputType: "text",
              inputVariable: "имя",
              inputPrompt: "Введите ваше имя:",
              inputValidation: "text",
              minLength: 2,
              maxLength: 50,
              inputRequired: true,
              saveToDatabase: true,
              inputSuccessMessage: "Отлично! Имя сохранено."
            }
          },
          {
            id: "ask_age",
            type: "input",
            position: { x: 400, y: 300 },
            data: {
              messageText: "🎂 Сколько вам лет?",
              inputType: "number",
              inputVariable: "возраст",
              inputPrompt: "Введите ваш возраст (от 18 до 99):",
              inputValidation: "number",
              minLength: 18,
              maxLength: 99,
              inputRequired: true,
              saveToDatabase: true,
              inputSuccessMessage: "Возраст сохранен!"
            }
          },
          {
            id: "ask_metro",
            type: "keyboard",
            position: { x: 700, y: 300 },
            data: {
              messageText: "🚇 Выберите ближайшую станцию метро или ваше местоположение:",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn_red_line",
                  text: "Красная ветка 🟥",
                  action: "goto",
                  target: "red_line_stations"
                },
                {
                  id: "btn_blue_line",
                  text: "Синяя ветка 🟦",
                  action: "goto",
                  target: "blue_line_stations"
                },
                {
                  id: "btn_green_line",
                  text: "Зелёная ветка 🟩",
                  action: "goto",
                  target: "green_line_stations"
                },
                {
                  id: "btn_lo",
                  text: "Я из ЛО 🏡",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_not_spb",
                  text: "Я не в Питере 🌍",
                  action: "goto",
                  target: "ask_interests"
                }
              ]
            }
          },
          {
            id: "red_line_stations",
            type: "keyboard",
            position: { x: 100, y: 500 },
            data: {
              messageText: "🟥 Красная ветка - выберите станцию:",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn_red_1",
                  text: "🟥 Девяткино",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_red_2",
                  text: "🟥 Гражданский пр.",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_red_3",
                  text: "🟥 Академическая",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_red_4",
                  text: "🟥 Политехническая",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_red_5",
                  text: "🟥 Площадь Мужества",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_red_6",
                  text: "🟥 Лесная",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_back_metro",
                  text: "Назад ⬅️",
                  action: "goto",
                  target: "ask_metro"
                }
              ]
            }
          },
          {
            id: "blue_line_stations",
            type: "keyboard",
            position: { x: 400, y: 500 },
            data: {
              messageText: "🟦 Синяя ветка - выберите станцию:",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn_blue_1",
                  text: "🟦 Парнас",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_blue_2",
                  text: "🟦 Проспект Просвещения",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_blue_3",
                  text: "🟦 Озерки",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_blue_4",
                  text: "🟦 Удельная",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_blue_5",
                  text: "🟦 Пионерская",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_blue_6",
                  text: "🟦 Чёрная речка",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_back_metro_blue",
                  text: "Назад ⬅️", 
                  action: "goto",
                  target: "ask_metro"
                }
              ]
            }
          },
          {
            id: "green_line_stations",
            type: "keyboard",
            position: { x: 700, y: 500 },
            data: {
              messageText: "🟩 Зелёная ветка - выберите станцию:",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn_green_1",
                  text: "🟩 Беговая",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_green_2",
                  text: "🟩 Зенит",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_green_3",
                  text: "🟩 Приморская",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_green_4",
                  text: "🟩 Василеостровская",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_green_5",
                  text: "🟩 Гостиный двор",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_green_6",
                  text: "🟩 Маяковская",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_back_metro_green",
                  text: "Назад ⬅️",
                  action: "goto",
                  target: "ask_metro"
                }
              ]
            }
          },
          {
            id: "ask_interests",
            type: "keyboard",
            position: { x: 100, y: 700 },
            data: {
              messageText: "🎯 Выберите ваши интересы.\n\nВы можете выбрать несколько категорий:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_sports_cat",
                  text: "⚽ Спорт и активность",
                  action: "goto",
                  target: "sports_interests"
                },
                {
                  id: "btn_culture_cat", 
                  text: "🎨 Культура и искусство",
                  action: "goto",
                  target: "culture_interests"
                },
                {
                  id: "btn_tech_cat",
                  text: "💻 Технологии",
                  action: "goto",
                  target: "tech_interests"
                },
                {
                  id: "btn_travel_cat",
                  text: "✈️ Путешествия",
                  action: "goto",
                  target: "travel_interests"
                },
                {
                  id: "btn_interests_done",
                  text: "Готово ✅",
                  action: "goto",
                  target: "ask_marital_status"
                }
              ]
            }
          },
          {
            id: "sports_interests",
            type: "keyboard",
            position: { x: 400, y: 700 },
            data: {
              messageText: "⚽ Спорт и активность - выберите что вам интересно:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_sport_1",
                  text: "⚽ Футбол",
                  action: "command",
                  target: "/save_interest_футбол"
                },
                {
                  id: "btn_sport_2",
                  text: "🏀 Баскетбол",
                  action: "command",
                  target: "/save_interest_баскетбол"
                },
                {
                  id: "btn_sport_3",
                  text: "🏊 Плавание",
                  action: "command",
                  target: "/save_interest_плавание"
                },
                {
                  id: "btn_sport_4",
                  text: "🏃 Бег",
                  action: "command",
                  target: "/save_interest_бег"
                },
                {
                  id: "btn_sport_5",
                  text: "🚴 Велоспорт",
                  action: "command",
                  target: "/save_interest_велоспорт"
                },
                {
                  id: "btn_back_interests",
                  text: "⬅️ К категориям",
                  action: "goto",
                  target: "ask_interests"
                }
              ]
            }
          },
          {
            id: "culture_interests",
            type: "keyboard",
            position: { x: 700, y: 700 },
            data: {
              messageText: "🎨 Культура и искусство - выберите что вам интересно:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_culture_1",
                  text: "🎭 Театр",
                  action: "command",
                  target: "/save_interest_театр"
                },
                {
                  id: "btn_culture_2",
                  text: "🎬 Кино",
                  action: "command",
                  target: "/save_interest_кино"
                },
                {
                  id: "btn_culture_3",
                  text: "🎨 Живопись",
                  action: "command",
                  target: "/save_interest_живопись"
                },
                {
                  id: "btn_culture_4",
                  text: "📚 Литература",
                  action: "command",
                  target: "/save_interest_литература"
                },
                {
                  id: "btn_culture_5",
                  text: "🏛️ Музеи",
                  action: "command",
                  target: "/save_interest_музеи"
                },
                {
                  id: "btn_back_interests_culture",
                  text: "⬅️ К категориям",
                  action: "goto",
                  target: "ask_interests"
                }
              ]
            }
          },
          {
            id: "tech_interests", 
            type: "keyboard",
            position: { x: 1000, y: 700 },
            data: {
              messageText: "💻 Технологии - выберите что вам интересно:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_tech_1",
                  text: "💻 Программирование",
                  action: "command",
                  target: "/save_interest_программирование"
                },
                {
                  id: "btn_tech_2",
                  text: "🎮 Игры",
                  action: "command",
                  target: "/save_interest_игры"
                },
                {
                  id: "btn_tech_3",
                  text: "🤖 ИИ и ML",
                  action: "command",
                  target: "/save_interest_ии"
                },
                {
                  id: "btn_tech_4",
                  text: "📱 Гаджеты",
                  action: "command",
                  target: "/save_interest_гаджеты"
                },
                {
                  id: "btn_back_interests_tech",
                  text: "⬅️ К категориям",
                  action: "goto",
                  target: "ask_interests"
                }
              ]
            }
          },
          {
            id: "travel_interests",
            type: "keyboard",
            position: { x: 1300, y: 700 },
            data: {
              messageText: "✈️ Путешествия - выберите что вам интересно:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_travel_1",
                  text: "🏖️ Пляжный отдых",
                  action: "command",
                  target: "/save_interest_пляж"
                },
                {
                  id: "btn_travel_2",
                  text: "🏔️ Горы",
                  action: "command",
                  target: "/save_interest_горы"
                },
                {
                  id: "btn_travel_3",
                  text: "🏙️ Городские туры",
                  action: "command",
                  target: "/save_interest_города"
                },
                {
                  id: "btn_travel_4",
                  text: "🎒 Backpacking",
                  action: "command",
                  target: "/save_interest_backpacking"
                },
                {
                  id: "btn_back_interests_travel",
                  text: "⬅️ К категориям",
                  action: "goto",
                  target: "ask_interests"
                }
              ]
            }
          },
          {
            id: "ask_marital_status",
            type: "input",
            position: { x: 700, y: 900 },
            data: {
              messageText: "💕 Ваше семейное положение:",
              inputType: "buttons",
              inputVariable: "семейное_положение",
              inputPrompt: "Выберите ваше семейное положение:",
              saveToDatabase: true,
              buttonType: "reply",
              responseOptions: [
                { text: "💔 Не в отношениях", value: "свободен" },
                { text: "💑 В отношениях", value: "в_отношениях" },
                { text: "💍 Женат/Замужем", value: "женат" },
                { text: "🤐 Не скажу", value: "не_скажу" }
              ],
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn_single",
                  text: "💔 Не в отношениях",
                  action: "goto",
                  target: "ask_orientation"
                },
                {
                  id: "btn_relationship",
                  text: "💑 В отношениях",
                  action: "goto",
                  target: "ask_orientation"
                },
                {
                  id: "btn_married",
                  text: "💍 Женат/Замужем",
                  action: "goto",
                  target: "ask_orientation"
                },
                {
                  id: "btn_no_tell",
                  text: "🤐 Не скажу",
                  action: "goto",
                  target: "ask_orientation"
                }
              ]
            }
          },
          {
            id: "ask_orientation",
            type: "input", 
            position: { x: 1000, y: 900 },
            data: {
              messageText: "🏳️‍🌈 Ваша ориентация:",
              inputType: "buttons",
              inputVariable: "ориентация",
              inputPrompt: "Выберите вашу ориентацию:",
              saveToDatabase: true,
              buttonType: "reply",
              responseOptions: [
                { text: "👫 Гетеро", value: "гетеро" },
                { text: "🏳️‍🌈 Гомо", value: "гомо" },
                { text: "💙💜💖 Би", value: "би" },
                { text: "🤐 Не скажу", value: "не_скажу" }
              ],
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn_hetero",
                  text: "👫 Гетеро",
                  action: "goto",
                  target: "profile_complete"
                },
                {
                  id: "btn_homo",
                  text: "🏳️‍🌈 Гомо",
                  action: "goto",
                  target: "profile_complete"
                },
                {
                  id: "btn_bi",
                  text: "💙💜💖 Би",
                  action: "goto",
                  target: "profile_complete"
                },
                {
                  id: "btn_no_tell_orient",
                  text: "🤐 Не скажу",
                  action: "goto",
                  target: "profile_complete"
                }
              ]
            }
          },
          {
            id: "profile_complete",
            type: "message",
            position: { x: 400, y: 1100 },
            data: {
              messageText: "🎉 Отлично! Ваша анкета заполнена!\n\n📊 Ваш профиль:\n👤 Имя: {имя}\n🎂 Возраст: {возраст}\n👫 Пол: {пол}\n🚇 Метро: {станция_метро}\n💕 Семейное положение: {семейное_положение}\n🏳️‍🌈 Ориентация: {ориентация}\n🎯 Интересы: {интересы}\n\nТеперь можете познакомиться с другими участниками!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_browse_profiles",
                  text: "👀 Смотреть анкеты",
                  action: "goto",
                  target: "browse_profiles"
                },
                {
                  id: "btn_edit_profile",
                  text: "✏️ Редактировать профиль",
                  action: "goto",
                  target: "edit_profile_menu"
                },
                {
                  id: "btn_my_profile",
                  text: "📝 Моя анкета",
                  action: "goto",
                  target: "show_my_profile"
                }
              ]
            }
          },
          {
            id: "browse_profiles",
            type: "message",
            position: { x: 700, y: 1100 },
            data: {
              messageText: "👀 Просмотр анкет\n\n(Здесь будет система просмотра анкет других пользователей)",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_next_profile",
                  text: "➡️ Следующая анкета",
                  action: "goto",
                  target: "browse_profiles"
                },
                {
                  id: "btn_like_profile",
                  text: "❤️ Нравится",
                  action: "command",
                  target: "/like_profile"
                },
                {
                  id: "btn_back_main",
                  text: "🏠 В главное меню",
                  action: "goto",
                  target: "profile_complete"
                }
              ]
            }
          },
          {
            id: "edit_profile_menu",
            type: "keyboard",
            position: { x: 1000, y: 1100 },
            data: {
              messageText: "✏️ Что хотите отредактировать?",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_edit_name",
                  text: "👤 Имя",
                  action: "goto",
                  target: "ask_name"
                },
                {
                  id: "btn_edit_age",
                  text: "🎂 Возраст",
                  action: "goto",
                  target: "ask_age"
                },
                {
                  id: "btn_edit_metro",
                  text: "🚇 Метро",
                  action: "goto",
                  target: "ask_metro"
                },
                {
                  id: "btn_edit_interests",
                  text: "🎯 Интересы",
                  action: "goto",
                  target: "ask_interests"
                },
                {
                  id: "btn_edit_status",
                  text: "💕 Семейное положение",
                  action: "goto",
                  target: "ask_marital_status"
                },
                {
                  id: "btn_back_profile",
                  text: "⬅️ Назад",
                  action: "goto",
                  target: "profile_complete"
                }
              ]
            }
          },
          {
            id: "show_my_profile",
            type: "message",
            position: { x: 1300, y: 1100 },
            data: {
              messageText: "📝 Ваша анкета:\n\n👤 Имя: {имя}\n🎂 Возраст: {возраст} лет\n👫 Пол: {пол}\n🚇 Ближайшее метро: {станция_метро}\n💕 Семейное положение: {семейное_положение}\n🏳️‍🌈 Ориентация: {ориентация}\n🎯 Интересы: {интересы}\n\n💬 Хочет в чат: {хочет_в_чат}",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_back_main_from_profile",
                  text: "🏠 В главное меню",
                  action: "goto",
                  target: "profile_complete"
                },
                {
                  id: "btn_edit_from_profile",
                  text: "✏️ Редактировать",
                  action: "goto",
                  target: "edit_profile_menu"
                }
              ]
            }
          },
          {
            id: "about_bot",
            type: "message",
            position: { x: 100, y: 1300 },
            data: {
              messageText: "ℹ️ О боте знакомств\n\nЭтот бот поможет вам:\n• Создать подробную анкету\n• Найти людей с общими интересами\n• Познакомиться с интересными собеседниками\n• Присоединиться к чату знакомств\n\n🔒 Все ваши данные хранятся безопасно и используются только для поиска совместимых людей.\n\n👥 Присоединяйтесь к нашему сообществу!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn_start_registration",
                  text: "📝 Начать регистрацию",
                  action: "goto",
                  target: "ask_join_chat"
                },
                {
                  id: "btn_back_start",
                  text: "⬅️ Назад",
                  action: "goto",
                  target: "start_dating"
                }
              ]
            }
          }
        ],
        connections: [
          {
            id: "conn_start_to_join",
            source: "start_dating",
            target: "ask_join_chat"
          },
          {
            id: "conn_start_to_about",
            source: "start_dating",
            target: "about_bot"
          },
          {
            id: "conn_about_to_join",
            source: "about_bot",
            target: "ask_join_chat"
          },
          {
            id: "conn_join_to_gender",
            source: "ask_join_chat",
            target: "ask_gender"
          },
          {
            id: "conn_gender_to_name",
            source: "ask_gender",
            target: "ask_name"
          },
          {
            id: "conn_name_to_age",
            source: "ask_name",
            target: "ask_age"
          },
          {
            id: "conn_age_to_metro",
            source: "ask_age",
            target: "ask_metro"
          },
          {
            id: "conn_metro_to_red",
            source: "ask_metro",
            target: "red_line_stations"
          },
          {
            id: "conn_metro_to_blue",
            source: "ask_metro",
            target: "blue_line_stations"
          },
          {
            id: "conn_metro_to_green",
            source: "ask_metro",
            target: "green_line_stations"
          },
          {
            id: "conn_metro_to_interests_direct",
            source: "ask_metro",
            target: "ask_interests"
          },
          {
            id: "conn_red_to_interests",
            source: "red_line_stations",
            target: "ask_interests"
          },
          {
            id: "conn_blue_to_interests", 
            source: "blue_line_stations",
            target: "ask_interests"
          },
          {
            id: "conn_green_to_interests",
            source: "green_line_stations",
            target: "ask_interests"
          },
          {
            id: "conn_red_back_to_metro",
            source: "red_line_stations",
            target: "ask_metro"
          },
          {
            id: "conn_blue_back_to_metro",
            source: "blue_line_stations",
            target: "ask_metro"
          },
          {
            id: "conn_green_back_to_metro",
            source: "green_line_stations",
            target: "ask_metro"
          },
          {
            id: "conn_interests_to_sports",
            source: "ask_interests",
            target: "sports_interests"
          },
          {
            id: "conn_interests_to_culture",
            source: "ask_interests",
            target: "culture_interests"
          },
          {
            id: "conn_interests_to_tech",
            source: "ask_interests",
            target: "tech_interests"
          },
          {
            id: "conn_interests_to_travel",
            source: "ask_interests",
            target: "travel_interests"
          },
          {
            id: "conn_sports_back",
            source: "sports_interests",
            target: "ask_interests"
          },
          {
            id: "conn_culture_back",
            source: "culture_interests",
            target: "ask_interests"
          },
          {
            id: "conn_tech_back",
            source: "tech_interests",
            target: "ask_interests"
          },
          {
            id: "conn_travel_back",
            source: "travel_interests",
            target: "ask_interests"
          },
          {
            id: "conn_interests_to_marital",
            source: "ask_interests",
            target: "ask_marital_status"
          },
          {
            id: "conn_marital_to_orientation",
            source: "ask_marital_status",
            target: "ask_orientation"
          },
          {
            id: "conn_orientation_to_complete",
            source: "ask_orientation",
            target: "profile_complete"
          },
          {
            id: "conn_complete_to_browse",
            source: "profile_complete",
            target: "browse_profiles"
          },
          {
            id: "conn_complete_to_edit",
            source: "profile_complete",
            target: "edit_profile_menu"
          },
          {
            id: "conn_complete_to_show",
            source: "profile_complete",
            target: "show_my_profile"
          },
          {
            id: "conn_browse_back",
            source: "browse_profiles",
            target: "profile_complete"
          },
          {
            id: "conn_edit_back",
            source: "edit_profile_menu",
            target: "profile_complete"
          },
          {
            id: "conn_show_back",
            source: "show_my_profile",
            target: "profile_complete"
          },
          {
            id: "conn_edit_to_name",
            source: "edit_profile_menu",
            target: "ask_name"
          },
          {
            id: "conn_edit_to_age",
            source: "edit_profile_menu",
            target: "ask_age"
          },
          {
            id: "conn_edit_to_metro",
            source: "edit_profile_menu",
            target: "ask_metro"
          },
          {
            id: "conn_edit_to_interests",
            source: "edit_profile_menu",
            target: "ask_interests"
          },
          {
            id: "conn_edit_to_marital",
            source: "edit_profile_menu",
            target: "ask_marital_status"
          }
        ]
      }
    });

    console.log('Базовые шаблоны успешно созданы');
  } catch (error) {
    console.error('Ошибка при создании шаблонов:', error);
  }
}