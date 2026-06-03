"""
@fileoverview Capitalist: реальный BTC за user_amount ₽ (btc_raw × amount / payment с карты).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from project_path import PROJECT

import json

CAPITALIST_PARSE = [
    {
        "id": "pc_btc_raw",
        "mode": "regex_extract",
        "value": "{cap_result_text}",
        "pattern": "Получите:\\s*\\*{0,2}([\\d.]+)\\*{0,2}\\s*BTC",
        "variable": "capitalist_btc_raw",
        "regexGroup": "1",
    },
    {
        "id": "pc_payment_raw",
        "mode": "regex_extract",
        "value": "{cap_buttons}",
        "pattern": "\\((\\d+)\\s*руб",
        "variable": "capitalist_payment_raw",
        "regexGroup": "1",
    },
    {
        "id": "pc_payment",
        "mode": "expression",
        "value": (
            "int({capitalist_payment_raw}) if int({capitalist_payment_raw}) > 0 "
            "else int({user_amount})"
        ),
        "variable": "capitalist_payment",
    },
    {
        "id": "pc_btc_real",
        "mode": "expression",
        "value": (
            "round(float({capitalist_btc_raw}) * float({user_amount}) / "
            "float({capitalist_payment}), 8) if float({capitalist_payment}) > 0 else 0"
        ),
        "variable": "capitalist_btc",
    },
    {
        "id": "pc_rate",
        "mode": "expression",
        "value": (
            "round(float({user_amount}) / float({capitalist_btc}), 0) "
            "if float({capitalist_btc}) > 0 else 0"
        ),
        "variable": "capitalist_rate",
    },
]

RESULT_LEGEND_OLD = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit\n"
    "✅ <b>Итоговый BTC</b> из ответа бота: BitMixer, CryptoFlow, CrazyBTC, Monopoly\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): Capitalist, 24Crypto, Shaxta, Sanchez, Империя, VIRON, Vortex, INFINITY, Lucky, Love, CASPER"
)

RESULT_LEGEND_NEW = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist\n"
    "✅ <b>Итоговый BTC</b> из ответа бота: BitMixer, CryptoFlow, CrazyBTC, Monopoly\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): 24Crypto, Shaxta, Sanchez, Империя, VIRON, Vortex, INFINITY, Lucky, Love, CASPER"
)


def main() -> None:
    """Патчит amount, parse, calc и маркер Capitalist."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    amount = nodes["bot-ub-capitalist-amount"]
    amount["data"]["messageText"] = "{user_amount}"
    amount["data"]["saveButtonsTo"] = "cap_buttons"
    amount["data"]["responseStrategy"] = "regex_match"
    amount["data"]["responseFilterRegex"] = "Получите"
    amount["data"]["responseWaitSeconds"] = 5

    parse = nodes["bot-setv-parse-capitalist"]
    parse["data"]["assignments"] = CAPITALIST_PARSE

    calc = nodes["bot-setv-calc"]
    calc["data"]["assignments"] = [
        a for a in calc["data"]["assignments"] if a.get("id") != "calc2"
    ]
    for a in calc["data"]["assignments"]:
        if a.get("id") == "push_capitalist":
            a["value"] = a["value"].replace('"marker": "⚠️"', '"marker": "✅"')

    result = nodes["bot-msg-result"]
    text = result["data"].get("messageText", "")
    if RESULT_LEGEND_OLD in text:
        result["data"]["messageText"] = text.replace(RESULT_LEGEND_OLD, RESULT_LEGEND_NEW)

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("OK: amount -> {user_amount}, cap_buttons, filter «Получите»")
    print("OK: parse -> btc_raw × user_amount / payment (карта, первая кнопка)")
    print("OK: calc без calc2, marker ✅, легенда обновлена")


if __name__ == "__main__":
    main()
