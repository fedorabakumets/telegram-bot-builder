"""
Скрипт для модификации project.json бота 163:
1. Замена заголовков в messageText (bot-msg-result, msg-compare-result)
2. Добавление переменной compare_title_short в set-mode узлы
3. Добавление реферальных параметров ?start=ref_compare к ссылкам ботов
"""

import json
import re
import os

PROJECT_PATH = os.path.join(
    os.path.dirname(__file__), "..",
    "bots", "новый_бот_1_242_163", "project.json"
)

def main():
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    changes = []

    # Собираем все ноды из всех sheets
    all_nodes = []
    for sheet in data.get("sheets", []):
        for node in sheet.get("nodes", []):
            all_nodes.append(node)

    # === Задача 1: Поменять заголовки в messageText ===

    # bot-msg-result: сделать заголовок динамическим через {compare_title_short}
    for node in all_nodes:
        if node.get("id") == "bot-msg-result":
            old_text = node["data"]["messageText"]
            new_text = (
                "{compare_title_short}\n\n"
                "📊 <b>СБП/Карта → Bitcoin</b>\n"
                "💰 Сумма: <b>{user_amount_fmt}</b> ₽\n\n"
                "{bot_rates_text}\n"
                "👆 <i>Нажми на название для перехода</i>"
            )
            if old_text != new_text:
                node["data"]["messageText"] = new_text
                changes.append(f"[Задача 1] bot-msg-result: заменён messageText")
                changes.append(f"  Было: {repr(old_text[:80])}...")
                changes.append(f"  Стало: {repr(new_text[:80])}...")
            break

    # msg-compare-result: заменить "Сравнение курсов" на "Сравнение курсов сайтов"
    for node in all_nodes:
        if node.get("id") == "msg-compare-result":
            old_text = node["data"]["messageText"]
            new_text = (
                "💱 <b>Сравнение курсов сайтов</b>\n\n"
                "📊 <b>СБП/Карта → Bitcoin</b>\n"
                "💰 Сумма: <b>{user_amount_fmt}</b> ₽\n\n"
                "{rates_text}\n"
                "👆 <i>Нажми на название для перехода</i>"
            )
            if old_text != new_text:
                node["data"]["messageText"] = new_text
                changes.append(f"[Задача 1] msg-compare-result: заменён messageText")
                changes.append(f"  Было: {repr(old_text[:80])}...")
                changes.append(f"  Стало: {repr(new_text[:80])}...")
            break

    # === Задача 2: Добавить переменную compare_title_short в set-mode узлы ===

    # bots-set-mode
    for node in all_nodes:
        if node.get("id") == "bots-set-mode":
            assignments = node["data"].get("assignments", [])
            # Проверяем, нет ли уже такого assignment
            existing_ids = [a["id"] for a in assignments]
            if "title_short" not in existing_ids:
                assignments.append({
                    "id": "title_short",
                    "mode": "text",
                    "value": "💱 <b>Сравнение курсов ботов</b>",
                    "variable": "compare_title_short"
                })
                changes.append(f"[Задача 2] bots-set-mode: добавлен assignment title_short → compare_title_short")
            else:
                changes.append(f"[Задача 2] bots-set-mode: assignment title_short уже существует")
            break

    # all-set-mode
    for node in all_nodes:
        if node.get("id") == "all-set-mode":
            assignments = node["data"].get("assignments", [])
            existing_ids = [a["id"] for a in assignments]
            if "title_short" not in existing_ids:
                assignments.append({
                    "id": "title_short",
                    "mode": "text",
                    "value": "💱 <b>Сравнение курсов сайтов и ботов</b>",
                    "variable": "compare_title_short"
                })
                changes.append(f"[Задача 2] all-set-mode: добавлен assignment title_short → compare_title_short")
            else:
                changes.append(f"[Задача 2] all-set-mode: assignment title_short уже существует")
            break

    # === Задача 3: Добавить реф-ссылки для ботов в bot-setv-calc ===

    ref_count = 0
    for node in all_nodes:
        if node.get("id") == "bot-setv-calc":
            assignments = node["data"].get("assignments", [])
            for assignment in assignments:
                if assignment.get("mode") == "json_push":
                    value = assignment.get("value", "")
                    # Ищем url вида https://t.me/... без ?start=
                    pattern = r'"url":\s*"(https://t\.me/[^"?]+)"'
                    match = re.search(pattern, value)
                    if match:
                        old_url = match.group(1)
                        new_url = old_url + "?start=ref_compare"
                        new_value = value.replace(
                            f'"url": "{old_url}"',
                            f'"url": "{new_url}"'
                        )
                        if new_value != value:
                            assignment["value"] = new_value
                            ref_count += 1
            break

    if ref_count > 0:
        changes.append(f"[Задача 3] bot-setv-calc: добавлен ?start=ref_compare к {ref_count} ссылкам ботов")

    # Сохраняем
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Выводим результат
    print("=" * 60)
    print("Результат модификации project.json (бот 163)")
    print("=" * 60)
    for change in changes:
        print(change)
    print("=" * 60)
    print(f"Всего изменений: {len(changes)}")
    print(f"Файл сохранён: {os.path.abspath(PROJECT_PATH)}")


if __name__ == "__main__":
    main()
