#!/usr/bin/env python3
"""
Тест исправленных кнопок в политическом шаблоне
"""

import requests
import json

def test_fixed_buttons():
    """Тестируем исправленные кнопки"""
    
    print("🔍 ТЕСТ ИСПРАВЛЕННЫХ КНОПОК")
    print("=" * 40)
    
    # Создаем проект из обновленного шаблона
    response = requests.get('http://localhost:5000/api/templates')
    templates = response.json()
    
    political_template = None
    for template in templates:
        if 'Политико' in template['name']:
            political_template = template
            break
    
    if not political_template:
        print("❌ Шаблон не найден")
        return False
    
    project_data = {
        "name": "Тест исправленных кнопок",
        "description": "Проверка коротких кнопок в политическом шаблоне",
        "data": political_template['data']
    }
    
    create_response = requests.post('http://localhost:5000/api/projects', json=project_data)
    
    if create_response.status_code == 201:
        project_id = create_response.json()['id']
        print(f"✅ Проект создан с ID: {project_id}")
        
        # Анализируем кнопки
        analyze_button_lengths(political_template['data'])
        
        return True
    else:
        print(f"❌ Ошибка создания проекта: {create_response.status_code}")
        return False

def analyze_button_lengths(data):
    """Анализируем длину кнопок"""
    
    print(f"\n📊 АНАЛИЗ ДЛИНЫ КНОПОК:")
    print("-" * 30)
    
    total_buttons = 0
    long_buttons = 0
    max_length = 0
    button_samples = []
    
    for node in data['nodes']:
        if 'buttons' in node['data']:
            for button in node['data']['buttons']:
                total_buttons += 1
                button_length = len(button['text'])
                max_length = max(max_length, button_length)
                
                if button_length > 15:
                    long_buttons += 1
                
                if len(button_samples) < 10:
                    button_samples.append({
                        'text': button['text'],
                        'length': button_length,
                        'node': node['id']
                    })
    
    print(f"📈 Общее количество кнопок: {total_buttons}")
    print(f"📏 Максимальная длина: {max_length} символов")
    print(f"⚠️  Длинных кнопок (>15 символов): {long_buttons}")
    print(f"✅ Коротких кнопок (≤15 символов): {total_buttons - long_buttons}")
    
    print(f"\n🔍 ПРИМЕРЫ КНОПОК:")
    for sample in button_samples:
        status = "✅" if sample['length'] <= 15 else "⚠️"
        print(f"   {status} '{sample['text']}' ({sample['length']} символов)")
    
    if long_buttons == 0:
        print(f"\n🎉 ВСЕ КНОПКИ ОПТИМАЛЬНОЙ ДЛИНЫ!")
        print("   Кнопки будут хорошо отображаться в Telegram")
    else:
        print(f"\n⚠️  НАЙДЕНО {long_buttons} ДЛИННЫХ КНОПОК")
        print("   Рекомендуется дополнительное сокращение")

if __name__ == "__main__":
    success = test_fixed_buttons()
    if success:
        print("\n🎉 ТЕСТ ЗАВЕРШЕН УСПЕШНО!")
    else:
        print("\n❌ ТЕСТ ЗАВЕРШИЛСЯ С ОШИБКОЙ")