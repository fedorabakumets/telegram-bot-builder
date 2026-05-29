"""
@fileoverview Скрипт для модификации project.json бота 163:
  1. Замена edit_message на delete_message (исправление цепочки)
  2. Подключение всех 17 ботов обратно в цепочку
  3. Обновление текста bot-msg-result для отображения всех 17 ботов
"""

import json
import os
import sys

# Путь к project.json
PROJECT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "bots", "новый_бот_1_242_163", "project.json"
)


def load_project(path):
    """
    Загружает project.json
    @param path - Путь к файлу
    @returns Словарь с данными проекта
    """
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_project(path, data):
    """
    Сохраняет project.json с форматированием
    @param path - Путь к файлу
    @param data - Данные проекта
    """
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def find_sheet(project, sheet_id):
    """
    Находит лист по ID
    @param project - Данные проекта
    @param sheet_id - ID листа
    @returns Лист или None
    """
    for sheet in project.get("sheets", []):
        if sheet.get("id") == sheet_id:
            return sheet
    return None


def find_node(sheet, node_id):
    """
    Находит ноду по ID в листе
    @param sheet - Лист
    @param node_id - ID ноды
    @returns Нода или None
    """
    for node in sheet.get("nodes", []):
        if node.get("id") == node_id:
            return node
    return None


def remove_node(sheet, node_id):
    """
    Удаляет ноду из листа по ID
    @param sheet - Лист
    @param node_id - ID ноды для удаления
    @returns True если нода была удалена
    """
    nodes = sheet.get("nodes", [])
    original_len = len(nodes)
    sheet["nodes"] = [n for n in nodes if n.get("id") != node_id]
    return len(sheet["nodes"]) < original_len


def task1_replace_edit_with_delete(sheet):
    """
    Задача 1: Заменить edit_message на delete_message
    - Удалить ноду bot-edit-loading (если есть)
    - Добавить/обновить ноду bot-delete-loading (type: delete_message)
    - Обновить bot-setv-calc → autoTransitionTo = bot-delete-loading
    - bot-delete-loading → autoTransitionTo = bot-msg-result
    - Проверить saveMessageIdTo у bot-msg-loading
    """
    print("\n=== Задача 1: Замена edit_message на delete_message ===")

    # 1. Удалить bot-edit-loading если есть
    if remove_node(sheet, "bot-edit-loading"):
        print("  ✓ Удалена нода bot-edit-loading")
    else:
        print("  ℹ Нода bot-edit-loading не найдена (уже удалена)")

    # 2. Проверить/добавить bot-delete-loading
    delete_node = find_node(sheet, "bot-delete-loading")
    delete_node_data = {
        "id": "bot-delete-loading",
        "type": "delete_message",
        "position": {"x": 6200, "y": 3200},
        "data": {
            "messageIdSource": "custom",
            "messageIdManual": "{loading_msg_id}",
            "chatIdSource": "current_chat",
            "chatIdManual": "",
            "ignoreErrors": True,
            "bulkDelete": False,
            "bulkMessageIdsVariable": "",
            "autoTransitionTo": "bot-msg-result",
            "enableAutoTransition": True
        }
    }

    if delete_node:
        # Обновить существующую ноду
        idx = next(i for i, n in enumerate(sheet["nodes"]) if n.get("id") == "bot-delete-loading")
        sheet["nodes"][idx] = delete_node_data
        print("  ✓ Обновлена нода bot-delete-loading (autoTransitionTo → bot-msg-result)")
    else:
        sheet["nodes"].append(delete_node_data)
        print("  ✓ Добавлена нода bot-delete-loading")

    # 3. Обновить bot-setv-calc → autoTransitionTo = bot-delete-loading
    calc_node = find_node(sheet, "bot-setv-calc")
    if calc_node:
        old_target = calc_node["data"].get("autoTransitionTo", "")
        calc_node["data"]["autoTransitionTo"] = "bot-delete-loading"
        calc_node["data"]["enableAutoTransition"] = True
        print(f"  ✓ bot-setv-calc: autoTransitionTo '{old_target}' → 'bot-delete-loading'")
    else:
        print("  ✗ ОШИБКА: нода bot-setv-calc не найдена!")
        return False

    # 4. Проверить saveMessageIdTo у bot-msg-loading
    loading_node = find_node(sheet, "bot-msg-loading")
    if loading_node:
        if loading_node["data"].get("saveMessageIdTo") == "loading_msg_id":
            print("  ✓ bot-msg-loading уже имеет saveMessageIdTo = 'loading_msg_id'")
        else:
            loading_node["data"]["saveMessageIdTo"] = "loading_msg_id"
            print("  ✓ bot-msg-loading: добавлено saveMessageIdTo = 'loading_msg_id'")
    else:
        print("  ✗ ОШИБКА: нода bot-msg-loading не найдена!")
        return False

    return True


def task2_reconnect_all_bots(sheet):
    """
    Задача 2: Подключить все 17 ботов обратно
    Цепочка: bot-setv-init → bot-msg-loading → bot-ub-scooby → ... →
             bot-setv-parse-casper → bot-ub-monopoly-start → ... →
             bot-setv-parse-monopoly → bot-setv-calc → bot-delete-loading → bot-msg-result
    """
    print("\n=== Задача 2: Подключение всех 17 ботов ===")

    # 1. bot-msg-loading → autoTransitionTo = bot-ub-scooby
    loading_node = find_node(sheet, "bot-msg-loading")
    if loading_node:
        old_target = loading_node["data"].get("autoTransitionTo", "")
        loading_node["data"]["autoTransitionTo"] = "bot-ub-scooby"
        print(f"  ✓ bot-msg-loading: autoTransitionTo '{old_target}' → 'bot-ub-scooby'")
    else:
        print("  ✗ ОШИБКА: нода bot-msg-loading не найдена!")
        return False

    # 2. bot-setv-parse-casper → autoTransitionTo = bot-ub-monopoly-start
    casper_node = find_node(sheet, "bot-setv-parse-casper")
    if casper_node:
        old_target = casper_node["data"].get("autoTransitionTo", "")
        casper_node["data"]["autoTransitionTo"] = "bot-ub-monopoly-start"
        print(f"  ✓ bot-setv-parse-casper: autoTransitionTo '{old_target}' → 'bot-ub-monopoly-start'")
    else:
        print("  ✗ ОШИБКА: нода bot-setv-parse-casper не найдена!")
        return False

    # 3. bot-setv-parse-monopoly → autoTransitionTo = bot-setv-calc
    monopoly_node = find_node(sheet, "bot-setv-parse-monopoly")
    if monopoly_node:
        old_target = monopoly_node["data"].get("autoTransitionTo", "")
        if old_target == "bot-setv-calc":
            print(f"  ✓ bot-setv-parse-monopoly: autoTransitionTo уже 'bot-setv-calc'")
        else:
            monopoly_node["data"]["autoTransitionTo"] = "bot-setv-calc"
            print(f"  ✓ bot-setv-parse-monopoly: autoTransitionTo '{old_target}' → 'bot-setv-calc'")
    else:
        print("  ✗ ОШИБКА: нода bot-setv-parse-monopoly не найдена!")
        return False

    return True


def task3_update_msg_result(sheet):
    """
    Задача 3: Обновить текст bot-msg-result для отображения всех 17 ботов
    """
    print("\n=== Задача 3: Обновление bot-msg-result ===")

    result_node = find_node(sheet, "bot-msg-result")
    if not result_node:
        print("  ✗ ОШИБКА: нода bot-msg-result не найдена!")
        return False

    # Новый текст сообщения со всеми 17 ботами
    new_text = (
        '💱 <b>Сравнение курсов</b>\n'
        '\n'
        '💰 Сумма: <b>{user_amount_fmt}</b> ₽\n'
        '\n'
        '🔸 ScoobyChange: <b>{scooby_btc} BTC</b> ({scooby_rate_fmt} ₽)\n'
        '🔸 Capitalist: <b>{capitalist_btc} BTC</b> ({capitalist_rate_fmt} ₽)\n'
        '🔸 24Crypto: <b>{crypto24_btc} BTC</b> ({crypto24_rate_fmt} ₽)\n'
        '🔸 Shaxta: <b>{shaxta_btc} BTC</b> ({shaxta_rate_fmt} ₽)\n'
        '🔸 BitMixer: <b>{bitmixer_btc} BTC</b> ({bitmixer_rate_fmt} ₽)\n'
        '🔸 LiteBit: <b>{litebit_btc} BTC</b> ({litebit_rate_fmt} ₽)\n'
        '🔸 Sanchez: <b>{sanchez_btc} BTC</b> ({sanchez_rate_fmt} ₽)\n'
        '🔸 Империя: <b>{imperia_btc} BTC</b> ({imperia_rate_fmt} ₽)\n'
        '🔸 VIRON: <b>{viron_btc} BTC</b> ({viron_rate_fmt} ₽)\n'
        '🔸 CryptoFlow: <b>{cf_btc} BTC</b> ({cf_rate_fmt} ₽)\n'
        '🔸 Vortex: <b>{vortex_btc} BTC</b> ({vortex_rate_fmt} ₽)\n'
        '🔸 CrazyBTC: <b>{crazy_btc} BTC</b> ({crazy_rate_fmt} ₽)\n'
        '🔸 INFINITY: <b>{inf_btc} BTC</b> ({inf_rate_fmt} ₽)\n'
        '🔸 Lucky: <b>{lucky_btc} BTC</b> ({lucky_rate_fmt} ₽)\n'
        '🔸 Love: <b>{love_btc} BTC</b> ({love_rate_fmt} ₽)\n'
        '🔸 CASPER: <b>{casper_btc} BTC</b> ({casper_rate_fmt} ₽)\n'
        '🔸 BTC Monopoly: <b>{monopoly_btc} BTC</b>'
    )

    old_text = result_node["data"].get("messageText", "")
    result_node["data"]["messageText"] = new_text
    print(f"  ✓ Обновлён messageText (было {len(old_text)} символов → стало {len(new_text)} символов)")

    # Проверить наличие keyboardNodeId или inline кнопок
    if result_node["data"].get("keyboardType") == "inline" and result_node["data"].get("buttons"):
        print("  ✓ bot-msg-result имеет inline кнопки (keyboardType=inline)")
    elif result_node["data"].get("keyboardNodeId"):
        print(f"  ✓ bot-msg-result имеет keyboardNodeId = '{result_node['data']['keyboardNodeId']}'")
    else:
        # Добавить keyboardNodeId если нет кнопок
        result_node["data"]["keyboardNodeId"] = "kb-compare-result"
        print("  ✓ Добавлен keyboardNodeId = 'kb-compare-result'")

    return True


def verify_chain(sheet):
    """
    Верификация цепочки переходов
    """
    print("\n=== Верификация цепочки ===")

    expected_chain = [
        ("bot-setv-init", "bot-msg-loading"),
        ("bot-msg-loading", "bot-ub-scooby"),
        ("bot-setv-parse-casper", "bot-ub-monopoly-start"),
        ("bot-setv-parse-monopoly", "bot-setv-calc"),
        ("bot-setv-calc", "bot-delete-loading"),
        ("bot-delete-loading", "bot-msg-result"),
    ]

    all_ok = True
    for node_id, expected_target in expected_chain:
        node = find_node(sheet, node_id)
        if node:
            actual = node["data"].get("autoTransitionTo", "")
            status = "✓" if actual == expected_target else "✗"
            if actual != expected_target:
                all_ok = False
            print(f"  {status} {node_id} → {actual} (ожидалось: {expected_target})")
        else:
            print(f"  ✗ Нода {node_id} не найдена!")
            all_ok = False

    return all_ok


def main():
    """
    Основная функция — выполняет все три задачи
    """
    print(f"Загрузка: {PROJECT_PATH}")

    if not os.path.exists(PROJECT_PATH):
        print(f"ОШИБКА: файл не найден: {PROJECT_PATH}")
        sys.exit(1)

    project = load_project(PROJECT_PATH)
    print(f"  Загружено {len(project.get('sheets', []))} листов")

    # Найти лист sheet-bots
    sheet = find_sheet(project, "sheet-bots")
    if not sheet:
        print("ОШИБКА: лист 'sheet-bots' не найден!")
        sys.exit(1)

    print(f"  Лист 'sheet-bots' содержит {len(sheet.get('nodes', []))} нод")

    # Выполнить задачи
    ok1 = task1_replace_edit_with_delete(sheet)
    ok2 = task2_reconnect_all_bots(sheet)
    ok3 = task3_update_msg_result(sheet)

    if not (ok1 and ok2 and ok3):
        print("\n✗ Есть ошибки, файл НЕ сохранён!")
        sys.exit(1)

    # Верификация
    chain_ok = verify_chain(sheet)

    # Сохранить
    save_project(PROJECT_PATH, project)
    print(f"\n✓ Файл сохранён: {PROJECT_PATH}")

    # Проверить что JSON валидный (перечитать)
    try:
        with open(PROJECT_PATH, "r", encoding="utf-8") as f:
            json.load(f)
        print("✓ JSON валидный")
    except json.JSONDecodeError as e:
        print(f"✗ JSON невалидный: {e}")
        sys.exit(1)

    if chain_ok:
        print("\n✓ Все задачи выполнены успешно!")
    else:
        print("\n⚠ Задачи выполнены, но цепочка имеет расхождения (проверьте вручную)")


if __name__ == "__main__":
    main()
