#!/usr/bin/env python3
"""
Агрессивное сокращение кнопок для оптимального отображения в Telegram
"""

import requests
import json

def fix_buttons_aggressive():
    """Агрессивно сокращает кнопки до 12 символов максимум"""
    
    print("✂️ АГРЕССИВНОЕ СОКРАЩЕНИЕ КНОПОК")
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
    
    # Словарь для максимального сокращения
    button_text_fixes = {
        # Основные кнопки
        "🚀 Начать опрос": "🚀 Начать",
        "📋 Разделы": "📋 Разделы",
        "📖 Помощь": "📖 Помощь",
        "⬅️ Назад к н...": "⬅️ Назад",
        "🗳️ Начать по...": "🗳️ Старт",
        "📜 Перейти к ...": "📜 Далее",
        "🤔 Перейти к ...": "🤔 Далее",
        "🌍 Перейти к ...": "🌍 Далее",
        "📊 Перейти к ...": "📊 Далее",
        "➡️ Следующий...": "➡️ Далее",
        "🎉 К результа...": "🎉 Итоги",
        "⬅️ К результ...": "⬅️ Назад",
        "📚 Советы": "📚 Советы",
        
        # Варианты ответов - экономика
        "A) Минимальна...": "A) Минимум",
        "B) Умеренное ...": "B) Умеренно",
        "C) Активное в...": "C) Активно",
        "D) Полный гос...": "D) Полный",
        
        # Варианты ответов - общие
        "A) Убийство э...": "A) Убийство",
        "B) Империалис...": "B) Империи",
        "C) Национальн...": "C) Нации",
        "D) Гонка воор...": "D) Гонка",
        
        "A) Врожденные...": "A) Врожденно",
        "B) Последстви...": "B) Результат",
        "C) Долг и уни...": "C) Долг",
        "D) Социальные...": "D) Социум",
        
        "A) Различия в...": "A) Различия",
        "B) Структурны...": "B) Структура",
        "C) Культурные...": "C) Культура",
        "D) Историческ...": "D) История",
        
        # Блоки
        "📜 Начать ист...": "📜 История",
        "🤔 Начать фил...": "🤔 Философия",
        "🌍 Начать соц...": "🌍 Социология",
        "📊 Детальный ...": "📊 Анализ",
        "👥 Сравнение ...": "👥 Сравнить",
        "🤔 К блоку Фи...": "🤔 Философия",
        "🌍 К блоку Со...": "🌍 Социология",
        "📜 К блоку Ис...": "📜 История"
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
                    print(f"🔄 '{original_text}' → '{button['text']}'")
                
                # Агрессивное сокращение всех кнопок до 12 символов
                elif len(original_text) > 12:
                    new_text = original_text
                    
                    # Для вариантов ответов
                    if new_text.startswith('A) ') or new_text.startswith('B) ') or new_text.startswith('C) ') or new_text.startswith('D) '):
                        prefix = new_text[:3]  # A), B), C), D)
                        remaining = new_text[3:]
                        
                        # Сокращаем до 8 символов после префикса
                        if len(remaining) > 8:
                            new_text = prefix + remaining[:8]
                        else:
                            new_text = prefix + remaining
                    
                    # Для остальных кнопок
                    else:
                        # Убираем лишние пробелы и сокращаем
                        new_text = new_text.strip()
                        if len(new_text) > 12:
                            new_text = new_text[:12]
                    
                    if new_text != original_text:
                        button['text'] = new_text
                        buttons_updated += 1
                        print(f"✂️ '{original_text}' → '{new_text}'")
            
            if len([b for b in node['data']['buttons'] if len(b['text']) > 12]) == 0:
                nodes_updated += 1
    
    print(f"\n✅ Обновлено узлов: {nodes_updated}")
    print(f"✅ Обновлено кнопок: {buttons_updated}")
    
    # Проверяем результат
    max_length = 0
    total_buttons = 0
    long_buttons = 0
    
    for node in updated_data['nodes']:
        if 'buttons' in node['data']:
            for button in node['data']['buttons']:
                total_buttons += 1
                length = len(button['text'])
                max_length = max(max_length, length)
                if length > 12:
                    long_buttons += 1
    
    print(f"\n📊 РЕЗУЛЬТАТ СОКРАЩЕНИЯ:")
    print(f"   Всего кнопок: {total_buttons}")
    print(f"   Максимальная длина: {max_length} символов")
    print(f"   Длинных кнопок (>12): {long_buttons}")
    
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
        return True
    else:
        print(f"❌ Ошибка обновления шаблона: {update_response.status_code}")
        return False

if __name__ == "__main__":
    success = fix_buttons_aggressive()
    if success:
        print("\n🎉 АГРЕССИВНОЕ СОКРАЩЕНИЕ ЗАВЕРШЕНО!")
        print("   Все кнопки оптимизированы для Telegram")
        print("   Максимальная длина кнопок: 12 символов")
    else:
        print("\n❌ СОКРАЩЕНИЕ ЗАВЕРШИЛОСЬ С ОШИБКОЙ")