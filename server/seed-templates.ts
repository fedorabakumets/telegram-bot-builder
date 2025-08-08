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
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Приветствие и источник",
              messageText: "🌟 Привет от ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot!\n\nЭтот бот поможет тебе найти интересных людей в Санкт-Петербурге!\n\nОткуда ты узнал о нашем чате? 😎",
              keyboardType: "none",
              buttons: [],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          },
          {
            id: "source_input",
            type: "message",
            position: { x: 400, y: 100 },
            data: {
              messageText: "Откуда ты узнал о нашем чате? 😎\n\nНапиши в сообщении:",
              keyboardType: "none",
              buttons: [],
              collectUserInput: true,
              enableTextInput: true,
              inputVariable: "user_source",
              markdown: false
            }
          },
          {
            id: "join_request",
            type: "message",
            position: { x: 700, y: 100 },
            data: {
              messageText: "Хочешь присоединиться к нашему чату? 🚀",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-yes",
                  text: "Да 😎",
                  action: "goto",
                  buttonType: "option",
                  target: "gender_selection"
                },
                {
                  id: "btn-no",
                  text: "Нет 🙅",
                  action: "goto",
                  buttonType: "option",
                  target: "decline_response"
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
            position: { x: 1000, y: 100 },
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
            position: { x: 100, y: 300 },
            data: {
              messageText: "Укажи свой пол: 👨👩",
              keyboardType: "inline",
              buttons: [
                {
                  id: "btn-male",
                  text: "Мужчина 👨",
                  action: "goto",
                  buttonType: "option",
                  target: "name_input"
                },
                {
                  id: "btn-female",
                  text: "Женщина 👩",
                  action: "goto",
                  buttonType: "option",
                  target: "name_input"
                }
              ],
              oneTimeKeyboard: true,
              resizeKeyboard: true,
              inputVariable: "gender",
              markdown: false
            }
          },
          {
            id: "name_input",
            type: "message",
            position: { x: 400, y: 300 },
            data: {
              messageText: "Как тебя зовут? ✏️\n\nНапиши своё имя в сообщении:",
              keyboardType: "none",
              buttons: [],
              collectUserInput: true,
              enableTextInput: true,
              inputVariable: "user_name",
              markdown: false
            }
          },
          {
            id: "age_input",
            type: "message",
            position: { x: 700, y: 300 },
            data: {
              messageText: "Сколько тебе лет? 🎂\n\nНапиши свой возраст числом (например, 25):",
              keyboardType: "none",
              buttons: [],
              collectUserInput: true,
              enableTextInput: true,
              inputVariable: "user_age",
              markdown: false
            }
          },
          {
            id: "metro_selection",
            type: "message",
            position: { x: 100, y: 500 },
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
            position: { x: 400, y: 500 },
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
            position: { x: 700, y: 500 },
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
              buttons: [
                {
                  id: "marital-single-m",
                  text: "💔 Не женат",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation"
                },
                {
                  id: "marital-single-f",
                  text: "💔 Не замужем",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation"
                },
                {
                  id: "marital-dating",
                  text: "💕 Встречаюсь",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation"
                },
                {
                  id: "marital-engaged",
                  text: "💍 Помолвлен(а)",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation"
                },
                {
                  id: "marital-married-m",
                  text: "💒 Женат",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation"
                },
                {
                  id: "marital-married-f",
                  text: "💒 Замужем",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation"
                },
                {
                  id: "marital-civil",
                  text: "🤝 В гражданском браке",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation"
                },
                {
                  id: "marital-love",
                  text: "😍 Влюблён",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation"
                },
                {
                  id: "marital-complicated",
                  text: "🤷 Всё сложно",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation"
                },
                {
                  id: "marital-searching",
                  text: "🔍 В активном поиске",
                  action: "goto",
                  buttonType: "option",
                  target: "sexual_orientation"
                }
              ],
              oneTimeKeyboard: true,
              resizeKeyboard: true,
              inputVariable: "marital_status",
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
              buttons: [
                {
                  id: "orientation-hetero",
                  text: "Гетеро 😊",
                  action: "goto",
                  buttonType: "option",
                  target: "telegram_channel"
                },
                {
                  id: "orientation-bi",
                  text: "Би 🌈",
                  action: "goto",
                  buttonType: "option",
                  target: "telegram_channel"
                },
                {
                  id: "orientation-gay",
                  text: "Гей/Лесби 🏳️‍🌈",
                  action: "goto",
                  buttonType: "option",
                  target: "telegram_channel"
                },
                {
                  id: "orientation-other",
                  text: "Другое ✍️",
                  action: "goto",
                  buttonType: "option",
                  target: "telegram_channel"
                }
              ],
              oneTimeKeyboard: true,
              resizeKeyboard: true,
              inputVariable: "sexual_orientation",
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
              inputVariable: "has_telegram_channel",
              buttons: [
                {
                  id: "channel-yes",
                  text: "Указать канал 📢",
                  action: "goto",
                  buttonType: "option",
                  target: "channel_input"
                },
                {
                  id: "channel-no",
                  text: "Не указывать 🚫",
                  action: "goto",
                  buttonType: "option",
                  target: "extra_info"
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
            targetNodeId: "source_input",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-2",
            sourceNodeId: "source_input",
            targetNodeId: "join_request",
            sourceHandle: "source",
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
            sourceNodeId: "join_request",
            targetNodeId: "gender_selection",
            sourceHandle: "btn-yes",
            targetHandle: "target"
          },
          {
            id: "conn-5",
            sourceNodeId: "gender_selection",
            targetNodeId: "name_input",
            sourceHandle: "source",
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
            id: "conn-12",
            sourceNodeId: "marital_status",
            targetNodeId: "sexual_orientation",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-13",
            sourceNodeId: "sexual_orientation",
            targetNodeId: "telegram_channel",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-14",
            sourceNodeId: "telegram_channel",
            targetNodeId: "channel_input",
            sourceHandle: "channel-yes",
            targetHandle: "target"
          },
          {
            id: "conn-15",
            sourceNodeId: "telegram_channel",
            targetNodeId: "extra_info",
            sourceHandle: "channel-no",
            targetHandle: "target"
          },
          {
            id: "conn-16",
            sourceNodeId: "channel_input",
            targetNodeId: "extra_info",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-17",
            sourceNodeId: "extra_info",
            targetNodeId: "profile_complete",
            sourceHandle: "source",
            targetHandle: "target"
          },
          {
            id: "conn-18",
            sourceNodeId: "profile_complete",
            targetNodeId: "show_profile",
            sourceHandle: "btn-profile",
            targetHandle: "target"
          },
          {
            id: "conn-19",
            sourceNodeId: "profile_complete",
            targetNodeId: "chat_link",
            sourceHandle: "btn-chat-link",
            targetHandle: "target"
          },
          {
            id: "conn-20",
            sourceNodeId: "show_profile",
            targetNodeId: "chat_link",
            sourceHandle: "btn-get-link",
            targetHandle: "target"
          },
          {
            id: "conn-21",
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