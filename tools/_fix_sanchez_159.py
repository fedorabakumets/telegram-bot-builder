"""
@fileoverview Скрипт для отключения всех ботов кроме Sanchez в сценарии
и исправления цепочки Sanchez (bot-setv-init → напрямую к sanchez).
"""

import json
import copy
from pathlib import Path

PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_159\project.json")
BACKUP_PATH = PROJECT_PATH.with_suffix('.json.bak2')


def load():
    with open(PROJECT_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def save(data):
    with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def backup(data):
    with open(BACKUP_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def find_node(sheets, node_id):
    """Находит ноду по ID"""
    for sheet in sheets:
        for node in sheet.get('nodes', []):
            if node['id'] == node_id:
                return node
    return None


def main():
    data = load()
    backup(data)
    print(f"✅ Бэкап сохранён: {BACKUP_PATH}")

    sheets = data['sheets']

    # Находим лист "Сравнение через ботов"
    bot_sheet = None
    for s in sheets:
        if 'Сравнение через ботов' in s.get('name', ''):
            bot_sheet = s
            break

    if not bot_sheet:
        print("❌ Лист 'Сравнение через ботов' не найден")
        return

    print(f"\n📄 Лист: {bot_sheet['name']}")
    print(f"   Нод: {len(bot_sheet['nodes'])}")

    # Выводим текущую цепочку автопереходов от bot-setv-init
    init_node = find_node(sheets, 'bot-setv-init')
    if init_node:
        print(f"\n   bot-setv-init → {init_node['data'].get('autoTransitionTo', '?')}")

    # Текущая цепочка:
    # bot-setv-init → bot-ub-scooby → bot-setv-parse-scooby → bot-ub-capitalist-start → ...
    # ... → bot-setv-parse-litebit → bot-ub-sanchez-start → bot-ub-sanchez-buy →
    # bot-ub-sanchez-sbp → bot-ub-sanchez-ready → bot-setv-parse-sanchez → bot-setv-calc

    # Меняем: bot-setv-init → bot-ub-sanchez-start (пропускаем все остальные боты)
    if init_node:
        old_target = init_node['data'].get('autoTransitionTo', '')
        init_node['data']['autoTransitionTo'] = 'bot-ub-sanchez-start'
        print(f"\n   ✏️ bot-setv-init: autoTransitionTo '{old_target}' → 'bot-ub-sanchez-start'")

    # Также нужно чтобы bot-setv-parse-sanchez → bot-setv-calc (уже так и есть)
    parse_sanchez = find_node(sheets, 'bot-setv-parse-sanchez')
    if parse_sanchez:
        print(f"   bot-setv-parse-sanchez → {parse_sanchez['data'].get('autoTransitionTo', '?')}")

    # Проверяем ноды Sanchez
    sanchez_nodes = ['bot-ub-sanchez-start', 'bot-ub-sanchez-buy', 'bot-ub-sanchez-sbp', 'bot-ub-sanchez-ready']
    print("\n   Цепочка Sanchez:")
    for nid in sanchez_nodes:
        node = find_node(sheets, nid)
        if node:
            ntype = node['type']
            auto = node['data'].get('autoTransitionTo', '')
            msg = node['data'].get('messageText', '')[:40]
            click_val = node['data'].get('clickValue', '')
            msg_id = node['data'].get('messageId', '')
            msg_id_src = node['data'].get('messageIdSource', '')
            save_to = node['data'].get('saveResultTo', '')
            print(f"     {nid} ({ntype})")
            if msg:
                print(f"       msg: {msg}")
            if click_val:
                print(f"       clickValue: {click_val}")
            if msg_id:
                print(f"       messageId: {msg_id}")
            if msg_id_src:
                print(f"       messageIdSource: {msg_id_src}")
            if save_to:
                print(f"       saveResultTo: {save_to}")
            if auto:
                print(f"       → {auto}")
        else:
            print(f"     {nid} — НЕ НАЙДЕН!")

    # Теперь исправляем Sanchez:
    # Проблема: bot-ub-sanchez-sbp нажимает кнопку на msg {sanchez_resp2}
    # но Sanchez отвечает НОВЫМ сообщением, а не edit'ом
    # 
    # Решение: используем messageIdSource: 'last' для обоих click_button
    # Это заставит искать кнопку в последнем сообщении от бота

    sbp_node = find_node(sheets, 'bot-ub-sanchez-sbp')
    if sbp_node:
        sbp_node['data']['messageIdSource'] = 'last'
        # Убираем привязку к конкретному msg_id
        sbp_node['data']['messageId'] = ''
        print(f"\n   ✏️ bot-ub-sanchez-sbp: messageIdSource = 'last', messageId = ''")

    ready_node = find_node(sheets, 'bot-ub-sanchez-ready')
    if ready_node:
        ready_node['data']['messageIdSource'] = 'last'
        ready_node['data']['messageId'] = ''
        print(f"   ✏️ bot-ub-sanchez-ready: messageIdSource = 'last', messageId = ''")

    # Также нужно обновить clickValue для "изучил" — реальная кнопка "Я изучил и готов к оплате"
    if ready_node:
        old_click = ready_node['data'].get('clickValue', '')
        ready_node['data']['clickValue'] = 'изучил'
        print(f"   ✏️ bot-ub-sanchez-ready: clickValue = 'изучил' (частичное совпадение)")

    # Для bot-setv-calc — обнуляем переменные других ботов чтобы не было ошибок
    calc_node = find_node(sheets, 'bot-setv-calc')
    if calc_node:
        print(f"\n   bot-setv-calc: {len(calc_node['data'].get('variables', []))} переменных")

    save(data)
    print(f"\n✅ Сохранено: {PROJECT_PATH}")


if __name__ == '__main__':
    main()
