"""
@fileoverview Скрипт для добавления обменника "MonaxBTC" в project.json бота 242_163
@module tools/_add_monax_163

Добавляет:
1. Ноду message (monax-msg) с описанием MonaxBTC на лист "💱 Обменники 17–19"
2. Ноду keyboard (monax-kb) с кнопкой-ссылкой и кнопкой "Назад"
3. Кнопку "MonaxBTC" в клавиатуру списка обменников на главном меню
4. Исправляет стиль кнопки Honey Obmen на "primary" (если ещё не установлен)

Идемпотентный — повторный запуск не дублирует данные.
"""

import json
from pathlib import Path

# Путь к project.json
PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json")

# ID листа куда добавляем ноды
TARGET_SHEET_ID = "7c5ce0b7-bde7-495a-9cd1-1b8029e02abb"

# ID клавиатуры со списком всех обменников (на листе "🏠 Главное меню")
EXCHANGERS_KEYBOARD_ID = "yw_mNIfYEudZi6qBKl9ov_keyboard_1774974624659_bplb421y4_dup_1775330630989_0qs6uycp4"

# ID ноды message MonaxBTC
MONAX_MESSAGE_ID = "monax-msg"

# ID ноды keyboard MonaxBTC
MONAX_KEYBOARD_ID = "monax-kb"

# Куда ведёт кнопка "Назад" — нода списка обменников
BACK_TARGET = "yw_mNIfYEudZi6qBKl9ov_dup_1775330630988_5mk95rdym"

# ID кнопки "Назад" в клавиатуре обменников (для вставки перед ней)
BACK_BUTTON_ID = "1773512075312"


def load_project(path: Path) -> dict:
    """
    Загружает project.json
    @param path - путь к файлу
    @returns данные проекта
    """
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_project(path: Path, project: dict) -> None:
    """
    Сохраняет project.json с отступами
    @param path - путь к файлу
    @param project - данные проекта
    """
    with open(path, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)


def create_monax_message_node() -> dict:
    """
    Создаёт ноду message для MonaxBTC
    Структура скопирована с Honey Obmen (r2I-bGIGjuLwVBV8DvLKj)
    @returns объект ноды message
    """
    return {
        "id": MONAX_MESSAGE_ID,
        "data": {
            "buttons": [],
            "markdown": False,
            "adminOnly": False,
            "formatMode": "html",
            "showInMenu": True,
            "messageText": (
                "<b>💱 MonaxBTC</b> — анонимный обменник криптовалюты прямо в Telegram.\n\n"
                "Что вы получаете:\n\n"
                "⚡️ Моментальные выплаты 24/7\n"
                "💧 Без KYC/AML — полная анонимность\n"
                "💎 Выгодные курсы на BTC, LTC, XMR, USDT, ETH, TRX\n"
                "🎟 Скидка 25% на первый обмен"
            ),
            "keyboardType": "none",
            "requiresAuth": False,
            "attachedMedia": [],
            "isPrivateOnly": False,
            "keyboardNodeId": MONAX_KEYBOARD_ID,
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "variableFilters": {},
            "enableStatistics": True
        },
        "type": "message",
        "position": {"x": 1100, "y": 2500}
    }


def create_monax_keyboard_node() -> dict:
    """
    Создаёт ноду keyboard для MonaxBTC
    Содержит кнопку-ссылку на бота и кнопку "Назад"
    @returns объект ноды keyboard
    """
    return {
        "id": MONAX_KEYBOARD_ID,
        "data": {
            "buttons": [
                {
                    "id": "btn_monax_link",
                    "url": "https://t.me/MonaxBTC_bot?start=Z1xJi9",
                    "text": "MonaxBTC",
                    "style": "primary",
                    "action": "url",
                    "target": "https://t.me/MonaxBTC_bot?start=Z1xJi9"
                },
                {
                    "id": "btn_monax_back",
                    "text": "Назад",
                    "action": "goto",
                    "target": BACK_TARGET
                }
            ],
            "markdown": False,
            "adminOnly": False,
            "showInMenu": True,
            "messageText": "",
            "keyboardType": "inline",
            "requiresAuth": False,
            "isPrivateOnly": False,
            "dynamicButtons": {
                "columns": 2,
                "variable": "",
                "arrayPath": "",
                "styleMode": "none",
                "textField": "",
                "arrayField": "",
                "styleField": "",
                "textTemplate": "{name}",
                "callbackField": "",
                "styleTemplate": "",
                "sourceVariable": "",
                "callbackTemplate": "project_{id}"
            },
            "keyboardLayout": {
                "rows": [
                    {"buttonIds": ["btn_monax_link"]},
                    {"buttonIds": ["btn_monax_back"]}
                ],
                "columns": 2,
                "autoLayout": False
            },
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "enableStatistics": True,
            "enableDynamicButtons": False,
            "allowMultipleSelection": False
        },
        "type": "keyboard",
        "position": {"x": 1520, "y": 2860}
    }


def add_nodes_to_sheet(project: dict) -> bool:
    """
    Добавляет ноды MonaxBTC на лист "💱 Обменники 17–19"
    @param project - данные проекта (мутируется)
    @returns True если добавлено
    """
    for sheet in project["sheets"]:
        if sheet["id"] == TARGET_SHEET_ID:
            existing_ids = {n["id"] for n in sheet["nodes"]}

            if MONAX_MESSAGE_ID in existing_ids:
                print("⚠️  Нода message MonaxBTC уже существует на листе — пропуск")
                return False

            sheet["nodes"].append(create_monax_message_node())
            sheet["nodes"].append(create_monax_keyboard_node())
            print(f"✅ Добавлены 2 ноды MonaxBTC на лист '{sheet['name']}'")
            return True

    print(f"❌ Лист с id={TARGET_SHEET_ID} не найден")
    return False


def add_button_to_exchangers_keyboard(project: dict) -> bool:
    """
    Добавляет кнопку "MonaxBTC" в клавиатуру списка обменников
    Вставляет новый ряд перед рядом с кнопкой "Назад"
    @param project - данные проекта (мутируется)
    @returns True если добавлено
    """
    for sheet in project["sheets"]:
        for node in sheet["nodes"]:
            if node["id"] == EXCHANGERS_KEYBOARD_ID:
                buttons = node["data"]["buttons"]

                # Проверяем идемпотентность
                if any(b.get("id") == "btn_monax_obmen" for b in buttons):
                    print("⚠️  Кнопка 'MonaxBTC' уже существует в клавиатуре — пропуск")
                    return False

                # Добавляем кнопку в массив buttons
                new_button = {
                    "id": "btn_monax_obmen",
                    "text": "MonaxBTC",
                    "style": "primary",
                    "action": "goto",
                    "target": MONAX_MESSAGE_ID,
                    "buttonType": "normal",
                    "hideAfterClick": False,
                    "skipDataCollection": False
                }
                buttons.append(new_button)

                # Добавляем в layout — перед рядом с кнопкой "Назад"
                layout = node["data"]["keyboardLayout"]
                back_row_idx = None
                for i, row in enumerate(layout["rows"]):
                    if BACK_BUTTON_ID in row["buttonIds"]:
                        back_row_idx = i
                        break

                new_row = {"buttonIds": ["btn_monax_obmen"]}
                if back_row_idx is not None:
                    layout["rows"].insert(back_row_idx, new_row)
                else:
                    layout["rows"].insert(-1, new_row)

                print("✅ Кнопка 'MonaxBTC' добавлена в клавиатуру обменников")
                return True

    print(f"❌ Клавиатура {EXCHANGERS_KEYBOARD_ID} не найдена")
    return False


def fix_honey_button_style(project: dict) -> bool:
    """
    Устанавливает style: "primary" для кнопки btn_honey_obmen
    @param project - данные проекта (мутируется)
    @returns True если изменено
    """
    for sheet in project["sheets"]:
        for node in sheet["nodes"]:
            if node["id"] == EXCHANGERS_KEYBOARD_ID:
                for btn in node["data"]["buttons"]:
                    if btn.get("id") == "btn_honey_obmen":
                        if btn.get("style") == "primary":
                            print("⚠️  Кнопка Honey Obmen уже имеет style='primary' — пропуск")
                            return False
                        btn["style"] = "primary"
                        print("✅ Стиль кнопки Honey Obmen установлен на 'primary'")
                        return True

    print("❌ Кнопка btn_honey_obmen не найдена")
    return False


def validate_json(path: Path) -> bool:
    """
    Проверяет что файл является валидным JSON
    @param path - путь к файлу
    @returns True если JSON валидный
    """
    try:
        with open(path, encoding="utf-8") as f:
            json.load(f)
        return True
    except json.JSONDecodeError as e:
        print(f"❌ JSON невалидный: {e}")
        return False


def main():
    """
    Основная функция — добавляет MonaxBTC в project.json
    """
    print("🔧 Добавление MonaxBTC в project.json...")
    print(f"   Файл: {PROJECT_PATH}")

    project = load_project(PROJECT_PATH)
    print(f"   Листов: {len(project['sheets'])}")

    changes = []

    # 1. Добавляем ноды на лист "Обменники 17–19"
    if add_nodes_to_sheet(project):
        changes.append("ноды")

    # 2. Добавляем кнопку в клавиатуру обменников
    if add_button_to_exchangers_keyboard(project):
        changes.append("кнопка в клавиатуре")

    # 3. Исправляем стиль кнопки Honey Obmen
    if fix_honey_button_style(project):
        changes.append("стиль Honey Obmen")

    if changes:
        save_project(PROJECT_PATH, project)
        print(f"\n💾 Файл сохранён: {PROJECT_PATH}")

        # Валидация
        if validate_json(PROJECT_PATH):
            print("✅ JSON валидный")
        else:
            print("❌ ОШИБКА: JSON невалидный после сохранения!")
    else:
        print("\n⚠️  Никаких изменений не внесено (всё уже добавлено)")


if __name__ == "__main__":
    main()
