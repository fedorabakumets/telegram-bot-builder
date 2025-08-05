#!/usr/bin/env python3
"""
Исправление отображения форматирования в шаблонах
Убирает HTML теги и markdown синтаксис для правильного отображения
"""
import requests
import json
import re

def clean_html_tags(text):
    """Убирает HTML теги из текста"""
    # Заменяем HTML теги на простое форматирование
    text = re.sub(r'<b>(.*?)</b>', r'\1', text)
    text = re.sub(r'<i>(.*?)</i>', r'\1', text)
    text = re.sub(r'<u>(.*?)</u>', r'\1', text)
    text = re.sub(r'<code>(.*?)</code>', r'\1', text)
    text = re.sub(r'<pre>(.*?)</pre>', r'\1', text)
    return text

def clean_markdown_syntax(text):
    """Убирает markdown синтаксис из текста"""
    # Заменяем markdown синтаксис на простое форматирование
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'__(.*?)__', r'\1', text)
    text = re.sub(r'_(.*?)_', r'\1', text)
    text = re.sub(r'`(.*?)`', r'\1', text)
    text = re.sub(r'~~(.*?)~~', r'\1', text)
    text = re.sub(r'> (.*)', r'\1', text)
    text = re.sub(r'# (.*)', r'\1', text)
    text = re.sub(r'## (.*)', r'\1', text)
    return text

def fix_template_formatting():
    """Исправляет форматирование во всех шаблонах"""
    try:
        # Получаем все шаблоны
        response = requests.get('http://localhost:5000/api/templates')
        if response.status_code != 200:
            print(f"❌ Ошибка получения шаблонов: {response.status_code}")
            return
        
        templates = response.json()
        print(f"📋 Найдено {len(templates)} шаблонов")
        
        updated_count = 0
        
        for template in templates:
            # Проверяем, есть ли проблемы с форматированием
            needs_update = False
            template_data = template.get('data', {})
            nodes = template_data.get('nodes', [])
            
            for node in nodes:
                node_data = node.get('data', {})
                message_text = node_data.get('messageText', '')
                
                # Проверяем наличие HTML тегов или markdown синтаксиса
                if ('<b>' in message_text or '<i>' in message_text or 
                    '**' in message_text or '__' in message_text):
                    needs_update = True
                    
                    # Очищаем форматирование
                    cleaned_text = clean_html_tags(message_text)
                    cleaned_text = clean_markdown_syntax(cleaned_text)
                    
                    # Обновляем текст
                    node_data['messageText'] = cleaned_text
                    
                    # Устанавливаем правильный режим форматирования
                    node_data['formatMode'] = 'none'
                    if 'markdown' in node_data:
                        del node_data['markdown']
                    
                    print(f"✅ Исправлен узел {node.get('id')} в шаблоне {template.get('name')}")
            
            # Если шаблон был изменен, обновляем его
            if needs_update:
                update_response = requests.put(
                    f'http://localhost:5000/api/templates/{template["id"]}',
                    json={
                        'name': template['name'],
                        'description': template['description'],
                        'category': template['category'],
                        'data': template_data
                    }
                )
                
                if update_response.status_code == 200:
                    updated_count += 1
                    print(f"✅ Обновлен шаблон: {template['name']}")
                else:
                    print(f"❌ Ошибка обновления шаблона {template['name']}: {update_response.status_code}")
        
        print(f"\n🎉 Обработка завершена! Обновлено {updated_count} шаблонов")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    fix_template_formatting()