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
      version: "2.0.0",
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
              messageText: "На какой станции метро ты обычно бываешь? 🚇\n\nМожешь выбрать несколько веток:",
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "metro_lines",
              continueButtonTarget: "interests_categories",
              buttons: [
                {
                  id: "btn-red",
                  text: "Красная ветка 🟥",
                  action: "selection",
                  target: "red_line",
                  buttonType: "option"
                },
                {
                  id: "btn-blue",
                  text: "Синяя ветка 🟦",
                  action: "selection",
                  target: "blue_line",
                  buttonType: "option"
                },
                {
                  id: "btn-green",
                  text: "Зелёная ветка 🟩",
                  action: "selection",
                  target: "green_line",
                  buttonType: "option"
                },
                {
                  id: "btn-orange",
                  text: "Оранжевая ветка 🟧",
                  action: "selection",
                  target: "orange_line",
                  buttonType: "option"
                },
                {
                  id: "btn-purple",
                  text: "Фиолетовая ветка 🟪",
                  action: "selection",
                  target: "purple_line",
                  buttonType: "option"
                },
                {
                  id: "btn-lo",
                  text: "Я из ЛО 🏡",
                  action: "selection",
                  target: "lo_cities",
                  buttonType: "option"
                },
                {
                  id: "btn-not-spb",
                  text: "Я не в Питере 🌍",
                  action: "selection",
                  target: "not_in_spb",
                  buttonType: "option"
                }
              ],
              markdown: false,
              oneTimeKeyboard: true,
              resizeKeyboard: true
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
                  buttonType: "option"
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
              messageText: "🎉 Отлично! Твой профиль заполнен!\n\n👤 Твоя анкета:\nПол: {gender}\nИмя: {user_name}\nВозраст: {user_age}\nМетро: {metro_lines}\nИнтересы: {user_interests}\nСемейное положение: {marital_status}\nОриентация: {sexual_orientation}\nТелеграм: {telegram_channel}\nО себе: {extra_info}\n\nМожешь посмотреть полную анкету или сразу получить ссылку на чат!",
              keyboardType: "inline",
              removeKeyboard: false,
              buttons: [
                {
                  id: "btn-profile",
                  text: "📋 Показать анкету",
                  action: "goto",
                  target: "show_profile",
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
            type: "message",
            position: { x: 500, y: 850 },
            data: {
              messageText: "👤 Твой профиль:\n\nПол: {gender} {'👨' if gender == 'Мужчина' else '👩'}\nИмя: {user_name} ✏️\nВозраст: {user_age} 🎂\nМетро: {metro_lines} 🚇\nИнтересы: {user_interests} 🎯\nСемейное положение: {marital_status} 💍\nОриентация: {sexual_orientation} 🌈\nТелеграм: {telegram_channel} 📢\nО себе: {extra_info} 📝\n\nГотов получить ссылку на чат?",
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
                  action: "goto",
                  target: "show_profile",
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
          {
            id: "conn-8",
            sourceNodeId: "metro_selection",
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
            id: "conn-26",
            sourceNodeId: "profile_complete",
            targetNodeId: "show_profile",
            sourceHandle: "btn-profile",
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
          },
          {
            id: "conn-29",
            sourceNodeId: "chat_link",
            targetNodeId: "show_profile",
            sourceHandle: "btn-back-profile",
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