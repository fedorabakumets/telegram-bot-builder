"""
@fileoverview Добавляет кнопку "💱 Сравнить курс" в клавиатуру списка ботов.
Для симметрии с экраном списка сайтов.
"""
import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_PATH = os.path.join(
    os.path.dirname(__file__), "..",
    "bots", "новый_бот_1_242_163", "project.json"
)

with open(PROJECT_PATH, "r", encoding="utf-8") as f:
    project = json.load(f)

# Клавиатура списка ботов
KB_ID = "yw_mNIfYEudZi6qBKl9ov_keyboard_1774974624659_bplb421y4_dup_1775330630989_0qs6uycp4"

for sheet in project["sheets"]:
    for node in sheet["nodes"]:
        if node["id"] == KB_ID:
            buttons = node["data"]["buttons"]
            print(f"Клавиатура списка ботов: {len(buttons)} кнопок")
            print(f"Последние 3:")
            for b in buttons[-3:]:
                print(f"  [{b['text']}] → {b.get('target', b.get('url', '?'))}")

            # Проверяем есть ли уже кнопка "Сравнить курс"
            has_compare = any("Сравнить" in b.get("text", "") for b in buttons)
            if has_compare:
                print("\n⚠️ Кнопка 'Сравнить курс' уже есть!")
            else:
                # Находим кнопку "Назад" — вставляем перед ней
                nazad_idx = None
                for i, b in enumerate(buttons):
                    if "Назад" in b.get("text", ""):
                        nazad_idx = i
                        break

                new_btn = {
                    "id": f"btn_compare_from_bots_{int(__import__('time').time())}",
                    "text": "💱 Сравнить курс",
                    "action": "goto",
                    "target": "msg-compare-hub",
                    "style": "default"
                }

                if nazad_idx is not None:
                    buttons.insert(nazad_idx, new_btn)
                    print(f"\n✅ Добавлена кнопка '💱 Сравнить курс' перед 'Назад' (позиция {nazad_idx})")
                else:
                    buttons.append(new_btn)
                    print(f"\n✅ Добавлена кнопка '💱 Сравнить курс' в конец")

                print(f"Теперь кнопок: {len(buttons)}")
            break

with open(PROJECT_PATH, "w", encoding="utf-8") as f:
    json.dump(project, f, ensure_ascii=False, indent=2)

print(f"\n💾 Сохранено: {PROJECT_PATH}")
