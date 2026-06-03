"""
@fileoverview Love: реальный BTC за user_amount ₽ (эквивалент × amount / оплата с карты).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from project_path import PROJECT

import json

LOVE_PARSE = [
    {
        "id": "pl_equiv_raw",
        "mode": "regex_extract",
        "value": "{love_text}",
        "pattern": "Эквивалент:\\s*\\*{0,2}([\\d.]+)\\*{0,2}\\s*BTC",
        "variable": "love_btc_equiv_raw",
        "regexGroup": "1",
    },
    {
        "id": "pl_equiv",
        "mode": "expression",
        "value": "float('{love_btc_equiv_raw}') if '{love_btc_equiv_raw}' else 0",
        "variable": "love_btc_equiv",
    },
    {
        "id": "pl_payment_raw",
        "mode": "regex_extract",
        "value": "{love_buttons}",
        "pattern": "карту\\s*(\\d+)₽",
        "variable": "love_payment_raw",
        "regexGroup": "1",
    },
    {
        "id": "pl_payment",
        "mode": "expression",
        "value": (
            "int({love_payment_raw}) if int({love_payment_raw}) > 0 "
            "else int({user_amount})"
        ),
        "variable": "love_payment",
    },
    {
        "id": "pl_btc",
        "mode": "expression",
        "value": (
            "round(float({love_btc_equiv}) * float({user_amount}) / "
            "float({love_payment}), 8) if float({love_payment}) > 0 else 0"
        ),
        "variable": "love_btc",
    },
    {
        "id": "pl_rate",
        "mode": "expression",
        "value": (
            "round(float({user_amount}) / float({love_btc}), 0) "
            "if float({love_btc}) > 0 else 0"
        ),
        "variable": "love_rate",
    },
]

LEGEND_OLD = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist, 24Crypto\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): Shaxta, Sanchez, BitMixer, "
    "CryptoFlow, Vortex, INFINITY, Lucky, Love, CASPER, Monopoly"
)

LEGEND_NEW = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist, 24Crypto, Love\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): Shaxta, Sanchez, BitMixer, "
    "CryptoFlow, Vortex, INFINITY, Lucky, CASPER, Monopoly"
)


def main() -> None:
    """Патчит amount, parse, calc и маркер Love."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    amount = nodes["bot-ub-love-amount"]
    amount["data"]["saveButtonsTo"] = "love_buttons"
    amount["data"]["responseStrategy"] = "longest"
    amount["data"]["waitSeconds"] = 5

    parse = nodes["bot-setv-parse-love"]
    parse["data"]["assignments"] = LOVE_PARSE

    calc = nodes["bot-setv-calc"]
    calc["data"]["assignments"] = [
        a for a in calc["data"]["assignments"] if a.get("id") != "calc_love"
    ]

    for a in calc["data"]["assignments"]:
        if a.get("id") == "push_love":
            a["value"] = a["value"].replace('"marker": "⚠️"', '"marker": "✅"')

    result = nodes["bot-msg-result"]
    text = result["data"].get("messageText", "")
    if LEGEND_OLD in text:
        result["data"]["messageText"] = text.replace(LEGEND_OLD, LEGEND_NEW)

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("OK: love_buttons, parse equiv*amount/payment (card)")
    print("OK: calc without calc_love, marker ok, legend updated")


if __name__ == "__main__":
    main()
