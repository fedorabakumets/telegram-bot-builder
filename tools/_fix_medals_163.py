"""
Скрипт для исправления медалей и skipIfEmpty в project.json бота 163.

Задача 1: Вернуть медали в all-merge-format (добавить 🔸 и {item.type} в шаблон)
Задача 2: Убрать skipIfEmpty из json_push в bot-setv-calc
Задача 3: Убедиться что 🔸 в начале шаблонов bot-setv-format и setv-compare-best
"""

import json
import os

PROJECT_PATH = os.path.join(
    os.path.dirname(__file__), "..",
    "bots", "новый_бот_1_242_163", "project.json"
)

def find_node(data, node_id):
    """Найти узел по id во всех sheets"""
    for sheet in data.get("sheets", []):
        for node in sheet.get("nodes", []):
            if node.get("id") == node_id:
                return node
    return None


def fix_all_merge_format(data):
    """Задача 1: Обновить шаблон json_format в all-merge-format"""
    node = find_node(data, "all-merge-format")
    if not node:
        print("❌ Узел all-merge-format не найден")
        return False

    assignments = node["data"].get("assignments", [])
    for a in assignments:
        if a.get("id") == "format_all" and a.get("mode") == "json_format":
            old_value = a["value"]
            new_value = '🔸 {item.type} <a href="{item.url}">{item.name}</a>: <b>{item.rate} BTC</b> ({item.raw_rate} ₽)\n'
            if old_value != new_value:
                a["value"] = new_value
                print(f"✅ all-merge-format/format_all: шаблон обновлён")
                print(f"   Было: {old_value}")
                print(f"   Стало: {new_value}")
                return True
            else:
                print("ℹ️  all-merge-format/format_all: уже корректный")
                return False

    print("❌ assignment format_all с mode=json_format не найден в all-merge-format")
    return False


def fix_bot_setv_calc_skip_if_empty(data):
    """Задача 2: Убрать skipIfEmpty из json_push в bot-setv-calc"""
    node = find_node(data, "bot-setv-calc")
    if not node:
        print("❌ Узел bot-setv-calc не найден")
        return False

    assignments = node["data"].get("assignments", [])
    count = 0
    for a in assignments:
        if a.get("mode") == "json_push" and a.get("skipIfEmpty", "") != "":
            old_val = a["skipIfEmpty"]
            a["skipIfEmpty"] = ""
            count += 1
            print(f"   🔧 {a['id']}: skipIfEmpty '{old_val}' → ''")

    if count > 0:
        print(f"✅ bot-setv-calc: убран skipIfEmpty у {count} assignments с mode=json_push")
        return True
    else:
        print("ℹ️  bot-setv-calc: skipIfEmpty уже пустой у всех json_push")
        return False


def fix_bot_setv_format(data):
    """Задача 3a: Убедиться что 🔸 в начале шаблона bot-setv-format"""
    node = find_node(data, "bot-setv-format")
    if not node:
        print("❌ Узел bot-setv-format не найден")
        return False

    assignments = node["data"].get("assignments", [])
    for a in assignments:
        if a.get("mode") == "json_format":
            old_value = a["value"]
            new_value = '🔸 <a href="{item.url}">{item.name}</a>: <b>{item.rate} BTC</b> ({item.raw_rate} ₽)\n'
            if old_value != new_value:
                a["value"] = new_value
                print(f"✅ bot-setv-format/{a['id']}: шаблон обновлён")
                print(f"   Было: {old_value}")
                print(f"   Стало: {new_value}")
                return True
            else:
                print("ℹ️  bot-setv-format: шаблон уже корректный")
                return False

    print("❌ assignment с mode=json_format не найден в bot-setv-format")
    return False


def fix_setv_compare_best(data):
    """Задача 3b: Убедиться что 🔸 в начале шаблона setv-compare-best"""
    node = find_node(data, "setv-compare-best")
    if not node:
        print("❌ Узел setv-compare-best не найден")
        return False

    assignments = node["data"].get("assignments", [])
    for a in assignments:
        if a.get("mode") == "json_format":
            old_value = a["value"]
            new_value = '🔸 <a href="{item.url}">{item.name}</a>: <b>{item.rate} BTC</b> ({item.raw_rate} ₽)\n'
            if old_value != new_value:
                a["value"] = new_value
                print(f"✅ setv-compare-best/{a['id']}: шаблон обновлён")
                print(f"   Было: {old_value}")
                print(f"   Стало: {new_value}")
                return True
            else:
                print("ℹ️  setv-compare-best: шаблон уже корректный")
                return False

    print("❌ assignment с mode=json_format не найден в setv-compare-best")
    return False


def main():
    print(f"📂 Загрузка: {PROJECT_PATH}")
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    changes = []
    print("\n--- Задача 1: all-merge-format (добавить 🔸 {item.type}) ---")
    changes.append(fix_all_merge_format(data))

    print("\n--- Задача 2: bot-setv-calc (убрать skipIfEmpty) ---")
    changes.append(fix_bot_setv_calc_skip_if_empty(data))

    print("\n--- Задача 3a: bot-setv-format (🔸 в начале) ---")
    changes.append(fix_bot_setv_format(data))

    print("\n--- Задача 3b: setv-compare-best (🔸 в начале) ---")
    changes.append(fix_setv_compare_best(data))

    if any(changes):
        with open(PROJECT_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\n💾 Сохранено: {PROJECT_PATH}")
    else:
        print("\n⚠️  Изменений не было, файл не перезаписан")


if __name__ == "__main__":
    main()
