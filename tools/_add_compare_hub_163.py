"""
@fileoverview Добавляет промежуточный экран "хаб сравнения" в project.json.

Создаёт ноду msg-compare-hub и клавиатуру kb-compare-hub на листе sheet-compare-rates.
Перенаправляет кнопки "Сравнить курс" из главного меню и раздела сайтов на хаб.
Обновляет тексты на этапах выбора суммы и загрузки для ботов/сайтов.

Скрипт идемпотентный — повторный запуск не дублирует ноды.
"""

import json
from pathlib import Path

PROJECT_PATH = Path(
    r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"
)

# === Константы нод ===
HUB_MSG_ID = "msg-compare-hub"
HUB_KB_ID = "kb-compare-hub"
SHEET_COMPARE_ID = "sheet-compare-rates"
SHEET_BOTS_ID = "sheet-bots"

# Кнопки которые нужно перенаправить на хаб
BUTTONS_TO_REDIRECT = {
    "btn-compare-rates": HUB_MSG_ID,
    "btn-compare-from-sites": HUB_MSG_ID,
}


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


def build_hub_message_node():
    """
    Создаёт ноду сообщения хаба сравнения
    @returns dict с нодой msg-compare-hub
    """
    return {
        "id": HUB_MSG_ID,
        "type": "message",
        "position": {"x": 100, "y": 100},
        "data": {
            "buttons": [],
            "markdown": False,
            "adminOnly": False,
            "formatMode": "html",
            "showInMenu": False,
            "messageText": (
                "💱 <b>Сравнение курсов</b>\n"
                "\n"
                "В этом разделе вы можете сравнить курсы обменников "
                "и сразу выбрать самый выгодный."
            ),
            "keyboardType": "none",
            "requiresAuth": False,
            "attachedMedia": [],
            "isPrivateOnly": False,
            "keyboardNodeId": HUB_KB_ID,
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "variableFilters": {},
            "enableStatistics": True,
            "enableAutoTransition": False,
        },
    }


def build_hub_keyboard_node():
    """
    Создаёт ноду клавиатуры хаба сравнения
    @returns dict с нодой kb-compare-hub
    """
    return {
        "id": HUB_KB_ID,
        "type": "keyboard",
        "position": {"x": 500, "y": 100},
        "data": {
            "buttons": [
                {
                    "id": "btn-hub-bots",
                    "text": "🤖 Боты",
                    "style": "primary",
                    "action": "goto",
                    "target": "bot-msg-menu",
                },
                {
                    "id": "btn-hub-sites",
                    "text": "📋 Сайты",
                    "style": "primary",
                    "action": "goto",
                    "target": "msg-compare-menu",
                },
                {
                    "id": "btn-hub-all",
                    "text": "📊 Сравнить всё",
                    "style": "success",
                    "action": "goto",
                    "target": "bot-msg-menu",
                },
                {
                    "id": "btn-hub-back",
                    "text": "◀️ Назад",
                    "action": "goto",
                    "target": "start_dup_1775330630988_2w4z6c8t9",
                },
            ],
            "markdown": False,
            "adminOnly": False,
            "showInMenu": False,
            "messageText": "",
            "keyboardType": "inline",
            "requiresAuth": False,
            "isPrivateOnly": False,
            "keyboardLayout": {
                "rows": [
                    {"buttonIds": ["btn-hub-bots", "btn-hub-sites"]},
                    {"buttonIds": ["btn-hub-all"]},
                    {"buttonIds": ["btn-hub-back"]},
                ],
                "columns": 2,
                "autoLayout": False,
            },
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "enableStatistics": True,
        },
    }


def redirect_buttons(sheets):
    """
    Перенаправляет кнопки "Сравнить курс" на хаб
    @param sheets - список листов проекта
    @returns количество перенаправленных кнопок
    """
    count = 0
    for sheet in sheets:
        for node in sheet.get("nodes", []):
            buttons = node.get("data", {}).get("buttons", [])
            for btn in buttons:
                btn_id = btn.get("id", "")
                if btn_id in BUTTONS_TO_REDIRECT:
                    old_target = btn.get("target", "")
                    new_target = BUTTONS_TO_REDIRECT[btn_id]
                    if old_target != new_target:
                        btn["target"] = new_target
                        count += 1
                        print(f"  ✅ Кнопка '{btn_id}': {old_target} → {new_target}")
                    else:
                        print(f"  ⏭️  Кнопка '{btn_id}' уже указывает на {new_target}")
    return count


def update_node_text(sheets, node_id, new_text, label):
    """
    Обновляет messageText у ноды
    @param sheets - список листов проекта
    @param node_id - ID ноды
    @param new_text - новый текст сообщения
    @param label - описание для лога
    """
    _, node = find_node(sheets, node_id)
    if not node:
        print(f"  ⚠️  Нода '{node_id}' не найдена — пропускаю ({label})")
        return False
    old_text = node["data"].get("messageText", "")
    if old_text == new_text:
        print(f"  ⏭️  {node_id} — текст уже актуален")
        return False
    node["data"]["messageText"] = new_text
    print(f"  ✅ {node_id} — текст обновлён ({label})")
    return True


def main():
    """
    Основная функция: читает project.json, добавляет хаб сравнения и сохраняет
    """
    print(f"📂 Читаю {PROJECT_PATH}...")
    data = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))
    sheets = data["sheets"]

    # === 1. Находим лист sheet-compare-rates ===
    sheet_compare = find_sheet(sheets, SHEET_COMPARE_ID)
    if not sheet_compare:
        raise RuntimeError(f"Лист '{SHEET_COMPARE_ID}' не найден!")
    print(f"  📋 Лист '{SHEET_COMPARE_ID}' найден")

    # === 2. Добавляем ноду msg-compare-hub (если нет) ===
    _, existing_hub = find_node(sheets, HUB_MSG_ID)
    if existing_hub:
        print(f"  ⏭️  Нода '{HUB_MSG_ID}' уже существует — пропускаю")
    else:
        sheet_compare["nodes"].append(build_hub_message_node())
        print(f"  ✅ Добавлена нода '{HUB_MSG_ID}'")

    # === 3. Добавляем клавиатуру kb-compare-hub (если нет) ===
    _, existing_kb = find_node(sheets, HUB_KB_ID)
    if existing_kb:
        print(f"  ⏭️  Нода '{HUB_KB_ID}' уже существует — пропускаю")
    else:
        sheet_compare["nodes"].append(build_hub_keyboard_node())
        print(f"  ✅ Добавлена нода '{HUB_KB_ID}'")

    # === 4. Перенаправляем кнопки на хаб ===
    print("\n🔀 Перенаправление кнопок...")
    redirect_buttons(sheets)

    # === 5. Обновляем тексты ===
    print("\n📝 Обновление текстов...")

    # 5.1 bot-msg-ask-amount (выбор суммы для ботов)
    update_node_text(
        sheets,
        "bot-msg-ask-amount",
        (
            "🤖 <b>Сравнение через ботов</b>\n"
            "\n"
            "📊 Пара: <b>{selected_from_name} → {selected_to_name}</b>\n"
            "\n"
            "💰 Выбери сумму или введи свою (в рублях):"
        ),
        "выбор суммы для ботов",
    )

    # 5.2 msg-compare-ask-amount (выбор суммы для сайтов)
    update_node_text(
        sheets,
        "msg-compare-ask-amount",
        (
            "📋 <b>Сравнение через сайты</b>\n"
            "\n"
            "📊 Пара: <b>{selected_from_name} → {selected_to_name}</b>\n"
            "\n"
            "💰 Выбери сумму или введи свою (в рублях):"
        ),
        "выбор суммы для сайтов",
    )

    # 5.3 bot-msg-loading (загрузка для ботов)
    update_node_text(
        sheets,
        "bot-msg-loading",
        (
            "⏳ <b>Собираю курсы через ботов...</b>\n"
            "\n"
            "Это займёт не более минуты."
        ),
        "загрузка для ботов",
    )

    # 5.4 bot-msg-menu (меню выбора пары для ботов)
    update_node_text(
        sheets,
        "bot-msg-menu",
        (
            "🤖 <b>Сравнение через ботов</b>\n"
            "\n"
            "Выбери валютную пару для сравнения:"
        ),
        "меню ботов",
    )

    # 5.5 msg-compare-menu (меню выбора пары для сайтов)
    update_node_text(
        sheets,
        "msg-compare-menu",
        (
            "📋 <b>Сравнение через сайты</b>\n"
            "\n"
            "Выбери валютную пару для сравнения:"
        ),
        "меню сайтов",
    )

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

    print("\n🎉 Готово! Хаб сравнения добавлен.")


if __name__ == "__main__":
    main()
