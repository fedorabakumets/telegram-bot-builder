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
              inputVariable: "metro_choice",
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
                  id: "btn-orange",
                  text: "Оранжевая ветка 🟧",
                  action: "goto",
                  target: "orange_line_stations",
                  buttonType: "option"
                },
                {
                  id: "btn-purple",
                  text: "Фиолетовая ветка 🟪",
                  action: "goto",
                  target: "purple_line_stations",
                  buttonType: "option"
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
              messageText: "Хочешь указать свой телеграм-канал? 📢",
              keyboardType: "inline",
              collectUserInput: true,
              inputVariable: "telegram_channel_choice",
              buttons: [
                {
                  id: "btn-yes-channel",
                  text: "Да 📢",
                  value: "yes",
                  action: "goto",
                  target: "channel_input",
                  buttonType: "option"
                },
                {
                  id: "btn-no-channel",
                  text: "Нет ❌",
                  value: "no",
                  action: "goto",
                  target: "extra_info",
                  buttonType: "option"
                }
              ],
              markdown: false,
              oneTimeKeyboard: true,
              resizeKeyboard: true
            }
          },

          {
            id: "channel_input",
            type: "message",
            position: { x: 900, y: 650 },
            data: {
              messageText: "Введи свой телеграм-канал 📢\n\n(можно ссылку, ник с @ или просто имя):",
              keyboardType: "none",
              collectUserInput: true,
              enableTextInput: true,
              inputVariable: "telegram_channel",
              inputTargetNodeId: "extra_info",
              buttons: [],
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
              inputTargetNodeId: "profile_complete",
              buttons: [
                {
                  id: "btn-skip-extra",
                  text: "Пропустить ⏭️",
                  action: "goto",
                  target: "profile_complete",
                  buttonType: "option",
                  dontSaveResponse: true
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
              messageText: "🎉 Отлично! Твой профиль заполнен!\n\n👤 Твоя анкета:\nПол: {gender}\nИмя: {user_name}\nВозраст: {user_age}\nМетро: {metro_stations}\nИнтересы: {user_interests}\nСемейное положение: {marital_status}\nОриентация: {sexual_orientation}\nО себе: {extra_info}\n\nМожешь посмотреть полную анкету или сразу получить ссылку на чат!",
              keyboardType: "inline",
              removeKeyboard: false,
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "with_telegram",
                  condition: "user_data_exists",
                  variableNames: ["telegram_channel"],
                  messageText: "🎉 Отлично! Твой профиль заполнен!\n\n👤 Твоя анкета:\nПол: {gender}\nИмя: {user_name}\nВозраст: {user_age}\nМетро: {metro_stations}\nИнтересы: {user_interests}\nСемейное положение: {marital_status}\nОриентация: {sexual_orientation}\nТелеграм: {telegram_channel} 📢\nО себе: {extra_info}\n\nМожешь посмотреть полную анкету или сразу получить ссылку на чат!",
                  formatMode: "text",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-profile",
                      text: "📋 Показать анкету",
                      action: "command",
                      target: "/профиль",
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
                }
              ],
              buttons: [
                {
                  id: "btn-profile",
                  text: "📋 Показать анкету",
                  action: "command",
                  target: "/профиль",
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
              messageText: "👤 Твой профиль:\n\nПол: {gender} 👤\nИмя: {user_name} ✏️\nВозраст: {user_age} 🎂\nМетро: {metro_stations} 🚇\nИнтересы: {user_interests} 🎯\nСемейное положение: {marital_status} 💍\nОриентация: {sexual_orientation} 🌈\nО себе: {extra_info} 📝\n\nГотов получить ссылку на чат?",
              keyboardType: "inline",
              enableConditionalMessages: true,
              conditionalMessages: [
                {
                  id: "with_telegram",
                  condition: "user_data_exists",
                  variableNames: ["telegram_channel"],
                  messageText: "👤 Твой профиль:\n\nПол: {gender} 👤\nИмя: {user_name} ✏️\nВозраст: {user_age} 🎂\nМетро: {metro_stations} 🚇\nИнтересы: {user_interests} 🎯\nСемейное положение: {marital_status} 💍\nОриентация: {sexual_orientation} 🌈\nТелеграм: {telegram_channel} 📢\nО себе: {extra_info} 📝\n\nГотов получить ссылку на чат?",
                  formatMode: "text",
                  keyboardType: "inline",
                  buttons: [
                    {
                      id: "btn-get-link",
                      text: "🔗 Получить ссылку",
                      action: "goto",
                      target: "chat_link",
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
                }
              ],
              buttons: [
                {
                  id: "btn-get-link",
                  text: "🔗 Получить ссылку",
                  action: "goto",
                  target: "chat_link",
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
            type: "message",
            position: { x: 900, y: 850 },
            data: {
              messageText: "🔗 Актуальная ссылка на чат:\n\nhttps://t.me/+agkIVgCzHtY2ZTA6\n\nДобро пожаловать в сообщество ᴠᴨᴩᴏᴦʏᴧᴋᴇ! 🎉",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-back-profile",
                  text: "⬅️ Назад к анкете",
                  action: "command",
                  target: "/профиль",
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
            targetNodeId: "channel_input",
            sourceHandle: "btn-yes-channel",
            targetHandle: "target"
          },
          {
            id: "conn-22",
            sourceNodeId: "channel_choice",
            targetNodeId: "extra_info",
            sourceHandle: "btn-no-channel",
            targetHandle: "target"
          },
          {
            id: "conn-23",
            sourceNodeId: "channel_input",
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
          {
            id: "conn-28",
            sourceNodeId: "show_profile",
            targetNodeId: "chat_link",
            sourceHandle: "btn-get-link",
            targetHandle: "target"
          }
        ]
      }
    });

    console.log('✅ Шаблон VProgulke Bot создан');
    console.log('✅ Системные шаблоны созданы');

  } catch (error) {
    console.error('Ошибка при создании шаблонов:', error);
  }
}

export { seedDefaultTemplates };