"""
@fileoverview Объединяет результаты ботов и сайтов в один общий список,
отсортированный по выгодности, для режима "Сравнить всё".

Изменения:
1. В bot-setv-calc — добавляет "type": "🤖" во все json_push assignments
2. В setv-compare-extract — добавляет "type": "🌐" в json_push для сайтов
3. В all-merge-format — заменяет конкатенацию текстов на:
   - expression: объединение массивов bot_compare_results + compare_results
   - json_format: единая сортировка по rate с маркером типа
   - text: сохранение результата в bot_rates_text
4. В bot-setv-format — обновляет шаблон, добавляя {item.type}

Скрипт идемпотентный — безопасно запускать повторно.
"""

import json
from pathlib import Path

PROJECT_PATH = Path(
    r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"
)


def find_node(sheets, node_id):
    """
    Ищет ноду по ID во всех листах
    @param sheets - список листов проекта
    @param node_id - ID искомой ноды
    @returns кортеж (sheet, node) или (None, None)
    """
    for sheet in sheets:
        for node in sheet.get("nodes", []):
            if node["id"] == node_id:
                return sheet, node
    return None, None


def add_type_to_bot_pushes(node_calc):
    """
    Добавляет "type": "🤖" во все json_push assignments ноды bot-setv-calc.
    Идемпотентно — если type уже есть, пропускает.
    @param node_calc - нода bot-setv-calc
    @returns количество обновлённых assignments
    """
    assignments = node_calc["data"]["assignments"]
    updated = 0

    for assignment in assignments:
        if assignment.get("mode") != "json_push":
            continue
        if assignment.get("variable") != "bot_compare_results":
            continue

        value_str = assignment["value"]
        # Парсим JSON value
        try:
            value_obj = json.loads(value_str)
        except json.JSONDecodeError:
            print(f"    ⚠️ Не удалось распарсить value в {assignment['id']}")
            continue

        # Добавляем type если его нет
        if "type" not in value_obj:
            value_obj["type"] = "🤖"
            assignment["value"] = json.dumps(value_obj, ensure_ascii=False)
            updated += 1

    return updated


def add_type_to_site_push(node_extract):
    """
    Добавляет "type": "🌐" в json_push assignment ноды setv-compare-extract.
    Идемпотентно — если type уже есть, пропускает.
    @param node_extract - нода setv-compare-extract
    @returns True если обновлено
    """
    assignments = node_extract["data"]["assignments"]

    for assignment in assignments:
        if assignment.get("mode") != "json_push":
            continue

        value_str = assignment["value"]

        # Этот value содержит выражения вида ={{...}}, поэтому не парсится как JSON напрямую.
        # Добавляем type вручную в строку JSON перед закрывающей }
        if '"type"' in value_str:
            return False  # Уже есть

        # Вставляем перед последней закрывающей }
        last_brace = value_str.rfind("}")
        if last_brace == -1:
            print("    ⚠️ Не найдена закрывающая } в value setv-compare-extract")
            return False

        # Находим предпоследнюю } (JSON внутри строки имеет вложенные {})
        # Формат: {"name": "...", "url": "...", "rate": "=...", "raw_rate": "=..."}
        # Нужно вставить перед самой последней }
        new_value = value_str[:last_brace] + ', "type": "🌐"' + value_str[last_brace:]
        assignment["value"] = new_value
        return True

    return False


def update_all_merge_format(node_merge):
    """
    Заменяет assignments в all-merge-format на объединение массивов + json_format.
    Идемпотентно — проверяет наличие merge_expr.
    @param node_merge - нода all-merge-format
    @returns True если обновлено
    """
    assignments = node_merge["data"]["assignments"]

    # Проверяем идемпотентность
    if any(a.get("id") == "merge_expr" for a in assignments):
        return False

    # Новые assignments
    new_assignments = [
        {
            "id": "merge_expr",
            "mode": "expression",
            "value": "{bot_compare_results} + {compare_results}",
            "variable": "all_results"
        },
        {
            "id": "fmt_all",
            "mode": "json_format",
            "value": "🔸 {item.type} <a href=\"{item.url}\">{item.name}</a>: <b>{item.rate} BTC</b> ({item.raw_rate} ₽)\n",
            "variable": "all_results",
            "lookupField": "rate"
        },
        {
            "id": "save_all",
            "mode": "text",
            "value": "{all_results}",
            "variable": "bot_rates_text"
        }
    ]

    node_merge["data"]["assignments"] = new_assignments
    return True


def update_bot_setv_format(node_format):
    """
    Обновляет шаблон json_format в bot-setv-format, добавляя {item.type}.
    Идемпотентно — если {item.type} уже есть, пропускает.
    @param node_format - нода bot-setv-format
    @returns True если обновлено
    """
    assignments = node_format["data"]["assignments"]

    for assignment in assignments:
        if assignment.get("id") != "fmt_bots":
            continue
        if assignment.get("mode") != "json_format":
            continue

        if "{item.type}" in assignment["value"]:
            return False  # Уже обновлено

        # Новый шаблон с {item.type}
        assignment["value"] = (
            "🔸 {item.type} <a href=\"{item.url}\">{item.name}</a>: "
            "<b>{item.rate} BTC</b> ({item.raw_rate} ₽)\n"
        )
        return True

    return False


def main():
    """
    Основная функция: читает project.json, вносит изменения, сохраняет.
    """
    print(f"📂 Читаю {PROJECT_PATH}...")
    data = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))
    sheets = data["sheets"]

    # === Шаг 1: Добавить "type": "🤖" в bot-setv-calc ===
    _, node_calc = find_node(sheets, "bot-setv-calc")
    if not node_calc:
        raise RuntimeError("Нода bot-setv-calc не найдена!")

    count = add_type_to_bot_pushes(node_calc)
    if count > 0:
        print(f"  ✅ Добавлен type='🤖' в {count} json_push (боты)")
    else:
        print("  ⏭️  type='🤖' уже присутствует в json_push (боты)")

    # === Шаг 2: Добавить "type": "🌐" в setv-compare-extract ===
    _, node_extract = find_node(sheets, "setv-compare-extract")
    if not node_extract:
        raise RuntimeError("Нода setv-compare-extract не найдена!")

    if add_type_to_site_push(node_extract):
        print("  ✅ Добавлен type='🌐' в json_push (сайты)")
    else:
        print("  ⏭️  type='🌐' уже присутствует в json_push (сайты)")

    # === Шаг 3: Переделать all-merge-format ===
    _, node_merge = find_node(sheets, "all-merge-format")
    if not node_merge:
        raise RuntimeError("Нода all-merge-format не найдена!")

    if update_all_merge_format(node_merge):
        print("  ✅ all-merge-format переделан: expression merge + json_format + save")
    else:
        print("  ⏭️  all-merge-format уже обновлён")

    # === Шаг 4: Обновить bot-setv-format ===
    _, node_format = find_node(sheets, "bot-setv-format")
    if not node_format:
        raise RuntimeError("Нода bot-setv-format не найдена!")

    if update_bot_setv_format(node_format):
        print("  ✅ bot-setv-format: шаблон обновлён с {item.type}")
    else:
        print("  ⏭️  bot-setv-format: шаблон уже содержит {item.type}")

    # === Сохранение ===
    output = json.dumps(data, ensure_ascii=False, indent=2)
    PROJECT_PATH.write_text(output, encoding="utf-8")
    print(f"\n💾 Сохранено: {PROJECT_PATH}")
    print(f"   Размер: {len(output):,} байт")

    # === Валидация ===
    try:
        json.loads(PROJECT_PATH.read_text(encoding="utf-8"))
        print("   ✅ JSON валидный")
    except json.JSONDecodeError as e:
        print(f"   ❌ JSON невалидный: {e}")
        raise

    # === Итог ===
    print("\n📋 Итог изменений:")
    print("   • bot-setv-calc: все json_push теперь содержат type='🤖'")
    print("   • setv-compare-extract: json_push содержит type='🌐'")
    print("   • all-merge-format: объединяет массивы → сортирует → форматирует")
    print("   • bot-setv-format: шаблон включает маркер типа")
    print("\n   Результат: один общий список, отсортированный по выгодности,")
    print("   с маркерами 🤖/🌐 для каждого источника.")


if __name__ == "__main__":
    main()
