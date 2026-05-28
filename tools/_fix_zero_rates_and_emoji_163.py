"""
Скрипт для модификации project.json бота 163:
1. Добавление skipIfEmpty к json_push assignments в bot-setv-calc (фильтрация нулевых курсов)
2. Добавление type: "🌐" в httpRequestBatchResultFields для сайтов (fetch-compare-rate)
3. Обновление шаблона all-merge-format с использованием {item.type}
"""

import json
import os

PROJECT_PATH = os.path.join(
    os.path.dirname(__file__), "..",
    "bots", "новый_бот_1_242_163", "project.json"
)

# Маппинг push_id -> skipIfEmpty переменная
SKIP_IF_EMPTY_MAP = {
    "push_scooby": "scooby_btc",
    "push_capitalist": "capitalist_btc",
    "push_crypto24": "crypto24_btc",
    "push_shaxta": "shaxta_btc",
    "push_bitmixer": "bitmixer_btc",
    "push_litebit": "litebit_btc",
    "push_sanchez": "sanchez_btc",
    "push_imperia": "imperia_btc",
    "push_cf": "cf_btc",
    "push_vortex": "vortex_btc",
    "push_crazy": "crazy_btc",
    "push_inf": "inf_btc",
    "push_lucky": "lucky_btc",
    "push_love": "love_btc",
    "push_casper": "casper_btc",
    "push_monopoly": "monopoly_btc",
}

# Новый шаблон для all-merge-format (с {item.type})
NEW_ALL_MERGE_TEMPLATE = '{item.type} <a href="{item.url}">{item.name}</a>: <b>{item.rate} BTC</b> ({item.raw_rate} ₽)\n'


def find_node(sheets, node_id):
    """Найти ноду по id во всех sheets"""
    for sheet in sheets:
        for node in sheet.get("nodes", []):
            if node.get("id") == node_id:
                return node
    return None


def task1_add_skip_if_empty(data):
    """Задача 1: Добавить skipIfEmpty к json_push в bot-setv-calc"""
    node = find_node(data["sheets"], "bot-setv-calc")
    if not node:
        print("❌ Узел bot-setv-calc не найден!")
        return 0

    assignments = node["data"].get("assignments", [])
    count = 0

    for assignment in assignments:
        if assignment.get("mode") == "json_push" and assignment.get("id") in SKIP_IF_EMPTY_MAP:
            var_name = SKIP_IF_EMPTY_MAP[assignment["id"]]
            if assignment.get("skipIfEmpty") == var_name:
                print(f"  ⏭️  {assignment['id']} — уже имеет skipIfEmpty: {var_name}")
            else:
                assignment["skipIfEmpty"] = var_name
                count += 1
                print(f"  ✅ {assignment['id']} → skipIfEmpty: \"{var_name}\"")

    return count


def task2_add_type_to_sites(data):
    """Задача 2a: Добавить type: '🌐' в httpRequestBatchResultFields для fetch-compare-rate"""
    node = find_node(data["sheets"], "fetch-compare-rate")
    if not node:
        print("❌ Узел fetch-compare-rate не найден!")
        return False

    fields = node["data"].get("httpRequestBatchResultFields", [])

    # Проверяем есть ли уже поле type
    has_type = any(f.get("key") == "type" for f in fields)
    if has_type:
        print("  ⏭️  fetch-compare-rate уже содержит поле type")
        return False

    # Добавляем поле type: "🌐"
    fields.append({
        "key": "type",
        "value": "🌐"
    })
    print("  ✅ Добавлено поле type: \"🌐\" в httpRequestBatchResultFields")
    return True


def task2_update_all_merge_template(data):
    """Задача 2b: Обновить шаблон в all-merge-format с {item.type}"""
    node = find_node(data["sheets"], "all-merge-format")
    if not node:
        print("❌ Узел all-merge-format не найден!")
        return False

    assignments = node["data"].get("assignments", [])
    for assignment in assignments:
        if assignment.get("id") == "format_all" and assignment.get("mode") == "json_format":
            old_value = assignment.get("value", "")
            if assignment["value"] == NEW_ALL_MERGE_TEMPLATE:
                print(f"  ⏭️  format_all — шаблон уже обновлён")
                return False
            assignment["value"] = NEW_ALL_MERGE_TEMPLATE
            print(f"  ✅ format_all шаблон обновлён:")
            print(f"     Было: {old_value}")
            print(f"     Стало: {NEW_ALL_MERGE_TEMPLATE}")
            return True

    print("❌ Assignment format_all не найден в all-merge-format!")
    return False


def main():
    abs_path = os.path.abspath(PROJECT_PATH)
    print(f"📂 Загрузка: {abs_path}")

    with open(abs_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"\n{'='*60}")
    print("📋 Задача 1: Добавление skipIfEmpty к json_push в bot-setv-calc")
    print(f"{'='*60}")
    skip_count = task1_add_skip_if_empty(data)
    print(f"\n  Итого добавлено skipIfEmpty: {skip_count}")

    print(f"\n{'='*60}")
    print("📋 Задача 2a: Добавление type: '🌐' в fetch-compare-rate")
    print(f"{'='*60}")
    sites_changed = task2_add_type_to_sites(data)

    print(f"\n{'='*60}")
    print("📋 Задача 2b: Обновление шаблона all-merge-format")
    print(f"{'='*60}")
    template_changed = task2_update_all_merge_template(data)

    # Сохранение
    print(f"\n{'='*60}")
    print("💾 Сохранение...")
    print(f"{'='*60}")

    with open(abs_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Файл сохранён: {abs_path}")
    print(f"\n📊 Итого изменений:")
    print(f"   - skipIfEmpty добавлено: {skip_count}")
    print(f"   - type '🌐' для сайтов: {'добавлено' if sites_changed else 'уже было'}")
    print(f"   - Шаблон all-merge-format: {'обновлён' if template_changed else 'без изменений'}")


if __name__ == "__main__":
    main()
