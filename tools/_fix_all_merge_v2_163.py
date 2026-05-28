"""
@fileoverview Фикс all-merge-format: сохраняем массивы до форматирования.

Проблема: json_format перезаписывает bot_compare_results и compare_results
строкой (отформатированным текстом). К моменту all-merge-format массивы
уже уничтожены → array_concat получает 0 + 0 = 0 элементов.

Решение: в bot-setv-format и setv-compare-best добавить шаг сохранения
массива в отдельную переменную ДО json_format.
- bot_compare_results → bot_compare_results_arr (копия массива)
- compare_results → compare_results_arr (копия массива)
Затем all-merge-format использует *_arr переменные для concat.
"""

import json
import os

PROJECT_PATH = os.path.join(
    os.path.dirname(__file__), "..",
    "bots", "новый_бот_1_242_163", "project.json"
)


def main():
    abs_path = os.path.abspath(PROJECT_PATH)
    print(f"📂 Загружаю: {abs_path}")

    with open(abs_path, "r", encoding="utf-8") as f:
        project = json.load(f)

    nodes = {}
    for sheet in project.get("sheets", []):
        for node in sheet.get("nodes", []):
            nodes[node["id"]] = node

    # ═══════════════════════════════════════════════════════════════
    # Fix 1: bot-setv-format — сохраняем массив перед json_format
    # ═══════════════════════════════════════════════════════════════
    node = nodes["bot-setv-format"]
    old = node["data"]["assignments"]
    print(f"\n🔧 bot-setv-format: было {len(old)} assignments")

    # Вставляем сохранение массива ПЕРЕД json_format
    node["data"]["assignments"] = [
        {
            "id": "save_arr",
            "mode": "text",
            "value": "{bot_compare_results}",
            "variable": "bot_compare_results_arr"
        },
        *old  # оставляем оригинальные (json_format + save_text + reset)
    ]
    print(f"   стало {len(node['data']['assignments'])} assignments")
    print("   + save_arr: bot_compare_results → bot_compare_results_arr")

    # ═══════════════════════════════════════════════════════════════
    # Fix 2: setv-compare-best — сохраняем массив перед json_format
    # ═══════════════════════════════════════════════════════════════
    node = nodes["setv-compare-best"]
    old = node["data"]["assignments"]
    print(f"\n🔧 setv-compare-best: было {len(old)} assignments")

    node["data"]["assignments"] = [
        {
            "id": "save_arr",
            "mode": "text",
            "value": "{compare_results}",
            "variable": "compare_results_arr"
        },
        *old
    ]
    print(f"   стало {len(node['data']['assignments'])} assignments")
    print("   + save_arr: compare_results → compare_results_arr")

    # ═══════════════════════════════════════════════════════════════
    # Fix 3: all-merge-format — использовать *_arr переменные
    # ═══════════════════════════════════════════════════════════════
    node = nodes["all-merge-format"]
    print(f"\n🔧 all-merge-format: обновляю array_concat")

    node["data"]["assignments"] = [
        {
            "id": "merge_arrays",
            "mode": "array_concat",
            "value": "{bot_compare_results_arr}",
            "concatWith": "{compare_results_arr}",
            "variable": "all_compare_results"
        },
        {
            "id": "format_all",
            "mode": "json_format",
            "value": "🔸 <a href=\"{item.url}\">{item.name}</a>: <b>{item.rate} BTC</b> ({item.raw_rate} ₽)\n",
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
    print("   array_concat: {bot_compare_results_arr} + {compare_results_arr}")

    # Сохраняем
    with open(abs_path, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Сохранено: {abs_path}")
    print("\n✅ Готово! Теперь массивы сохраняются до json_format")


if __name__ == "__main__":
    main()
