"""
@fileoverview Обновляет заголовки на экранах выбора суммы — разные для ботов и сайтов.
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
        # bot-msg-ask-amount — используется для ботов и "всё"
        # Заголовок зависит от compare_mode, но мы не можем динамически менять
        # Поскольку этот экран используется и для ботов и для "всё" — оставим нейтральный
        # Но добавим переменную {compare_title} которая устанавливается в set-mode
        if node["id"] == "bot-msg-ask-amount":
            node["data"]["messageText"] = "{compare_title}\n\n📊 <b>СБП/Карта → Bitcoin</b>\n\n💰 Выбери сумму или введи свою (в рублях):"
            changes.append("bot-msg-ask-amount: заголовок теперь использует {compare_title}")

        # msg-compare-ask-amount — только для сайтов
        if node["id"] == "msg-compare-ask-amount":
            node["data"]["messageText"] = "💱 <b>Сравнение курсов сайтов</b>\n\n📊 <b>СБП/Карта → Bitcoin</b>\n\n💰 Выбери сумму или введи свою (в рублях):"
            changes.append("msg-compare-ask-amount: заголовок = 'Сравнение курсов сайтов'")

        # Обновляем compare_title в set-mode узлах
        if node["id"] == "bots-set-mode":
            for a in node["data"]["assignments"]:
                if a.get("variable") == "compare_title":
                    a["value"] = "💱 <b>Сравнение курсов ботов</b>"
                    changes.append("bots-set-mode: compare_title = 'Сравнение курсов ботов'")

        if node["id"] == "all-set-mode":
            for a in node["data"]["assignments"]:
                if a.get("variable") == "compare_title":
                    a["value"] = "💱 <b>Сравнение курсов сайтов и ботов</b>"
                    changes.append("all-set-mode: compare_title = 'Сравнение курсов сайтов и ботов'")

        if node["id"] == "sites-set-mode":
            for a in node["data"]["assignments"]:
                if a.get("variable") == "compare_title":
                    a["value"] = "💱 <b>Сравнение курсов сайтов</b>"
                    changes.append("sites-set-mode: compare_title = 'Сравнение курсов сайтов'")

with open(PROJECT_PATH, "w", encoding="utf-8") as f:
    json.dump(project, f, ensure_ascii=False, indent=2)

print("✅ Изменения:")
for c in changes:
    print(f"  • {c}")
print(f"\n💾 Сохранено: {PROJECT_PATH}")
