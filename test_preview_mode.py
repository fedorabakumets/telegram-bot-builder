#!/usr/bin/env python3
"""
Тест режима превью для шаблона комплексного сбора данных
"""
import requests
import json
from datetime import datetime

def test_preview_mode():
    """Тестирует режим превью шаблона"""
    
    # Получаем шаблон
    response = requests.get('http://localhost:5000/api/templates')
    if response.status_code != 200:
        print(f"❌ Ошибка получения шаблонов: {response.status_code}")
        return
        
    templates = response.json()
    complex_template = None
    
    for template in templates:
        if template.get('name') == '📊 Комплексный сбор данных':
            complex_template = template
            break
    
    if not complex_template:
        print("❌ Шаблон не найден")
        return
    
    print(f"✅ Тестируем шаблон: {complex_template['name']}")
    
    # Создаем проект с шаблоном
    project_data = {
        "name": f"Превью тест - {datetime.now().strftime('%H:%M:%S')}",
        "description": "Тест режима превью",
        "data": complex_template['data']
    }
    
    create_response = requests.post('http://localhost:5000/api/projects', json=project_data)
    if create_response.status_code != 201:
        print(f"❌ Ошибка создания проекта: {create_response.status_code}")
        return
        
    project = create_response.json()
    project_id = project['id']
    
    # Тестируем последовательность узлов в превью
    nodes = complex_template['data']['nodes']
    print(f"\n🎯 ТЕСТ ПОСЛЕДОВАТЕЛЬНОСТИ УЗЛОВ ({len(nodes)} узлов):")
    
    for i, node in enumerate(nodes, 1):
        node_type = node.get('type', 'unknown')
        node_id = node.get('id', 'unknown')
        
        print(f"\n{i}. Узел: {node_id} (тип: {node_type})")
        
        if node_type == 'start':
            test_start_node(node)
        elif node_type == 'user-input':
            test_user_input_node(node)
        elif node_type == 'message':
            test_message_node(node)
    
    # Тестируем переходы между узлами
    connections = complex_template['data']['connections']
    print(f"\n🔗 ТЕСТ ПЕРЕХОДОВ ({len(connections)} соединений):")
    
    for i, connection in enumerate(connections, 1):
        source = connection.get('source', 'unknown')
        target = connection.get('target', 'unknown')
        print(f"{i}. {source} → {target}")
    
    print(f"\n✅ Превью тест завершен")

def test_start_node(node):
    """Тестирует стартовый узел"""
    data = node.get('data', {})
    message = data.get('messageText', 'Нет сообщения')
    keyboard_type = data.get('keyboardType', 'none')
    buttons = data.get('buttons', [])
    
    print(f"   📝 Сообщение: {message[:50]}...")
    print(f"   ⌨️ Клавиатура: {keyboard_type}")
    print(f"   🔘 Кнопки: {len(buttons)}")
    
    for btn in buttons:
        print(f"      • {btn.get('text', 'Нет текста')} → {btn.get('target', 'Нет цели')}")

def test_user_input_node(node):
    """Тестирует узел пользовательского ввода"""
    data = node.get('data', {})
    response_type = data.get('responseType', 'text')
    input_variable = data.get('inputVariable', 'unknown')
    is_required = data.get('isRequired', False)
    save_to_db = data.get('saveToDatabase', False)
    
    print(f"   📝 Тип ответа: {response_type}")
    print(f"   🔤 Переменная: {input_variable}")
    print(f"   ⚠️ Обязательный: {is_required}")
    print(f"   💾 Сохранить в БД: {save_to_db}")
    
    if response_type == 'buttons':
        options = data.get('responseOptions', [])
        print(f"   🔘 Варианты ответов: {len(options)}")
        for opt in options:
            print(f"      • {opt.get('text', 'Нет текста')} = {opt.get('value', 'Нет значения')}")
    
    if response_type == 'text':
        min_length = data.get('minLength', 0)
        max_length = data.get('maxLength', 0)
        print(f"   📏 Длина: {min_length}-{max_length} символов")

def test_message_node(node):
    """Тестирует обычный узел сообщения"""
    data = node.get('data', {})
    message = data.get('messageText', 'Нет сообщения')
    keyboard_type = data.get('keyboardType', 'none')
    buttons = data.get('buttons', [])
    
    print(f"   📝 Сообщение: {message[:50]}...")
    print(f"   ⌨️ Клавиатура: {keyboard_type}")
    print(f"   🔘 Кнопки: {len(buttons)}")

if __name__ == "__main__":
    print("🔍 ТЕСТИРОВАНИЕ РЕЖИМА ПРЕВЬЮ")
    print("=" * 50)
    test_preview_mode()
    print("=" * 50)