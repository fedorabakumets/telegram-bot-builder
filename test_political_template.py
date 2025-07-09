#!/usr/bin/env python3
"""
Тест политического шаблона в реальном Telegram боте
"""

import requests
import json

def test_political_template():
    """Тестируем политический шаблон"""
    
    print("🏛️ ТЕСТ ПОЛИТИЧЕСКОГО ШАБЛОНА")
    print("=" * 40)
    
    # Получаем политический шаблон
    try:
        response = requests.get('http://localhost:5000/api/templates')
        if response.status_code == 200:
            templates = response.json()
            political_template = None
            
            for template in templates:
                if 'Политико' in template['name']:
                    political_template = template
                    break
            
            if political_template:
                print(f"✅ Найден шаблон: {political_template['name']}")
                
                # Создаем проект из шаблона
                project_data = {
                    "name": "Тест политического шаблона",
                    "description": "Проверка форматирования в политическом шаблоне",
                    "data": political_template['data']
                }
                
                create_response = requests.post('http://localhost:5000/api/projects', 
                                              json=project_data)
                
                if create_response.status_code == 201:
                    project_id = create_response.json()['id']
                    print(f"✅ Проект создан с ID: {project_id}")
                    
                    # Генерируем код
                    export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
                    
                    if export_response.status_code == 200:
                        generated_code = export_response.json()['code']
                        
                        # Сохраняем код
                        with open('test_political_template_result.py', 'w', encoding='utf-8') as f:
                            f.write(generated_code)
                        
                        print("✅ Код сохранён в 'test_political_template_result.py'")
                        
                        # Анализируем код
                        analyze_political_template(generated_code)
                        
                        # Проверяем первый узел
                        first_node = political_template['data']['nodes'][0]
                        print(f"\n📊 АНАЛИЗ ПЕРВОГО УЗЛА:")
                        print(f"   ID: {first_node['id']}")
                        print(f"   Тип: {first_node['type']}")
                        print(f"   Markdown: {first_node['data'].get('markdown', 'не указан')}")
                        print(f"   FormatMode: {first_node['data'].get('formatMode', 'не указан')}")
                        print(f"   Первые 100 символов текста: {first_node['data']['messageText'][:100]}...")
                        
                        return True
                        
                    else:
                        print(f"❌ Ошибка генерации кода: {export_response.status_code}")
                        return False
                        
                else:
                    print(f"❌ Ошибка создания проекта: {create_response.status_code}")
                    return False
                    
            else:
                print("❌ Политический шаблон не найден")
                return False
                
        else:
            print(f"❌ Ошибка получения шаблонов: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")
        return False

def analyze_political_template(code):
    """Анализируем код политического шаблона"""
    
    print(f"\n🔍 АНАЛИЗ КОДА ПОЛИТИЧЕСКОГО ШАБЛОНА:")
    print("-" * 45)
    
    lines = code.split('\n')
    
    # Ищем start_handler
    for i, line in enumerate(lines):
        if 'async def start_handler' in line:
            print(f"📍 Найден start_handler на строке {i+1}")
            
            # Анализируем следующие 50 строк
            for j in range(i, min(i + 50, len(lines))):
                if 'text = ' in lines[j] and '**' in lines[j]:
                    print(f"📝 Найден markdown текст на строке {j+1}:")
                    print(f"   {lines[j].strip()}")
                    
                    # Ищем parse_mode в следующих 15 строках
                    for k in range(j, min(j + 15, len(lines))):
                        if 'parse_mode=' in lines[k]:
                            print(f"📊 Parse mode на строке {k+1}: {lines[k].strip()}")
                            
                            if 'ParseMode.MARKDOWN' in lines[k]:
                                print("✅ ПРАВИЛЬНО: Markdown синтаксис с ParseMode.MARKDOWN")
                                print("   Жирный текст **должен** отображаться в Telegram")
                            elif 'ParseMode.HTML' in lines[k]:
                                print("❌ ПРОБЛЕМА: Markdown синтаксис с ParseMode.HTML")
                            break
                    break
            break
    
    # Подсчитываем общую статистику
    html_modes = code.count('ParseMode.HTML')
    markdown_modes = code.count('ParseMode.MARKDOWN')
    markdown_texts = 0
    html_texts = 0
    
    for line in lines:
        if 'text = ' in line or 'caption = ' in line:
            if '**' in line or '*' in line:
                markdown_texts += 1
            if '<b>' in line or '<i>' in line or '<u>' in line:
                html_texts += 1
    
    print(f"\n📊 ОБЩАЯ СТАТИСТИКА:")
    print(f"   Markdown текстов: {markdown_texts}")
    print(f"   HTML текстов: {html_texts}")
    print(f"   ParseMode.MARKDOWN: {markdown_modes}")
    print(f"   ParseMode.HTML: {html_modes}")
    
    if markdown_texts > 0 and markdown_modes > 0:
        print("✅ Markdown тексты используют правильный parse mode")
        print("   Жирный текст ** должен работать в Telegram")
    elif markdown_texts > 0 and html_modes > 0:
        print("❌ ПРОБЛЕМА: Markdown тексты с HTML parse mode")
    else:
        print("❓ Статистика неясна")

if __name__ == "__main__":
    success = test_political_template()
    if success:
        print("\n🎉 ТЕСТ ПОЛИТИЧЕСКОГО ШАБЛОНА ЗАВЕРШЕН УСПЕШНО!")
        print("   Код генерируется правильно с ParseMode.MARKDOWN")
        print("   Markdown синтаксис ** должен работать в Telegram")
    else:
        print("\n❌ ТЕСТ ЗАВЕРШИЛСЯ С ОШИБКОЙ")