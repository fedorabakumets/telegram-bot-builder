"""
@fileoverview Lucky Exchange: реальный BTC из строки «Получите» в подтверждении заказа.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from project_path import PROJECT

import json

LUCKY_PARSE = [
    {
        "id": "pl_btc_raw",
        "mode": "regex_extract",
        "value": "{lucky_text}",
        "pattern": "Получите[^0-9]*([\\d.]+)\\s*BTC",
        "variable": "lucky_btc_raw",
        "regexGroup": "1",
    },
    {
        "id": "pl_btc",
        "mode": "expression",
        "value": (
            "round(float('{lucky_btc_raw}'), 8) if '{lucky_btc_raw}' else 0"
        ),
        "variable": "lucky_btc",
    },
    {
        "id": "pl_rate",
        "mode": "expression",
        "value": (
            "round(float({user_amount}) / float({lucky_btc}), 0) "
            "if float({lucky_btc}) > 0 else 0"
        ),
        "variable": "lucky_rate",
    },
]

LEGEND_OLD = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist, 24Crypto, Love, CrazyBTC\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): Shaxta, Sanchez, BitMixer, CryptoFlow, "
    "Vortex, INFINITY, Lucky, CASPER, Monopoly"
)

LEGEND_NEW = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist, 24Crypto, Love, CrazyBTC, Lucky\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): Shaxta, Sanchez, BitMixer, CryptoFlow, "
    "Vortex, INFINITY, CASPER, Monopoly"
)


def main() -> None:
    """Патчит address, parse, calc и маркер Lucky."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    addr = nodes["bot-ub-lucky-address"]
    addr["data"]["responseStrategy"] = "regex_match"
    addr["data"]["responseFilterRegex"] = "Подтверждение заказа"
    addr["data"]["responseWaitSeconds"] = 10
    addr["data"]["waitSeconds"] = 10

    parse = nodes["bot-setv-parse-lucky"]
    parse["data"]["assignments"] = LUCKY_PARSE

    calc = nodes["bot-setv-calc"]
    calc["data"]["assignments"] = [
        a for a in calc["data"]["assignments"] if a.get("id") != "calc_lucky"
    ]

    for a in calc["data"]["assignments"]:
        if a.get("id") == "push_lucky":
            a["value"] = a["value"].replace('"marker": "⚠️"', '"marker": "✅"')

    result = nodes["bot-msg-result"]
    text = result["data"].get("messageText", "")
    if LEGEND_OLD in text:
        result["data"]["messageText"] = text.replace(LEGEND_OLD, LEGEND_NEW)

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("OK: parse Получите -> lucky_btc, lucky_rate")
    print("OK: address regex_match Подтверждение заказа, wait 10s")
    print("OK: calc without calc_lucky, marker ok, legend updated")


if __name__ == "__main__":
    main()
