"""
@fileoverview Отключает VIRON из цепочки сравнения ботов (временно не работает).
Перенаправляет bot-setv-parse-imperia → bot-ub-cf-start (пропуская VIRON).
Ноды VIRON остаются в JSON, просто на них никто не переходит.
"""

import json
from pathlib import Path

PROJECT_PATH = Path(r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json")


def main():
    """
    Отключает VIRON из цепочки: imperia → [viron] → cf
    Становится: imperia → cf (viron пропускается)
    """
    data = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))

    changes = 0

    for sheet in data["sheets"]:
        for node in sheet["nodes"]:
            # Перенаправить bot-setv-parse-imperia → bot-ub-cf-start (пропуск viron)
            if node["id"] == "bot-setv-parse-imperia":
                old = node["data"].get("autoTransitionTo", "")
                if old == "bot-ub-viron-start":
                    node["data"]["autoTransitionTo"] = "bot-ub-cf-start"
                    print(f"✅ bot-setv-parse-imperia: {old} → bot-ub-cf-start")
                    changes += 1
                else:
                    print(f"ℹ  bot-setv-parse-imperia уже ведёт на: {old}")

            # Убрать json_push для viron из bot-setv-calc
            if node["id"] == "bot-setv-calc":
                assignments = node["data"]["assignments"]
                # Находим push_viron и помечаем skipIfEmpty
                for a in assignments:
                    if a.get("id") == "push_viron":
                        # Добавляем skipIfEmpty чтобы не пушить если viron_btc пустой
                        a["skipIfEmpty"] = "viron_btc"
                        print("✅ push_viron: добавлен skipIfEmpty = 'viron_btc'")
                        changes += 1
                        break

    if changes > 0:
        PROJECT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\n✅ Сохранено ({changes} изменений)")
    else:
        print("\n⚠️  Нет изменений")


if __name__ == "__main__":
    main()
