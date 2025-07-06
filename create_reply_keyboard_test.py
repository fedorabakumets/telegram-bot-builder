#!/usr/bin/env python3
"""
Создание сложного тестового бота с reply клавиатурами
"""

import json
import requests
import sys

def create_reply_keyboard_bot():
    """Создаёт сложный бот с различными типами reply клавиатур"""
    
    bot_data = {
        "nodes": [
            # 1. Стартовый узел с основной reply клавиатурой
            {
                "id": "start-node",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "messageText": "🎮 Добро пожаловать в тест Reply клавиатур!\n\nЭтот бот демонстрирует все возможности Reply кнопок:\n• Обычные кнопки\n• Контактные кнопки\n• Геолокация\n• Динамическое изменение клавиатур\n• Удаление клавиатур",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-menu", "text": "📋 Меню", "action": "goto", "target": "menu-msg"},
                        {"id": "btn-contact", "text": "📞 Мой контакт", "action": "contact", "requestContact": True},
                        {"id": "btn-location", "text": "📍 Моя геолокация", "action": "location", "requestLocation": True},
                        {"id": "btn-games", "text": "🎮 Игры", "action": "goto", "target": "games-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 2. Меню с вертикальной reply клавиатурой
            {
                "id": "menu-msg",
                "type": "message",
                "position": {"x": 300, "y": 100},
                "data": {
                    "messageText": "📋 Главное меню:\n\nВыберите раздел для изучения функций Reply клавиатур:",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-info", "text": "ℹ️ Информация", "action": "goto", "target": "info-msg"},
                        {"id": "btn-settings", "text": "⚙️ Настройки", "action": "goto", "target": "settings-msg"},
                        {"id": "btn-help", "text": "❓ Помощь", "action": "goto", "target": "help-msg"},
                        {"id": "btn-keyboard-test", "text": "⌨️ Тест клавиатур", "action": "goto", "target": "keyboard-test-msg"},
                        {"id": "btn-back-start", "text": "🔙 На главную", "action": "goto", "target": "start-node"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 3. Информация с горизонтальной reply клавиатурой
            {
                "id": "info-msg",
                "type": "message",
                "position": {"x": 500, "y": 50},
                "data": {
                    "messageText": "ℹ️ Информация о Reply клавиатурах:\n\n• Показываются внизу экрана\n• Заменяют стандартную клавиатуру\n• Могут запрашивать контакт/геолокацию\n• Поддерживают автоматическое изменение размера\n• Могут быть одноразовыми или постоянными",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-features", "text": "🔧 Возможности", "action": "goto", "target": "features-msg"},
                        {"id": "btn-examples", "text": "📝 Примеры", "action": "goto", "target": "examples-msg"},
                        {"id": "btn-back-menu", "text": "🔙 Меню", "action": "goto", "target": "menu-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 4. Возможности с широкой reply клавиатурой
            {
                "id": "features-msg",
                "type": "message",
                "position": {"x": 700, "y": 50},
                "data": {
                    "messageText": "🔧 Возможности Reply кнопок:\n\n✅ Быстрый доступ к функциям\n✅ Запрос контактных данных\n✅ Получение геолокации\n✅ Настраиваемый размер\n✅ Одноразовое использование\n✅ Постоянное отображение\n✅ Автоматическое скрытие",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-contact-demo", "text": "📞 Контакт", "action": "contact", "requestContact": True},
                        {"id": "btn-location-demo", "text": "📍 Геолокация", "action": "location", "requestLocation": True},
                        {"id": "btn-back-info", "text": "🔙 Информация", "action": "goto", "target": "info-msg"},
                        {"id": "btn-remove-keyboard", "text": "❌ Убрать клавиатуру", "action": "goto", "target": "no-keyboard-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 5. Сообщение без клавиатуры
            {
                "id": "no-keyboard-msg",
                "type": "message",
                "position": {"x": 900, "y": 50},
                "data": {
                    "messageText": "❌ Клавиатура убрана!\n\nТеперь пользователь видит стандартную клавиатуру устройства. Это полезно когда нужно:\n• Завершить диалог\n• Перейти к свободному вводу\n• Очистить интерфейс",
                    "keyboardType": "none",
                    "buttons": []
                }
            },
            
            # 6. Примеры с одноразовой reply клавиатурой
            {
                "id": "examples-msg",
                "type": "message",
                "position": {"x": 700, "y": 200},
                "data": {
                    "messageText": "📝 Примеры использования:\n\n🎯 Одноразовая клавиатура - скрывается после нажатия\n🎯 Постоянная клавиатура - остается видимой\n🎯 Запрос данных - получение контакта/геолокации",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-one-time", "text": "⚡ Одноразовая", "action": "goto", "target": "one-time-msg"},
                        {"id": "btn-permanent", "text": "🔒 Постоянная", "action": "goto", "target": "permanent-msg"},
                        {"id": "btn-back-info2", "text": "🔙 Информация", "action": "goto", "target": "info-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": True
                }
            },
            
            # 7. Одноразовая клавиатура (исчезает после использования)
            {
                "id": "one-time-msg",
                "type": "message",
                "position": {"x": 900, "y": 150},
                "data": {
                    "messageText": "⚡ Одноразовая клавиатура!\n\nЭта клавиатура исчезнет после нажатия любой кнопки. Удобно для:\n• Выбора из списка\n• Подтверждения действий\n• Разовых опросов",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-choice-1", "text": "✅ Вариант 1", "action": "goto", "target": "choice-result-msg"},
                        {"id": "btn-choice-2", "text": "✅ Вариант 2", "action": "goto", "target": "choice-result-msg"},
                        {"id": "btn-choice-3", "text": "✅ Вариант 3", "action": "goto", "target": "choice-result-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": True
                }
            },
            
            # 8. Результат выбора
            {
                "id": "choice-result-msg",
                "type": "message",
                "position": {"x": 1100, "y": 150},
                "data": {
                    "messageText": "✅ Выбор сделан!\n\nКлавиатура исчезла автоматически. Теперь пользователь может:\n• Вводить текст свободно\n• Использовать стандартную клавиатуру\n• Дождаться новой Reply клавиатуры",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-new-keyboard", "text": "🔄 Новая клавиатура", "action": "goto", "target": "examples-msg"},
                        {"id": "btn-back-menu2", "text": "🔙 В меню", "action": "goto", "target": "menu-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 9. Постоянная клавиатура
            {
                "id": "permanent-msg",
                "type": "message",
                "position": {"x": 900, "y": 250},
                "data": {
                    "messageText": "🔒 Постоянная клавиатура!\n\nЭта клавиатура остается видимой после нажатий. Подходит для:\n• Основного меню\n• Частых действий\n• Навигации по боту",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-action-1", "text": "🎯 Действие 1", "action": "goto", "target": "action-result-msg"},
                        {"id": "btn-action-2", "text": "🎯 Действие 2", "action": "goto", "target": "action-result-msg"},
                        {"id": "btn-action-3", "text": "🎯 Действие 3", "action": "goto", "target": "action-result-msg"},
                        {"id": "btn-hide-keyboard", "text": "👁️ Скрыть клавиатуру", "action": "goto", "target": "no-keyboard-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 10. Результат действия
            {
                "id": "action-result-msg",
                "type": "message",
                "position": {"x": 1100, "y": 250},
                "data": {
                    "messageText": "🎯 Действие выполнено!\n\nКлавиатура осталась видимой для продолжения работы. Пользователь может:\n• Выполнить другие действия\n• Продолжить навигацию\n• Использовать те же кнопки",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-continue", "text": "▶️ Продолжить", "action": "goto", "target": "permanent-msg"},
                        {"id": "btn-examples-back", "text": "📝 К примерам", "action": "goto", "target": "examples-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 11. Настройки с компактной reply клавиатурой
            {
                "id": "settings-msg",
                "type": "message",
                "position": {"x": 500, "y": 350},
                "data": {
                    "messageText": "⚙️ Настройки Reply клавиатур:\n\nЗдесь можно настроить поведение клавиатур:\n• Размер кнопок\n• Поведение после нажатия\n• Запрос разрешений",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-size-settings", "text": "📏 Размер", "action": "goto", "target": "size-settings-msg"},
                        {"id": "btn-behavior-settings", "text": "🎭 Поведение", "action": "goto", "target": "behavior-settings-msg"},
                        {"id": "btn-back-menu3", "text": "🔙 Меню", "action": "goto", "target": "menu-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 12. Настройки размера
            {
                "id": "size-settings-msg",
                "type": "message",
                "position": {"x": 700, "y": 350},
                "data": {
                    "messageText": "📏 Настройки размера:\n\n🔹 Автоматический размер - подстраивается под текст\n🔹 Фиксированный размер - одинаковые кнопки\n\nТекущий режим: Автоматический",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-auto-size", "text": "🔄 Авто размер", "action": "goto", "target": "auto-size-demo-msg"},
                        {"id": "btn-fixed-size", "text": "📐 Фикс размер", "action": "goto", "target": "fixed-size-demo-msg"},
                        {"id": "btn-back-settings", "text": "🔙 Настройки", "action": "goto", "target": "settings-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 13. Демо автоматического размера
            {
                "id": "auto-size-demo-msg",
                "type": "message",
                "position": {"x": 900, "y": 300},
                "data": {
                    "messageText": "🔄 Автоматический размер активен!\n\nКнопки подстраиваются под длину текста:",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-short", "text": "Короткая", "action": "goto", "target": "size-settings-msg"},
                        {"id": "btn-medium-length", "text": "Средняя кнопка", "action": "goto", "target": "size-settings-msg"},
                        {"id": "btn-very-long-button", "text": "Очень длинная кнопка с большим текстом", "action": "goto", "target": "size-settings-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 14. Демо фиксированного размера
            {
                "id": "fixed-size-demo-msg",
                "type": "message",
                "position": {"x": 900, "y": 400},
                "data": {
                    "messageText": "📐 Фиксированный размер активен!\n\nВсе кнопки одинакового размера:",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-fixed-1", "text": "Кнопка 1", "action": "goto", "target": "size-settings-msg"},
                        {"id": "btn-fixed-2", "text": "Кнопка 2", "action": "goto", "target": "size-settings-msg"},
                        {"id": "btn-fixed-3", "text": "Кнопка 3", "action": "goto", "target": "size-settings-msg"}
                    ],
                    "resizeKeyboard": False,
                    "oneTimeKeyboard": False
                }
            },
            
            # 15. Настройки поведения
            {
                "id": "behavior-settings-msg",
                "type": "message",
                "position": {"x": 700, "y": 450},
                "data": {
                    "messageText": "🎭 Настройки поведения:\n\n• Одноразовые клавиатуры исчезают\n• Постоянные остаются видимыми\n• Специальные кнопки запрашивают разрешения",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-one-time-demo", "text": "⚡ Тест одноразовой", "action": "goto", "target": "one-time-behavior-msg"},
                        {"id": "btn-permanent-demo", "text": "🔒 Тест постоянной", "action": "goto", "target": "permanent-behavior-msg"},
                        {"id": "btn-back-settings2", "text": "🔙 Настройки", "action": "goto", "target": "settings-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 16. Тест одноразового поведения
            {
                "id": "one-time-behavior-msg",
                "type": "message",
                "position": {"x": 900, "y": 450},
                "data": {
                    "messageText": "⚡ Тест одноразового поведения:\n\nНажмите любую кнопку - клавиатура исчезнет!",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-disappear-1", "text": "🎯 Исчезну!", "action": "goto", "target": "disappeared-msg"},
                        {"id": "btn-disappear-2", "text": "👻 И я тоже!", "action": "goto", "target": "disappeared-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": True
                }
            },
            
            # 17. Сообщение об исчезновении
            {
                "id": "disappeared-msg",
                "type": "message",
                "position": {"x": 1100, "y": 450},
                "data": {
                    "messageText": "👻 Клавиатура исчезла!\n\nТеперь пользователь видит стандартную клавиатуру устройства.",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-restore", "text": "🔄 Восстановить", "action": "goto", "target": "behavior-settings-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 18. Тест постоянного поведения
            {
                "id": "permanent-behavior-msg",
                "type": "message",
                "position": {"x": 900, "y": 550},
                "data": {
                    "messageText": "🔒 Тест постоянного поведения:\n\nКлавиатура останется после нажатия любой кнопки!",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-stay-1", "text": "💪 Останусь!", "action": "goto", "target": "stayed-msg"},
                        {"id": "btn-stay-2", "text": "🏠 И я здесь!", "action": "goto", "target": "stayed-msg"},
                        {"id": "btn-back-behavior", "text": "🔙 Назад", "action": "goto", "target": "behavior-settings-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 19. Сообщение о сохранении
            {
                "id": "stayed-msg",
                "type": "message",
                "position": {"x": 1100, "y": 550},
                "data": {
                    "messageText": "💪 Клавиатура осталась!\n\nПользователь может продолжать использовать те же кнопки.",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-continue-test", "text": "▶️ Продолжить тест", "action": "goto", "target": "permanent-behavior-msg"},
                        {"id": "btn-back-behavior2", "text": "🔙 К настройкам", "action": "goto", "target": "behavior-settings-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 20. Помощь с эмодзи reply клавиатурой
            {
                "id": "help-msg",
                "type": "message",
                "position": {"x": 500, "y": 650},
                "data": {
                    "messageText": "❓ Справка по Reply клавиатурам:\n\n📋 Основы использования\n🔧 Настройки и возможности\n🎯 Примеры и демонстрации\n📞 Специальные кнопки\n📍 Геолокация и контакты",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-help-basics", "text": "📋 Основы", "action": "goto", "target": "help-basics-msg"},
                        {"id": "btn-help-special", "text": "📞 Спец кнопки", "action": "goto", "target": "help-special-msg"},
                        {"id": "btn-help-faq", "text": "❓ FAQ", "action": "goto", "target": "help-faq-msg"},
                        {"id": "btn-back-menu4", "text": "🔙 Меню", "action": "goto", "target": "menu-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 21. Основы помощи
            {
                "id": "help-basics-msg",
                "type": "message",
                "position": {"x": 700, "y": 650},
                "data": {
                    "messageText": "📋 Основы Reply клавиатур:\n\n1️⃣ Показываются вместо обычной клавиатуры\n2️⃣ Можно настроить размер и поведение\n3️⃣ Поддерживают специальные действия\n4️⃣ Упрощают навигацию по боту\n5️⃣ Можно скрыть в любой момент",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-back-help", "text": "🔙 Справка", "action": "goto", "target": "help-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 22. Специальные кнопки
            {
                "id": "help-special-msg",
                "type": "message",
                "position": {"x": 700, "y": 750},
                "data": {
                    "messageText": "📞 Специальные кнопки:\n\n📞 Запрос контакта - получает номер телефона\n📍 Запрос геолокации - получает координаты\n\nПопробуйте прямо сейчас:",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-test-contact", "text": "📞 Тест контакта", "action": "contact", "requestContact": True},
                        {"id": "btn-test-location", "text": "📍 Тест геолокации", "action": "location", "requestLocation": True},
                        {"id": "btn-back-help2", "text": "🔙 Справка", "action": "goto", "target": "help-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 23. FAQ
            {
                "id": "help-faq-msg",
                "type": "message",
                "position": {"x": 700, "y": 850},
                "data": {
                    "messageText": "❓ Часто задаваемые вопросы:\n\nQ: Как убрать Reply клавиатуру?\nA: Отправить сообщение с ReplyKeyboardRemove\n\nQ: Можно ли изменить размер кнопок?\nA: Да, через параметр resize_keyboard\n\nQ: Работают ли спец кнопки в группах?\nA: Контакт только в приватных чатах",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-back-help3", "text": "🔙 Справка", "action": "goto", "target": "help-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 24. Тест клавиатур с разными конфигурациями
            {
                "id": "keyboard-test-msg",
                "type": "message",
                "position": {"x": 500, "y": 950},
                "data": {
                    "messageText": "⌨️ Тест различных конфигураций клавиатур:\n\nПроверим все возможности Reply кнопок:",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-grid-test", "text": "🔢 Сетка кнопок", "action": "goto", "target": "grid-test-msg"},
                        {"id": "btn-mixed-test", "text": "🎭 Смешанные кнопки", "action": "goto", "target": "mixed-test-msg"},
                        {"id": "btn-minimal-test", "text": "📱 Минимальная", "action": "goto", "target": "minimal-test-msg"},
                        {"id": "btn-back-menu5", "text": "🔙 Меню", "action": "goto", "target": "menu-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 25. Сетка кнопок
            {
                "id": "grid-test-msg",
                "type": "message",
                "position": {"x": 700, "y": 950},
                "data": {
                    "messageText": "🔢 Сетка кнопок 3x3:\n\nМаксимальное количество кнопок в удобном формате:",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-1", "text": "1️⃣", "action": "goto", "target": "grid-result-msg"},
                        {"id": "btn-2", "text": "2️⃣", "action": "goto", "target": "grid-result-msg"},
                        {"id": "btn-3", "text": "3️⃣", "action": "goto", "target": "grid-result-msg"},
                        {"id": "btn-4", "text": "4️⃣", "action": "goto", "target": "grid-result-msg"},
                        {"id": "btn-5", "text": "5️⃣", "action": "goto", "target": "grid-result-msg"},
                        {"id": "btn-6", "text": "6️⃣", "action": "goto", "target": "grid-result-msg"},
                        {"id": "btn-7", "text": "7️⃣", "action": "goto", "target": "grid-result-msg"},
                        {"id": "btn-8", "text": "8️⃣", "action": "goto", "target": "grid-result-msg"},
                        {"id": "btn-9", "text": "9️⃣", "action": "goto", "target": "grid-result-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": True
                }
            },
            
            # 26. Результат сетки
            {
                "id": "grid-result-msg",
                "type": "message",
                "position": {"x": 900, "y": 950},
                "data": {
                    "messageText": "✅ Кнопка нажата!\n\nСетка 3x3 удобна для:\n• Цифровых клавиатур\n• Меню выбора\n• Игровых интерфейсов",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-back-keyboard-test", "text": "🔙 Тест клавиатур", "action": "goto", "target": "keyboard-test-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 27. Смешанные кнопки
            {
                "id": "mixed-test-msg",
                "type": "message",
                "position": {"x": 700, "y": 1050},
                "data": {
                    "messageText": "🎭 Смешанные типы кнопок:\n\nОбычные + специальные в одной клавиатуре:",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-normal", "text": "📝 Обычная", "action": "goto", "target": "mixed-result-msg"},
                        {"id": "btn-contact-mixed", "text": "📞 Контакт", "action": "contact", "requestContact": True},
                        {"id": "btn-location-mixed", "text": "📍 Геолокация", "action": "location", "requestLocation": True},
                        {"id": "btn-back-keyboard-test2", "text": "🔙 Назад", "action": "goto", "target": "keyboard-test-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 28. Результат смешанных
            {
                "id": "mixed-result-msg",
                "type": "message",
                "position": {"x": 900, "y": 1050},
                "data": {
                    "messageText": "🎭 Смешанные кнопки работают!\n\nМожно комбинировать:\n• Обычные текстовые кнопки\n• Кнопки запроса контакта\n• Кнопки запроса геолокации",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-back-mixed", "text": "🔙 К смешанным", "action": "goto", "target": "mixed-test-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 29. Минимальная клавиатура
            {
                "id": "minimal-test-msg",
                "type": "message",
                "position": {"x": 700, "y": 1150},
                "data": {
                    "messageText": "📱 Минимальная клавиатура:\n\nПростейший интерфейс с двумя кнопками:",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-yes", "text": "✅ Да", "action": "goto", "target": "minimal-result-msg"},
                        {"id": "btn-no", "text": "❌ Нет", "action": "goto", "target": "minimal-result-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": True
                }
            },
            
            # 30. Результат минимальной
            {
                "id": "minimal-result-msg",
                "type": "message",
                "position": {"x": 900, "y": 1150},
                "data": {
                    "messageText": "📱 Минимальная клавиатура сработала!\n\nИдеальна для:\n• Простых вопросов\n• Подтверждений\n• Быстрых опросов",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-back-keyboard-test3", "text": "🔙 Тест клавиатур", "action": "goto", "target": "keyboard-test-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 31. Игры с reply клавиатурами
            {
                "id": "games-msg",
                "type": "message",
                "position": {"x": 300, "y": 1250},
                "data": {
                    "messageText": "🎮 Игры с Reply клавиатурами:\n\nПростые игры используя только Reply кнопки:",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-rock-paper", "text": "✂️ Камень-Ножницы", "action": "goto", "target": "rock-paper-msg"},
                        {"id": "btn-quiz-game", "text": "🧠 Викторина", "action": "goto", "target": "quiz-game-msg"},
                        {"id": "btn-calculator", "text": "🔢 Калькулятор", "action": "goto", "target": "calculator-msg"},
                        {"id": "btn-back-start2", "text": "🔙 На главную", "action": "goto", "target": "start-node"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            },
            
            # 32. Камень-ножницы-бумага
            {
                "id": "rock-paper-msg",
                "type": "message",
                "position": {"x": 500, "y": 1250},
                "data": {
                    "messageText": "✂️ Камень-Ножницы-Бумага!\n\nВыберите ваш ход:",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-rock", "text": "🗿 Камень", "action": "goto", "target": "rps-result-msg"},
                        {"id": "btn-paper", "text": "📄 Бумага", "action": "goto", "target": "rps-result-msg"},
                        {"id": "btn-scissors", "text": "✂️ Ножницы", "action": "goto", "target": "rps-result-msg"},
                        {"id": "btn-back-games", "text": "🔙 Игры", "action": "goto", "target": "games-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": True
                }
            },
            
            # 33. Результат игры
            {
                "id": "rps-result-msg",
                "type": "message",
                "position": {"x": 700, "y": 1250},
                "data": {
                    "messageText": "🎯 Результат игры:\n\nВы: {выбор игрока}\nБот: {случайный выбор}\n\nРезультат: {выигрыш/проигрыш/ничья}",
                    "keyboardType": "reply",
                    "buttons": [
                        {"id": "btn-play-again", "text": "🔄 Играть снова", "action": "goto", "target": "rock-paper-msg"},
                        {"id": "btn-back-games2", "text": "🔙 Игры", "action": "goto", "target": "games-msg"}
                    ],
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False
                }
            }
        ],
        "connections": []
    }
    
    return bot_data

def main():
    """Основная функция создания тестового бота с Reply клавиатурами"""
    print("🔧 Создаём сложный тест-бот с Reply клавиатурами...")
    
    # Создаём данные бота
    bot_data = create_reply_keyboard_bot()
    
    # Создаём новый проект
    project_data = {
        "name": "⌨️ Тест Reply клавиатур",
        "description": "Комплексный тестовый бот для проверки всех функций Reply клавиатур: обычные кнопки, запрос контакта и геолокации, одноразовые и постоянные клавиатуры, различные размеры и конфигурации",
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
                with open(f"reply_keyboard_test_{project_id}.py", "w", encoding="utf-8") as f:
                    f.write(code_data['code'])
                
                print(f"✅ Код сохранён в файл: reply_keyboard_test_{project_id}.py")
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
        print(f"\n🎉 Тест-бот с Reply клавиатурами готов! Project ID: {project_id}")
        print("🔍 Теперь можно запустить тесты для проверки Reply функций.")
    else:
        print("\n❌ Не удалось создать тест-бот.")
        sys.exit(1)