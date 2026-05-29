"""
@fileoverview Финальные исправления:
1. Заголовок "Боты:" в all-merge-format — восстановить полный текст с эмодзи
2. Кнопка "Боты" в kb-compare-result — проверить что на месте и текст правильный
"""

import json
from pathlib import Path

PROJECT_PATH = Path(
    r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"
)


def main():
    data = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))
    fixes = 0

    for sheet in data["sheets"]:
        for node in sheet["nodes"]:
            # Fix 1: all-merge-format — правильный текст с эмодзи
            if node["id"] == "all-merge-format":
                for a in node["data"]["assignments"]:
                    if a.get("id") == "merge_all":
                        correct = "\U0001f916 <b>Боты:</b>\n{bot_rates_text}\n\U0001f310 <b>Сайты:</b>\n{rates_text}"
                        if a["value"] != correct:
                            a["value"] = correct
                            fixes += 1
                            print(f"[FIX] all-merge-format merge_all value updated")
                        else:
                            print(f"[OK] all-merge-format already correct")

            # Fix 2: kb-compare-result — кнопка Боты
            if node["id"] == "kb-compare-result":
                buttons = node["data"]["buttons"]
                bot_btn = None
                for b in buttons:
                    if b.get("id") == "btn-compare-bots":
                        bot_btn = b
                        break

                if bot_btn is None:
                    # Добавляем кнопку
                    buttons.append({
                        "id": "btn-compare-bots",
                        "text": "\U0001f916 Боты",
                        "action": "goto",
                        "target": "bot-msg-menu",
                        "hideAfterClick": False,
                        "skipDataCollection": False
                    })
                    # Добавляем в layout
                    layout = node["data"].get("keyboardLayout", {})
                    if layout and "rows" in layout:
                        # Ищем ряд с btn-compare-back-menu и btn-full-list
                        for row in layout["rows"]:
                            if "btn-compare-back-menu" in row["buttonIds"]:
                                if "btn-compare-bots" not in row["buttonIds"]:
                                    row["buttonIds"].append("btn-compare-bots")
                                break
                    fixes += 1
                    print(f"[FIX] kb-compare-result: added btn-compare-bots")
                else:
                    # Проверяем текст
                    correct_text = "\U0001f916 Боты"
                    if bot_btn["text"] != correct_text:
                        bot_btn["text"] = correct_text
                        fixes += 1
                        print(f"[FIX] kb-compare-result: fixed btn text")
                    else:
                        print(f"[OK] kb-compare-result btn-compare-bots correct")

    PROJECT_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\nFixes: {fixes}")
    print("Saved")


if __name__ == "__main__":
    main()
