"""
@fileoverview Исправляет заголовки в all-merge-format.
Эмодзи 🤖 съедает букву "Б" при подстановке переменных.
Решение: убрать эмодзи из заголовков, оставить только HTML bold.
"""

import json
from pathlib import Path

PROJECT_PATH = Path(
    r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"
)


def main():
    data = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))

    for sheet in data["sheets"]:
        for node in sheet["nodes"]:
            if node["id"] == "all-merge-format":
                for a in node["data"]["assignments"]:
                    if a.get("id") == "merge_all":
                        # Заменяем эмодзи-заголовки на текстовые с HTML
                        a["value"] = "<b>Боты:</b>\n{bot_rates_text}\n<b>Сайты:</b>\n{rates_text}"
                        print(f"Fixed: {a['value'][:50]}")
                break

    PROJECT_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("Saved")


if __name__ == "__main__":
    main()
