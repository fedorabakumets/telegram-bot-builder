"""
@fileoverview Патч Scooby: buy_btc_rub {user_amount}, парс BTC из inline desc, fee=0.
"""
import json
from pathlib import Path

PROJECT = Path("bots/новый_бот_1_242_163/project.json")


def main() -> None:
    """Обновляет inline query, parse и calc для ScoobyChange."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    nodes["bot-ub-scooby"]["data"]["query"] = "buy_btc_rub {user_amount}"

    nodes["bot-setv-parse-scooby"]["data"]["assignments"] = [
        {
            "id": "ps_btc",
            "mode": "regex_extract",
            "value": "{ub_inline_desc}",
            "pattern": "([\\d.]+)\\s*BTC",
            "variable": "scooby_btc",
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
            "id": "ps_rate",
            "mode": "expression",
            "value": "round(float({scooby_payment}) / float({scooby_btc}), 0) if float({scooby_btc}) > 0 else 0",
            "variable": "scooby_rate",
        },
    ]

    nodes["bot-setv-calc"]["data"]["assignments"] = [
        {
            "id": "init_arr",
            "mode": "text",
            "value": "[]",
            "variable": "bot_compare_results",
        },
        {
            "id": "fmt1",
            "mode": "format_number",
            "value": "{scooby_rate}",
            "variable": "scooby_rate_fmt",
        },
        {
            "id": "push_scooby",
            "mode": "json_push",
            "value": (
                '{"name": "ScoobyChange", "url": "https://t.me/scdoo_bot?start=7733607050", '
                '"rate": "{scooby_btc}", "raw_rate": "{scooby_rate_fmt}", "type": "🤖"}'
            ),
            "variable": "bot_compare_results",
            "skipIfEmpty": "",
        },
    ]

    nodes["tbl-init-comm-1"]["data"]["row"]["fee"] = "0"
    nodes["tbl-init-comm-1"]["data"]["row"]["comment"] = "inline buy_btc_rub — реальный BTC в desc"

    ex_row = nodes["tbl-init-bot-ex-1"]["data"]["row"]
    ex_row["inline_query"] = "buy_btc_rub {user_amount}"
    ex_row["rate_regex"] = "([\\d.]+)\\s*BTC"

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("OK: Scooby → buy_btc_rub {user_amount}, parse BTC из desc, fee=0")


if __name__ == "__main__":
    main()
