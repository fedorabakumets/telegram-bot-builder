"""
Скрипт добавляет ноды incoming_callback_trigger и set_variable
для обработки кнопки "🔄 Обновить" в project.json бота новый_бот_1_242_163.

Callback data кнопки: "refresh:{compare_mode}:{user_amount}"
Нода ict-refresh ловит callback, парсит payload.
Нода setv-parse-refresh устанавливает переменные из распарсенного callback.
"""

import json
import os
import sys

PROJECT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "bots", "новый_бот_1_242_163", "project.json"
)

# Нода 1: incoming_callback_trigger
NODE_ICT_REFRESH = {
    "id": "ict-refresh",
    "data": {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "showInMenu": False,
        "messageText": "",
        "keyboardType": "none",
        "requiresAuth": False,
        "isPrivateOnly": False,
        "callbackPattern": "refresh:",
        "callbackMatchType": "startsWith",
        "callbackDataSaveAs": "refresh_payload",
        "callbackDataStripPrefix": "refresh:",
        "autoTransitionTo": "setv-parse-refresh",
        "enableAutoTransition": True,
        "enableStatistics": False
    },
    "type": "incoming_callback_trigger",
    "position": {
        "x": 5200,
        "y": 2200
    }
}

# Нода 2: set_variable для парсинга refresh payload
NODE_SETV_PARSE_REFRESH = {
    "id": "setv-parse-refresh",
    "data": {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "showInMenu": False,
        "assignments": [
            {
                "id": "parse_mode",
                "mode": "expression",
                "value": "'{refresh_payload}'.split(':')[0] if ':' in '{refresh_payload}' else 'bots'",
                "variable": "compare_mode"
            },
            {
                "id": "parse_amount",
                "mode": "expression",
                "value": "'{refresh_payload}'.split(':')[1] if ':' in '{refresh_payload}' and len('{refresh_payload}'.split(':')) > 1 else '5000'",
                "variable": "user_amount"
            },
            {
                "id": "set_title_bots",
                "mode": "expression",
                "value": "'💱 <b>Сравнение курсов ботов</b>' if '{compare_mode}' == 'bots' else ('💱 <b>Сравнение курсов сайтов и ботов</b>' if '{compare_mode}' == 'all' else '💱 <b>Сравнение курсов сайтов</b>')",
                "variable": "compare_title"
            },
            {
                "id": "set_title_short",
                "mode": "expression",
                "value": "'💱 <b>Сравнение курсов ботов</b>' if '{compare_mode}' == 'bots' else ('💱 <b>Сравнение курсов сайтов и ботов</b>' if '{compare_mode}' == 'all' else '💱 <b>Сравнение курсов сайтов</b>')",
                "variable": "compare_title_short"
            },
            {
                "id": "set_from_name",
                "mode": "text",
                "value": "СБП/Карта",
                "variable": "selected_from_name"
            },
            {
                "id": "set_to_name",
                "mode": "text",
                "value": "Bitcoin",
                "variable": "selected_to_name"
            },
            {
                "id": "set_from_id",
                "mode": "text",
                "value": "2",
                "variable": "selected_from_id"
            },
            {
                "id": "set_to_id",
                "mode": "text",
                "value": "5",
                "variable": "selected_to_id"
            }
        ],
        "messageText": "",
        "keyboardType": "none",
        "requiresAuth": False,
        "isPrivateOnly": False,
        "resizeKeyboard": True,
        "oneTimeKeyboard": False,
        "autoTransitionTo": "bot-cond-in-progress",
        "enableStatistics": False,
        "enableAutoTransition": True
    },
    "type": "set_variable",
    "position": {
        "x": 5200,
        "y": 2400
    }
}

TARGET_SHEET_ID = "sheet-compare-rates"


def main():
    print(f"Читаю файл: {PROJECT_PATH}")

    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        project = json.load(f)

    # Определяем структуру: может быть {"sheets": [...]} или [{...}]
    if isinstance(project, dict) and "sheets" in project:
        sheets = project["sheets"]
    elif isinstance(project, list):
        sheets = project
    else:
        print("ОШИБКА: Неизвестная структура project.json")
        sys.exit(1)

    # Ищем нужный sheet
    target_sheet = None
    for sheet in sheets:
        if sheet.get("id") == TARGET_SHEET_ID:
            target_sheet = sheet
            break

    if target_sheet is None:
        print(f"ОШИБКА: Sheet с id='{TARGET_SHEET_ID}' не найден!")
        print(f"Доступные sheets: {[s.get('id') for s in sheets]}")
        sys.exit(1)

    print(f"Найден sheet: {target_sheet.get('name')} (id={target_sheet.get('id')})")

    nodes = target_sheet.get("nodes", [])
    print(f"Текущее количество нод в sheet: {len(nodes)}")

    # Проверяем, не добавлены ли уже эти ноды
    existing_ids = {n.get("id") for n in nodes}

    added = 0
    if NODE_ICT_REFRESH["id"] not in existing_ids:
        nodes.append(NODE_ICT_REFRESH)
        print(f"  + Добавлена нода: {NODE_ICT_REFRESH['id']} ({NODE_ICT_REFRESH['type']})")
        added += 1
    else:
        print(f"  ~ Нода {NODE_ICT_REFRESH['id']} уже существует, пропускаю")

    if NODE_SETV_PARSE_REFRESH["id"] not in existing_ids:
        nodes.append(NODE_SETV_PARSE_REFRESH)
        print(f"  + Добавлена нода: {NODE_SETV_PARSE_REFRESH['id']} ({NODE_SETV_PARSE_REFRESH['type']})")
        added += 1
    else:
        print(f"  ~ Нода {NODE_SETV_PARSE_REFRESH['id']} уже существует, пропускаю")

    if added == 0:
        print("Ничего не добавлено — ноды уже существуют.")
        return

    target_sheet["nodes"] = nodes
    print(f"Новое количество нод в sheet: {len(nodes)}")

    # Сохраняем
    print(f"Записываю файл: {PROJECT_PATH}")
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print(f"Готово! Добавлено {added} нод(ы).")

    # Верификация
    print("Проверяю валидность JSON...")
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        verified = json.load(f)

    if isinstance(verified, dict) and "sheets" in verified:
        v_sheets = verified["sheets"]
    else:
        v_sheets = verified

    for s in v_sheets:
        if s.get("id") == TARGET_SHEET_ID:
            v_nodes = s.get("nodes", [])
            v_ids = {n.get("id") for n in v_nodes}
            assert "ict-refresh" in v_ids, "Нода ict-refresh не найдена после записи!"
            assert "setv-parse-refresh" in v_ids, "Нода setv-parse-refresh не найдена после записи!"
            print(f"✓ Верификация пройдена. Обе ноды присутствуют в sheet '{s.get('name')}'")
            break


if __name__ == "__main__":
    main()
