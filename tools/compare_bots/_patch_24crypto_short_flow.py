"""
@fileoverview 24Crypto: короткий flow — Купить→BTC→СБП→parse «Текущий курс»→btc=amount/rate.
"""
import json
from pathlib import Path

PROJECT = Path("bots/новый_бот_1_242_163/project.json")

CRYPTO24_PARSE = [
    {
        "id": "p24_rate_raw",
        "mode": "regex_extract",
        "value": "{crypto24_rate_text}",
        "pattern": "Текущий курс\\s*1\\s*BTC\\s*=\\s*([\\d][\\d\\s.,]*)",
        "variable": "crypto24_rate_raw",
        "regexGroup": "1",
    },
    {
        "id": "p24_rate_clean",
        "mode": "expression",
        "value": (
            "float('{crypto24_rate_raw}'.replace(' ', '').replace('\\xa0', '').replace(',', '.')) "
            "if '{crypto24_rate_raw}' else 0"
        ),
        "variable": "crypto24_rate",
    },
    {
        "id": "p24_btc",
        "mode": "expression",
        "value": (
            "round(float({user_amount}) / float({crypto24_rate}), 8) "
            "if float({crypto24_rate}) > 0 else 0"
        ),
        "variable": "crypto24_btc",
    },
]


def main() -> None:
    """Короткий flow без заявки и отмены."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    pay = nodes["bot-ub-24crypto-pay"]
    pay["data"]["saveResultTo"] = "crypto24_rate_text"
    pay["data"]["autoTransitionTo"] = "bot-setv-parse-24crypto"

    parse = nodes["bot-setv-parse-24crypto"]
    parse["data"]["assignments"] = CRYPTO24_PARSE
    parse["data"]["autoTransitionTo"] = "bot-ub-shaxta-start"
    parse["data"]["enableAutoTransition"] = True

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("OK: pay(СБП) -> parse «Текущий курс» -> shaxta")
    print("OK: crypto24_btc = user_amount / rate (без заявки)")


if __name__ == "__main__":
    main()
