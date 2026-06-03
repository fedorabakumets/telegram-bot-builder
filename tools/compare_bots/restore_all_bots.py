"""
@fileoverview Восстановление цепочки 15 ботов (без Империи/VIRON), полный calc, маркеры.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from project_path import PROJECT

import json
import re

REAL_BOTS = {
    "ScoobyChange",
    "LiteBit",
    "Capitalist",
    "24Crypto",
    "Love",
    "CrazyBTC",
    "Lucky",
}

# crazy_btc, love_btc, lucky_btc считаются в parse-нодах
RATE_CALC_IDS = {
    "calc3": "crypto24",
    "calc4": "shaxta",
    "calc5": "sanchez",
    "calc_cf": "cf",
    "calc_vortex": "vortex",
    "calc_inf": "inf",
        "calc_casper": "casper",
}

PUSH_BOTS = [
    ("push_scooby", "ScoobyChange", "scooby_btc", "scooby_rate_fmt",
     "https://t.me/scdoo_bot?start=7733607050"),
    ("push_capitalist", "Capitalist", "capitalist_btc", "capitalist_rate_fmt",
     "https://t.me/btccapital_bot?start=7733607050"),
    ("push_crypto24", "24Crypto", "crypto24_btc", "crypto24_rate_fmt",
     "https://t.me/Exchange24Crypto_bot?start=r-7733607050"),
    ("push_shaxta", "Shaxta", "shaxta_btc", "shaxta_rate_fmt",
     "https://t.me/shaxta24_bot?start=r-7733607050"),
    ("push_bitmixer", "BitMixer", "bitmixer_btc", "bitmixer_rate_fmt",
     "https://t.me/bitmixerac_bot?start=7a88e5da"),
    ("push_litebit", "LiteBit", "litebit_btc", "litebit_rate_fmt",
     "https://t.me/litebitbit_bot?start=7733607050"),
    ("push_sanchez", "Sanchez", "sanchez_btc", "sanchez_rate_fmt",
     "https://t.me/Sanchez_exchange_bot?start=REF_IED1WL"),
    ("push_cf", "CryptoFlow", "cf_btc", "cf_rate_fmt",
     "https://t.me/Crypto_Flow_exchange_bot?start=ref7733607050"),
    ("push_vortex", "Vortex", "vortex_btc", "vortex_rate_fmt",
     "https://t.me/vrtxbtc_bot?start=7733607050"),
    ("push_crazy", "CrazyBTC", "crazy_btc", "crazy_rate_fmt",
     "https://t.me/BTCrzyBOT?start=7733607050"),
    ("push_inf", "INFINITY", "inf_btc", "inf_rate_fmt",
     "https://t.me/Infinity_exchange_bot?start=jBmKj8kM8Z"),
    ("push_lucky", "Lucky", "lucky_btc", "lucky_rate_fmt",
     "https://t.me/LuckyExchange_Bot?start=ref_cmj72beqs0001lz016qurlvoz"),
    ("push_love", "Love", "love_btc", "love_rate_fmt",
     "https://t.me/Exchange_Love_Bot?start=ref_7733607050"),
    ("push_casper", "CASPER", "casper_btc", "casper_rate_fmt",
     "https://t.me/casper_btc_bot?start=jDr1Wi8Y"),
    ("push_monopoly", "BTC Monopoly", "monopoly_btc", "monopoly_rate_fmt",
     "https://t.me/BTC_Monopoly_bot?start=7733607050"),
]

LEGEND = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist, 24Crypto, Love, CrazyBTC, Lucky\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): Shaxta, Sanchez, BitMixer, CryptoFlow, "
    "Vortex, INFINITY, CASPER, Monopoly"
)


def rate_expr(prefix: str) -> str:
    """BTC из курса: amount / rate."""
    return (
        f"round({{user_amount}} / float({{{prefix}_rate}}), 8) "
        f"if float({{{prefix}_rate}}) > 0 else 0"
    )


def fmt_assign(aid: str, src: str, dest: str) -> dict:
    """Форматирование числа для вывода."""
    return {"id": aid, "mode": "format_number", "value": f"{{{src}}}", "variable": dest}


def push_assign(aid: str, name: str, btc: str, raw: str, url: str) -> dict:
    """Добавление бота в массив сравнения."""
    marker = "✅" if name in REAL_BOTS else "⚠️"
    value = (
        f'{{"name": "{name}", "marker": "{marker}", "url": "{url}", '
        f'"rate": "{{{btc}}}", "raw_rate": "{{{raw}}}", "type": "🤖"}}'
    )
    return {
        "id": aid,
        "mode": "json_push",
        "value": value,
        "variable": "bot_compare_results",
        "skipIfEmpty": "",
    }


def build_calc_assignments() -> list[dict]:
    """Полный список assignments для bot-setv-calc."""
    out: list[dict] = [
        {"id": "init_arr", "mode": "text", "value": "[]", "variable": "bot_compare_results"},
    ]
    for cid, prefix in RATE_CALC_IDS.items():
        out.append(
            {
                "id": cid,
                "mode": "expression",
                "value": rate_expr(prefix),
                "variable": f"{prefix}_btc",
            }
        )
    out.extend(
        [
            fmt_assign("fmt1", "scooby_rate", "scooby_rate_fmt"),
            fmt_assign("fmt2", "capitalist_rate", "capitalist_rate_fmt"),
            fmt_assign("fmt3", "crypto24_rate", "crypto24_rate_fmt"),
            fmt_assign("fmt4", "user_amount", "user_amount_fmt"),
            fmt_assign("fmt5", "shaxta_rate", "shaxta_rate_fmt"),
            fmt_assign("fmt6", "bitmixer_rate", "bitmixer_rate_fmt"),
            fmt_assign("fmt7", "litebit_rate", "litebit_rate_fmt"),
            fmt_assign("fmt8", "sanchez_rate", "sanchez_rate_fmt"),
            fmt_assign("fmt_cf", "cf_rate", "cf_rate_fmt"),
            fmt_assign("fmt_vortex", "vortex_rate", "vortex_rate_fmt"),
            fmt_assign("fmt_crazy", "crazy_rate", "crazy_rate_fmt"),
            fmt_assign("fmt_inf", "inf_rate", "inf_rate_fmt"),
            fmt_assign("fmt_lucky", "lucky_rate", "lucky_rate_fmt"),
            fmt_assign("fmt_love", "love_rate", "love_rate_fmt"),
            fmt_assign("fmt_casper", "casper_rate", "casper_rate_fmt"),
        ]
    )
    for pid, name, btc, raw, url in PUSH_BOTS:
        out.append(push_assign(pid, name, btc, raw, url))
    out.extend(
        [
            {
                "id": "calc_monopoly_rate",
                "mode": "expression",
                "value": (
                    "int(float({user_amount}) / float({monopoly_btc})) "
                    "if float({monopoly_btc}) > 0 else 0"
                ),
                "variable": "monopoly_rate",
            },
            fmt_assign("fmt_monopoly_rate", "monopoly_rate", "monopoly_rate_fmt"),
        ]
    )
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

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    nodes["bot-setv-init"]["data"]["autoTransitionTo"] = "bot-ub-scooby"
    nodes["bot-setv-parse-scooby"]["data"]["autoTransitionTo"] = "bot-ub-capitalist-start"
    nodes["bot-setv-parse-scooby"]["data"]["enableAutoTransition"] = True
    nodes["bot-setv-parse-capitalist"]["data"]["autoTransitionTo"] = "bot-ub-24crypto-start"
    nodes["bot-setv-parse-capitalist"]["data"]["enableAutoTransition"] = True
    nodes["bot-setv-parse-24crypto"]["data"]["autoTransitionTo"] = "bot-setv-24crypto-clean"
    nodes["bot-setv-parse-24crypto"]["data"]["enableAutoTransition"] = True
    nodes["bot-setv-24crypto-clean"]["data"]["autoTransitionTo"] = "bot-ub-shaxta-start"
    nodes["bot-setv-24crypto-clean"]["data"]["enableAutoTransition"] = True
    nodes["bot-setv-parse-sanchez"]["data"]["autoTransitionTo"] = "bot-ub-cf-start"
    nodes["bot-setv-parse-sanchez"]["data"]["enableAutoTransition"] = True
    nodes["bot-setv-parse-love"]["data"]["autoTransitionTo"] = "bot-ub-casper-start"
    nodes["bot-setv-parse-love"]["data"]["enableAutoTransition"] = True
    nodes["bot-setv-parse-crazy"]["data"]["autoTransitionTo"] = "bot-ub-inf-start"
    nodes["bot-setv-parse-crazy"]["data"]["enableAutoTransition"] = True
    nodes["bot-setv-parse-monopoly"]["data"]["autoTransitionTo"] = "bot-setv-calc"
    nodes["bot-setv-parse-monopoly"]["data"]["enableAutoTransition"] = True

    nodes["bot-setv-calc"]["data"]["assignments"] = build_calc_assignments()
    nodes["bot-setv-calc"]["data"]["autoTransitionTo"] = "bot-setv-format"
    nodes["bot-setv-calc"]["data"]["enableAutoTransition"] = True

    result = nodes["bot-msg-result"]
    result["data"]["messageText"] = patch_legend(result["data"].get("messageText", ""))

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    pushes = [a for a in nodes["bot-setv-calc"]["data"]["assignments"] if a.get("mode") == "json_push"]
    print(f"OK: {len(pushes)} bots in calc (no Imperia/VIRON)")
    print("OK: init -> scooby -> ... -> crazy -> inf -> love -> casper -> monopoly -> calc")
    for a in pushes:
        match = re.search(r'"name": "([^"]+)".*"marker": "([^"]+)"', a["value"])
        if match:
            sym = "OK" if match.group(2) == "\u2705" else "WARN"
            print(f"  [{sym}] {match.group(1)}")


if __name__ == "__main__":
    main()
