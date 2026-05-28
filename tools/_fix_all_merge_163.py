"""
@fileoverview Скрипт для замены assignments узла all-merge-format.
Заменяет простую текстовую склейку на array_concat + json_format
для единого отсортированного списка ботов и сайтов.
"""

import json
import os

# Путь к файлу проекта
PROJECT_PATH = os.path.join(
    os.path.dirname(__file__), "..",
    "bots", "новый_бот_1_242_163", "project.json"
)

# Новые assignments для узла all-merge-format
NEW_ASSIGNMENTS = [
    {
        "id": "merge_arrays",
        "mode": "array_concat",
        "value": "{bot_compare_results}",
        "concatWith": "{compare_results}",
        "variable": "all_compare_results"
    },
    {
        "id": "format_all",
        "mode": "json_format",
        "value": "🔸 <a href=\"{item.url}\">{item.name}</a> {item.type}: <b>{item.rate} BTC</b> ({item.raw_rate} ₽)\n",
        "variable": "all_compare_results",
        "lookupField": "rate"
    },
    {
        "id": "save_text",
        "mode": "text",
        "value": "{all_compare_results}",
        "variable": "bot_rates_text"
    }
]

TARGET_NODE_ID = "all-merge-format"


def find_node_recursive(nodes, node_id):
    """
    Рекурсивно ищет узел по id во всех листах и нодах.
    @param nodes - список узлов для поиска
    @param node_id - идентификатор искомого узла
    @returns найденный узел или None
    """
    for node in nodes:
        if node.get("id") == node_id:
            return node
    return None


def main():
    """
    Основная функция: загружает project.json, находит узел all-merge-format,
    заменяет его assignments и сохраняет файл.
    """
    # Загружаем файл
    abs_path = os.path.abspath(PROJECT_PATH)
    print(f"📂 Загружаю: {abs_path}")

    with open(abs_path, "r", encoding="utf-8") as f:
        project = json.load(f)

    # Ищем узел all-merge-format во всех листах
    target_node = None
    target_sheet = None

    for sheet in project.get("sheets", []):
        node = find_node_recursive(sheet.get("nodes", []), TARGET_NODE_ID)
        if node:
            target_node = node
            target_sheet = sheet["name"]
            break

    if not target_node:
        print(f"❌ Узел '{TARGET_NODE_ID}' не найден!")
        return

    print(f"✅ Найден узел '{TARGET_NODE_ID}' на листе: {target_sheet}")

    # Показываем старые assignments
    old_assignments = target_node["data"].get("assignments", [])
    print(f"\n📋 Старые assignments ({len(old_assignments)} шт.):")
    for a in old_assignments:
        print(f"   - [{a['id']}] mode={a['mode']}, variable={a.get('variable', '?')}")

    # Заменяем assignments
    target_node["data"]["assignments"] = NEW_ASSIGNMENTS

    print(f"\n📋 Новые assignments ({len(NEW_ASSIGNMENTS)} шт.):")
    for a in NEW_ASSIGNMENTS:
        print(f"   - [{a['id']}] mode={a['mode']}, variable={a.get('variable', '?')}")

    # Сохраняем файл
    with open(abs_path, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Файл сохранён: {abs_path}")

    # Выводим итоговый узел для проверки
    print("\n🔍 Итоговый узел all-merge-format:")
    print(json.dumps(target_node["data"]["assignments"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
