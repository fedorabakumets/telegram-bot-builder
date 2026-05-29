"""
@fileoverview Фикс: sites-set-mode должен вести к msg-compare-ask-amount (путь сайтов),
а не к bot-msg-ask-amount (путь ботов).
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

# Находим sites-set-mode
for sheet in project["sheets"]:
    for node in sheet["nodes"]:
        if node["id"] == "sites-set-mode":
            old = node["data"]["autoTransitionTo"]
            node["data"]["autoTransitionTo"] = "msg-compare-ask-amount"
            print(f"✅ sites-set-mode: autoTransitionTo '{old}' → 'msg-compare-ask-amount'")

        # Также обновим messageText в msg-compare-ask-amount
        if node["id"] == "msg-compare-ask-amount":
            node["data"]["messageText"] = "💱 <b>Сравнение курсов</b>\n\n📊 <b>СБП/Карта → Bitcoin</b>\n\n💰 Выбери сумму или введи свою (в рублях):"
            print(f"✅ msg-compare-ask-amount: messageText обновлён")

with open(PROJECT_PATH, "w", encoding="utf-8") as f:
    json.dump(project, f, ensure_ascii=False, indent=2)

print(f"\n💾 Сохранено: {PROJECT_PATH}")
