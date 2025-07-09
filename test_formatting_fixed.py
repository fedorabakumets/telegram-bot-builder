"""
Тест форматирования текста ПОСЛЕ исправления генератора
"""

import requests

def create_formatting_test_bot():
    """Создает тестовый бот с markdown форматированием"""
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "data": {
                    "command": "/start",
                    "messageText": "🤖 **Добро пожаловать!**\n\nЭто **жирный текст**\nЭто *курсивный текст*\nЭто `моноширинный код`\n\n__Подчеркнутый текст__\n~~Зачеркнутый текст~~\n\n> Цитата текста\n\n# Заголовок\n## Подзаголовок\n\nВыберите тест:",
                    "formatMode": "markdown",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-html",
                            "text": "🔄 HTML форматирование",
                            "action": "goto",
                            "target": "html-node"
                        },
                        {
                            "id": "btn-plain",
                            "text": "📝 Обычный текст", 
                            "action": "goto",
                            "target": "plain-node"
                        }
                    ]
                }
            },
            {
                "id": "html-node",
                "type": "message",
                "data": {
                    "messageText": "🌟 <b>HTML Форматирование</b>\n\n<b>Жирный текст</b> в HTML\n<i>Курсивный текст</i> в HTML\n<code>Код</code> в HTML\n<u>Подчеркнутый</u> в HTML\n<s>Зачеркнутый</s> в HTML\n\n<pre>Блок кода\n  с отступами</pre>\n\n<a href=\"https://telegram.org\">Ссылка в HTML</a>",
                    "formatMode": "html",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back",
                            "text": "🔙 Назад к Markdown",
                            "action": "goto", 
                            "target": "start-1"
                        }
                    ]
                }
            },
            {
                "id": "plain-node", 
                "type": "message",
                "data": {
                    "messageText": "Обычный текст без форматирования\n\n**Это должно отображаться как есть**\n*Это тоже*\n<b>И это</b>\n\nНикакого форматирования не применяется.",
                    "formatMode": "none",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back-start",
                            "text": "🔙 Вернуться к тестам",
                            "action": "goto",
                            "target": "start-1" 
                        }
                    ]
                }
            }
        ],
        "connections": [
            {
                "id": "conn1",
                "from": "start-1",
                "to": "html-node"
            },
            {
                "id": "conn2", 
                "from": "start-1",
                "to": "plain-node"
            },
            {
                "id": "conn3",
                "from": "html-node",
                "to": "start-1"
            },
            {
                "id": "conn4",
                "from": "plain-node", 
                "to": "start-1"
            }
        ]
    }
    
    return bot_data

def test_formatting_generation():
    """Тестирует генерацию кода после исправления форматирования"""
    print("🧪 ТЕСТ: Форматирование текста после исправления")
    print("=" * 60)
    
    # Создаем тестовые данные
    bot_data = create_formatting_test_bot()
    
    # Отправляем через API для генерации кода
    try:
        # Создаем временный проект
        project_data = {
            "name": "Тест форматирования ИСПРАВЛЕН",
            "description": "Тестовый проект для проверки исправленного форматирования",
            "data": bot_data
        }
        
        create_response = requests.post('http://localhost:5000/api/projects', 
                                      json=project_data)
        if create_response.status_code != 201:
            print(f"❌ Ошибка создания проекта: {create_response.status_code}")
            return
            
        project_id = create_response.json()['id']
        print(f"✅ Проект создан с ID: {project_id}")
        
        # Генерируем код через API экспорта
        export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
        if export_response.status_code == 200:
            generated_code = export_response.json()['code']
            
            # Сохраняем в файл для проверки
            with open('formatting_test_FIXED.py', 'w', encoding='utf-8') as f:
                f.write(generated_code)
            
            print("✅ Код сгенерирован и сохранен в 'formatting_test_FIXED.py'")
            
            # Анализируем результат
            print("\n📊 АНАЛИЗ СГЕНЕРИРОВАННОГО КОДА:")
            
            # Проверяем parse_mode в коде
            markdown_count = generated_code.count('parse_mode=ParseMode.MARKDOWN')
            html_count = generated_code.count('parse_mode=ParseMode.HTML')
            no_parse_count = generated_code.count('await message.answer(text,') - markdown_count - html_count
            
            print(f"📝 Markdown форматирование: {markdown_count} раз")
            print(f"🌐 HTML форматирование: {html_count} раз")
            print(f"📄 Без форматирования: {no_parse_count} раз")
            
            if markdown_count > 0:
                print("✅ Markdown форматирование найдено в коде")
            else:
                print("❌ Markdown форматирование НЕ найдено в коде")
                
            if html_count > 0:
                print("✅ HTML форматирование найдено в коде")
            else:
                print("❌ HTML форматирование НЕ найдено в коде")
                
            # Проверяем есть ли старые проблемы
            if 'node.data.markdown === true' in generated_code:
                print("❌ НАЙДЕНА СТАРАЯ ЛОГИКА: node.data.markdown === true")
            else:
                print("✅ Старая логика успешно удалена")
                
            # Проверяем новую логика
            if 'formatMode' in generated_code:
                print("✅ Новая логика formatMode найдена")
            else:
                print("❌ Новая логика formatMode НЕ найдена")
            
            print("\n🎯 РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ:")
            if markdown_count > 0 and html_count > 0:
                print("✅ ФОРМАТИРОВАНИЕ ИСПРАВЛЕНО УСПЕШНО!")
                print("   Код корректно генерирует разные режимы форматирования")
            else:
                print("❌ ПРОБЛЕМЫ С ФОРМАТИРОВАНИЕМ ОСТАЛИСЬ")
                print("   Требуется дополнительная отладка")
                
        else:
            print(f"❌ Ошибка экспорта: {export_response.status_code}")
            
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")

if __name__ == "__main__":
    test_formatting_generation()