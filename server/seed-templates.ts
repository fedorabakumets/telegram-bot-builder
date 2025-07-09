import { storage } from "./storage";

// Стандартные шаблоны для демонстрации
export async function seedDefaultTemplates() {
  try {
    const existingTemplates = await storage.getAllBotTemplates();
    
    // Проверяем, есть ли уже системные шаблоны
    const systemTemplates = existingTemplates.filter(t => t.authorName === 'Система');
    if (systemTemplates.length >= 7) {
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

    // Ультра-комплексный политико-исторический опрос
    await storage.createBotTemplate({
      name: "🏛️ Ультра-Комплексный Политико-Исторический Опрос",
      description: "Масштабный опрос по политологии, истории, философии и социологии с глубоким анализом взглядов и знаний",
      category: "education",
      tags: ["политика", "история", "философия", "социология", "опрос", "анализ", "образование", "комплексный"],
      isPublic: 1,
      difficulty: "hard",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 10,
      estimatedTime: 60,
      data: {
        "nodes": [
          {
            "id": "start-poll",
            "type": "start",
            "position": {"x": 100, "y": 100},
            "data": {
              "command": "/start",
              "description": "Запуск ультра-комплексного политико-исторического опроса",
              "messageText": "🏛️ **ДОБРО ПОЖАЛОВАТЬ В УЛЬТРА-КОМПЛЕКСНЫЙ ПОЛИТИКО-ИСТОРИЧЕСКИЙ ОПРОС!**\n\n📚 Этот опрос включает:\n• 🗳️ **Политические взгляды** (20+ вопросов)\n• 📜 **Историческое знание** (25+ вопросов)\n• 🤔 **Философские воззрения** (15+ вопросов)\n• 🌍 **Социологический анализ** (20+ вопросов)\n\n⏱️ **Время прохождения:** 45-60 минут\n🎯 **Результат:** Подробный анализ ваших взглядов\n\n**Готовы начать глубокое исследование?**",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "start-survey",
                  "text": "🚀 Начать опрос",
                  "action": "goto",
                  "target": "political-intro"
                },
                {
                  "id": "view-sections",
                  "text": "📋 Обзор разделов",
                  "action": "goto",
                  "target": "sections-overview"
                },
                {
                  "id": "instructions",
                  "text": "📖 Инструкции",
                  "action": "goto",
                  "target": "survey-instructions"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "sections-overview",
            "type": "message",
            "position": {"x": 400, "y": 50},
            "data": {
              "messageText": "📋 **РАЗДЕЛЫ ОПРОСА:**\n\n🗳️ **БЛОК А: ПОЛИТОЛОГИЯ** (20 вопросов)\n• Политические предпочтения\n• Отношение к власти и государству\n• Экономические взгляды\n• Социальная политика\n\n📜 **БЛОК Б: ИСТОРИЯ** (25 вопросов)\n• Знание исторических событий\n• Оценка исторических личностей\n• Понимание исторических процессов\n• Альтернативная история\n\n🤔 **БЛОК В: ФИЛОСОФИЯ** (15 вопросов)\n• Этические воззрения\n• Метафизические взгляды\n• Политическая философия\n• Смысл и ценности\n\n🌍 **БЛОК Г: СОЦИОЛОГИЯ** (20 вопросов)\n• Социальные проблемы\n• Межгрупповые отношения\n• Глобализация и культура\n• Будущее общества",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "back-to-start",
                  "text": "⬅️ Назад к началу",
                  "action": "goto",
                  "target": "start-poll"
                },
                {
                  "id": "start-from-overview",
                  "text": "🚀 Начать опрос",
                  "action": "goto",
                  "target": "political-intro"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "political-intro",
            "type": "message",
            "position": {"x": 700, "y": 100},
            "data": {
              "messageText": "🗳️ **БЛОК А: ПОЛИТОЛОГИЯ**\n\n**Исследуем ваши политические взгляды и предпочтения**\n\nВ этом блоке 20 вопросов о:\n• Роли государства в экономике\n• Социальной политике\n• Международных отношениях\n• Правах и свободах\n• Политических системах\n\n**Готовы начать политический анализ?**",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "start-political",
                  "text": "🗳️ Начать политблок",
                  "action": "goto",
                  "target": "pol-q1"
                },
                {
                  "id": "skip-to-history",
                  "text": "📜 Перейти к истории",
                  "action": "goto",
                  "target": "history-intro"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "pol-q1",
            "type": "message",
            "position": {"x": 1000, "y": 250},
            "data": {
              "messageText": "🗳️ **ВОПРОС 1/20** (Политология)\n\n**Какую роль должно играть государство в экономике?**\n\nВыберите наиболее близкий вам вариант:",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "pol-q1-opt1",
                  "text": "A) Минимальная роль - свободный...",
                  "action": "goto",
                  "target": "pol-q1-result"
                },
                {
                  "id": "pol-q1-opt2",
                  "text": "B) Умеренное регулирование...",
                  "action": "goto",
                  "target": "pol-q1-result"
                },
                {
                  "id": "pol-q1-opt3",
                  "text": "C) Активное вмешательство...",
                  "action": "goto",
                  "target": "pol-q1-result"
                },
                {
                  "id": "pol-q1-opt4",
                  "text": "D) Полный государственный...",
                  "action": "goto",
                  "target": "pol-q1-result"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "pol-q1-result",
            "type": "message",
            "position": {"x": 1400, "y": 250},
            "data": {
              "messageText": "✅ **Ответ записан!**\n\n**Полные варианты ответа:**\n\nA) Минимальная роль - свободный рынок\n\nB) Умеренное регулирование ключевых отраслей\n\nC) Активное вмешательство и планирование\n\nD) Полный государственный контроль\n\n📊 **Прогресс:** 1/20 вопросов политблока",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "pol-q1-next",
                  "text": "➡️ Следующий вопрос",
                  "action": "goto",
                  "target": "history-intro"
                },
                {
                  "id": "pol-q1-skip-to-history",
                  "text": "📜 Перейти к истории",
                  "action": "goto",
                  "target": "history-intro"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "history-intro",
            "type": "message",
            "position": {"x": 100, "y": 500},
            "data": {
              "messageText": "📜 **БЛОК Б: ИСТОРИЯ**\n\n**Проверим ваши исторические знания и интерпретации**\n\nВ этом блоке 25 вопросов о:\n• Ключевых исторических событиях\n• Великих исторических личностях\n• Причинах и последствиях событий\n• Альтернативных сценариях развития\n• Исторических параллелях\n\n**Готовы окунуться в историю?**",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "start-history",
                  "text": "📜 Начать истблок",
                  "action": "goto",
                  "target": "hist-q1"
                },
                {
                  "id": "skip-to-philosophy",
                  "text": "🤔 Перейти к философии",
                  "action": "goto",
                  "target": "philosophy-intro"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "hist-q1",
            "type": "message",
            "position": {"x": 400, "y": 700},
            "data": {
              "messageText": "📜 **ВОПРОС 1/25** (История)\n\n**Что стало главной причиной Первой мировой войны?**\n\nВыберите наиболее правильный ответ:",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "hist-q1-opt1",
                  "text": "A) Убийство эрцгерцога...",
                  "action": "goto",
                  "target": "hist-q1-result"
                },
                {
                  "id": "hist-q1-opt2",
                  "text": "B) Империалистические противоречия...",
                  "action": "goto",
                  "target": "hist-q1-result"
                },
                {
                  "id": "hist-q1-opt3",
                  "text": "C) Национальные движения...",
                  "action": "goto",
                  "target": "hist-q1-result"
                },
                {
                  "id": "hist-q1-opt4",
                  "text": "D) Гонка вооружений...",
                  "action": "goto",
                  "target": "hist-q1-result"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "hist-q1-result",
            "type": "message",
            "position": {"x": 800, "y": 700},
            "data": {
              "messageText": "✅ **Исторический факт зафиксирован!**\n\n**Полные варианты:**\n\nA) Убийство эрцгерцога Франца Фердинанда\n\nB) Империалистические противоречия великих держав\n\nC) Национальные движения на Балканах\n\nD) Гонка вооружений и милитаризм\n\n📊 **Прогресс:** 1/25 вопросов историблока",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "hist-q1-next",
                  "text": "🤔 К блоку Философия",
                  "action": "goto",
                  "target": "philosophy-intro"
                },
                {
                  "id": "hist-q1-skip-to-philosophy",
                  "text": "🤔 Перейти к философии",
                  "action": "goto",
                  "target": "philosophy-intro"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "philosophy-intro",
            "type": "message",
            "position": {"x": 100, "y": 1000},
            "data": {
              "messageText": "🤔 **БЛОК В: ФИЛОСОФИЯ**\n\n**Исследуем ваши мировоззренческие установки**\n\nВ этом блоке 15 вопросов о:\n• Этических принципах и морали\n• Метафизических взглядах на реальность\n• Смысле жизни и ценностях\n• Политической философии\n• Эпистемологии и познании\n\n**Готовы к философскому анализу?**",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "start-philosophy",
                  "text": "🤔 Начать филблок",
                  "action": "goto",
                  "target": "phil-q1"
                },
                {
                  "id": "skip-to-sociology",
                  "text": "🌍 Перейти к социологии",
                  "action": "goto",
                  "target": "sociology-intro"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "phil-q1",
            "type": "message",
            "position": {"x": 400, "y": 1200},
            "data": {
              "messageText": "🤔 **ВОПРОС 1/15** (Философия)\n\n**Что является основой моральных суждений?**\n\nВыберите ваш философский взгляд:",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "phil-q1-opt1",
                  "text": "A) Врожденные моральные...",
                  "action": "goto",
                  "target": "phil-q1-result"
                },
                {
                  "id": "phil-q1-opt2",
                  "text": "B) Последствия действий...",
                  "action": "goto",
                  "target": "phil-q1-result"
                },
                {
                  "id": "phil-q1-opt3",
                  "text": "C) Долг и универсальные...",
                  "action": "goto",
                  "target": "phil-q1-result"
                },
                {
                  "id": "phil-q1-opt4",
                  "text": "D) Социальные соглашения...",
                  "action": "goto",
                  "target": "phil-q1-result"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "phil-q1-result",
            "type": "message",
            "position": {"x": 800, "y": 1200},
            "data": {
              "messageText": "✅ **Философская позиция учтена!**\n\n**Варианты размышления:**\n\nA) Врожденные моральные интуиции\n\nB) Последствия действий (утилитаризм)\n\nC) Долг и универсальные принципы\n\nD) Социальные соглашения и культура\n\n📊 **Прогресс:** 1/15 вопросов филблока",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "phil-q1-next",
                  "text": "🌍 К блоку Социология",
                  "action": "goto",
                  "target": "sociology-intro"
                },
                {
                  "id": "phil-q1-skip-to-sociology",
                  "text": "🌍 Перейти к социологии",
                  "action": "goto",
                  "target": "sociology-intro"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "sociology-intro",
            "type": "message",
            "position": {"x": 100, "y": 1500},
            "data": {
              "messageText": "🌍 **БЛОК Г: СОЦИОЛОГИЯ**\n\n**Изучаем ваши взгляды на общество и социальные процессы**\n\nВ этом блоке 20 вопросов о:\n• Социальном неравенстве и стратификации\n• Глобализации и культурных изменениях\n• Межгрупповых отношениях\n• Технологиях и будущем общества\n• Социальных проблемах современности\n\n**Готовы к социологическому анализу?**",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "start-sociology",
                  "text": "🌍 Начать социоблок",
                  "action": "goto",
                  "target": "soc-q1"
                },
                {
                  "id": "skip-to-results",
                  "text": "📊 Перейти к результатам",
                  "action": "goto",
                  "target": "final-results"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "soc-q1",
            "type": "message",
            "position": {"x": 400, "y": 1700},
            "data": {
              "messageText": "🌍 **ВОПРОС 1/20** (Социология)\n\n**Главная причина социального неравенства:**\n\nВыберите ваш социологический взгляд:",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "soc-q1-opt1",
                  "text": "A) Различия в способностях...",
                  "action": "goto",
                  "target": "soc-q1-result"
                },
                {
                  "id": "soc-q1-opt2",
                  "text": "B) Структурные особенности...",
                  "action": "goto",
                  "target": "soc-q1-result"
                },
                {
                  "id": "soc-q1-opt3",
                  "text": "C) Культурные и образовательные...",
                  "action": "goto",
                  "target": "soc-q1-result"
                },
                {
                  "id": "soc-q1-opt4",
                  "text": "D) Исторические факторы...",
                  "action": "goto",
                  "target": "soc-q1-result"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "soc-q1-result",
            "type": "message",
            "position": {"x": 800, "y": 1700},
            "data": {
              "messageText": "✅ **Социологическая позиция зафиксирована!**\n\n**Варианты анализа:**\n\nA) Различия в способностях и таланте\n\nB) Структурные особенности экономической системы\n\nC) Культурные и образовательные различия\n\nD) Исторические факторы и наследие прошлого\n\n📊 **Прогресс:** 1/20 вопросов социоблока",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "soc-q1-next",
                  "text": "🎉 К результатам!",
                  "action": "goto",
                  "target": "final-results"
                },
                {
                  "id": "soc-q1-skip-to-results",
                  "text": "📊 К результатам",
                  "action": "goto",
                  "target": "final-results"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "final-results",
            "type": "message",
            "position": {"x": 100, "y": 2000},
            "data": {
              "messageText": "🎉 **ПОЗДРАВЛЯЕМ С ЗАВЕРШЕНИЕМ УЛЬТРА-КОМПЛЕКСНОГО ОПРОСА!**\n\n📊 **ВАШИ РЕЗУЛЬТАТЫ:**\n\n🗳️ **Политический профиль:** Анализируется...\n📜 **Историческая компетентность:** Оценивается...\n🤔 **Философские взгляды:** Обрабатываются...\n🌍 **Социологические позиции:** Систематизируются...\n\n⏱️ **Время прохождения:** Впечатляющая стойкость!\n🎯 **Полнота ответов:** 80+ вопросов пройдено\n\n**Подробный анализ готовится...**",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "detailed-analysis",
                  "text": "📊 Детальный анализ",
                  "action": "goto",
                  "target": "detailed-analysis"
                },
                {
                  "id": "recommendations",
                  "text": "📚 Рекомендации",
                  "action": "goto",
                  "target": "recommendations"
                },
                {
                  "id": "restart-survey",
                  "text": "🔄 Пройти снова",
                  "action": "goto",
                  "target": "start-poll"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "detailed-analysis",
            "type": "message",
            "position": {"x": 400, "y": 2200},
            "data": {
              "messageText": "📊 **ДЕТАЛЬНЫЙ АНАЛИЗ РЕЗУЛЬТАТОВ**\n\n🗳️ **ПОЛИТИЧЕСКИЙ БЛОК:**\n• Экономические взгляды: Смешанная экономика\n• Социальная политика: Умеренно-прогрессивная\n• Внешняя политика: Многосторонность\n• Авторитаризм vs Либерализм: Либерально-демократический\n\n📜 **ИСТОРИЧЕСКИЙ БЛОК:**\n• Знание фактов: Высокий уровень\n• Понимание процессов: Системное мышление\n• Интерпретация событий: Многофакторный анализ\n• Исторические параллели: Развитое понимание\n\n🤔 **ФИЛОСОФСКИЙ БЛОК:**\n• Этика: Деонтологическо-утилитарный синтез\n• Метафизика: Материалистический реализм\n• Эпистемология: Критический рационализм\n• Смысл жизни: Самоактуализация и служение\n\n🌍 **СОЦИОЛОГИЧЕСКИЙ БЛОК:**\n• Социальное неравенство: Структурно обусловлено\n• Глобализация: Сложный процесс с плюсами и минусами\n• Технологии: Трансформируют общество\n• Будущее: Осторожный оптимизм",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "back-to-results",
                  "text": "⬅️ К результатам",
                  "action": "goto",
                  "target": "final-results"
                },
                {
                  "id": "profile-comparison",
                  "text": "👥 Сравнение с профилями",
                  "action": "goto",
                  "target": "profile-comparison"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "profile-comparison",
            "type": "message",
            "position": {"x": 800, "y": 2200},
            "data": {
              "messageText": "👥 **СРАВНЕНИЕ С ТИПИЧНЫМИ ПРОФИЛЯМИ**\n\n🎯 **Ваш профиль наиболее близок к:**\n\n**\"Просвещенный Центрист\"** - 87% совпадение\n• Рациональный подход к политике\n• Глубокое понимание истории\n• Философская рефлексивность\n• Системное мышление о обществе\n\n📊 **Другие близкие профили:**\n• Либеральный Интеллектуал - 78%\n• Прогрессивный Прагматик - 74%\n• Социал-демократ - 71%\n\n🔍 **Уникальные черты вашего профиля:**\n• Балансирование противоположных взглядов\n• Критическое мышление с открытостью\n• Исторический контекст в политических суждениях\n• Философская глубина в социальном анализе\n\n**Вы демонстрируете редкое сочетание аналитического мышления и человечности!**",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "back-to-analysis",
                  "text": "⬅️ К анализу",
                  "action": "goto",
                  "target": "detailed-analysis"
                },
                {
                  "id": "view-recommendations",
                  "text": "📚 Рекомендации",
                  "action": "goto",
                  "target": "recommendations"
                }
              ],
              "markdown": true
            }
          },
          {
            "id": "recommendations",
            "type": "message",
            "position": {"x": 400, "y": 2400},
            "data": {
              "messageText": "📚 **ПЕРСОНАЛЬНЫЕ РЕКОМЕНДАЦИИ ДЛЯ РАЗВИТИЯ**\n\n📖 **Книги для углубления знаний:**\n• \"Политическая философия\" - Роберт Пол Вольф\n• \"Столкновение цивилизаций\" - Сэмюэл Хантингтон\n• \"Справедливость\" - Майкл Сэндел\n• \"Постиндустриальное общество\" - Дэниел Белл\n\n🎓 **Области для изучения:**\n• Сравнительная политология\n• Философия истории\n• Социальная психология\n• Глобальная политическая экономия\n\n💭 **Темы для размышления:**\n• Как совместить индивидуальные права и общественное благо?\n• Какие уроки истории актуальны для современности?\n• Как технологии изменят природу демократии?\n• Возможно ли справедливое глобальное управление?\n\n🌟 **Практические рекомендации:**\n• Участвуйте в общественных дискуссиях\n• Изучайте разные точки зрения\n• Применяйте исторический анализ к современным событиям\n• Развивайте критическое мышление",
              "keyboardType": "inline",
              "buttons": [
                {
                  "id": "back-to-results-final",
                  "text": "⬅️ К результатам",
                  "action": "goto",
                  "target": "final-results"
                },
                {
                  "id": "new-survey",
                  "text": "🆕 Новый опрос",
                  "action": "goto",
                  "target": "start-poll"
                }
              ],
              "markdown": true
            }
          }
        ],
        "connections": [
          {
            "id": "conn-start-overview",
            "source": "start-poll",
            "target": "sections-overview"
          },
          {
            "id": "conn-start-instructions",
            "source": "start-poll",
            "target": "survey-instructions"
          },
          {
            "id": "conn-start-political",
            "source": "start-poll",
            "target": "political-intro"
          },
          {
            "id": "conn-overview-start",
            "source": "sections-overview",
            "target": "start-poll"
          },
          {
            "id": "conn-political-history",
            "source": "political-intro",
            "target": "history-intro"
          },
          {
            "id": "conn-history-philosophy",
            "source": "history-intro",
            "target": "philosophy-intro"
          },
          {
            "id": "conn-philosophy-sociology",
            "source": "philosophy-intro",
            "target": "sociology-intro"
          },
          {
            "id": "conn-sociology-results",
            "source": "sociology-intro",
            "target": "final-results"
          },
          {
            "id": "conn-results-analysis",
            "source": "final-results",
            "target": "detailed-analysis"
          },
          {
            "id": "conn-analysis-comparison",
            "source": "detailed-analysis",
            "target": "profile-comparison"
          },
          {
            "id": "conn-results-recommendations",
            "source": "final-results",
            "target": "recommendations"
          }
        ]
      }
    });

    // Простой опрос с пользовательским вводом
    await storage.createBotTemplate({
      name: "📝 Опрос с текстовым вводом",
      description: "Простой бот для сбора обратной связи от пользователей с полем для ввода текста",
      category: "business",
      tags: ["опрос", "ввод", "обратная связь", "анкета"],
      isPublic: 1,
      difficulty: "medium",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 4,
      estimatedTime: 15,
      data: {
        nodes: [
          {
            id: "start-1",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Приветствие и начало опроса",
              messageText: "👋 Добро пожаловать в бот обратной связи!\n\nМы очень ценим мнение наших пользователей. Поделитесь своими впечатлениями!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-start-survey",
                  text: "📝 Начать опрос",
                  action: "goto",
                  target: "survey-question"
                },
                {
                  id: "btn-skip",
                  text: "⏭️ Пропустить",
                  action: "goto",
                  target: "thank-you"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "survey-question",
            type: "message",
            position: { x: 400, y: 100 },
            data: {
              messageText: "📋 **Вопрос 1 из 2**\n\nКак бы вы оценили качество нашего сервиса?",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-excellent",
                  text: "⭐⭐⭐⭐⭐ Отлично",
                  action: "goto",
                  target: "feedback-input"
                },
                {
                  id: "btn-good",
                  text: "⭐⭐⭐⭐ Хорошо",
                  action: "goto",
                  target: "feedback-input"
                },
                {
                  id: "btn-average",
                  text: "⭐⭐⭐ Средне",
                  action: "goto",
                  target: "feedback-input"
                },
                {
                  id: "btn-poor",
                  text: "⭐⭐ Плохо",
                  action: "goto",
                  target: "feedback-input"
                },
                {
                  id: "btn-terrible",
                  text: "⭐ Ужасно",
                  action: "goto",
                  target: "feedback-input"
                }
              ],
              markdown: true,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "feedback-input",
            type: "user-input",
            position: { x: 700, y: 100 },
            data: {
              messageText: "💬 **Вопрос 2 из 2**\n\nРасскажите подробнее о своих впечатлениях. Что вам понравилось или что можно улучшить?\n\n✍️ Напишите ваш отзыв:",
              inputType: "text",
              inputVariable: "user_feedback",
              placeholder: "Введите ваш отзыв здесь...",
              isRequired: true,
              minLength: 10,
              maxLength: 500,
              validationMessage: "Пожалуйста, введите отзыв от 10 до 500 символов",
              timeoutSeconds: 300,
              timeoutMessage: "⏰ Время для ввода истекло. Попробуйте снова позже.",
              saveToDatabase: true,
              successTarget: "thank-you",
              errorTarget: "feedback-error"
            }
          },
          {
            id: "feedback-error",
            type: "message",
            position: { x: 700, y: 250 },
            data: {
              messageText: "❌ **Ошибка ввода**\n\nПожалуйста, введите корректный отзыв (от 10 до 500 символов).\n\nПопробуйте ещё раз:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-retry",
                  text: "🔄 Повторить ввод",
                  action: "goto",
                  target: "feedback-input"
                },
                {
                  id: "btn-skip-feedback",
                  text: "⏭️ Пропустить",
                  action: "goto",
                  target: "thank-you"
                }
              ],
              markdown: true,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "thank-you",
            type: "message",
            position: { x: 1000, y: 100 },
            data: {
              messageText: "🎉 **Спасибо за участие!**\n\nВаша обратная связь очень важна для нас и поможет улучшить наш сервис.\n\nЕсли у вас есть ещё вопросы или предложения, не стесняйтесь обращаться!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-restart",
                  text: "🔄 Пройти опрос снова",
                  action: "goto",
                  target: "start-1"
                },
                {
                  id: "btn-help",
                  text: "❓ Помощь",
                  action: "command",
                  target: "/help"
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

    // Комплексный шаблон сбора пользовательского ввода
    await storage.createBotTemplate({
      name: "📊 Комплексный сбор данных",
      description: "Демонстрация всех типов сбора пользовательского ввода: текстовый, кнопочный, множественный выбор, медиа",
      category: "official",
      tags: ["сбор данных", "формы", "опросы", "ввод", "кнопки"],
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
            id: "start-1",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Начало сбора данных",
              messageText: "🎯 **Добро пожаловать в систему сбора данных!**\n\nЭтот бот демонстрирует все возможности сбора пользовательского ввода:\n\n• 📝 Текстовый ввод\n• 🔘 Кнопочные ответы\n• ☑️ Множественный выбор\n• 📱 Медиа файлы\n• 📊 Структурированные данные\n\nНачнем сбор ваших данных?",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-start-survey",
                  text: "🚀 Начать сбор данных",
                  action: "goto",
                  target: "name-input"
                },
                {
                  id: "btn-skip-all",
                  text: "⏭️ Пропустить все",
                  action: "goto",
                  target: "final-results"
                }
              ],
              markdown: true,
              formatMode: "html",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "name-input",
            type: "user-input",
            position: { x: 400, y: 100 },
            data: {
              messageText: "👤 **Шаг 1: Персональные данные**\n\n<b>Как вас зовут?</b>\n\nВведите ваше имя (от 2 до 50 символов):",
              responseType: "text",
              inputType: "text",
              inputVariable: "user_name",
              placeholder: "Введите ваше имя...",
              isRequired: true,
              minLength: 2,
              maxLength: 50,
              validationMessage: "Имя должно содержать от 2 до 50 символов",
              timeoutSeconds: 120,
              timeoutMessage: "⏰ Время ввода истекло. Попробуйте снова.",
              saveToDatabase: true,
              successTarget: "age-buttons",
              errorTarget: "name-error",
              formatMode: "html"
            }
          },
          {
            id: "name-error",
            type: "message",
            position: { x: 400, y: 250 },
            data: {
              messageText: "❌ **Ошибка ввода имени**\n\nПожалуйста, введите корректное имя (от 2 до 50 символов).\n\nПопробуйте ещё раз:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-retry-name",
                  text: "🔄 Повторить ввод",
                  action: "goto",
                  target: "name-input"
                },
                {
                  id: "btn-skip-name",
                  text: "⏭️ Пропустить",
                  action: "goto",
                  target: "age-buttons"
                }
              ],
              markdown: true,
              formatMode: "html",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "age-buttons",
            type: "user-input",
            position: { x: 700, y: 100 },
            data: {
              messageText: "🎂 **Шаг 2: Возрастная группа**\n\n<b>Выберите вашу возрастную группу:</b>\n\nИспользуйте кнопки для выбора:",
              responseType: "buttons",
              responseOptions: [
                {
                  id: "age-18-25",
                  text: "18-25 лет",
                  value: "18-25"
                },
                {
                  id: "age-26-35",
                  text: "26-35 лет",
                  value: "26-35"
                },
                {
                  id: "age-36-45",
                  text: "36-45 лет",
                  value: "36-45"
                },
                {
                  id: "age-46-55",
                  text: "46-55 лет",
                  value: "46-55"
                },
                {
                  id: "age-55+",
                  text: "55+ лет",
                  value: "55+"
                }
              ],
              allowMultipleSelection: false,
              inputVariable: "user_age_group",
              isRequired: true,
              saveToDatabase: true,
              successTarget: "interests-multiple",
              errorTarget: "age-error",
              formatMode: "html"
            }
          },
          {
            id: "age-error",
            type: "message",
            position: { x: 700, y: 250 },
            data: {
              messageText: "❌ **Ошибка выбора возраста**\n\nПожалуйста, выберите одну из предложенных возрастных групп.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-retry-age",
                  text: "🔄 Повторить выбор",
                  action: "goto",
                  target: "age-buttons"
                },
                {
                  id: "btn-skip-age",
                  text: "⏭️ Пропустить",
                  action: "goto",
                  target: "interests-multiple"
                }
              ],
              markdown: true,
              formatMode: "html",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "interests-multiple",
            type: "user-input",
            position: { x: 1000, y: 100 },
            data: {
              messageText: "🎯 **Шаг 3: Интересы (множественный выбор)**\n\n<b>Выберите ваши интересы (можно несколько):</b>\n\nВыберите все подходящие варианты и нажмите \"Готово\":",
              responseType: "buttons",
              responseOptions: [
                {
                  id: "int-tech",
                  text: "💻 Технологии",
                  value: "technology"
                },
                {
                  id: "int-sport",
                  text: "⚽ Спорт",
                  value: "sport"
                },
                {
                  id: "int-music",
                  text: "🎵 Музыка",
                  value: "music"
                },
                {
                  id: "int-travel",
                  text: "✈️ Путешествия",
                  value: "travel"
                },
                {
                  id: "int-cooking",
                  text: "👨‍🍳 Кулинария",
                  value: "cooking"
                },
                {
                  id: "int-books",
                  text: "📚 Книги",
                  value: "books"
                },
                {
                  id: "int-done",
                  text: "✅ Готово",
                  value: "done"
                }
              ],
              allowMultipleSelection: true,
              inputVariable: "user_interests",
              isRequired: true,
              saveToDatabase: true,
              successTarget: "contact-input",
              errorTarget: "interests-error",
              formatMode: "html"
            }
          },
          {
            id: "interests-error",
            type: "message",
            position: { x: 1000, y: 250 },
            data: {
              messageText: "❌ **Ошибка выбора интересов**\n\nПожалуйста, выберите хотя бы один интерес и нажмите \"Готово\".",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-retry-interests",
                  text: "🔄 Повторить выбор",
                  action: "goto",
                  target: "interests-multiple"
                },
                {
                  id: "btn-skip-interests",
                  text: "⏭️ Пропустить",
                  action: "goto",
                  target: "contact-input"
                }
              ],
              markdown: true,
              formatMode: "html",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "contact-input",
            type: "user-input",
            position: { x: 1300, y: 100 },
            data: {
              messageText: "📱 **Шаг 4: Контактная информация**\n\n<b>Введите ваш email или телефон:</b>\n\nМы используем эти данные для связи с вами:",
              responseType: "text",
              inputType: "email",
              inputVariable: "user_contact",
              placeholder: "example@email.com или +7-999-123-45-67",
              isRequired: false,
              minLength: 5,
              maxLength: 100,
              validationMessage: "Введите корректный email или телефон",
              timeoutSeconds: 180,
              timeoutMessage: "⏰ Время ввода истекло. Переходим к следующему шагу.",
              saveToDatabase: true,
              successTarget: "experience-rating",
              errorTarget: "contact-error",
              formatMode: "html"
            }
          },
          {
            id: "contact-error",
            type: "message",
            position: { x: 1300, y: 250 },
            data: {
              messageText: "❌ **Ошибка ввода контактов**\n\nПожалуйста, введите корректный email или номер телефона.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-retry-contact",
                  text: "🔄 Повторить ввод",
                  action: "goto",
                  target: "contact-input"
                },
                {
                  id: "btn-skip-contact",
                  text: "⏭️ Пропустить",
                  action: "goto",
                  target: "experience-rating"
                }
              ],
              markdown: true,
              formatMode: "html",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "experience-rating",
            type: "user-input",
            position: { x: 1600, y: 100 },
            data: {
              messageText: "⭐ **Шаг 5: Оценка опыта**\n\n<b>Как вы оцениваете опыт использования этого бота?</b>\n\nВыберите количество звезд:",
              responseType: "buttons",
              responseOptions: [
                {
                  id: "star-1",
                  text: "⭐ 1 звезда",
                  value: "1"
                },
                {
                  id: "star-2",
                  text: "⭐⭐ 2 звезды",
                  value: "2"
                },
                {
                  id: "star-3",
                  text: "⭐⭐⭐ 3 звезды",
                  value: "3"
                },
                {
                  id: "star-4",
                  text: "⭐⭐⭐⭐ 4 звезды",
                  value: "4"
                },
                {
                  id: "star-5",
                  text: "⭐⭐⭐⭐⭐ 5 звезд",
                  value: "5"
                }
              ],
              allowMultipleSelection: false,
              inputVariable: "user_rating",
              isRequired: true,
              saveToDatabase: true,
              successTarget: "final-comment",
              errorTarget: "rating-error",
              formatMode: "html"
            }
          },
          {
            id: "rating-error",
            type: "message",
            position: { x: 1600, y: 250 },
            data: {
              messageText: "❌ **Ошибка оценки**\n\nПожалуйста, выберите оценку от 1 до 5 звезд.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-retry-rating",
                  text: "🔄 Повторить оценку",
                  action: "goto",
                  target: "experience-rating"
                },
                {
                  id: "btn-skip-rating",
                  text: "⏭️ Пропустить",
                  action: "goto",
                  target: "final-comment"
                }
              ],
              markdown: true,
              formatMode: "html",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "final-comment",
            type: "user-input",
            position: { x: 1900, y: 100 },
            data: {
              messageText: "💭 **Шаг 6: Заключительный комментарий**\n\n<b>Есть ли у вас дополнительные комментарии или предложения?</b>\n\nНапишите ваше мнение (необязательно):",
              responseType: "text",
              inputType: "text",
              inputVariable: "user_comment",
              placeholder: "Ваши комментарии и предложения...",
              isRequired: false,
              minLength: 0,
              maxLength: 1000,
              validationMessage: "Комментарий не должен превышать 1000 символов",
              timeoutSeconds: 300,
              timeoutMessage: "⏰ Время ввода истекло. Завершаем сбор данных.",
              saveToDatabase: true,
              successTarget: "final-results",
              errorTarget: "comment-error",
              formatMode: "html"
            }
          },
          {
            id: "comment-error",
            type: "message",
            position: { x: 1900, y: 250 },
            data: {
              messageText: "❌ **Ошибка комментария**\n\nКомментарий слишком длинный. Максимум 1000 символов.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-retry-comment",
                  text: "🔄 Повторить ввод",
                  action: "goto",
                  target: "final-comment"
                },
                {
                  id: "btn-skip-comment",
                  text: "⏭️ Пропустить",
                  action: "goto",
                  target: "final-results"
                }
              ],
              markdown: true,
              formatMode: "html",
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "final-results",
            type: "message",
            position: { x: 2200, y: 100 },
            data: {
              messageText: "🎉 **Сбор данных завершен!**\n\n<b>Спасибо за участие!</b>\n\nВы успешно продемонстрировали все типы сбора пользовательского ввода:\n\n✅ <b>Текстовый ввод</b> - имя и комментарии\n✅ <b>Одиночный выбор</b> - возраст и рейтинг\n✅ <b>Множественный выбор</b> - интересы\n✅ <b>Валидация данных</b> - проверка email/телефона\n✅ <b>Обработка ошибок</b> - повторы и пропуски\n\nВсе данные сохранены в базе данных и готовы к анализу.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-restart",
                  text: "🔄 Пройти снова",
                  action: "goto",
                  target: "start-1"
                },
                {
                  id: "btn-admin",
                  text: "👨‍💼 Панель управления",
                  action: "command",
                  target: "/admin"
                }
              ],
              markdown: true,
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
            target: "name-input"
          },
          {
            id: "conn-2",
            source: "start-1",
            target: "final-results"
          },
          {
            id: "conn-3",
            source: "name-input",
            target: "age-buttons"
          },
          {
            id: "conn-4",
            source: "name-input",
            target: "name-error"
          },
          {
            id: "conn-5",
            source: "name-error",
            target: "name-input"
          },
          {
            id: "conn-6",
            source: "name-error",
            target: "age-buttons"
          },
          {
            id: "conn-7",
            source: "age-buttons",
            target: "interests-multiple"
          },
          {
            id: "conn-8",
            source: "age-buttons",
            target: "age-error"
          },
          {
            id: "conn-9",
            source: "age-error",
            target: "age-buttons"
          },
          {
            id: "conn-10",
            source: "age-error",
            target: "interests-multiple"
          },
          {
            id: "conn-11",
            source: "interests-multiple",
            target: "contact-input"
          },
          {
            id: "conn-12",
            source: "interests-multiple",
            target: "interests-error"
          },
          {
            id: "conn-13",
            source: "interests-error",
            target: "interests-multiple"
          },
          {
            id: "conn-14",
            source: "interests-error",
            target: "contact-input"
          },
          {
            id: "conn-15",
            source: "contact-input",
            target: "experience-rating"
          },
          {
            id: "conn-16",
            source: "contact-input",
            target: "contact-error"
          },
          {
            id: "conn-17",
            source: "contact-error",
            target: "contact-input"
          },
          {
            id: "conn-18",
            source: "contact-error",
            target: "experience-rating"
          },
          {
            id: "conn-19",
            source: "experience-rating",
            target: "final-comment"
          },
          {
            id: "conn-20",
            source: "experience-rating",
            target: "rating-error"
          },
          {
            id: "conn-21",
            source: "rating-error",
            target: "experience-rating"
          },
          {
            id: "conn-22",
            source: "rating-error",
            target: "final-comment"
          },
          {
            id: "conn-23",
            source: "final-comment",
            target: "final-results"
          },
          {
            id: "conn-24",
            source: "final-comment",
            target: "comment-error"
          },
          {
            id: "conn-25",
            source: "comment-error",
            target: "final-comment"
          },
          {
            id: "conn-26",
            source: "comment-error",
            target: "final-results"
          },
          {
            id: "conn-27",
            source: "final-results",
            target: "start-1"
          }
        ]
      }
    });

    console.log('✅ Стандартные шаблоны успешно созданы');
  } catch (error) {
    console.error('❌ Ошибка создания стандартных шаблонов:', error);
  }
}