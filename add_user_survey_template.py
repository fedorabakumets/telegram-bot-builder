"""
Добавление шаблона для сбора пользовательских ответов
"""
import requests
import json

# Данные шаблона
template_data = {
    "name": "Опрос пользователей",
    "description": "Приветствие с вопросом и сбор детальных ответов пользователей",
    "category": "survey",
    "difficulty": "medium",
    "author": "system",
    "tags": ["опрос", "сбор данных", "пользовательский ввод", "анкета"],
    "botData": {
        "nodes": [
            {
                "id": "start-welcome",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "command": "/start",
                    "description": "Запустить бота",
                    "messageText": "Привет! 👋 Добро пожаловать в наш бот!\n\nОткуда ты узнал о нашем боте?",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "social-btn",
                            "text": "📱 Из социальных сетей",
                            "action": "goto",
                            "target": "social-networks"
                        },
                        {
                            "id": "friends-btn", 
                            "text": "👥 От друзей/знакомых",
                            "action": "goto",
                            "target": "friends-recommendation"
                        },
                        {
                            "id": "search-btn",
                            "text": "🔍 Через поиск",
                            "action": "goto",
                            "target": "search-engines"
                        },
                        {
                            "id": "other-btn",
                            "text": "📝 Другое (написать)",
                            "action": "goto",
                            "target": "other-source-input"
                        }
                    ],
                    "markdown": True,
                    "oneTimeKeyboard": False,
                    "resizeKeyboard": True,
                    "showInMenu": True,
                    "isPrivateOnly": False,
                    "requiresAuth": False,
                    "adminOnly": False
                }
            },
            {
                "id": "social-networks",
                "type": "message",
                "position": {"x": 400, "y": 50},
                "data": {
                    "messageText": "📱 Отлично! Социальные сети - мощный инструмент для знакомства с новыми сервисами.\n\nСпасибо за ответ! Мы учтем эту информацию для улучшения нашего присутствия в соцсетях.",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "continue-btn1",
                            "text": "➡️ Продолжить",
                            "action": "goto",
                            "target": "thank-you"
                        }
                    ],
                    "markdown": true,
                    "oneTimeKeyboard": false,
                    "resizeKeyboard": true
                }
            },
            {
                "id": "friends-recommendation",
                "type": "message",
                "position": {"x": 400, "y": 150},
                "data": {
                    "messageText": "👥 Здорово! Рекомендации от друзей - лучшая реклама для нас.\n\nПередайте им наши благодарности! Сарафанное радио работает лучше всех маркетинговых кампаний.",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "continue-btn2",
                            "text": "➡️ Продолжить",
                            "action": "goto",
                            "target": "thank-you"
                        }
                    ],
                    "markdown": true,
                    "oneTimeKeyboard": false,
                    "resizeKeyboard": true
                }
            },
            {
                "id": "search-engines",
                "type": "message",
                "position": {"x": 400, "y": 250},
                "data": {
                    "messageText": "🔍 Прекрасно! Значит, наши усилия по SEO не прошли даром.\n\nМы работаем над тем, чтобы наш бот был легко найти через поисковые системы.",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "continue-btn3",
                            "text": "➡️ Продолжить",
                            "action": "goto",
                            "target": "thank-you"
                        }
                    ],
                    "markdown": true,
                    "oneTimeKeyboard": false,
                    "resizeKeyboard": true
                }
            },
            {
                "id": "other-source-input",
                "type": "user-input",
                "position": {"x": 400, "y": 350},
                "data": {
                    "inputPrompt": "📝 Пожалуйста, расскажите подробнее, откуда вы узнали о нашем боте:\n\n💡 Например: из рекламы, от коллег, из статьи, с форума и т.д.",
                    "inputType": "text",
                    "inputVariable": "discovery_source",
                    "inputValidation": "",
                    "minLength": 5,
                    "maxLength": 500,
                    "inputTimeout": 300,
                    "inputRequired": true,
                    "allowSkip": false,
                    "saveToDatabase": true,
                    "inputRetryMessage": "Пожалуйста, напишите хотя бы несколько слов (минимум 5 символов).",
                    "inputSuccessMessage": "Спасибо за подробный ответ! 🙏",
                    "placeholder": "Например: из рекламы ВКонтакте, от коллег на работе...",
                    "defaultValue": "",
                    "keyboardType": "none",
                    "buttons": [],
                    "markdown": true,
                    "oneTimeKeyboard": false,
                    "resizeKeyboard": true
                }
            },
            {
                "id": "thank-you",
                "type": "message",
                "position": {"x": 700, "y": 200},
                "data": {
                    "messageText": "🎉 Спасибо за участие в опросе!\n\nВаша обратная связь очень важна для нас. Она помогает улучшать наш сервис и понимать, где нас находят пользователи.\n\n✨ Теперь вы можете пользоваться всеми возможностями нашего бота!",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "menu-btn",
                            "text": "📋 Главное меню",
                            "action": "command",
                            "target": "/menu"
                        },
                        {
                            "id": "help-btn",
                            "text": "❓ Помощь",
                            "action": "command",
                            "target": "/help"
                        }
                    ],
                    "markdown": true,
                    "oneTimeKeyboard": false,
                    "resizeKeyboard": true
                }
            }
        ],
        "connections": [
            {"from": "start-welcome", "to": "social-networks"},
            {"from": "start-welcome", "to": "friends-recommendation"},
            {"from": "start-welcome", "to": "search-engines"},
            {"from": "start-welcome", "to": "other-source-input"},
            {"from": "social-networks", "to": "thank-you"},
            {"from": "friends-recommendation", "to": "thank-you"},
            {"from": "search-engines", "to": "thank-you"},
            {"from": "other-source-input", "to": "thank-you"}
        ]
    }
}

# Добавляем шаблон через API
def add_template():
    try:
        response = requests.post('http://localhost:5000/api/templates', json=template_data)
        if response.status_code == 201:
            print("✅ Шаблон успешно добавлен!")
            print(f"ID шаблона: {response.json()['id']}")
        else:
            print(f"❌ Ошибка при добавлении шаблона: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")

if __name__ == "__main__":
    add_template()