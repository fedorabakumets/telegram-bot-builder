#!/usr/bin/env python3
"""
Простой тест для проверки исправления callback_data в шаблоне магазина
"""

import requests
import json

def test_button_generation():
    """Тестируем генерацию кнопок в магазине"""
    print("🧪 Тестируем генерацию callback_data для кнопок...")
    
    # Загружаем шаблон "Interactive Shop with Conditional Messages"
    template_data = {
        "nodes": [
            {
                "id": "start_welcome",
                "type": "start", 
                "data": {
                    "messageText": "Добро пожаловать в наш интернет-магазин! 🛍️",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn_catalog",
                            "text": "📦 Каталог товаров",
                            "action": "goto",
                            "target": "catalog_main"
                        },
                        {
                            "id": "btn_profile", 
                            "text": "👤 Мой профиль",
                            "action": "goto",
                            "target": "profile_menu"
                        }
                    ]
                }
            }
        ],
        "edges": []
    }
    
    # Отправляем POST запрос на /api/export для генерации кода
    try:
        # Создаем простой проект для тестирования
        projects_response = requests.get('http://localhost:5000/api/projects')
        projects = projects_response.json()
        project_id = projects[0]['id'] if projects else 1
        
        response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export', 
                               json=template_data,
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 200:
            generated_code = response.text
            print("✅ Код успешно сгенерирован")
            
            # Проверяем кнопки в коде
            print("\n🔍 Анализируем сгенерированные кнопки:")
            
            if 'InlineKeyboardButton(text="📦 Каталог товаров", callback_data="catalog_main")' in generated_code:
                print("✅ Кнопка каталога использует target как callback_data: catalog_main")
            elif 'InlineKeyboardButton(text="📦 Каталог товаров", callback_data="btn_catalog")' in generated_code:
                print("❌ Кнопка каталога использует button.id как callback_data: btn_catalog")
            else:
                print("⚠️ Не найдена кнопка каталога в коде")
                
            # Проверяем обработчики
            print("\n🔍 Анализируем обработчики callback:")
            
            if '@dp.callback_query(lambda c: c.data == "catalog_main")' in generated_code:
                print("✅ Обработчик использует target: catalog_main")
            elif '@dp.callback_query(lambda c: c.data == "btn_catalog")' in generated_code:
                print("✅ Обработчик использует button.id: btn_catalog")
            else:
                print("⚠️ Не найден обработчик для кнопки каталога")
                
            # Сохраняем результат для анализа
            with open("test_generated_code.py", "w", encoding="utf-8") as f:
                f.write(generated_code)
            print("\n💾 Сгенерированный код сохранен в test_generated_code.py")
            
        else:
            print(f"❌ Ошибка генерации: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Ошибка теста: {e}")

if __name__ == "__main__":
    test_button_generation()