"""
Добавляет schedule_trigger для инициализации дефолтных настроек в таблицу settings.
Запускается при старте бота (runOnStart: true), создаёт запись invite_link если её нет.
"""

import json
import sys

PROJECT_PATH = r"bots\69room_application_bot\project.json"

# Новые ноды для sheet-admin
INIT_TRIGGER = {
    "id": "init-settings",
    "type": "schedule_trigger",
    "position": {"x": 100, "y": 500},
    "data": {
        "rules": [{"mode": "interval", "intervalMinutes": 1440}],
        "timezone": "Europe/Moscow",
        "runOnStart": True,
        "enabled": True,
        "maxConcurrent": 1,
        "autoTransitionTo": "init-default-link",
        "enableAutoTransition": True,
        "buttons": [],
        "keyboardType": "none"
    }
}

INIT_DEFAULT_LINK = {
    "id": "init-default-link",
    "type": "bot_table",
    "position": {"x": 400, "y": 500},
    "data": {
        "tableName": "settings",
        "operation": "upsert",
        "key": "key",
        "onConflict": "ignore",
        "row": {
            "key": "invite_link",
            "value": "https://t.me/+XXXXXXXXXXXXXX"
        },
        "buttons": [],
        "keyboardType": "none",
        "enableStatistics": True
    }
}


def main():
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        project = json.load(f)

    # Находим sheet-admin
    admin_sheet = None
    for sheet in project["sheets"]:
        if sheet["id"] == "sheet-admin":
            admin_sheet = sheet
            break

    if not admin_sheet:
        print("❌ sheet-admin не найден")
        sys.exit(1)

    # Проверяем что ноды ещё не добавлены
    existing_ids = {n["id"] for n in admin_sheet["nodes"]}
    if "init-settings" in existing_ids:
        print("⚠️ init-settings уже существует, пропускаем")
        sys.exit(0)

    # Добавляем ноды
    admin_sheet["nodes"].append(INIT_TRIGGER)
    admin_sheet["nodes"].append(INIT_DEFAULT_LINK)

    # Сохраняем
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("✅ Добавлены ноды: init-settings, init-default-link")
    print("   schedule_trigger (runOnStart) → bot_table upsert (ignore) → settings.invite_link")


if __name__ == "__main__":
    main()
