"""
@fileoverview INFINITY: реальный BTC как Love — «Вы получите» × amount / «К оплате».
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from project_path import PROJECT

import json

INF_PARSE = [
    {
        "id": "pi_btc_equiv_raw",
        "mode": "regex_extract",
        "value": "{inf_text}",
        "pattern": (
            "[Пп]лат[её]жные\\s+данные[\\s\\S]*?"
            "[Пп]олучите[^0-9]*([\\d.]+)\\s*BTC"
        ),
        "variable": "inf_btc_equiv_raw",
        "regexGroup": "1",
    },
    {
        "id": "pi_btc_equiv",
        "mode": "expression",
        "value": (
            "float('{inf_btc_equiv_raw}') if '{inf_btc_equiv_raw}' else 0"
        ),
        "variable": "inf_btc_equiv",
    },
    {
        "id": "pi_payment_raw",
        "mode": "regex_extract",
        "value": "{inf_text}",
        "pattern": "[Кк]\\s*оплате[^0-9]*(\\d{4,6})",
        "variable": "inf_payment_raw",
        "regexGroup": "1",
    },
    {
        "id": "pi_payment",
        "mode": "expression",
        "value": (
            "int({inf_payment_raw}) if int({inf_payment_raw}) > 0 "
            "else int({user_amount})"
        ),
        "variable": "inf_payment",
    },
    {
        "id": "pi_btc",
        "mode": "expression",
        "value": (
            "round(float({inf_btc_equiv}) * float({user_amount}) / "
            "float({inf_payment}), 8) if float({inf_payment}) > 0 else 0"
        ),
        "variable": "inf_btc",
    },
    {
        "id": "pi_rate",
        "mode": "expression",
        "value": (
            "round(float({user_amount}) / float({inf_btc}), 0) "
            "if float({inf_btc}) > 0 else 0"
        ),
        "variable": "inf_rate",
    },
]

LEGEND_OLD = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist, 24Crypto, Love, CrazyBTC, Lucky\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): Shaxta, Sanchez, BitMixer, CryptoFlow, "
    "Vortex, INFINITY, CASPER, Monopoly"
)

LEGEND_NEW = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist, 24Crypto, Love, CrazyBTC, Lucky, INFINITY\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): Shaxta, Sanchez, BitMixer, CryptoFlow, "
    "Vortex, CASPER, Monopoly"
)

# INFINITY редактирует одно сообщение — edit быстрее, чем new_message (8 с таймаут)
CLICK_FIXES = {
    "bot-ub-inf-buy": {
        "clickMode": "text",
        "clickValue": "Купить",
        "responseStrategy": "edit",
    },
    "bot-ub-inf-btc": {
        "clickMode": "text",
        "clickValue": "BTC",
        "responseStrategy": "edit",
    },
    "bot-ub-inf-card": {
        "clickMode": "text",
        "clickValue": "Банковская",
        "responseStrategy": "edit",
    },
}


def main() -> None:
    """Патчит amount-узел, parse, calc и маркер INFINITY."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    for node_id, fixes in CLICK_FIXES.items():
        nodes[node_id]["data"].update(fixes)

    amount = nodes["bot-ub-inf-amount"]
    amount["data"]["responseStrategy"] = "regex_match"
    amount["data"]["responseFilterRegex"] = "Платёжные данные"
    amount["data"]["responseWaitSeconds"] = 10
    amount["data"]["waitSeconds"] = 10
    amount["data"]["saveResponseTextTo"] = "inf_text"

    parse = nodes["bot-setv-parse-inf"]
    parse["data"]["assignments"] = INF_PARSE

    calc = nodes["bot-setv-calc"]
    calc["data"]["assignments"] = [
        a for a in calc["data"]["assignments"] if a.get("id") != "calc_inf"
    ]

    for a in calc["data"]["assignments"]:
        if a.get("id") == "push_inf":
            a["value"] = a["value"].replace('"marker": "⚠️"', '"marker": "✅"')

    result = nodes["bot-msg-result"]
    text = result["data"].get("messageText", "")
    if LEGEND_OLD in text:
        result["data"]["messageText"] = text.replace(LEGEND_OLD, LEGEND_NEW)

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("OK: buy/btc/card — text, responseStrategy edit")
    print("OK: parse equiv*amount/payment -> inf_btc, inf_rate")
    print("OK: amount regex_match, wait 10s")
    print("OK: calc without calc_inf, marker ok, legend updated")


if __name__ == "__main__":
    main()
