"""
Тестирование генерации кода для кнопочных ответов
"""

import requests
import json
from nanoid import generate

def create_test_bot():
    """Создает тестовый бот с кнопочными ответами"""
    
    # Узел старт
    start_node = {
        "id": "start-1",
        "type": "start",
        "position": {"x": 100, "y": 100},
        "data": {
            "messageText": "🧪 Тестовый бот с кнопочными ответами",
            "keyboardType": "inline",
            "buttons": [
                {
                    "id": generate(),
                    "text": "🎯 Начать тест",
                    "action": "goto",
                    "target": "question-buttons"
                }
            ],
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "formatMode": "none"
        }
    }
    
    # Вопрос с кнопками - одиночный выбор
    question_buttons_node = {
        "id": "question-buttons",
        "type": "user-input",
        "position": {"x": 100, "y": 300},
        "data": {
            "inputPrompt": "🔘 Выберите ваш любимый цвет:",
            "responseType": "buttons",
            "responseOptions": [
                {"id": "color1", "text": "🔴 Красный", "value": "red"},
                {"id": "color2", "text": "🟢 Зеленый", "value": "green"},
                {"id": "color3", "text": "🔵 Синий", "value": "blue"}
            ],
            "allowMultipleSelection": False,
            "inputVariable": "favorite_color",
            "saveToDatabase": True,
            "inputSuccessMessage": "Отлично! Цвет сохранен.",
            "inputType": "text",
            "keyboardType": "none",
            "buttons": [],
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "formatMode": "none"
        }
    }
    
    # Вопрос с множественным выбором
    question_multi_node = {
        "id": "question-multi",
        "type": "user-input",
        "position": {"x": 100, "y": 500},
        "data": {
            "inputPrompt": "🎯 Выберите интересы (можно несколько):",
            "responseType": "buttons",
            "responseOptions": [
                {"id": "int1", "text": "📚 Чтение", "value": "reading"},
                {"id": "int2", "text": "🎵 Музыка", "value": "music"},
                {"id": "int3", "text": "⚽ Спорт", "value": "sport"},
                {"id": "int4", "text": "🎮 Игры", "value": "games"}
            ],
            "allowMultipleSelection": True,
            "inputVariable": "interests",
            "saveToDatabase": True,
            "inputSuccessMessage": "Интересы записаны!",
            "inputType": "text",
            "keyboardType": "none",
            "buttons": [],
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "formatMode": "none"
        }
    }
    
    # Финальный узел
    final_node = {
        "id": "final-1",
        "type": "message",
        "position": {"x": 100, "y": 700},
        "data": {
            "messageText": "✅ Тест завершен! Все ответы сохранены.",
            "keyboardType": "inline",
            "buttons": [
                {
                    "id": generate(),
                    "text": "🔄 Повторить",
                    "action": "goto",
                    "target": "start-1"
                }
            ],
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "formatMode": "none"
        }
    }
    
    nodes = [start_node, question_buttons_node, question_multi_node, final_node]
    connections = [
        {"id": "conn1", "source": "start-1", "target": "question-buttons"},
        {"id": "conn2", "source": "question-buttons", "target": "question-multi"},
        {"id": "conn3", "source": "question-multi", "target": "final-1"}
    ]
    
    bot_data = {
        "nodes": nodes,
        "connections": connections
    }
    
    project_data = {
        "name": "🧪 Тест кнопочных ответов",
        "description": "Тестовый бот для проверки генерации кода с кнопочными ответами",
        "data": json.dumps(bot_data)
    }
    
    return project_data

def test_bot_generation():
    """Тестирует создание бота и генерацию кода"""
    
    try:
        print("🔄 Создание тестового бота...")
        
        # Создаем проект
        project_data = create_test_bot()
        response = requests.post(
            "http://localhost:5000/api/projects",
            json=project_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 201:
            print(f"❌ Ошибка создания проекта: {response.status_code} - {response.text}")
            return
            
        project = response.json()
        project_id = project['id']
        print(f"✅ Проект создан с ID: {project_id}")
        
        # Генерируем код
        print("🔄 Генерация Python кода...")
        
        response = requests.post(
            f"http://localhost:5000/api/projects/{project_id}/export"
        )
        
        if response.status_code != 200:
            print(f"❌ Ошибка генерации кода: {response.status_code} - {response.text}")
            return
            
        export_data = response.json()
        print(f"📝 Структура ответа: {list(export_data.keys())}")
        
        # Попробуем разные варианты получения кода
        python_code = ""
        if 'files' in export_data and 'bot.py' in export_data['files']:
            python_code = export_data['files']['bot.py']
        elif 'code' in export_data:
            python_code = export_data['code']
        elif 'pythonCode' in export_data:
            python_code = export_data['pythonCode']
        
        if not python_code:
            print(f"❌ Код не найден. Доступные ключи: {export_data.keys()}")
            print(f"📄 Полный ответ: {export_data}")
            return
            
        print("✅ Код успешно сгенерирован!")
        
        # Сохраняем код в файл для проверки
        with open(f"test_button_bot_{project_id}.py", "w", encoding="utf-8") as f:
            f.write(python_code)
        
        print(f"💾 Код сохранен в test_button_bot_{project_id}.py")
        
        # Анализируем код
        print("\n🔍 Анализ сгенерированного кода:")
        
        # Проверяем наличие обработчиков кнопочных ответов
        if "handle_user_input" in python_code:
            print("✅ Обработчик пользовательского ввода найден")
        else:
            print("❌ Обработчик пользовательского ввода не найден")
            
        if "responseOptions" in python_code or "response_options" in python_code:
            print("✅ Обработка кнопочных ответов найдена")
        else:
            print("❌ Обработка кнопочных ответов не найдена")
            
        if "allowMultipleSelection" in python_code or "allow_multiple_selection" in python_code:
            print("✅ Поддержка множественного выбора найдена")
        else:
            print("❌ Поддержка множественного выбора не найдена")
            
        if "save_user_to_db" in python_code or "update_user_data_in_db" in python_code:
            print("✅ Сохранение в базу данных найдено")
        else:
            print("❌ Сохранение в базу данных не найдено")
            
        # Подсчитываем callback обработчики
        callback_handlers = python_code.count("async def handle_callback_")
        print(f"📊 Callback обработчиков найдено: {callback_handlers}")
        
        # Проверяем наличие inline кнопок
        if "InlineKeyboardMarkup" in python_code and "InlineKeyboardButton" in python_code:
            print("✅ Поддержка inline кнопок найдена")
        else:
            print("❌ Поддержка inline кнопок не найдена")
            
        print(f"\n🎉 Тестирование завершено! Файл: test_button_bot_{project_id}.py")
        
    except Exception as e:
        print(f"❌ Ошибка тестирования: {e}")

if __name__ == "__main__":
    test_bot_generation()