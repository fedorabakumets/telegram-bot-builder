#!/usr/bin/env python3
"""
Обновление политического шаблона с поддержкой HTML форматирования
"""

import requests
import json

def update_political_template():
    """Обновляет политический шаблон с HTML форматированием"""
    
    print("🏛️ ОБНОВЛЕНИЕ ПОЛИТИЧЕСКОГО ШАБЛОНА")
    print("=" * 50)
    
    # Получаем существующий шаблон
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
    print(f"   ID: {political_template['id']}")
    
    # Обновляем все узлы на HTML форматирование
    updated_data = political_template['data'].copy()
    
    # Функция для конвертации markdown в HTML
    def convert_markdown_to_html(text):
        """Конвертирует markdown форматирование в HTML"""
        # Заменяем **текст** на <b>текст</b>
        import re
        text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
        # Заменяем *текст* на <i>текст</i>
        text = re.sub(r'\*([^*]+)\*', r'<i>\1</i>', text)
        # Заменяем __текст__ на <u>текст</u>
        text = re.sub(r'__([^_]+)__', r'<u>\1</u>', text)
        return text
    
    nodes_updated = 0
    
    # Обновляем все узлы
    for node in updated_data['nodes']:
        # Удаляем старое поле markdown
        if 'markdown' in node['data']:
            del node['data']['markdown']
        
        # Устанавливаем formatMode в html
        node['data']['formatMode'] = 'html'
        
        # Конвертируем текст сообщения
        if 'messageText' in node['data']:
            original_text = node['data']['messageText']
            converted_text = convert_markdown_to_html(original_text)
            node['data']['messageText'] = converted_text
            
            if original_text != converted_text:
                print(f"🔄 Обновлен узел {node['id']}: {node['type']}")
                nodes_updated += 1
        
        # Конвертируем подписи к медиа
        if 'mediaCaption' in node['data']:
            original_caption = node['data']['mediaCaption']
            converted_caption = convert_markdown_to_html(original_caption)
            node['data']['mediaCaption'] = converted_caption
        
        # Конвертируем описания
        if 'description' in node['data']:
            original_desc = node['data']['description']
            converted_desc = convert_markdown_to_html(original_desc)
            node['data']['description'] = converted_desc
    
    print(f"✅ Обновлено узлов: {nodes_updated}")
    
    # Обновляем шаблон в базе данных
    update_data = {
        'name': political_template['name'],
        'description': political_template['description'],
        'category': political_template['category'],
        'tags': political_template['tags'],
        'difficulty': political_template['difficulty'],
        'data': updated_data,
        'formatMode': 'html'  # Добавляем formatMode на уровне шаблона
    }
    
    # Отправляем обновление
    update_response = requests.put(
        f'http://localhost:5000/api/templates/{political_template["id"]}',
        json=update_data
    )
    
    if update_response.status_code == 200:
        print("✅ Шаблон успешно обновлен!")
        
        # Проверяем обновление
        test_response = requests.get(f'http://localhost:5000/api/templates/{political_template["id"]}')
        if test_response.status_code == 200:
            updated_template = test_response.json()
            first_node = updated_template['data']['nodes'][0]
            
            print(f"\n📊 ПРОВЕРКА ОБНОВЛЕНИЯ:")
            print(f"   FormatMode: {first_node['data'].get('formatMode', 'не указан')}")
            print(f"   Markdown поле: {'удалено' if 'markdown' not in first_node['data'] else 'присутствует'}")
            print(f"   Первые 100 символов: {first_node['data']['messageText'][:100]}...")
            
            # Проверяем наличие HTML тегов
            if '<b>' in first_node['data']['messageText']:
                print("✅ HTML теги обнаружены в тексте")
            else:
                print("❌ HTML теги не найдены")
            
            return True
        else:
            print(f"❌ Ошибка проверки обновления: {test_response.status_code}")
            return False
    else:
        print(f"❌ Ошибка обновления шаблона: {update_response.status_code}")
        print(f"   Ответ: {update_response.text}")
        return False

if __name__ == "__main__":
    success = update_political_template()
    if success:
        print("\n🎉 ПОЛИТИЧЕСКИЙ ШАБЛОН УСПЕШНО ОБНОВЛЕН!")
        print("   Теперь используется HTML форматирование")
        print("   Жирный текст будет отображаться правильно")
    else:
        print("\n❌ ОБНОВЛЕНИЕ ЗАВЕРШИЛОСЬ С ОШИБКОЙ")