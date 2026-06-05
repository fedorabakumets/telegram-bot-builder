"""
@fileoverview 24Crypto и Shaxta: только «Актуальные курсы» (без heavy flow покупки).
"""
import json
from pathlib import Path

PROJECT = Path("bots/новый_бот_1_242_163/project.json")

CRYPTO24_PARSE = [
    {
        "id": "p24_1",
        "mode": "regex_extract",
        "value": "{crypto24_text}",
        "pattern": "Покупка BTC:\\s*([\\d][\\d\\s.,]*[\\d])",
        "variable": "crypto24_rate",
        "regexGroup": "1",
    },
]

CALC3 = {
    "id": "calc3",
    "mode": "expression",
    "value": (
        "round({user_amount} / float({crypto24_rate}), 8) "
        "if float({crypto24_rate}) > 0 else 0"
    ),
    "variable": "crypto24_btc",
}


def main() -> None:
    """Возвращает light flow для 24Crypto; Shaxta без изменений."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    click24 = nodes["bot-ub-24crypto-click"]
    click24["data"]["clickValue"] = "Актуальные курсы"
    click24["data"]["saveResultTo"] = "crypto24_text"
    click24["data"]["messageIdSource"] = "last"
    click24["data"]["autoTransitionTo"] = "bot-setv-parse-24crypto"
    click24["data"]["responseStrategy"] = "new_message"

    parse24 = nodes["bot-setv-parse-24crypto"]
    parse24["data"]["assignments"] = CRYPTO24_PARSE
    parse24["data"]["autoTransitionTo"] = "bot-setv-24crypto-clean"
    parse24["data"]["enableAutoTransition"] = True

    nodes["bot-setv-24crypto-clean"]["data"]["autoTransitionTo"] = "bot-ub-shaxta-start"

    click_sh = nodes["bot-ub-shaxta-click"]
    click_sh["data"]["clickValue"] = "Актуальные курсы"
    click_sh["data"]["saveResultTo"] = "shaxta_text"
    click_sh["data"]["autoTransitionTo"] = "bot-setv-parse-shaxta"

    calc = nodes["bot-setv-calc"]
    ids = {a.get("id") for a in calc["data"]["assignments"]}
    if "calc3" not in ids:
        new_calc: list[dict] = []
        for a in calc["data"]["assignments"]:
            if a.get("id") == "push_crypto24":
                new_calc.append(CALC3)
            new_calc.append(a)
        calc["data"]["assignments"] = new_calc

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("OK: 24Crypto - Aktualnye kursy -> parse -> clean -> shaxta")
    print("OK: Shaxta - Aktualnye kursy")
    print("OK: calc3 - crypto24_btc = user_amount / rate")


if __name__ == "__main__":
    main()
