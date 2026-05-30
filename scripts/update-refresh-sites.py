"""
Скрипт для обновления project.json:
1. Добавляет customCallbackData в кнопку "Обновить" (btn-compare-refresh)
2. Меняет autoTransitionTo в ноде setv-parse-refresh
3. Добавляет condition ноду cond-refresh-route
"""

import json
import sys

PROJECT_PATH = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"

def main():
    # 1. Читаем JSON
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 2. Находим sheet sheet-compare-rates
    sheet = None
    for s in data["sheets"]:
        if s["id"] == "sheet-compare-rates":
            sheet = s
            break

    if sheet is None:
        print("ERROR: sheet 'sheet-compare-rates' не найден!")
        sys.exit(1)

    nodes = sheet["nodes"]

    # 3. Находим ноду kb-compare-result и добавляем customCallbackData
    kb_node = None
    for node in nodes:
        if node["id"] == "kb-compare-result":
            kb_node = node
            break

    if kb_node is None:
        print("ERROR: нода 'kb-compare-result' не найдена!")
        sys.exit(1)

    btn_found = False
    for btn in kb_node["data"]["buttons"]:
        if btn["id"] == "btn-compare-refresh":
            btn["customCallbackData"] = "refresh:sites:{user_amount}"
            btn_found = True
            print("OK: customCallbackData добавлен в btn-compare-refresh")
            break

    if not btn_found:
        print("ERROR: кнопка 'btn-compare-refresh' не найдена!")
        sys.exit(1)

    # 4. Находим ноду setv-parse-refresh и меняем autoTransitionTo
    setv_node = None
    for node in nodes:
        if node["id"] == "setv-parse-refresh":
            setv_node = node
            break

    if setv_node is None:
        print("ERROR: нода 'setv-parse-refresh' не найдена!")
        sys.exit(1)

    old_value = setv_node["data"].get("autoTransitionTo")
    if old_value == "bot-cond-in-progress":
        setv_node["data"]["autoTransitionTo"] = "cond-refresh-route"
        print(f"OK: autoTransitionTo изменён с '{old_value}' на 'cond-refresh-route'")
    else:
        print(f"WARNING: autoTransitionTo = '{old_value}' (ожидалось 'bot-cond-in-progress'), всё равно меняем")
        setv_node["data"]["autoTransitionTo"] = "cond-refresh-route"

    # 5. Добавляем ноду cond-refresh-route (если не существует)
    existing = any(node["id"] == "cond-refresh-route" for node in nodes)
    if existing:
        print("INFO: нода 'cond-refresh-route' уже существует, пропускаем добавление")
    else:
        new_node = {
            "id": "cond-refresh-route",
            "data": {
                "buttons": [],
                "branches": [
                    {
                        "id": "br_sites",
                        "value": "sites",
                        "target": "setv-compare-init",
                        "operator": "equals"
                    },
                    {
                        "id": "br_else",
                        "value": "",
                        "target": "bot-cond-in-progress",
                        "operator": "else"
                    }
                ],
                "markdown": False,
                "variable": "compare_mode",
                "adminOnly": False,
                "showInMenu": False,
                "messageText": "",
                "keyboardType": "none",
                "requiresAuth": False,
                "isPrivateOnly": False,
                "resizeKeyboard": True,
                "oneTimeKeyboard": False,
                "enableStatistics": False
            },
            "type": "condition",
            "position": {
                "x": 5200,
                "y": 2600
            }
        }
        nodes.append(new_node)
        print("OK: нода 'cond-refresh-route' добавлена")

    # 6. Сохраняем файл
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("OK: файл сохранён")

    # 7. Верификация — перечитываем и проверяем валидность JSON
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        verified = json.load(f)

    # Проверяем что изменения на месте
    for s in verified["sheets"]:
        if s["id"] == "sheet-compare-rates":
            for node in s["nodes"]:
                if node["id"] == "kb-compare-result":
                    for btn in node["data"]["buttons"]:
                        if btn["id"] == "btn-compare-refresh":
                            assert btn.get("customCallbackData") == "refresh:sites:{user_amount}", \
                                "Верификация customCallbackData не прошла!"
                if node["id"] == "setv-parse-refresh":
                    assert node["data"]["autoTransitionTo"] == "cond-refresh-route", \
                        "Верификация autoTransitionTo не прошла!"
                if node["id"] == "cond-refresh-route":
                    assert node["type"] == "condition", \
                        "Верификация cond-refresh-route не прошла!"
            break

    print("OK: верификация пройдена успешно!")


if __name__ == "__main__":
    main()
