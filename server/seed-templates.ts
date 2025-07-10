import { storage } from "./storage";

// Стандартные шаблоны для демонстрации
export async function seedDefaultTemplates() {
  try {
    const existingTemplates = await storage.getAllBotTemplates();
    
    // Проверяем, есть ли уже системные шаблоны
    const systemTemplates = existingTemplates.filter(t => t.authorName === 'Система');
    if (systemTemplates.length >= 6) {
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
              messageText: "ℹ️ Информация о нас\n\nМы предоставляем качественные услуги и всегда готовы помочь нашим клиентам.",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-back-1",
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
            id: "contacts-1",
            type: "message",
            position: { x: 350, y: 250 },
            data: {
              messageText: "📞 Наши контакты:\n\n📧 Email: info@example.com\n📱 Телефон: +7 (999) 123-45-67\n🌐 Сайт: example.com",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-back-2",
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

    console.log('Базовые шаблоны успешно созданы');
  } catch (error) {
    console.error('Ошибка при создании шаблонов:', error);
  }
}