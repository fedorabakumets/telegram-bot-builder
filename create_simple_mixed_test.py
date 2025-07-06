"""
Создание простого тестового бота с Reply и Inline клавиатурами
"""

import requests
import json

def create_simple_mixed_bot():
    """Создаёт простой бот с смешанными клавиатурами"""
    
    print("🔄 СОЗДАНИЕ ПРОСТОГО СМЕШАННОГО БОТА")
    print("=" * 40)
    
    # Простая структура с 6 узлами
    bot_data = {
        "nodes": [
            # 1. Стартовый узел с Reply клавиатурой
            {
                "id": "start-1",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "command": "/start",
                    "description": "Запуск бота",
                    "messageText": "Добро пожаловать! Выберите раздел:",
                    "keyboardType": "reply",
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False,
                    "buttons": [
                        {
                            "id": "btn-1",
                            "text": "📋 Меню",
                            "action": "goto",
                            "target": "menu-2"
                        },
                        {
                            "id": "btn-2", 
                            "text": "⚙️ Настройки",
                            "action": "goto",
                            "target": "settings-3"
                        },
                        {
                            "id": "btn-3",
                            "text": "📞 Контакт",
                            "action": "contact",
                            "requestContact": True
                        }
                    ]
                }
            },
            
            # 2. Меню с Inline клавиатурой
            {
                "id": "menu-2",
                "type": "message",
                "position": {"x": 400, "y": 100},
                "data": {
                    "messageText": "**Главное меню**\n\nВыберите действие:",
                    "keyboardType": "inline",
                    "markdown": True,
                    "buttons": [
                        {
                            "id": "btn-4",
                            "text": "🛠️ Услуги",
                            "action": "goto",
                            "target": "services-4"
                        },
                        {
                            "id": "btn-5",
                            "text": "🌐 Сайт",
                            "action": "url",
                            "url": "https://example.com"
                        },
                        {
                            "id": "btn-6",
                            "text": "🔙 Назад",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                }
            },
            
            # 3. Настройки с Reply клавиатурой
            {
                "id": "settings-3",
                "type": "message",
                "position": {"x": 100, "y": 400},
                "data": {
                    "messageText": "Настройки бота:",
                    "keyboardType": "reply",
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": True,
                    "buttons": [
                        {
                            "id": "btn-7",
                            "text": "🌐 Язык",
                            "action": "goto",
                            "target": "language-5"
                        },
                        {
                            "id": "btn-8",
                            "text": "🔔 Уведомления",
                            "action": "goto",
                            "target": "notifications-6"
                        },
                        {
                            "id": "btn-9",
                            "text": "🔙 Главная",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                }
            },
            
            # 4. Услуги с Reply клавиатурой
            {
                "id": "services-4",
                "type": "message",
                "position": {"x": 700, "y": 100},
                "data": {
                    "messageText": "Наши услуги:\n• Консультации\n• Разработка",
                    "keyboardType": "reply",
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False,
                    "buttons": [
                        {
                            "id": "btn-10",
                            "text": "💬 Консультации",
                            "action": "goto",
                            "target": "menu-2"
                        },
                        {
                            "id": "btn-11",
                            "text": "💻 Разработка",
                            "action": "goto",
                            "target": "menu-2"
                        },
                        {
                            "id": "btn-12",
                            "text": "📍 Геолокация",
                            "action": "location",
                            "requestLocation": True
                        }
                    ]
                }
            },
            
            # 5. Язык с Inline клавиатурой
            {
                "id": "language-5",
                "type": "message",
                "position": {"x": 400, "y": 400},
                "data": {
                    "messageText": "**Выбор языка:**",
                    "keyboardType": "inline",
                    "markdown": True,
                    "buttons": [
                        {
                            "id": "btn-13",
                            "text": "🇷🇺 Русский",
                            "action": "goto",
                            "target": "settings-3"
                        },
                        {
                            "id": "btn-14",
                            "text": "🇺🇸 English",
                            "action": "goto",
                            "target": "settings-3"
                        }
                    ]
                }
            },
            
            # 6. Уведомления с удалением клавиатуры
            {
                "id": "notifications-6",
                "type": "message",
                "position": {"x": 700, "y": 400},
                "data": {
                    "messageText": "Уведомления настроены!",
                    "keyboardType": "none"
                }
            }
        ],
        
        "connections": [
            {"id": "c1", "source": "start-1", "target": "menu-2"},
            {"id": "c2", "source": "start-1", "target": "settings-3"},
            {"id": "c3", "source": "menu-2", "target": "services-4"},
            {"id": "c4", "source": "menu-2", "target": "start-1"},
            {"id": "c5", "source": "settings-3", "target": "language-5"},
            {"id": "c6", "source": "settings-3", "target": "notifications-6"},
            {"id": "c7", "source": "settings-3", "target": "start-1"},
            {"id": "c8", "source": "services-4", "target": "menu-2"},
            {"id": "c9", "source": "language-5", "target": "settings-3"}
        ]
    }
    
    try:
        # Создаём новый проект
        response = requests.post('http://localhost:5000/api/projects', 
                               json={
                                   "name": "🔄 Простой смешанный бот",
                                   "description": "Простой тест смешанных клавиатур",
                                   "data": bot_data
                               })
        
        if response.status_code == 201:
            project = response.json()
            project_id = project['id']
            print(f"✅ Проект создан! ID: {project_id}")
            
            # Статистика
            reply_nodes = [n for n in bot_data['nodes'] if n['data'].get('keyboardType') == 'reply']
            inline_nodes = [n for n in bot_data['nodes'] if n['data'].get('keyboardType') == 'inline']
            none_nodes = [n for n in bot_data['nodes'] if n['data'].get('keyboardType') == 'none']
            
            print(f"📊 Reply узлов: {len(reply_nodes)}")
            print(f"📊 Inline узлов: {len(inline_nodes)}")
            print(f"📊 Без клавиатур: {len(none_nodes)}")
            print(f"📊 Всего узлов: {len(bot_data['nodes'])}")
            print(f"📊 Связей: {len(bot_data['connections'])}")
            
            return project_id
            
        else:
            print(f"❌ Ошибка: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return None

def main():
    project_id = create_simple_mixed_bot()
    
    if project_id:
        print(f"\n🎉 ПРОСТОЙ СМЕШАННЫЙ БОТ СОЗДАН!")
        print(f"🔢 ID проекта: {project_id}")
    else:
        print("\n❌ Не удалось создать бот")

if __name__ == "__main__":
    main()