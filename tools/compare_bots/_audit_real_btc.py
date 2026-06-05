"""
@fileoverview Аудит: у каких ботов реальный BTC за 10k с карты.
"""
import json
import re
from pathlib import Path

d = json.loads(Path("bots/новый_бот_1_242_163/project.json").read_text(encoding="utf-8"))
sheet = next(s for s in d["sheets"] if s["id"] == "sheet-bots")
calc = next(n for n in sheet["nodes"] if n["id"] == "bot-setv-calc")

# btc variable per bot from json_push
push_btc: dict[str, str] = {}
for a in calc["data"]["assignments"]:
    if a.get("mode") != "json_push":
        continue
    m = re.search(r'"name": "([^"]+)".*"rate": "\{([^}]+)\}"', a["value"])
    if m:
        push_btc[m.group(1)] = m.group(2)

# classify parse logic
REAL_PAYMENT = "real_payment"  # btc_raw * amount / payment
REAL_BTC_PARSE = "real_btc"  # парсит итоговый BTC напрямую
REAL_INLINE = "real_inline"  # scooby-like inline desc + scale
RATE_ONLY = "rate_only"  # amount / rate (может быть рыночный)
RATE_DERIVED = "rate_derived"  # rate из btc, calc amount/rate

BOT_PARSE = {
    "scooby": "bot-setv-parse-scooby",
    "capitalist": "bot-setv-parse-capitalist",
    "24crypto": "bot-setv-parse-24crypto",
    "shaxta": "bot-setv-parse-shaxta",
    "bitmixer": "bot-setv-parse-bitmixer",
    "litebit": "bot-setv-parse-litebit",
    "sanchez": "bot-setv-parse-sanchez",
    "imperia": "bot-setv-parse-imperia",
    "viron": "bot-setv-parse-viron",
    "cf": "bot-setv-parse-cf",
    "vortex": "bot-setv-parse-vortex",
    "crazy": "bot-setv-parse-crazy",
    "inf": "bot-setv-parse-inf",
    "lucky": "bot-setv-parse-lucky",
    "love": "bot-setv-parse-love",
    "casper": "bot-setv-parse-casper",
    "monopoly": "bot-setv-parse-monopoly",
}

DISPLAY = {
    "scooby": "ScoobyChange",
    "capitalist": "Capitalist",
    "24crypto": "24Crypto",
    "shaxta": "Shaxta",
    "bitmixer": "BitMixer",
    "litebit": "LiteBit",
    "sanchez": "Sanchez",
    "imperia": "Империя",
    "viron": "VIRON",
    "cf": "CryptoFlow",
    "vortex": "Vortex",
    "crazy": "CrazyBTC",
    "inf": "INFINITY",
    "lucky": "Lucky",
    "love": "Love",
    "casper": "CASPER",
    "monopoly": "BTC Monopoly",
}


def classify(node_id: str, assignments: list) -> str:
    """Классифицирует способ расчёта BTC."""
    text = json.dumps(assignments, ensure_ascii=False)
    if "scooby_btc_raw" in text and "scooby_payment" in text and "user_amount" in text:
        return REAL_INLINE
    if "litebit_btc_raw" in text and "litebit_payment" in text and "user_amount" in text:
        return REAL_PAYMENT
    if "monopoly_btc" in text and "regex_extract" in text and "btc" in text.lower():
        return REAL_BTC_PARSE
    if "bitmixer_btc" in text and "regex_extract" in text:
        return REAL_BTC_PARSE
    if "cf_btc_raw" in text or "crazy_btc_raw" in text:
        return RATE_DERIVED
    if "_rate" in text and "regex_extract" in text:
        if "imperia" in node_id and "1.17" in text:
            return RATE_ONLY  # imperia *1.17 on rate
        return RATE_ONLY
    return "unknown"


real: list[str] = []
maybe: list[str] = []
market: list[str] = []

for key, nid in BOT_PARSE.items():
    node = next(n for n in sheet["nodes"] if n["id"] == nid)
    assigns = node["data"].get("assignments", [])
    kind = classify(nid, assigns)
    name = DISPLAY[key]
    if kind in (REAL_INLINE, REAL_PAYMENT):
        real.append(f"{name} ({kind})")
    elif kind == REAL_BTC_PARSE:
        maybe.append(f"{name} (парсит BTC — обычно реальный)")
    elif kind == RATE_DERIVED:
        maybe.append(f"{name} (BTC из текста → rate, calc amount/rate)")
    else:
        market.append(f"{name} (только курс ₽/BTC → amount/rate)")

print("=== РЕАЛЬНО за 10k с карты (payment scaling) ===", len([x for x in real]))
for x in real:
    print(" ", x)

print("\n=== СКОРЕЕ РЕАЛЬНЫЙ (парсят итоговый BTC) ===", len(maybe))
for x in maybe:
    print(" ", x)

print("\n=== СКОРЕЕ РЫНОЧНЫЙ (amount/rate, без доплаты) ===", len(market))
for x in market:
    print(" ", x)

print(f"\nИТОГО: {len(real)} точно + {len(maybe)} вероятно = {len(real)+len(maybe)}/{len(BOT_PARSE)}")
print(f"Нужно доработать: {len(market)}")
