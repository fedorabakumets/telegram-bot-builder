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

    // Создаем шаблон со сбором интересов
    await storage.createBotTemplate({
      name: "Сбор интересов пользователя",
      description: "Шаблон для сбора интересов пользователя с множественным выбором",
      category: "utility",
      tags: ["интересы", "сбор данных", "множественный выбор"],
      isPublic: 1,
      difficulty: "easy",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 2,
      estimatedTime: 3,
      data: {
        nodes: [
          {
            id: "start",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Сбор интересов",
              messageText: "👋 Добро пожаловать!\n\nРасскажите нам о ваших интересах. Выберите все, что вам подходит:",
              keyboardType: "inline",
              allowMultipleSelection: true,
              multiSelectVariable: "user_interests",
              continueButtonTarget: "interests_result",
              buttons: [
                {
                  id: "btn-sport",
                  text: "⚽ Спорт",
                  action: "selection",
                  buttonType: "option",
                  target: "sport"
                },
                {
                  id: "btn-music",
                  text: "🎵 Музыка",
                  action: "selection",
                  buttonType: "option",
                  target: "music"
                },
                {
                  id: "btn-books",
                  text: "📚 Книги",
                  action: "selection",
                  buttonType: "option",
                  target: "books"
                },
                {
                  id: "btn-travel",
                  text: "✈️ Путешествия",
                  action: "selection",
                  buttonType: "option",
                  target: "travel"
                },
                {
                  id: "btn-tech",
                  text: "💻 Технологии",
                  action: "selection",
                  buttonType: "option",
                  target: "tech"
                },
                {
                  id: "btn-cooking",
                  text: "🍳 Кулинария",
                  action: "selection",
                  buttonType: "option",
                  target: "cooking"
                },
                {
                  id: "btn-art",
                  text: "🎨 Искусство",
                  action: "selection",
                  buttonType: "option",
                  target: "art"
                },
                {
                  id: "btn-games",
                  text: "🎮 Игры",
                  action: "selection",
                  buttonType: "option",
                  target: "games"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "interests_result",
            type: "message",
            position: { x: 400, y: 100 },
            data: {
              messageText: "🎯 Ваши интересы:\n\n{user_interests}\n\nСпасибо за информацию! Теперь мы сможем предложить вам более подходящий контент.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-continue",
                  text: "👍 Продолжить",
                  action: "goto",
                  target: "final_message"
                },
                {
                  id: "btn-edit",
                  text: "✏️ Изменить выбор",
                  action: "command",
                  target: "/start"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "final_message",
            type: "message",
            position: { x: 700, y: 100 },
            data: {
              messageText: "✅ Отлично! Ваши предпочтения сохранены.\n\nТеперь вы будете получать персонализированные рекомендации на основе ваших интересов.",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-restart",
                  text: "🔄 Начать заново",
                  action: "command",
                  target: "/start"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          }
        ],
        connections: [
          {
            id: "conn-1",
            sourceNodeId: "start",
            targetNodeId: "interests_result",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-2",
            sourceNodeId: "interests_result",
            targetNodeId: "final_message",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-3",
            sourceNodeId: "interests_result",
            targetNodeId: "start",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-4",
            sourceNodeId: "final_message",
            targetNodeId: "start",
            sourceHandle: "source",
            targetHandle: "target"
          }
        ]
      }
    });

    console.log('✅ Шаблон сбора интересов создан');

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
              nextNodeId: "join_request",
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
                  action: "goto",
                  buttonType: "option",
                  target: "gender_selection",
                  value: "yes"
                },
                {
                  id: "btn-no",
                  text: "Нет 🙅",
                  action: "goto",
                  buttonType: "option",
                  target: "decline_response",
                  value: "no"
                }
              ],
              oneTimeKeyboard: true,
              resizeKeyboard: true,
              markdown: false
            }
          },
          {
            id: "decline_response",
            type: "message",
            position: { x: 450, y: 250 },
            data: {
              messageText: "Понятно! Если передумаешь, напиши /start! 😊",
              keyboardType: "none",
              buttons: [],
              removeKeyboard: true,
              markdown: false
            }
          },
          {
            id: "gender_selection",
            type: "message",
            position: { x: 100, y: 450 },
            data: {
              messageText: "Укажи свой пол: 👨👩",
              keyboardType: "inline",
              collectUserInput: true,
              inputVariable: "gender",
              buttons: [
                {
                  id: "btn-male",
                  text: "Мужчина 👨",
                  action: "goto",
                  buttonType: "option",
                  target: "name_input",
                  value: "male"
                },
                {
                  id: "btn-female",
                  text: "Женщина 👩",
                  action: "goto",
                  buttonType: "option",
                  target: "name_input",
                  value: "female"
                }
              ],
              oneTimeKeyboard: true,
              resizeKeyboard: true,
              markdown: false
            }
          },
          {
            id: "name_input",
            type: "message",
            position: { x: 450, y: 450 },
            data: {
              messageText: "Как тебя зовут? ✏️\n\nНапиши своё имя в сообщении:",
              keyboardType: "none",
              buttons: [],
              collectUserInput: true,
              enableTextInput: true,
              inputVariable: "user_name",
              nextNodeId: "age_input",
              markdown: false
            }
          },
          {
            id: "age_input",
            type: "message",
            position: { x: 800, y: 450 },
            data: {
              messageText: "Сколько тебе лет? 🎂\n\nНапиши свой возраст числом (например, 25):",
              keyboardType: "none",
              buttons: [],
              collectUserInput: true,
              enableTextInput: true,
              inputVariable: "user_age",
              nextNodeId: "metro_selection",
              markdown: false
            }
          },
          {
            id: "metro_selection",
            type: "message",
            position: { x: 100, y: 650 },
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
                  buttonType: "option",
                  target: "red_line"
                },
                {
                  id: "btn-blue",
                  text: "Синяя ветка 🟦",
                  action: "selection",
                  buttonType: "option",
                  target: "blue_line"
                },
                {
                  id: "btn-green",
                  text: "Зелёная ветка 🟩",
                  action: "selection",
                  buttonType: "option",
                  target: "green_line"
                },
                {
                  id: "btn-orange",
                  text: "Оранжевая ветка 🟧",
                  action: "selection",
                  buttonType: "option",
                  target: "orange_line"
                },
                {
                  id: "btn-purple",
                  text: "Фиолетовая ветка 🟪",
                  action: "selection",
                  buttonType: "option",
                  target: "purple_line"
                },
                {
                  id: "btn-lo",
                  text: "Я из ЛО 🏡",
                  action: "selection",
                  buttonType: "option",
                  target: "lo_cities"
                },
                {
                  id: "btn-not-spb",
                  text: "Я не в Питере 🌍",
                  action: "selection",
                  buttonType: "option",
                  target: "not_in_spb"
                }
              ],
              oneTimeKeyboard: true,
              resizeKeyboard: true,
              markdown: false
            }
          },
          {
            id: "interests_categories",
            type: "message",
            position: { x: 450, y: 650 },
            data: {
              messageText: "Выбери категории интересов 🎯:",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-hobby",
                  text: "🎮 Хобби",
                  action: "goto",
                  buttonType: "option",
                  target: "hobby_interests"
                },
                {
                  id: "btn-social",
                  text: "👥 Социальная жизнь",
                  action: "goto",
                  buttonType: "option",
                  target: "social_interests"
                },
                {
                  id: "btn-creativity",
                  text: "🎨 Творчество",
                  action: "goto",
                  buttonType: "option",
                  target: "creativity_interests"
                },
                {
                  id: "btn-active",
                  text: "🏃 Активный образ жизни",
                  action: "goto",
                  buttonType: "option",
                  target: "active_interests"
                },
                {
                  id: "btn-food",
                  text: "🍕 Еда и напитки",
                  action: "goto",
                  buttonType: "option",
                  target: "food_interests"
                },
                {
                  id: "btn-sport",
                  text: "⚽ Спорт",
                  action: "goto",
                  buttonType: "option",
                  target: "sport_interests"
                },
                {
                  id: "btn-home",
                  text: "🏠 Время дома",
                  action: "goto",
                  buttonType: "option",
                  target: "home_interests"
                },
                {
                  id: "btn-travel",
                  text: "✈️ Путешествия",
                  action: "goto",
                  buttonType: "option",
                  target: "travel_interests"
                },
                {
                  id: "btn-pets",
                  text: "🐾 Домашние животные",
                  action: "goto",
                  buttonType: "option",
                  target: "pets_interests"
                },
                {
                  id: "btn-movies",
                  text: "🎬 Фильмы и сериалы",
                  action: "goto",
                  buttonType: "option",
                  target: "movies_interests"
                },
                {
                  id: "btn-music",
                  text: "🎵 Музыка",
                  action: "goto",
                  buttonType: "option",
                  target: "music_interests"
                }
              ],
              markdown: false
            }
          },
          {
            id: "hobby_interests",
            type: "message",
            position: { x: 800, y: 650 },
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
                  buttonType: "option",
                  target: "computer_games"
                },
                {
                  id: "hobby-fashion",
                  text: "💄 Мода и красота",
                  action: "selection",
                  buttonType: "option",
                  target: "fashion"
                },
                {
                  id: "hobby-cars",
                  text: "🚗 Автомобили",
                  action: "selection",
                  buttonType: "option",
                  target: "cars"
                },
                {
                  id: "hobby-it",
                  text: "💻 IT и технологии",
                  action: "selection",
                  buttonType: "option",
                  target: "it_tech"
                },
                {
                  id: "hobby-psychology",
                  text: "🧠 Психология",
                  action: "selection",
                  buttonType: "option",
                  target: "psychology"
                },
                {
                  id: "hobby-astrology",
                  text: "🔮 Астрология",
                  action: "selection",
                  buttonType: "option",
                  target: "astrology"
                },
                {
                  id: "hobby-meditation",
                  text: "🧘 Медитации",
                  action: "selection",
                  buttonType: "option",
                  target: "meditation"
                },
                {
                  id: "hobby-comics",
                  text: "📚 Комиксы",
                  action: "selection",
                  buttonType: "option",
                  target: "comics"
                },
                {
                  id: "btn-back-categories",
                  text: "⬅️ К категориям",
                  action: "goto",
                  buttonType: "navigation",
                  target: "interests_categories"
                }
              ],
              markdown: false
            }
          },
          {
            id: "marital_status",
            type: "message",
            position: { x: 100, y: 700 },
            data: {
              messageText: "Выбери семейное положение 💍:",
              keyboardType: "inline",
              collectUserInput: true,
              inputVariable: "marital_status",
              buttons: [
                {
                  id: "marital-single-m",
                  text: "💔 Не женат",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation",
                  value: "single_male"
                },
                {
                  id: "marital-single-f",
                  text: "💔 Не замужем",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation",
                  value: "single_female"
                },
                {
                  id: "marital-dating",
                  text: "💕 Встречаюсь",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation",
                  value: "dating"
                },
                {
                  id: "marital-engaged",
                  text: "💍 Помолвлен(а)",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation",
                  value: "engaged"
                },
                {
                  id: "marital-married-m",
                  text: "💒 Женат",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation",
                  value: "married_male"
                },
                {
                  id: "marital-married-f",
                  text: "💒 Замужем",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation",
                  value: "married_female"
                },
                {
                  id: "marital-civil",
                  text: "🤝 В гражданском браке",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation",
                  value: "civil_marriage"
                },
                {
                  id: "marital-love",
                  text: "😍 Влюблён",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation",
                  value: "in_love"
                },
                {
                  id: "marital-complicated",
                  text: "🤷 Всё сложно",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation",
                  value: "complicated"
                },
                {
                  id: "marital-searching",
                  text: "🔍 В активном поиске",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation",
                  value: "searching"
                }
              ],
              oneTimeKeyboard: true,
              resizeKeyboard: true,
              markdown: false
            }
          },
          {
            id: "sexual_orientation",
            type: "message",
            position: { x: 400, y: 700 },
            data: {
              messageText: "Укажи свою сексуальную ориентацию 🌈:",
              keyboardType: "inline",
              collectUserInput: true,
              inputVariable: "sexual_orientation",
              buttons: [
                {
                  id: "orientation-hetero",
                  text: "Гетеро 😊",
                  action: "goto",
                  buttonType: "option",
                  target: "telegram_channel",
                  value: "heterosexual"
                },
                {
                  id: "orientation-bi",
                  text: "Би 🌈",
                  action: "goto",
                  buttonType: "option",
                  target: "telegram_channel",
                  value: "bisexual"
                },
                {
                  id: "orientation-gay",
                  text: "Гей/Лесби 🏳️‍🌈",
                  action: "goto",
                  buttonType: "option",
                  target: "telegram_channel",
                  value: "homosexual"
                },
                {
                  id: "orientation-other",
                  text: "Другое ✍️",
                  action: "goto",
                  buttonType: "option",
                  target: "telegram_channel",
                  value: "other"
                }
              ],
              oneTimeKeyboard: true,
              resizeKeyboard: true,
              markdown: false
            }
          },
          {
            id: "telegram_channel",
            type: "message",
            position: { x: 700, y: 700 },
            data: {
              messageText: "Хочешь указать свой телеграм-канал? 📢",
              keyboardType: "inline",
              collectUserInput: true,
              inputVariable: "has_telegram_channel",
              buttons: [
                {
                  id: "channel-yes",
                  text: "Указать канал 📢",
                  action: "goto",
                  buttonType: "option",
                  target: "channel_input",
                  value: "yes"
                },
                {
                  id: "channel-no",
                  text: "Не указывать 🚫",
                  action: "goto",
                  buttonType: "option",
                  target: "extra_info",
                  value: "no"
                }
              ],
              oneTimeKeyboard: true,
              resizeKeyboard: true,
              markdown: false
            }
          },
          {
            id: "channel_input",
            type: "message",
            position: { x: 1000, y: 700 },
            data: {
              messageText: "Введи свой телеграм-канал 📢\n\n(можно ссылку, ник с @ или просто имя):",
              keyboardType: "none",
              buttons: [],
              collectUserInput: true,
              enableTextInput: true,
              inputVariable: "telegram_channel",
              nextNodeId: "extra_info",
              markdown: false
            }
          },
          {
            id: "extra_info",
            type: "message",
            position: { x: 100, y: 900 },
            data: {
              messageText: "Хочешь добавить что-то ещё о себе? 📝\n\nРасскажи о себе (до 2000 символов) или напиши 'пропустить':",
              keyboardType: "none",
              buttons: [],
              collectUserInput: true,
              enableTextInput: true,
              inputVariable: "extra_info",
              nextNodeId: "profile_complete",
              markdown: false
            }
          },
          {
            id: "profile_complete",
            type: "message",
            position: { x: 400, y: 900 },
            data: {
              messageText: "🎉 Отлично! Твой профиль заполнен!\n\n👤 Твоя анкета:\nПол: {gender}\nИмя: {user_name}\nВозраст: {user_age}\nИнтересы: {user_interests}\nСемейное положение: {marital_status}\nОриентация: {sexual_orientation}\n\nТеперь ты можешь получить ссылку на чат знакомств!",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-profile",
                  text: "👤 Мой профиль",
                  action: "goto",
                  buttonType: "option",
                  target: "show_profile"
                },
                {
                  id: "btn-chat-link",
                  text: "🔗 Ссылка на чат",
                  action: "goto",
                  buttonType: "option",
                  target: "chat_link"
                },
                {
                  id: "btn-edit",
                  text: "✏️ Редактировать профиль",
                  action: "goto",
                  buttonType: "option",
                  target: "edit_profile_menu"
                }
              ],
              markdown: false
            }
          },
          {
            id: "chat_link",
            type: "message",
            position: { x: 700, y: 900 },
            data: {
              messageText: "🔗 Актуальная ссылка на чат:\n\nhttps://t.me/+agkIVgCzHtY2ZTA6\n\nДобро пожаловать в сообщество ᴠᴨᴩᴏᴦʏᴧᴋᴇ! 🌟",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-back-profile",
                  text: "👤 Мой профиль",
                  action: "goto",
                  buttonType: "option",
                  target: "show_profile"
                }
              ],
              markdown: false
            }
          },
          {
            id: "show_profile",
            type: "message",
            position: { x: 1000, y: 900 },
            data: {
              messageText: "👤 Твой профиль:\n\nПол: {gender} {'👨' if gender == 'Мужчина' else '👩'}\nИмя: {user_name} ✏️\nВозраст: {user_age} 🎂\nИнтересы: {user_interests} 🎉\nСемейное положение: {marital_status} 💍\nСексуальная ориентация: {sexual_orientation} 🌈\nTelegram-канал: {telegram_channel} 📢\nДоп. информация: {extra_info} 📝",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-edit-profile",
                  text: "✏️ Редактировать",
                  action: "goto",
                  buttonType: "option",
                  target: "edit_profile_menu"
                },
                {
                  id: "btn-get-link",
                  text: "🔗 Ссылка на чат",
                  action: "goto",
                  buttonType: "option",
                  target: "chat_link"
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
            targetNodeId: "decline_response",
            sourceHandle: "btn-no",
            targetHandle: "target"
          },
          {
            id: "conn-3",
            sourceNodeId: "join_request",
            targetNodeId: "gender_selection",
            sourceHandle: "btn-yes",
            targetHandle: "target"
          },
          {
            id: "conn-4",
            sourceNodeId: "gender_selection",
            targetNodeId: "name_input",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-5",
            sourceNodeId: "name_input",
            targetNodeId: "age_input",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-6",
            sourceNodeId: "age_input",
            targetNodeId: "metro_selection",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-7",
            sourceNodeId: "metro_selection",
            targetNodeId: "interests_categories",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-8",
            sourceNodeId: "interests_categories",
            targetNodeId: "hobby_interests",
            sourceHandle: "btn-hobby",
            targetHandle: "target"
          },
          {
            id: "conn-9",
            sourceNodeId: "hobby_interests",
            targetNodeId: "interests_categories",
            sourceHandle: "btn-back-categories",
            targetHandle: "target"
          },
          {
            id: "conn-10",
            sourceNodeId: "hobby_interests",
            targetNodeId: "marital_status",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-11",
            sourceNodeId: "marital_status",
            targetNodeId: "sexual_orientation",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-12",
            sourceNodeId: "sexual_orientation",
            targetNodeId: "telegram_channel",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-13",
            sourceNodeId: "telegram_channel",
            targetNodeId: "channel_input",
            sourceHandle: "channel-yes",
            targetHandle: "target"
          },
          {
            id: "conn-14",
            sourceNodeId: "telegram_channel",
            targetNodeId: "extra_info",
            sourceHandle: "channel-no",
            targetHandle: "target"
          },
          {
            id: "conn-15",
            sourceNodeId: "channel_input",
            targetNodeId: "extra_info",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-16",
            sourceNodeId: "extra_info",
            targetNodeId: "profile_complete",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-17",
            sourceNodeId: "profile_complete",
            targetNodeId: "show_profile",
            sourceHandle: "btn-profile",
            targetHandle: "target"
          },
          {
            id: "conn-18",
            sourceNodeId: "profile_complete",
            targetNodeId: "chat_link",
            sourceHandle: "btn-chat-link",
            targetHandle: "target"
          },
          {
            id: "conn-19",
            sourceNodeId: "show_profile",
            targetNodeId: "chat_link",
            sourceHandle: "btn-get-link",
            targetHandle: "target"
          },
          {
            id: "conn-20",
            sourceNodeId: "chat_link",
            targetNodeId: "show_profile",
            sourceHandle: "btn-back-profile",
            targetHandle: "target"
          }
        ]
      }
    });

    console.log('✅ Шаблон VProgulke Bot создан');

    // Создаем базовый шаблон "Саша" - полнофункциональный бот знакомств
    await storage.createBotTemplate({
      name: "саша",
      description: "Базовый шаблон бота с простыми сообщениями для начинающих",
      category: "official",
      tags: ["знакомства", "профиль", "метро", "интересы", "СПб", "анкета"],
      isPublic: 1,
      difficulty: "hard",
      authorName: "Система",
      version: "1.0.0",
      featured: 1,
      language: "ru",
      complexity: 9,
      estimatedTime: 45,
      data: JSON.parse("{\"nodes\": [{\"id\": \"start\", \"data\": {\"buttons\": [], \"command\": \"/start\", \"markdown\": false, \"nextNodeId\": \"join_request\", \"description\": \"Приветствие и источник\", \"messageText\": \"🌟 Привет от ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot!\\n\\nЭтот бот поможет тебе найти интересных людей в Санкт-Петербурге!\\n\\nОткуда ты узнал о нашем чате? 😎\", \"keyboardType\": \"none\", \"inputVariable\": \"user_source\", \"resizeKeyboard\": true, \"enableTextInput\": true, \"oneTimeKeyboard\": false, \"collectUserInput\": true, \"inputTargetNodeId\": \"join_request\"}, \"type\": \"start\", \"level\": 0, \"visited\": true, \"children\": [], \"position\": {\"x\": 100, \"y\": 100}}, {\"id\": \"join_request\", \"data\": {\"buttons\": [{\"id\": \"btn-yes\", \"text\": \"Да 😎\", \"value\": \"yes\", \"action\": \"goto\", \"target\": \"gender_selection\", \"buttonType\": \"option\"}, {\"id\": \"btn-no\", \"text\": \"Нет 🙅\", \"value\": \"no\", \"action\": \"goto\", \"target\": \"decline_response\", \"buttonType\": \"option\"}], \"markdown\": false, \"messageText\": \"Хочешь присоединиться к нашему чату? 🚀\", \"keyboardType\": \"inline\", \"inputVariable\": \"join_request_response\", \"resizeKeyboard\": true, \"oneTimeKeyboard\": true, \"collectUserInput\": true}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 500, \"y\": 100}}, {\"id\": \"decline_response\", \"data\": {\"buttons\": [], \"markdown\": false, \"messageText\": \"Понятно! Если передумаешь, напиши /start! 😊\", \"keyboardType\": \"none\", \"removeKeyboard\": true}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 900, \"y\": 100}}, {\"id\": \"gender_selection\", \"data\": {\"buttons\": [{\"id\": \"btn-male\", \"text\": \"Мужчина 👨\", \"value\": \"male\", \"action\": \"goto\", \"target\": \"name_input\", \"buttonType\": \"option\"}, {\"id\": \"btn-female\", \"text\": \"Женщина 👩\", \"value\": \"female\", \"action\": \"goto\", \"target\": \"name_input\", \"buttonType\": \"option\"}], \"markdown\": false, \"messageText\": \"Укажи свой пол: 👨👩\", \"keyboardType\": \"inline\", \"inputVariable\": \"gender\", \"resizeKeyboard\": true, \"oneTimeKeyboard\": true, \"collectUserInput\": true}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 1300, \"y\": 100}}, {\"id\": \"name_input\", \"data\": {\"buttons\": [], \"markdown\": false, \"nextNodeId\": \"age_input\", \"messageText\": \"Как тебя зовут? ✏️\\n\\nНапиши своё имя в сообщении:\", \"keyboardType\": \"none\", \"inputVariable\": \"user_name\", \"enableTextInput\": true, \"collectUserInput\": true, \"inputTargetNodeId\": \"age_input\"}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 1700, \"y\": 100}}, {\"id\": \"age_input\", \"data\": {\"buttons\": [], \"markdown\": false, \"nextNodeId\": \"metro_selection\", \"messageText\": \"Сколько тебе лет? 🎂\\n\\nНапиши свой возраст числом (например, 25):\", \"keyboardType\": \"none\", \"inputVariable\": \"user_age\", \"enableTextInput\": true, \"collectUserInput\": true, \"inputTargetNodeId\": \"metro_selection\"}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 2100, \"y\": 100}}, {\"id\": \"metro_selection\", \"data\": {\"buttons\": [{\"id\": \"btn-red\", \"text\": \"Красная ветка 🟥\", \"action\": \"selection\", \"target\": \"red_line\", \"buttonType\": \"option\"}, {\"id\": \"btn-blue\", \"text\": \"Синяя ветка 🟦\", \"action\": \"selection\", \"target\": \"blue_line\", \"buttonType\": \"option\"}, {\"id\": \"btn-green\", \"text\": \"Зелёная ветка 🟩\", \"action\": \"selection\", \"target\": \"green_line\", \"buttonType\": \"option\"}, {\"id\": \"btn-orange\", \"text\": \"Оранжевая ветка 🟧\", \"action\": \"selection\", \"target\": \"orange_line\", \"buttonType\": \"option\"}, {\"id\": \"btn-purple\", \"text\": \"Фиолетовая ветка 🟪\", \"action\": \"selection\", \"target\": \"purple_line\", \"buttonType\": \"option\"}, {\"id\": \"btn-lo\", \"text\": \"Я из ЛО 🏡\", \"action\": \"selection\", \"target\": \"lo_cities\", \"buttonType\": \"option\"}, {\"id\": \"btn-not-spb\", \"text\": \"Я не в Питере 🌍\", \"action\": \"selection\", \"target\": \"not_in_spb\", \"buttonType\": \"option\"}], \"markdown\": false, \"messageText\": \"На какой станции метро ты обычно бываешь? 🚇\\n\\nМожешь выбрать несколько веток:\", \"keyboardType\": \"inline\", \"resizeKeyboard\": true, \"oneTimeKeyboard\": true, \"multiSelectVariable\": \"metro_lines\", \"continueButtonTarget\": \"hobby_interests\", \"allowMultipleSelection\": true}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 2500, \"y\": 100}}, {\"id\": \"interests_categories\", \"data\": {\"buttons\": [{\"id\": \"btn-hobby\", \"text\": \"🎮 Хобби\", \"action\": \"goto\", \"target\": \"hobby_interests\", \"buttonType\": \"option\"}, {\"id\": \"btn-social\", \"text\": \"👥 Социальная жизнь\", \"action\": \"goto\", \"target\": \"social_interests\", \"buttonType\": \"option\"}, {\"id\": \"btn-creativity\", \"text\": \"🎨 Творчество\", \"action\": \"goto\", \"target\": \"creativity_interests\", \"buttonType\": \"option\"}, {\"id\": \"btn-active\", \"text\": \"🏃 Активный образ жизни\", \"action\": \"goto\", \"target\": \"active_interests\", \"buttonType\": \"option\"}, {\"id\": \"btn-food\", \"text\": \"🍕 Еда и напитки\", \"action\": \"goto\", \"target\": \"food_interests\", \"buttonType\": \"option\"}, {\"id\": \"btn-sport\", \"text\": \"⚽ Спорт\", \"action\": \"goto\", \"target\": \"sport_interests\", \"buttonType\": \"option\"}, {\"id\": \"btn-home\", \"text\": \"🏠 Время дома\", \"action\": \"goto\", \"target\": \"home_interests\", \"buttonType\": \"option\"}, {\"id\": \"btn-travel\", \"text\": \"✈️ Путешествия\", \"action\": \"goto\", \"target\": \"travel_interests\", \"buttonType\": \"option\"}, {\"id\": \"btn-pets\", \"text\": \"🐾 Домашние животные\", \"action\": \"goto\", \"target\": \"pets_interests\", \"buttonType\": \"option\"}, {\"id\": \"btn-movies\", \"text\": \"🎬 Фильмы и сериалы\", \"action\": \"goto\", \"target\": \"movies_interests\", \"buttonType\": \"option\"}, {\"id\": \"btn-music\", \"text\": \"🎵 Музыка\", \"action\": \"goto\", \"target\": \"music_interests\", \"buttonType\": \"option\"}], \"markdown\": false, \"messageText\": \"Выбери категории интересов 🎯:\", \"keyboardType\": \"inline\"}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 2900, \"y\": 100}}, {\"id\": \"hobby_interests\", \"data\": {\"buttons\": [{\"id\": \"hobby-games\", \"text\": \"🎮 Компьютерные игры\", \"action\": \"selection\", \"target\": \"computer_games\", \"buttonType\": \"option\"}, {\"id\": \"hobby-fashion\", \"text\": \"💄 Мода и красота\", \"action\": \"selection\", \"target\": \"fashion\", \"buttonType\": \"option\"}, {\"id\": \"hobby-cars\", \"text\": \"🚗 Автомобили\", \"action\": \"selection\", \"target\": \"cars\", \"buttonType\": \"option\"}, {\"id\": \"hobby-it\", \"text\": \"💻 IT и технологии\", \"action\": \"selection\", \"target\": \"it_tech\", \"buttonType\": \"option\"}, {\"id\": \"hobby-psychology\", \"text\": \"🧠 Психология\", \"action\": \"selection\", \"target\": \"psychology\", \"buttonType\": \"option\"}, {\"id\": \"hobby-astrology\", \"text\": \"🔮 Астрология\", \"action\": \"selection\", \"target\": \"astrology\", \"buttonType\": \"option\"}, {\"id\": \"hobby-meditation\", \"text\": \"🧘 Медитации\", \"action\": \"selection\", \"target\": \"meditation\", \"buttonType\": \"option\"}, {\"id\": \"hobby-comics\", \"text\": \"📚 Комиксы\", \"action\": \"selection\", \"target\": \"comics\", \"buttonType\": \"option\"}, {\"id\": \"btn-back-categories\", \"text\": \"⬅️ К категориям\", \"action\": \"goto\", \"target\": \"interests_categories\", \"buttonType\": \"navigation\"}], \"markdown\": false, \"messageText\": \"Выбери интересы в категории 🎮 Хобби:\", \"keyboardType\": \"inline\", \"multiSelectVariable\": \"user_interests\", \"continueButtonTarget\": \"marital_status\", \"allowMultipleSelection\": true}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 3300, \"y\": 100}}, {\"id\": \"marital_status\", \"data\": {\"buttons\": [{\"id\": \"marital-single-m\", \"text\": \"💔 Не женат\", \"value\": \"single_male\", \"action\": \"goto\", \"target\": \"sexual_orientation\", \"buttonType\": \"option\"}, {\"id\": \"marital-single-f\", \"text\": \"💔 Не замужем\", \"value\": \"single_female\", \"action\": \"goto\", \"target\": \"sexual_orientation\", \"buttonType\": \"option\"}, {\"id\": \"marital-dating\", \"text\": \"💕 Встречаюсь\", \"value\": \"dating\", \"action\": \"goto\", \"target\": \"sexual_orientation\", \"buttonType\": \"option\"}, {\"id\": \"marital-engaged\", \"text\": \"💍 Помолвлен(а)\", \"value\": \"engaged\", \"action\": \"goto\", \"target\": \"sexual_orientation\", \"buttonType\": \"option\"}, {\"id\": \"marital-married-m\", \"text\": \"💒 Женат\", \"value\": \"married_male\", \"action\": \"goto\", \"target\": \"sexual_orientation\", \"buttonType\": \"option\"}, {\"id\": \"marital-married-f\", \"text\": \"💒 Замужем\", \"value\": \"married_female\", \"action\": \"goto\", \"target\": \"sexual_orientation\", \"buttonType\": \"option\"}, {\"id\": \"marital-civil\", \"text\": \"🤝 В гражданском браке\", \"value\": \"civil_marriage\", \"action\": \"goto\", \"target\": \"sexual_orientation\", \"buttonType\": \"option\"}, {\"id\": \"marital-love\", \"text\": \"😍 Влюблён\", \"value\": \"in_love\", \"action\": \"goto\", \"target\": \"sexual_orientation\", \"buttonType\": \"option\"}, {\"id\": \"marital-complicated\", \"text\": \"🤷 Всё сложно\", \"value\": \"complicated\", \"action\": \"goto\", \"target\": \"sexual_orientation\", \"buttonType\": \"option\"}, {\"id\": \"marital-searching\", \"text\": \"🔍 В активном поиске\", \"value\": \"searching\", \"action\": \"goto\", \"target\": \"sexual_orientation\", \"buttonType\": \"option\"}], \"markdown\": false, \"messageText\": \"Выбери семейное положение 💍:\", \"keyboardType\": \"inline\", \"inputVariable\": \"marital_status\", \"resizeKeyboard\": true, \"oneTimeKeyboard\": true, \"collectUserInput\": true}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 3700, \"y\": 100}}, {\"id\": \"sexual_orientation\", \"data\": {\"buttons\": [{\"id\": \"orientation-hetero\", \"text\": \"Гетеро 😊\", \"value\": \"heterosexual\", \"action\": \"goto\", \"target\": \"telegram_channel\", \"buttonType\": \"option\"}, {\"id\": \"orientation-bi\", \"text\": \"Би 🌈\", \"value\": \"bisexual\", \"action\": \"goto\", \"target\": \"telegram_channel\", \"buttonType\": \"option\"}, {\"id\": \"orientation-gay\", \"text\": \"Гей/Лесби 🏳️‍🌈\", \"value\": \"homosexual\", \"action\": \"goto\", \"target\": \"telegram_channel\", \"buttonType\": \"option\"}, {\"id\": \"orientation-other\", \"text\": \"Другое ✍️\", \"value\": \"other\", \"action\": \"goto\", \"target\": \"telegram_channel\", \"buttonType\": \"option\"}], \"markdown\": false, \"messageText\": \"Укажи свою сексуальную ориентацию 🌈:\", \"keyboardType\": \"inline\", \"inputVariable\": \"sexual_orientation\", \"resizeKeyboard\": true, \"oneTimeKeyboard\": true, \"collectUserInput\": true}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 4100, \"y\": 100}}, {\"id\": \"telegram_channel\", \"data\": {\"buttons\": [{\"id\": \"channel-yes\", \"text\": \"Указать канал 📢\", \"value\": \"yes\", \"action\": \"goto\", \"target\": \"channel_input\", \"buttonType\": \"option\"}, {\"id\": \"channel-no\", \"text\": \"Не указывать 🚫\", \"value\": \"no\", \"action\": \"goto\", \"target\": \"extra_info\", \"buttonType\": \"option\"}], \"markdown\": false, \"messageText\": \"Хочешь указать свой телеграм-канал? 📢\", \"keyboardType\": \"inline\", \"inputVariable\": \"has_telegram_channel\", \"resizeKeyboard\": true, \"oneTimeKeyboard\": true, \"collectUserInput\": true}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 4500, \"y\": 100}}, {\"id\": \"channel_input\", \"data\": {\"buttons\": [], \"markdown\": false, \"nextNodeId\": \"extra_info\", \"messageText\": \"Введи свой телеграм-канал 📢\\n\\n(можно ссылку, ник с @ или просто имя):\", \"keyboardType\": \"none\", \"inputVariable\": \"telegram_channel\", \"enableTextInput\": true, \"collectUserInput\": true, \"inputTargetNodeId\": \"extra_info\"}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 4900, \"y\": 100}}, {\"id\": \"extra_info\", \"data\": {\"buttons\": [], \"markdown\": false, \"nextNodeId\": \"profile_complete\", \"messageText\": \"Хочешь добавить что-то ещё о себе? 📝\\n\\nРасскажи о себе (до 2000 символов) или напиши 'пропустить':\", \"keyboardType\": \"none\", \"inputVariable\": \"extra_info\", \"enableTextInput\": true, \"collectUserInput\": true, \"inputTargetNodeId\": \"profile_complete\"}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 5300, \"y\": 100}}, {\"id\": \"profile_complete\", \"data\": {\"buttons\": [{\"id\": \"btn-profile\", \"text\": \"👤 Моя анкета\", \"action\": \"goto\", \"target\": \"show_profile\", \"buttonType\": \"option\"}, {\"id\": \"btn-chat-link\", \"text\": \"🔗 Получить ссылку на чат\", \"action\": \"goto\", \"target\": \"chat_link\", \"buttonType\": \"option\"}], \"markdown\": false, \"messageText\": \"🎉 Отлично! Твой профиль заполнен!\\n\\n👤 Твоя анкета:\\nПол: {gender}\\nИмя: {user_name}\\nВозраст: {user_age}\\nМетро: {metro_lines}\\nИнтересы: {user_interests}\\nСемейное положение: {marital_status}\\nОриентация: {sexual_orientation}\\nТГ-канал: {telegram_channel}\\nО себе: {extra_info}\", \"keyboardType\": \"inline\", \"resizeKeyboard\": true, \"oneTimeKeyboard\": true}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 5700, \"y\": 100}}, {\"id\": \"show_profile\", \"data\": {\"buttons\": [{\"id\": \"btn-get-link\", \"text\": \"🔗 Получить ссылку на чат\", \"action\": \"goto\", \"target\": \"chat_link\", \"buttonType\": \"option\"}], \"markdown\": false, \"messageText\": \"👤 Твой профиль:\\n\\nПол: {gender} {'👨' if gender == 'Мужчина' else '👩'}\\nИмя: {user_name} ✏️\\nВозраст: {user_age} 🎂\\nМетро: {metro_lines} 🚇\\nИнтересы: {user_interests} 🎯\\nСемейное положение: {marital_status} 💍\\nОриентация: {sexual_orientation} 🌈\\nТГ-канал: {telegram_channel} 📢\\nО себе: {extra_info} 📝\", \"keyboardType\": \"inline\", \"resizeKeyboard\": true, \"oneTimeKeyboard\": true}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 6100, \"y\": 100}}, {\"id\": \"chat_link\", \"data\": {\"buttons\": [{\"id\": \"btn-back-profile\", \"text\": \"👤 К профилю\", \"action\": \"goto\", \"target\": \"show_profile\", \"buttonType\": \"option\"}], \"markdown\": false, \"messageText\": \"🔗 Актуальная ссылка на чат:\\n\\nhttps://t.me/+agkIVgCzHtY2ZTA6\\n\\nДобро пожаловать в сообщество ᴠᴨᴩᴏᴦʏᴧᴋᴇ! 🎉\", \"keyboardType\": \"inline\", \"resizeKeyboard\": true, \"oneTimeKeyboard\": true}, \"type\": \"message\", \"level\": 0, \"visited\": false, \"children\": [], \"position\": {\"x\": 6500, \"y\": 100}}], \"connections\": [{\"id\": \"connection-1\", \"sourceHandle\": \"source\", \"sourceNodeId\": \"start\", \"targetHandle\": \"target\", \"targetNodeId\": \"join_request\"}, {\"id\": \"connection-2\", \"sourceHandle\": \"btn-yes\", \"sourceNodeId\": \"join_request\", \"targetHandle\": \"target\", \"targetNodeId\": \"gender_selection\"}, {\"id\": \"connection-3\", \"sourceHandle\": \"btn-no\", \"sourceNodeId\": \"join_request\", \"targetHandle\": \"target\", \"targetNodeId\": \"decline_response\"}, {\"id\": \"connection-4\", \"sourceHandle\": \"btn-male\", \"sourceNodeId\": \"gender_selection\", \"targetHandle\": \"target\", \"targetNodeId\": \"name_input\"}, {\"id\": \"connection-5\", \"sourceHandle\": \"btn-female\", \"sourceNodeId\": \"gender_selection\", \"targetHandle\": \"target\", \"targetNodeId\": \"name_input\"}, {\"id\": \"connection-6\", \"sourceHandle\": \"source\", \"sourceNodeId\": \"name_input\", \"targetHandle\": \"target\", \"targetNodeId\": \"age_input\"}, {\"id\": \"connection-7\", \"sourceHandle\": \"source\", \"sourceNodeId\": \"age_input\", \"targetHandle\": \"target\", \"targetNodeId\": \"metro_selection\"}, {\"id\": \"connection-8\", \"sourceHandle\": \"source\", \"sourceNodeId\": \"metro_selection\", \"targetHandle\": \"target\", \"targetNodeId\": \"hobby_interests\"}, {\"id\": \"connection-9\", \"sourceHandle\": \"btn-back-categories\", \"sourceNodeId\": \"hobby_interests\", \"targetHandle\": \"target\", \"targetNodeId\": \"interests_categories\"}, {\"id\": \"connection-10\", \"sourceHandle\": \"btn-hobby\", \"sourceNodeId\": \"interests_categories\", \"targetHandle\": \"target\", \"targetNodeId\": \"hobby_interests\"}, {\"id\": \"connection-11\", \"sourceHandle\": \"source\", \"sourceNodeId\": \"hobby_interests\", \"targetHandle\": \"target\", \"targetNodeId\": \"marital_status\"}, {\"id\": \"connection-12\", \"sourceHandle\": \"marital-single-m\", \"sourceNodeId\": \"marital_status\", \"targetHandle\": \"target\", \"targetNodeId\": \"sexual_orientation\"}, {\"id\": \"connection-13\", \"sourceHandle\": \"marital-single-f\", \"sourceNodeId\": \"marital_status\", \"targetHandle\": \"target\", \"targetNodeId\": \"sexual_orientation\"}, {\"id\": \"connection-14\", \"sourceHandle\": \"marital-dating\", \"sourceNodeId\": \"marital_status\", \"targetHandle\": \"target\", \"targetNodeId\": \"sexual_orientation\"}, {\"id\": \"connection-15\", \"sourceHandle\": \"orientation-hetero\", \"sourceNodeId\": \"sexual_orientation\", \"targetHandle\": \"target\", \"targetNodeId\": \"telegram_channel\"}, {\"id\": \"connection-16\", \"sourceHandle\": \"channel-yes\", \"sourceNodeId\": \"telegram_channel\", \"targetHandle\": \"target\", \"targetNodeId\": \"channel_input\"}, {\"id\": \"connection-17\", \"sourceHandle\": \"channel-no\", \"sourceNodeId\": \"telegram_channel\", \"targetHandle\": \"target\", \"targetNodeId\": \"extra_info\"}, {\"id\": \"connection-18\", \"sourceHandle\": \"source\", \"sourceNodeId\": \"channel_input\", \"targetHandle\": \"target\", \"targetNodeId\": \"extra_info\"}, {\"id\": \"connection-19\", \"sourceHandle\": \"source\", \"sourceNodeId\": \"extra_info\", \"targetHandle\": \"target\", \"targetNodeId\": \"profile_complete\"}, {\"id\": \"connection-20\", \"sourceHandle\": \"btn-profile\", \"sourceNodeId\": \"profile_complete\", \"targetHandle\": \"target\", \"targetNodeId\": \"show_profile\"}, {\"id\": \"connection-21\", \"sourceHandle\": \"btn-chat-link\", \"sourceNodeId\": \"profile_complete\", \"targetHandle\": \"target\", \"targetNodeId\": \"chat_link\"}, {\"id\": \"connection-22\", \"sourceHandle\": \"btn-get-link\", \"sourceNodeId\": \"show_profile\", \"targetHandle\": \"target\", \"targetNodeId\": \"chat_link\"}, {\"id\": \"connection-23\", \"sourceHandle\": \"btn-back-profile\", \"sourceNodeId\": \"chat_link\", \"targetHandle\": \"target\", \"targetNodeId\": \"show_profile\"}]}")
    });

    console.log('✅ Базовый шаблон "саша" создан');

    // Создаем базовый шаблон "Маша" - простой бот для знакомств
    await storage.createBotTemplate({
      name: "маша",
      description: "Простой базовый шаблон для знакомств с основными функциями",
      category: "official",
      tags: ["знакомства", "простой", "базовый", "имя", "пол"],
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
            id: "start",
            type: "start",
            position: { x: 140, y: 100 },
            data: {
              command: "/start",
              description: "Приветствие и источник",
              messageText: "🌟 Привет от ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot!\n\nЭтот бот поможет тебе найти интересных людей в Санкт-Петербурге!\n\nОткуда ты узнал о нашем чате? 😎",
              keyboardType: "none",
              inputVariable: "user_source",
              resizeKeyboard: true,
              enableTextInput: true,
              oneTimeKeyboard: false,
              collectUserInput: true,
              nextNodeId: "gender_selection",
              markdown: false
            }
          },
          {
            id: "gender_selection",
            type: "message",
            position: { x: 540, y: 100 },
            data: {
              messageText: "Укажи свой пол: 👨👩",
              keyboardType: "inline",
              inputVariable: "gender",
              resizeKeyboard: true,
              oneTimeKeyboard: true,
              collectUserInput: true,
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
            position: { x: 940, y: 100 },
            data: {
              messageText: "Как тебя зовут? ✏️\n\nНапиши своё имя в сообщении:",
              keyboardType: "none",
              inputVariable: "user_name",
              enableTextInput: true,
              collectUserInput: true,
              nextNodeId: "profile_complete",
              markdown: false,
              buttons: []
            }
          },
          {
            id: "profile_complete",
            type: "message",
            position: { x: 1340, y: 100 },
            data: {
              messageText: "🎉 Отлично! Основная информация собрана!\n\n👤 Твои данные:\nПол: {gender}\nИмя: {user_name}\nИсточник: {user_source}\n\nСпасибо за регистрацию!",
              keyboardType: "inline",
              resizeKeyboard: true,
              oneTimeKeyboard: true,
              buttons: [
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
            targetNodeId: "gender_selection",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-2",
            sourceNodeId: "gender_selection",
            targetNodeId: "name_input",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-3",
            sourceNodeId: "name_input",
            targetNodeId: "profile_complete",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-4",
            sourceNodeId: "profile_complete",
            targetNodeId: "start",
            sourceHandle: "source",
            targetHandle: "target"
          }
        ]
      }
    });

    console.log('✅ Базовый шаблон "маша" создан');
    console.log('✅ Системные шаблоны созданы');

  } catch (error) {
    console.error('Ошибка при создании шаблонов:', error);
  }
}

async function updateTemplatesWithFixedVariables() {
  console.log('🔄 Обновляем шаблоны с исправленными переменными...');
  await seedDefaultTemplates(true);
  console.log('✅ Шаблоны обновлены с исправленными переменными');
}

async function recreateTemplatesWithHierarchy() {
  console.log('🔄 Пересоздаем шаблоны с иерархической компоновкой...');
  await seedDefaultTemplates(true);
  console.log('✅ Шаблоны пересозданы с иерархической компоновкой');
}

export { seedDefaultTemplates, updateTemplatesWithFixedVariables, recreateTemplatesWithHierarchy };