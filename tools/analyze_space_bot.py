"""
@fileoverview Анализатор project.json космического бота.
Выводит статистику по листам, нодам, типам, связям.
@module tools/analyze_space_bot
"""

import json
import sys
from pathlib import Path
from collections import Counter

PROJECT_PATH = Path(__file__).parent.parent / "bots" / "игровой_бот_космос_254_164" / "project.json"


def main():
    """
    Анализирует project.json и выводит подробную статистику.
    """
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    sheets = data.get("sheets", [])
    print(f"{'='*60}")
    print(f"📊 Анализ: {PROJECT_PATH.name}")
    print(f"{'='*60}")
    print(f"\n📁 Листов: {len(sheets)}")

    total_nodes = 0
    all_nodes = []
    type_counter = Counter()
    tables_used = Counter()
    transitions = []

    for sheet in sheets:
        nodes = sheet.get("nodes", [])
        total_nodes += len(nodes)
        print(f"\n  📄 {sheet['name']} — {len(nodes)} нод")

        for n in nodes:
            all_nodes.append(n)
            ntype = n.get("type", "unknown")
            type_counter[ntype] += 1

            d = n.get("data", {})
            # Таблицы
            if d.get("tableName"):
                tables_used[d["tableName"]] += 1

            # Переходы
            if d.get("autoTransitionTo"):
                transitions.append((n["id"], d["autoTransitionTo"]))

            # Ветки условий
            for br in d.get("branches", []):
                if br.get("target"):
                    transitions.append((n["id"], br["target"]))

            # Кнопки с goto
            for b in d.get("buttons", []):
                if b.get("action") == "goto" and b.get("target"):
                    transitions.append((n["id"], b["target"]))

    print(f"\n{'='*60}")
    print(f"📊 Итого нод: {total_nodes}")
    print(f"🔗 Связей (переходов): {len(transitions)}")

    print(f"\n📋 Типы нод:")
    for ntype, count in type_counter.most_common():
        print(f"  {ntype}: {count}")

    print(f"\n🗄️ Таблицы (обращений):")
    for tbl, count in tables_used.most_common():
        print(f"  {tbl}: {count}")

    # Проверка битых ссылок
    all_ids = {n["id"] for n in all_nodes}
    broken = []
    for src, dst in transitions:
        if dst and dst not in all_ids:
            broken.append((src, dst))

    if broken:
        print(f"\n⚠️ Битые ссылки ({len(broken)}):")
        for src, dst in broken[:20]:
            print(f"  {src} → {dst}")
        if len(broken) > 20:
            print(f"  ... и ещё {len(broken) - 20}")
    else:
        print(f"\n✅ Битых ссылок нет")

    # Ноды без входящих (кроме триггеров и команд)
    targets_set = {dst for _, dst in transitions}
    trigger_types = {"command_trigger", "text_trigger", "callback_trigger"}
    orphans = []
    for n in all_nodes:
        if n["type"] not in trigger_types and n["id"] not in targets_set:
            orphans.append(n["id"])

    if orphans:
        print(f"\n🔍 Ноды без входящих ({len(orphans)}):")
        for oid in orphans[:15]:
            print(f"  {oid}")
        if len(orphans) > 15:
            print(f"  ... и ещё {len(orphans) - 15}")

    # Фазы реализации — какие есть
    print(f"\n{'='*60}")
    print(f"🎯 Реализованные фичи (по триггерам):")
    for n in all_nodes:
        if n["type"] in trigger_types:
            d = n.get("data", {})
            label = d.get("command", "") or ", ".join(d.get("textSynonyms", [])) or d.get("callbackPattern", "") or n["id"]
            print(f"  [{n['type']}] {label}")

    # Callback triggers
    callbacks = [n for n in all_nodes if n["type"] == "callback_trigger"]
    if callbacks:
        print(f"\n📲 Callback триггеры ({len(callbacks)}):")
        for cb in callbacks[:30]:
            d = cb.get("data", {})
            pat = d.get("callbackPattern", d.get("callbackData", "?"))
            print(f"  {cb['id']}: {pat}")
        if len(callbacks) > 30:
            print(f"  ... и ещё {len(callbacks) - 30}")


if __name__ == "__main__":
    main()
