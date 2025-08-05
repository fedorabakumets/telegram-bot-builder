#!/usr/bin/env python3
"""
Исправление длинного текста в кнопках политического шаблона
"""

import requests
import json

def fix_button_text_length():
    """Исправляет длинный текст в кнопках"""
    
    print("🔧 ИСПРАВЛЕНИЕ ДЛИННОГО ТЕКСТА В КНОПКАХ")
    print("=" * 50)
    
    # Получаем политический шаблон
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
    
    # Обновляем данные шаблона
    updated_data = political_template['data'].copy()
    
    # Словарь для сокращения текста кнопок
    button_text_fixes = {
        # Экономические вопросы
        "A) Минимальная роль": "A) Минимальная",
        "B) Умеренное регулирование": "B) Умеренная",
        "C) Активное вмешательство": "C) Активная",
        "D) Полный контроль": "D) Полный контроль",
        
        # Политические системы
        "A) Прямая демократия": "A) Прямая",
        "B) Представительная демократия": "B) Представительная",
        "C) Смешанная система": "C) Смешанная",
        "D) Авторитарная система": "D) Авторитарная",
        
        # Социальные вопросы
        "A) Традиционные ценности": "A) Традиционные",
        "B) Умеренный прогрессизм": "B) Умеренный",
        "C) Либеральные реформы": "C) Либеральные",
        "D) Радикальные изменения": "D) Радикальные",
        
        # Исторические периоды
        "A) Древний мир": "A) Древность",
        "B) Средневековье": "B) Средние века",
        "C) Новое время": "C) Новое время",
        "D) Современность": "D) Современность",
        
        # Философские направления
        "A) Материализм": "A) Материализм",
        "B) Идеализм": "B) Идеализм",
        "C) Экзистенциализм": "C) Экзистенциализм",
        "D) Постмодернизм": "D) Постмодернизм",
        
        # Социологические теории
        "A) Функционализм": "A) Функционализм",
        "B) Конфликтология": "B) Конфликтология",
        "C) Интеракционизм": "C) Интеракционизм",
        "D) Постструктурализм": "D) Постструктурализм",
        
        # Общие сокращения
        "📋 Обзор разделов": "📋 Разделы",
        "📖 Инструкции": "📖 Помощь",
        "🔄 Следующий вопрос": "🔄 Далее",
        "📊 Посмотреть результаты": "📊 Результаты",
        "🎯 Детальный анализ": "🎯 Анализ",
        "👥 Сравнение профилей": "👥 Сравнение",
        "📚 Рекомендации": "📚 Советы",
        "🏛️ Политология": "🏛️ Политика",
        "📜 История": "📜 История",
        "🤔 Философия": "🤔 Философия",
        "🌍 Социология": "🌍 Социология"
    }
    
    nodes_updated = 0
    buttons_updated = 0
    
    # Обновляем кнопки во всех узлах
    for node in updated_data['nodes']:
        if 'buttons' in node['data']:
            for button in node['data']['buttons']:
                original_text = button['text']
                
                # Проверяем точные совпадения
                if original_text in button_text_fixes:
                    button['text'] = button_text_fixes[original_text]
                    buttons_updated += 1
                    print(f"🔄 Кнопка обновлена: '{original_text}' → '{button['text']}'")
                
                # Если текст всё ещё слишком длинный, сокращаем принудительно
                elif len(original_text) > 15:
                    # Сокращаем до 15 символов с многоточием
                    if original_text.startswith('A) ') or original_text.startswith('B) ') or original_text.startswith('C) ') or original_text.startswith('D) '):
                        prefix = original_text[:3]  # A), B), C), D)
                        remaining = original_text[3:]
                        if len(remaining) > 10:
                            button['text'] = prefix + remaining[:10] + '...'
                            buttons_updated += 1
                            print(f"🔄 Кнопка сокращена: '{original_text}' → '{button['text']}'")
                    elif len(original_text) > 15:
                        button['text'] = original_text[:12] + '...'
                        buttons_updated += 1
                        print(f"🔄 Кнопка сокращена: '{original_text}' → '{button['text']}'")
            
            if buttons_updated > 0:
                nodes_updated += 1
    
    print(f"\n✅ Обновлено узлов: {nodes_updated}")
    print(f"✅ Обновлено кнопок: {buttons_updated}")
    
    # Обновляем шаблон в базе данных
    update_data = {
        'name': political_template['name'],
        'description': political_template['description'],
        'category': political_template['category'],
        'tags': political_template['tags'],
        'difficulty': political_template['difficulty'],
        'data': updated_data
    }
    
    update_response = requests.put(
        f'http://localhost:5000/api/templates/{political_template["id"]}',
        json=update_data
    )
    
    if update_response.status_code == 200:
        print("✅ Шаблон успешно обновлен!")
        
        # Проверяем результат
        test_response = requests.get(f'http://localhost:5000/api/templates/{political_template["id"]}')
        if test_response.status_code == 200:
            updated_template = test_response.json()
            
            # Показываем примеры обновленных кнопок
            print(f"\n📊 ПРИМЕРЫ ОБНОВЛЕННЫХ КНОПОК:")
            sample_count = 0
            for node in updated_template['data']['nodes']:
                if 'buttons' in node['data'] and len(node['data']['buttons']) > 0:
                    for button in node['data']['buttons']:
                        if sample_count < 5:
                            print(f"   • {button['text']} ({len(button['text'])} символов)")
                            sample_count += 1
                        else:
                            break
                    if sample_count >= 5:
                        break
            
            return True
        else:
            print(f"❌ Ошибка проверки обновления: {test_response.status_code}")
            return False
    else:
        print(f"❌ Ошибка обновления шаблона: {update_response.status_code}")
        return False

if __name__ == "__main__":
    success = fix_button_text_length()
    if success:
        print("\n🎉 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО УСПЕШНО!")
        print("   Текст кнопок сокращен для лучшего отображения")
        print("   Кнопки теперь помещаются в интерфейсе Telegram")
    else:
        print("\n❌ ИСПРАВЛЕНИЕ ЗАВЕРШИЛОСЬ С ОШИБКОЙ")