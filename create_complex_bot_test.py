#!/usr/bin/env python3
"""
Создание сложного тестового бота для проверки всех функций генератора
"""

import json
import requests
import sys

def create_complex_bot():
    """Создаёт сложный тестовый бот с множественными узлами и командами"""
    
    bot_data = {
        "nodes": [
            # 1. Стартовый узел с Reply кнопками
            {
                "id": "start-node",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "messageText": "🎉 Добро пожаловать в комплексный тест-бот!\n\nЭтот бот демонстрирует все возможности генератора:\n• Команды с inline и reply кнопками\n• Обработка пользовательского ввода\n• Условная логика\n• Отправка медиа\n• Административные функции",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-1", "text": "📋 Меню", "action": "goto", "target": "menu-cmd"},
                        {"id": "btn-2", "text": "🎮 Игры", "action": "goto", "target": "games-cmd"},
                        {"id": "btn-3", "text": "⚙️ Настройки", "action": "goto", "target": "settings-cmd"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 2. Команда меню с inline кнопками
            {
                "id": "menu-cmd",
                "type": "command",
                "position": {"x": 300, "y": 100},
                "data": {
                    "command": "/menu",
                    "messageText": "🎯 Главное меню:\n\nВыберите раздел для изучения функциональности:",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-info", "text": "📊 Информация", "action": "goto", "target": "info-msg"},
                        {"id": "btn-media", "text": "🖼️ Медиа", "action": "goto", "target": "media-msg"},
                        {"id": "btn-input", "text": "✍️ Ввод данных", "action": "goto", "target": "input-msg"},
                        {"id": "btn-url", "text": "🌐 Сайт", "action": "url", "url": "https://telegram.org"}
                    ]
                }
            },
            
            # 3. Узел информации
            {
                "id": "info-msg",
                "type": "message",
                "position": {"x": 500, "y": 50},
                "data": {
                    "messageText": "📊 Информация о боте:\n\n• Создан с помощью визуального конструктора\n• Поддерживает все типы кнопок\n• Включает условную логику\n• Работает с медиафайлами\n• Имеет административные функции",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-back-menu", "text": "🔙 Назад к меню", "action": "goto", "target": "menu-cmd"},
                        {"id": "btn-stats", "text": "📈 Статистика", "action": "goto", "target": "stats-msg"}
                    ]
                }
            },
            
            # 4. Узел статистики
            {
                "id": "stats-msg", 
                "type": "message",
                "position": {"x": 700, "y": 50},
                "data": {
                    "messageText": "📈 Статистика бота:\n\n• Активных пользователей: 1,337\n• Сообщений обработано: 42,000+\n• Команд выполнено: 15,678\n• Время работы: 99.9%",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-back-info", "text": "🔙 К информации", "action": "goto", "target": "info-msg"}
                    ]
                }
            },
            
            # 5. Медиа узел
            {
                "id": "media-msg",
                "type": "photo",
                "position": {"x": 500, "y": 200},
                "data": {
                    "messageText": "🖼️ Медиа контент:\n\nЭто демонстрация отправки изображений с inline кнопками.",
                    "photoUrl": "https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Test+Bot+Media",
                    "keyboardType": "inline", 
                    "buttons": [
                        {"id": "btn-video", "text": "🎥 Видео", "action": "goto", "target": "video-msg"},
                        {"id": "btn-audio", "text": "🎵 Аудио", "action": "goto", "target": "audio-msg"},
                        {"id": "btn-back-menu2", "text": "🔙 Главное меню", "action": "goto", "target": "menu-cmd"}
                    ]
                }
            },
            
            # 6. Видео узел
            {
                "id": "video-msg",
                "type": "video",
                "position": {"x": 700, "y": 200},
                "data": {
                    "messageText": "🎥 Видео контент:\n\nДемонстрация видео с кнопками.",
                    "videoUrl": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-back-media", "text": "🔙 К медиа", "action": "goto", "target": "media-msg"}
                    ]
                }
            },
            
            # 7. Аудио узел  
            {
                "id": "audio-msg",
                "type": "audio", 
                "position": {"x": 500, "y": 350},
                "data": {
                    "messageText": "🎵 Аудио контент:\n\nПример аудиофайла с кнопками.",
                    "audioUrl": "https://www.soundjay.com/misc/beep-07a.wav",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-back-media2", "text": "🔙 К медиа", "action": "goto", "target": "media-msg"}
                    ]
                }
            },
            
            # 8. Узел ввода данных
            {
                "id": "input-msg",
                "type": "input",
                "position": {"x": 500, "y": 500},
                "data": {
                    "messageText": "✍️ Введите ваше имя:\n\nМы сохраним его для персонализации.",
                    "inputType": "text",
                    "validation": "required",
                    "placeholder": "Введите ваше имя...",
                    "nextNode": "greeting-msg"
                }
            },
            
            # 9. Приветствие с именем
            {
                "id": "greeting-msg",
                "type": "message",
                "position": {"x": 700, "y": 500},
                "data": {
                    "messageText": "🤝 Привет, {имя}!\n\nТеперь вы можете пользоваться персонализированными функциями.",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-profile", "text": "👤 Мой профиль", "action": "goto", "target": "profile-msg"},
                        {"id": "btn-back-menu3", "text": "🔙 Главное меню", "action": "goto", "target": "menu-cmd"}
                    ]
                }
            },
            
            # 10. Профиль пользователя
            {
                "id": "profile-msg",
                "type": "message", 
                "position": {"x": 900, "y": 500},
                "data": {
                    "messageText": "👤 Ваш профиль:\n\n• Имя: {имя}\n• Статус: Активный пользователь\n• Дата регистрации: {дата}\n• Сообщений отправлено: {счетчик}",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-edit-profile", "text": "✏️ Редактировать", "action": "goto", "target": "input-msg"},
                        {"id": "btn-back-greeting", "text": "🔙 Назад", "action": "goto", "target": "greeting-msg"}
                    ]
                }
            },
            
            # 11. Команда игр
            {
                "id": "games-cmd",
                "type": "command",
                "position": {"x": 300, "y": 650},
                "data": {
                    "command": "/games",
                    "messageText": "🎮 Игровая зона:\n\nВыберите игру:",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-quiz", "text": "🧠 Викторина", "action": "goto", "target": "quiz-msg"},
                        {"id": "btn-dice", "text": "🎲 Кости", "action": "goto", "target": "dice-msg"},
                        {"id": "btn-back-start", "text": "🔙 На главную", "action": "goto", "target": "start-node"}
                    ]
                }
            },
            
            # 12. Викторина
            {
                "id": "quiz-msg",
                "type": "message",
                "position": {"x": 500, "y": 650},
                "data": {
                    "messageText": "🧠 Викторина:\n\nВопрос: Какой протокол использует Telegram Bot API?\n\nВыберите правильный ответ:",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-http", "text": "HTTP/HTTPS", "action": "goto", "target": "correct-msg"},
                        {"id": "btn-websocket", "text": "WebSocket", "action": "goto", "target": "wrong-msg"},
                        {"id": "btn-tcp", "text": "TCP", "action": "goto", "target": "wrong-msg"},
                        {"id": "btn-back-games", "text": "🔙 К играм", "action": "goto", "target": "games-cmd"}
                    ]
                }
            },
            
            # 13. Правильный ответ
            {
                "id": "correct-msg",
                "type": "message",
                "position": {"x": 700, "y": 600},
                "data": {
                    "messageText": "✅ Правильно!\n\nTelegram Bot API действительно использует HTTP/HTTPS протокол для обмена данными.",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-next-quiz", "text": "➡️ Следующий вопрос", "action": "goto", "target": "quiz-msg"},
                        {"id": "btn-back-games2", "text": "🔙 К играм", "action": "goto", "target": "games-cmd"}
                    ]
                }
            },
            
            # 14. Неправильный ответ
            {
                "id": "wrong-msg",
                "type": "message",
                "position": {"x": 700, "y": 700},
                "data": {
                    "messageText": "❌ Неправильно!\n\nПопробуйте ещё раз. Подсказка: это самый распространённый протокол в веб-разработке.",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-try-again", "text": "🔄 Попробовать снова", "action": "goto", "target": "quiz-msg"},
                        {"id": "btn-back-games3", "text": "🔙 К играм", "action": "goto", "target": "games-cmd"}
                    ]
                }
            },
            
            # 15. Кости
            {
                "id": "dice-msg",
                "type": "message",
                "position": {"x": 500, "y": 800},
                "data": {
                    "messageText": "🎲 Игра в кости:\n\n🎯 Ваш результат: {случайное число 1-6}\n\nУдача сегодня на вашей стороне!",
                    "keyboardType": "inline", 
                    "buttons": [
                        {"id": "btn-roll-again", "text": "🎲 Бросить снова", "action": "goto", "target": "dice-msg"},
                        {"id": "btn-back-games4", "text": "🔙 К играм", "action": "goto", "target": "games-cmd"}
                    ]
                }
            },
            
            # 16. Настройки (админские функции)
            {
                "id": "settings-cmd",
                "type": "command",
                "position": {"x": 300, "y": 950},
                "data": {
                    "command": "/settings",
                    "messageText": "⚙️ Настройки:\n\nПерсонализируйте работу бота:",
                    "keyboardType": "inline",
                    "adminOnly": True,
                    "isPrivateOnly": True,
                    "buttons": [
                        {"id": "btn-notifications", "text": "🔔 Уведомления", "action": "goto", "target": "notifications-msg"},
                        {"id": "btn-admin", "text": "👑 Админ-панель", "action": "goto", "target": "admin-msg"},
                        {"id": "btn-back-start2", "text": "🔙 На главную", "action": "goto", "target": "start-node"}
                    ]
                }
            },
            
            # 17. Уведомления
            {
                "id": "notifications-msg",
                "type": "message",
                "position": {"x": 500, "y": 950},
                "data": {
                    "messageText": "🔔 Настройки уведомлений:\n\n• Новые сообщения: ✅\n• Системные уведомления: ✅\n• Рекламные рассылки: ❌\n• Ночной режим: ✅",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-toggle-notifications", "text": "🔄 Изменить настройки", "action": "goto", "target": "notifications-msg"},
                        {"id": "btn-back-settings", "text": "🔙 К настройкам", "action": "goto", "target": "settings-cmd"}
                    ]
                }
            },
            
            # 18. Админ панель
            {
                "id": "admin-msg",
                "type": "message",
                "position": {"x": 700, "y": 950},
                "data": {
                    "messageText": "👑 Административная панель:\n\n• Пользователей: 1,337\n• Активных сессий: 89\n• Загрузка сервера: 12%\n• Свободное место: 85%",
                    "keyboardType": "inline",
                    "adminOnly": True,
                    "buttons": [
                        {"id": "btn-broadcast", "text": "📢 Рассылка", "action": "goto", "target": "broadcast-msg"},
                        {"id": "btn-logs", "text": "📋 Логи", "action": "goto", "target": "logs-msg"},
                        {"id": "btn-back-settings2", "text": "🔙 К настройкам", "action": "goto", "target": "settings-cmd"}
                    ]
                }
            },
            
            # 19. Рассылка
            {
                "id": "broadcast-msg",
                "type": "input",
                "position": {"x": 900, "y": 900},
                "data": {
                    "messageText": "📢 Создание рассылки:\n\nВведите текст сообщения для отправки всем пользователям:",
                    "inputType": "text",
                    "validation": "required|min:10",
                    "placeholder": "Текст рассылки...",
                    "nextNode": "broadcast-confirm-msg"
                }
            },
            
            # 20. Подтверждение рассылки
            {
                "id": "broadcast-confirm-msg",
                "type": "message",
                "position": {"x": 1100, "y": 900},
                "data": {
                    "messageText": "✅ Рассылка готова к отправке:\n\n\"{введённый текст}\"\n\nОтправить 1,337 пользователям?",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-send-broadcast", "text": "✅ Отправить", "action": "goto", "target": "broadcast-sent-msg"},
                        {"id": "btn-cancel-broadcast", "text": "❌ Отменить", "action": "goto", "target": "admin-msg"}
                    ]
                }
            },
            
            # 21. Рассылка отправлена
            {
                "id": "broadcast-sent-msg",
                "type": "message",
                "position": {"x": 1300, "y": 900},
                "data": {
                    "messageText": "🎉 Рассылка отправлена!\n\n• Получателей: 1,337\n• Доставлено: 1,335\n• Ошибок: 2\n• Время отправки: 3.2 сек",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-back-admin", "text": "🔙 К админ-панели", "action": "goto", "target": "admin-msg"}
                    ]
                }
            },
            
            # 22. Логи
            {
                "id": "logs-msg",
                "type": "message",
                "position": {"x": 900, "y": 1000},
                "data": {
                    "messageText": "📋 Системные логи:\n\n[2025-01-06 22:47] Пользователь 12345 запустил /start\n[2025-01-06 22:46] Отправлена рассылка (1,337 получателей)\n[2025-01-06 22:45] Обновлена конфигурация бота\n[2025-01-06 22:44] Пользователь 67890 выполнил /menu",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-clear-logs", "text": "🗑️ Очистить логи", "action": "goto", "target": "logs-cleared-msg"},
                        {"id": "btn-back-admin2", "text": "🔙 К админ-панели", "action": "goto", "target": "admin-msg"}
                    ]
                }
            },
            
            # 23. Логи очищены
            {
                "id": "logs-cleared-msg",
                "type": "message",
                "position": {"x": 1100, "y": 1000},
                "data": {
                    "messageText": "🗑️ Логи очищены!\n\nВсе системные логи были успешно удалены. Новые события будут записываться с этого момента.",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-back-logs", "text": "🔙 К логам", "action": "goto", "target": "logs-msg"}
                    ]
                }
            },
            
            # 24. Помощь и дополнительные команды
            {
                "id": "help-cmd",
                "type": "command",
                "position": {"x": 100, "y": 1200},
                "data": {
                    "command": "/help",
                    "messageText": "❓ Справка по командам:\n\n/start - Запуск бота\n/menu - Главное меню\n/games - Игровая зона\n/settings - Настройки (только админы)\n/help - Эта справка\n/about - О боте",
                    "keyboardType": "inline",
                    "synonyms": ["помощь", "справка", "команды"],
                    "buttons": [
                        {"id": "btn-commands", "text": "📋 Все команды", "action": "goto", "target": "commands-msg"},
                        {"id": "btn-support", "text": "🆘 Поддержка", "action": "goto", "target": "support-msg"},
                        {"id": "btn-back-start3", "text": "🔙 На главную", "action": "goto", "target": "start-node"}
                    ]
                }
            },
            
            # 25. Список команд
            {
                "id": "commands-msg",
                "type": "message",
                "position": {"x": 300, "y": 1200},
                "data": {
                    "messageText": "📋 Полный список команд:\n\n🔹 Основные:\n/start, /menu, /help, /about\n\n🔹 Развлечения:\n/games, викторина, кости\n\n🔹 Настройки:\n/settings, уведомления\n\n🔹 Админские:\n/admin, рассылка, логи",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-back-help", "text": "🔙 К справке", "action": "goto", "target": "help-cmd"}
                    ]
                }
            },
            
            # 26. Поддержка
            {
                "id": "support-msg",
                "type": "message",
                "position": {"x": 500, "y": 1200},
                "data": {
                    "messageText": "🆘 Техническая поддержка:\n\n• Email: support@example.com\n• Telegram: @support_bot\n• Часы работы: 24/7\n• Среднее время ответа: 15 мин",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-contact", "text": "📞 Связаться", "action": "url", "url": "https://t.me/support_bot"},
                        {"id": "btn-back-help2", "text": "🔙 К справке", "action": "goto", "target": "help-cmd"}
                    ]
                }
            },
            
            # 27. О боте
            {
                "id": "about-cmd",
                "type": "command",
                "position": {"x": 100, "y": 1350},
                "data": {
                    "command": "/about",
                    "messageText": "ℹ️ О боте:\n\n🤖 Комплексный тест-бот\n📅 Версия: 2.0.0\n👨‍💻 Создан с помощью Telegram Bot Builder\n🚀 Поддерживает все типы взаимодействий\n\n📊 Статистика:\n• Узлов в схеме: 27\n• Команд: 6\n• Типов взаимодействий: 8",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-changelog", "text": "📝 История изменений", "action": "goto", "target": "changelog-msg"},
                        {"id": "btn-github", "text": "💻 GitHub", "action": "url", "url": "https://github.com/telegram-bot-builder"},
                        {"id": "btn-back-start4", "text": "🔙 На главную", "action": "goto", "target": "start-node"}
                    ]
                }
            },
            
            # 28. История изменений
            {
                "id": "changelog-msg",
                "type": "message",
                "position": {"x": 300, "y": 1350},
                "data": {
                    "messageText": "📝 История изменений:\n\n🔹 v2.0.0 (06.01.2025)\n• Добавлены игры и викторины\n• Улучшена админ-панель\n• Исправлены inline кнопки\n\n🔹 v1.5.0 (05.01.2025)\n• Добавлена медиа поддержка\n• Система пользовательского ввода\n\n🔹 v1.0.0 (04.01.2025)\n• Первая стабильная версия",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn-back-about", "text": "🔙 О боте", "action": "goto", "target": "about-cmd"}
                    ]
                }
            }
        ],
        "connections": [
            # Связи между узлами (генерируются автоматически на основе кнопок)
        ]
    }
    
    return bot_data

def main():
    """Основная функция создания тестового бота"""
    print("🔧 Создаём комплексный тест-бот...")
    
    # Создаём данные бота
    bot_data = create_complex_bot()
    
    # Создаём новый проект
    project_data = {
        "name": "🤖 Комплексный тест-бот",
        "description": "Сложный тестовый бот для проверки всех функций генератора кода с множественными узлами, командами, inline/reply кнопками, медиа, пользовательским вводом, условной логикой и админскими функциями",
        "data": bot_data
    }
    
    try:
        # Отправляем запрос на создание проекта
        response = requests.post("http://localhost:5000/api/projects", 
                               json=project_data,
                               headers={"Content-Type": "application/json"})
        
        if response.status_code == 201:
            project = response.json()
            project_id = project['id']
            print(f"✅ Проект создан! ID: {project_id}")
            print(f"📝 Название: {project['name']}")
            print(f"🔢 Узлов в схеме: {len(bot_data['nodes'])}")
            
            # Генерируем Python код
            print("\n🔄 Генерируем Python код...")
            export_response = requests.post(f"http://localhost:5000/api/projects/{project_id}/export",
                                          json={"format": "python"},
                                          headers={"Content-Type": "application/json"})
            
            if export_response.status_code == 200:
                code_data = export_response.json()
                
                # Сохраняем код в файл
                with open(f"complex_test_bot_{project_id}.py", "w", encoding="utf-8") as f:
                    f.write(code_data['code'])
                
                print(f"✅ Код сохранён в файл: complex_test_bot_{project_id}.py")
                print(f"📊 Размер кода: {len(code_data['code'])} символов")
                
                return project_id
            else:
                print(f"❌ Ошибка генерации кода: {export_response.status_code}")
                return None
                
        else:
            print(f"❌ Ошибка создания проекта: {response.status_code}")
            print(f"Ответ: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return None

if __name__ == "__main__":
    project_id = main()
    if project_id:
        print(f"\n🎉 Комплексный тест-бот готов! Project ID: {project_id}")
        print("🔍 Теперь можно запустить тесты для проверки всех функций.")
    else:
        print("\n❌ Не удалось создать тест-бот.")
        sys.exit(1)