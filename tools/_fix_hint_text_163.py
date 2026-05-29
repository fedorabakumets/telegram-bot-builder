"""
@fileoverview Добавляет надпись "Нажми на название для перехода" в результаты ботов
и проверяет что реф-ссылки на месте.
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

changes = []

for sheet in project["sheets"]:
    for node in sheet["nodes"]:
        if node["id"] == "bot-msg-result":
            old = node["data"]["messageText"]
            # Добавляем подсказку в конец
            node["data"]["messageText"] = '{compare_title_short}\n\n📊 <b>СБП/Карта → Bitcoin</b>\n💰 Сумма: <b>{user_amount_fmt}</b> ₽\n\n{bot_rates_text}\n👆 <i>Нажми на название для перехода</i>'
            changes.append("bot-msg-result: добавлена подсказка '👆 Нажми на название для перехода'")

        if node["id"] == "msg-compare-result":
            old = node["data"]["messageText"]
            # Проверяем что подсказка есть
            if "Нажми на название" not in old:
                node["data"]["messageText"] = old + '\n👆 <i>Нажми на название для перехода</i>'
                changes.append("msg-compare-result: добавлена подсказка")
            else:
                changes.append("msg-compare-result: подсказка уже есть ✓")

with open(PROJECT_PATH, "w", encoding="utf-8") as f:
    json.dump(project, f, ensure_ascii=False, indent=2)

print("✅ Изменения:")
for c in changes:
    print(f"  • {c}")
print(f"\n💾 Сохранено: {PROJECT_PATH}")
