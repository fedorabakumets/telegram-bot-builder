"""
Пример бота для сбора пользовательских ответов
Этот файл показывает, как настроить бот для сбора и сохранения ответов пользователей
"""

# Пример структуры бота для сбора ответов о том, откуда пользователь узнал о боте

bot_structure = {
    "nodes": [
        {
            "id": "start-1",
            "type": "start",
            "position": {"x": 100, "y": 100},
            "data": {
                "command": "/start",
                "description": "Запустить бота",
                "messageText": "Привет! Добро пожаловать! Откуда ты узнал о нашем боте?",
                "keyboardType": "inline",
                "buttons": [
                    {"id": "btn-1", "text": "Из социальных сетей", "action": "goto", "target": "social-response"},
                    {"id": "btn-2", "text": "От друзей", "action": "goto", "target": "friends-response"},
                    {"id": "btn-3", "text": "Из поиска", "action": "goto", "target": "search-response"},
                    {"id": "btn-4", "text": "Другое", "action": "goto", "target": "other-input"}
                ],
                "markdown": false,
                "oneTimeKeyboard": false,
                "resizeKeyboard": true,
                "showInMenu": true,
                "isPrivateOnly": false,
                "requiresAuth": false,
                "adminOnly": false
            }
        },
        {
            "id": "social-response",
            "type": "message",
            "position": {"x": 300, "y": 200},
            "data": {
                "messageText": "Отлично! Спасибо за ответ. Какая именно социальная сеть?",
                "keyboardType": "none",
                "buttons": [],
                "markdown": false,
                "oneTimeKeyboard": false,
                "resizeKeyboard": true
            }
        },
        {
            "id": "friends-response",
            "type": "message",
            "position": {"x": 500, "y": 200},
            "data": {
                "messageText": "Здорово! Рекомендации друзей - лучшая реклама! Спасибо за ответ.",
                "keyboardType": "none",
                "buttons": [],
                "markdown": false,
                "oneTimeKeyboard": false,
                "resizeKeyboard": true
            }
        },
        {
            "id": "search-response",
            "type": "message",
            "position": {"x": 700, "y": 200},
            "data": {
                "messageText": "Спасибо! Нашли нас через поиск - значит, мы на правильном пути!",
                "keyboardType": "none",
                "buttons": [],
                "markdown": false,
                "oneTimeKeyboard": false,
                "resizeKeyboard": true
            }
        },
        {
            "id": "other-input",
            "type": "user-input",
            "position": {"x": 900, "y": 200},
            "data": {
                "inputPrompt": "Пожалуйста, расскажите подробнее, откуда вы узнали о нашем боте:",
                "inputType": "text",
                "inputVariable": "discovery_source",
                "inputValidation": "",
                "minLength": 5,
                "maxLength": 200,
                "inputTimeout": 300,
                "inputRequired": true,
                "allowSkip": false,
                "saveToDatabase": true,
                "inputRetryMessage": "Пожалуйста, напишите хотя бы 5 символов.",
                "inputSuccessMessage": "Спасибо за подробный ответ! Эта информация поможет нам стать лучше.",
                "placeholder": "Например: из рекламы, от коллег, из статьи...",
                "defaultValue": "",
                "keyboardType": "none",
                "buttons": [],
                "markdown": false,
                "oneTimeKeyboard": false,
                "resizeKeyboard": true
            }
        }
    ],
    "connections": [
        {"from": "start-1", "to": "social-response"},
        {"from": "start-1", "to": "friends-response"},
        {"from": "start-1", "to": "search-response"},
        {"from": "start-1", "to": "other-input"}
    ]
}

# Инструкция по настройке:
print("""
ИНСТРУКЦИЯ ПО СОЗДАНИЮ БОТА ДЛЯ СБОРА ОТВЕТОВ ПОЛЬЗОВАТЕЛЕЙ:

1. В редакторе ботов:
   - Перетащите компонент "/start команда" на холст
   - Настройте текст: "Привет! Добро пожаловать! Откуда ты узнал о нашем боте?"
   - Добавьте inline кнопки с вариантами ответов

2. Для быстрых ответов:
   - Создайте узлы "Текстовое сообщение" для каждого варианта
   - Свяжите кнопки с соответствующими узлами

3. Для детального ответа:
   - Перетащите компонент "Сбор пользовательского ввода" из раздела "Логика"
   - Настройте:
     * Вопрос: "Пожалуйста, расскажите подробнее..."
     * Тип ввода: "text"
     * Переменная: "discovery_source"
     * Минимальная длина: 5 символов
     * Сохранение в базу данных: ✓
     * Обязательное поле: ✓

4. Настройка сохранения в базу данных:
   - В узле "Сбор пользовательского ввода" включите "Сохранить в базу данных"
   - Укажите имя переменной для хранения ответа
   - Настройте валидацию (минимальная/максимальная длина)

5. Экспорт и запуск:
   - Нажмите "Экспорт" для генерации Python кода
   - Скопируйте код и запустите с токеном вашего бота
   - Ответы будут сохраняться в переменной user_data[user_id][variable_name]

ВАЖНО: Сгенерированный код будет включать:
- Проверку типа ввода
- Валидацию длины текста
- Сохранение в пользовательских данных
- Возможность сохранения в базу данных
- Обработку ошибок и повторных попыток
""")