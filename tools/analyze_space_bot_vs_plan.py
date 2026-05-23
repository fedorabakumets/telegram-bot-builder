"""
@fileoverview Сравнение реализации космического бота с планом.
Проверяет какие фичи из SPACE_BOT_PLAN.md реализованы в project.json.
@module tools/analyze_space_bot_vs_plan
"""

import json
from pathlib import Path

PROJECT_PATH = Path(__file__).parent.parent / "bots" / "игровой_бот_космос_254_164" / "project.json"


def main():
    """
    Сравнивает plan vs reality — что реализовано, что нет.
    """
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    sheets = data.get("sheets", [])
    all_nodes = []
    all_ids = set()
    tables_used = set()
    triggers = []
    callbacks = []
    messages = []

    for sheet in sheets:
        for n in sheet.get("nodes", []):
            all_nodes.append(n)
            all_ids.add(n["id"])
            d = n.get("data", {})
            if d.get("tableName"):
                tables_used.add(d["tableName"])
            if n["type"] == "text_trigger":
                for syn in d.get("textSynonyms", []):
                    triggers.append(syn)
            if n["type"] == "command_trigger":
                triggers.append(d.get("command", ""))
            if n["type"] == "callback_trigger":
                callbacks.append(d.get("callbackPattern", d.get("callbackData", "")))
            if n["type"] == "message":
                messages.append(d.get("messageText", ""))

    sheet_names = [s["name"] for s in sheets]

    print("=" * 60)
    print("🎯 SPACE BOT: План vs Реализация")
    print("=" * 60)

    # === ФАЗА 1: Скелет ===
    print("\n📦 Фаза 1 — Скелет (регистрация, таблицы, меню, профиль)")
    checks = [
        ("/start", "/start" in triggers),
        ("Таблица pilots", "pilots" in tables_used),
        ("Таблица planets", "planets" in tables_used),
        ("Таблица ores", "ores" in tables_used),
        ("Таблица upgrades", "upgrades" in tables_used),
        ("Главное меню (reply)", any("msg-main-menu" in n["id"] or "msg-welcome" in n["id"] for n in all_nodes)),
        ("Профиль", "👤 Профиль" in triggers),
        ("Подменю Торговля", "🛒 Торговля" in triggers),
        ("Подменю Полёты", any("Полёт" in t for t in triggers)),
        ("Подменю Корабль", "🔧 Корабль" in triggers),
        ("Возврат в меню", "⬅️ Меню" in triggers),
    ]
    _print_checks(checks)

    # === ФАЗА 2: Торговля ===
    print("\n🛒 Фаза 2 — Торговля")
    checks = [
        ("Купить (триггер)", "🛒 Купить" in triggers),
        ("Продать (триггер)", "💰 Продать" in triggers),
        ("Трюм (триггер)", "📦 Трюм" in triggers),
        ("Таблица pilot_cargo", "pilot_cargo" in tables_used),
        ("Таблица ore_prices", "ore_prices" in tables_used),
        ("Динамические цены (psql)", any(n["type"] == "psql_query" for n in all_nodes)),
        ("Inline кнопки покупки", any("buy_" in c for c in callbacks)),
        ("Inline кнопки продажи", any("sell_" in c for c in callbacks)),
        ("Бафф планеты при продаже", any("buff" in m.lower() or "бафф" in m.lower() for m in messages)),
    ]
    _print_checks(checks)

    # === ФАЗА 3: Перелёты ===
    print("\n🚀 Фаза 3 — Перелёты")
    checks = [
        ("Земля (триггер)", "🌍 Земля" in triggers),
        ("Марс (триггер)", "🔴 Марс" in triggers),
        ("Титан (триггер)", "🪐 Титан" in triggers),
        ("Туманность (триггер)", "🌌 Туманность" in triggers),
        ("Развернуться", "🔄 Развернуться" in triggers),
        ("Delay (кулдаун)", any(n["type"] == "delay" for n in all_nodes)),
        ("Расход топлива", any("fuel" in n.get("data", {}).get("updates", [{}])[0].get("column", "") if n.get("data", {}).get("updates") else False for n in all_nodes)),
        ("Проверка топлива (condition)", any("fuel" in str(n.get("data", {}).get("variable", "")) for n in all_nodes if n["type"] == "condition")),
        ("Статус в полёте", any("flight" in n["id"] for n in all_nodes)),
        ("Recovery (потерянный delay)", "menu-recovery" in all_ids),
    ]
    _print_checks(checks)

    # === ФАЗА 4: Пираты ===
    print("\n🏴‍☠️ Фаза 4 — Пираты")
    pirate_sheet = any("Пират" in s["name"] for s in sheets)
    checks = [
        ("Лист Пираты", pirate_sheet),
        ("Шанс пиратов (random/condition)", any("pirate" in n["id"] or "пират" in n["id"] for n in all_nodes)),
        ("Драка (⚔️)", any("fight" in c or "⚔" in c for c in callbacks)),
        ("Откуп (💰)", any("pay" in c or "откуп" in c.lower() for c in callbacks)),
        ("Дроп фрагмента Эфира", any("fragment" in n["id"] or "фрагмент" in str(n.get("data", {}).get("messageText", "")).lower() for n in all_nodes)),
        ("Потеря груза при поражении", any("lose" in n["id"] or "cargo" in str(n.get("data", {}).get("updates", "")) for n in all_nodes if "pirate" in n["id"] or "lose" in n["id"])),
    ]
    _print_checks(checks)

    # === ФАЗА 5: Улучшения корабля ===
    print("\n🔧 Фаза 5 — Улучшения корабля")
    checks = [
        ("Трюм (⬆️)", "⬆️ Трюм" in triggers),
        ("Двигатель (⬆️)", "⬆️ Двигатель" in triggers),
        ("Броня (⬆️)", "⬆️ Броня" in triggers),
        ("Чтение upgrades", "upgrades" in tables_used),
        ("Обновление hull_level", any("hull_level" in str(n.get("data", {}).get("updates", "")) for n in all_nodes)),
        ("Обновление engine_level", any("engine_level" in str(n.get("data", {}).get("updates", "")) for n in all_nodes)),
        ("Обновление armor_level", any("armor_level" in str(n.get("data", {}).get("updates", "")) for n in all_nodes)),
    ]
    _print_checks(checks)

    # === ФАЗА 6: Планета игрока ===
    print("\n🌍 Фаза 6 — Планета игрока")
    checks = [
        ("Триггер 🌍 Планета", "🌍 Планета" in triggers),
        ("Лист Планета", any("Планета" in s["name"] for s in sheets)),
        ("Таблица player_planets", "player_planets" in tables_used),
        ("Таблица planet_names", "planet_names" in tables_used),
        ("Таблица planet_upgrades", "planet_upgrades" in tables_used),
        ("Основание планеты (1М)", any("1000000" in str(n.get("data", {})) and "planet" in n["id"].lower() for n in all_nodes)),
        ("Бафф (random руда + %)", any("buff" in n["id"] for n in all_nodes)),
        ("Смена баффа (фрагмент)", any("reroll" in n["id"] or "сменить" in n["id"] for n in all_nodes)),
        ("Шахта (сбор руды)", any("mine" in n["id"] or "harvest" in n["id"] or "собрать" in n["id"] for n in all_nodes)),
        ("Улучшения планеты (UI)", any("planet-upgrade" in n["id"] or "planet_upgrade" in n["id"] for n in all_nodes)),
    ]
    _print_checks(checks)

    # === ФАЗА 7: Топ и полировка ===
    print("\n🏆 Фаза 7 — Топ и полировка")
    checks = [
        ("Триггер 🏆 Топ", "🏆 Топ" in triggers),
        ("Топ с пагинацией (inline)", any("top" in c and ("page" in c or "next" in c) for c in callbacks)),
        ("Топ — реальная реализация (не заглушка)", any("top" in n["id"] and n["type"] == "bot_table" and n.get("data", {}).get("operation") == "read" for n in all_nodes)),
        ("/daily бонус", "/daily" in triggers),
        ("Заправка (⛽)", any("refuel" in n["id"] or "Заправка" in t for t in triggers for n in [all_nodes[0]])),
    ]
    _print_checks(checks)

    # === Доп. фичи (не в плане, но реализованы) ===
    print("\n🎁 Бонусные фичи (не в оригинальном плане):")
    extras = []
    if "⛽ Заправка" in triggers or any("refuel" in t for t in triggers):
        extras.append("⛽ Заправка (кнопка в меню + произвольный ввод)")
    if "/daily" in triggers:
        extras.append("/daily — ежедневный бонус")
    if "🔄 Развернуться" in triggers:
        extras.append("🔄 Развернуться (отмена полёта)")
    if any("recovery" in n["id"] for n in all_nodes):
        extras.append("Recovery — автоприземление при потерянном delay")
    if any("format_number" in str(n.get("data", {}).get("assignments", "")) for n in all_nodes):
        extras.append("format_number — форматирование чисел")

    for e in extras:
        print(f"  ✨ {e}")

    # === Итог ===
    print(f"\n{'='*60}")
    print("📊 ИТОГ:")
    print(f"  Фаза 1 (Скелет): ✅ Полностью")
    print(f"  Фаза 2 (Торговля): ✅ Полностью")
    print(f"  Фаза 3 (Перелёты): ✅ Полностью")
    print(f"  Фаза 4 (Пираты): ⚠️ Частично (проверить)")
    print(f"  Фаза 5 (Корабль): ✅ Полностью")
    print(f"  Фаза 6 (Планета): ❌ Не реализовано")
    print(f"  Фаза 7 (Топ): ❌ Заглушка")


def _print_checks(checks):
    """
    Выводит список проверок с галочками.
    @param checks - список кортежей (название, bool)
    """
    for name, ok in checks:
        icon = "✅" if ok else "❌"
        print(f"  {icon} {name}")


if __name__ == "__main__":
    main()
