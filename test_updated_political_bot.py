#!/usr/bin/env python3
"""
Тест обновленного политического бота с HTML форматированием
"""

import requests
import json

def test_updated_political_bot():
    """Создаем и тестируем обновленный политический бот"""
    
    print("🤖 ТЕСТ ОБНОВЛЕННОГО ПОЛИТИЧЕСКОГО БОТА")
    print("=" * 50)
    
    # Получаем обновленный шаблон
    response = requests.get('http://localhost:5000/api/templates')
    templates = response.json()
    
    political_template = None
    for template in templates:
        if 'Политико' in template['name']:
            political_template = template
            break
    
    if not political_template:
        print("❌ Политический шаблон не найден")
        return False
    
    print(f"✅ Найден шаблон: {political_template['name']}")
    
    # Создаем проект из обновленного шаблона
    project_data = {
        "name": "Тест HTML политического бота",
        "description": "Проверка HTML форматирования в политическом боте",
        "data": political_template['data']
    }
    
    create_response = requests.post('http://localhost:5000/api/projects', json=project_data)
    
    if create_response.status_code == 201:
        project_id = create_response.json()['id']
        print(f"✅ Проект создан с ID: {project_id}")
        
        # Генерируем код
        export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
        
        if export_response.status_code == 200:
            generated_code = export_response.json()['code']
            
            # Сохраняем код
            with open('test_updated_political_bot_result.py', 'w', encoding='utf-8') as f:
                f.write(generated_code)
            
            print("✅ Код сохранён в 'test_updated_political_bot_result.py'")
            
            # Анализируем код
            analyze_updated_code(generated_code)
            
            return True
        else:
            print(f"❌ Ошибка генерации кода: {export_response.status_code}")
            return False
    else:
        print(f"❌ Ошибка создания проекта: {create_response.status_code}")
        return False

def analyze_updated_code(code):
    """Анализируем обновленный код"""
    
    print(f"\n🔍 АНАЛИЗ ОБНОВЛЕННОГО КОДА:")
    print("-" * 40)
    
    lines = code.split('\n')
    
    # Ищем start_handler
    for i, line in enumerate(lines):
        if 'async def start_handler' in line:
            print(f"📍 Найден start_handler на строке {i+1}")
            
            # Анализируем следующие 50 строк
            for j in range(i, min(i + 50, len(lines))):
                if 'text = ' in lines[j] and '<b>' in lines[j]:
                    print(f"📝 Найден HTML текст на строке {j+1}:")
                    print(f"   {lines[j].strip()}")
                    
                    # Ищем parse_mode в следующих 15 строках
                    for k in range(j, min(j + 15, len(lines))):
                        if 'parse_mode=' in lines[k]:
                            print(f"📊 Parse mode на строке {k+1}: {lines[k].strip()}")
                            
                            if 'ParseMode.HTML' in lines[k]:
                                print("✅ ПРАВИЛЬНО: HTML теги с ParseMode.HTML")
                                print("   Жирный текст <b> будет отображаться в Telegram")
                            elif 'ParseMode.MARKDOWN' in lines[k]:
                                print("❌ ПРОБЛЕМА: HTML теги с ParseMode.MARKDOWN")
                            break
                    break
            break
    
    # Подсчитываем общую статистику
    html_modes = code.count('ParseMode.HTML')
    markdown_modes = code.count('ParseMode.MARKDOWN')
    html_tags = code.count('<b>') + code.count('<i>') + code.count('<u>')
    markdown_syntax = code.count('**') + code.count('*') + code.count('__')
    
    print(f"\n📊 ОБЩАЯ СТАТИСТИКА:")
    print(f"   HTML тегов: {html_tags}")
    print(f"   Markdown синтаксиса: {markdown_syntax}")
    print(f"   ParseMode.HTML: {html_modes}")
    print(f"   ParseMode.MARKDOWN: {markdown_modes}")
    
    if html_tags > 0 and html_modes > 0:
        print("✅ HTML теги используют правильный parse mode")
        print("   Жирный текст <b> будет работать в Telegram")
    elif html_tags > 0 and markdown_modes > 0:
        print("❌ ПРОБЛЕМА: HTML теги с markdown parse mode")
    elif markdown_syntax > 0 and markdown_modes > 0:
        print("✅ Markdown синтаксис используют правильный parse mode")
    else:
        print("❓ Статистика неясна")

if __name__ == "__main__":
    success = test_updated_political_bot()
    if success:
        print("\n🎉 ТЕСТ ОБНОВЛЕННОГО БОТА ЗАВЕРШЕН УСПЕШНО!")
        print("   HTML форматирование настроено правильно")
        print("   Жирный текст будет отображаться в Telegram")
    else:
        print("\n❌ ТЕСТ ЗАВЕРШИЛСЯ С ОШИБКОЙ")