"""
@fileoverview Реализует "Сравнить всё" — объединённое сравнение ботов + сайтов.

Добавляет ноды для маршрутизации по compare_mode:
- all-set-mode (set_variable: compare_mode = "all") → bot-msg-menu
- bots-set-mode (set_variable: compare_mode = "bots") → bot-msg-menu
- bot-cond-after-bots (condition): all → setv-compare-init, else → bot-delete-loading
- cond-after-sites (condition): all → all-merge-format, else → msg-compare-result
- all-merge-format (set_variable): форматирует сайты и объединяет с ботами

Перенаправляет кнопки хаба:
- btn-hub-all → all-set-mode
- btn-hub-bots → bots-set-mode

Изменяет переходы:
- bot-setv-format: autoTransitionTo → bot-cond-after-bots (вместо bot-delete-loading)
- setv-compare-best: autoTransitionTo → cond-after-sites (вместо msg-compare-result)

Скрипт идемпотентный — повторный запуск не дублирует ноды.
"""

import json
from pathlib import Path

PROJECT_PATH = Path(
    r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"
)

# === ID нод и листов ===
SHEET_BOTS_ID = "sheet-bots"
SHEET_COMPARE_ID = "sheet-compare-rates"

# Новые ноды
ALL_SET_MODE_ID = "all-set-mode"
BOTS_SET_MODE_ID = "bots-set-mode"
COND_AFTER_BOTS_ID = "bot-cond-after-bots"
COND_AFTER_SITES_ID = "cond-after-sites"
ALL_MERGE_FORMAT_ID = "all-merge-format"

# Существующие ноды для модификации
BOT_SETV_FORMAT_ID = "bot-setv-format"
SETV_COMPARE_BEST_ID = "setv-compare-best"
KB_COMPARE_HUB_ID = "kb-compare-hub"


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


def find_sheet(sheets, sheet_id):
    """
    Ищет лист по ID
    @param sheets - список листов проекта
    @param sheet_id - ID искомого листа
    @returns лист или None
    """
    for sheet in sheets:
        if sheet.get("id") == sheet_id:
            return sheet
    return None


def build_all_set_mode_node():
    """
    Создаёт ноду set_variable: compare_mode = "all", переход → bot-msg-menu
    @returns dict с нодой all-set-mode
    """
    return {
        "id": ALL_SET_MODE_ID,
        "type": "set_variable",
        "position": {"x": 6500, "y": 1500},
        "data": {
            "buttons": [],
            "markdown": False,
            "adminOnly": False,
            "showInMenu": False,
            "assignments": [
                {
                    "id": "sm1",
                    "mode": "text",
                    "value": "all",
                    "variable": "compare_mode",
                }
            ],
            "messageText": "",
            "keyboardType": "none",
            "requiresAuth": False,
            "isPrivateOnly": False,
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "autoTransitionTo": "bot-msg-menu",
            "enableStatistics": False,
            "enableAutoTransition": True,
        },
    }


def build_bots_set_mode_node():
    """
    Создаёт ноду set_variable: compare_mode = "bots", переход → bot-msg-menu
    @returns dict с нодой bots-set-mode
    """
    return {
        "id": BOTS_SET_MODE_ID,
        "type": "set_variable",
        "position": {"x": 6500, "y": 1700},
        "data": {
            "buttons": [],
            "markdown": False,
            "adminOnly": False,
            "showInMenu": False,
            "assignments": [
                {
                    "id": "sm2",
                    "mode": "text",
                    "value": "bots",
                    "variable": "compare_mode",
                }
            ],
            "messageText": "",
            "keyboardType": "none",
            "requiresAuth": False,
            "isPrivateOnly": False,
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "autoTransitionTo": "bot-msg-menu",
            "enableStatistics": False,
            "enableAutoTransition": True,
        },
    }


def build_cond_after_bots_node():
    """
    Создаёт condition ноду: если compare_mode == "all" → setv-compare-init, иначе → bot-delete-loading
    @returns dict с нодой bot-cond-after-bots
    """
    return {
        "id": COND_AFTER_BOTS_ID,
        "type": "condition",
        "position": {"x": 6200, "y": 3100},
        "data": {
            "buttons": [],
            "branches": [
                {
                    "id": "br_all",
                    "value": "all",
                    "target": "setv-compare-init",
                    "operator": "equals",
                },
                {
                    "id": "br_else",
                    "value": "",
                    "target": "bot-delete-loading",
                    "operator": "else",
                },
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
            "enableStatistics": False,
        },
    }


def build_cond_after_sites_node():
    """
    Создаёт condition ноду: если compare_mode == "all" → all-merge-format, иначе → msg-compare-result
    @returns dict с нодой cond-after-sites
    """
    return {
        "id": COND_AFTER_SITES_ID,
        "type": "condition",
        "position": {"x": 900, "y": 500},
        "data": {
            "buttons": [],
            "branches": [
                {
                    "id": "cas_all",
                    "value": "all",
                    "target": ALL_MERGE_FORMAT_ID,
                    "operator": "equals",
                },
                {
                    "id": "cas_else",
                    "value": "",
                    "target": "msg-compare-result",
                    "operator": "else",
                },
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
            "enableStatistics": False,
        },
    }


def build_all_merge_format_node():
    """
    Создаёт ноду set_variable для объединения результатов ботов и сайтов.
    Форматирует compare_results (сайты) и объединяет с bot_rates_text (боты).
    @returns dict с нодой all-merge-format
    """
    return {
        "id": ALL_MERGE_FORMAT_ID,
        "type": "set_variable",
        "position": {"x": 900, "y": 700},
        "data": {
            "buttons": [],
            "markdown": False,
            "adminOnly": False,
            "showInMenu": False,
            "assignments": [
                {
                    "id": "fmt_sites",
                    "mode": "json_format",
                    "value": (
                        "🔸 <a href=\"{item.url}\">{item.name}</a>: "
                        "<b>{item.rate} BTC</b> ({item.raw_rate} ₽)\n"
                    ),
                    "variable": "compare_results",
                    "lookupField": "rate",
                },
                {
                    "id": "save_sites",
                    "mode": "text",
                    "value": "{compare_results}",
                    "variable": "sites_rates_text",
                },
                {
                    "id": "merge_all",
                    "mode": "text",
                    "value": (
                        "🤖 <b>Боты:</b>\n{bot_rates_text}\n\n"
                        "📋 <b>Сайты:</b>\n{sites_rates_text}"
                    ),
                    "variable": "bot_rates_text",
                },
            ],
            "messageText": "",
            "keyboardType": "none",
            "requiresAuth": False,
            "isPrivateOnly": False,
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "autoTransitionTo": "bot-delete-loading",
            "enableStatistics": False,
            "enableAutoTransition": True,
        },
    }


def add_node_if_missing(sheet, node_builder, node_id):
    """
    Добавляет ноду на лист если её ещё нет
    @param sheet - лист куда добавлять
    @param node_builder - функция-конструктор ноды
    @param node_id - ID ноды для проверки
    @returns True если нода добавлена
    """
    for node in sheet.get("nodes", []):
        if node["id"] == node_id:
            print(f"  ⏭️  Нода '{node_id}' уже существует — пропускаю")
            return False
    sheet["nodes"].append(node_builder())
    print(f"  ✅ Добавлена нода '{node_id}'")
    return True


def redirect_hub_buttons(sheets):
    """
    Перенаправляет кнопки хаба: btn-hub-all → all-set-mode, btn-hub-bots → bots-set-mode
    @param sheets - список листов проекта
    @returns количество изменённых кнопок
    """
    redirects = {
        "btn-hub-all": ALL_SET_MODE_ID,
        "btn-hub-bots": BOTS_SET_MODE_ID,
    }
    count = 0
    _, kb_node = find_node(sheets, KB_COMPARE_HUB_ID)
    if not kb_node:
        print(f"  ⚠️  Клавиатура '{KB_COMPARE_HUB_ID}' не найдена!")
        return 0

    for btn in kb_node["data"].get("buttons", []):
        btn_id = btn.get("id", "")
        if btn_id in redirects:
            new_target = redirects[btn_id]
            old_target = btn.get("target", "")
            if old_target != new_target:
                btn["target"] = new_target
                count += 1
                print(f"  ✅ Кнопка '{btn_id}': {old_target} → {new_target}")
            else:
                print(f"  ⏭️  Кнопка '{btn_id}' уже указывает на {new_target}")
    return count


def update_auto_transition(sheets, node_id, new_target):
    """
    Обновляет autoTransitionTo у ноды
    @param sheets - список листов проекта
    @param node_id - ID ноды
    @param new_target - новый target для autoTransitionTo
    @returns True если обновлено
    """
    _, node = find_node(sheets, node_id)
    if not node:
        print(f"  ⚠️  Нода '{node_id}' не найдена!")
        return False
    old_target = node["data"].get("autoTransitionTo", "")
    if old_target == new_target:
        print(f"  ⏭️  {node_id}: autoTransitionTo уже = '{new_target}'")
        return False
    node["data"]["autoTransitionTo"] = new_target
    print(f"  ✅ {node_id}: autoTransitionTo '{old_target}' → '{new_target}'")
    return True


def main():
    """
    Основная функция: добавляет "Сравнить всё" в project.json
    """
    print(f"📂 Читаю {PROJECT_PATH}...")
    data = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))
    sheets = data["sheets"]

    # === 1. Находим нужные листы ===
    sheet_bots = find_sheet(sheets, SHEET_BOTS_ID)
    if not sheet_bots:
        raise RuntimeError(f"Лист '{SHEET_BOTS_ID}' не найден!")
    print(f"  📋 Лист '{SHEET_BOTS_ID}' найден")

    sheet_compare = find_sheet(sheets, SHEET_COMPARE_ID)
    if not sheet_compare:
        raise RuntimeError(f"Лист '{SHEET_COMPARE_ID}' не найден!")
    print(f"  📋 Лист '{SHEET_COMPARE_ID}' найден")

    # === 2. Добавляем новые ноды на sheet-bots ===
    print("\n🔧 Добавление нод на sheet-bots...")
    add_node_if_missing(sheet_bots, build_all_set_mode_node, ALL_SET_MODE_ID)
    add_node_if_missing(sheet_bots, build_bots_set_mode_node, BOTS_SET_MODE_ID)
    add_node_if_missing(sheet_bots, build_cond_after_bots_node, COND_AFTER_BOTS_ID)

    # === 3. Добавляем новые ноды на sheet-compare-rates ===
    print("\n🔧 Добавление нод на sheet-compare-rates...")
    add_node_if_missing(sheet_compare, build_cond_after_sites_node, COND_AFTER_SITES_ID)
    add_node_if_missing(sheet_compare, build_all_merge_format_node, ALL_MERGE_FORMAT_ID)

    # === 4. Перенаправляем кнопки хаба ===
    print("\n🔀 Перенаправление кнопок хаба...")
    redirect_hub_buttons(sheets)

    # === 5. Изменяем переходы существующих нод ===
    print("\n🔗 Обновление переходов...")

    # bot-setv-format: bot-delete-loading → bot-cond-after-bots
    update_auto_transition(sheets, BOT_SETV_FORMAT_ID, COND_AFTER_BOTS_ID)

    # setv-compare-best: msg-compare-result → cond-after-sites
    update_auto_transition(sheets, SETV_COMPARE_BEST_ID, COND_AFTER_SITES_ID)

    # === 6. Сохраняем ===
    print("\n💾 Сохранение...")
    output = json.dumps(data, ensure_ascii=False, indent=2)
    PROJECT_PATH.write_text(output, encoding="utf-8")
    print(f"   Файл: {PROJECT_PATH}")
    print(f"   Размер: {len(output):,} байт")

    # === 7. Валидация JSON ===
    try:
        json.loads(PROJECT_PATH.read_text(encoding="utf-8"))
        print("   ✅ JSON валидный")
    except json.JSONDecodeError as e:
        print(f"   ❌ JSON невалидный: {e}")
        raise

    # === 8. Проверка целостности ===
    print("\n🔍 Проверка целостности...")
    verify_data = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))
    verify_sheets = verify_data["sheets"]

    # Проверяем что все новые ноды на месте
    expected_nodes = [
        ALL_SET_MODE_ID,
        BOTS_SET_MODE_ID,
        COND_AFTER_BOTS_ID,
        COND_AFTER_SITES_ID,
        ALL_MERGE_FORMAT_ID,
    ]
    for nid in expected_nodes:
        _, node = find_node(verify_sheets, nid)
        if node:
            print(f"   ✅ {nid} — на месте")
        else:
            print(f"   ❌ {nid} — НЕ НАЙДЕНА!")

    # Проверяем переходы
    _, fmt_node = find_node(verify_sheets, BOT_SETV_FORMAT_ID)
    if fmt_node and fmt_node["data"]["autoTransitionTo"] == COND_AFTER_BOTS_ID:
        print(f"   ✅ {BOT_SETV_FORMAT_ID} → {COND_AFTER_BOTS_ID}")
    else:
        print(f"   ❌ {BOT_SETV_FORMAT_ID} переход некорректен!")

    _, best_node = find_node(verify_sheets, SETV_COMPARE_BEST_ID)
    if best_node and best_node["data"]["autoTransitionTo"] == COND_AFTER_SITES_ID:
        print(f"   ✅ {SETV_COMPARE_BEST_ID} → {COND_AFTER_SITES_ID}")
    else:
        print(f"   ❌ {SETV_COMPARE_BEST_ID} переход некорректен!")

    # Проверяем кнопки
    _, kb = find_node(verify_sheets, KB_COMPARE_HUB_ID)
    if kb:
        for btn in kb["data"]["buttons"]:
            if btn["id"] == "btn-hub-all" and btn["target"] == ALL_SET_MODE_ID:
                print(f"   ✅ btn-hub-all → {ALL_SET_MODE_ID}")
            elif btn["id"] == "btn-hub-bots" and btn["target"] == BOTS_SET_MODE_ID:
                print(f"   ✅ btn-hub-bots → {BOTS_SET_MODE_ID}")

    print("\n🎉 Готово! 'Сравнить всё' реализовано.")
    print("\n📋 Итоговая цепочка для mode='all':")
    print("   btn-hub-all → all-set-mode (mode=all) → bot-msg-menu")
    print("   → [выбор пары] → [ввод суммы] → [цепочка ботов]")
    print("   → bot-setv-format → bot-cond-after-bots (mode==all)")
    print("   → setv-compare-init → [цепочка сайтов]")
    print("   → setv-compare-best → cond-after-sites (mode==all)")
    print("   → all-merge-format → bot-delete-loading → bot-msg-result")


if __name__ == "__main__":
    main()
