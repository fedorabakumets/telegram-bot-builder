"""
Создание шаблона для демонстрации кнопочного ответа
"""
import requests
import json
from nanoid import generate

def create_button_response_template():
    """Создает шаблон для демонстрации кнопочных ответов в user-input узлах"""
    
    # Создаем узлы для шаблона
    nodes = []
    connections = []
    
    # Стартовый узел
    start_node = {
        "id": "start-1",
        "type": "start",
        "position": {"x": 100, "y": 100},
        "data": {
            "messageText": "👋 Добро пожаловать в опрос с кнопочными ответами!\n\nЭтот бот демонстрирует новую функцию - сбор ответов пользователей через кнопки выбора вместо текстового ввода.",
            "keyboardType": "inline",
            "buttons": [
                {
                    "id": generate(),
                    "text": "📝 Начать опрос",
                    "action": "goto",
                    "target": "question-1"
                }
            ],
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "formatMode": "none"
        }
    }
    
    # Первый вопрос - одиночный выбор
    question1_node = {
        "id": "question-1", 
        "type": "user-input",
        "position": {"x": 100, "y": 300},
        "data": {
            "inputPrompt": "🎯 Какой у вас уровень опыта в программировании?",
            "responseType": "buttons",
            "responseOptions": [
                {"id": "exp1", "text": "🌱 Новичок", "value": "beginner"},
                {"id": "exp2", "text": "⚡ Средний", "value": "intermediate"},
                {"id": "exp3", "text": "🚀 Продвинутый", "value": "advanced"},
                {"id": "exp4", "text": "🎓 Эксперт", "value": "expert"}
            ],
            "allowMultipleSelection": False,
            "inputVariable": "programming_level",
            "saveToDatabase": True,
            "inputSuccessMessage": "Отлично! Ваш уровень записан.",
            "inputType": "text",
            "keyboardType": "none",
            "buttons": [],
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "formatMode": "none"
        }
    }
    
    # Второй вопрос - множественный выбор
    question2_node = {
        "id": "question-2",
        "type": "user-input", 
        "position": {"x": 100, "y": 500},
        "data": {
            "inputPrompt": "💻 Какие языки программирования вас интересуют?\n\n(Можно выбрать несколько вариантов)",
            "responseType": "buttons",
            "responseOptions": [
                {"id": "lang1", "text": "🐍 Python", "value": "python"},
                {"id": "lang2", "text": "⚡ JavaScript", "value": "javascript"},
                {"id": "lang3", "text": "☕ Java", "value": "java"},
                {"id": "lang4", "text": "🔷 TypeScript", "value": "typescript"},
                {"id": "lang5", "text": "🦀 Rust", "value": "rust"},
                {"id": "lang6", "text": "⚙️ C++", "value": "cpp"}
            ],
            "allowMultipleSelection": True,
            "inputVariable": "preferred_languages",
            "saveToDatabase": True,
            "allowSkip": True,
            "inputSuccessMessage": "Супер! Ваши предпочтения сохранены.",
            "inputType": "text",
            "keyboardType": "none",
            "buttons": [],
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "formatMode": "none"
        }
    }
    
    # Третий вопрос - текстовый ввод для сравнения
    question3_node = {
        "id": "question-3",
        "type": "user-input",
        "position": {"x": 100, "y": 700},
        "data": {
            "inputPrompt": "📝 Теперь расскажите немного о себе (текстовый ввод):",
            "responseType": "text",
            "inputType": "text",
            "inputVariable": "about_user",
            "minLength": 10,
            "maxLength": 200,
            "saveToDatabase": True,
            "allowSkip": True,
            "inputSuccessMessage": "Спасибо за рассказ о себе!",
            "keyboardType": "none",
            "buttons": [],
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "formatMode": "none",
            "responseOptions": []
        }
    }
    
    # Финальный узел
    final_node = {
        "id": "final-1",
        "type": "message",
        "position": {"x": 100, "y": 900},
        "data": {
            "messageText": "🎉 Спасибо за участие в опросе!\n\n✅ Все ваши ответы сохранены в базе данных.\n\n🔍 Администратор может просмотреть собранные данные в панели управления ботом.",
            "keyboardType": "inline",
            "buttons": [
                {
                    "id": generate(),
                    "text": "🔄 Начать заново",
                    "action": "goto", 
                    "target": "start-1"
                }
            ],
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "formatMode": "none"
        }
    }
    
    nodes = [start_node, question1_node, question2_node, question3_node, final_node]
    
    # Создаем соединения
    connections = [
        {"id": "conn1", "source": "start-1", "target": "question-1"},
        {"id": "conn2", "source": "question-1", "target": "question-2"},
        {"id": "conn3", "source": "question-2", "target": "question-3"},
        {"id": "conn4", "source": "question-3", "target": "final-1"}
    ]
    
    bot_data = {
        "nodes": nodes,
        "connections": connections
    }
    
    template = {
        "name": "🔘 Опрос с кнопочными ответами",
        "description": "Демонстрация нового функционала - сбор ответов пользователей через кнопки выбора с поддержкой одиночного и множественного выбора",
        "data": json.dumps(bot_data),
        "category": "business",
        "difficulty": "easy",
        "language": "ru",
        "tags": ["опрос", "кнопки", "анкета", "сбор данных", "множественный выбор"],
        "estimatedTime": 3,
        "complexity": 2,
        "authorName": "TelegramBot Builder",
        "version": "1.0"
    }
    
    return template

def save_template_to_api():
    """Сохраняет шаблон через API"""
    template = create_button_response_template()
    
    try:
        response = requests.post(
            "http://localhost:5000/api/templates",
            json=template,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Шаблон '{template['name']}' успешно создан с ID: {result.get('id')}")
            return result
        else:
            print(f"❌ Ошибка создания шаблона: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Ошибка подключения к API: {e}")
        return None

if __name__ == "__main__":
    print("🔄 Создание шаблона кнопочных ответов...")
    result = save_template_to_api()
    if result:
        print("🎉 Шаблон готов к использованию!")