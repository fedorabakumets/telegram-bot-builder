"""
Скрипт для исправления assignments в ноде setv-parse-refresh.
Заменяет сломанные expression-assignments на regex_extract и text.
"""
import json
import sys
from pathlib import Path

PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json")

NEW_ASSIGNMENTS = [
    {"id": "parse_mode", "mode": "regex_extract", "value": "^([^:]+)", "variable": "compare_mode", "regexSource": "{refresh_payload}"},
    {"id": "parse_amount", "mode": "regex_extract", "value": ":(\\d+)$", "variable": "user_amount", "regexSource": "{refresh_payload}"},
    {"id": "set_title_bots", "mode": "text", "value": "\U0001f4b1 <b>Сравнение курсов</b>", "variable": "compare_title"},
    {"id": "set_title_short", "mode": "text", "value": "\U0001f4b1 <b>Сравнение курсов</b>", "variable": "compare_title_short"},
    {"id": "set_from_name", "mode": "text", "value": "СБП/Карта", "variable": "selected_from_name"},
    {"id": "set_to_name", "mode": "text", "value": "Bitcoin", "variable": "selected_to_name"},
    {"id": "set_from_id", "mode": "text", "value": "2", "variable": "selected_from_id"},
    {"id": "set_to_id", "mode": "text", "value": "5", "variable": "selected_to_id"},
]

def main():
    print(f"Читаю {PROJECT_PATH}...")
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        project = json.load(f)

    # Найти sheet sheet-compare-rates
    sheets = project.get("sheets", [])
    target_sheet = None
    for sheet in sheets:
        if sheet.get("id") == "sheet-compare-rates":
            target_sheet = sheet
            break

    if not target_sheet:
        print("ОШИБКА: sheet 'sheet-compare-rates' не найден!")
        sys.exit(1)

    print(f"Найден sheet: {target_sheet['id']}")

    # Найти ноду setv-parse-refresh
    nodes = target_sheet.get("nodes", [])
    target_node = None
    for node in nodes:
        if node.get("id") == "setv-parse-refresh":
            target_node = node
            break

    if not target_node:
        print("ОШИБКА: нода 'setv-parse-refresh' не найдена!")
        sys.exit(1)

    print(f"Найдена нода: {target_node['id']}")
    print(f"Текущие assignments ({len(target_node['data']['assignments'])} шт.):")
    for a in target_node["data"]["assignments"]:
        print(f"  - {a['id']}: mode={a['mode']}, var={a['variable']}")

    # Заменить assignments
    target_node["data"]["assignments"] = NEW_ASSIGNMENTS

    print(f"\nНовые assignments ({len(NEW_ASSIGNMENTS)} шт.):")
    for a in NEW_ASSIGNMENTS:
        extra = f", regexSource={a['regexSource']}" if "regexSource" in a else ""
        print(f"  - {a['id']}: mode={a['mode']}, var={a['variable']}{extra}")

    # Сохранить
    print(f"\nСохраняю {PROJECT_PATH}...")
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("Сохранено!")

    # Верификация
    print("\nВерификация...")
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        verify = json.load(f)

    for sheet in verify["sheets"]:
        if sheet["id"] == "sheet-compare-rates":
            for node in sheet["nodes"]:
                if node["id"] == "setv-parse-refresh":
                    assignments = node["data"]["assignments"]
                    assert len(assignments) == 8, f"Ожидалось 8 assignments, получено {len(assignments)}"
                    assert assignments[0]["mode"] == "regex_extract", f"Первый assignment должен быть regex_extract"
                    assert assignments[1]["mode"] == "regex_extract", f"Второй assignment должен быть regex_extract"
                    assert assignments[0]["regexSource"] == "{refresh_payload}"
                    assert assignments[1]["regexSource"] == "{refresh_payload}"
                    assert assignments[2]["mode"] == "text"
                    assert assignments[3]["mode"] == "text"
                    print("✓ Верификация пройдена успешно!")
                    print(f"  - parse_mode: regex_extract, pattern='{assignments[0]['value']}'")
                    print(f"  - parse_amount: regex_extract, pattern='{assignments[1]['value']}'")
                    print(f"  - set_title_bots: text, value='{assignments[2]['value']}'")
                    print(f"  - set_title_short: text, value='{assignments[3]['value']}'")
                    return

    print("ОШИБКА: верификация не удалась — нода не найдена после сохранения!")
    sys.exit(1)

if __name__ == "__main__":
    main()
