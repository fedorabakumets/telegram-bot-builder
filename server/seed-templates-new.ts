import { storage } from "./storage";
import { nanoid } from "nanoid";

// Шаблоны с поддержкой листов
async function seedTemplatesWithSheets(force = false) {
  try {
    console.log(`📋 seedTemplatesWithSheets вызван с force=${force}`);
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

    // Создаем шаблон VProgulke Bot с листами
    await storage.createBotTemplate({
      name: "🌟 VProgulke Bot - Знакомства СПб (4 листа)",
      description: "Продвинутый бот знакомств для Санкт-Петербурга. Организован в 4 листа: основная анкета, метро, интересы и профиль.",
      category: "community",
      tags: ["знакомства", "профиль", "метро", "интересы", "СПб", "анкета", "листы"],
      isPublic: 1,
      difficulty: "medium",
      authorName: "Система",
      version: "4.0.0",
      featured: 1,
      language: "ru",
      complexity: 6,
      estimatedTime: 25,
      data: {
        version: 2,
        activeSheetId: "sheet_main",
        sheets: [
          // Лист 1: Основная анкета
          {
            id: "sheet_main",
            name: "Основная анкета",
            viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
            createdAt: new Date(),
            updatedAt: new Date(),
            nodes: [
              {
                id: "start",
                type: "start",
                position: { x: 100, y: 100 },
                data: {
                  command: "/start",
                  description: "Приветствие",
                  messageText: "🌟 Привет от ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot!\n\nЭтот бот поможет тебе найти интересных людей в Санкт-Петербурге!\n\nОткуда ты узнал о нашем чате? 😎",
                  synonyms: ["старт", "начать", "привет"],
                  keyboardType: "none",
                  buttons: [],
                  collectUserInput: true,
                  enableTextInput: true,
                  inputVariable: "user_source",
                  inputTargetNodeId: "join_request",
                  markdown: false
                }
              },
              {
                id: "join_request", 
                type: "message",
                position: { x: 100, y: 300 },
                data: {
                  messageText: "Хочешь присоединиться к нашему чату? 🚀",
                  keyboardType: "inline",
                  collectUserInput: true,
                  inputVariable: "join_request_response",
                  buttons: [
                    {
                      id: "btn-yes",
                      text: "Да 😎", 
                      value: "yes",
                      action: "goto",
                      target: "gender_selection",
                      buttonType: "option"
                    },
                    {
                      id: "btn-no",
                      text: "Нет 🙅",
                      value: "no", 
                      action: "goto",
                      target: "decline_response",
                      buttonType: "option"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "decline_response",
                type: "message", 
                position: { x: 400, y: 300 },
                data: {
                  messageText: "Понятно! Если передумаешь, напиши /start! 😊",
                  keyboardType: "none",
                  buttons: [],
                  markdown: false
                }
              },
              {
                id: "gender_selection",
                type: "message",
                position: { x: 100, y: 500 },
                data: {
                  messageText: "Укажи свой пол: 👨👩",
                  keyboardType: "inline",
                  collectUserInput: true,
                  inputVariable: "gender",
                  buttons: [
                    {
                      id: "btn-male",
                      text: "Мужчина 👨",
                      value: "male",
                      action: "goto",
                      target: "name_input",
                      buttonType: "option"
                    },
                    {
                      id: "btn-female", 
                      text: "Женщина 👩",
                      value: "female",
                      action: "goto",
                      target: "name_input",
                      buttonType: "option"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "name_input",
                type: "message",
                position: { x: 100, y: 700 },
                data: {
                  messageText: "Как тебя зовут? ✏️\n\nНапиши своё имя:",
                  keyboardType: "none",
                  collectUserInput: true,
                  enableTextInput: true,
                  inputVariable: "user_name",
                  inputTargetNodeId: "age_input",
                  buttons: [],
                  markdown: false
                }
              },
              {
                id: "age_input",
                type: "message",
                position: { x: 100, y: 900 },
                data: {
                  messageText: "Сколько тебе лет? 🎂\n\nНапиши возраст числом:",
                  keyboardType: "inline",
                  collectUserInput: true,
                  enableTextInput: true,
                  inputVariable: "user_age",
                  buttons: [
                    {
                      id: "btn-to-metro",
                      text: "➡️ К выбору метро",
                      action: "goto_sheet",
                      target: "metro_selection",
                      targetSheetId: "sheet_metro",
                      buttonType: "navigation"
                    }
                  ],
                  markdown: false
                }
              }
            ],
            connections: [
              {
                id: "conn-1",
                source: "start",
                target: "join_request"
              },
              {
                id: "conn-2", 
                source: "join_request",
                target: "decline_response",
                sourceHandle: "btn-no"
              },
              {
                id: "conn-3",
                source: "join_request", 
                target: "gender_selection",
                sourceHandle: "btn-yes"
              },
              {
                id: "conn-4",
                source: "gender_selection",
                target: "name_input"
              },
              {
                id: "conn-5",
                source: "name_input",
                target: "age_input"
              },
              {
                id: "conn-6",
                source: "age_input",
                target: "metro_selection",
                targetSheetId: "sheet_metro",
                isInterSheet: true
              }
            ]
          },

          // Лист 2: Метро СПб
          {
            id: "sheet_metro",
            name: "Метро СПб",
            viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
            createdAt: new Date(),
            updatedAt: new Date(),
            nodes: [
              {
                id: "metro_selection",
                type: "message",
                position: { x: 100, y: 100 },
                data: {
                  messageText: "На какой станции метро ты обычно бываешь? 🚇\n\nВыбери ветку:",
                  keyboardType: "inline",
                  collectUserInput: true,
                  inputVariable: "metro_line",
                  buttons: [
                    {
                      id: "btn-red",
                      text: "Красная ветка 🟥",
                      action: "goto",
                      target: "red_line_stations",
                      buttonType: "option"
                    },
                    {
                      id: "btn-blue",
                      text: "Синяя ветка 🟦", 
                      action: "goto",
                      target: "blue_line_stations",
                      buttonType: "option"
                    },
                    {
                      id: "btn-green",
                      text: "Зелёная ветка 🟩",
                      action: "goto",
                      target: "green_line_stations", 
                      buttonType: "option"
                    },
                    {
                      id: "btn-to-interests",
                      text: "➡️ К интересам",
                      action: "goto_sheet",
                      target: "interests_categories",
                      targetSheetId: "sheet_interests",
                      buttonType: "navigation"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "red_line_stations",
                type: "message",
                position: { x: 100, y: 300 },
                data: {
                  messageText: "🟥 Красная ветка\n\nВыбери станции:",
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "metro_stations",
                  continueButtonTarget: "interests_categories",
                  buttons: [
                    { id: "dev", text: "Девяткино", action: "selection", buttonType: "option" },
                    { id: "gra", text: "Гражданский пр.", action: "selection", buttonType: "option" },
                    { id: "aka", text: "Академическая", action: "selection", buttonType: "option" },
                    { id: "pol", text: "Политехническая", action: "selection", buttonType: "option" },
                    { id: "muz", text: "Пл. Мужества", action: "selection", buttonType: "option" },
                    { id: "les", text: "Лесная", action: "selection", buttonType: "option" },
                    { id: "vyb", text: "Выборгская", action: "selection", buttonType: "option" },
                    { id: "len", text: "Пл. Ленина", action: "selection", buttonType: "option" },
                    { id: "che", text: "Чернышевская", action: "selection", buttonType: "option" },
                    { id: "vos", text: "Пл. Восстания", action: "selection", buttonType: "option" },
                    { id: "vla", text: "Владимирская", action: "selection", buttonType: "option" },
                    { id: "pus", text: "Пушкинская", action: "selection", buttonType: "option" },
                    {
                      id: "btn-to-interests-red",
                      text: "➡️ К интересам", 
                      action: "goto_sheet",
                      target: "interests_categories",
                      targetSheetId: "sheet_interests",
                      buttonType: "navigation"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "blue_line_stations",
                type: "message",
                position: { x: 400, y: 300 },
                data: {
                  messageText: "🟦 Синяя ветка\n\nВыбери станции:",
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "metro_stations",
                  buttons: [
                    { id: "par", text: "Парнас", action: "selection", buttonType: "option" },
                    { id: "pro", text: "Пр. Просвещения", action: "selection", buttonType: "option" },
                    { id: "oze", text: "Озерки", action: "selection", buttonType: "option" },
                    { id: "ude", text: "Удельная", action: "selection", buttonType: "option" },
                    { id: "pio", text: "Пионерская", action: "selection", buttonType: "option" },
                    { id: "cher", text: "Черная речка", action: "selection", buttonType: "option" },
                    { id: "pet", text: "Петроградская", action: "selection", buttonType: "option" },
                    { id: "gor", text: "Горьковская", action: "selection", buttonType: "option" },
                    { id: "nev", text: "Невский пр.", action: "selection", buttonType: "option" },
                    { id: "sen", text: "Сенная пл.", action: "selection", buttonType: "option" },
                    {
                      id: "btn-to-interests-blue",
                      text: "➡️ К интересам",
                      action: "goto_sheet", 
                      target: "interests_categories",
                      targetSheetId: "sheet_interests",
                      buttonType: "navigation"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "green_line_stations",
                type: "message",
                position: { x: 700, y: 300 },
                data: {
                  messageText: "🟩 Зелёная ветка\n\nВыбери станции:",
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "metro_stations",
                  buttons: [
                    { id: "pri", text: "Приморская", action: "selection", buttonType: "option" },
                    { id: "vas", text: "Василеостровская", action: "selection", buttonType: "option" },
                    { id: "gos", text: "Гостиный двор", action: "selection", buttonType: "option" },
                    { id: "may", text: "Маяковская", action: "selection", buttonType: "option" },
                    { id: "ale", text: "Пл. Ал. Невского", action: "selection", buttonType: "option" },
                    { id: "eli", text: "Елизаровская", action: "selection", buttonType: "option" },
                    { id: "lom", text: "Ломоносовская", action: "selection", buttonType: "option" },
                    { id: "prol", text: "Пролетарская", action: "selection", buttonType: "option" },
                    {
                      id: "btn-to-interests-green",
                      text: "➡️ К интересам",
                      action: "goto_sheet",
                      target: "interests_categories", 
                      targetSheetId: "sheet_interests",
                      buttonType: "navigation"
                    }
                  ],
                  markdown: false
                }
              }
            ],
            connections: [
              {
                id: "conn-metro-1",
                source: "metro_selection",
                target: "red_line_stations",
                sourceHandle: "btn-red"
              },
              {
                id: "conn-metro-2",
                source: "metro_selection",
                target: "blue_line_stations",
                sourceHandle: "btn-blue"
              },
              {
                id: "conn-metro-3",
                source: "metro_selection",
                target: "green_line_stations",
                sourceHandle: "btn-green"
              }
            ]
          },

          // Лист 3: Интересы
          {
            id: "sheet_interests",
            name: "Интересы",
            viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
            createdAt: new Date(),
            updatedAt: new Date(),
            nodes: [
              {
                id: "interests_categories",
                type: "message",
                position: { x: 100, y: 100 },
                data: {
                  messageText: "Выбери категории интересов 🎯:",
                  keyboardType: "inline",
                  collectUserInput: true,
                  inputVariable: "interest_categories",
                  buttons: [
                    {
                      id: "btn-hobby",
                      text: "🎮 Хобби",
                      action: "goto",
                      target: "hobby_interests",
                      buttonType: "option"
                    },
                    {
                      id: "btn-social",
                      text: "👥 Социальная жизнь",
                      action: "goto",
                      target: "social_interests",
                      buttonType: "option"
                    },
                    {
                      id: "btn-creative",
                      text: "🎨 Творчество",
                      action: "goto",
                      target: "creative_interests",
                      buttonType: "option"
                    },
                    {
                      id: "btn-active",
                      text: "🏃 Активный образ жизни",
                      action: "goto",
                      target: "active_interests",
                      buttonType: "option"
                    },
                    {
                      id: "btn-to-profile",
                      text: "➡️ К профилю",
                      action: "goto_sheet",
                      target: "marital_status",
                      targetSheetId: "sheet_profile",
                      buttonType: "navigation"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "hobby_interests",
                type: "message",
                position: { x: 100, y: 300 },
                data: {
                  messageText: "🎮 Хобби интересы:",
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "user_interests",
                  buttons: [
                    { id: "int-games", text: "🎮 Игры", action: "selection", buttonType: "option" },
                    { id: "int-books", text: "📚 Чтение", action: "selection", buttonType: "option" },
                    { id: "int-movies", text: "🎬 Кино", action: "selection", buttonType: "option" },
                    { id: "int-music", text: "🎵 Музыка", action: "selection", buttonType: "option" },
                    { id: "int-collect", text: "🏆 Коллекционирование", action: "selection", buttonType: "option" },
                    { id: "int-diy", text: "🔧 DIY проекты", action: "selection", buttonType: "option" },
                    {
                      id: "btn-back-hobby",
                      text: "⬅️ К категориям",
                      action: "goto",
                      target: "interests_categories",
                      buttonType: "navigation"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "social_interests",
                type: "message",
                position: { x: 400, y: 300 },
                data: {
                  messageText: "👥 Социальные интересы:",
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "user_interests",
                  buttons: [
                    { id: "int-party", text: "🎉 Вечеринки", action: "selection", buttonType: "option" },
                    { id: "int-meet", text: "☕ Встречи с друзьями", action: "selection", buttonType: "option" },
                    { id: "int-network", text: "🤝 Нетворкинг", action: "selection", buttonType: "option" },
                    { id: "int-volunteer", text: "🙋 Волонтерство", action: "selection", buttonType: "option" },
                    { id: "int-events", text: "🎭 Мероприятия", action: "selection", buttonType: "option" },
                    {
                      id: "btn-back-social",
                      text: "⬅️ К категориям",
                      action: "goto",
                      target: "interests_categories",
                      buttonType: "navigation"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "creative_interests",
                type: "message",
                position: { x: 700, y: 300 },
                data: {
                  messageText: "🎨 Творческие интересы:",
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "user_interests",
                  buttons: [
                    { id: "int-art", text: "🎨 Рисование", action: "selection", buttonType: "option" },
                    { id: "int-photo", text: "📸 Фотография", action: "selection", buttonType: "option" },
                    { id: "int-write", text: "✍️ Написание текстов", action: "selection", buttonType: "option" },
                    { id: "int-dance", text: "💃 Танцы", action: "selection", buttonType: "option" },
                    { id: "int-design", text: "🖌️ Дизайн", action: "selection", buttonType: "option" },
                    {
                      id: "btn-back-creative",
                      text: "⬅️ К категориям",
                      action: "goto",
                      target: "interests_categories",
                      buttonType: "navigation"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "active_interests",
                type: "message",
                position: { x: 1000, y: 300 },
                data: {
                  messageText: "🏃 Активные интересы:",
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "user_interests",
                  buttons: [
                    { id: "int-sport", text: "⚽ Спорт", action: "selection", buttonType: "option" },
                    { id: "int-gym", text: "💪 Тренажерный зал", action: "selection", buttonType: "option" },
                    { id: "int-run", text: "🏃 Бег", action: "selection", buttonType: "option" },
                    { id: "int-bike", text: "🚴 Велосипед", action: "selection", buttonType: "option" },
                    { id: "int-hike", text: "🥾 Походы", action: "selection", buttonType: "option" },
                    { id: "int-swim", text: "🏊 Плавание", action: "selection", buttonType: "option" },
                    {
                      id: "btn-back-active",
                      text: "⬅️ К категориям",
                      action: "goto",
                      target: "interests_categories",
                      buttonType: "navigation"
                    }
                  ],
                  markdown: false
                }
              }
            ],
            connections: [
              {
                id: "conn-int-1",
                source: "interests_categories",
                target: "hobby_interests",
                sourceHandle: "btn-hobby"
              },
              {
                id: "conn-int-2",
                source: "interests_categories",
                target: "social_interests",
                sourceHandle: "btn-social"
              },
              {
                id: "conn-int-3",
                source: "interests_categories",
                target: "creative_interests",
                sourceHandle: "btn-creative"
              },
              {
                id: "conn-int-4",
                source: "interests_categories",
                target: "active_interests",
                sourceHandle: "btn-active"
              }
            ]
          },

          // Лист 4: Профиль
          {
            id: "sheet_profile",
            name: "Профиль",
            viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
            createdAt: new Date(),
            updatedAt: new Date(),
            nodes: [
              {
                id: "marital_status",
                type: "message",
                position: { x: 100, y: 100 },
                data: {
                  messageText: "Семейное положение 💍:",
                  keyboardType: "inline",
                  collectUserInput: true,
                  inputVariable: "marital_status",
                  buttons: [
                    {
                      id: "btn-single",
                      text: "Не женат/не замужем 💫",
                      value: "single",
                      action: "goto",
                      target: "extra_info",
                      buttonType: "option"
                    },
                    {
                      id: "btn-relationship",
                      text: "В отношениях ❤️",
                      value: "relationship",
                      action: "goto",
                      target: "extra_info",
                      buttonType: "option"
                    },
                    {
                      id: "btn-married",
                      text: "Женат/замужем 💍",
                      value: "married",
                      action: "goto",
                      target: "extra_info",
                      buttonType: "option"
                    },
                    {
                      id: "btn-complicated",
                      text: "Всё сложно 🤷",
                      value: "complicated",
                      action: "goto",
                      target: "extra_info",
                      buttonType: "option"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "extra_info",
                type: "message",
                position: { x: 100, y: 300 },
                data: {
                  messageText: "Хочешь добавить что-то ещё о себе? 📝\n\nРасскажи о себе или нажми 'Пропустить':",
                  keyboardType: "inline",
                  collectUserInput: true,
                  enableTextInput: true,
                  inputVariable: "extra_info",
                  inputTargetNodeId: "profile_complete",
                  buttons: [
                    {
                      id: "btn-skip-extra",
                      text: "Пропустить ⏭️",
                      action: "goto",
                      target: "profile_complete",
                      buttonType: "option"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "profile_complete",
                type: "message",
                position: { x: 100, y: 500 },
                data: {
                  messageText: "🎉 Отлично! Твой профиль заполнен!\n\n👤 Анкета:\nПол: {gender}\nИмя: {user_name}\nВозраст: {user_age}\nМетро: {metro_stations}\nИнтересы: {user_interests}\nСемейное положение: {marital_status}\n\nМожешь посмотреть анкету или получить ссылку на чат!",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-show-profile",
                      text: "📋 Показать анкету",
                      action: "command",
                      target: "/profile",
                      buttonType: "option"
                    },
                    {
                      id: "btn-chat-link",
                      text: "🔗 Получить ссылку на чат",
                      action: "goto",
                      target: "chat_link",
                      buttonType: "option"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "chat_link",
                type: "message",
                position: { x: 400, y: 500 },
                data: {
                  messageText: "🔗 Актуальная ссылка на чат:\n\nhttps://t.me/+agkIVgCzHtY2ZTA6\n\nДобро пожаловать в сообщество!",
                  keyboardType: "none",
                  buttons: [],
                  markdown: false
                }
              },
              {
                id: "show_profile",
                type: "command",
                position: { x: 100, y: 700 },
                data: {
                  command: "/profile",
                  commandName: "/profile",
                  description: "Показать профиль пользователя",
                  synonyms: ["профиль", "анкета", "мой профиль"],
                  messageText: "👤 Твой профиль:\n\nПол: {gender} 👤\nИмя: {user_name} ✏️\nВозраст: {user_age} 🎂\nМетро: {metro_stations} 🚇\nИнтересы: {user_interests} 🎯\nСемейное положение: {marital_status} 💍\n\nЧто хочешь изменить?",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-edit-gender",
                      text: "👨👩 Изменить пол",
                      action: "goto_sheet",
                      target: "gender_selection",
                      targetSheetId: "sheet_main",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-name",
                      text: "✏️ Изменить имя",
                      action: "goto_sheet",
                      target: "name_input",
                      targetSheetId: "sheet_main",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-metro",
                      text: "🚇 Изменить метро",
                      action: "goto_sheet",
                      target: "metro_selection",
                      targetSheetId: "sheet_metro",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-interests",
                      text: "🎯 Изменить интересы",
                      action: "goto_sheet",
                      target: "interests_categories",
                      targetSheetId: "sheet_interests",
                      buttonType: "option"
                    },
                    {
                      id: "btn-restart",
                      text: "🔄 Начать заново",
                      action: "command",
                      target: "/start",
                      buttonType: "navigation"
                    }
                  ],
                  markdown: false
                }
              }
            ],
            connections: [
              {
                id: "conn-prof-1",
                source: "marital_status",
                target: "extra_info"
              },
              {
                id: "conn-prof-2",
                source: "extra_info",
                target: "profile_complete"
              },
              {
                id: "conn-prof-3",
                source: "profile_complete",
                target: "chat_link",
                sourceHandle: "btn-chat-link"
              },
              {
                id: "conn-prof-4",
                source: "profile_complete",
                target: "show_profile",
                sourceHandle: "btn-show-profile"
              }
            ]
          }
        ]
      }
    });

    console.log('✅ Шаблон VProgulke Bot с листами создан');
    console.log('✅ Системные шаблоны созданы');

  } catch (error) {
    console.error('Ошибка при создании шаблонов:', error);
  }
}

export { seedTemplatesWithSheets };