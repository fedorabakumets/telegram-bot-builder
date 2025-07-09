"""
Комплексный тест всех видов форматирования
"""

import requests

def create_comprehensive_formatting_test():
    """Создает комплексный тест форматирования с разными сценариями"""
    bot_data = {
        "nodes": [
            # Стартовый узел с markdown
            {
                "id": "start-1",
                "type": "start", 
                "data": {
                    "command": "/start",
                    "messageText": "🤖 **Комплексный тест форматирования**\n\nЭтот бот тестирует:\n• **Markdown** форматирование\n• *HTML* форматирование  \n• `Обычный` текст\n\nВыберите тест:",
                    "formatMode": "markdown",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn1", "text": "📝 Markdown тест", "action": "goto", "target": "markdown-node"},
                        {"id": "btn2", "text": "🌐 HTML тест", "action": "goto", "target": "html-node"},
                        {"id": "btn3", "text": "📄 Обычный текст", "action": "goto", "target": "plain-node"}
                    ]
                }
            },
            # Команда помощи с HTML
            {
                "id": "help-1",
                "type": "command",
                "data": {
                    "command": "/help",
                    "messageText": "<b>🆘 Справка по боту</b>\n\n<i>HTML форматирование работает!</i>\n\n<code>Доступные команды:</code>\n• <b>/start</b> - запуск бота\n• <b>/help</b> - эта справка\n\n<u>Поддерживаемые форматы:</u>\n• <s>Зачеркнутый</s> текст\n• <pre>Блок кода</pre>\n\n<a href=\"https://telegram.org\">Ссылка на Telegram</a>",
                    "formatMode": "html", 
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn4", "text": "🔙 Назад к началу", "action": "goto", "target": "start-1"}
                    ]
                }
            },
            # Узел с markdown форматированием
            {
                "id": "markdown-node",
                "type": "message",
                "data": {
                    "messageText": "📝 **Тест Markdown форматирования**\n\n**Жирный текст** работает\n*Курсивный текст* тоже работает\n`Встроенный код` отображается правильно\n__Подчеркнутый текст__ виден\n~~Зачеркнутый текст~~ тоже\n\n```python\n# Блок кода\ndef hello():\n    print(\"Hello World!\")\n```\n\n> Цитата выглядит красиво\n\n# Заголовок\n## Подзаголовок\n\n[Ссылка на сайт](https://example.com)",
                    "formatMode": "markdown",
                    "keyboardType": "inline", 
                    "buttons": [
                        {"id": "btn5", "text": "🌐 Переключить на HTML", "action": "goto", "target": "html-node"},
                        {"id": "btn6", "text": "🏠 Главное меню", "action": "goto", "target": "start-1"}
                    ]
                }
            },
            # Узел с HTML форматированием
            {
                "id": "html-node",
                "type": "message",
                "data": {
                    "messageText": "🌐 <b>Тест HTML форматирования</b>\n\n<b>Жирный текст</b> в HTML\n<i>Курсивный текст</i> в HTML\n<code>Встроенный код</code> в HTML\n<u>Подчеркнутый текст</u> в HTML\n<s>Зачеркнутый текст</s> в HTML\n\n<pre>Блок кода в HTML\nс несколькими строками</pre>\n\n<a href=\"https://telegram.org\">Ссылка в HTML формате</a>\n\nВсе работает отлично!",
                    "formatMode": "html",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn7", "text": "📝 Переключить на Markdown", "action": "goto", "target": "markdown-node"},
                        {"id": "btn8", "text": "📄 Обычный текст", "action": "goto", "target": "plain-node"},
                        {"id": "btn9", "text": "🏠 Главное меню", "action": "goto", "target": "start-1"}
                    ]
                }
            },
            # Узел без форматирования
            {
                "id": "plain-node",
                "type": "message", 
                "data": {
                    "messageText": "📄 Обычный текст без форматирования\n\n**Это НЕ будет жирным**\n*Это НЕ будет курсивом*\n<b>Это НЕ будет жирным в HTML</b>\n<i>Это НЕ будет курсивом в HTML</i>\n\nВесь текст отображается как есть, без обработки markdown или HTML тегов.\n\nИспользуется когда нужен чистый текст без форматирования.",
                    "formatMode": "none",
                    "keyboardType": "inline",
                    "buttons": [
                        {"id": "btn10", "text": "📝 Markdown", "action": "goto", "target": "markdown-node"},
                        {"id": "btn11", "text": "🌐 HTML", "action": "goto", "target": "html-node"},
                        {"id": "btn12", "text": "🏠 Главное меню", "action": "goto", "target": "start-1"}
                    ]
                }
            },
            # Узел с reply клавиатурой и markdown
            {
                "id": "reply-markdown-node",
                "type": "message",
                "data": {
                    "messageText": "🎹 **Reply клавиатура с Markdown**\n\nЭтот узел использует:\n• **Reply** клавиатуру\n• *Markdown* форматирование\n\nТекст форматируется, а кнопки отображаются внизу экрана.",
                    "formatMode": "markdown",
                    "keyboardType": "reply",
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False,
                    "buttons": [
                        {"id": "btn13", "text": "📝 Тест Markdown", "action": "goto", "target": "markdown-node"},
                        {"id": "btn14", "text": "🌐 Тест HTML", "action": "goto", "target": "html-node"},
                        {"id": "btn15", "text": "🏠 Главное меню", "action": "goto", "target": "start-1"}
                    ]
                }
            }
        ],
        "connections": [
            {"id": "conn1", "from": "start-1", "to": "markdown-node"},
            {"id": "conn2", "from": "start-1", "to": "html-node"},
            {"id": "conn3", "from": "start-1", "to": "plain-node"},
            {"id": "conn4", "from": "help-1", "to": "start-1"},
            {"id": "conn5", "from": "markdown-node", "to": "html-node"},
            {"id": "conn6", "from": "markdown-node", "to": "start-1"},
            {"id": "conn7", "from": "html-node", "to": "markdown-node"},
            {"id": "conn8", "from": "html-node", "to": "plain-node"}, 
            {"id": "conn9", "from": "html-node", "to": "start-1"},
            {"id": "conn10", "from": "plain-node", "to": "markdown-node"},
            {"id": "conn11", "from": "plain-node", "to": "html-node"},
            {"id": "conn12", "from": "plain-node", "to": "start-1"}
        ]
    }
    
    return bot_data

def test_comprehensive_formatting():
    """Комплексный тест форматирования"""
    print("🧪 КОМПЛЕКСНЫЙ ТЕСТ: Все виды форматирования")
    print("=" * 70)
    
    bot_data = create_comprehensive_formatting_test()
    
    try:
        # Создаем проект
        project_data = {
            "name": "Комплексный тест форматирования",
            "description": "Тест всех видов форматирования: Markdown, HTML, без форматирования",
            "data": bot_data
        }
        
        create_response = requests.post('http://localhost:5000/api/projects', json=project_data)
        if create_response.status_code != 201:
            print(f"❌ Ошибка создания проекта: {create_response.status_code}")
            return
            
        project_id = create_response.json()['id']
        print(f"✅ Проект создан с ID: {project_id}")
        
        # Генерируем код
        export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
        if export_response.status_code == 200:
            generated_code = export_response.json()['code']
            
            # Сохраняем файл
            with open('comprehensive_formatting_test_RESULT.py', 'w', encoding='utf-8') as f:
                f.write(generated_code)
            
            print("✅ Код сгенерирован и сохранен в 'comprehensive_formatting_test_RESULT.py'")
            
            # Детальный анализ
            print("\n📊 ДЕТАЛЬНЫЙ АНАЛИЗ:")
            
            # Подсчитываем разные типы форматирования
            markdown_count = generated_code.count('parse_mode=ParseMode.MARKDOWN')
            html_count = generated_code.count('parse_mode=ParseMode.HTML')
            total_message_count = generated_code.count('await message.answer(')
            total_edit_count = generated_code.count('await callback_query.message.edit_text(')
            total_send_count = generated_code.count('await bot.send_message(')
            
            print(f"📝 Markdown parse_mode: {markdown_count} раз")
            print(f"🌐 HTML parse_mode: {html_count} раз")
            print(f"📨 Всего message.answer: {total_message_count} раз")
            print(f"✏️ Всего edit_text: {total_edit_count} раз")
            print(f"📤 Всего send_message: {total_send_count} раз")
            
            # Проверяем покрытие
            nodes_with_formatting = 6  # У нас 6 узлов с разным форматированием
            total_formatting_found = markdown_count + html_count
            
            print(f"\n📈 ПОКРЫТИЕ ТЕСТИРОВАНИЯ:")
            print(f"Узлов с форматированием: {nodes_with_formatting}")
            print(f"Форматирований найдено: {total_formatting_found}")
            
            # Проверяем конкретные узлы
            checks = {
                "START команда с Markdown": 'parse_mode=ParseMode.MARKDOWN' in generated_code and '@dp.message(CommandStart())' in generated_code,
                "HELP команда с HTML": 'parse_mode=ParseMode.HTML' in generated_code and '@dp.message(Command("help"))' in generated_code,
                "Callback обработчики": '@dp.callback_query(' in generated_code,
                "Reply клавиатуры": 'ReplyKeyboardBuilder()' in generated_code,
                "Inline клавиатуры": 'InlineKeyboardBuilder()' in generated_code,
                "Без форматирования": total_message_count > (markdown_count + html_count)
            }
            
            print(f"\n✅ ПРОВЕРКА КОМПОНЕНТОВ:")
            for check_name, result in checks.items():
                status = "✅" if result else "❌"
                print(f"{status} {check_name}: {'Работает' if result else 'НЕ работает'}")
            
            # Итоговый результат
            all_checks_passed = all(checks.values())
            formatting_ok = markdown_count >= 2 and html_count >= 1
            
            print(f"\n🎯 ИТОГОВЫЙ РЕЗУЛЬТАТ:")
            if all_checks_passed and formatting_ok:
                print("🟢 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!")
                print("   Форматирование работает стабильно во всех сценариях")
                return True
            else:
                print("🔴 ЕСТЬ ПРОБЛЕМЫ!")
                if not formatting_ok:
                    print(f"   Недостаточно форматирования: Markdown={markdown_count}, HTML={html_count}")
                if not all_checks_passed:
                    print("   Не все компоненты работают правильно")
                return False
                
        else:
            print(f"❌ Ошибка экспорта: {export_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    test_comprehensive_formatting()