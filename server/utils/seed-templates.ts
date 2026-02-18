import { type BotTemplate } from "@shared/schema";
import { storage } from "../storages/storage";

/**
 * Инициализирует системные шаблоны ботов в базе данных
 *
 * @param {boolean} [force=false] - Флаг, указывающий, нужно ли принудительно обновить шаблоны
 *
 * @description
 * Функция проверяет наличие системных шаблонов (созданных автором "Система") в базе данных.
 * Если шаблоны уже существуют и флаг force не установлен, функция завершает работу.
 * Если флаг force установлен в true, функция удаляет все существующие системные шаблоны
 * и создает новые стандартные шаблоны для демонстрации возможностей системы.
 *
 * Функция создает шаблон "VProgulke Bot" - продвинутый бот знакомств для Санкт-Петербурга
 * с детальной анкетой, системой метро и многоуровневыми интересами.
 *
 * @returns {Promise<void>} Промис, который разрешается, когда инициализация завершена
 *
 * @example
 * ```typescript
 * // Инициализировать шаблоны, если они не существуют
 * await seedDefaultTemplates();
 *
 * // Принудительно обновить все системные шаблоны
 * await seedDefaultTemplates(true);
 * ```
 */
async function seedDefaultTemplates(force = false) {
  try {
    console.log(`📋 seedDefaultTemplates вызван с force=${force}`);
    const existingTemplates = await storage.getAllBotTemplates();

    // Проверяем, есть ли уже системные шаблоны
    const systemTemplates = existingTemplates.filter((t: BotTemplate) => t.authorName === 'Система');
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



    // Создаем объединенный шаблон: ВПрогулке + Админ панель (ПОЛНАЯ ВЕРСИЯ)
    await storage.createBotTemplate({
      name: "🌟👮‍♂️ ВПрогулке + Админ панель - Полная версия",
      description: "Полноценный объединенный шаблон: продвинутый бот знакомств для Санкт-Петербурга со всеми функциями (метро, интересы, ориентация) + полный набор инструментов модерации группы",
      category: "community",
      tags: ["знакомства", "модерация", "админ", "метро", "интересы", "СПб", "анкета", "управление", "группа", "контент", "ориентация", "полнофункциональный"],
      isPublic: 1,
      difficulty: "hard",
      authorName: "Система",
      version: "2.0.0",
      featured: 1,
      language: "ru",
      complexity: 10,
      estimatedTime: 80,
      data: {
        sheets: [
          // ===== ЛИСТЫ ИЗ ВПрогулке Multi-Sheet (ПОЛНАЯ КОПИЯ) =====

          // Лист 1: Приветствие
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
                  description: "Полная справка по всем командам бота и модерации",
                  synonyms: ["помощь", "справка", "команды", "что писать", "как пользоваться", "админ справка", "админ помощь", "админ команды"],
                  messageText: "🤖 **Добро пожаловать в справочный центр!**\n\n🌟 **ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot**\n*Твой помощник в знакомствах*\n\n🎯 **ОСНОВНЫЕ КОМАНДЫ:**\n\n🚀 `/start` — *Начать заново*\n   📝 Синонимы: `старт`, `начать`, `привет`, `начало`, `начинаем`\n\n👤 `/profile` — *Мой профиль*\n   📝 Синонимы: `профиль`, `анкета`, `мой профиль`, `посмотреть профиль`, `редактировать профиль`\n\n🔗 `/link` — *Ссылка на чат*\n   📝 Синонимы: `ссылка`, `чат`, `сообщество`, `впрогулке`, `линк`\n\n🆘 `/help` — *Эта справка*\n   📝 Синонимы: `помощь`, `справка`, `команды`, `что писать`, `как пользоваться`\n\n📋 **РАЗДЕЛЫ АНКЕТЫ И ИХ СИНОНИМЫ:**\n\n👫 **Пол:** мужской, женский\n   📝 Синонимы: `пол`, `gender`\n\n🏷️ **Имя:** любое имя\n   📝 Синонимы: `имя`, `как зовут`, `назовись`\n\n🎂 **Возраст:** число от 18 до 99\n   📝 Синонимы: `возраст`, `лет`, `сколько лет`\n\n🚇 **Метро:** выбор линии и станции\n   📝 Синонимы: `метро`, `станция`\n   🟥 Красная линия: `красная линия`, `кировско-выборгская`, `красная ветка`\n   🟦 Синяя линия: `синяя линия`, `московско-петроградская`, `синяя ветка`\n   🟩 Зеленая линия: `зеленая линия`, `невско-василеостровская`, `зеленая ветка`\n   🟧 Оранжевая линия: `оранжевая линия`, `правобережная`, `оранжевая ветка`\n   🟪 Фиолетовая линия: `фиолетовая линия`, `фрунзенско-приморская`, `фиолетовая ветка`\n\n🎨 **Интересы и их синонимы:**\n   🎮 Хобби: `хобби`, `увлечения`, `занятия`, `игры`\n   🤝 Социальная жизнь: `общение`, `социальное`, `люди`, `тусовки`\n   🎭 Творчество: `творчество`, `искусство`, `рисование`, `музыка`\n   💪 Активный образ жизни: `активность`, `активный`, `движение`, `здоровье`\n   🍕 Еда и напитки: `еда`, `напитки`, `кухня`, `рестораны`\n   ⚽ Спорт: `спорт`, `фитнес`, `тренировки`, `футбол`\n\n💑 **Семейное положение:** поиск, отношения, женат/замужем, сложно\n   📝 Синонимы: `семейное положение`, `статус`, `отношения`, `семья`\n\n🌈 **Ориентация:** гетеро, гей, лесби, би, другое\n   📝 Синонимы: `ориентация`, `предпочтения`\n\n📺 **Телеграм-канал:** опционально\n   📝 Синонимы: `тгк`, `телеграм`, `канал`, `тг канал`\n\n📖 **О себе:** дополнительная информация\n   📝 Синонимы: `о себе`, `описание`, `расскажи`, `инфо`\n\n👮‍♂️ **КОМАНДЫ МОДЕРАЦИИ:**\n\n**Управление контентом:**\n📌 `/pin_message` - Закрепить сообщение\n   📝 Синонимы: `закрепить`, `прикрепить`, `зафиксировать`\n\n📌❌ `/unpin_message` - Открепить сообщение\n   📝 Синонимы: `открепить`, `отцепить`, `убрать закрепление`\n\n🗑️ `/delete_message` - Удалить сообщение\n   📝 Синонимы: `удалить`, `стереть`, `убрать сообщение`\n\n**Управление пользователями:**\n🚫 `/ban_user` - Заблокировать пользователя\n   📝 Синонимы: `забанить`, `заблокировать`, `бан`\n\n✅ `/unban_user` - Разблокировать пользователя\n   📝 Синонимы: `разбанить`, `разблокировать`, `unbán`\n\n🔇 `/mute_user` - Ограничить пользователя\n   📝 Синонимы: `замутить`, `заглушить`, `мут`\n\n🔊 `/unmute_user` - Снять ограничения\n   📝 Синонимы: `размутить`, `разглушить`, `анмут`\n\n👢 `/kick_user` - Исключить пользователя\n   📝 Синонимы: `кикнуть`, `исключить`, `выгнать`\n\n👑 `/promote_user` - Назначить администратором\n   📝 Синонимы: `повысить`, `назначить админом`, `промоут`\n\n👤 `/demote_user` - Снять с администратора\n   📝 Синонимы: `понизить`, `снять с админа`, `демоут`\n\n⚙️ `/admin_rights` - Настроить права администратора\n   📝 Синонимы: `права админа`, `настроить права`, `тг права`\n   ⚠️ Только для администраторов группы!\n   💡 Ответьте на сообщение пользователя командой\n\n**Примеры использования:**\n• Ответьте на сообщение командой для его обработки\n• Используйте команды в ответ на сообщения нарушителей\n• Команды с правами работают только в группах/су??ерг??уппах\n• Все действия логируют???? для отчетности\n\n💡 **ПОЛЕЗНЫЕ СОВЕТЫ:**\n\n✨ Можешь писать команды или синонимы в любом месте разговора\n✨ Бот поймет твои сообщения даже без команд\n✨ В любой момент можешь написать /start для начала заново\n✨ Используй /profile для изменения любых данных\n✨ Нажми на любое выделенное слово чтобы скопировать его!\n\n🎉 **Удачных знакомств в Питере!** 🎉",
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
                  markdown: true,
                  formatMode: "markdown",
                  showInMenu: true,
                  isPrivateOnly: false,
                  requiresAuth: false,
                  adminOnly: false
                }
              }
            ]
          },

          // ===== ЛИСТЫ ИЗ АДМИН-ПАНЕЛИ МОДЕРАТОРА =====

          // Лист 8: Управление контентом
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

          // Лист 9: Управление пользователями
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
              },
              {
                id: "admin_rights_node",
                type: "admin_rights",
                position: { x: 300, y: 900 },
                data: {
                  command: "/admin_rights",
                  messageText: "⚙️ Права администратора настроены для пользователя!\n\n💡 Чтобы настроить права, ответьте на сообщение пользователя и используйте команду /admin_rights",
                  synonyms: ["права админа", "настроить права", "тг права", "права администратора", "admin rights"],
                  description: "Настройка прав администратора в группе (только для админов)",
                  adminUserIdSource: "reply_to_message",
                  adminOnly: true,
                  requiresGroup: true,
                  isPrivateOnly: false,
                  can_manage_chat: false,
                  can_delete_messages: true,
                  can_manage_video_chats: false,
                  can_restrict_members: true,
                  can_promote_members: false,
                  can_change_info: false,
                  can_invite_users: true,
                  can_pin_messages: true,
                  can_manage_topics: false,
                  is_anonymous: false,
                  adminChatIdSource: "current_chat",
                  keyboardType: "none",
                  buttons: []
                }
              }
            ],
            connections: []
          }
        ],

        // Связи между листами
        interSheetConnections: [
          // === ОСНОВНОЙ ПОТОК ВПрогулке ===
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

          // === РЕДАКТИРОВАНИЕ ПРОФИЛЯ (Возврат к соответствующим листам) ===
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

    console.log('✅ Объединенный шаблон ВПрогулке + Админ панель создан');

    // Создаем шаблон "Котик" - простая анкета знакомств (обновленная версия v3.3)
    await storage.createBotTemplate({
      name: "🐱 Котик - Простая анкета",
      description: "Продвинутая анкета для знакомств: возраст, пол, интересы, город, имя, описание и фото/видео. Включает полный цикл с просмотром анкет! С условными сообщениями.",
      category: "community",
      tags: ["котик", "анкета", "знакомства", "простой", "начинающие", "условные сообщения"],
      isPublic: 1,
      difficulty: "easy",
      authorName: "Система",
      version: "3.3.0",
      featured: 1,
      language: "ru",
      complexity: 3,
      estimatedTime: 10,
      data: { "sheets": [{ "id": "dKKm6G8ny8bH09YEa0H9d", "name": "Основной поток", "nodes": [{ "id": "start", "type": "start", "position": { "x": 100, "y": 100 }, "data": { "buttons": [], "command": "/start", "markdown": false, "adminOnly": false, "showInMenu": true, "description": "Запустить бота", "messageText": "Сколько тебе лет?", "keyboardType": "none", "requiresAuth": false, "inputVariable": "age", "isPrivateOnly": false, "resizeKeyboard": true, "enableTextInput": true, "oneTimeKeyboard": false, "collectUserInput": true, "enableStatistics": true, "inputTargetNodeId": "f90r9k3FSLu2Tjn74cBn_", "conditionalMessages": [{ "id": "condition-1763692642023", "buttons": [{ "id": "b5XNyuzu_-YIFk3yfUfpj", "url": "", "text": "{age}", "action": "goto", "target": "f90r9k3FSLu2Tjn74cBn_", "buttonType": "normal", "skipDataCollection": false }], "priority": 10, "condition": "user_data_exists", "formatMode": "text", "messageText": "\n", "keyboardType": "reply", "variableName": "age", "logicOperator": "AND", "variableNames": ["age"], "waitForTextInput": true, "nextNodeAfterInput": "f90r9k3FSLu2Tjn74cBn_" }], "enableConditionalMessages": true }, "_y": 100 }, { "id": "f90r9k3FSLu2Tjn74cBn_", "type": "message", "position": { "x": 100, "y": 814.25 }, "data": { "buttons": [{ "id": "iIkbMb2jlZRJOxGHMNl1a", "text": "Я девушка", "action": "goto", "target": "RFTgm4KzC6dI39AMTPcmo", "buttonType": "normal", "skipDataCollection": false }, { "id": "0dBjAkcTa9rEsjEP48XzB", "text": "Я парень", "action": "goto", "target": "RFTgm4KzC6dI39AMTPcmo", "buttonType": "normal", "skipDataCollection": false }], "markdown": false, "adminOnly": false, "showInMenu": true, "messageText": "Теперь определимся с полом", "keyboardType": "reply", "requiresAuth": false, "inputVariable": "gender", "isPrivateOnly": false, "resizeKeyboard": true, "oneTimeKeyboard": false, "collectUserInput": true, "enableStatistics": true }, "_y": 814.25 }, { "id": "RFTgm4KzC6dI39AMTPcmo", "type": "message", "position": { "x": 100, "y": 1393 }, "data": { "buttons": [{ "id": "6bA3YPgWd20pCqPAeyuLe", "text": "Девушки", "action": "goto", "target": "sIh3xXKEtb_TtrhHqZQzX", "buttonType": "normal", "skipDataCollection": false }, { "id": "hI7nsCdodrcUnft1SXYpg", "text": "Парни", "action": "goto", "target": "sIh3xXKEtb_TtrhHqZQzX", "buttonType": "normal", "skipDataCollection": false }, { "id": "VhOGaPeyFpFV9a7QDBfzo", "text": "Все равно", "action": "goto", "target": "sIh3xXKEtb_TtrhHqZQzX", "buttonType": "normal", "skipDataCollection": false }], "markdown": false, "adminOnly": false, "showInMenu": true, "messageText": "Кто тебе интересен?", "keyboardType": "reply", "requiresAuth": false, "inputVariable": "sex", "isPrivateOnly": false, "resizeKeyboard": true, "oneTimeKeyboard": false, "collectUserInput": true, "enableStatistics": true }, "_y": 1393 }, { "id": "sIh3xXKEtb_TtrhHqZQzX", "type": "message", "position": { "x": 100, "y": 2025.75 }, "data": { "buttons": [], "markdown": false, "adminOnly": false, "showInMenu": true, "messageText": "Из какого ты города?", "keyboardType": "none", "requiresAuth": false, "inputVariable": "city", "isPrivateOnly": false, "resizeKeyboard": true, "enableTextInput": true, "oneTimeKeyboard": false, "collectUserInput": true, "enableStatistics": true, "inputTargetNodeId": "tS2XGL2Mn4LkE63SnxhPy", "conditionalMessages": [{ "id": "cond-city-1", "buttons": [{ "id": "btn-city-yes", "text": "{city}", "action": "goto", "target": "tS2XGL2Mn4LkE63SnxhPy", "buttonType": "normal", "skipDataCollection": false }], "priority": 10, "condition": "user_data_exists", "formatMode": "text", "messageText": "\n", "keyboardType": "reply", "variableName": "city", "logicOperator": "AND", "variableNames": ["city"], "waitForTextInput": true, "nextNodeAfterInput": "tS2XGL2Mn4LkE63SnxhPy" }], "enableConditionalMessages": true }, "_y": 2025.75 }, { "id": "tS2XGL2Mn4LkE63SnxhPy", "type": "message", "position": { "x": 100, "y": 2734.5 }, "data": { "buttons": [], "markdown": false, "adminOnly": false, "showInMenu": true, "messageText": "Как мне тебя называть?", "keyboardType": "none", "requiresAuth": false, "inputVariable": "name", "isPrivateOnly": false, "resizeKeyboard": true, "enableTextInput": true, "oneTimeKeyboard": false, "collectUserInput": true, "enableStatistics": true, "inputTargetNodeId": "lBPy3gcGVLla0NGdSYb35", "conditionalMessages": [{ "id": "cond-name-1", "buttons": [{ "id": "9Qihav_1tM43MLvkUr1y1", "url": "", "text": "{name}", "action": "goto", "target": "lBPy3gcGVLla0NGdSYb35", "buttonType": "normal", "skipDataCollection": false }], "priority": 10, "condition": "user_data_exists", "formatMode": "text", "messageText": "\n", "keyboardType": "reply", "variableName": "name", "logicOperator": "AND", "variableNames": ["name"], "waitForTextInput": true, "nextNodeAfterInput": "lBPy3gcGVLla0NGdSYb35" }], "enableConditionalMessages": true }, "_y": 2734.5 }, { "id": "lBPy3gcGVLla0NGdSYb35", "type": "message", "position": { "x": 100, "y": 3443.25 }, "data": { "buttons": [{ "id": "g9KWWguVciHEUMMeyZ-WN", "text": "Пропустить", "action": "goto", "target": "Y9zLRp1BLpVhm-HcsNkJV", "buttonType": "normal", "skipDataCollection": true }], "markdown": false, "adminOnly": false, "showInMenu": true, "messageText": "Расскажи о себе и кого хочешь найти, чем предлагаешь заняться. Это поможет лучше подобрать тебе компанию.", "keyboardType": "reply", "requiresAuth": false, "inputVariable": "info", "isPrivateOnly": false, "resizeKeyboard": true, "enableTextInput": true, "oneTimeKeyboard": false, "collectUserInput": true, "enableStatistics": true, "inputTargetNodeId": "Y9zLRp1BLpVhm-HcsNkJV", "conditionalMessages": [{ "id": "cond-info-1", "buttons": [{ "id": "btn-info-skip", "text": "Оставить текущий текст", "action": "goto", "target": "Y9zLRp1BLpVhm-HcsNkJV", "buttonType": "normal", "skipDataCollection": true }], "priority": 10, "condition": "user_data_exists", "formatMode": "text", "messageText": "\n", "keyboardType": "reply", "variableName": "info", "logicOperator": "AND", "variableNames": ["info"], "waitForTextInput": true, "nextNodeAfterInput": "vxPv7G4n0QGyhnv4ucOM5" }], "enableConditionalMessages": true }, "_y": 3443.25 }, { "id": "Y9zLRp1BLpVhm-HcsNkJV", "type": "message", "position": { "x": 100, "y": 4310.25 }, "data": { "buttons": [], "markdown": false, "adminOnly": false, "showInMenu": true, "messageText": "Теперь пришли фото или запиши видео 👍 (до 15 сек), его будут видеть другие пользователи", "keyboardType": "none", "requiresAuth": false, "isPrivateOnly": false, "resizeKeyboard": true, "oneTimeKeyboard": false, "collectUserInput": true, "enablePhotoInput": true, "enableStatistics": true, "inputTargetNodeId": "vxPv7G4n0QGyhnv4ucOM5", "photoInputVariable": "photo", "conditionalMessages": [{ "id": "cond-photo-1", "buttons": [{ "id": "btn-photo-keep", "text": "Оставить текущее", "action": "goto", "target": "vxPv7G4n0QGyhnv4ucOM5", "buttonType": "normal", "skipDataCollection": true }], "priority": 10, "condition": "user_data_exists", "formatMode": "text", "messageText": "\n", "keyboardType": "reply", "variableName": "photo", "logicOperator": "AND", "variableNames": ["photo"], "waitForTextInput": false }], "enableConditionalMessages": true }, "_y": 4310.25 }, { "id": "vxPv7G4n0QGyhnv4ucOM5", "type": "message", "position": { "x": 100, "y": 5087.25 }, "data": { "buttons": [], "markdown": false, "adminOnly": false, "showInMenu": true, "messageText": "Так выглядит твоя анкета:", "keyboardType": "none", "requiresAuth": false, "isPrivateOnly": false, "resizeKeyboard": true, "oneTimeKeyboard": false, "autoTransitionTo": "8xSJaWAJNz7Hz_54mjFTF", "enableStatistics": true, "enableAutoTransition": true }, "_y": 5087.25 }, { "id": "8xSJaWAJNz7Hz_54mjFTF", "type": "message", "position": { "x": 100, "y": 5410 }, "data": { "buttons": [], "markdown": false, "adminOnly": false, "showInMenu": true, "messageText": "\n{name}, {age}, {city} - {info}\n", "keyboardType": "none", "requiresAuth": false, "attachedMedia": ["photo"], "isPrivateOnly": false, "resizeKeyboard": true, "oneTimeKeyboard": false, "autoTransitionTo": "KE-8sR9elPEefApjXtBxC", "enableStatistics": true, "enableConditionalMessages": false, "enableAutoTransition": true }, "_y": 5410 }, { "id": "KE-8sR9elPEefApjXtBxC", "type": "message", "position": { "x": 100, "y": 5732.75 }, "data": { "buttons": [{ "id": "Y6DFar0NH2ejdlKLTFgwC", "text": "Да", "action": "goto", "target": "yrsc8v81qQa5oQx538Dzn", "buttonType": "normal", "skipDataCollection": false }, { "id": "e1ZTOjUMpLqjln0LWH3JD", "text": "Изменить анкету", "action": "goto", "target": "start", "buttonType": "normal", "skipDataCollection": false }], "markdown": false, "adminOnly": false, "showInMenu": true, "messageText": "Все верно?", "keyboardType": "reply", "requiresAuth": false, "isPrivateOnly": false, "resizeKeyboard": true, "oneTimeKeyboard": false, "enableStatistics": true }, "_y": 5732.75 }, { "id": "yrsc8v81qQa5oQx538Dzn", "type": "message", "position": { "x": 100, "y": 6085.5 }, "data": { "buttons": [{ "id": "kfzexViyPfMpgOffuWXY3", "text": "1", "action": "goto", "target": "", "buttonType": "normal", "skipDataCollection": false }, { "id": "YqVio9545knVkcQWVLbgT", "text": "2", "action": "goto", "target": "start", "buttonType": "normal", "skipDataCollection": false }, { "id": "vMzKMEg84JLzu6EEnrQ5W", "text": "3", "action": "goto", "target": "Y9zLRp1BLpVhm-HcsNkJV", "buttonType": "normal", "skipDataCollection": false }, { "id": "En0QBjOLWkcEpIGLqy6EQ", "text": "4", "action": "goto", "target": "lBPy3gcGVLla0NGdSYb35", "buttonType": "normal", "skipDataCollection": false }], "markdown": false, "adminOnly": false, "showInMenu": true, "messageText": "1. Смотреть анкеты.\n2. Заполнить анкету заново.\n3. Изменить фото/видео.\n4. Изменить текст анкеты.", "keyboardType": "reply", "requiresAuth": false, "isPrivateOnly": false, "resizeKeyboard": true, "oneTimeKeyboard": false, "enableStatistics": true }, "_y": 6085.5 }], "connections": [{ "id": "input-start-f90r9k3FSLu2Tjn74cBn_", "source": "start", "target": "f90r9k3FSLu2Tjn74cBn_" }, { "id": "button-f90r9k3FSLu2Tjn74cBn_-iIkbMb2jlZRJOxGHMNl1a-RFTgm4KzC6dI39AMTPcmo", "source": "f90r9k3FSLu2Tjn74cBn_", "target": "RFTgm4KzC6dI39AMTPcmo" }, { "id": "button-f90r9k3FSLu2Tjn74cBn_-0dBjAkcTa9rEsjEP48XzB-RFTgm4KzC6dI39AMTPcmo", "source": "f90r9k3FSLu2Tjn74cBn_", "target": "RFTgm4KzC6dI39AMTPcmo" }, { "id": "button-RFTgm4KzC6dI39AMTPcmo-6bA3YPgWd20pCqPAeyuLe-sIh3xXKEtb_TtrhHqZQzX", "source": "RFTgm4KzC6dI39AMTPcmo", "target": "sIh3xXKEtb_TtrhHqZQzX" }, { "id": "button-RFTgm4KzC6dI39AMTPcmo-hI7nsCdodrcUnft1SXYpg-sIh3xXKEtb_TtrhHqZQzX", "source": "RFTgm4KzC6dI39AMTPcmo", "target": "sIh3xXKEtb_TtrhHqZQzX" }, { "id": "button-RFTgm4KzC6dI39AMTPcmo-VhOGaPeyFpFV9a7QDBfzo-sIh3xXKEtb_TtrhHqZQzX", "source": "RFTgm4KzC6dI39AMTPcmo", "target": "sIh3xXKEtb_TtrhHqZQzX" }, { "id": "input-sIh3xXKEtb_TtrhHqZQzX-tS2XGL2Mn4LkE63SnxhPy", "source": "sIh3xXKEtb_TtrhHqZQzX", "target": "tS2XGL2Mn4LkE63SnxhPy" }, { "id": "input-tS2XGL2Mn4LkE63SnxhPy-lBPy3gcGVLla0NGdSYb35", "source": "tS2XGL2Mn4LkE63SnxhPy", "target": "lBPy3gcGVLla0NGdSYb35" }, { "id": "input-lBPy3gcGVLla0NGdSYb35-Y9zLRp1BLpVhm-HcsNkJV", "source": "lBPy3gcGVLla0NGdSYb35", "target": "Y9zLRp1BLpVhm-HcsNkJV" }, { "id": "button-lBPy3gcGVLla0NGdSYb35-g9KWWguVciHEUMMeyZ-WN-Y9zLRp1BLpVhm-HcsNkJV", "source": "lBPy3gcGVLla0NGdSYb35", "target": "Y9zLRp1BLpVhm-HcsNkJV" }, { "id": "input-Y9zLRp1BLpVhm-HcsNkJV-vxPv7G4n0QGyhnv4ucOM5", "source": "Y9zLRp1BLpVhm-HcsNkJV", "target": "vxPv7G4n0QGyhnv4ucOM5" }, { "id": "auto-vxPv7G4n0QGyhnv4ucOM5-8xSJaWAJNz7Hz_54mjFTF", "source": "vxPv7G4n0QGyhnv4ucOM5", "target": "8xSJaWAJNz7Hz_54mjFTF" }, { "id": "auto-8xSJaWAJNz7Hz_54mjFTF-KE-8sR9elPEefApjXtBxC", "source": "8xSJaWAJNz7Hz_54mjFTF", "target": "KE-8sR9elPEefApjXtBxC" }, { "id": "button-KE-8sR9elPEefApjXtBxC-Y6DFar0NH2ejdlKLTFgwC-yrsc8v81qQa5oQx538Dzn", "source": "KE-8sR9elPEefApjXtBxC", "target": "yrsc8v81qQa5oQx538Dzn" }, { "id": "button-KE-8sR9elPEefApjXtBxC-e1ZTOjUMpLqjln0LWH3JD-start", "source": "KE-8sR9elPEefApjXtBxC", "target": "start" }, { "id": "button-yrsc8v81qQa5oQx538Dzn-YqVio9545knVkcQWVLbgT-start", "source": "yrsc8v81qQa5oQx538Dzn", "target": "start" }, { "id": "button-yrsc8v81qQa5oQx538Dzn-vMzKMEg84JLzu6EEnrQ5W-Y9zLRp1BLpVhm-HcsNkJV", "source": "yrsc8v81qQa5oQx538Dzn", "target": "Y9zLRp1BLpVhm-HcsNkJV" }, { "id": "button-yrsc8v81qQa5oQx538Dzn-En0QBjOLWkcEpIGLqy6EQ-lBPy3gcGVLla0NGdSYb35", "source": "yrsc8v81qQa5oQx538Dzn", "target": "lBPy3gcGVLla0NGdSYb35" }], "viewState": { "zoom": 1, "position": { "x": 0, "y": 0 } }, "createdAt": "2025-11-24T00:49:44.731Z", "updatedAt": "2025-11-24T01:04:32.238Z" }], "activeSheetId": "dKKm6G8ny8bH09YEa0H9d", "version": 2, "interSheetConnections": [] }
    });

    console.log('✅ Шаблон Котик v3.3 создан (обновлен из приложенного файла)');

  } catch (error) {
    console.error('Ошибка при создании шаблонов:', error);
  }
}

export { seedDefaultTemplates };
