"""
@fileoverview Скрипт для исправления ноды edit_message (bot-edit-loading) в project.json бота 163.

Проблема: после редактирования сообщения "Загрузка..." на результат сравнения
нет inline-кнопок (Обновить, Другая сумма и т.д.), потому что editKeyboardMode = "remove".

Исправление:
  - editKeyboardMode = "node" (подставить клавиатуру из keyboard-ноды)
  - editKeyboardNodeId = "kb-compare-result" (существующая клавиатура на sheet-compare-rates)

Клавиатура kb-compare-result содержит кнопки:
  🔄 Обновить, 💰 Другая сумма, 🔄 Другая пара, ◀️ Меню, 📋 Сайты, 🤖 Боты
"""

import json
import sys
import os

PROJECT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'bots', 'новый_бот_1_242_163', 'project.json'
)

NODE_ID = 'bot-edit-loading'
KEYBOARD_NODE_ID = 'kb-compare-result'


def main():
    """Исправляет editKeyboardMode и editKeyboardNodeId в ноде bot-edit-loading."""
    
    # Читаем project.json
    print(f"Читаю: {PROJECT_PATH}")
    with open(PROJECT_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Проверяем что kb-compare-result существует
    kb_found = False
    for sheet in data.get('sheets', []):
        for node in sheet.get('nodes', []):
            if node.get('id') == KEYBOARD_NODE_ID:
                kb_found = True
                kb_sheet = sheet.get('id')
                btn_texts = [b.get('text', '') for b in node.get('data', {}).get('buttons', [])]
                print(f"✓ Клавиатура '{KEYBOARD_NODE_ID}' найдена на листе '{kb_sheet}'")
                print(f"  Кнопки: {btn_texts}")
                break
        if kb_found:
            break

    if not kb_found:
        print(f"✗ Клавиатура '{KEYBOARD_NODE_ID}' НЕ найдена!")
        print("  Ищу клавиатуру привязанную к bot-msg-result...")
        # Fallback: ищем keyboardNodeId у bot-msg-result
        for sheet in data.get('sheets', []):
            for node in sheet.get('nodes', []):
                if node.get('id') == 'bot-msg-result':
                    fallback_kb = node.get('data', {}).get('keyboardNodeId')
                    if fallback_kb:
                        print(f"  Используем: {fallback_kb}")
                        # Переопределяем
                        globals()['KEYBOARD_NODE_ID'] = fallback_kb
                    else:
                        print("  У bot-msg-result нет keyboardNodeId, кнопки встроены.")
                        print("  Используем kb-compare-result (кросс-листовая ссылка)")
                    break
        # Всё равно используем kb-compare-result — она существует на другом листе
        if not kb_found:
            print(f"\n⚠ Внимание: kb-compare-result на sheet-bots не найдена,")
            print(f"  но она есть на sheet-compare-rates. Используем кросс-листовую ссылку.")

    # Находим и исправляем ноду bot-edit-loading
    node_fixed = False
    for sheet in data.get('sheets', []):
        for node in sheet.get('nodes', []):
            if node.get('id') == NODE_ID:
                node_data = node.get('data', {})
                
                old_mode = node_data.get('editKeyboardMode', 'NOT SET')
                old_kb_id = node_data.get('editKeyboardNodeId', 'NOT SET')
                
                print(f"\n--- До исправления ---")
                print(f"  editKeyboardMode: '{old_mode}'")
                print(f"  editKeyboardNodeId: '{old_kb_id}'")
                
                # Применяем исправления
                node_data['editKeyboardMode'] = 'node'
                node_data['editKeyboardNodeId'] = KEYBOARD_NODE_ID
                
                print(f"\n--- После исправления ---")
                print(f"  editKeyboardMode: '{node_data['editKeyboardMode']}'")
                print(f"  editKeyboardNodeId: '{node_data['editKeyboardNodeId']}'")
                
                node_fixed = True
                break
        if node_fixed:
            break

    if not node_fixed:
        print(f"\n✗ ОШИБКА: Нода '{NODE_ID}' не найдена в project.json!")
        sys.exit(1)

    # Сохраняем
    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Файл сохранён: {PROJECT_PATH}")

    # Валидация JSON
    print("\nВалидация JSON...")
    with open(PROJECT_PATH, 'r', encoding='utf-8') as f:
        try:
            validated = json.load(f)
            # Проверяем что изменения на месте
            for sheet in validated.get('sheets', []):
                for node in sheet.get('nodes', []):
                    if node.get('id') == NODE_ID:
                        d = node.get('data', {})
                        assert d.get('editKeyboardMode') == 'node', \
                            f"editKeyboardMode != 'node': {d.get('editKeyboardMode')}"
                        assert d.get('editKeyboardNodeId') == KEYBOARD_NODE_ID, \
                            f"editKeyboardNodeId != '{KEYBOARD_NODE_ID}': {d.get('editKeyboardNodeId')}"
                        print("✓ JSON валидный, изменения подтверждены!")
                        return
            print("✗ Нода не найдена при валидации!")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"✗ JSON невалидный: {e}")
            sys.exit(1)


if __name__ == '__main__':
    main()
