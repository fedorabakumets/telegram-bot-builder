"""
Скрипт для исправления json_push assignments в ноде bot-setv-calc.

Проблемы:
1. "rate": "={xxx_btc}" → знак = остаётся в тексте, нужно "{xxx_btc}"
2. "raw_rate": "={xxx_rate}" → не форматируется, нужно "{xxx_rate_fmt}"
3. BTC Monopoly — raw_rate содержит сырое выражение, нужно вычислить заранее
4. VIRON — отключён, push_viron нужно удалить

Решение:
- Убрать "=" из rate и raw_rate (простая подстановка переменных)
- Для raw_rate использовать _fmt версии (уже отформатированные)
- Для monopoly добавить предварительные вычисления monopoly_rate и monopoly_rate_fmt
- Удалить push_viron и связанные calc_viron/fmt_viron
"""

import json
import sys
import os
import re
import copy

PROJECT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "bots", "новый_бот_1_242_163", "project.json"
)


def find_node(sheets, node_id):
    """Найти ноду по id во всех листах"""
    for sheet in sheets:
        for node in sheet.get("nodes", []):
            if node.get("id") == node_id:
                return node
    return None


def fix_json_push_values(assignments):
    """
    Исправить json_push assignments:
    - rate: "={xxx_btc}" → "{xxx_btc}"
    - raw_rate: "={xxx_rate}" → "{xxx_rate_fmt}"
    """
    fixed_count = 0
    for assignment in assignments:
        if assignment.get("mode") != "json_push":
            continue

        value_str = assignment.get("value", "")
        try:
            obj = json.loads(value_str)
        except json.JSONDecodeError:
            print(f"  [WARN] Не удалось распарсить JSON в {assignment['id']}: {value_str}")
            continue

        changed = False

        # Исправить rate: убрать "=" в начале
        if "rate" in obj and obj["rate"].startswith("="):
            old_rate = obj["rate"]
            obj["rate"] = obj["rate"][1:]  # убрать "="
            print(f"  [{assignment['id']}] rate: {old_rate} → {obj['rate']}")
            changed = True

        # Исправить raw_rate: убрать "=" и использовать _fmt версию
        if "raw_rate" in obj:
            old_raw = obj["raw_rate"]
            if old_raw.startswith("="):
                # Убираем "="
                raw_no_eq = old_raw[1:]

                # Если это простая подстановка переменной типа {xxx_rate}
                match = re.match(r'^\{(\w+)_rate\}$', raw_no_eq)
                if match:
                    prefix = match.group(1)
                    obj["raw_rate"] = "{" + prefix + "_rate_fmt}"
                    print(f"  [{assignment['id']}] raw_rate: {old_raw} → {obj['raw_rate']}")
                    changed = True
                else:
                    # Сложное выражение (как у monopoly) — будет обработано отдельно
                    pass

        if changed:
            assignment["value"] = json.dumps(obj, ensure_ascii=False)
            fixed_count += 1

    return fixed_count


def fix_monopoly(assignments):
    """
    Для BTC Monopoly:
    - Добавить calc_monopoly_rate и fmt_monopoly_rate ПЕРЕД push_monopoly
    - Исправить push_monopoly raw_rate
    """
    # Найти индекс push_monopoly
    push_idx = None
    for i, a in enumerate(assignments):
        if a.get("id") == "push_monopoly":
            push_idx = i
            break

    if push_idx is None:
        print("  [WARN] push_monopoly не найден")
        return False

    # Добавить вычисления перед push_monopoly
    calc_monopoly = {
        "id": "calc_monopoly_rate",
        "mode": "expression",
        "value": "int(float({user_amount}) / float({monopoly_btc})) if float({monopoly_btc}) > 0 else 0",
        "variable": "monopoly_rate"
    }
    fmt_monopoly = {
        "id": "fmt_monopoly_rate",
        "mode": "format_number",
        "value": "{monopoly_rate}",
        "variable": "monopoly_rate_fmt"
    }

    # Проверить что ещё не добавлены
    existing_ids = {a["id"] for a in assignments}
    inserts = []
    if "calc_monopoly_rate" not in existing_ids:
        inserts.append(calc_monopoly)
    if "fmt_monopoly_rate" not in existing_ids:
        inserts.append(fmt_monopoly)

    if inserts:
        for i, item in enumerate(inserts):
            assignments.insert(push_idx + i, item)
            print(f"  Добавлен: {item['id']} ({item['mode']}: {item['variable']})")
        # Пересчитать индекс push_monopoly после вставок
        push_idx += len(inserts)

    # Исправить push_monopoly value
    push_assignment = assignments[push_idx]
    obj = json.loads(push_assignment["value"])

    # rate: убрать "="
    if obj.get("rate", "").startswith("="):
        obj["rate"] = obj["rate"][1:]

    # raw_rate: заменить выражение на {monopoly_rate_fmt}
    obj["raw_rate"] = "{monopoly_rate_fmt}"

    push_assignment["value"] = json.dumps(obj, ensure_ascii=False)
    print(f"  [push_monopoly] → rate: {obj['rate']}, raw_rate: {obj['raw_rate']}")

    return True


def remove_viron(assignments):
    """Удалить push_viron, calc_viron, fmt_viron"""
    viron_ids = {"push_viron", "calc_viron", "fmt_viron"}
    removed = []
    new_assignments = []
    for a in assignments:
        if a.get("id") in viron_ids:
            removed.append(a["id"])
        else:
            new_assignments.append(a)

    if removed:
        print(f"  Удалены: {', '.join(removed)}")

    return new_assignments, len(removed) > 0


def main():
    print(f"Читаю: {PROJECT_PATH}")
    if not os.path.exists(PROJECT_PATH):
        print(f"ОШИБКА: файл не найден: {PROJECT_PATH}")
        sys.exit(1)

    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        project = json.load(f)

    print("JSON загружен успешно")

    # Найти ноду bot-setv-calc
    node = find_node(project["sheets"], "bot-setv-calc")
    if not node:
        print("ОШИБКА: нода bot-setv-calc не найдена")
        sys.exit(1)

    assignments = node["data"]["assignments"]
    print(f"Найдена нода bot-setv-calc, assignments: {len(assignments)}")

    # 1. Удалить VIRON (push_viron, calc_viron, fmt_viron)
    print("\n--- Удаление VIRON ---")
    assignments, viron_removed = remove_viron(assignments)
    node["data"]["assignments"] = assignments

    # 2. Исправить monopoly (добавить calc/fmt, исправить push)
    print("\n--- Исправление BTC Monopoly ---")
    fix_monopoly(assignments)

    # 3. Исправить все остальные json_push (rate и raw_rate)
    print("\n--- Исправление json_push values ---")
    fixed = fix_json_push_values(assignments)
    print(f"  Исправлено push-записей: {fixed}")

    # Сохранить
    print("\n--- Сохранение ---")
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    # Проверить что JSON валидный
    print("Проверка JSON...")
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        json.load(f)
    print("✓ JSON валидный")

    # Показать итоговые push assignments
    print("\n--- Итоговые json_push ---")
    for a in node["data"]["assignments"]:
        if a.get("mode") == "json_push":
            print(f"  {a['id']}: {a['value']}")

    print("\n✓ Готово!")


if __name__ == "__main__":
    main()
