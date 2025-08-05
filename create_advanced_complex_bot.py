"""
Создание продвинутого комплексного тестового бота для реального запуска в Telegram
Этот бот включает множество команд, узлов, различные типы кнопок и сложные переходы
"""

import json
import random
import string

def generate_unique_id(prefix=""):
    """Генерирует уникальный ID"""
    return f"{prefix}{''.join(random.choices(string.ascii_letters + string.digits, k=8))}"

def create_advanced_complex_bot():
    """Создаёт продвинутый комплексный бот с множественными функциями"""
    
    # Счетчики для позиционирования узлов
    x_pos = 100
    y_pos = 100
    x_increment = 250
    y_increment = 200
    
    nodes = []
    connections = []
    
    # 1. Стартовый узел с приветствием и главным меню
    start_node = {
        "id": "start-node",
        "type": "command",
        "position": {"x": x_pos, "y": y_pos},
        "data": {
            "command": "/start",
            "messageText": "🚀 Добро пожаловать в Продвинутый Telegram Бот!\n\n"
                          "Этот бот демонстрирует все возможности конструктора:\n"
                          "• Множественные команды и обработчики\n"
                          "• Inline и Reply клавиатуры\n"
                          "• Медиаконтент и специальные кнопки\n"
                          "• Сложные переходы между узлами\n"
                          "• Обработка пользовательского ввода\n\n"
                          "Выберите раздел для изучения:",
            "keyboardType": "inline",
            "buttons": [
                {"id": generate_unique_id("btn"), "text": "📚 Основные команды", "action": "goto", "target": "commands-menu"},
                {"id": generate_unique_id("btn"), "text": "⌨️ Клавиатуры", "action": "goto", "target": "keyboards-menu"},
                {"id": generate_unique_id("btn"), "text": "🎮 Игры и развлечения", "action": "goto", "target": "games-menu"},
                {"id": generate_unique_id("btn"), "text": "🛠️ Настройки", "action": "goto", "target": "settings-menu"},
                {"id": generate_unique_id("btn"), "text": "🌐 Внешние ссылки", "action": "url", "url": "https://t.me/BotFather"}
            ]
        }
    }
    nodes.append(start_node)
    
    # 2. Меню основных команд
    x_pos += x_increment
    commands_menu = {
        "id": "commands-menu",
        "type": "message",
        "position": {"x": x_pos, "y": y_pos},
        "data": {
            "messageText": "📚 Основные команды бота:\n\n"
                          "Здесь собраны все доступные команды и их описания. "
                          "Вы можете протестировать любую из них прямо сейчас!",
            "keyboardType": "inline",
            "buttons": [
                {"id": generate_unique_id("btn"), "text": "ℹ️ Информация", "action": "goto", "target": "info-cmd"},
                {"id": generate_unique_id("btn"), "text": "📞 Контакты", "action": "goto", "target": "contacts-cmd"},
                {"id": generate_unique_id("btn"), "text": "❓ Помощь", "action": "goto", "target": "help-cmd"},
                {"id": generate_unique_id("btn"), "text": "📊 Статистика", "action": "goto", "target": "stats-cmd"},
                {"id": generate_unique_id("btn"), "text": "🔙 Назад в главное меню", "action": "goto", "target": "start-node"}
            ]
        }
    }
    nodes.append(commands_menu)
    
    # 3. Команда информации
    x_pos += x_increment
    info_cmd = {
        "id": "info-cmd",
        "type": "command",
        "position": {"x": x_pos, "y": y_pos},
        "data": {
            "command": "/info",
            "messageText": "ℹ️ Информация о боте:\n\n"
                          "🤖 Название: Продвинутый Тестовый Бот\n"
                          "📅 Создан: 2025\n"
                          "🛠️ Конструктор: Telegram Bot Builder\n"
                          "⚡ Статус: Активен\n"
                          "🔧 Функции: Полный набор\n\n"
                          "Этот бот создан для демонстрации всех возможностей конструктора ботов.",
            "keyboardType": "inline",
            "buttons": [
                {"id": generate_unique_id("btn"), "text": "📈 Детальная статистика", "action": "goto", "target": "detailed-stats"},
                {"id": generate_unique_id("btn"), "text": "🔧 Технические характеристики", "action": "goto", "target": "tech-specs"},
                {"id": generate_unique_id("btn"), "text": "🔙 К командам", "action": "goto", "target": "commands-menu"}
            ]
        }
    }
    nodes.append(info_cmd)
    
    # 4. Команда контактов
    x_pos = 100 + x_increment
    y_pos += y_increment
    contacts_cmd = {
        "id": "contacts-cmd",
        "type": "command",
        "position": {"x": x_pos, "y": y_pos},
        "data": {
            "command": "/contacts",
            "messageText": "📞 Контактная информация:\n\n"
                          "Если у вас есть вопросы или предложения, вы можете связаться с нами:\n\n"
                          "📧 Email: support@example.com\n"
                          "💬 Telegram: @support_bot\n"
                          "🌐 Сайт: https://example.com\n"
                          "📱 Телефон: +7 (900) 123-45-67\n\n"
                          "Мы всегда рады помочь!",
            "keyboardType": "reply",
            "buttons": [
                {"id": generate_unique_id("btn"), "text": "📧 Написать email", "action": "message"},
                {"id": generate_unique_id("btn"), "text": "📱 Поделиться контактом", "action": "contact"},
                {"id": generate_unique_id("btn"), "text": "📍 Отправить геолокацию", "action": "location"},
                {"id": generate_unique_id("btn"), "text": "🏠 Главное меню", "action": "goto", "target": "start-node"}
            ],
            "resizeKeyboard": True,
            "oneTimeKeyboard": False
        }
    }
    nodes.append(contacts_cmd)
    
    # 5. Команда помощи
    x_pos += x_increment
    help_cmd = {
        "id": "help-cmd",
        "type": "command",
        "position": {"x": x_pos, "y": y_pos},
        "data": {
            "command": "/help",
            "synonyms": ["помощь", "справка", "команды"],
            "messageText": "❓ Справка по боту:\n\n"
                          "Доступные команды:\n"
                          "• /start - Главное меню\n"
                          "• /info - Информация о боте\n"
                          "• /contacts - Контактные данные\n"
                          "• /help - Эта справка\n"
                          "• /games - Игры и развлечения\n"
                          "• /settings - Настройки\n"
                          "• /quiz - Начать викторину\n"
                          "• /weather - Узнать погоду\n\n"
                          "Также можете использовать синонимы команд!",
            "keyboardType": "inline",
            "buttons": [
                {"id": generate_unique_id("btn"), "text": "📖 Подробная справка", "action": "goto", "target": "detailed-help"},
                {"id": generate_unique_id("btn"), "text": "🎯 Быстрые команды", "action": "goto", "target": "quick-commands"},
                {"id": generate_unique_id("btn"), "text": "🔙 К командам", "action": "goto", "target": "commands-menu"}
            ]
        }
    }
    nodes.append(help_cmd)
    
    # 6. Статистика
    x_pos += x_increment
    stats_cmd = {
        "id": "stats-cmd",
        "type": "command",
        "position": {"x": x_pos, "y": y_pos},
        "data": {
            "command": "/stats",
            "messageText": "📊 Статистика бота:\n\n"
                          "👥 Всего пользователей: 1,234\n"
                          "📈 Активных сегодня: 89\n"
                          "💬 Сообщений обработано: 15,678\n"
                          "🎮 Игр сыграно: 456\n"
                          "⏱️ Время работы: 24/7\n"
                          "🔄 Последнее обновление: сегодня\n\n"
                          "Бот работает стабильно и обрабатывает все запросы!",
            "keyboardType": "inline",
            "buttons": [
                {"id": generate_unique_id("btn"), "text": "📈 Детальная аналитика", "action": "goto", "target": "analytics"},
                {"id": generate_unique_id("btn"), "text": "📋 Отчет по периодам", "action": "goto", "target": "reports"},
                {"id": generate_unique_id("btn"), "text": "🔙 К командам", "action": "goto", "target": "commands-menu"}
            ]
        }
    }
    nodes.append(stats_cmd)
    
    # 7. Меню клавиатур
    x_pos = 100
    y_pos += y_increment
    keyboards_menu = {
        "id": "keyboards-menu",
        "type": "message",
        "position": {"x": x_pos, "y": y_pos},
        "data": {
            "messageText": "⌨️ Демонстрация клавиатур:\n\n"
                          "Здесь вы можете протестировать различные типы клавиатур "
                          "и их возможности. Выберите тип для демонстрации:",
            "keyboardType": "inline",
            "buttons": [
                {"id": generate_unique_id("btn"), "text": "🔘 Inline кнопки", "action": "goto", "target": "inline-demo"},
                {"id": generate_unique_id("btn"), "text": "⌨️ Reply клавиатура", "action": "goto", "target": "reply-demo"},
                {"id": generate_unique_id("btn"), "text": "🔄 Смешанный режим", "action": "goto", "target": "mixed-demo"},
                {"id": generate_unique_id("btn"), "text": "🎛️ Специальные кнопки", "action": "goto", "target": "special-buttons"},
                {"id": generate_unique_id("btn"), "text": "🏠 Главное меню", "action": "goto", "target": "start-node"}
            ]
        }
    }
    nodes.append(keyboards_menu)
    
    # 8. Демо inline кнопок
    x_pos += x_increment
    inline_demo = {
        "id": "inline-demo",
        "type": "message",
        "position": {"x": x_pos, "y": y_pos},
        "data": {
            "messageText": "🔘 Демонстрация Inline кнопок:\n\n"
                          "Inline кнопки прикрепляются к сообщению и не исчезают. "
                          "Они идеально подходят для навигации и быстрых действий.",
            "keyboardType": "inline",
            "buttons": [
                {"id": generate_unique_id("btn"), "text": "1️⃣ Действие 1", "action": "goto", "target": "action-1"},
                {"id": generate_unique_id("btn"), "text": "2️⃣ Действие 2", "action": "goto", "target": "action-2"},
                {"id": generate_unique_id("btn"), "text": "3️⃣ Действие 3", "action": "goto", "target": "action-3"},
                {"id": generate_unique_id("btn"), "text": "🌐 Внешняя ссылка", "action": "url", "url": "https://telegram.org"},
                {"id": generate_unique_id("btn"), "text": "🔙 К клавиатурам", "action": "goto", "target": "keyboards-menu"}
            ]
        }
    }
    nodes.append(inline_demo)
    
    # 9. Демо reply клавиатуры
    x_pos += x_increment
    reply_demo = {
        "id": "reply-demo",
        "type": "message",
        "position": {"x": x_pos, "y": y_pos},
        "data": {
            "messageText": "⌨️ Демонстрация Reply клавиатуры:\n\n"
                          "Reply клавиатура заменяет стандартную клавиатуру пользователя. "
                          "Удобна для часто используемых команд и быстрого ввода.",
            "keyboardType": "reply",
            "buttons": [
                {"id": generate_unique_id("btn"), "text": "🎯 Быстрое действие", "action": "goto", "target": "quick-action"},
                {"id": generate_unique_id("btn"), "text": "📋 Меню функций", "action": "goto", "target": "functions-menu"},
                {"id": generate_unique_id("btn"), "text": "🔧 Настройки", "action": "goto", "target": "settings-menu"},
                {"id": generate_unique_id("btn"), "text": "❌ Скрыть клавиатуру", "action": "goto", "target": "hide-keyboard"}
            ],
            "resizeKeyboard": True,
            "oneTimeKeyboard": False
        }
    }
    nodes.append(reply_demo)
    
    # 10. Игровое меню
    x_pos = 100 + x_increment
    y_pos += y_increment
    games_menu = {
        "id": "games-menu",
        "type": "command",
        "position": {"x": x_pos, "y": y_pos},
        "data": {
            "command": "/games",
            "messageText": "🎮 Игры и развлечения:\n\n"
                          "Попробуйте наши мини-игры и развлекательные функции!",
            "keyboardType": "inline",
            "buttons": [
                {"id": generate_unique_id("btn"), "text": "🎲 Бросить кубик", "action": "goto", "target": "dice-game"},
                {"id": generate_unique_id("btn"), "text": "❓ Викторина", "action": "goto", "target": "quiz-start"},
                {"id": generate_unique_id("btn"), "text": "🎯 Угадай число", "action": "goto", "target": "guess-number"},
                {"id": generate_unique_id("btn"), "text": "🃏 Карточная игра", "action": "goto", "target": "card-game"},
                {"id": generate_unique_id("btn"), "text": "🏠 Главное меню", "action": "goto", "target": "start-node"}
            ]
        }
    }
    nodes.append(games_menu)
    
    # 11. Викторина
    x_pos += x_increment
    quiz_start = {
        "id": "quiz-start",
        "type": "command",
        "position": {"x": x_pos, "y": y_pos},
        "data": {
            "command": "/quiz",
            "messageText": "❓ Викторина: Telegram боты\n\n"
                          "Вопрос 1 из 3:\n"
                          "Какой API используется для создания Telegram ботов?",
            "keyboardType": "inline",
            "buttons": [
                {"id": generate_unique_id("btn"), "text": "A) REST API", "action": "goto", "target": "quiz-q2"},
                {"id": generate_unique_id("btn"), "text": "B) Bot API", "action": "goto", "target": "quiz-correct"},
                {"id": generate_unique_id("btn"), "text": "C) GraphQL", "action": "goto", "target": "quiz-wrong"},
                {"id": generate_unique_id("btn"), "text": "❌ Выйти из викторины", "action": "goto", "target": "games-menu"}
            ]
        }
    }
    nodes.append(quiz_start)
    
    # 12. Настройки
    x_pos += x_increment
    settings_menu = {
        "id": "settings-menu",
        "type": "command",
        "position": {"x": x_pos, "y": y_pos},
        "data": {
            "command": "/settings",
            "messageText": "🛠️ Настройки бота:\n\n"
                          "Здесь вы можете настроить различные параметры работы бота:",
            "keyboardType": "inline",
            "buttons": [
                {"id": generate_unique_id("btn"), "text": "🔔 Уведомления", "action": "goto", "target": "notifications"},
                {"id": generate_unique_id("btn"), "text": "🌍 Язык интерфейса", "action": "goto", "target": "language"},
                {"id": generate_unique_id("btn"), "text": "🎨 Тема оформления", "action": "goto", "target": "theme"},
                {"id": generate_unique_id("btn"), "text": "🔐 Приватность", "action": "goto", "target": "privacy"},
                {"id": generate_unique_id("btn"), "text": "🏠 Главное меню", "action": "goto", "target": "start-node"}
            ]
        }
    }
    nodes.append(settings_menu)
    
    # 13-17. Дополнительные узлы для полноты структуры
    additional_nodes = [
        {
            "id": "detailed-stats",
            "type": "message",
            "position": {"x": 100, "y": y_pos + y_increment},
            "data": {
                "messageText": "📈 Детальная статистика:\n\n"
                              "📊 Ежедневная активность:\n"
                              "• Понедельник: 145 пользователей\n"
                              "• Вторник: 189 пользователей\n"
                              "• Среда: 201 пользователь\n"
                              "• Четверг: 167 пользователей\n"
                              "• Пятница: 234 пользователя\n"
                              "• Суббота: 298 пользователей\n"
                              "• Воскресенье: 267 пользователей\n\n"
                              "🔥 Пиковое время: 18:00-21:00",
                "keyboardType": "inline",
                "buttons": [
                    {"id": generate_unique_id("btn"), "text": "🔙 Назад к статистике", "action": "goto", "target": "stats-cmd"}
                ]
            }
        },
        {
            "id": "dice-game",
            "type": "message",
            "position": {"x": 350, "y": y_pos + y_increment},
            "data": {
                "messageText": "🎲 Игра в кубики!\n\n"
                              "Нажмите кнопку, чтобы бросить кубик. "
                              "Посмотрим, какое число вам выпадет!",
                "keyboardType": "inline",
                "buttons": [
                    {"id": generate_unique_id("btn"), "text": "🎲 Бросить кубик", "action": "goto", "target": "dice-result"},
                    {"id": generate_unique_id("btn"), "text": "🔙 К играм", "action": "goto", "target": "games-menu"}
                ]
            }
        },
        {
            "id": "dice-result",
            "type": "message",
            "position": {"x": 600, "y": y_pos + y_increment},
            "data": {
                "messageText": "🎲 Результат броска: 4!\n\n"
                              "🎉 Отличный результат! Хотите попробовать еще раз?",
                "keyboardType": "inline",
                "buttons": [
                    {"id": generate_unique_id("btn"), "text": "🎲 Бросить еще раз", "action": "goto", "target": "dice-game"},
                    {"id": generate_unique_id("btn"), "text": "🔙 К играм", "action": "goto", "target": "games-menu"}
                ]
            }
        },
        {
            "id": "weather-cmd",
            "type": "command",
            "position": {"x": 850, "y": y_pos + y_increment},
            "data": {
                "command": "/weather",
                "messageText": "🌤️ Прогноз погоды:\n\n"
                              "📍 Москва\n"
                              "🌡️ Температура: +15°C\n"
                              "☁️ Облачно с прояснениями\n"
                              "💨 Ветер: 5 м/с\n"
                              "💧 Влажность: 65%\n"
                              "🌅 Восход: 06:30\n"
                              "🌇 Закат: 20:15\n\n"
                              "Хорошего дня!",
                "keyboardType": "inline",
                "buttons": [
                    {"id": generate_unique_id("btn"), "text": "🌍 Другой город", "action": "goto", "target": "weather-input"},
                    {"id": generate_unique_id("btn"), "text": "📅 Прогноз на неделю", "action": "goto", "target": "weather-week"},
                    {"id": generate_unique_id("btn"), "text": "🏠 Главное меню", "action": "goto", "target": "start-node"}
                ]
            }
        },
        {
            "id": "input-demo",
            "type": "input",
            "position": {"x": 100, "y": y_pos + y_increment * 2},
            "data": {
                "messageText": "✍️ Демонстрация ввода данных:\n\n"
                              "Введите любой текст, и бот его обработает:",
                "inputType": "text",
                "placeholder": "Введите ваше сообщение...",
                "validation": "required"
            }
        }
    ]
    
    nodes.extend(additional_nodes)
    
    # Создание связей между узлами
    def add_connection(from_id, to_id):
        connections.append({
            "id": generate_unique_id("conn"),
            "source": from_id,
            "target": to_id,
            "type": "default"
        })
    
    # Основные связи
    add_connection("start-node", "commands-menu")
    add_connection("start-node", "keyboards-menu")
    add_connection("start-node", "games-menu")
    add_connection("start-node", "settings-menu")
    
    add_connection("commands-menu", "info-cmd")
    add_connection("commands-menu", "contacts-cmd")
    add_connection("commands-menu", "help-cmd")
    add_connection("commands-menu", "stats-cmd")
    
    add_connection("keyboards-menu", "inline-demo")
    add_connection("keyboards-menu", "reply-demo")
    
    add_connection("games-menu", "dice-game")
    add_connection("games-menu", "quiz-start")
    
    add_connection("dice-game", "dice-result")
    add_connection("dice-result", "dice-game")
    
    add_connection("info-cmd", "detailed-stats")
    add_connection("stats-cmd", "detailed-stats")
    
    # Обратные связи
    add_connection("commands-menu", "start-node")
    add_connection("keyboards-menu", "start-node")
    add_connection("games-menu", "start-node")
    add_connection("settings-menu", "start-node")
    
    return {
        "nodes": nodes,
        "connections": connections
    }

def save_bot_to_api():
    """Сохраняет бот через API для использования в интерфейсе"""
    import requests
    
    bot_data = create_advanced_complex_bot()
    
    # Данные проекта
    project_data = {
        "name": "🚀 Продвинутый Комплексный Тест-бот",
        "description": "Сложный тестовый бот с множеством команд, узлов, различными кнопками и переходами для демонстрации всех возможностей генератора кода",
        "data": bot_data
    }
    
    try:
        # Отправляем POST запрос для создания нового проекта
        response = requests.post(
            'http://localhost:5000/api/projects',
            json=project_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 201:
            project = response.json()
            print(f"✅ Продвинутый комплексный тест-бот успешно создан!")
            print(f"📊 ID проекта: {project['id']}")
            print(f"📝 Название: {project['name']}")
            print(f"🎯 Узлов: {len(bot_data['nodes'])}")
            print(f"🔗 Связей: {len(bot_data['connections'])}")
            print(f"\n🚀 Теперь вы можете:")
            print(f"1. Открыть редактор и переключиться на этот проект")
            print(f"2. Перейти на вкладку 'Бот' для тестирования")
            print(f"3. Ввести токен бота и запустить его")
            print(f"4. Протестировать все команды и переходы в реальном Telegram")
            
            return project
        else:
            print(f"❌ Ошибка создания проекта: {response.status_code}")
            print(f"Ответ: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Не удалось подключиться к серверу. Убедитесь, что сервер запущен.")
        return None
    except Exception as e:
        print(f"❌ Произошла ошибка: {str(e)}")
        return None

def main():
    """Основная функция создания продвинутого комплексного тест-бота"""
    print("🚀 Создание продвинутого комплексного тест-бота...")
    print("📋 Характеристики бота:")
    print("   • Множество команд (/start, /info, /contacts, /help, /games, /settings, /quiz, /weather)")
    print("   • Различные типы узлов (command, message, input)")
    print("   • Inline и Reply клавиатуры")
    print("   • Специальные кнопки (contact, location)")
    print("   • Внешние ссылки")
    print("   • Сложные переходы между узлами")
    print("   • Синонимы команд")
    print("   • Игровые элементы")
    print()
    
    # Создаем и сохраняем бота
    result = save_bot_to_api()
    
    if result:
        print("\n🎯 Следующие шаги для тестирования:")
        print("1. Откройте Telegram и создайте нового бота через @BotFather")
        print("2. Получите токен бота")
        print("3. В интерфейсе редактора перейдите на вкладку 'Бот'")
        print("4. Введите токен и нажмите 'Запустить бота'")
        print("5. Протестируйте все команды:")
        print("   • /start - главное меню")
        print("   • /info - информация")
        print("   • /contacts - контакты")
        print("   • /help (или 'помощь', 'справка') - справка")
        print("   • /games - игры")
        print("   • /settings - настройки")
        print("   • /quiz - викторина")
        print("   • /weather - погода")
        print("6. Проверьте работу всех кнопок и переходов")
        print()
        print("🔥 Этот бот демонстрирует все возможности генератора кода!")
    else:
        print("❌ Не удалось создать тест-бота. Проверьте подключение к серверу.")

if __name__ == "__main__":
    main()