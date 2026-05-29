"""
@fileoverview Скрипт для установки style: "primary" всем URL-кнопкам в клавиатурах проекта.

Проходит по ВСЕМ keyboard нодам в project.json и для каждой кнопки
с action == "url" устанавливает style: "primary", если он ещё не задан.

Целевые листы:
  - 💱 Обменники 1–4, 5–8, 9–12, 13–16, 17–19
  - Лист 7c5ce0b7-bde7-495a-9cd1-1b8029e02abb (Обменники 17–19)
  - Клавиатуры BU7FV5vDWtTHmL5pzWPj5 (Honey Obmen) и monax-kb (MonaxBTC)
  - А также все остальные keyboard ноды проекта (кошельки и т.д.)

По факту: обрабатываются ВСЕ keyboard ноды во всём проекте.
"""

import json
import os
import sys

# Путь к файлу проекта
PROJECT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "bots", "новый_бот_1_242_163", "project.json"
)


def fix_url_buttons_style(project_path: str) -> int:
    """
    Устанавливает style: "primary" для всех URL-кнопок в keyboard нодах.

    @param project_path - Путь к файлу project.json
    @returns Количество исправленных кнопок
    """
    with open(project_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    fixed_count = 0

    for sheet in data["sheets"]:
        sheet_name = sheet.get("name", sheet.get("id", "unknown"))
        nodes = sheet.get("nodes", [])

        for node in nodes:
            if node.get("type") != "keyboard":
                continue

            node_id = node.get("id", "unknown")
            buttons = node.get("data", {}).get("buttons", [])

            for btn in buttons:
                if btn.get("action") == "url" and btn.get("style") != "primary":
                    btn["style"] = "primary"
                    btn_text = btn.get("text", "")
                    print(f"  [FIX] Лист: {sheet_name} | Нода: {node_id} | Кнопка: {btn_text}")
                    fixed_count += 1

    # Сохраняем результат
    with open(project_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return fixed_count


def validate_json(project_path: str) -> bool:
    """
    Проверяет валидность JSON после записи.

    @param project_path - Путь к файлу project.json
    @returns True если JSON валидный
    """
    try:
        with open(project_path, "r", encoding="utf-8") as f:
            json.load(f)
        return True
    except json.JSONDecodeError as e:
        print(f"  [ERROR] JSON невалидный: {e}")
        return False


def main():
    """Точка входа скрипта."""
    print(f"=== Исправление style URL-кнопок в keyboard нодах ===")
    print(f"Файл: {PROJECT_PATH}\n")

    if not os.path.exists(PROJECT_PATH):
        print(f"[ERROR] Файл не найден: {PROJECT_PATH}")
        sys.exit(1)

    fixed = fix_url_buttons_style(PROJECT_PATH)

    print(f"\nИсправлено кнопок: {fixed}")

    # Валидация
    print("\nПроверка валидности JSON...")
    if validate_json(PROJECT_PATH):
        print("  [OK] JSON валидный")
    else:
        print("  [FAIL] JSON повреждён!")
        sys.exit(1)

    # Финальная проверка — не осталось ли URL-кнопок без primary
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    remaining = 0
    for sheet in data["sheets"]:
        for node in sheet.get("nodes", []):
            if node.get("type") == "keyboard":
                for btn in node.get("data", {}).get("buttons", []):
                    if btn.get("action") == "url" and btn.get("style") != "primary":
                        remaining += 1

    if remaining == 0:
        print(f"  [OK] Все URL-кнопки имеют style: \"primary\"")
    else:
        print(f"  [WARN] Осталось {remaining} URL-кнопок без primary!")

    print("\nГотово.")


if __name__ == "__main__":
    main()
