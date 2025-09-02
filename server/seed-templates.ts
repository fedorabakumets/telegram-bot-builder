import { storage } from "./storage";

// Стандартные шаблоны для демонстрации
async function seedDefaultTemplates(force = false) {
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

    // Создаем шаблон VProgulke Bot для знакомств
    await storage.createBotTemplate({
      name: "🌟 VProgulke Bot - Знакомства СПб",
      description: "Продвинутый бот знакомств для Санкт-Петербурга с детальной анкетой, системой метро и многоуровневыми интересами",
      category: "community",
      tags: ["знакомства", "профиль", "метро", "интересы", "СПб", "анкета", "чат"],
      isPublic: 1,
      difficulty: "hard",
      authorName: "Система",
      version: "3.0.0",
      featured: 1,
      language: "ru",
      complexity: 9,
      estimatedTime: 45,
      data: {
        nodes: [
          {
            id: "start",
            type: "start",
            position: { x: 100, y: 50 },
            data: {
              command: "/start",
              description: "Приветствие и источник",
              messageText: "🌟 Привет от ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot!\n\nЭтот бот поможет тебе найти интересных людей в Санкт-Петербурге!\n\nОткуда ты узнал о нашем чате? 😎",
              synonyms: ["старт", "начать", "привет", "начало", "начинаем"],
              keyboardType: "none",
              buttons: [],
              collectUserInput: true,
              enableTextInput: true,
              inputVariable: "user_source",
              inputTargetNodeId: "join_request",
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },

          {
            id: "join_request",
            type: "message",
            position: { x: 100, y: 250 },
            data: {
              messageText: "Хочешь присоединиться к нашему чату? 🚀",
              synonyms: [],
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
              markdown: false,
              oneTimeKeyboard: true,
              resizeKeyboard: true
            }
          },

          {
            id: "decline_response",
            type: "message",
            position: { x: 100, y: 450 },
            data: {
              messageText: "Понятно! Если передумаешь, напиши /start! 😊",
              synonyms: [],
              keyboardType: "none",
              removeKeyboard: true,
              buttons: [],
              markdown: false
            }
          },

          {
            id: "gender_selection",
            type: "message",
            position: { x: 500, y: 250 },
            data: {
              messageText: "Укажи свой пол: 👨👩",
              keyboardType: "inline",
              collectUserInput: true,
              inputVariable: "gender",
              synonyms: ["пол", "гендер", "мужчина", "женщина"],
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
              markdown: false,
              oneTimeKeyboard: true,
              resizeKeyboard: true
            }
          },

          {
            id: "name_input",
            type: "message",
            position: { x: 900, y: 250 },
            data: {
              messageText: "Как тебя зовут? ✏️\n\nНапиши своё имя в сообщении:",
              keyboardType: "none",
              collectUserInput: true,
              enableTextInput: true,
              inputVariable: "user_name",
              synonyms: ["имя", "зовут", "называют", "как зовут"],
              inputTargetNodeId: "age_input",
              buttons: [],
              markdown: false
            }
          },

          {
            id: "age_input",
            type: "message",
            position: { x: 1300, y: 250 },
            data: {
              messageText: "Сколько тебе лет? 🎂\n\nНапиши свой возраст числом (например, 25):",
              keyboardType: "none",
              collectUserInput: true,
              enableTextInput: true,
              inputVariable: "user_age",
              synonyms: ["возраст", "лет", "годы", "сколько лет"],
              inputTargetNodeId: "metro_selection",
              buttons: [],
              markdown: false
            }
          },

          {
            id: "metro_selection",
            type: "message",
            position: { x: 100, y: 450 },
            data: {
              messageText: "На какой станции метро ты обычно бываешь? 🚇\n\nВыбери свою ветку:",
              keyboardType: "inline",
              collectUserInput: true,
              inputVariable: "metro_stations",
              synonyms: ["метро", "станция", "где живу", "район"],
              buttons: [
                {
                  id: "btn-red",
                  text: "Красная ветка 🟥",
                  action: "goto",
                  target: "red_line_stations",
                  buttonType: "option",
                  skipDataCollection: true
                },
                {
                  id: "btn-blue",
                  text: "Синяя ветка 🟦",
                  action: "goto", 
                  target: "blue_line_stations",
                  buttonType: "option",
                  skipDataCollection: true
                },
                {
                  id: "btn-green",
                  text: "Зелёная ветка 🟩",
                  action: "goto",
                  target: "green_line_stations",
                  buttonType: "option",
                  skipDataCollection: true
                },
                {
                  id: "btn-orange",
                  text: "Оранжевая ветка 🟧",
                  action: "goto",
                  target: "orange_line_stations",
                  buttonType: "option",
                  skipDataCollection: true
                },
                {
                  id: "btn-purple",
                  text: "Фиолетовая ветка 🟪",
                  action: "goto",
                  target: "purple_line_stations",
                  buttonType: "option",
                  skipDataCollection: true
                },
                {
                  id: "btn-lo",
                  text: "Я из ЛО 🏡",
                  value: "ЛО",
                  action: "goto",
                  target: "interests_categories",
                  buttonType: "option"
                },
                {
                  id: "btn-not-spb",
                  text: "Я не в Питере 🌍",
                  value: "Не в СПб",
                  action: "goto",
                  target: "interests_categories",
                  buttonType: "option"
                }
              ],
              markdown: false,
              oneTimeKeyboard: true,
              resizeKeyboard: true
            }
          },

          // Красная ветка (Кировско-Выборгская) - станции
          {
            id: "red_line_stations",
            type: "message",
            position: { x: 1500, y: 450 },
            data: {
              messageText: "🟥 Кировско-Выборгская линия\n\nВыбери свою станцию:",
              synonyms: ["красная линия", "кировско-выборгская", "красная ветка"],
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "metro_stations",
              continueButtonTarget: "interests_categories",
              buttons: [
                { id: "red-devyatkino", text: "🟥 Девяткино", action: "selection", target: "devyatkino", buttonType: "option" },
                { id: "red-grazhdansky", text: "🟥 Гражданский проспект", action: "selection", target: "grazhdansky", buttonType: "option" },
                { id: "red-akademicheskaya", text: "🟥 Академическая", action: "selection", target: "akademicheskaya", buttonType: "option" },
                { id: "red-politehnicheskaya", text: "🟥 Политехническая", action: "selection", target: "politehnicheskaya", buttonType: "option" },
                { id: "red-pl-muzhestva", text: "🟥 Площадь Мужества", action: "selection", target: "pl_muzhestva", buttonType: "option" },
                { id: "red-lesnaya", text: "🟥 Лесная", action: "selection", target: "lesnaya", buttonType: "option" },
                { id: "red-vyborgskaya", text: "🟥 Выборгская", action: "selection", target: "vyborgskaya", buttonType: "option" },
                { id: "red-pl-lenina", text: "🟥 Площадь Ленина", action: "selection", target: "pl_lenina", buttonType: "option" },
                { id: "red-chernyshevskaya", text: "🟥 Чернышевская", action: "selection", target: "chernyshevskaya", buttonType: "option" },
                { id: "red-pl-vosstaniya", text: "🟥 Площадь Восстания", action: "selection", target: "pl_vosstaniya", buttonType: "option" },
                { id: "red-vladimirskaya", text: "🟥 Владимирская", action: "selection", target: "vladimirskaya", buttonType: "option" },
                { id: "red-pushkinskaya", text: "🟥 Пушкинская", action: "selection", target: "pushkinskaya", buttonType: "option" },
                { id: "red-tehinstitut1", text: "🟥 Технологический институт-1", action: "selection", target: "tehinstitut1", buttonType: "option" },
                { id: "red-baltiyskaya", text: "🟥 Балтийская", action: "selection", target: "baltiyskaya", buttonType: "option" },
                { id: "red-narvskaya", text: "🟥 Нарвская", action: "selection", target: "narvskaya", buttonType: "option" },
                { id: "red-kirovsky", text: "🟥 Кировский завод", action: "selection", target: "kirovsky", buttonType: "option" },
                { id: "red-avtovo", text: "🟥 Автово", action: "selection", target: "avtovo", buttonType: "option" },
                { id: "red-leninsky", text: "🟥 Ленинский проспект", action: "selection", target: "leninsky", buttonType: "option" },
                { id: "red-veteranov", text: "🟥 Проспект Ветеранов", action: "selection", target: "veteranov", buttonType: "option" },
                { id: "btn-back-metro", text: "⬅️ Назад к веткам", action: "goto", target: "metro_selection", buttonType: "navigation" }
              ],
              markdown: false
            }
          },

          // Синяя ветка (Московско-Петроградская) - станции
          {
            id: "blue_line_stations",
            type: "message",
            position: { x: 1900, y: 450 },
            data: {
              messageText: "🟦 Московско-Петроградская линия\n\nВыбери свою станцию:",
              synonyms: ["синяя линия", "московско-петроградская", "синяя ветка"],
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "metro_stations",
              continueButtonTarget: "interests_categories",
              buttons: [
                { id: "blue-parnas", text: "🟦 Парнас", action: "selection", target: "parnas", buttonType: "option" },
                { id: "blue-prosp-prosvesh", text: "🟦 Проспект Просвещения", action: "selection", target: "prosp_prosvesh", buttonType: "option" },
                { id: "blue-ozerki", text: "🟦 Озерки", action: "selection", target: "ozerki", buttonType: "option" },
                { id: "blue-udelnaya", text: "🟦 Удельная", action: "selection", target: "udelnaya", buttonType: "option" },
                { id: "blue-pionerskaya", text: "🟦 Пионерская", action: "selection", target: "pionerskaya", buttonType: "option" },
                { id: "blue-chernaya", text: "🟦 Черная речка", action: "selection", target: "chernaya", buttonType: "option" },
                { id: "blue-petrogradskaya", text: "🟦 Петроградская", action: "selection", target: "petrogradskaya", buttonType: "option" },
                { id: "blue-gorkovskaya", text: "🟦 Горьковская", action: "selection", target: "gorkovskaya", buttonType: "option" },
                { id: "blue-nevsky", text: "🟦 Невский проспект", action: "selection", target: "nevsky", buttonType: "option" },
                { id: "blue-sennaya", text: "🟦 Сенная площадь", action: "selection", target: "sennaya", buttonType: "option" },
                { id: "blue-tehinstitut2", text: "🟦 Технологический институт-2", action: "selection", target: "tehinstitut2", buttonType: "option" },
                { id: "blue-frunzenskaya", text: "🟦 Фрунзенская", action: "selection", target: "frunzenskaya", buttonType: "option" },
                { id: "blue-mosk-vorota", text: "🟦 Московские ворота", action: "selection", target: "mosk_vorota", buttonType: "option" },
                { id: "blue-elektrosila", text: "🟦 Электросила", action: "selection", target: "elektrosila", buttonType: "option" },
                { id: "blue-park-pobedy", text: "🟦 Парк Победы", action: "selection", target: "park_pobedy", buttonType: "option" },
                { id: "blue-moskovskaya", text: "🟦 Московская", action: "selection", target: "moskovskaya", buttonType: "option" },
                { id: "blue-zvezdnaya", text: "🟦 Звездная", action: "selection", target: "zvezdnaya", buttonType: "option" },
                { id: "blue-kupchino", text: "🟦 Купчино", action: "selection", target: "kupchino", buttonType: "option" },
                { id: "btn-back-metro-blue", text: "⬅️ Назад к веткам", action: "goto", target: "metro_selection", buttonType: "navigation" }
              ],
              markdown: false
            }
          },

          // Зелёная ветка (Невско-Василеостровская) - станции
          {
            id: "green_line_stations",
            type: "message",
            position: { x: 2300, y: 450 },
            data: {
              messageText: "🟩 Невско-Василеостровская линия\n\nВыбери свою станцию:",
              synonyms: ["зеленая линия", "невско-василеостровская", "зеленая ветка"],
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "metro_stations",
              continueButtonTarget: "interests_categories",
              buttons: [
                { id: "green-primorskaya", text: "🟩 Приморская", action: "selection", target: "primorskaya", buttonType: "option" },
                { id: "green-vasileostr", text: "🟩 Василеостровская", action: "selection", target: "vasileostr", buttonType: "option" },
                { id: "green-gostiny", text: "🟩 Гостиный двор", action: "selection", target: "gostiny", buttonType: "option" },
                { id: "green-mayakovskaya", text: "🟩 Маяковская", action: "selection", target: "mayakovskaya", buttonType: "option" },
                { id: "green-pl-nevsk", text: "🟩 Площадь Александра Невского-1", action: "selection", target: "pl_nevsk", buttonType: "option" },
                { id: "green-elizarovskaya", text: "🟩 Елизаровская", action: "selection", target: "elizarovskaya", buttonType: "option" },
                { id: "green-lomonosovskaya", text: "🟩 Ломоносовская", action: "selection", target: "lomonosovskaya", buttonType: "option" },
                { id: "green-proletarskaya", text: "🟩 Пролетарская", action: "selection", target: "proletarskaya", buttonType: "option" },
                { id: "green-obuhovo", text: "🟩 Обухово", action: "selection", target: "obuhovo", buttonType: "option" },
                { id: "green-rybackoe", text: "🟩 Рыбацкое", action: "selection", target: "rybackoe", buttonType: "option" },
                { id: "green-novokrestovsk", text: "🟩 Новокрестовская", action: "selection", target: "novokrestovsk", buttonType: "option" },
                { id: "green-begovaya", text: "🟩 Беговая", action: "selection", target: "begovaya", buttonType: "option" },
                { id: "btn-back-metro-green", text: "⬅️ Назад к веткам", action: "goto", target: "metro_selection", buttonType: "navigation" }
              ],
              markdown: false
            }
          },

          // Оранжевая ветка (Правобережная) - станции
          {
            id: "orange_line_stations",
            type: "message",
            position: { x: 2700, y: 450 },
            data: {
              messageText: "🟧 Правобережная линия\n\nВыбери свою станцию:",
              synonyms: ["оранжевая линия", "правобережная", "оранжевая ветка"],
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "metro_stations",
              continueButtonTarget: "interests_categories",
              buttons: [
                { id: "orange-spasskaya", text: "🟧 Спасская", action: "selection", target: "spasskaya", buttonType: "option" },
                { id: "orange-dostoevskaya", text: "🟧 Достоевская", action: "selection", target: "dostoevskaya", buttonType: "option" },
                { id: "orange-ligovsky", text: "🟧 Лиговский проспект", action: "selection", target: "ligovsky", buttonType: "option" },
                { id: "orange-pl-nevsk2", text: "🟧 Площадь Александра Невского-2", action: "selection", target: "pl_nevsk2", buttonType: "option" },
                { id: "orange-novocherk", text: "🟧 Новочеркасская", action: "selection", target: "novocherk", buttonType: "option" },
                { id: "orange-ladozhskaya", text: "🟧 Ладожская", action: "selection", target: "ladozhskaya", buttonType: "option" },
                { id: "orange-bolshevikov", text: "🟧 Проспект Большевиков", action: "selection", target: "bolshevikov", buttonType: "option" },
                { id: "orange-dybenko", text: "🟧 Дыбенко", action: "selection", target: "dybenko", buttonType: "option" },
                { id: "orange-gorny", text: "🟧 Горный институт", action: "selection", target: "gorny", buttonType: "option" },
                { id: "btn-back-metro-orange", text: "⬅️ Назад к веткам", action: "goto", target: "metro_selection", buttonType: "navigation" }
              ],
              markdown: false
            }
          },

          // Фиолетовая ветка (Фрунзенско-Приморская) - станции
          {
            id: "purple_line_stations",
            type: "message",
            position: { x: 3100, y: 450 },
            data: {
              messageText: "🟪 Фрунзенско-Приморская линия\n\nВыбери свою станцию:",
              synonyms: ["фиолетовая линия", "фрунзенско-приморская", "фиолетовая ветка"],
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "metro_stations",
              continueButtonTarget: "interests_categories",
              buttons: [
                { id: "purple-komendantsky", text: "🟪 Комендантский проспект", action: "selection", target: "komendantsky", buttonType: "option" },
                { id: "purple-staraya", text: "🟪 Старая Деревня", action: "selection", target: "staraya", buttonType: "option" },
                { id: "purple-krestovsky", text: "🟪 Крестовский остров", action: "selection", target: "krestovsky", buttonType: "option" },
                { id: "purple-chkalovskaya", text: "🟪 Чкаловская", action: "selection", target: "chkalovskaya", buttonType: "option" },
                { id: "purple-sportivnaya", text: "🟪 Спортивная", action: "selection", target: "sportivnaya", buttonType: "option" },
                { id: "purple-admiralteyskaya", text: "🟪 Адмиралтейская", action: "selection", target: "admiralteyskaya", buttonType: "option" },
                { id: "purple-sadovaya", text: "🟪 Садовая", action: "selection", target: "sadovaya", buttonType: "option" },
                { id: "purple-zvenigorodskaya", text: "🟪 Звенигородская", action: "selection", target: "zvenigorodskaya", buttonType: "option" },
                { id: "purple-obvodniy", text: "🟪 Обводный канал", action: "selection", target: "obvodniy", buttonType: "option" },
                { id: "purple-volkovskaya", text: "🟪 Волковская", action: "selection", target: "volkovskaya", buttonType: "option" },
                { id: "purple-buharestskaya", text: "🟪 Бухарестская", action: "selection", target: "buharestskaya", buttonType: "option" },
                { id: "purple-mezhdunar", text: "🟪 Международная", action: "selection", target: "mezhdunar", buttonType: "option" },
                { id: "purple-slavy", text: "🟪 Проспект Славы", action: "selection", target: "slavy", buttonType: "option" },
                { id: "purple-dunayskaya", text: "🟪 Дунайская", action: "selection", target: "dunayskaya", buttonType: "option" },
                { id: "purple-shushary", text: "🟪 Шушары", action: "selection", target: "shushary", buttonType: "option" },
                { id: "btn-back-metro-purple", text: "⬅️ Назад к веткам", action: "goto", target: "metro_selection", buttonType: "navigation" }
              ],
              markdown: false
            }
          },

          {
            id: "interests_categories",
            type: "message",
            position: { x: 500, y: 450 },
            data: {
              messageText: "Выбери категории интересов 🎯:",
              keyboardType: "inline",
              synonyms: ["интересы", "хобби", "увлечения", "нравится"],
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
                  id: "btn-creativity",
                  text: "🎨 Творчество", 
                  action: "goto",
                  target: "creativity_interests",
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
                  id: "btn-food",
                  text: "🍕 Еда и напитки",
                  action: "goto",
                  target: "food_interests",
                  buttonType: "option"
                },
                {
                  id: "btn-sport",
                  text: "⚽ Спорт",
                  action: "goto",
                  target: "sport_interests",
                  buttonType: "option"
                }
              ],
              markdown: false
            }
          },

          {
            id: "hobby_interests",
            type: "message",
            position: { x: 900, y: 450 },
            data: {
              messageText: "Выбери интересы в категории 🎮 Хобби:",
              synonyms: ["хобби", "увлечения", "занятия", "игры"],
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "user_interests",
              continueButtonTarget: "marital_status",
              buttons: [
                {
                  id: "hobby-games",
                  text: "🎮 Компьютерные игры",
                  action: "selection",
                  target: "computer_games",
                  buttonType: "option"
                },
                {
                  id: "hobby-fashion",
                  text: "💄 Мода и красота",
                  action: "selection",
                  target: "fashion",
                  buttonType: "option"
                },
                {
                  id: "hobby-cars",
                  text: "🚗 Автомобили",
                  action: "selection",
                  target: "cars",
                  buttonType: "option"
                },
                {
                  id: "hobby-it",
                  text: "💻 IT и технологии",
                  action: "selection",
                  target: "it_tech",
                  buttonType: "option"
                },
                {
                  id: "hobby-psychology",
                  text: "🧠 Психология",
                  action: "selection",
                  target: "psychology",
                  buttonType: "option"
                },
                {
                  id: "hobby-astrology",
                  text: "🔮 Астрология",
                  action: "selection",
                  target: "astrology",
                  buttonType: "option"
                },
                {
                  id: "hobby-meditation",
                  text: "🧘 Медитации",
                  action: "selection",
                  buttonType: "option"
                },
                {
                  id: "hobby-books",
                  text: "📚 Книги",
                  action: "selection",
                  target: "books",
                  buttonType: "option"
                },
                {
                  id: "hobby-anime",
                  text: "🌸 Аниме",
                  action: "selection",
                  target: "anime",
                  buttonType: "option"
                },
                {
                  id: "hobby-crypto",
                  text: "💰 Криптовалюты",
                  action: "selection",
                  target: "crypto",
                  buttonType: "option"
                },
                {
                  id: "btn-back-categories",
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
            position: { x: 1300, y: 450 },
            data: {
              messageText: "Выбери интересы в категории 👥 Социальная жизнь:",
              synonyms: ["общение", "социальное", "люди", "тусовки"],
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "user_interests",
              continueButtonTarget: "marital_status",
              buttons: [
                {
                  id: "social-parties",
                  text: "🎉 Вечеринки",
                  action: "selection",
                  target: "parties",
                  buttonType: "option"
                },
                {
                  id: "social-networking",
                  text: "🤝 Нетворкинг",
                  action: "selection",
                  target: "networking",
                  buttonType: "option"
                },
                {
                  id: "social-dating",
                  text: "💕 Знакомства",
                  action: "selection",
                  target: "dating",
                  buttonType: "option"
                },
                {
                  id: "social-volunteering",
                  text: "🤲 Волонтёрство",
                  action: "selection",
                  target: "volunteering",
                  buttonType: "option"
                },
                {
                  id: "social-events",
                  text: "🎪 Мероприятия",
                  action: "selection",
                  target: "events",
                  buttonType: "option"
                },
                {
                  id: "social-community",
                  text: "👥 Сообщества",
                  action: "selection",
                  target: "community",
                  buttonType: "option"
                },
                {
                  id: "btn-back-categories-social",
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
            id: "creativity_interests",
            type: "message",
            position: { x: 100, y: 650 },
            data: {
              messageText: "Выбери интересы в категории 🎨 Творчество:",
              synonyms: ["творчество", "искусство", "рисование", "музыка"],
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "user_interests",
              continueButtonTarget: "marital_status",
              buttons: [
                {
                  id: "creativity-art",
                  text: "🎨 Рисование",
                  action: "selection",
                  target: "art",
                  buttonType: "option"
                },
                {
                  id: "creativity-music",
                  text: "🎵 Музыка",
                  action: "selection",
                  target: "music",
                  buttonType: "option"
                },
                {
                  id: "creativity-photography",
                  text: "📸 Фотография",
                  action: "selection",
                  target: "photography",
                  buttonType: "option"
                },
                {
                  id: "creativity-writing",
                  text: "✍️ Писательство",
                  action: "selection",
                  target: "writing",
                  buttonType: "option"
                },
                {
                  id: "creativity-design",
                  text: "🖌️ Дизайн",
                  action: "selection",
                  target: "design",
                  buttonType: "option"
                },
                {
                  id: "creativity-handmade",
                  text: "🧶 Рукоделие",
                  action: "selection",
                  target: "handmade",
                  buttonType: "option"
                },
                {
                  id: "creativity-theater",
                  text: "🎭 Театр",
                  action: "selection",
                  target: "theater",
                  buttonType: "option"
                },
                {
                  id: "btn-back-categories-creativity",
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
            position: { x: 500, y: 650 },
            data: {
              messageText: "Выбери интересы в категории 🏃 Активный образ жизни:",
              synonyms: ["активность", "активный", "движение", "здоровье"],
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "user_interests",
              continueButtonTarget: "marital_status",
              buttons: [
                {
                  id: "active-running",
                  text: "🏃 Бег",
                  action: "selection",
                  target: "running",
                  buttonType: "option"
                },
                {
                  id: "active-gym",
                  text: "💪 Тренажёрный зал",
                  action: "selection",
                  target: "gym",
                  buttonType: "option"
                },
                {
                  id: "active-cycling",
                  text: "🚴 Велосипед",
                  action: "selection",
                  target: "cycling",
                  buttonType: "option"
                },
                {
                  id: "active-hiking",
                  text: "🥾 Походы",
                  action: "selection",
                  target: "hiking",
                  buttonType: "option"
                },
                {
                  id: "active-yoga",
                  text: "🧘 Йога",
                  action: "selection",
                  target: "yoga",
                  buttonType: "option"
                },
                {
                  id: "active-swimming",
                  text: "🏊 Плавание",
                  action: "selection",
                  target: "swimming",
                  buttonType: "option"
                },
                {
                  id: "active-dancing",
                  text: "💃 Танцы",
                  action: "selection",
                  target: "dancing",
                  buttonType: "option"
                },
                {
                  id: "btn-back-categories-active",
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
            id: "food_interests",
            type: "message",
            position: { x: 900, y: 650 },
            data: {
              messageText: "Выбери интересы в категории 🍕 Еда и напитки:",
              synonyms: ["еда", "напитки", "кухня", "рестораны"],
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "user_interests",
              continueButtonTarget: "marital_status",
              buttons: [
                {
                  id: "food-cooking",
                  text: "👨‍🍳 Готовка",
                  action: "selection",
                  target: "cooking",
                  buttonType: "option"
                },
                {
                  id: "food-restaurants",
                  text: "🍽️ Рестораны",
                  action: "selection",
                  target: "restaurants",
                  buttonType: "option"
                },
                {
                  id: "food-wine",
                  text: "🍷 Вино",
                  action: "selection",
                  target: "wine",
                  buttonType: "option"
                },
                {
                  id: "food-coffee",
                  text: "☕ Кофе",
                  action: "selection",
                  target: "coffee",
                  buttonType: "option"
                },
                {
                  id: "food-baking",
                  text: "🧁 Выпечка",
                  action: "selection",
                  target: "baking",
                  buttonType: "option"
                },
                {
                  id: "food-street",
                  text: "🌮 Стрит-фуд",
                  action: "selection",
                  target: "street_food",
                  buttonType: "option"
                },
                {
                  id: "food-healthy",
                  text: "🥗 Здоровое питание",
                  action: "selection",
                  target: "healthy_food",
                  buttonType: "option"
                },
                {
                  id: "btn-back-categories-food",
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
            id: "sport_interests",
            type: "message",
            position: { x: 1300, y: 650 },
            data: {
              messageText: "Выбери интересы в категории ⚽ Спорт:",
              synonyms: ["спорт", "фитнес", "тренировки", "футбол"],
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "user_interests",
              continueButtonTarget: "marital_status",
              buttons: [
                {
                  id: "sport-football",
                  text: "⚽ Футбол",
                  action: "selection",
                  target: "football",
                  buttonType: "option"
                },
                {
                  id: "sport-basketball",
                  text: "🏀 Баскетбол",
                  action: "selection",
                  target: "basketball",
                  buttonType: "option"
                },
                {
                  id: "sport-tennis",
                  text: "🎾 Теннис",
                  action: "selection",
                  target: "tennis",
                  buttonType: "option"
                },
                {
                  id: "sport-hockey",
                  text: "🏒 Хоккей",
                  action: "selection",
                  target: "hockey",
                  buttonType: "option"
                },
                {
                  id: "sport-volleyball",
                  text: "🏐 Волейбол",
                  action: "selection",
                  target: "volleyball",
                  buttonType: "option"
                },
                {
                  id: "sport-mma",
                  text: "🥊 Единоборства",
                  action: "selection",
                  target: "mma",
                  buttonType: "option"
                },
                {
                  id: "sport-esports",
                  text: "🎮 Киберспорт",
                  action: "selection",
                  target: "esports",
                  buttonType: "option"
                },
                {
                  id: "btn-back-categories-sport",
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
            id: "marital_status",
            type: "message",
            position: { x: 1300, y: 450 },
            data: {
              messageText: "Выбери семейное положение 💍:",
              keyboardType: "inline",
              collectUserInput: true,
              inputVariable: "marital_status",
              synonyms: ["семейное положение", "статус", "отношения", "семья"],
              buttons: [
                {
                  id: "btn-single",
                  text: "В активном поиске ❤️",
                  value: "single",
                  action: "goto",
                  target: "sexual_orientation",
                  buttonType: "option"
                },
                {
                  id: "btn-relationship",
                  text: "В отношениях 💕",
                  value: "relationship",
                  action: "goto",
                  target: "sexual_orientation",
                  buttonType: "option"
                },
                {
                  id: "btn-married",
                  text: "Женат/Замужем 💒",
                  value: "married",
                  action: "goto",
                  target: "sexual_orientation",
                  buttonType: "option"
                },
                {
                  id: "btn-complicated",
                  text: "Всё сложно 🤷",
                  value: "complicated",
                  action: "goto",
                  target: "sexual_orientation",
                  buttonType: "option"
                }
              ],
              markdown: false,
              oneTimeKeyboard: true,
              resizeKeyboard: true
            }
          },

          {
            id: "sexual_orientation",
            type: "message",
            position: { x: 100, y: 650 },
            data: {
              messageText: "Укажи свою сексуальную ориентацию 🌈:",
              keyboardType: "inline",
              collectUserInput: true,
              inputVariable: "sexual_orientation",
              synonyms: ["ориентация", "предпочтения", "кого ищу"],
              buttons: [
                {
                  id: "btn-hetero",
                  text: "Гетеро 👫",
                  value: "hetero",
                  action: "goto",
                  target: "channel_choice",
                  buttonType: "option"
                },
                {
                  id: "btn-gay",
                  text: "Гей 👬",
                  value: "gay",
                  action: "goto",
                  target: "channel_choice",
                  buttonType: "option"
                },
                {
                  id: "btn-lesbian",
                  text: "Лесби 👭",
                  value: "lesbian",
                  action: "goto",
                  target: "channel_choice",
                  buttonType: "option"
                },
                {
                  id: "btn-bi",
                  text: "Би 🌈",
                  value: "bi",
                  action: "goto",
                  target: "channel_choice",
                  buttonType: "option"
                },
                {
                  id: "btn-other",
                  text: "Другое 💫",
                  value: "other",
                  action: "goto",
                  target: "channel_choice",
                  buttonType: "option"
                }
              ],
              markdown: false,
              oneTimeKeyboard: true,
              resizeKeyboard: true
            }
          },

          {
            id: "channel_choice",
            type: "message",
            position: { x: 500, y: 650 },
            data: {
              messageText: "Хочешь указать свой телеграм-канал? 📢\n\nВведи ссылку, ник с @ или просто имя канала, либо нажми 'Пропустить':",
              keyboardType: "inline",
              collectUserInput: true,
              enableTextInput: true,
              inputVariable: "telegram_channel",
              synonyms: ["тгк", "телеграм", "канал", "тг канал"],
              inputTargetNodeId: "extra_info",
              buttons: [
                {
                  id: "btn-skip-channel",
                  text: "Пропустить ⏭️",
                  action: "goto",
                  target: "extra_info",
                  buttonType: "option",
                  skipDataCollection: true
                }
              ],
              markdown: false
            }
          },

          {
            id: "extra_info",
            type: "message",
            position: { x: 1300, y: 650 },
            data: {
              messageText: "Хочешь добавить что-то ещё о себе? 📝\n\nРасскажи о себе (до 2000 символов) или нажми 'Пропустить':",
              keyboardType: "inline",
              collectUserInput: true,
              enableTextInput: true,
              inputVariable: "extra_info",
              synonyms: ["о себе", "описание", "расскажи", "инфо"],
              inputTargetNodeId: "profile_complete",
              buttons: [
                {
                  id: "btn-skip-extra",
                  text: "Пропустить ⏭️",
                  action: "goto",
                  target: "profile_complete",
                  buttonType: "option",
                  skipDataCollection: true
                }
              ],
              markdown: false
            }
          },

          {
            id: "profile_complete",
            type: "message",
            position: { x: 100, y: 850 },
            data: {
              messageText: "🎉 Отлично! Твой профиль заполнен!\n\n👤 Твоя анкета:\nПол: {gender}\nИмя: {user_name}\nВозраст: {user_age}\nМетро: {metro_stations}\nИнтересы: {user_interests}\nСемейное положение: {marital_status}\nОриентация: {sexual_orientation}\n\nМожешь посмотреть полную анкету или сразу получить ссылку на чат!",
              synonyms: [],
              keyboardType: "inline",
              removeKeyboard: false,
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "with_both",
                  condition: "user_data_exists",
                  variableNames: ["telegram_channel", "extra_info"],
                  messageText: "🎉 Отлично! Твой профиль заполнен!\n\n👤 Твоя анкета:\nПол: {gender}\nИмя: {user_name}\nВозраст: {user_age}\nМетро: {metro_stations}\nИнтересы: {user_interests}\nСемейное положение: {marital_status}\nОриентация: {sexual_orientation}\nТелеграм: {telegram_channel} 📢\nО себе: {extra_info} 📝\n\nМожешь посмотреть полную анкету или сразу получить ссылку на чат!",
                  formatMode: "text",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-profile",
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
                  priority: 1
                },
                {
                  id: "with_telegram_only",
                  condition: "user_data_exists",
                  variableNames: ["telegram_channel"],
                  messageText: "🎉 Отлично! Твой профиль заполнен!\n\n👤 Твоя анкета:\nПол: {gender}\nИмя: {user_name}\nВозраст: {user_age}\nМетро: {metro_stations}\nИнтересы: {user_interests}\nСемейное положение: {marital_status}\nОриентация: {sexual_orientation}\nТелеграм: {telegram_channel} 📢\n\nМожешь посмотреть полную анкету или сразу получить ссылку на чат!",
                  formatMode: "text",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-profile",
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
                  priority: 2
                },
                {
                  id: "with_extra_only",
                  condition: "user_data_exists",
                  variableNames: ["extra_info"],
                  messageText: "🎉 Отлично! Твой профиль заполнен!\n\n👤 Твоя анкета:\nПол: {gender}\nИмя: {user_name}\nВозраст: {user_age}\nМетро: {metro_stations}\nИнтересы: {user_interests}\nСемейное положение: {marital_status}\nОриентация: {sexual_orientation}\nО себе: {extra_info} 📝\n\nМожешь посмотреть полную анкету или сразу получить ссылку на чат!",
                  formatMode: "text",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-profile",
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
                  priority: 3
                }
              ],
              buttons: [
                {
                  id: "btn-profile",
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
            id: "show_profile",
            type: "command",
            position: { x: 500, y: 850 },
            data: {
              command: "/profile",
              commandName: "/profile",
              description: "Показать и редактировать профиль пользователя",
              synonyms: ["профиль", "анкета", "мой профиль", "посмотреть профиль", "редактировать профиль"],
              messageText: "👤 Твой профиль:\n\nПол: {gender} 👤\nИмя: {user_name} ✏️\nВозраст: {user_age} 🎂\nМетро: {metro_stations} 🚇\nИнтересы: {user_interests} 🎯\nСемейное положение: {marital_status} 💍\nОриентация: {sexual_orientation} 🌈\n\n✏️ Выберите действие:",
              keyboardType: "inline",
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "with_both_show",
                  condition: "user_data_exists",
                  variableNames: ["telegram_channel", "extra_info"],
                  messageText: "👤 Твой профиль:\n\nПол: {gender} 👤\nИмя: {user_name} ✏️\nВозраст: {user_age} 🎂\nМетро: {metro_stations} 🚇\nИнтересы: {user_interests} 🎯\nСемейное положение: {marital_status} 💍\nОриентация: {sexual_orientation} 🌈\nТелеграм: {telegram_channel} 📢\nО себе: {extra_info} 📝\n\n✏️ Выберите действие:",
                  formatMode: "text",
                  keyboardType: "inline",
                  buttons: [

                    {
                      id: "btn-edit-gender",
                      text: "👨👩 Изменить пол",
                      action: "goto",
                      target: "gender_selection",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-name",
                      text: "✏️ Изменить имя",
                      action: "goto",
                      target: "name_input",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-age",
                      text: "🎂 Изменить возраст",
                      action: "goto",
                      target: "age_input",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-metro",
                      text: "🚇 Изменить метро",
                      action: "goto",
                      target: "metro_selection",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-interests",
                      text: "🎯 Изменить интересы",
                      action: "goto",
                      target: "interests_categories",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-marital",
                      text: "💍 Изменить семейное положение",
                      action: "goto",
                      target: "marital_status",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-orientation",
                      text: "🌈 Изменить ориентацию",
                      action: "goto",
                      target: "sexual_orientation",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-channel",
                      text: "📢 Изменить ТГК",
                      action: "goto",
                      target: "channel_choice",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-extra",
                      text: "📝 Изменить о себе",
                      action: "goto",
                      target: "extra_info",
                      buttonType: "option"
                    },
                    {
                      id: "btn-restart-from-profile",
                      text: "🔄 Начать заново",
                      action: "command",
                      target: "/start",
                      buttonType: "navigation"
                    }
                  ],
                  priority: 1
                },
                {
                  id: "with_telegram_show",
                  condition: "user_data_exists",
                  variableNames: ["telegram_channel"],
                  messageText: "👤 Твой профиль:\n\nПол: {gender} 👤\nИмя: {user_name} ✏️\nВозраст: {user_age} 🎂\nМетро: {metro_stations} 🚇\nИнтересы: {user_interests} 🎯\nСемейное положение: {marital_status} 💍\nОриентация: {sexual_orientation} 🌈\nТелеграм: {telegram_channel} 📢\n\n✏️ Выберите действие:",
                  formatMode: "text",
                  keyboardType: "inline",
                  buttons: [

                    {
                      id: "btn-edit-gender",
                      text: "👨👩 Изменить пол",
                      action: "goto",
                      target: "gender_selection",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-name",
                      text: "✏️ Изменить имя",
                      action: "goto",
                      target: "name_input",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-age",
                      text: "🎂 Изменить возраст",
                      action: "goto",
                      target: "age_input",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-metro",
                      text: "🚇 Изменить метро",
                      action: "goto",
                      target: "metro_selection",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-interests",
                      text: "🎯 Изменить интересы",
                      action: "goto",
                      target: "interests_categories",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-marital",
                      text: "💍 Изменить семейное положение",
                      action: "goto",
                      target: "marital_status",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-orientation",
                      text: "🌈 Изменить ориентацию",
                      action: "goto",
                      target: "sexual_orientation",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-channel",
                      text: "📢 Изменить ТГК",
                      action: "goto",
                      target: "channel_choice",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-extra",
                      text: "📝 Добавить о себе",
                      action: "goto",
                      target: "extra_info",
                      buttonType: "option"
                    },
                    {
                      id: "btn-restart-from-profile",
                      text: "🔄 Начать заново",
                      action: "command",
                      target: "/start",
                      buttonType: "navigation"
                    }
                  ],
                  priority: 2
                },
                {
                  id: "with_extra_show",
                  condition: "user_data_exists",
                  variableNames: ["extra_info"],
                  messageText: "👤 Твой профиль:\n\nПол: {gender} 👤\nИмя: {user_name} ✏️\nВозраст: {user_age} 🎂\nМетро: {metro_stations} 🚇\nИнтересы: {user_interests} 🎯\nСемейное положение: {marital_status} 💍\nОриентация: {sexual_orientation} 🌈\nО себе: {extra_info} 📝\n\n✏️ Выберите действие:",
                  formatMode: "text",
                  keyboardType: "inline",
                  buttons: [

                    {
                      id: "btn-edit-gender",
                      text: "👨👩 Изменить пол",
                      action: "goto",
                      target: "gender_selection",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-name",
                      text: "✏️ Изменить имя",
                      action: "goto",
                      target: "name_input",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-age",
                      text: "🎂 Изменить возраст",
                      action: "goto",
                      target: "age_input",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-metro",
                      text: "🚇 Изменить метро",
                      action: "goto",
                      target: "metro_selection",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-interests",
                      text: "🎯 Изменить интересы",
                      action: "goto",
                      target: "interests_categories",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-marital",
                      text: "💍 Изменить семейное положение",
                      action: "goto",
                      target: "marital_status",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-orientation",
                      text: "🌈 Изменить ориентацию",
                      action: "goto",
                      target: "sexual_orientation",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-channel",
                      text: "📢 Указать ТГК",
                      action: "goto",
                      target: "channel_choice",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-extra",
                      text: "📝 Изменить о себе",
                      action: "goto",
                      target: "extra_info",
                      buttonType: "option"
                    },
                    {
                      id: "btn-restart-from-profile",
                      text: "🔄 Начать заново",
                      action: "command",
                      target: "/start",
                      buttonType: "navigation"
                    }
                  ],
                  priority: 3
                }
              ],
              buttons: [
                {
                  id: "btn-edit-gender",
                  text: "👨👩 Изменить пол",
                  action: "goto",
                  target: "gender_selection",
                  buttonType: "option"
                },
                {
                  id: "btn-edit-name",
                  text: "✏️ Изменить имя",
                  action: "goto",
                  target: "name_input",
                  buttonType: "option"
                },
                {
                  id: "btn-edit-age",
                  text: "🎂 Изменить возраст",
                  action: "goto",
                  target: "age_input",
                  buttonType: "option"
                },
                {
                  id: "btn-edit-metro",
                  text: "🚇 Изменить метро",
                  action: "goto",
                  target: "metro_selection",
                  buttonType: "option"
                },
                {
                  id: "btn-edit-interests",
                  text: "🎯 Изменить интересы",
                  action: "goto",
                  target: "interests_categories",
                  buttonType: "option"
                },
                {
                  id: "btn-edit-marital",
                  text: "💍 Изменить семейное положение",
                  action: "goto",
                  target: "marital_status",
                  buttonType: "option"
                },
                {
                  id: "btn-edit-orientation",
                  text: "🌈 Изменить ориентацию",
                  action: "goto",
                  target: "sexual_orientation",
                  buttonType: "option"
                },
                {
                  id: "btn-edit-channel",
                  text: "📢 Указать ТГК",
                  action: "goto",
                  target: "channel_choice",
                  buttonType: "option"
                },
                {
                  id: "btn-edit-extra",
                  text: "📝 Добавить о себе",
                  action: "goto",
                  target: "extra_info",
                  buttonType: "option"
                },
                {
                  id: "btn-restart-from-profile",
                  text: "🔄 Начать заново",
                  action: "command",
                  target: "/start",
                  buttonType: "navigation"
                }
              ],
              markdown: false
            }
          },

          {
            id: "chat_link",
            type: "command",
            position: { x: 900, y: 850 },
            data: {
              command: "/link",
              commandName: "/link",
              description: "Получить ссылку на чат сообщества",
              synonyms: ["ссылка", "чат", "сообщество", "впрогулке", "линк"],
              messageText: "🔗 Актуальная ссылка на чат:\n\nhttps://t.me/+agkIVgCzHtY2ZTA6\n\nДобро пожаловать в сообщество ᴠᴨᴩᴏᴦʏᴧᴋᴇ! 🎉",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-back-profile",
                  text: "⬅️ Назад к анкете",
                  action: "command",
                  target: "/profile",
                  buttonType: "navigation"
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
          },

          {
            id: "help_command",
            type: "command",
            position: { x: 1300, y: 850 },
            data: {
              command: "/help",
              commandName: "/help",
              description: "Помощь и список всех команд с синонимами",
              synonyms: ["помощь", "справка", "команды", "что писать", "как пользоваться"],
              messageText: "🤖 **Добро пожаловать в справочный центр!**\n\n╔══════════════════════════════════╗\n║          🌟 ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot          ║\n║     Твой помощник в знакомствах    ║\n╚══════════════════════════════════╝\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🎯 **ОСНОВНЫЕ КОМАНДЫ:**\n\n🚀 `/start` — *Начать заново*\n   📝 Синонимы: `старт`, `начать`, `привет`, `начало`, `начинаем`\n\n👤 `/profile` — *Мой профиль*\n   📝 Синонимы: `профиль`, `анкета`, `мой профиль`, `посмотреть профиль`, `редактировать профиль`\n\n🔗 `/link` — *Ссылка на чат*\n   📝 Синонимы: `ссылка`, `чат`, `сообщество`, `впрогулке`, `линк`\n\n🆘 `/help` — *Эта справка*\n   📝 Синонимы: `помощь`, `справка`, `команды`, `что писать`, `как пользоваться`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 **РАЗДЕЛЫ АНКЕТЫ И ИХ СИНОНИМЫ:**\n\n👫 **Пол:** мужской, женский\n   📝 Синонимы: `пол`, `gender`\n\n🏷️ **Имя:** любое имя\n   📝 Синонимы: `имя`, `как зовут`, `назовись`\n\n🎂 **Возраст:** число от 18 до 99\n   📝 Синонимы: `возраст`, `лет`, `сколько лет`\n\n🚇 **Метро:** выбор линии и станции\n   📝 Синонимы: `метро`, `станция`\n   🟥 Красная линия: `красная линия`, `кировско-выборгская`, `красная ветка`\n   🟦 Синяя линия: `синяя линия`, `московско-петроградская`, `синяя ветка`\n   🟩 Зеленая линия: `зеленая линия`, `невско-василеостровская`, `зеленая ветка`\n   🟧 Оранжевая линия: `оранжевая линия`, `правобережная`, `оранжевая ветка`\n   🟪 Фиолетовая линия: `фиолетовая линия`, `фрунзенско-приморская`, `фиолетовая ветка`\n\n🎨 **Интересы и их синонимы:**\n   🎮 Хобби: `хобби`, `увлечения`, `занятия`, `игры`\n   🤝 Социальная жизнь: `общение`, `социальное`, `люди`, `тусовки`\n   🎭 Творчество: `творчество`, `искусство`, `рисование`, `музыка`\n   💪 Активный образ жизни: `активность`, `активный`, `движение`, `здоровье`\n   🍕 Еда и напитки: `еда`, `напитки`, `кухня`, `рестораны`\n   ⚽ Спорт: `спорт`, `фитнес`, `тренировки`, `футбол`\n\n💑 **Семейное положение:** поиск, отношения, женат/замужем, сложно\n   📝 Синонимы: `семейное положение`, `статус`, `отношения`, `семья`\n\n🌈 **Ориентация:** гетеро, гей, лесби, би, другое\n   📝 Синонимы: `ориентация`, `предпочтения`\n\n📺 **Телеграм-канал:** опционально\n   📝 Синонимы: `тгк`, `телеграм`, `канал`, `тг канал`\n\n📖 **О себе:** дополнительная информация\n   📝 Синонимы: `о себе`, `описание`, `расскажи`, `инфо`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n💡 **ПОЛЕЗНЫЕ СОВЕТЫ:**\n\n✨ Можешь писать команды или синонимы в любом месте разговора\n✨ Бот поймет твои сообщения даже без команд\n✨ В любой момент можешь написать /start для начала заново\n✨ Используй /profile для изменения любых данных\n✨ Нажми на любое выделенное слово чтобы скопировать его!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🎉 **Удачных знакомств в Питере!** 🎉",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-help-start",
                  text: "🚀 Начать заполнение",
                  action: "command",
                  target: "/start",
                  buttonType: "navigation"
                },
                {
                  id: "btn-help-profile",
                  text: "👤 Мой профиль",
                  action: "command",
                  target: "/profile",
                  buttonType: "navigation"
                },
                {
                  id: "btn-help-link",
                  text: "🔗 Ссылка на чат",
                  action: "command",
                  target: "/link",
                  buttonType: "navigation"
                }
              ],
              markdown: true
            }
          }
        ],
        connections: [
          {
            id: "conn-1",
            sourceNodeId: "start",
            targetNodeId: "join_request",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-2",
            sourceNodeId: "join_request",
            targetNodeId: "gender_selection",
            sourceHandle: "btn-yes",
            targetHandle: "target"
          },
          {
            id: "conn-3",
            sourceNodeId: "join_request",
            targetNodeId: "decline_response",
            sourceHandle: "btn-no",
            targetHandle: "target"
          },
          {
            id: "conn-4",
            sourceNodeId: "gender_selection",
            targetNodeId: "name_input",
            sourceHandle: "btn-male",
            targetHandle: "target"
          },
          {
            id: "conn-5",
            sourceNodeId: "gender_selection",
            targetNodeId: "name_input",
            sourceHandle: "btn-female",
            targetHandle: "target"
          },
          {
            id: "conn-6",
            sourceNodeId: "name_input",
            targetNodeId: "age_input",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-7",
            sourceNodeId: "age_input",
            targetNodeId: "metro_selection",
            sourceHandle: "source",
            targetHandle: "target"
          },
          // Connections from metro_selection to different line stations
          {
            id: "conn-8a",
            sourceNodeId: "metro_selection", 
            targetNodeId: "red_line_stations",
            sourceHandle: "btn-red",
            targetHandle: "target"
          },
          {
            id: "conn-8b",
            sourceNodeId: "metro_selection",
            targetNodeId: "blue_line_stations", 
            sourceHandle: "btn-blue",
            targetHandle: "target"
          },
          {
            id: "conn-8c",
            sourceNodeId: "metro_selection",
            targetNodeId: "green_line_stations",
            sourceHandle: "btn-green", 
            targetHandle: "target"
          },
          {
            id: "conn-8d",
            sourceNodeId: "metro_selection",
            targetNodeId: "orange_line_stations",
            sourceHandle: "btn-orange",
            targetHandle: "target"
          },
          {
            id: "conn-8e",
            sourceNodeId: "metro_selection",
            targetNodeId: "purple_line_stations",
            sourceHandle: "btn-purple",
            targetHandle: "target"
          },
          // Direct connections to interests for ЛО and non-SPb users
          {
            id: "conn-8f",
            sourceNodeId: "metro_selection",
            targetNodeId: "interests_categories",
            sourceHandle: "btn-lo",
            targetHandle: "target"
          },
          {
            id: "conn-8g",
            sourceNodeId: "metro_selection",
            targetNodeId: "interests_categories",
            sourceHandle: "btn-not-spb",
            targetHandle: "target"
          },
          // Back connections from station nodes to metro selection
          {
            id: "conn-8h",
            sourceNodeId: "red_line_stations",
            targetNodeId: "metro_selection",
            sourceHandle: "btn-back-metro",
            targetHandle: "target"
          },
          {
            id: "conn-8i",
            sourceNodeId: "blue_line_stations",
            targetNodeId: "metro_selection",
            sourceHandle: "btn-back-metro-blue",
            targetHandle: "target"
          },
          {
            id: "conn-8j",
            sourceNodeId: "green_line_stations",
            targetNodeId: "metro_selection",
            sourceHandle: "btn-back-metro-green",
            targetHandle: "target"
          },
          {
            id: "conn-8k",
            sourceNodeId: "orange_line_stations",
            targetNodeId: "metro_selection",
            sourceHandle: "btn-back-metro-orange",
            targetHandle: "target"
          },
          {
            id: "conn-8l",
            sourceNodeId: "purple_line_stations",
            targetNodeId: "metro_selection",
            sourceHandle: "btn-back-metro-purple",
            targetHandle: "target"
          },
          // Forward connections from station nodes to interests
          {
            id: "conn-8m",
            sourceNodeId: "red_line_stations",
            targetNodeId: "interests_categories",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-8n",
            sourceNodeId: "blue_line_stations",
            targetNodeId: "interests_categories",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-8o",
            sourceNodeId: "green_line_stations",
            targetNodeId: "interests_categories",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-8p",
            sourceNodeId: "orange_line_stations",
            targetNodeId: "interests_categories",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-8q",
            sourceNodeId: "purple_line_stations",
            targetNodeId: "interests_categories",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-9",
            sourceNodeId: "interests_categories",
            targetNodeId: "hobby_interests",
            sourceHandle: "btn-hobby",
            targetHandle: "target"
          },
          {
            id: "conn-10",
            sourceNodeId: "hobby_interests",
            targetNodeId: "interests_categories",
            sourceHandle: "btn-back-categories",
            targetHandle: "target"
          },
          {
            id: "conn-11",
            sourceNodeId: "hobby_interests",
            targetNodeId: "marital_status",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-30",
            sourceNodeId: "interests_categories",
            targetNodeId: "social_interests",
            sourceHandle: "btn-social",
            targetHandle: "target"
          },
          {
            id: "conn-31",
            sourceNodeId: "social_interests",
            targetNodeId: "interests_categories",
            sourceHandle: "btn-back-categories-social",
            targetHandle: "target"
          },
          {
            id: "conn-32",
            sourceNodeId: "social_interests",
            targetNodeId: "marital_status",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-33",
            sourceNodeId: "interests_categories",
            targetNodeId: "creativity_interests",
            sourceHandle: "btn-creativity",
            targetHandle: "target"
          },
          {
            id: "conn-34",
            sourceNodeId: "creativity_interests",
            targetNodeId: "interests_categories",
            sourceHandle: "btn-back-categories-creativity",
            targetHandle: "target"
          },
          {
            id: "conn-35",
            sourceNodeId: "creativity_interests",
            targetNodeId: "marital_status",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-36",
            sourceNodeId: "interests_categories",
            targetNodeId: "active_interests",
            sourceHandle: "btn-active",
            targetHandle: "target"
          },
          {
            id: "conn-37",
            sourceNodeId: "active_interests",
            targetNodeId: "interests_categories",
            sourceHandle: "btn-back-categories-active",
            targetHandle: "target"
          },
          {
            id: "conn-38",
            sourceNodeId: "active_interests",
            targetNodeId: "marital_status",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-39",
            sourceNodeId: "interests_categories",
            targetNodeId: "food_interests",
            sourceHandle: "btn-food",
            targetHandle: "target"
          },
          {
            id: "conn-40",
            sourceNodeId: "food_interests",
            targetNodeId: "interests_categories",
            sourceHandle: "btn-back-categories-food",
            targetHandle: "target"
          },
          {
            id: "conn-41",
            sourceNodeId: "food_interests",
            targetNodeId: "marital_status",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-42",
            sourceNodeId: "interests_categories",
            targetNodeId: "sport_interests",
            sourceHandle: "btn-sport",
            targetHandle: "target"
          },
          {
            id: "conn-43",
            sourceNodeId: "sport_interests",
            targetNodeId: "interests_categories",
            sourceHandle: "btn-back-categories-sport",
            targetHandle: "target"
          },
          {
            id: "conn-44",
            sourceNodeId: "sport_interests",
            targetNodeId: "marital_status",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-12",
            sourceNodeId: "marital_status",
            targetNodeId: "sexual_orientation",
            sourceHandle: "btn-single",
            targetHandle: "target"
          },
          {
            id: "conn-13",
            sourceNodeId: "marital_status",
            targetNodeId: "sexual_orientation",
            sourceHandle: "btn-relationship",
            targetHandle: "target"
          },
          {
            id: "conn-14",
            sourceNodeId: "marital_status",
            targetNodeId: "sexual_orientation",
            sourceHandle: "btn-married",
            targetHandle: "target"
          },
          {
            id: "conn-15",
            sourceNodeId: "marital_status",
            targetNodeId: "sexual_orientation",
            sourceHandle: "btn-complicated",
            targetHandle: "target"
          },
          {
            id: "conn-16",
            sourceNodeId: "sexual_orientation",
            targetNodeId: "channel_choice",
            sourceHandle: "btn-hetero",
            targetHandle: "target"
          },
          {
            id: "conn-17",
            sourceNodeId: "sexual_orientation",
            targetNodeId: "channel_choice",
            sourceHandle: "btn-gay",
            targetHandle: "target"
          },
          {
            id: "conn-18",
            sourceNodeId: "sexual_orientation",
            targetNodeId: "channel_choice",
            sourceHandle: "btn-lesbian",
            targetHandle: "target"
          },
          {
            id: "conn-19",
            sourceNodeId: "sexual_orientation",
            targetNodeId: "channel_choice",
            sourceHandle: "btn-bi",
            targetHandle: "target"
          },
          {
            id: "conn-20",
            sourceNodeId: "sexual_orientation",
            targetNodeId: "channel_choice",
            sourceHandle: "btn-other",
            targetHandle: "target"
          },
          {
            id: "conn-21",
            sourceNodeId: "channel_choice",
            targetNodeId: "extra_info",
            sourceHandle: "btn-skip-channel",
            targetHandle: "target"
          },
          {
            id: "conn-22",
            sourceNodeId: "channel_choice",
            targetNodeId: "extra_info",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-24",
            sourceNodeId: "extra_info",
            targetNodeId: "profile_complete",
            sourceHandle: "btn-skip-extra",
            targetHandle: "target"
          },
          {
            id: "conn-25",
            sourceNodeId: "extra_info",
            targetNodeId: "profile_complete",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-27",
            sourceNodeId: "profile_complete",
            targetNodeId: "chat_link",
            sourceHandle: "btn-chat-link",
            targetHandle: "target"
          },
          // Connections for profile editing buttons
          {
            id: "conn-edit-1",
            sourceNodeId: "show_profile",
            targetNodeId: "gender_selection",
            sourceHandle: "btn-edit-gender",
            targetHandle: "target"
          },
          {
            id: "conn-edit-2",
            sourceNodeId: "show_profile",
            targetNodeId: "name_input",
            sourceHandle: "btn-edit-name",
            targetHandle: "target"
          },
          {
            id: "conn-edit-3",
            sourceNodeId: "show_profile",
            targetNodeId: "age_input",
            sourceHandle: "btn-edit-age",
            targetHandle: "target"
          },
          {
            id: "conn-edit-4",
            sourceNodeId: "show_profile",
            targetNodeId: "metro_selection",
            sourceHandle: "btn-edit-metro",
            targetHandle: "target"
          },
          {
            id: "conn-edit-5",
            sourceNodeId: "show_profile",
            targetNodeId: "interests_categories",
            sourceHandle: "btn-edit-interests",
            targetHandle: "target"
          },
          {
            id: "conn-edit-6",
            sourceNodeId: "show_profile",
            targetNodeId: "marital_status",
            sourceHandle: "btn-edit-marital",
            targetHandle: "target"
          },
          {
            id: "conn-edit-7",
            sourceNodeId: "show_profile",
            targetNodeId: "sexual_orientation",
            sourceHandle: "btn-edit-orientation",
            targetHandle: "target"
          },
          {
            id: "conn-edit-8",
            sourceNodeId: "show_profile",
            targetNodeId: "channel_choice",
            sourceHandle: "btn-edit-channel",
            targetHandle: "target"
          },
          {
            id: "conn-edit-9",
            sourceNodeId: "show_profile",
            targetNodeId: "extra_info",
            sourceHandle: "btn-edit-extra",
            targetHandle: "target"
          }
        ]
      }
    });

    console.log('✅ Шаблон VProgulke Bot создан');

    // Создаем шаблон с многолистовой структурой и навигацией
    await storage.createBotTemplate({
      name: "🏢 Многолистовой бизнес-бот",
      description: "Демонстрация многолистовой структуры с разными разделами: услуги, прайс, портфолио и контакты",
      category: "business",
      tags: ["многолистовой", "навигация", "бизнес", "меню", "структура", "разделы"],
      isPublic: 1,
      difficulty: "medium",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 6,
      estimatedTime: 25,
      data: {
        sheets: [
          {
            id: "main_sheet",
            name: "Главное меню",
            nodes: [
              {
                id: "start",
                type: "start",
                position: { x: 400, y: 100 },
                data: {
                  command: "/start",
                  description: "Приветствие и главное меню",
                  messageText: "🏢 Добро пожаловать в нашу компанию!\n\nМы предоставляем профессиональные услуги в области IT-разработки.\n\nВыберите интересующий вас раздел:",
                  synonyms: ["старт", "начать", "меню", "главная"],
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-services",
                      text: "💼 Наши услуги",
                      action: "goto",
                      target: "services_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-portfolio",
                      text: "📁 Портфолио",
                      action: "goto", 
                      target: "portfolio_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-pricing",
                      text: "💰 Прайс-лист",
                      action: "goto",
                      target: "pricing_main", 
                      buttonType: "normal"
                    },
                    {
                      id: "btn-contacts",
                      text: "📞 Контакты",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-about",
                      text: "ℹ️ О компании",
                      action: "goto",
                      target: "about_company",
                      buttonType: "normal"
                    }
                  ],
                  markdown: false,
                  oneTimeKeyboard: false,
                  resizeKeyboard: true
                }
              },
              {
                id: "about_company",
                type: "message",
                position: { x: 400, y: 300 },
                data: {
                  messageText: "ℹ️ О нашей компании:\n\n🔹 Работаем на рынке с 2018 года\n🔹 Команда из 15+ опытных разработчиков\n🔹 Более 200 успешно реализованных проектов\n🔹 Полный цикл разработки от идеи до запуска\n🔹 Поддержка проектов 24/7\n\nНаша миссия - создавать качественные IT-решения, которые помогают бизнесу расти и развиваться.",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-main",
                      text: "⬅️ Главное меню",
                      action: "goto",
                      target: "start",
                      buttonType: "normal"
                    }
                  ],
                  markdown: false
                }
              }
            ],
            connections: [
              {
                id: "conn-start-services",
                source: "start",
                target: "services_main",
                sourceHandle: "btn-services",
                targetHandle: "target"
              },
              {
                id: "conn-start-portfolio", 
                source: "start",
                target: "portfolio_main",
                sourceHandle: "btn-portfolio",
                targetHandle: "target"
              },
              {
                id: "conn-start-pricing",
                source: "start", 
                target: "pricing_main",
                sourceHandle: "btn-pricing",
                targetHandle: "target"
              },
              {
                id: "conn-start-contacts",
                source: "start",
                target: "contacts_main", 
                sourceHandle: "btn-contacts",
                targetHandle: "target"
              },
              {
                id: "conn-start-about",
                source: "start",
                target: "about_company",
                sourceHandle: "btn-about", 
                targetHandle: "target"
              },
              {
                id: "conn-about-main",
                source: "about_company",
                target: "start",
                sourceHandle: "btn-back-main",
                targetHandle: "target"
              }
            ],
            viewState: {
              position: { x: 0, y: 0 },
              zoom: 1
            }
          },
          {
            id: "services_sheet",
            name: "Услуги",
            nodes: [
              {
                id: "services_main",
                type: "message",
                position: { x: 400, y: 100 },
                data: {
                  messageText: "💼 Наши услуги:\n\nМы предлагаем полный спектр IT-услуг для вашего бизнеса.\n\nВыберите интересующую категорию:",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-web-dev",
                      text: "🌐 Веб-разработка",
                      action: "goto",
                      target: "web_development",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-mobile-dev",
                      text: "📱 Мобильная разработка",
                      action: "goto", 
                      target: "mobile_development",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-design",
                      text: "🎨 Дизайн",
                      action: "goto",
                      target: "design_services",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-consulting",
                      text: "🧠 IT-консалтинг",
                      action: "goto",
                      target: "consulting",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-back-services",
                      text: "⬅️ Главное меню",
                      action: "goto",
                      target: "start",
                      buttonType: "normal"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "web_development",
                type: "message",
                position: { x: 100, y: 300 },
                data: {
                  messageText: "🌐 Веб-разработка:\n\n✅ Корпоративные сайты\n✅ Интернет-магазины\n✅ Веб-приложения\n✅ CRM и ERP системы\n✅ API разработка\n✅ Поддержка и развитие\n\nТехнологии: React, Vue.js, Node.js, Python, PHP",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-services-web",
                      text: "⬅️ Назад к услугам",
                      action: "goto",
                      target: "services_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-consultation-web",
                      text: "📞 Получить консультацию",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "mobile_development",
                type: "message",
                position: { x: 400, y: 300 },
                data: {
                  messageText: "📱 Мобильная разработка:\n\n✅ Нативные iOS приложения\n✅ Нативные Android приложения\n✅ Кроссплатформенные решения\n✅ Игры для мобильных устройств\n✅ Интеграция с внешними сервисами\n✅ Публикация в App Store и Google Play\n\nТехнологии: Swift, Kotlin, React Native, Flutter",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-services-mobile",
                      text: "⬅️ Назад к услугам",
                      action: "goto",
                      target: "services_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-consultation-mobile",
                      text: "📞 Получить консультацию",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "design_services",
                type: "message",
                position: { x: 700, y: 300 },
                data: {
                  messageText: "🎨 Дизайн услуги:\n\n✅ UI/UX дизайн веб-сайтов\n✅ Дизайн мобильных приложений\n✅ Брендинг и фирменный стиль\n✅ Логотипы и графика\n✅ Анимация и видео\n✅ Прототипирование\n\nИнструменты: Figma, Adobe Creative Suite, Sketch",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-services-design",
                      text: "⬅️ Назад к услугам",
                      action: "goto",
                      target: "services_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-portfolio-design",
                      text: "📁 Смотреть портфолио",
                      action: "goto",
                      target: "portfolio_main",
                      buttonType: "normal"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "consulting",
                type: "message",
                position: { x: 1000, y: 300 },
                data: {
                  messageText: "🧠 IT-консалтинг:\n\n✅ Аудит текущих IT-решений\n✅ Планирование цифровой трансформации\n✅ Выбор технологий\n✅ Архитектурное планирование\n✅ Оптимизация бизнес-процессов\n✅ Обучение команды\n\nПоможем выбрать наилучшие решения для вашего бизнеса!",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-services-consulting",
                      text: "⬅️ Назад к услугам",
                      action: "goto",
                      target: "services_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-consultation-consulting",
                      text: "📞 Получить консультацию",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    }
                  ],
                  markdown: false
                }
              }
            ],
            connections: [
              {
                id: "conn-services-web",
                source: "services_main",
                target: "web_development",
                sourceHandle: "btn-web-dev",
                targetHandle: "target"
              },
              {
                id: "conn-services-mobile",
                source: "services_main",
                target: "mobile_development",
                sourceHandle: "btn-mobile-dev",
                targetHandle: "target"
              },
              {
                id: "conn-services-design",
                source: "services_main",
                target: "design_services",
                sourceHandle: "btn-design",
                targetHandle: "target"
              },
              {
                id: "conn-services-consulting",
                source: "services_main",
                target: "consulting",
                sourceHandle: "btn-consulting",
                targetHandle: "target"
              },
              {
                id: "conn-web-back",
                source: "web_development",
                target: "services_main",
                sourceHandle: "btn-back-services-web",
                targetHandle: "target"
              },
              {
                id: "conn-mobile-back",
                source: "mobile_development",
                target: "services_main",
                sourceHandle: "btn-back-services-mobile",
                targetHandle: "target"
              },
              {
                id: "conn-design-back",
                source: "design_services",
                target: "services_main",
                sourceHandle: "btn-back-services-design",
                targetHandle: "target"
              },
              {
                id: "conn-consulting-back",
                source: "consulting",
                target: "services_main",
                sourceHandle: "btn-back-services-consulting",
                targetHandle: "target"
              }
            ],
            viewState: {
              position: { x: 0, y: 0 },
              zoom: 1
            }
          },
          {
            id: "portfolio_sheet", 
            name: "Портфолио",
            nodes: [
              {
                id: "portfolio_main",
                type: "message",
                position: { x: 400, y: 100 },
                data: {
                  messageText: "📁 Наше портфолио:\n\nМы гордимся нашими работами и рады показать примеры успешных проектов.\n\nВыберите категорию проектов:",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-web-portfolio",
                      text: "🌐 Веб-проекты",
                      action: "goto",
                      target: "web_portfolio",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-mobile-portfolio",
                      text: "📱 Мобильные приложения",
                      action: "goto",
                      target: "mobile_portfolio",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-design-portfolio",
                      text: "🎨 Дизайн-проекты",
                      action: "goto",
                      target: "design_portfolio",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-back-portfolio",
                      text: "⬅️ Главное меню",
                      action: "goto",
                      target: "start",
                      buttonType: "normal"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "web_portfolio",
                type: "message",
                position: { x: 100, y: 300 },
                data: {
                  messageText: "🌐 Веб-проекты:\n\n🔹 **ТехноМарт** - Интернет-магазин электроники\n   • React + Node.js\n   • 10,000+ товаров\n   • Интеграция с 1С\n\n🔹 **МедКлиника Плюс** - Система записи к врачам\n   • Vue.js + Python\n   • Онлайн-консультации\n   • Система уведомлений\n\n🔹 **LogiTrans** - CRM для логистической компании\n   • Angular + .NET\n   • Трекинг грузов\n   • Автоматизация процессов",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-portfolio-web",
                      text: "⬅️ Назад к портфолио",
                      action: "goto",
                      target: "portfolio_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-consultation-portfolio",
                      text: "📞 Обсудить проект",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    }
                  ],
                  markdown: true
                }
              },
              {
                id: "mobile_portfolio",
                type: "message",
                position: { x: 400, y: 300 },
                data: {
                  messageText: "📱 Мобильные приложения:\n\n🔹 **FitTracker** - Фитнес-трекер (iOS/Android)\n   • React Native\n   • 50,000+ скачиваний\n   • Интеграция с умными часами\n\n🔹 **BankSecure** - Банковское приложение\n   • Native iOS/Android\n   • Биометрическая аутентификация\n   • Push-уведомления\n\n🔹 **DeliveryFast** - Доставка еды\n   • Flutter\n   • Геолокация\n   • Онлайн-платежи",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-portfolio-mobile",
                      text: "⬅️ Назад к портфолио",
                      action: "goto",
                      target: "portfolio_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-consultation-mobile-portfolio",
                      text: "📞 Обсудить проект",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    }
                  ],
                  markdown: true
                }
              },
              {
                id: "design_portfolio",
                type: "message",
                position: { x: 700, y: 300 },
                data: {
                  messageText: "🎨 Дизайн-проекты:\n\n🔹 **EcoStyle** - Брендинг эко-магазина\n   • Логотип и фирменный стиль\n   • Дизайн упаковки\n   • Веб-дизайн\n\n🔹 **StartupHub** - UI/UX для стартап-платформы\n   • Пользовательский интерфейс\n   • Мобильная версия\n   • Система иконок\n\n🔹 **RestaurantChain** - Дизайн сети ресторанов\n   • Меню и интерьер\n   • Мобильное приложение\n   • Маркетинговые материалы",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-portfolio-design",
                      text: "⬅️ Назад к портфолио",
                      action: "goto",
                      target: "portfolio_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-consultation-design-portfolio",
                      text: "📞 Обсудить проект",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    }
                  ],
                  markdown: true
                }
              }
            ],
            connections: [
              {
                id: "conn-portfolio-web",
                source: "portfolio_main",
                target: "web_portfolio",
                sourceHandle: "btn-web-portfolio",
                targetHandle: "target"
              },
              {
                id: "conn-portfolio-mobile",
                source: "portfolio_main",
                target: "mobile_portfolio",
                sourceHandle: "btn-mobile-portfolio",
                targetHandle: "target"
              },
              {
                id: "conn-portfolio-design",
                source: "portfolio_main",
                target: "design_portfolio",
                sourceHandle: "btn-design-portfolio",
                targetHandle: "target"
              },
              {
                id: "conn-web-portfolio-back",
                source: "web_portfolio",
                target: "portfolio_main",
                sourceHandle: "btn-back-portfolio-web",
                targetHandle: "target"
              },
              {
                id: "conn-mobile-portfolio-back",
                source: "mobile_portfolio",
                target: "portfolio_main",
                sourceHandle: "btn-back-portfolio-mobile",
                targetHandle: "target"
              },
              {
                id: "conn-design-portfolio-back",
                source: "design_portfolio",
                target: "portfolio_main",
                sourceHandle: "btn-back-portfolio-design",
                targetHandle: "target"
              }
            ],
            viewState: {
              position: { x: 0, y: 0 },
              zoom: 1
            }
          },
          {
            id: "pricing_sheet",
            name: "Прайс-лист",
            nodes: [
              {
                id: "pricing_main",
                type: "message",
                position: { x: 400, y: 100 },
                data: {
                  messageText: "💰 Прайс-лист:\n\nПрозрачные цены на наши услуги. Стоимость может варьироваться в зависимости от сложности проекта.\n\nВыберите интересующую категорию:",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-web-pricing",
                      text: "🌐 Веб-разработка",
                      action: "goto",
                      target: "web_pricing",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-mobile-pricing",
                      text: "📱 Мобильные приложения",
                      action: "goto",
                      target: "mobile_pricing",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-design-pricing",
                      text: "🎨 Дизайн",
                      action: "goto",
                      target: "design_pricing",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-packages",
                      text: "📦 Готовые пакеты",
                      action: "goto",
                      target: "pricing_packages",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-back-pricing",
                      text: "⬅️ Главное меню",
                      action: "goto",
                      target: "start",
                      buttonType: "normal"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "web_pricing",
                type: "message",
                position: { x: 100, y: 300 },
                data: {
                  messageText: "🌐 Веб-разработка - цены:\n\n💼 **Корпоративный сайт**\n   • Лендинг: от 50,000₽\n   • Многостраничный: от 120,000₽\n   • С админкой: от 180,000₽\n\n🛒 **Интернет-магазин**\n   • Простой: от 200,000₽\n   • Средней сложности: от 400,000₽\n   • Крупный маркетплейс: от 800,000₽\n\n🔧 **Веб-приложение**\n   • CRM/ERP: от 500,000₽\n   • SaaS платформа: от 1,000,000₽",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-pricing-web",
                      text: "⬅️ Назад к прайсу",
                      action: "goto",
                      target: "pricing_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-calculate-web",
                      text: "🧮 Рассчитать стоимость",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    }
                  ],
                  markdown: true
                }
              },
              {
                id: "mobile_pricing",
                type: "message",
                position: { x: 400, y: 300 },
                data: {
                  messageText: "📱 Мобильные приложения - цены:\n\n📲 **iOS / Android (нативные)**\n   • Простое приложение: от 300,000₽\n   • Среднее по сложности: от 600,000₽\n   • Сложное приложение: от 1,200,000₽\n\n🔄 **Кроссплатформенные**\n   • React Native: от 250,000₽\n   • Flutter: от 280,000₽\n\n🎮 **Игры**\n   • Простая игра: от 400,000₽\n   • Игра средней сложности: от 800,000₽",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-pricing-mobile",
                      text: "⬅️ Назад к прайсу",
                      action: "goto",
                      target: "pricing_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-calculate-mobile",
                      text: "🧮 Рассчитать стоимость",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    }
                  ],
                  markdown: true
                }
              },
              {
                id: "design_pricing",
                type: "message",
                position: { x: 700, y: 300 },
                data: {
                  messageText: "🎨 Дизайн - цены:\n\n🎯 **UI/UX дизайн**\n   • Лендинг: от 30,000₽\n   • Сайт (5-10 страниц): от 60,000₽\n   • Приложение: от 80,000₽\n\n🏷️ **Брендинг**\n   • Логотип: от 20,000₽\n   • Фирменный стиль: от 50,000₽\n   • Полный ребрендинг: от 150,000₽\n\n📱 **Мобильный дизайн**\n   • Прототип: от 40,000₽\n   • Полный дизайн: от 100,000₽",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-pricing-design",
                      text: "⬅️ Назад к прайсу",
                      action: "goto",
                      target: "pricing_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-calculate-design",
                      text: "🧮 Рассчитать стоимость",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    }
                  ],
                  markdown: true
                }
              },
              {
                id: "pricing_packages",
                type: "message",
                position: { x: 1000, y: 300 },
                data: {
                  messageText: "📦 Готовые пакеты:\n\n🚀 **СТАРТАП** - 150,000₽\n   • Лендинг + дизайн\n   • Мобильная версия\n   • Базовая SEO\n   • 3 месяца поддержки\n\n💼 **БИЗНЕС** - 400,000₽\n   • Корпоративный сайт\n   • Админ-панель\n   • Интеграции\n   • 6 месяцев поддержки\n\n🏢 **ENTERPRISE** - 1,000,000₽\n   • Полнофункциональная платформа\n   • Мобильные приложения\n   • Интеграция с системами\n   • Год поддержки + развитие",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-pricing-packages",
                      text: "⬅️ Назад к прайсу",
                      action: "goto",
                      target: "pricing_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-choose-package",
                      text: "✅ Выбрать пакет",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    }
                  ],
                  markdown: true
                }
              }
            ],
            connections: [
              {
                id: "conn-pricing-web",
                source: "pricing_main",
                target: "web_pricing",
                sourceHandle: "btn-web-pricing",
                targetHandle: "target"
              },
              {
                id: "conn-pricing-mobile",
                source: "pricing_main",
                target: "mobile_pricing",
                sourceHandle: "btn-mobile-pricing",
                targetHandle: "target"
              },
              {
                id: "conn-pricing-design",
                source: "pricing_main",
                target: "design_pricing",
                sourceHandle: "btn-design-pricing",
                targetHandle: "target"
              },
              {
                id: "conn-pricing-packages",
                source: "pricing_main",
                target: "pricing_packages",
                sourceHandle: "btn-packages",
                targetHandle: "target"
              },
              {
                id: "conn-web-pricing-back",
                source: "web_pricing",
                target: "pricing_main",
                sourceHandle: "btn-back-pricing-web",
                targetHandle: "target"
              },
              {
                id: "conn-mobile-pricing-back",
                source: "mobile_pricing",
                target: "pricing_main",
                sourceHandle: "btn-back-pricing-mobile",
                targetHandle: "target"
              },
              {
                id: "conn-design-pricing-back",
                source: "design_pricing",
                target: "pricing_main",
                sourceHandle: "btn-back-pricing-design",
                targetHandle: "target"
              },
              {
                id: "conn-packages-pricing-back",
                source: "pricing_packages",
                target: "pricing_main",
                sourceHandle: "btn-back-pricing-packages",
                targetHandle: "target"
              }
            ],
            viewState: {
              position: { x: 0, y: 0 },
              zoom: 1
            }
          },
          {
            id: "contacts_sheet",
            name: "Контакты",
            nodes: [
              {
                id: "contacts_main",
                type: "message",
                position: { x: 400, y: 100 },
                data: {
                  messageText: "📞 Наши контакты:\n\n🏢 **Адрес офиса:**\nг. Москва, ул. Тверская, д. 15, офис 401\n\n📧 **Email:**\ninfo@itcompany.ru\n\n📱 **Телефон:**\n+7 (495) 123-45-67\n\n🕒 **Время работы:**\nПн-Пт: 9:00 - 18:00\nСб-Вс: выходные\n\nВыберите удобный способ связи:",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-call-request",
                      text: "📞 Заказать звонок",
                      action: "goto",
                      target: "call_request",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-consultation",
                      text: "💬 Бесплатная консультация",
                      action: "goto",
                      target: "consultation_form",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-social-links",
                      text: "🌐 Мы в соцсетях",
                      action: "goto",
                      target: "social_links",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-back-contacts",
                      text: "⬅️ Главное меню",
                      action: "goto",
                      target: "start",
                      buttonType: "normal"
                    }
                  ],
                  markdown: true
                }
              },
              {
                id: "call_request",
                type: "message",
                position: { x: 100, y: 300 },
                data: {
                  messageText: "📞 Заказать обратный звонок:\n\nОставьте ваш номер телефона, и мы перезвоним в течение 30 минут в рабочее время.\n\nУкажите ваш номер телефона:",
                  keyboardType: "none",
                  collectUserInput: true,
                  enableTextInput: true,
                  inputVariable: "phone_number",
                  inputTargetNodeId: "call_confirmation",
                  inputType: "phone",
                  inputValidation: "^\\+?[1-9]\\d{1,14}$",
                  inputRetryMessage: "Пожалуйста, введите корректный номер телефона",
                  markdown: false
                }
              },
              {
                id: "call_confirmation",
                type: "message",
                position: { x: 100, y: 500 },
                data: {
                  messageText: "✅ Спасибо! Ваша заявка принята.\n\nНомер телефона: {phone_number}\n\nМы перезвоним вам в ближайшее время!",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-contacts-call",
                      text: "⬅️ К контактам",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-main-menu-call",
                      text: "🏠 Главное меню",
                      action: "goto",
                      target: "start",
                      buttonType: "normal"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "consultation_form",
                type: "message",
                position: { x: 400, y: 300 },
                data: {
                  messageText: "💬 Бесплатная консультация:\n\nОпишите ваш проект или задачу, и мы предложим оптимальное решение.\n\nРасскажите о вашем проекте:",
                  keyboardType: "none",
                  collectUserInput: true,
                  enableTextInput: true,
                  inputVariable: "project_description",
                  inputTargetNodeId: "consultation_contact",
                  inputType: "text",
                  minLength: 10,
                  maxLength: 2000,
                  inputRetryMessage: "Пожалуйста, опишите ваш проект подробнее (минимум 10 символов)",
                  markdown: false
                }
              },
              {
                id: "consultation_contact",
                type: "message",
                position: { x: 400, y: 500 },
                data: {
                  messageText: "Отлично! Теперь укажите ваш контактный телефон для связи:",
                  keyboardType: "none",
                  collectUserInput: true,
                  enableTextInput: true,
                  inputVariable: "consultation_phone",
                  inputTargetNodeId: "consultation_confirmation",
                  inputType: "phone",
                  inputValidation: "^\\+?[1-9]\\d{1,14}$",
                  inputRetryMessage: "Пожалуйста, введите корректный номер телефона",
                  markdown: false
                }
              },
              {
                id: "consultation_confirmation",
                type: "message",
                position: { x: 400, y: 700 },
                data: {
                  messageText: "🎉 Заявка на консультацию отправлена!\n\n📝 **Описание проекта:**\n{project_description}\n\n📞 **Контактный телефон:**\n{consultation_phone}\n\nНаш специалист свяжется с вами в течение 2 часов для обсуждения деталей.",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-contacts-consultation",
                      text: "⬅️ К контактам",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-main-menu-consultation",
                      text: "🏠 Главное меню",
                      action: "goto",
                      target: "start",
                      buttonType: "normal"
                    }
                  ],
                  markdown: true
                }
              },
              {
                id: "social_links",
                type: "message",
                position: { x: 700, y: 300 },
                data: {
                  messageText: "🌐 Мы в социальных сетях:\n\n📘 **ВКонтакте:** vk.com/itcompany\n📸 **Instagram:** @itcompany_official\n💼 **LinkedIn:** IT Company\n📹 **YouTube:** IT Company Channel\n💬 **Telegram:** @itcompany_chat\n\nПодписывайтесь на наши каналы и следите за новостями и полезными материалами!",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-back-contacts-social",
                      text: "⬅️ К контактам",
                      action: "goto",
                      target: "contacts_main",
                      buttonType: "normal"
                    }
                  ],
                  markdown: true
                }
              }
            ],
            connections: [
              {
                id: "conn-contacts-call",
                source: "contacts_main",
                target: "call_request",
                sourceHandle: "btn-call-request",
                targetHandle: "target"
              },
              {
                id: "conn-contacts-consultation",
                source: "contacts_main",
                target: "consultation_form",
                sourceHandle: "btn-consultation",
                targetHandle: "target"
              },
              {
                id: "conn-contacts-social",
                source: "contacts_main",
                target: "social_links",
                sourceHandle: "btn-social-links",
                targetHandle: "target"
              },
              {
                id: "conn-call-confirmation",
                source: "call_request",
                target: "call_confirmation",
                sourceHandle: "input-phone",
                targetHandle: "target"
              },
              {
                id: "conn-consultation-contact",
                source: "consultation_form",
                target: "consultation_contact",
                sourceHandle: "input-description",
                targetHandle: "target"
              },
              {
                id: "conn-consultation-confirmation",
                source: "consultation_contact",
                target: "consultation_confirmation",
                sourceHandle: "input-phone",
                targetHandle: "target"
              },
              {
                id: "conn-call-back-contacts",
                source: "call_confirmation",
                target: "contacts_main",
                sourceHandle: "btn-back-contacts-call",
                targetHandle: "target"
              },
              {
                id: "conn-consultation-back-contacts",
                source: "consultation_confirmation",
                target: "contacts_main",
                sourceHandle: "btn-back-contacts-consultation",
                targetHandle: "target"
              },
              {
                id: "conn-social-back-contacts",
                source: "social_links",
                target: "contacts_main",
                sourceHandle: "btn-back-contacts-social",
                targetHandle: "target"
              }
            ],
            viewState: {
              position: { x: 0, y: 0 },
              zoom: 1
            }
          }
        ],
        // Межлистовые соединения
        interSheetConnections: [
          {
            id: "inter-main-services",
            sourceSheetId: "main_sheet",
            targetSheetId: "services_sheet", 
            sourceNodeId: "start",
            targetNodeId: "services_main",
            sourceHandle: "btn-services",
            targetHandle: "target"
          },
          {
            id: "inter-main-portfolio",
            sourceSheetId: "main_sheet",
            targetSheetId: "portfolio_sheet",
            sourceNodeId: "start", 
            targetNodeId: "portfolio_main",
            sourceHandle: "btn-portfolio",
            targetHandle: "target"
          },
          {
            id: "inter-main-pricing",
            sourceSheetId: "main_sheet",
            targetSheetId: "pricing_sheet",
            sourceNodeId: "start",
            targetNodeId: "pricing_main",
            sourceHandle: "btn-pricing",
            targetHandle: "target"
          },
          {
            id: "inter-main-contacts",
            sourceSheetId: "main_sheet", 
            targetSheetId: "contacts_sheet",
            sourceNodeId: "start",
            targetNodeId: "contacts_main",
            sourceHandle: "btn-contacts",
            targetHandle: "target"
          },
          {
            id: "inter-services-main",
            sourceSheetId: "services_sheet",
            targetSheetId: "main_sheet",
            sourceNodeId: "services_main",
            targetNodeId: "start",
            sourceHandle: "btn-back-services",
            targetHandle: "target"
          },
          {
            id: "inter-portfolio-main",
            sourceSheetId: "portfolio_sheet",
            targetSheetId: "main_sheet",
            sourceNodeId: "portfolio_main",
            targetNodeId: "start",
            sourceHandle: "btn-back-portfolio",
            targetHandle: "target"
          },
          {
            id: "inter-pricing-main",
            sourceSheetId: "pricing_sheet",
            targetSheetId: "main_sheet",
            sourceNodeId: "pricing_main",
            targetNodeId: "start",
            sourceHandle: "btn-back-pricing",
            targetHandle: "target"
          },
          {
            id: "inter-contacts-main",
            sourceSheetId: "contacts_sheet",
            targetSheetId: "main_sheet",
            sourceNodeId: "contacts_main",
            targetNodeId: "start",
            sourceHandle: "btn-back-contacts",
            targetHandle: "target"
          },
          {
            id: "inter-services-contacts",
            sourceSheetId: "services_sheet",
            targetSheetId: "contacts_sheet",
            sourceNodeId: "web_development",
            targetNodeId: "contacts_main",
            sourceHandle: "btn-consultation-web",
            targetHandle: "target"
          },
          {
            id: "inter-services-contacts-mobile",
            sourceSheetId: "services_sheet",
            targetSheetId: "contacts_sheet",
            sourceNodeId: "mobile_development",
            targetNodeId: "contacts_main",
            sourceHandle: "btn-consultation-mobile",
            targetHandle: "target"
          },
          {
            id: "inter-services-portfolio",
            sourceSheetId: "services_sheet",
            targetSheetId: "portfolio_sheet",
            sourceNodeId: "design_services",
            targetNodeId: "portfolio_main",
            sourceHandle: "btn-portfolio-design",
            targetHandle: "target"
          },
          {
            id: "inter-services-contacts-consulting",
            sourceSheetId: "services_sheet",
            targetSheetId: "contacts_sheet",
            sourceNodeId: "consulting",
            targetNodeId: "contacts_main",
            sourceHandle: "btn-consultation-consulting",
            targetHandle: "target"
          },
          {
            id: "inter-portfolio-contacts",
            sourceSheetId: "portfolio_sheet",
            targetSheetId: "contacts_sheet",
            sourceNodeId: "web_portfolio",
            targetNodeId: "contacts_main",
            sourceHandle: "btn-consultation-portfolio",
            targetHandle: "target"
          },
          {
            id: "inter-portfolio-contacts-mobile",
            sourceSheetId: "portfolio_sheet",
            targetSheetId: "contacts_sheet", 
            sourceNodeId: "mobile_portfolio",
            targetNodeId: "contacts_main",
            sourceHandle: "btn-consultation-mobile-portfolio",
            targetHandle: "target"
          },
          {
            id: "inter-portfolio-contacts-design",
            sourceSheetId: "portfolio_sheet",
            targetSheetId: "contacts_sheet",
            sourceNodeId: "design_portfolio",
            targetNodeId: "contacts_main",
            sourceHandle: "btn-consultation-design-portfolio",
            targetHandle: "target"
          },
          {
            id: "inter-pricing-contacts-web",
            sourceSheetId: "pricing_sheet",
            targetSheetId: "contacts_sheet",
            sourceNodeId: "web_pricing",
            targetNodeId: "contacts_main",
            sourceHandle: "btn-calculate-web",
            targetHandle: "target"
          },
          {
            id: "inter-pricing-contacts-mobile",
            sourceSheetId: "pricing_sheet",
            targetSheetId: "contacts_sheet",
            sourceNodeId: "mobile_pricing",
            targetNodeId: "contacts_main",
            sourceHandle: "btn-calculate-mobile",
            targetHandle: "target"
          },
          {
            id: "inter-pricing-contacts-design",
            sourceSheetId: "pricing_sheet",
            targetSheetId: "contacts_sheet",
            sourceNodeId: "design_pricing",
            targetNodeId: "contacts_main",
            sourceHandle: "btn-calculate-design",
            targetHandle: "target"
          },
          {
            id: "inter-pricing-contacts-packages",
            sourceSheetId: "pricing_sheet",
            targetSheetId: "contacts_sheet",
            sourceNodeId: "pricing_packages",
            targetNodeId: "contacts_main",
            sourceHandle: "btn-choose-package",
            targetHandle: "target"
          },
          {
            id: "inter-contacts-main-call",
            sourceSheetId: "contacts_sheet",
            targetSheetId: "main_sheet",
            sourceNodeId: "call_confirmation",
            targetNodeId: "start",
            sourceHandle: "btn-main-menu-call",
            targetHandle: "target"
          },
          {
            id: "inter-contacts-main-consultation",
            sourceSheetId: "contacts_sheet",
            targetSheetId: "main_sheet",
            sourceNodeId: "consultation_confirmation",
            targetNodeId: "start",
            sourceHandle: "btn-main-menu-consultation",
            targetHandle: "target"
          }
        ]
      }
    });

    console.log('✅ Шаблон многолистовой структуры создан');

    // Создаем новый многолистовой шаблон ВПрогулке
    await storage.createBotTemplate({
      name: "🌟 ВПрогулке Multi-Sheet - Знакомства СПб",
      description: "Многолистовая версия бота знакомств с разделением на логические разделы: знакомство, метро, интересы, личная информация и профиль",
      category: "community",
      tags: ["знакомства", "многолистовой", "метро", "интересы", "СПб", "анкета", "навигация"],
      isPublic: 1,
      difficulty: "hard",
      authorName: "Система",
      version: "4.0.0",
      featured: 1,
      language: "ru",
      complexity: 9,
      estimatedTime: 50,
      data: {
        sheets: [
          // Лист 1: Приветствие и основная информация
          {
            id: "welcome_sheet",
            name: "🎉 Приветствие",
            nodes: [
              {
                id: "start",
                type: "start",
                position: { x: 400, y: 100 },
                data: {
                  command: "/start",
                  description: "Приветствие и источник",
                  messageText: "🌟 Привет от ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot!\n\nЭтот бот поможет тебе найти интересных людей в Санкт-Петербурге!\n\nОткуда ты узнал о нашем чате? 😎",
                  synonyms: ["старт", "начать", "привет", "начало", "начинаем"],
                  keyboardType: "none",
                  buttons: [],
                  collectUserInput: true,
                  enableTextInput: true,
                  inputVariable: "user_source",
                  inputTargetNodeId: "join_request",
                  markdown: false,
                  oneTimeKeyboard: false,
                  resizeKeyboard: true
                }
              },
              {
                id: "join_request",
                type: "message",
                position: { x: 400, y: 300 },
                data: {
                  messageText: "Хочешь присоединиться к нашему чату? 🚀",
                  synonyms: [],
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
                  markdown: false,
                  oneTimeKeyboard: true,
                  resizeKeyboard: true
                }
              },
              {
                id: "decline_response",
                type: "message",
                position: { x: 400, y: 500 },
                data: {
                  messageText: "Понятно! Если передумаешь, напиши /start! 😊",
                  synonyms: [],
                  keyboardType: "none",
                  removeKeyboard: true,
                  buttons: [],
                  markdown: false
                }
              }
            ]
          },

          // Лист 2: Основная информация (пол, имя, возраст)
          {
            id: "basic_info_sheet", 
            name: "👤 Основная информация",
            nodes: [
              {
                id: "gender_selection",
                type: "message",
                position: { x: 400, y: 300 },
                data: {
                  messageText: "Укажи свой пол: 👨👩",
                  keyboardType: "inline",
                  collectUserInput: true,
                  inputVariable: "gender",
                  synonyms: ["пол", "гендер", "мужчина", "женщина"],
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
                  markdown: false,
                  oneTimeKeyboard: true,
                  resizeKeyboard: true
                }
              },
              {
                id: "name_input",
                type: "message",
                position: { x: 400, y: 500 },
                data: {
                  messageText: "Как тебя зовут? ✏️\n\nНапиши своё имя в сообщении:",
                  keyboardType: "none",
                  collectUserInput: true,
                  enableTextInput: true,
                  inputVariable: "user_name",
                  synonyms: ["имя", "зовут", "называют", "как зовут"],
                  inputTargetNodeId: "age_input",
                  buttons: [],
                  markdown: false
                }
              },
              {
                id: "age_input",
                type: "message",
                position: { x: 400, y: 700 },
                data: {
                  messageText: "Сколько тебе лет? 🎂\n\nНапиши свой возраст числом (например, 25):",
                  keyboardType: "inline",
                  collectUserInput: true,
                  enableTextInput: true,
                  inputVariable: "user_age",
                  synonyms: ["возраст", "лет", "годы", "сколько лет"],
                  inputTargetNodeId: "metro_selection",
                  buttons: [],
                  markdown: false
                }
              },
            ]
          },

          // Лист 3: Метро и местоположение
          {
            id: "metro_sheet",
            name: "🚇 Метро и местоположение",
            nodes: [
              {
                id: "metro_selection",
                type: "message",
                position: { x: 400, y: 300 },
                data: {
                  messageText: "На какой станции метро ты обычно бываешь? 🚇\n\nВыбери свою ветку:",
                  keyboardType: "inline",
                  collectUserInput: true,
                  inputVariable: "metro_stations",
                  synonyms: ["метро", "станция", "где живу", "район"],
                  buttons: [
                    {
                      id: "btn-red",
                      text: "Красная ветка 🟥",
                      action: "goto",
                      target: "red_line_stations",
                      buttonType: "option",
                      skipDataCollection: true
                    },
                    {
                      id: "btn-blue",
                      text: "Синяя ветка 🟦",
                      action: "goto", 
                      target: "blue_line_stations",
                      buttonType: "option",
                      skipDataCollection: true
                    },
                    {
                      id: "btn-green",
                      text: "Зелёная ветка 🟩",
                      action: "goto",
                      target: "green_line_stations",
                      buttonType: "option",
                      skipDataCollection: true
                    },
                    {
                      id: "btn-orange",
                      text: "Оранжевая ветка 🟧",
                      action: "goto",
                      target: "orange_line_stations",
                      buttonType: "option",
                      skipDataCollection: true
                    },
                    {
                      id: "btn-purple",
                      text: "Фиолетовая ветка 🟪",
                      action: "goto",
                      target: "purple_line_stations",
                      buttonType: "option",
                      skipDataCollection: true
                    },
                    {
                      id: "btn-lo",
                      text: "Я из ЛО 🏡",
                      value: "ЛО",
                      action: "goto",
                      target: "interests_categories",
                      buttonType: "option"
                    },
                    {
                      id: "btn-not-spb",
                      text: "Я не в Питере 🌍",
                      value: "Не в СПб",
                      action: "goto",
                      target: "interests_categories",
                      buttonType: "option"
                    }
                  ],
                  markdown: false,
                  oneTimeKeyboard: true,
                  resizeKeyboard: true
                }
              },
              {
                id: "red_line_stations",
                type: "message",
                position: { x: 100, y: 500 },
                data: {
                  messageText: "🟥 Кировско-Выборгская линия\n\nВыбери свою станцию:",
                  synonyms: ["красная линия", "кировско-выборгская", "красная ветка"],
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "metro_stations",
                  continueButtonTarget: "interests_categories",
                  buttons: [
                    { id: "red-devyatkino", text: "🟥 Девяткино", action: "selection", target: "devyatkino", buttonType: "option" },
                    { id: "red-grazhdansky", text: "🟥 Гражданский проспект", action: "selection", target: "grazhdansky", buttonType: "option" },
                    { id: "red-akademicheskaya", text: "🟥 Академическая", action: "selection", target: "akademicheskaya", buttonType: "option" },
                    { id: "red-politehnicheskaya", text: "🟥 Политехническая", action: "selection", target: "politehnicheskaya", buttonType: "option" },
                    { id: "red-pl-muzhestva", text: "🟥 Площадь Мужества", action: "selection", target: "pl_muzhestva", buttonType: "option" },
                    { id: "red-lesnaya", text: "🟥 Лесная", action: "selection", target: "lesnaya", buttonType: "option" },
                    { id: "red-vyborgskaya", text: "🟥 Выборгская", action: "selection", target: "vyborgskaya", buttonType: "option" },
                    { id: "red-pl-lenina", text: "🟥 Площадь Ленина", action: "selection", target: "pl_lenina", buttonType: "option" },
                    { id: "red-chernyshevskaya", text: "🟥 Чернышевская", action: "selection", target: "chernyshevskaya", buttonType: "option" },
                    { id: "red-pl-vosstaniya", text: "🟥 Площадь Восстания", action: "selection", target: "pl_vosstaniya", buttonType: "option" },
                    { id: "red-vladimirskaya", text: "🟥 Владимирская", action: "selection", target: "vladimirskaya", buttonType: "option" },
                    { id: "red-pushkinskaya", text: "🟥 Пушкинская", action: "selection", target: "pushkinskaya", buttonType: "option" },
                    { id: "red-tehinstitut1", text: "🟥 Технологический институт-1", action: "selection", target: "tehinstitut1", buttonType: "option" },
                    { id: "red-baltiyskaya", text: "🟥 Балтийская", action: "selection", target: "baltiyskaya", buttonType: "option" },
                    { id: "red-narvskaya", text: "🟥 Нарвская", action: "selection", target: "narvskaya", buttonType: "option" },
                    { id: "red-kirovsky", text: "🟥 Кировский завод", action: "selection", target: "kirovsky", buttonType: "option" },
                    { id: "red-avtovo", text: "🟥 Автово", action: "selection", target: "avtovo", buttonType: "option" },
                    { id: "red-leninsky", text: "🟥 Ленинский проспект", action: "selection", target: "leninsky", buttonType: "option" },
                    { id: "red-veteranov", text: "🟥 Проспект Ветеранов", action: "selection", target: "veteranov", buttonType: "option" },
                    { id: "btn-back-metro", text: "⬅️ Назад к веткам", action: "goto", target: "metro_selection", buttonType: "navigation" }
                  ],
                  markdown: false
                }
              },
              {
                id: "blue_line_stations",
                type: "message",
                position: { x: 700, y: 500 },
                data: {
                  messageText: "🟦 Московско-Петроградская линия\n\nВыбери свою станцию:",
                  synonyms: ["синяя линия", "московско-петроградская", "синяя ветка"],
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "metro_stations",
                  continueButtonTarget: "interests_categories",
                  buttons: [
                    { id: "blue-parnas", text: "🟦 Парнас", action: "selection", target: "parnas", buttonType: "option" },
                    { id: "blue-prosp-prosvesh", text: "🟦 Проспект Просвещения", action: "selection", target: "prosp_prosvesh", buttonType: "option" },
                    { id: "blue-ozerki", text: "🟦 Озерки", action: "selection", target: "ozerki", buttonType: "option" },
                    { id: "blue-udelnaya", text: "🟦 Удельная", action: "selection", target: "udelnaya", buttonType: "option" },
                    { id: "blue-pionerskaya", text: "🟦 Пионерская", action: "selection", target: "pionerskaya", buttonType: "option" },
                    { id: "blue-chernaya", text: "🟦 Черная речка", action: "selection", target: "chernaya", buttonType: "option" },
                    { id: "blue-petrogradskaya", text: "🟦 Петроградская", action: "selection", target: "petrogradskaya", buttonType: "option" },
                    { id: "blue-gorkovskaya", text: "🟦 Горьковская", action: "selection", target: "gorkovskaya", buttonType: "option" },
                    { id: "blue-nevsky", text: "🟦 Невский проспект", action: "selection", target: "nevsky", buttonType: "option" },
                    { id: "blue-sennaya", text: "🟦 Сенная площадь", action: "selection", target: "sennaya", buttonType: "option" },
                    { id: "blue-tehinstitut2", text: "🟦 Технологический институт-2", action: "selection", target: "tehinstitut2", buttonType: "option" },
                    { id: "blue-frunzenskaya", text: "🟦 Фрунзенская", action: "selection", target: "frunzenskaya", buttonType: "option" },
                    { id: "blue-mosk-vorota", text: "🟦 Московские ворота", action: "selection", target: "mosk_vorota", buttonType: "option" },
                    { id: "blue-elektrosila", text: "🟦 Электросила", action: "selection", target: "elektrosila", buttonType: "option" },
                    { id: "blue-park-pobedy", text: "🟦 Парк Победы", action: "selection", target: "park_pobedy", buttonType: "option" },
                    { id: "blue-moskovskaya", text: "🟦 Московская", action: "selection", target: "moskovskaya", buttonType: "option" },
                    { id: "blue-zvezdnaya", text: "🟦 Звездная", action: "selection", target: "zvezdnaya", buttonType: "option" },
                    { id: "blue-kupchino", text: "🟦 Купчино", action: "selection", target: "kupchino", buttonType: "option" },
                    { id: "btn-back-metro-blue", text: "⬅️ Назад к веткам", action: "goto", target: "metro_selection", buttonType: "navigation" }
                  ],
                  markdown: false
                }
              },
              {
                id: "green_line_stations",
                type: "message",
                position: { x: 1000, y: 500 },
                data: {
                  messageText: "🟩 Невско-Василеостровская линия\n\nВыбери свою станцию:",
                  synonyms: ["зеленая линия", "невско-василеостровская", "зеленая ветка"],
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "metro_stations",
                  continueButtonTarget: "interests_categories",
                  buttons: [
                    { id: "green-primorskaya", text: "🟩 Приморская", action: "selection", target: "primorskaya", buttonType: "option" },
                    { id: "green-vasileostr", text: "🟩 Василеостровская", action: "selection", target: "vasileostr", buttonType: "option" },
                    { id: "green-gostiny", text: "🟩 Гостиный двор", action: "selection", target: "gostiny", buttonType: "option" },
                    { id: "green-mayakovskaya", text: "🟩 Маяковская", action: "selection", target: "mayakovskaya", buttonType: "option" },
                    { id: "green-pl-nevsk", text: "🟩 Площадь Александра Невского-1", action: "selection", target: "pl_nevsk", buttonType: "option" },
                    { id: "green-elizarovskaya", text: "🟩 Елизаровская", action: "selection", target: "elizarovskaya", buttonType: "option" },
                    { id: "green-lomonosovskaya", text: "🟩 Ломоносовская", action: "selection", target: "lomonosovskaya", buttonType: "option" },
                    { id: "green-proletarskaya", text: "🟩 Пролетарская", action: "selection", target: "proletarskaya", buttonType: "option" },
                    { id: "green-obuhovo", text: "🟩 Обухово", action: "selection", target: "obuhovo", buttonType: "option" },
                    { id: "green-rybackoe", text: "🟩 Рыбацкое", action: "selection", target: "rybackoe", buttonType: "option" },
                    { id: "green-novokrestovsk", text: "🟩 Новокрестовская", action: "selection", target: "novokrestovsk", buttonType: "option" },
                    { id: "green-begovaya", text: "🟩 Беговая", action: "selection", target: "begovaya", buttonType: "option" },
                    { id: "btn-back-metro-green", text: "⬅️ Назад к веткам", action: "goto", target: "metro_selection", buttonType: "navigation" }
                  ],
                  markdown: false
                }
              },
              {
                id: "orange_line_stations",
                type: "message",
                position: { x: 1300, y: 500 },
                data: {
                  messageText: "🟧 Правобережная линия\n\nВыбери свою станцию:",
                  synonyms: ["оранжевая линия", "правобережная", "оранжевая ветка"],
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "metro_stations",
                  continueButtonTarget: "interests_categories",
                  buttons: [
                    { id: "orange-spasskaya", text: "🟧 Спасская", action: "selection", target: "spasskaya", buttonType: "option" },
                    { id: "orange-dostoevskaya", text: "🟧 Достоевская", action: "selection", target: "dostoevskaya", buttonType: "option" },
                    { id: "orange-ligovsky", text: "🟧 Лиговский проспект", action: "selection", target: "ligovsky", buttonType: "option" },
                    { id: "orange-pl-nevsk2", text: "🟧 Площадь Александра Невского-2", action: "selection", target: "pl_nevsk2", buttonType: "option" },
                    { id: "orange-novocherk", text: "🟧 Новочеркасская", action: "selection", target: "novocherk", buttonType: "option" },
                    { id: "orange-ladozhskaya", text: "🟧 Ладожская", action: "selection", target: "ladozhskaya", buttonType: "option" },
                    { id: "orange-bolshevikov", text: "🟧 Проспект Большевиков", action: "selection", target: "bolshevikov", buttonType: "option" },
                    { id: "orange-dybenko", text: "🟧 Дыбенко", action: "selection", target: "dybenko", buttonType: "option" },
                    { id: "orange-gorny", text: "🟧 Горный институт", action: "selection", target: "gorny", buttonType: "option" },
                    { id: "btn-back-metro-orange", text: "⬅️ Назад к веткам", action: "goto", target: "metro_selection", buttonType: "navigation" }
                  ],
                  markdown: false
                }
              },
              {
                id: "purple_line_stations",
                type: "message",
                position: { x: 1600, y: 500 },
                data: {
                  messageText: "🟪 Фрунзенско-Приморская линия\n\nВыбери свою станцию:",
                  synonyms: ["фиолетовая линия", "фрунзенско-приморская", "фиолетовая ветка"],
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "metro_stations",
                  continueButtonTarget: "interests_categories",
                  buttons: [
                    { id: "purple-komendantsky", text: "🟪 Комендантский проспект", action: "selection", target: "komendantsky", buttonType: "option" },
                    { id: "purple-staraya", text: "🟪 Старая Деревня", action: "selection", target: "staraya", buttonType: "option" },
                    { id: "purple-krestovsky", text: "🟪 Крестовский остров", action: "selection", target: "krestovsky", buttonType: "option" },
                    { id: "purple-chkalovskaya", text: "🟪 Чкаловская", action: "selection", target: "chkalovskaya", buttonType: "option" },
                    { id: "purple-sportivnaya", text: "🟪 Спортивная", action: "selection", target: "sportivnaya", buttonType: "option" },
                    { id: "purple-admiralteyskaya", text: "🟪 Адмиралтейская", action: "selection", target: "admiralteyskaya", buttonType: "option" },
                    { id: "purple-sadovaya", text: "🟪 Садовая", action: "selection", target: "sadovaya", buttonType: "option" },
                    { id: "purple-zvenigorodskaya", text: "🟪 Звенигородская", action: "selection", target: "zvenigorodskaya", buttonType: "option" },
                    { id: "purple-obvodniy", text: "🟪 Обводный канал", action: "selection", target: "obvodniy", buttonType: "option" },
                    { id: "purple-volkovskaya", text: "🟪 Волковская", action: "selection", target: "volkovskaya", buttonType: "option" },
                    { id: "purple-buharestskaya", text: "🟪 Бухарестская", action: "selection", target: "buharestskaya", buttonType: "option" },
                    { id: "purple-mezhdunar", text: "🟪 Международная", action: "selection", target: "mezhdunar", buttonType: "option" },
                    { id: "btn-back-metro-purple", text: "⬅️ Назад к веткам", action: "goto", target: "metro_selection", buttonType: "navigation" }
                  ],
                  markdown: false
                }
              },
            ]
          },

          // Лист 4: Интересы и хобби
          {
            id: "interests_sheet",
            name: "🎯 Интересы",
            nodes: [
              {
                id: "interests_categories",
                type: "message",
                position: { x: 400, y: 300 },
                data: {
                  messageText: "Выбери категории интересов: 🎯\n\n(Можешь выбрать несколько)",
                  synonyms: ["интересы", "хобби", "увлечения", "что нравится"],
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "interests_categories",
                  continueButtonTarget: "marital_status",
                  buttons: [
                    {
                      id: "btn-music",
                      text: "🎵 Музыка",
                      action: "goto",
                      target: "music_interests",
                      buttonType: "normal",
                      skipDataCollection: true
                    },
                    {
                      id: "btn-hobby",
                      text: "🎨 Хобби",
                      action: "goto",
                      target: "hobby_interests",
                      buttonType: "normal",
                      skipDataCollection: true
                    },
                    {
                      id: "btn-social",
                      text: "👥 Общение",
                      action: "goto",
                      target: "social_interests",
                      buttonType: "normal",
                      skipDataCollection: true
                    },
                    {
                      id: "btn-creativity",
                      text: "🎭 Творчество",
                      action: "goto",
                      target: "creativity_interests",
                      buttonType: "normal",
                      skipDataCollection: true
                    },
                    {
                      id: "btn-active",
                      text: "⚽ Активности",
                      action: "goto",
                      target: "active_interests",
                      buttonType: "normal",
                      skipDataCollection: true
                    },
                    {
                      id: "btn-food",
                      text: "🍔 Еда",
                      action: "goto",
                      target: "food_interests",
                      buttonType: "normal",
                      skipDataCollection: true
                    },
                    {
                      id: "btn-sport",
                      text: "🏋️ Спорт",
                      action: "goto",
                      target: "sport_interests",
                      buttonType: "normal",
                      skipDataCollection: true
                    }
                  ],
                  markdown: false,
                  oneTimeKeyboard: true,
                  resizeKeyboard: true
                }
              },
              {
                id: "music_interests",
                type: "message",
                position: { x: 100, y: 500 },
                data: {
                  messageText: "🎵 Какая музыка тебе нравится?\n\n(Можешь выбрать несколько)",
                  synonyms: ["музыка", "песни", "треки", "жанры"],
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "user_interests",
                  continueButtonTarget: "marital_status",
                  buttons: [
                    { id: "music-pop", text: "🎤 Поп", action: "selection", target: "pop", buttonType: "option" },
                    { id: "music-rock", text: "🎸 Рок", action: "selection", target: "rock", buttonType: "option" },
                    { id: "music-electronic", text: "🎧 Электро", action: "selection", target: "electronic", buttonType: "option" },
                    { id: "music-jazz", text: "🎺 Джаз", action: "selection", target: "jazz", buttonType: "option" },
                    { id: "music-classical", text: "🎼 Классика", action: "selection", target: "classical", buttonType: "option" },
                    { id: "music-hiphop", text: "🎤 Хип-хоп", action: "selection", target: "hiphop", buttonType: "option" },
                    { id: "music-indie", text: "🎸 Инди", action: "selection", target: "indie", buttonType: "option" },
                    { id: "music-rnb", text: "🎵 R&B", action: "selection", target: "rnb", buttonType: "option" },
                    { id: "btn-back-categories-music", text: "⬅️ Назад к категориям", action: "goto", target: "interests_categories", buttonType: "navigation" }
                  ],
                  markdown: false
                }
              },
              {
                id: "hobby_interests",
                type: "message",
                position: { x: 700, y: 500 },
                data: {
                  messageText: "🎨 Какие у тебя хобби?\n\n(Можешь выбрать несколько)",
                  synonyms: ["хобби", "увлечения", "занятия", "досуг"],
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "user_interests",
                  continueButtonTarget: "marital_status",
                  buttons: [
                    { id: "hobby-reading", text: "📚 Чтение", action: "selection", target: "reading", buttonType: "option" },
                    { id: "hobby-gaming", text: "🎮 Игры", action: "selection", target: "gaming", buttonType: "option" },
                    { id: "hobby-cooking", text: "👨‍🍳 Готовка", action: "selection", target: "cooking", buttonType: "option" },
                    { id: "hobby-gardening", text: "🌱 Садоводство", action: "selection", target: "gardening", buttonType: "option" },
                    { id: "hobby-collecting", text: "🏺 Коллекции", action: "selection", target: "collecting", buttonType: "option" },
                    { id: "hobby-diy", text: "🔨 DIY", action: "selection", target: "diy", buttonType: "option" },
                    { id: "hobby-pets", text: "🐕 Животные", action: "selection", target: "pets", buttonType: "option" },
                    { id: "hobby-tech", text: "💻 Технологии", action: "selection", target: "tech", buttonType: "option" },
                    { id: "btn-back-categories-hobby", text: "⬅️ Назад к категориям", action: "goto", target: "interests_categories", buttonType: "navigation" }
                  ],
                  markdown: false
                }
              },
              {
                id: "social_interests",
                type: "message",
                position: { x: 100, y: 500 },
                data: {
                  messageText: "Выбери интересы в категории 👥 Общение:",
                  synonyms: ["общение", "социальное", "люди", "тусовки"],
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "user_interests",
                  continueButtonTarget: "marital_status",
                  buttons: [
                    { id: "social-parties", text: "🎉 Вечеринки", action: "selection", target: "parties", buttonType: "option" },
                    { id: "social-networking", text: "🤝 Нетворкинг", action: "selection", target: "networking", buttonType: "option" },
                    { id: "social-dating", text: "💕 Знакомства", action: "selection", target: "dating", buttonType: "option" },
                    { id: "social-volunteering", text: "🤲 Волонтёрство", action: "selection", target: "volunteering", buttonType: "option" },
                    { id: "social-events", text: "🎪 Мероприятия", action: "selection", target: "events", buttonType: "option" },
                    { id: "social-community", text: "👥 Сообщества", action: "selection", target: "community", buttonType: "option" },
                    { id: "btn-back-categories-social", text: "⬅️ К категориям", action: "goto", target: "interests_categories", buttonType: "navigation" }
                  ],
                  markdown: false
                }
              },
              {
                id: "creativity_interests",
                type: "message",
                position: { x: 700, y: 700 },
                data: {
                  messageText: "Выбери интересы в категории 🎭 Творчество:",
                  synonyms: ["творчество", "искусство", "рисование", "музыка"],
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "user_interests",
                  continueButtonTarget: "marital_status",
                  buttons: [
                    { id: "creativity-art", text: "🎨 Рисование", action: "selection", target: "art", buttonType: "option" },
                    { id: "creativity-music", text: "🎵 Музыка", action: "selection", target: "music", buttonType: "option" },
                    { id: "creativity-photography", text: "📸 Фотография", action: "selection", target: "photography", buttonType: "option" },
                    { id: "creativity-writing", text: "✍️ Писательство", action: "selection", target: "writing", buttonType: "option" },
                    { id: "creativity-design", text: "🖌️ Дизайн", action: "selection", target: "design", buttonType: "option" },
                    { id: "creativity-handmade", text: "🧶 Рукоделие", action: "selection", target: "handmade", buttonType: "option" },
                    { id: "creativity-theater", text: "🎭 Театр", action: "selection", target: "theater", buttonType: "option" },
                    { id: "btn-back-categories-creativity", text: "⬅️ К категориям", action: "goto", target: "interests_categories", buttonType: "navigation" }
                  ],
                  markdown: false
                }
              },
              {
                id: "active_interests",
                type: "message",
                position: { x: 1000, y: 700 },
                data: {
                  messageText: "Выбери интересы в категории ⚽ Активности:",
                  synonyms: ["активность", "активный", "движение", "здоровье"],
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "user_interests",
                  continueButtonTarget: "marital_status",
                  buttons: [
                    { id: "active-running", text: "🏃 Бег", action: "selection", target: "running", buttonType: "option" },
                    { id: "active-gym", text: "💪 Тренажёрный зал", action: "selection", target: "gym", buttonType: "option" },
                    { id: "active-cycling", text: "🚴 Велосипед", action: "selection", target: "cycling", buttonType: "option" },
                    { id: "active-hiking", text: "🥾 Походы", action: "selection", target: "hiking", buttonType: "option" },
                    { id: "active-yoga", text: "🧘 Йога", action: "selection", target: "yoga", buttonType: "option" },
                    { id: "active-swimming", text: "🏊 Плавание", action: "selection", target: "swimming", buttonType: "option" },
                    { id: "active-dancing", text: "💃 Танцы", action: "selection", target: "dancing", buttonType: "option" },
                    { id: "btn-back-categories-active", text: "⬅️ К категориям", action: "goto", target: "interests_categories", buttonType: "navigation" }
                  ],
                  markdown: false
                }
              },
              {
                id: "food_interests",
                type: "message",
                position: { x: 1300, y: 700 },
                data: {
                  messageText: "Выбери интересы в категории 🍔 Еда:",
                  synonyms: ["еда", "напитки", "кухня", "рестораны"],
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "user_interests",
                  continueButtonTarget: "marital_status",
                  buttons: [
                    { id: "food-cooking", text: "👨‍🍳 Готовка", action: "selection", target: "cooking", buttonType: "option" },
                    { id: "food-restaurants", text: "🍽️ Рестораны", action: "selection", target: "restaurants", buttonType: "option" },
                    { id: "food-wine", text: "🍷 Вино", action: "selection", target: "wine", buttonType: "option" },
                    { id: "food-coffee", text: "☕ Кофе", action: "selection", target: "coffee", buttonType: "option" },
                    { id: "food-baking", text: "🧁 Выпечка", action: "selection", target: "baking", buttonType: "option" },
                    { id: "food-street", text: "🌮 Стрит-фуд", action: "selection", target: "street_food", buttonType: "option" },
                    { id: "food-healthy", text: "🥗 Здоровое питание", action: "selection", target: "healthy_food", buttonType: "option" },
                    { id: "btn-back-categories-food", text: "⬅️ К категориям", action: "goto", target: "interests_categories", buttonType: "navigation" }
                  ],
                  markdown: false
                }
              },
              {
                id: "sport_interests",
                type: "message",
                position: { x: 1600, y: 700 },
                data: {
                  messageText: "Выбери интересы в категории 🏋️ Спорт:",
                  synonyms: ["спорт", "фитнес", "тренировки", "футбол"],
                  keyboardType: "inline",
                  allowMultipleSelection: true,
                  multiSelectVariable: "user_interests",
                  continueButtonTarget: "marital_status",
                  buttons: [
                    { id: "sport-football", text: "⚽ Футбол", action: "selection", target: "football", buttonType: "option" },
                    { id: "sport-basketball", text: "🏀 Баскетбол", action: "selection", target: "basketball", buttonType: "option" },
                    { id: "sport-tennis", text: "🎾 Теннис", action: "selection", target: "tennis", buttonType: "option" },
                    { id: "sport-hockey", text: "🏒 Хоккей", action: "selection", target: "hockey", buttonType: "option" },
                    { id: "sport-volleyball", text: "🏐 Волейбол", action: "selection", target: "volleyball", buttonType: "option" },
                    { id: "sport-mma", text: "🥊 Единоборства", action: "selection", target: "mma", buttonType: "option" },
                    { id: "sport-esports", text: "🎮 Киберспорт", action: "selection", target: "esports", buttonType: "option" },
                    { id: "btn-back-categories-sport", text: "⬅️ К категориям", action: "goto", target: "interests_categories", buttonType: "navigation" }
                  ],
                  markdown: false
                }
              },
            ]
          },

          // Лист 5: Личная информация
          {
            id: "personal_sheet",
            name: "💝 Личная информация",
            nodes: [
              {
                id: "marital_status",
                type: "message",
                position: { x: 400, y: 300 },
                data: {
                  messageText: "Твое семейное положение: 💍",
                  keyboardType: "inline",
                  collectUserInput: true,
                  inputVariable: "marital_status",
                  synonyms: ["семейное положение", "отношения", "статус"],
                  buttons: [
                    {
                      id: "btn-single",
                      text: "Холост/Не замужем 💚",
                      value: "single",
                      action: "goto",
                      target: "sexual_orientation",
                      buttonType: "option"
                    },
                    {
                      id: "btn-relationship",
                      text: "В отношениях 💙",
                      value: "relationship",
                      action: "goto",
                      target: "sexual_orientation",
                      buttonType: "option"
                    },
                    {
                      id: "btn-married",
                      text: "Женат/Замужем 💛",
                      value: "married",
                      action: "goto",
                      target: "sexual_orientation",
                      buttonType: "option"
                    },
                    {
                      id: "btn-complicated",
                      text: "Всё сложно 🤷",
                      value: "complicated",
                      action: "goto",
                      target: "sexual_orientation",
                      buttonType: "option"
                    }
                  ],
                  markdown: false,
                  oneTimeKeyboard: true,
                  resizeKeyboard: true
                }
              },
              {
                id: "sexual_orientation",
                type: "message",
                position: { x: 400, y: 500 },
                data: {
                  messageText: "Твоя ориентация: 🌈",
                  keyboardType: "inline",
                  collectUserInput: true,
                  inputVariable: "sexual_orientation",
                  synonyms: ["ориентация", "предпочтения", "интерес"],
                  buttons: [
                    {
                      id: "btn-hetero",
                      text: "Гетеро 👫",
                      value: "heterosexual",
                      action: "goto",
                      target: "channel_choice",
                      buttonType: "option"
                    },
                    {
                      id: "btn-gay",
                      text: "Гей 👬",
                      value: "gay",
                      action: "goto",
                      target: "channel_choice",
                      buttonType: "option"
                    },
                    {
                      id: "btn-lesbian",
                      text: "Лесбиянка 👭",
                      value: "lesbian",
                      action: "goto",
                      target: "channel_choice",
                      buttonType: "option"
                    },
                    {
                      id: "btn-bi",
                      text: "Би 🌈",
                      value: "bisexual",
                      action: "goto",
                      target: "channel_choice",
                      buttonType: "option"
                    },
                    {
                      id: "btn-other",
                      text: "Другое 🎭",
                      value: "other",
                      action: "goto",
                      target: "channel_choice",
                      buttonType: "option"
                    }
                  ],
                  markdown: false,
                  oneTimeKeyboard: true,
                  resizeKeyboard: true
                }
              },
              {
                id: "channel_choice",
                type: "message",
                position: { x: 400, y: 700 },
                data: {
                  messageText: "Хочешь указать свой телеграм-канал? 📢\n\nВведи ссылку, ник с @ или просто имя канала, либо нажми 'Пропустить':",
                  keyboardType: "inline",
                  collectUserInput: true,
                  enableTextInput: true,
                  inputVariable: "telegram_channel",
                  synonyms: ["канал", "тг", "телеграм", "ссылка"],
                  inputTargetNodeId: "extra_info",
                  buttons: [
                    {
                      id: "btn-skip-channel",
                      text: "Пропустить ⏭️",
                      action: "goto",
                      target: "extra_info",
                      buttonType: "normal",
                      skipDataCollection: true
                    }
                  ],
                  markdown: false,
                  oneTimeKeyboard: true,
                  resizeKeyboard: true
                }
              },
              {
                id: "extra_info",
                type: "message",
                position: { x: 400, y: 900 },
                data: {
                  messageText: "Хочешь добавить что-то ещё о себе? 📝\n\nРасскажи о себе (до 2000 символов) или нажми 'Пропустить':",
                  keyboardType: "inline",
                  collectUserInput: true,
                  enableTextInput: true,
                  inputVariable: "extra_info",
                  synonyms: ["о себе", "дополнительно", "больше", "еще"],
                  inputTargetNodeId: "profile_complete",
                  buttons: [
                    {
                      id: "btn-skip-extra",
                      text: "Пропустить ⏭️",
                      action: "goto",
                      target: "profile_complete",
                      buttonType: "normal",
                      skipDataCollection: true
                    }
                  ],
                  markdown: false,
                  oneTimeKeyboard: true,
                  resizeKeyboard: true
                }
              },
            ]
          },

          // Лист 6: Профиль и команды
          {
            id: "profile_sheet",
            name: "👤 Профиль",
            nodes: [
              {
                id: "profile_complete",
                type: "message",
                position: { x: 400, y: 300 },
                data: {
                  messageText: "🎉 Отлично! Твой профиль заполнен!\n\n👤 Твоя анкета:\nПол: {gender}\nИмя: {user_name}\nВозраст: {user_age}\nМетро: {metro_stations}\nИнтересы: {user_interests}\nСемейное положение: {marital_status}\nОриентация: {sexual_orientation}\n\n💬 Источник: {user_source}\n\nМожешь посмотреть полную анкету или сразу получить ссылку на чат!",
                  synonyms: [],
                  keyboardType: "inline",
                  removeKeyboard: false,
                  enableConditionalMessages: true,
                  conditionalMessages: [
                    {
                      id: "with_both",
                      condition: "user_data_exists",
                      variableNames: ["telegram_channel", "extra_info"],
                      messageText: "🎉 Отлично! Твой профиль заполнен!\n\n👤 Твоя анкета:\nПол: {gender}\nИмя: {user_name}\nВозраст: {user_age}\nМетро: {metro_stations}\nИнтересы: {user_interests}\nСемейное положение: {marital_status}\nОриентация: {sexual_orientation}\nТелеграм: {telegram_channel} 📢\nО себе: {extra_info} 📝\n\n💬 Источник: {user_source}\n\nМожешь посмотреть полную анкету или сразу получить ссылку на чат!",
                      formatMode: "text",
                      keyboardType: "inline",
                      buttons: [
                        {
                          id: "btn-chat-link",
                          text: "Ссылка на чат 🔗",
                          action: "command",
                          target: "/link",
                          buttonType: "normal"
                        },
                        {
                          id: "btn-show-profile-edit",
                          text: "Редактировать профиль ✏️",
                          action: "command",
                          target: "/profile",
                          buttonType: "normal"
                        }
                      ],
                      priority: 1
                    },
                    {
                      id: "with_telegram_only",
                      condition: "user_data_exists",
                      variableNames: ["telegram_channel"],
                      messageText: "🎉 Отлично! Твой профиль заполнен!\n\n👤 Твоя анкета:\nПол: {gender}\nИмя: {user_name}\nВозраст: {user_age}\nМетро: {metro_stations}\nИнтересы: {user_interests}\nСемейное положение: {marital_status}\nОриентация: {sexual_orientation}\nТелеграм: {telegram_channel} 📢\n\n💬 Источник: {user_source}\n\nМожешь посмотреть полную анкету или сразу получить ссылку на чат!",
                      formatMode: "text",
                      keyboardType: "inline",
                      buttons: [
                        {
                          id: "btn-chat-link",
                          text: "Ссылка на чат 🔗",
                          action: "command",
                          target: "/link",
                          buttonType: "normal"
                        },
                        {
                          id: "btn-show-profile-edit",
                          text: "Редактировать профиль ✏️",
                          action: "command",
                          target: "/profile",
                          buttonType: "normal"
                        }
                      ],
                      priority: 2
                    },
                    {
                      id: "with_extra_only",
                      condition: "user_data_exists",
                      variableNames: ["extra_info"],
                      messageText: "🎉 Отлично! Твой профиль заполнен!\n\n👤 Твоя анкета:\nПол: {gender}\nИмя: {user_name}\nВозраст: {user_age}\nМетро: {metro_stations}\nИнтересы: {user_interests}\nСемейное положение: {marital_status}\nОриентация: {sexual_orientation}\nО себе: {extra_info} 📝\n\n💬 Источник: {user_source}\n\nМожешь посмотреть полную анкету или сразу получить ссылку на чат!",
                      formatMode: "text",
                      keyboardType: "inline",
                      buttons: [
                        {
                          id: "btn-chat-link",
                          text: "Ссылка на чат 🔗",
                          action: "command",
                          target: "/link",
                          buttonType: "normal"
                        },
                        {
                          id: "btn-show-profile-edit",
                          text: "Редактировать профиль ✏️",
                          action: "command",
                          target: "/profile",
                          buttonType: "normal"
                        }
                      ],
                      priority: 3
                    }
                  ],
                  buttons: [
                    {
                      id: "btn-chat-link",
                      text: "Ссылка на чат 🔗",
                      action: "command",
                      target: "/link",
                      buttonType: "normal"
                    },
                    {
                      id: "btn-show-profile-edit",
                      text: "Редактировать профиль ✏️",
                      action: "command",
                      target: "/profile",
                      buttonType: "normal"
                    }
                  ],
                  markdown: false,
                  oneTimeKeyboard: true,
                  resizeKeyboard: true
                }
              },
              {
                id: "show_profile",
                type: "command",
                position: { x: 400, y: 500 },
                data: {
                  command: "/profile",
                  commandName: "/profile",
                  description: "Показать и редактировать профиль пользователя",
                  synonyms: ["профиль", "анкета", "мои данные", "редактировать"],
                  messageText: "👤 Твой профиль:\n\nПол: {gender} 👤\nИмя: {user_name} ✏️\nВозраст: {user_age} 🎂\nМетро: {metro_stations} 🚇\nИнтересы: {user_interests} 🎯\nСемейное положение: {marital_status} 💍\nОриентация: {sexual_orientation} 🌈\n\n💬 Источник: {user_source}\n\n✏️ Выберите действие:",
                  keyboardType: "inline",
                  enableConditionalMessages: true,
                  conditionalMessages: [
                    {
                      id: "with_both_show",
                      condition: "user_data_exists",
                      variableNames: ["telegram_channel", "extra_info"],
                      messageText: "👤 Твой профиль:\n\nПол: {gender} 👤\nИмя: {user_name} ✏️\nВозраст: {user_age} 🎂\nМетро: {metro_stations} 🚇\nИнтересы: {user_interests} 🎯\nСемейное положение: {marital_status} 💍\nОриентация: {sexual_orientation} 🌈\nТелеграм: {telegram_channel} 📢\nО себе: {extra_info} 📝\n\n💬 Источник: {user_source}\n\n✏️ Выберите действие:",
                      formatMode: "text",
                      keyboardType: "inline",
                      priority: 1
                    },
                    {
                      id: "with_telegram_only_show",
                      condition: "user_data_exists",
                      variableNames: ["telegram_channel"],
                      messageText: "👤 Твой профиль:\n\nПол: {gender} 👤\nИмя: {user_name} ✏️\nВозраст: {user_age} 🎂\nМетро: {metro_stations} 🚇\nИнтересы: {user_interests} 🎯\nСемейное положение: {marital_status} 💍\nОриентация: {sexual_orientation} 🌈\nТелеграм: {telegram_channel} 📢\n\n💬 Источник: {user_source}\n\n✏️ Выберите действие:",
                      formatMode: "text",
                      keyboardType: "inline",
                      priority: 2
                    },
                    {
                      id: "with_extra_only_show",
                      condition: "user_data_exists",
                      variableNames: ["extra_info"],
                      messageText: "👤 Твой профиль:\n\nПол: {gender} 👤\nИмя: {user_name} ✏️\nВозраст: {user_age} 🎂\nМетро: {metro_stations} 🚇\nИнтересы: {user_interests} 🎯\nСемейное положение: {marital_status} 💍\nОриентация: {sexual_orientation} 🌈\nО себе: {extra_info} 📝\n\n💬 Источник: {user_source}\n\n✏️ Выберите действие:",
                      formatMode: "text",
                      keyboardType: "inline",
                      priority: 3
                    }
                  ],
                  buttons: [
                    {
                      id: "btn-edit-gender",
                      text: "👤 Изменить пол",
                      action: "goto",
                      target: "gender_selection",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-name",
                      text: "✏️ Изменить имя",
                      action: "goto",
                      target: "name_input",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-age",
                      text: "🎂 Изменить возраст",
                      action: "goto",
                      target: "age_input",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-metro",
                      text: "🚇 Изменить метро",
                      action: "goto",
                      target: "metro_selection",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-interests",
                      text: "🎯 Изменить интересы",
                      action: "goto",
                      target: "interests_categories",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-marital",
                      text: "💍 Изменить семейное положение",
                      action: "goto",
                      target: "marital_status",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-orientation",
                      text: "🌈 Изменить ориентацию",
                      action: "goto",
                      target: "sexual_orientation",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-channel",
                      text: "📢 Указать ТГК",
                      action: "goto",
                      target: "channel_choice",
                      buttonType: "option"
                    },
                    {
                      id: "btn-edit-extra",
                      text: "📝 Добавить о себе",
                      action: "goto",
                      target: "extra_info",
                      buttonType: "option"
                    },
                    {
                      id: "btn-restart-from-profile",
                      text: "🔄 Начать заново",
                      action: "command",
                      target: "/start",
                      buttonType: "navigation"
                    }
                  ],
                  markdown: false
                }
              },
              {
                id: "chat_link",
                type: "command",
                position: { x: 400, y: 700 },
                data: {
                  command: "/link",
                  commandName: "/link",
                  description: "Получить ссылку на чат сообщества",
                  synonyms: ["ссылка", "чат", "сообщество", "впрогулке", "линк"],
                  messageText: "🔗 Актуальная ссылка на чат:\n\nhttps://t.me/+agkIVgCzHtY2ZTA6\n\nДобро пожаловать в сообщество ᴠᴨᴩᴏᴦʏᴧᴋᴇ! 🎉",
                  keyboardType: "none",
                  buttons: [],
                  markdown: false
                }
              },
              {
                id: "help_command",
                type: "command",
                position: { x: 400, y: 900 },
                data: {
                  command: "/help",
                  commandName: "/help", 
                  description: "Помощь и список всех команд с синонимами",
                  synonyms: ["помощь", "справка", "команды", "что писать", "как пользоваться"],
                  messageText: "🤖 **Добро пожаловать в справочный центр!**\n\n╔══════════════════════════════════╗\n║          🌟 ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot         ║\n╚══════════════════════════════════╝\n\n📋 **Доступные команды:**\n\n🎯 **/start** - *Начать знакомство*\n   └ Синонимы: старт, начать, привет, начало, начинаем\n\n👤 **/profile** - *Показать и изменить профиль*\n   └ Синонимы: профиль, анкета, мои данные, редактировать\n\n🔗 **/link** - *Получить ссылку на чат*\n   └ Синонимы: ссылка, чат, сообщество, впрогулке, линк\n\n❓ **/help** - *Справка и команды*\n   └ Синонимы: помощь, справка, команды, что писать, как пользоваться\n\n═══════════════════════════════════\n\n💡 **Как пользоваться:**\n• Просто напиши любое слово из синонимов\n• Или используй команды с символом /\n• Бот понимает естественную речь!\n\n🎉 **Удачного общения в сообществе!**",
                  keyboardType: "none",
                  buttons: [],
                  markdown: true
                }
              }
            ]
          }
        ],

        // Связи между листами
        interSheetConnections: [
          // Из приветствия к основной информации
          {
            id: "inter-welcome-basic",
            sourceSheetId: "welcome_sheet",
            targetSheetId: "basic_info_sheet",
            sourceNodeId: "join_request",
            targetNodeId: "gender_selection",
            sourceHandle: "btn-yes",
            targetHandle: "target"
          },
          // Из основной информации к метро
          {
            id: "inter-basic-metro",
            sourceSheetId: "basic_info_sheet",
            targetSheetId: "metro_sheet",
            sourceNodeId: "age_input",
            targetNodeId: "metro_selection",
            sourceHandle: "source",
            targetHandle: "target"
          },
          // Из метро к интересам
          {
            id: "inter-metro-interests",
            sourceSheetId: "metro_sheet",
            targetSheetId: "interests_sheet",
            sourceNodeId: "metro_selection",
            targetNodeId: "interests_categories",
            sourceHandle: "source",
            targetHandle: "target"
          },
          // Из интересов к личной информации
          {
            id: "inter-interests-personal",
            sourceSheetId: "interests_sheet",
            targetSheetId: "personal_sheet",
            sourceNodeId: "interests_categories",
            targetNodeId: "marital_status",
            sourceHandle: "source",
            targetHandle: "target"
          },
          // Из личной информации к профилю
          {
            id: "inter-personal-profile",
            sourceSheetId: "personal_sheet",
            targetSheetId: "profile_sheet",
            sourceNodeId: "extra_info",
            targetNodeId: "profile_complete",
            sourceHandle: "source",
            targetHandle: "target"
          },
          // Редактирование профиля - возврат к соответствующим листам
          {
            id: "inter-profile-basic-gender",
            sourceSheetId: "profile_sheet",
            targetSheetId: "basic_info_sheet",
            sourceNodeId: "show_profile",
            targetNodeId: "gender_selection",
            sourceHandle: "btn-edit-gender",
            targetHandle: "target"
          },
          {
            id: "inter-profile-basic-name",
            sourceSheetId: "profile_sheet",
            targetSheetId: "basic_info_sheet",
            sourceNodeId: "show_profile",
            targetNodeId: "name_input",
            sourceHandle: "btn-edit-name",
            targetHandle: "target"
          },
          {
            id: "inter-profile-basic-age",
            sourceSheetId: "profile_sheet",
            targetSheetId: "basic_info_sheet",
            sourceNodeId: "show_profile",
            targetNodeId: "age_input",
            sourceHandle: "btn-edit-age",
            targetHandle: "target"
          },
          {
            id: "inter-profile-metro",
            sourceSheetId: "profile_sheet",
            targetSheetId: "metro_sheet",
            sourceNodeId: "show_profile",
            targetNodeId: "metro_selection",
            sourceHandle: "btn-edit-metro",
            targetHandle: "target"
          },
          {
            id: "inter-profile-interests",
            sourceSheetId: "profile_sheet",
            targetSheetId: "interests_sheet",
            sourceNodeId: "show_profile",
            targetNodeId: "interests_categories",
            sourceHandle: "btn-edit-interests",
            targetHandle: "target"
          },
          {
            id: "inter-profile-personal-marital",
            sourceSheetId: "profile_sheet",
            targetSheetId: "personal_sheet",
            sourceNodeId: "show_profile",
            targetNodeId: "marital_status",
            sourceHandle: "btn-edit-marital",
            targetHandle: "target"
          },
          {
            id: "inter-profile-personal-orientation",
            sourceSheetId: "profile_sheet",
            targetSheetId: "personal_sheet",
            sourceNodeId: "show_profile",
            targetNodeId: "sexual_orientation",
            sourceHandle: "btn-edit-orientation",
            targetHandle: "target"
          },
          {
            id: "inter-profile-personal-channel",
            sourceSheetId: "profile_sheet",
            targetSheetId: "personal_sheet",
            sourceNodeId: "show_profile",
            targetNodeId: "channel_choice",
            sourceHandle: "btn-edit-channel",
            targetHandle: "target"
          },
          {
            id: "inter-profile-personal-extra",
            sourceSheetId: "profile_sheet",
            targetSheetId: "personal_sheet",
            sourceNodeId: "show_profile",
            targetNodeId: "extra_info",
            sourceHandle: "btn-edit-extra",
            targetHandle: "target"
          }
        ]
      }
    });

    console.log('✅ Многолистовой шаблон ВПрогулке создан');

    // Создаем шаблон с элементами управления контентом и пользователями
    await storage.createBotTemplate({
      name: "👮‍♂️ Админ-панель модератора",
      description: "Полный набор инструментов для модерации группы: управление сообщениями, пользователями и контентом",
      category: "utility",
      tags: ["модерация", "админ", "управление", "группа", "контент", "пользователи", "администрирование"],
      isPublic: 1,
      difficulty: "medium",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 6,
      estimatedTime: 20,
      data: {
        sheets: [
          {
            id: "main_sheet",
            name: "🏠 Главное меню",
            description: "Основное меню навигации по функциям модерации",
            nodes: [
              {
                id: "start",
                type: "start",
                position: { x: 400, y: 200 },
                data: {
                  command: "/start",
                  description: "Начать работу с админ-панелью",
                  messageText: "👮‍♂️ Добро пожаловать в админ-панель модератора!\n\nЭтот бот поможет вам управлять группой с помощью команд.\n\nВыберите действие:",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-help",
                      text: "❓ Справка по командам",
                      action: "goto",
                      target: "help_commands",
                      buttonType: "navigation"
                    }
                  ],
                  markdown: false,
                  oneTimeKeyboard: true,
                  resizeKeyboard: true
                }
              },
              {
                id: "help_commands",
                type: "command",
                position: { x: 400, y: 500 },
                data: {
                  command: "/help",
                  description: "Справка по командам модератора",
                  messageText: "❓ **Справка по командам модератора**\n\n**Управление контентом:**\n📌 `/pin_message` - Закрепить сообщение\n   Синонимы: `закрепить`, `прикрепить`, `зафиксировать`\n\n📌❌ `/unpin_message` - Открепить сообщение\n   Синонимы: `открепить`, `отцепить`, `убрать закрепление`\n\n🗑️ `/delete_message` - Удалить сообщение\n   Синонимы: `удалить`, `стереть`, `убрать сообщение`\n\n**Управление пользователями:**\n🚫 `/ban_user` - Заблокировать пользователя\n   Синонимы: `забанить`, `заблокировать`, `бан`\n\n✅ `/unban_user` - Разблокировать пользователя\n   Синонимы: `разбанить`, `разблокировать`, `unbан`\n\n🔇 `/mute_user` - Ограничить пользователя\n   Синонимы: `замутить`, `заглушить`, `мут`\n\n🔊 `/unmute_user` - Снять ограничения\n   Синонимы: `размутить`, `разглушить`, `анмут`\n\n👢 `/kick_user` - Исключить пользователя\n   Синонимы: `кикнуть`, `исключить`, `выгнать`\n\n👑 `/promote_user` - Назначить администратором\n   Синонимы: `повысить`, `назначить админом`, `промоут`\n\n👤 `/demote_user` - Снять с администратора\n   Синонимы: `понизить`, `снять с админа`, `демоут`\n\n**Примеры использования:**\n• Ответьте на сообщение командой для его обработки\n• Используйте команды в ответ на сообщения нарушителей\n• Все действия логируются для отчетности",
                  synonyms: ["справка", "помощь", "команды", "хелп"],
                  markdown: true,
                  formatMode: "markdown",
                  keyboardType: "none",
                  buttons: [],
                  showInMenu: true,
                  isPrivateOnly: false,
                  requiresAuth: false,
                  adminOnly: false
                }
              }
            ],
            connections: [
              {
                id: "start-help",
                sourceNodeId: "start",
                targetNodeId: "help_commands",
                sourceHandle: "btn-help",
                targetHandle: "target"
              }
            ]
          },
          {
            id: "content_sheet",
            name: "📝 Управление контентом",
            description: "Инструменты для модерации сообщений и контента",
            nodes: [
              {
                id: "pin_message_node",
                type: "pin_message",
                position: { x: 200, y: 300 },
                data: {
                  command: "/pin_message",
                  messageText: "📌 Сообщение успешно закреплено!",
                  synonyms: ["закрепить", "прикрепить", "зафиксировать"],
                  disableNotification: false,
                  keyboardType: "none",
                  buttons: []
                }
              },
              {
                id: "unpin_message_node",
                type: "unpin_message",
                position: { x: 400, y: 300 },
                data: {
                  command: "/unpin_message",
                  messageText: "📌❌ Сообщение успешно откреплено!",
                  synonyms: ["открепить", "отцепить", "убрать закрепление"],
                  keyboardType: "none",
                  buttons: []
                }
              },
              {
                id: "delete_message_node",
                type: "delete_message",
                position: { x: 600, y: 300 },
                data: {
                  command: "/delete_message",
                  messageText: "🗑️ Сообщение успешно удалено!",
                  synonyms: ["удалить", "стереть", "убрать сообщение"],
                  keyboardType: "none",
                  buttons: []
                }
              }
            ],
            connections: []
          },
          {
            id: "users_sheet",
            name: "👥 Управление пользователями",
            description: "Инструменты для модерации участников группы",
            nodes: [
              {
                id: "ban_user_node",
                type: "ban_user",
                position: { x: 100, y: 500 },
                data: {
                  command: "/ban_user",
                  messageText: "🚫 Пользователь заблокирован в группе!",
                  synonyms: ["забанить", "заблокировать", "бан"],
                  reason: "Нарушение правил группы",
                  untilDate: 0,
                  keyboardType: "none",
                  buttons: []
                }
              },
              {
                id: "unban_user_node",
                type: "unban_user",
                position: { x: 250, y: 500 },
                data: {
                  command: "/unban_user",
                  messageText: "✅ Пользователь разблокирован!",
                  synonyms: ["разбанить", "разблокировать", "unbан"],
                  keyboardType: "none",
                  buttons: []
                }
              },
              {
                id: "mute_user_node",
                type: "mute_user",
                position: { x: 400, y: 500 },
                data: {
                  command: "/mute_user",
                  messageText: "🔇 Пользователь ограничен в правах!",
                  synonyms: ["замутить", "заглушить", "мут"],
                  reason: "Нарушение правил группы",
                  duration: 3600,
                  canSendMessages: false,
                  canSendMediaMessages: false,
                  canSendPolls: false,
                  canSendOtherMessages: false,
                  canAddWebPagePreviews: false,
                  canChangeGroupInfo: false,
                  canInviteUsers2: false,
                  canPinMessages2: false,
                  keyboardType: "none",
                  buttons: []
                }
              },
              {
                id: "unmute_user_node",
                type: "unmute_user",
                position: { x: 550, y: 500 },
                data: {
                  command: "/unmute_user",
                  messageText: "🔊 Ограничения с пользователя сняты!",
                  synonyms: ["размутить", "разглушить", "анмут"],
                  keyboardType: "none",
                  buttons: []
                }
              },
              {
                id: "kick_user_node",
                type: "kick_user",
                position: { x: 700, y: 500 },
                data: {
                  command: "/kick_user",
                  messageText: "👢 Пользователь исключен из группы!",
                  synonyms: ["кикнуть", "исключить", "выгнать"],
                  reason: "Нарушение правил группы",
                  keyboardType: "none",
                  buttons: []
                }
              },
              {
                id: "promote_user_node",
                type: "promote_user",
                position: { x: 500, y: 700 },
                data: {
                  command: "/promote_user",
                  messageText: "👑 Пользователь назначен администратором!",
                  synonyms: ["повысить", "назначить админом", "промоут"],
                  canChangeInfo: false,
                  canDeleteMessages: true,
                  canBanUsers: false,
                  canInviteUsers: true,
                  canPinMessages: true,
                  canAddAdmins: false,
                  canRestrictMembers: false,
                  canPromoteMembers: false,
                  canManageVideoChats: false,
                  canManageTopics: false,
                  isAnonymous: false,
                  keyboardType: "none",
                  buttons: []
                }
              },
              {
                id: "demote_user_node",
                type: "demote_user",
                position: { x: 700, y: 700 },
                data: {
                  command: "/demote_user",
                  messageText: "👤 Пользователь снят с должности администратора!",
                  synonyms: ["понизить", "снять с админа", "демоут"],
                  keyboardType: "none",
                  buttons: []
                }
              }
            ],
            connections: []
          }
        ],
        interSheetConnections: []
      }
    });

    console.log('✅ Шаблон админ-панели модератора создан');
    console.log('✅ Системные шаблоны созданы');

  } catch (error) {
    console.error('Ошибка при создании шаблонов:', error);
  }
}

export { seedDefaultTemplates };