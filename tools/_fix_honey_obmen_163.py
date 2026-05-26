"""
@fileoverview Исправляет ноды Honey Obmen в project.json на оригинальное форматирование из __________data.json
@module tools/_fix_honey_obmen_163

Приводит позиции, ID кнопок и layout к оригинальным значениям.
"""

import json
from pathlib import Path

PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json")


def main():
    """
    Исправляет ноды Honey Obmen на оригинальные данные из __________data.json
    """
    with open(PROJECT_PATH, encoding="utf-8") as f:
        project = json.load(f)

    fixed = 0

    for sheet in project["sheets"]:
        for node in sheet["nodes"]:
            # Исправляем message ноду — позиция
            if node["id"] == "r2I-bGIGjuLwVBV8DvLKj":
                node["position"] = {"x": 1100, "y": 2060}
                fixed += 1
                print("✅ message r2I-bGIGjuLwVBV8DvLKj: позиция → x:1100, y:2060")

            # Исправляем keyboard ноду — позиция, ID кнопок, layout
            if node["id"] == "BU7FV5vDWtTHmL5pzWPj5":
                node["position"] = {"x": 1520, "y": 2420}

                # Исправляем ID кнопок на оригинальные
                for btn in node["data"]["buttons"]:
                    if btn["text"] == "Honey Obmen" and btn["action"] == "url":
                        btn["id"] = "btn_12"
                    elif btn["text"] == "Назад":
                        btn["id"] = "btn_13"

                # Исправляем layout на оригинальный (btn_12, btn_13)
                node["data"]["keyboardLayout"] = {
                    "rows": [
                        {"buttonIds": ["btn_12"]},
                        {"buttonIds": ["btn_13"]}
                    ],
                    "columns": 2,
                    "autoLayout": False
                }

                fixed += 1
                print("✅ keyboard BU7FV5vDWtTHmL5pzWPj5: позиция → x:1520, y:2420, ID кнопок → btn_12/btn_13")

    if fixed > 0:
        with open(PROJECT_PATH, "w", encoding="utf-8") as f:
            json.dump(project, f, ensure_ascii=False, indent=2)
        print(f"\n✅ Исправлено {fixed} нод, файл сохранён")
    else:
        print("⚠️  Ноды не найдены")


if __name__ == "__main__":
    main()
