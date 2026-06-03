"""
@fileoverview Временно: пропуск Империи/VIRON, ✅ только Scooby/LiteBit/Capitalist.
"""
import json
import re
from pathlib import Path

PROJECT = Path("bots/новый_бот_1_242_163/project.json")

REAL_BOTS = {"ScoobyChange", "LiteBit", "Capitalist"}

SKIP_CALC_IDS = {
    "calc_imp",
    "fmt_imp",
    "push_imperia",
    "calc_viron",
    "fmt_viron",
    "push_viron",
}

LEGEND_OLD = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist\n"
    "✅ <b>Итоговый BTC</b> из ответа бота: BitMixer, CryptoFlow, CrazyBTC, Monopoly\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): 24Crypto, Shaxta, Sanchez, Империя, VIRON, Vortex, INFINITY, Lucky, Love, CASPER"
)

LEGEND_NEW = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): 24Crypto, Shaxta, Sanchez, BitMixer, CryptoFlow, Vortex, INFINITY, Lucky, Love, CASPER, Monopoly"
)


def patch_marker(value: str) -> str:
    """Ставит ✅ только для трёх проверенных ботов."""
    match = re.search(r'"name": "([^"]+)"', value)
    if not match:
        return value
    name = match.group(1)
    marker = "✅" if name in REAL_BOTS else "⚠️"
    if '"marker"' in value:
        return re.sub(r'"marker": "[^"]*"', f'"marker": "{marker}"', value)
    return value.replace(f'"name": "{name}"', f'"name": "{name}", "marker": "{marker}"')


def main() -> None:
    """Пропускает Империю/VIRON и обновляет маркеры."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    nodes["bot-setv-parse-sanchez"]["data"]["autoTransitionTo"] = "bot-ub-cf-start"
    nodes["bot-setv-parse-sanchez"]["data"]["enableAutoTransition"] = True

    calc = nodes["bot-setv-calc"]
    calc["data"]["assignments"] = [
        a for a in calc["data"]["assignments"] if a.get("id") not in SKIP_CALC_IDS
    ]
    for a in calc["data"]["assignments"]:
        if a.get("mode") == "json_push":
            a["value"] = patch_marker(a["value"])

    result = nodes["bot-msg-result"]
    text = result["data"].get("messageText", "")
    if LEGEND_OLD in text:
        result["data"]["messageText"] = text.replace(LEGEND_OLD, LEGEND_NEW)

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    pushes = [a for a in calc["data"]["assignments"] if a.get("mode") == "json_push"]
    print(f"OK: sanchez -> CryptoFlow (без Империи/VIRON)")
    print(f"OK: calc — {len(pushes)} ботов")
    for a in pushes:
        m = re.search(r'"name": "([^"]+)".*"marker": "([^"]+)"', a["value"])
        if m:
            print(f"  {m.group(2)} {m.group(1)}")


if __name__ == "__main__":
    main()
