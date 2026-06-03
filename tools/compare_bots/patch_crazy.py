"""
@fileoverview CrazyBTC: реальный BTC за user_amount ₽ (btc_raw × amount / «К оплате»).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from project_path import PROJECT

import json

CRAZY_PARSE = [
    {
        "id": "pcz_btc_raw",
        "mode": "regex_extract",
        "value": "{crazy_text}",
        "pattern": "([\\d.]+)\\s*BTC",
        "variable": "crazy_btc_raw",
        "regexGroup": "1",
    },
    {
        "id": "pcz_payment_raw",
        "mode": "regex_extract",
        "value": "{crazy_text}",
        "pattern": "оплате[^0-9]*(\\d{4,6})",
        "variable": "crazy_payment_raw",
        "regexGroup": "1",
    },
    {
        "id": "pcz_payment",
        "mode": "expression",
        "value": (
            "int({crazy_payment_raw}) if int({crazy_payment_raw}) > 0 "
            "else int({user_amount})"
        ),
        "variable": "crazy_payment",
    },
    {
        "id": "pcz_btc",
        "mode": "expression",
        "value": (
            "round(float({crazy_btc_raw}) * float({user_amount}) / "
            "float({crazy_payment}), 8) if float({crazy_payment}) > 0 else 0"
        ),
        "variable": "crazy_btc",
    },
    {
        "id": "pcz_rate",
        "mode": "expression",
        "value": (
            "round(float({user_amount}) / float({crazy_btc}), 0) "
            "if float({crazy_btc}) > 0 else 0"
        ),
        "variable": "crazy_rate",
    },
]

LEGEND_OLD = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist, 24Crypto, Love\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): Shaxta, Sanchez, BitMixer, CryptoFlow, "
    "Vortex, INFINITY, Lucky, CASPER, Monopoly"
)

LEGEND_NEW = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist, 24Crypto, Love, CrazyBTC\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): Shaxta, Sanchez, BitMixer, CryptoFlow, "
    "Vortex, INFINITY, Lucky, CASPER, Monopoly"
)


def main() -> None:
    """Патчит parse, calc и маркер CrazyBTC."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    addr = nodes["bot-ub-crazy-address"]
    addr["data"]["responseStrategy"] = "regex_match"
    addr["data"]["responseFilterRegex"] = "Информация по заявке"
    addr["data"]["responseWaitSeconds"] = 10
    addr["data"]["waitSeconds"] = 10

    parse = nodes["bot-setv-parse-crazy"]
    parse["data"]["assignments"] = CRAZY_PARSE

    calc = nodes["bot-setv-calc"]
    calc["data"]["assignments"] = [
        a for a in calc["data"]["assignments"] if a.get("id") != "calc_crazy"
    ]

    for a in calc["data"]["assignments"]:
        if a.get("id") == "push_crazy":
            a["value"] = a["value"].replace('"marker": "⚠️"', '"marker": "✅"')

    result = nodes["bot-msg-result"]
    text = result["data"].get("messageText", "")
    if LEGEND_OLD in text:
        result["data"]["messageText"] = text.replace(LEGEND_OLD, LEGEND_NEW)

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("OK: parse btc_raw * amount / payment (K oplate)")
    print("OK: calc without calc_crazy, marker ok, legend updated")


if __name__ == "__main__":
    main()
