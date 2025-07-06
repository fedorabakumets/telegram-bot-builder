"""
Создание комплексного тестового бота с Reply и Inline клавиатурами
"""

import requests
import json
from typing import Dict, List

def create_mixed_keyboards_bot():
    """Создаёт комплексный бот с Reply и Inline клавиатурами и переходами"""
    
    print("🔄 СОЗДАНИЕ ТЕСТОВОГО БОТА С СМЕШАННЫМИ КЛАВИАТУРАМИ")
    print("=" * 55)
    
    # Структура бота с разными типами клавиатур и переходами
    bot_data = {
        "nodes": [
            # 1. Стартовый узел с Reply клавиатурой
            {
                "id": "start-node",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "command": "/start",
                    "description": "Запуск бота",
                    "messageText": "🤖 Добро пожаловать в тестовый бот!\n\nВыберите раздел из меню ниже:",
                    "keyboardType": "reply",
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False,
                    "buttons": [
                        {
                            "id": "btn_main_menu",
                            "text": "📋 Главное меню",
                            "action": "goto",
                            "target": "main-menu-node"
                        },
                        {
                            "id": "btn_settings",
                            "text": "⚙️ Настройки",
                            "action": "goto",
                            "target": "settings-node"
                        },
                        {
                            "id": "btn_contact",
                            "text": "📞 Мой контакт",
                            "action": "contact",
                            "requestContact": True
                        },
                        {
                            "id": "btn_location",
                            "text": "📍 Моя геолокация",
                            "action": "location",
                            "requestLocation": True
                        }
                    ]
                }
            },
            
            # 2. Главное меню с Inline клавиатурой
            {
                "id": "main-menu-node",
                "type": "message",
                "position": {"x": 400, "y": 100},
                "data": {
                    "messageText": "📋 **Главное меню**\n\nВыберите действие:",
                    "keyboardType": "inline",
                    "markdown": True,
                    "buttons": [
                        {
                            "id": "btn_services",
                            "text": "🛠️ Услуги",
                            "action": "goto",
                            "target": "services-node"
                        },
                        {
                            "id": "btn_info",
                            "text": "ℹ️ Информация",
                            "action": "goto",
                            "target": "info-node"
                        },
                        {
                            "id": "btn_website",
                            "text": "🌐 Наш сайт",
                            "action": "url",
                            "url": "https://example.com"
                        },
                        {
                            "id": "btn_back_start",
                            "text": "🔙 Назад",
                            "action": "goto",
                            "target": "start-node"
                        }
                    ]
                }
            },
            
            # 3. Услуги с Reply клавиатурой
            {
                "id": "services-node",
                "type": "message",
                "position": {"x": 700, "y": 100},
                "data": {
                    "messageText": "🛠️ Наши услуги:\n\n• Консультации\n• Разработка\n• Поддержка\n\nВыберите нужную услугу:",
                    "keyboardType": "reply",
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False,
                    "buttons": [
                        {
                            "id": "btn_consulting",
                            "text": "💬 Консультации",
                            "action": "goto",
                            "target": "consulting-node"
                        },
                        {
                            "id": "btn_development",
                            "text": "💻 Разработка",
                            "action": "goto",
                            "target": "development-node"
                        },
                        {
                            "id": "btn_support",
                            "text": "🆘 Поддержка",
                            "action": "goto",
                            "target": "support-node"
                        },
                        {
                            "id": "btn_back_menu",
                            "text": "🔙 Главное меню",
                            "action": "goto",
                            "target": "main-menu-node"
                        }
                    ]
                }
            },
            
            # 4. Консультации с Inline клавиатурой
            {
                "id": "consulting-node",
                "type": "message",
                "position": {"x": 1000, "y": 50},
                "data": {
                    "messageText": "💬 **Консультации**\n\nМы предоставляем:\n• Техническую поддержку\n• Бизнес-консультации\n• Обучение персонала",
                    "keyboardType": "inline",
                    "markdown": True,
                    "buttons": [
                        {
                            "id": "btn_tech_support",
                            "text": "🔧 Техподдержка",
                            "action": "goto",
                            "target": "tech-support-node"
                        },
                        {
                            "id": "btn_business",
                            "text": "💼 Бизнес",
                            "action": "goto",
                            "target": "business-node"
                        },
                        {
                            "id": "btn_training",
                            "text": "📚 Обучение",
                            "action": "goto",
                            "target": "training-node"
                        },
                        {
                            "id": "btn_back_services",
                            "text": "🔙 К услугам",
                            "action": "goto",
                            "target": "services-node"
                        }
                    ]
                }
            },
            
            # 5. Техподдержка с Reply клавиатурой
            {
                "id": "tech-support-node",
                "type": "message",
                "position": {"x": 1300, "y": 0},
                "data": {
                    "messageText": "🔧 Техническая поддержка\n\nВыберите тип проблемы:",
                    "keyboardType": "reply",
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": True,
                    "buttons": [
                        {
                            "id": "btn_bug_report",
                            "text": "🐛 Сообщить об ошибке",
                            "action": "goto",
                            "target": "bug-report-node"
                        },
                        {
                            "id": "btn_feature_request",
                            "text": "💡 Запросить функцию",
                            "action": "goto",
                            "target": "feature-request-node"
                        },
                        {
                            "id": "btn_back_consulting",
                            "text": "🔙 К консультациям",
                            "action": "goto",
                            "target": "consulting-node"
                        }
                    ]
                }
            },
            
            # 6. Отчёт об ошибке с удалением клавиатуры
            {
                "id": "bug-report-node",
                "type": "message",
                "position": {"x": 1600, "y": -50},
                "data": {
                    "messageText": "🐛 Отчёт об ошибке отправлен!\n\nМы рассмотрим вашу заявку в течение 24 часов.",
                    "keyboardType": "none"
                }
            },
            
            # 7. Запрос функции с Inline клавиатурой
            {
                "id": "feature-request-node",
                "type": "message",
                "position": {"x": 1600, "y": 50},
                "data": {
                    "messageText": "💡 **Запрос новой функции**\n\nВаше предложение принято! Выберите приоритет:",
                    "keyboardType": "inline",
                    "markdown": True,
                    "buttons": [
                        {
                            "id": "btn_high_priority",
                            "text": "🔴 Высокий",
                            "action": "goto",
                            "target": "priority-high-node"
                        },
                        {
                            "id": "btn_medium_priority",
                            "text": "🟡 Средний",
                            "action": "goto",
                            "target": "priority-medium-node"
                        },
                        {
                            "id": "btn_low_priority",
                            "text": "🟢 Низкий",
                            "action": "goto",
                            "target": "priority-low-node"
                        }
                    ]
                }
            },
            
            # 8. Высокий приоритет
            {
                "id": "priority-high-node",
                "type": "message",
                "position": {"x": 1900, "y": 0},
                "data": {
                    "messageText": "🔴 Запрос с высоким приоритетом зарегистрирован!\n\nМы свяжемся с вами в ближайшее время.",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn_contact_manager",
                            "text": "📞 Связаться с менеджером",
                            "action": "goto",
                            "target": "manager-contact-node"
                        },
                        {
                            "id": "btn_back_main",
                            "text": "🏠 Главное меню",
                            "action": "goto",
                            "target": "main-menu-node"
                        }
                    ]
                }
            },
            
            # 9. Связь с менеджером
            {
                "id": "manager-contact-node",
                "type": "message",
                "position": {"x": 2200, "y": 0},
                "data": {
                    "messageText": "📞 Контакты менеджера:\n\n👤 Иван Петров\n📱 +7 (999) 123-45-67\n📧 manager@example.com\n\nРабочие часы: Пн-Пт 9:00-18:00",
                    "keyboardType": "reply",
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False,
                    "buttons": [
                        {
                            "id": "btn_call_manager",
                            "text": "📞 Позвонить",
                            "action": "url",
                            "url": "tel:+79991234567"
                        },
                        {
                            "id": "btn_email_manager",
                            "text": "📧 Написать email",
                            "action": "url",
                            "url": "mailto:manager@example.com"
                        },
                        {
                            "id": "btn_restart",
                            "text": "🔄 Начать сначала",
                            "action": "goto",
                            "target": "start-node"
                        }
                    ]
                }
            },
            
            # 10. Настройки с Inline клавиатурой
            {
                "id": "settings-node",
                "type": "message",
                "position": {"x": 400, "y": 400},
                "data": {
                    "messageText": "⚙️ **Настройки**\n\nВыберите параметр для изменения:",
                    "keyboardType": "inline",
                    "markdown": True,
                    "buttons": [
                        {
                            "id": "btn_language",
                            "text": "🌐 Язык",
                            "action": "goto",
                            "target": "language-node"
                        },
                        {
                            "id": "btn_notifications",
                            "text": "🔔 Уведомления",
                            "action": "goto",
                            "target": "notifications-node"
                        },
                        {
                            "id": "btn_profile",
                            "text": "👤 Профиль",
                            "action": "goto",
                            "target": "profile-node"
                        },
                        {
                            "id": "btn_back_start_2",
                            "text": "🔙 Назад",
                            "action": "goto",
                            "target": "start-node"
                        }
                    ]
                }
            },
            
            # 11. Выбор языка с Reply клавиатурой
            {
                "id": "language-node",
                "type": "message",
                "position": {"x": 700, "y": 400},
                "data": {
                    "messageText": "🌐 Выберите язык интерфейса:",
                    "keyboardType": "reply",
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False,
                    "buttons": [
                        {
                            "id": "btn_lang_ru",
                            "text": "🇷🇺 Русский",
                            "action": "goto",
                            "target": "lang-set-node"
                        },
                        {
                            "id": "btn_lang_en",
                            "text": "🇺🇸 English",
                            "action": "goto",
                            "target": "lang-set-node"
                        },
                        {
                            "id": "btn_lang_de",
                            "text": "🇩🇪 Deutsch",
                            "action": "goto",
                            "target": "lang-set-node"
                        },
                        {
                            "id": "btn_back_settings",
                            "text": "🔙 К настройкам",
                            "action": "goto",
                            "target": "settings-node"
                        }
                    ]
                }
            },
            
            # 12. Язык установлен
            {
                "id": "lang-set-node",
                "type": "message",
                "position": {"x": 1000, "y": 400},
                "data": {
                    "messageText": "✅ Язык интерфейса изменён!\n\nИзменения вступят в силу при следующем запуске.",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn_restart_bot",
                            "text": "🔄 Перезапустить",
                            "action": "goto",
                            "target": "start-node"
                        },
                        {
                            "id": "btn_continue_settings",
                            "text": "⚙️ Продолжить настройку",
                            "action": "goto",
                            "target": "settings-node"
                        }
                    ]
                }
            }
        ],
        
        "connections": [
            # Основные переходы
            {"id": "conn1", "source": "start-node", "target": "main-menu-node"},
            {"id": "conn2", "source": "start-node", "target": "settings-node"},
            {"id": "conn3", "source": "main-menu-node", "target": "services-node"},
            {"id": "conn4", "source": "main-menu-node", "target": "info-node"},
            {"id": "conn5", "source": "main-menu-node", "target": "start-node"},
            {"id": "conn6", "source": "services-node", "target": "consulting-node"},
            {"id": "conn7", "source": "services-node", "target": "development-node"},
            {"id": "conn8", "source": "services-node", "target": "support-node"},
            {"id": "conn9", "source": "services-node", "target": "main-menu-node"},
            {"id": "conn10", "source": "consulting-node", "target": "tech-support-node"},
            {"id": "conn11", "source": "consulting-node", "target": "business-node"},
            {"id": "conn12", "source": "consulting-node", "target": "training-node"},
            {"id": "conn13", "source": "consulting-node", "target": "services-node"},
            {"id": "conn14", "source": "tech-support-node", "target": "bug-report-node"},
            {"id": "conn15", "source": "tech-support-node", "target": "feature-request-node"},
            {"id": "conn16", "source": "tech-support-node", "target": "consulting-node"},
            {"id": "conn17", "source": "feature-request-node", "target": "priority-high-node"},
            {"id": "conn18", "source": "feature-request-node", "target": "priority-medium-node"},
            {"id": "conn19", "source": "feature-request-node", "target": "priority-low-node"},
            {"id": "conn20", "source": "priority-high-node", "target": "manager-contact-node"},
            {"id": "conn21", "source": "priority-high-node", "target": "main-menu-node"},
            {"id": "conn22", "source": "manager-contact-node", "target": "start-node"},
            {"id": "conn23", "source": "settings-node", "target": "language-node"},
            {"id": "conn24", "source": "settings-node", "target": "notifications-node"},
            {"id": "conn25", "source": "settings-node", "target": "profile-node"},
            {"id": "conn26", "source": "settings-node", "target": "start-node"},
            {"id": "conn27", "source": "language-node", "target": "lang-set-node"},
            {"id": "conn28", "source": "language-node", "target": "settings-node"},
            {"id": "conn29", "source": "lang-set-node", "target": "start-node"},
            {"id": "conn30", "source": "lang-set-node", "target": "settings-node"}
        ]
    }
    
    try:
        # Создаём новый проект
        response = requests.post('http://localhost:5000/api/projects', 
                               json={
                                   "name": "🔄 Смешанные клавиатуры v2",
                                   "description": "Тестовый бот с Reply и Inline клавиатурами и переходами",
                                   "data": bot_data
                               })
        
        if response.status_code == 201:
            project = response.json()
            project_id = project['id']
            print(f"✅ Проект создан успешно! ID: {project_id}")
            print(f"📋 Название: {project['name']}")
            print(f"📝 Описание: {project['description']}")
            print(f"🔢 Узлов: {len(bot_data['nodes'])}")
            print(f"🔗 Связей: {len(bot_data['connections'])}")
            
            # Статистика по типам клавиатур
            reply_nodes = [n for n in bot_data['nodes'] if n['data'].get('keyboardType') == 'reply']
            inline_nodes = [n for n in bot_data['nodes'] if n['data'].get('keyboardType') == 'inline']
            none_nodes = [n for n in bot_data['nodes'] if n['data'].get('keyboardType') == 'none']
            
            reply_buttons = sum(len(n['data'].get('buttons', [])) for n in reply_nodes)
            inline_buttons = sum(len(n['data'].get('buttons', [])) for n in inline_nodes)
            
            contact_buttons = sum(1 for n in reply_nodes for b in n['data'].get('buttons', []) if b.get('action') == 'contact')
            location_buttons = sum(1 for n in reply_nodes for b in n['data'].get('buttons', []) if b.get('action') == 'location')
            url_buttons = sum(1 for n in bot_data['nodes'] for b in n['data'].get('buttons', []) if b.get('action') == 'url')
            
            print("\n📊 СТАТИСТИКА КЛАВИАТУР:")
            print(f"  • Reply узлов: {len(reply_nodes)}")
            print(f"  • Inline узлов: {len(inline_nodes)}")
            print(f"  • Без клавиатур: {len(none_nodes)}")
            print(f"  • Reply кнопок: {reply_buttons}")
            print(f"  • Inline кнопок: {inline_buttons}")
            print(f"  • Контактных кнопок: {contact_buttons}")
            print(f"  • Кнопок геолокации: {location_buttons}")
            print(f"  • URL кнопок: {url_buttons}")
            
            return project_id
            
        else:
            print(f"❌ Ошибка создания проекта: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return None

def main():
    """Основная функция создания тестового бота со смешанными клавиатурами"""
    project_id = create_mixed_keyboards_bot()
    
    if project_id:
        print(f"\n🎉 ТЕСТОВЫЙ БОТ СОЗДАН УСПЕШНО!")
        print(f"🔢 ID проекта: {project_id}")
        print(f"🌐 Откройте редактор в браузере для просмотра")
        print(f"🧪 Используйте этот бот для тестирования смешанных клавиатур")
    else:
        print("\n❌ Не удалось создать тестовый бот")

if __name__ == "__main__":
    main()