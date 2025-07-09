"""
Создание простого шаблона для сбора ответов пользователей
"""
import requests
import json
from datetime import datetime

def create_simple_survey_template():
    """Создает простой шаблон опроса с базовыми вопросами"""
    
    template_data = {
        "name": "Простой опрос пользователей",
        "description": "Базовый шаблон для сбора информации о пользователях",
        "category": "utility",
        "difficulty": "easy",
        "author": "TelegramBot Builder",
        "tags": ["опрос", "сбор данных", "анкета", "простой"],
        "data": {
            "nodes": [
            {
                "id": "start-welcome",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "messageText": "👋 Добро пожаловать!\n\nПривет! Я бот для сбора обратной связи. Помогите мне узнать вас лучше - ответьте на несколько простых вопросов.",
                    "formatMode": "html",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-start-survey",
                            "text": "📝 Начать опрос",
                            "action": "goto",
                            "target": "question-name"
                        },
                        {
                            "id": "btn-skip-survey",
                            "text": "⏭️ Пропустить",
                            "action": "goto",
                            "target": "end-message"
                        }
                    ]
                }
            },
            {
                "id": "question-name",
                "type": "user-input",
                "position": {"x": 350, "y": 100},
                "data": {
                    "messageText": "🙋‍♂️ <b>Вопрос 1 из 4</b>\n\nКак вас зовут? Напишите ваше имя:",
                    "formatMode": "html",
                    "inputType": "text",
                    "inputVariable": "response_name",
                    "inputRequired": True,
                    "inputMinLength": 2,
                    "inputMaxLength": 50,
                    "inputTimeout": 60,
                    "saveToDatabase": True,
                    "allowSkip": False,
                    "inputRetryMessage": "Пожалуйста, введите ваше имя (минимум 2 символа)",
                    "inputSuccessMessage": "Спасибо! Приятно познакомиться! 😊",
                    "keyboardType": "none",
                    "buttons": []
                }
            },
            {
                "id": "question-age",
                "type": "user-input", 
                "position": {"x": 600, "y": 100},
                "data": {
                    "messageText": "🎂 <b>Вопрос 2 из 4</b>\n\nСколько вам лет? Укажите ваш возраст:",
                    "formatMode": "html",
                    "inputType": "number",
                    "inputVariable": "response_age",
                    "inputRequired": True,
                    "inputMinLength": 1,
                    "inputMaxLength": 3,
                    "inputTimeout": 60,
                    "saveToDatabase": True,
                    "allowSkip": True,
                    "inputRetryMessage": "Введите корректный возраст (число от 1 до 120)",
                    "inputSuccessMessage": "Отлично! Переходим к следующему вопросу",
                    "keyboardType": "none",
                    "buttons": []
                }
            },
            {
                "id": "question-city",
                "type": "user-input",
                "position": {"x": 850, "y": 100},
                "data": {
                    "messageText": "🏙️ <b>Вопрос 3 из 4</b>\n\nИз какого вы города? Напишите название:",
                    "formatMode": "html",
                    "inputType": "text",
                    "inputVariable": "response_city",
                    "inputRequired": False,
                    "inputMinLength": 2,
                    "inputMaxLength": 50,
                    "inputTimeout": 60,
                    "saveToDatabase": True,
                    "allowSkip": True,
                    "inputRetryMessage": "Введите название города (минимум 2 символа)",
                    "inputSuccessMessage": "Интересно! Последний вопрос",
                    "keyboardType": "none",
                    "buttons": []
                }
            },
            {
                "id": "question-feedback",
                "type": "user-input",
                "position": {"x": 1100, "y": 100},
                "data": {
                    "messageText": "💭 <b>Вопрос 4 из 4</b>\n\nПоделитесь вашим мнением о боте - что вам понравилось или что можно улучшить?",
                    "formatMode": "html",
                    "inputType": "text",
                    "inputVariable": "response_feedback",
                    "inputRequired": False,
                    "inputMinLength": 5,
                    "inputMaxLength": 500,
                    "inputTimeout": 120,
                    "saveToDatabase": True,
                    "allowSkip": True,
                    "inputRetryMessage": "Расскажите немного подробнее (минимум 5 символов)",
                    "inputSuccessMessage": "Спасибо за обратную связь! Это очень ценно для нас",
                    "keyboardType": "none",
                    "buttons": []
                }
            },
            {
                "id": "end-message",
                "type": "message",
                "position": {"x": 1350, "y": 100},
                "data": {
                    "messageText": "🎉 <b>Спасибо за участие!</b>\n\nВы успешно прошли опрос. Ваши ответы помогут нам стать лучше!\n\n✨ Хорошего дня!",
                    "formatMode": "html",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-restart",
                            "text": "🔄 Пройти заново",
                            "action": "goto",
                            "target": "start-welcome"
                        }
                    ]
                }
            }
            ],
            "connections": [
            {
                "id": "conn-start-to-name",
                "source": "start-welcome",
                "target": "question-name",
                "sourceHandle": "btn-start-survey",
                "targetHandle": None
            },
            {
                "id": "conn-start-to-end",
                "source": "start-welcome", 
                "target": "end-message",
                "sourceHandle": "btn-skip-survey",
                "targetHandle": None
            },
            {
                "id": "conn-name-to-age",
                "source": "question-name",
                "target": "question-age",
                "sourceHandle": None,
                "targetHandle": None
            },
            {
                "id": "conn-age-to-city", 
                "source": "question-age",
                "target": "question-city",
                "sourceHandle": None,
                "targetHandle": None
            },
            {
                "id": "conn-city-to-feedback",
                "source": "question-city",
                "target": "question-feedback",
                "sourceHandle": None,
                "targetHandle": None
            },
            {
                "id": "conn-feedback-to-end",
                "source": "question-feedback",
                "target": "end-message",
                "sourceHandle": None,
                "targetHandle": None
            },
            {
                "id": "conn-end-to-start",
                "source": "end-message",
                "target": "start-welcome",
                "sourceHandle": "btn-restart",
                "targetHandle": None
            }
            ]
        }
    }
    
    return template_data

def save_template_to_api():
    """Сохраняет шаблон через API"""
    try:
        template_data = create_simple_survey_template()
        
        # Сохраняем как шаблон
        response = requests.post('http://localhost:5000/api/templates', 
                               json=template_data,
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Шаблон успешно создан с ID: {result.get('id')}")
            print(f"📝 Название: {template_data['name']}")
            print(f"📋 Описание: {template_data['description']}")
            print(f"🏷️ Категория: {template_data['category']}")
            print(f"⭐ Сложность: {template_data['difficulty']}")
            print(f"🔗 Узлов: {len(template_data['nodes'])}")
            print(f"🔗 Связей: {len(template_data['connections'])}")
            return result
        else:
            print(f"❌ Ошибка при создании шаблона: {response.status_code}")
            print(f"Ответ: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return None

if __name__ == "__main__":
    print("🚀 Создание простого шаблона опроса...")
    result = save_template_to_api()
    if result:
        print("\n🎯 Шаблон готов к использованию!")
        print("Вы можете найти его в разделе 'Шаблоны' в категории 'Опросы'")