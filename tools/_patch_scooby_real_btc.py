"""
@fileoverview Scooby: BTC за реальные user_amount ₽ с карты (btc_raw × amount / payment).
"""
import json
from pathlib import Path

PROJECT = Path("bots/новый_бот_1_242_163/project.json")


def main() -> None:
    """Пересчёт scooby_btc: сколько BTC за реальную оплату user_amount."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    parse = next(n for n in sheet["nodes"] if n["id"] == "bot-setv-parse-scooby")

    parse["data"]["assignments"] = [
        {
            "id": "ps_btc_raw",
            "mode": "regex_extract",
            "value": "{ub_inline_desc}",
            "pattern": "([\\d.]+)\\s*BTC",
            "variable": "scooby_btc_raw",
            "regexGroup": "1",
        },
        {
            "id": "ps_payment",
            "mode": "regex_extract",
            "value": "{ub_inline_title}",
            "pattern": "К оплате будет:\\s*([\\d\\s]+)",
            "variable": "scooby_payment_raw",
            "regexGroup": "1",
        },
        {
            "id": "ps_payment_clean",
            "mode": "expression",
            "value": "int('{scooby_payment_raw}'.replace(' ', '')) if '{scooby_payment_raw}' else 0",
            "variable": "scooby_payment",
        },
        {
            "id": "ps_btc_real",
            "mode": "expression",
            "value": (
                "round(float({scooby_btc_raw}) * float({user_amount}) / float({scooby_payment}), 8) "
                "if float({scooby_payment}) > 0 else 0"
            ),
            "variable": "scooby_btc",
        },
        {
            "id": "ps_rate",
            "mode": "expression",
            "value": (
                "round(float({user_amount}) / float({scooby_btc}), 0) "
                "if float({scooby_btc}) > 0 else 0"
            ),
            "variable": "scooby_rate",
        },
    ]

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("OK: scooby_btc = btc_raw × user_amount / payment (реальные 10k с карты)")


if __name__ == "__main__":
    main()
