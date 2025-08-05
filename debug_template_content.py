#!/usr/bin/env python3
"""
Отладка содержимого шаблона политического опроса
"""

import json
import requests

def debug_template_content():
    """Отладка содержимого политического шаблона"""
    
    print("🔍 ОТЛАДКА СОДЕРЖИМОГО ШАБЛОНА")
    print("=" * 50)
    
    try:
        # Получаем все шаблоны
        response = requests.get('http://localhost:5000/api/templates')
        if response.status_code == 200:
            templates = response.json()
            
            # Ищем политический шаблон
            political_template = None
            for template in templates:
                name = template.get('name', '').lower()
                if "политико-исторический" in name or "политический" in name:
                    political_template = template
                    break
            
            if political_template:
                print(f"✅ Найден шаблон: {political_template.get('name', 'Неизвестный')}")
                
                # Анализируем узлы
                nodes = political_template.get('data', {}).get('nodes', [])
                
                print(f"\n📊 Всего узлов: {len(nodes)}")
                
                for node in nodes:
                    node_data = node.get('data', {})
                    message_text = node_data.get('messageText', '')
                    
                    # Проверяем start-poll узел
                    if node.get('id') == 'start-poll':
                        print(f"\n🎯 УЗЕЛ start-poll:")
                        print(f"  Тип: {node.get('type', 'unknown')}")
                        print(f"  Markdown поле: {node_data.get('markdown', 'не указано')}")
                        print(f"  FormatMode поле: {node_data.get('formatMode', 'не указано')}")
                        
                        # Проверяем наличие HTML тегов
                        has_html = '<b>' in message_text or '<i>' in message_text or '<u>' in message_text
                        has_markdown = '**' in message_text or '*' in message_text
                        
                        print(f"  Есть HTML теги: {has_html}")
                        print(f"  Есть Markdown: {has_markdown}")
                        
                        # Показываем первые 200 символов текста
                        print(f"  Текст (первые 200 символов):")
                        print(f"    {repr(message_text[:200])}")
                        
                        # Показываем полный текст в readable формате
                        print(f"\n  Полный текст:")
                        print(f"    {message_text}")
                        
                        break
                
                # Проверяем, есть ли узлы с HTML тегами
                print(f"\n🔍 ПОИСК HTML ТЕГОВ ВО ВСЕХ УЗЛАХ:")
                html_nodes = []
                for node in nodes:
                    node_data = node.get('data', {})
                    message_text = node_data.get('messageText', '')
                    
                    if '<b>' in message_text or '<i>' in message_text or '<u>' in message_text:
                        html_nodes.append({
                            'id': node.get('id'),
                            'type': node.get('type'),
                            'text': message_text[:100] + '...' if len(message_text) > 100 else message_text
                        })
                
                if html_nodes:
                    print(f"  Найдено {len(html_nodes)} узлов с HTML тегами:")
                    for node in html_nodes:
                        print(f"    - {node['id']} ({node['type']}): {node['text']}")
                else:
                    print(f"  HTML теги не найдены в узлах")
                    
            else:
                print("❌ Политический шаблон не найден")
                
        else:
            print(f"❌ Ошибка получения шаблонов: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    debug_template_content()