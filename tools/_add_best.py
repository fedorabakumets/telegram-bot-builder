"""
@fileoverview Добавляет отслеживание лучшего обменника и замену эмодзи после цикла
"""
import json

PROJECT = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_154\project.json"
data = json.load(open(PROJECT, "r", encoding="utf-8"))

for sheet in data.get("sheets", []):
    for node in sheet.get("nodes", []):
        # 1. В setv-compare-init добавляем инициализацию best_rate и best_name
        if node["id"] == "setv-compare-init":
            assignments = node["data"].get("assignments", [])
            # Проверяем нет ли уже
            if not any(a.get("variable") == "best_rate" for a in assignments):
                # Вставляем после rates_text (index 1)
                assignments.insert(1, {
                    "id": "cmp_br",
                    "mode": "text",
                    "value": "0",
                    "variable": "best_rate"
                })
                assignments.insert(2, {
                    "id": "cmp_bn",
                    "mode": "text",
                    "value": "",
                    "variable": "best_name"
                })
                node["data"]["assignments"] = assignments
                print(f"setv-compare-init: added best_rate, best_name (total: {len(assignments)})")

        # 2. В setv-compare-extract добавляем сравнение с best_rate
        if node["id"] == "setv-compare-extract":
            assignments = node["data"].get("assignments", [])
            if not any(a.get("variable") == "best_rate" for a in assignments):
                # Добавляем условное обновление best_rate
                # Используем expression: max({best_rate}, {exchange_result})
                assignments.append({
                    "id": "cmp_best_r",
                    "mode": "expression",
                    "value": "max({best_rate}, {exchange_result})",
                    "variable": "best_rate"
                })
                node["data"]["assignments"] = assignments
                print(f"setv-compare-extract: added best_rate update (total: {len(assignments)})")

        # 3. Меняем afterLoopTo цикла: loop -> setv-compare-best -> msg-compare-result
        if node["id"] == "loop-compare-exchangers":
            node["data"]["afterLoopTo"] = "setv-compare-best"
            print("loop-compare-exchangers: afterLoopTo -> setv-compare-best")

    # 4. Добавляем новый узел setv-compare-best в лист "Сравнение курсов"
    if "Сравнение" in sheet.get("name", ""):
        nodes_list = sheet.get("nodes", [])
        if not any(n["id"] == "setv-compare-best" for n in nodes_list):
            nodes_list.append({
                "id": "setv-compare-best",
                "type": "set_variable",
                "position": {"x": 800, "y": 400},
                "data": {
                    "buttons": [],
                    "markdown": False,
                    "adminOnly": False,
                    "showInMenu": False,
                    "messageText": "",
                    "keyboardType": "none",
                    "assignments": [
                        {
                            "id": "best_replace",
                            "mode": "expression",
                            "value": "'{rates_text}'.replace('🔸 <a href=\"' + '{best_url}' + '\">', '🏆 <a href=\"' + '{best_url}' + '\">')",
                            "variable": "rates_text"
                        }
                    ],
                    "autoTransitionTo": "msg-compare-result",
                    "enableAutoTransition": True,
                    "enableStatistics": False
                }
            })
            print("Added setv-compare-best node")

with open(PROJECT, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("\nDone!")
