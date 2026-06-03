"""
@fileoverview Восстановление цепочки 15 ботов (без Империи/VIRON), фиксы parse, маркеры.
"""
import json
import re
from copy import deepcopy
from pathlib import Path

PROJECT = Path("bots/новый_бот_1_242_163/project.json")
BAK = Path("bots/новый_бот_1_242_163/project.json.bak")

SKIP_CALC_IDS = {"calc1", "calc2", "calc_imp", "fmt_imp", "push_imperia", "calc_viron", "fmt_viron", "push_viron"}

RATE_CALCS = {
    "calc3": "crypto24",
    "calc4": "shaxta",
    "calc5": "sanchez",
    "calc_cf": "cf",
    "calc_vortex": "vortex",
    "calc_crazy": "crazy",
    "calc_inf": "inf",
    "calc_lucky": "lucky",
    "calc_love": "love",
    "calc_casper": "casper",
}

REAL_BOTS = {"ScoobyChange", "LiteBit", "Capitalist", "24Crypto"}

LEGEND = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist, 24Crypto\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): Shaxta, Sanchez, BitMixer, CryptoFlow, Vortex, INFINITY, Lucky, Love, CASPER, Monopoly"
)


def rate_expr(prefix: str) -> str:
    """BTC из курса без fee."""
    return (
        f"round({{user_amount}} / float({{{prefix}_rate}}), 8) "
        f"if float({{{prefix}_rate}}) > 0 else 0"
    )


def patch_json_push(value: str) -> str:
    """Маркер ✅ только для проверенных ботов."""
    match = re.search(r'"name": "([^"]+)"', value)
    if not match:
        return value
    name = match.group(1)
    marker = "✅" if name in REAL_BOTS else "⚠️"
    if '"marker"' in value:
        return re.sub(r'"marker": "[^"]*"', f'"marker": "{marker}"', value)
    return value.replace(f'"name": "{name}"', f'"name": "{name}", "marker": "{marker}"')


def build_calc_assignments(bak_assignments: list[dict]) -> list[dict]:
    """Calc без fee, без scooby/capitalist/crypto24/imperia/viron calc."""
    out: list[dict] = []
    for a in bak_assignments:
        aid = a.get("id", "")
        if aid.startswith("fee_") or aid in SKIP_CALC_IDS:
            continue
        if aid in RATE_CALCS:
            out.append({**a, "value": rate_expr(RATE_CALCS[aid])})
            continue
        if a.get("mode") == "json_push":
            out.append({**a, "value": patch_json_push(a["value"])})
            continue
        out.append(deepcopy(a))
    return out


def patch_legend(text: str) -> str:
    """Обновляет блок легенды в bot-msg-result."""
    start = text.find("✅ <b>С комиссией</b>")
    end = text.find("{bot_rates_text}")
    if start == -1 or end == -1:
        return text
    return text[:start] + LEGEND + "\n\n" + text[end:]


def main() -> None:
    """Восстанавливает цепочку без Империи/VIRON."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)
    with BAK.open(encoding="utf-8") as f:
        bak = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    bak_sheet = next(s for s in bak["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    bak_calc = next(n for n in bak_sheet["nodes"] if n["id"] == "bot-setv-calc")
    assignments = build_calc_assignments(bak_calc["data"]["assignments"])

    nodes["bot-setv-init"]["data"]["autoTransitionTo"] = "bot-ub-scooby"
    nodes["bot-setv-parse-scooby"]["data"]["autoTransitionTo"] = "bot-ub-capitalist-start"
    nodes["bot-setv-parse-scooby"]["data"]["enableAutoTransition"] = True
    nodes["bot-setv-parse-capitalist"]["data"]["autoTransitionTo"] = "bot-ub-24crypto-start"
    nodes["bot-setv-parse-capitalist"]["data"]["enableAutoTransition"] = True
    nodes["bot-setv-parse-24crypto"]["data"]["autoTransitionTo"] = "bot-setv-24crypto-clean"
    nodes["bot-setv-parse-24crypto"]["data"]["enableAutoTransition"] = True
    nodes["bot-setv-parse-sanchez"]["data"]["autoTransitionTo"] = "bot-ub-cf-start"
    nodes["bot-setv-parse-sanchez"]["data"]["enableAutoTransition"] = True

    nodes["bot-setv-calc"]["data"]["assignments"] = assignments
    nodes["bot-setv-calc"]["data"]["autoTransitionTo"] = "bot-setv-format"
    nodes["bot-setv-calc"]["data"]["enableAutoTransition"] = True

    result = nodes["bot-msg-result"]
    result["data"]["messageText"] = patch_legend(result["data"].get("messageText", ""))

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    pushes = [a for a in assignments if a.get("mode") == "json_push"]
    print(f"OK: {len(pushes)} ботов в calc (без Империи/VIRON)")
    print("OK: init -> scooby -> ... -> calc -> format")
    print("OK: sanchez -> CryptoFlow, parse-24crypto -> shaxta")
    for a in pushes:
        match = re.search(r'"name": "([^"]+)".*"marker": "([^"]+)"', a["value"])
        if match:
            print(f"  {match.group(2)} {match.group(1)}")


if __name__ == "__main__":
    main()
