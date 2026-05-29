"""
@fileoverview Скрипт для добавления обменника "Honey Obmen" в project.json бота 242_163
@module tools/add_honey_obmen_163

Добавляет:
1. Ноду message (r2I-bGIGjuLwVBV8DvLKj) с описанием Honey Obmen на лист "💱 Обменники 17–19"
2. Ноду keyboard (BU7FV5vDWtTHmL5pzWPj5) с кнопкой-ссылкой и кнопкой "Назад"
3. Кнопку "Honey Obmen" в клавиатуру списка обменников на главном меню

Источник данных: __________data.json (старая версия бота)
"""

import json
from pathlib import Path

PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json")

# ID листа куда добавляем ноды
TARGET_SHEET_ID = "7c5ce0b7-bde7-495a-9cd1-1b8029e02abb"

# ID клавиатуры со списком всех обменников (на листе "🏠 Главное меню")
EXCHANGERS_KEYBOARD_ID = "yw_mNIfYEudZi6qBKl9ov_keyboard_1774974624659_bplb421y4_dup_1775330630989_0qs6uycp4"

# ID ноды message Honey Obmen
HONEY_MESSAGE_ID = "r2I-bGIGjuLwVBV8DvLKj"

# ID ноды keyboard Honey Obmen
HONEY_KEYBOARD_ID = "BU7FV5vDWtTHmL5pzWPj5"

# Куда ведёт кнопка "Назад" — нода списка обменников
BACK_TARGET = "yw_mNIfYEudZi6qBKl9ov_dup_1775330630988_5mk95rdym"


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
    Сохраняет project.json
    @param path - путь к файлу
    @param project - данные проекта
    """
    with open(path, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)


def create_honey_message_node() -> dict:
    """
    Создаёт ноду message для Honey Obmen
    @returns объект ноды message
    """
    return {
        "id": HONEY_MESSAGE_ID,
        "data": {
            "buttons": [],
            "markdown": False,
            "adminOnly": False,
            "formatMode": "html",
            "showInMenu": True,
            "messageText": (
                "<b>💱 Honey Obmen</b> — удобный Telegram Mini App для"
                " быстрых и безопасных операций без сторонних сайтов.\n\n"
                "Что вы получаете:\n\n"
                "⚡️ Мгновенный обмен криптовалюты в несколько кликов\n"
                "🔒 Безопасные операции внутри Telegram\n"
                "📈 Точную фиксацию курса на момент сделки\n"
                "💧 Гарантированную ликвидность по всем направлениям\n"
                "🚀 Высокую скорость обработки заявок"
            ),
            "keyboardType": "none",
            "requiresAuth": False,
            "attachedMedia": [
                "/uploads/20/2026-05-22/1779444037878-265646976-photo_2026-05-22_13-00-25.jpg"
            ],
            "isPrivateOnly": False,
            "keyboardNodeId": HONEY_KEYBOARD_ID,
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "variableFilters": {},
            "enableStatistics": True
        },
        "type": "message",
        "position": {"x": 3400, "y": 2100}
    }


def create_honey_keyboard_node() -> dict:
    """
    Создаёт ноду keyboard для Honey Obmen
    Содержит кнопку-ссылку на бота и кнопку "Назад"
    @returns объект ноды keyboard
    """
    return {
        "id": HONEY_KEYBOARD_ID,
        "data": {
            "buttons": [
                {
                    "id": "btn_honey_link",
                    "url": "https://t.me/honey_obmen_bot?start=7733607050",
                    "text": "Honey Obmen",
                    "action": "url",
                    "target": "https://t.me/honey_obmen_bot?start=7733607050"
                },
                {
                    "id": "btn_honey_back",
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
                    {"buttonIds": ["btn_honey_link"]},
                    {"buttonIds": ["btn_honey_back"]}
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
        "position": {"x": 3800, "y": 2100}
    }


def add_nodes_to_sheet(project: dict) -> bool:
    """
    Добавляет ноды Honey Obmen на лист "💱 Обменники 17–19"
    @param project - данные проекта (мутируется)
    @returns True если успешно
    """
    for sheet in project["sheets"]:
        if sheet["id"] == TARGET_SHEET_ID:
            # Проверяем что ноды ещё не добавлены
            existing_ids = {n["id"] for n in sheet["nodes"]}
            if HONEY_MESSAGE_ID in existing_ids:
                print("⚠️  Нода message Honey Obmen уже существует на листе")
                return False

            sheet["nodes"].append(create_honey_message_node())
            sheet["nodes"].append(create_honey_keyboard_node())
            print(f"✅ Добавлены 2 ноды Honey Obmen на лист '{sheet['name']}'")
            return True

    print(f"❌ Лист с id={TARGET_SHEET_ID} не найден")
    return False


def add_button_to_exchangers_keyboard(project: dict) -> bool:
    """
    Добавляет кнопку "Honey Obmen" в клавиатуру списка обменников
    @param project - данные проекта (мутируется)
    @returns True если успешно
    """
    for sheet in project["sheets"]:
        for node in sheet["nodes"]:
            if node["id"] == EXCHANGERS_KEYBOARD_ID:
                buttons = node["data"]["buttons"]

                # Проверяем что кнопка ещё не добавлена
                if any(b.get("text") == "Honey Obmen" for b in buttons):
                    print("⚠️  Кнопка 'Honey Obmen' уже существует в клавиатуре")
                    return False

                # Добавляем кнопку
                new_button = {
                    "id": "btn_honey_obmen",
                    "text": "Honey Obmen",
                    "style": "primary",
                    "action": "goto",
                    "target": HONEY_MESSAGE_ID,
                    "buttonType": "normal",
                    "hideAfterClick": False,
                    "skipDataCollection": False
                }
                buttons.append(new_button)

                # Добавляем в layout — перед рядом с кнопкой "Назад"
                layout = node["data"]["keyboardLayout"]
                back_row_idx = None
                for i, row in enumerate(layout["rows"]):
                    if "1773512075312" in row["buttonIds"]:
                        back_row_idx = i
                        break

                new_row = {"buttonIds": ["btn_honey_obmen"]}
                if back_row_idx is not None:
                    layout["rows"].insert(back_row_idx, new_row)
                else:
                    # Если не нашли ряд "Назад" — вставляем предпоследним
                    layout["rows"].insert(-1, new_row)

                print("✅ Кнопка 'Honey Obmen' добавлена в клавиатуру обменников")
                return True

    print(f"❌ Клавиатура {EXCHANGERS_KEYBOARD_ID} не найдена")
    return False


def main():
    """
    Основная функция — добавляет Honey Obmen в project.json
    """
    print("🔧 Добавление Honey Obmen в project.json...")
    print(f"   Файл: {PROJECT_PATH}")

    project = load_project(PROJECT_PATH)
    print(f"   Листов: {len(project['sheets'])}")

    # 1. Добавляем ноды на лист "Обменники 17–19"
    ok1 = add_nodes_to_sheet(project)

    # 2. Добавляем кнопку в клавиатуру обменников
    ok2 = add_button_to_exchangers_keyboard(project)

    if ok1 or ok2:
        save_project(PROJECT_PATH, project)
        print(f"\n✅ Файл сохранён: {PROJECT_PATH}")
    else:
        print("\n⚠️  Никаких изменений не внесено")


if __name__ == "__main__":
    main()
