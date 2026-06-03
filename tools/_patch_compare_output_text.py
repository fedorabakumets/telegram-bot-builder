"""
@fileoverview Обновление текста вывода сравнения ботов: пояснения, маркеры, ₽/BTC.
"""
import json
import re
from pathlib import Path

PROJECT = Path("bots/новый_бот_1_242_163/project.json")

# ✅ — реальный BTC за 10k с карты; ⚠️ — базовый курс (может быть завышено)
BOT_MARKERS = {
    "ScoobyChange": "✅",
    "LiteBit": "✅",
    "BitMixer": "✅",
    "CryptoFlow": "✅",
    "CrazyBTC": "✅",
    "BTC Monopoly": "✅",
    "Capitalist": "⚠️",
    "24Crypto": "⚠️",
    "Shaxta": "⚠️",
    "Sanchez": "⚠️",
    "Империя": "⚠️",
    "VIRON": "⚠️",
    "Vortex": "⚠️",
    "INFINITY": "⚠️",
    "Lucky": "⚠️",
    "Love": "⚠️",
    "CASPER": "⚠️",
}

RESULT_MESSAGE = """{compare_title_short}

📊 <b>СБП/Карта → Bitcoin</b>
💰 Платите: <b>{user_amount_fmt} ₽</b> с карты

ℹ️ <b>Как читать</b>
• <b>BTC</b> — сколько bitcoin получите за ваши {user_amount_fmt} ₽
• <b>(… ₽/BTC)</b> — курс: {user_amount_fmt} ÷ BTC (чем ниже — выгоднее)
• Сортировка: больше BTC = лучше

✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit
✅ <b>Итоговый BTC</b> из ответа бота: BitMixer, CryptoFlow, CrazyBTC, Monopoly
⚠️ <b>Базовый курс</b> (комиссия может не учтена): Capitalist, 24Crypto, Shaxta, Sanchez, Империя, VIRON, Vortex, INFINITY, Lucky, Love, CASPER

{bot_rates_text}
👆 <i>Нажми на название для перехода</i>"""

FORMAT_LINE = (
    '{item.marker} <a href="{item.url}">{item.name}</a>: '
    '<b>{item.rate} BTC</b> ({item.raw_rate} ₽/BTC)\n'
)


def patch_json_push(value: str) -> str:
    """Добавляет marker в json_push объект."""
    m = re.search(r'"name": "([^"]+)"', value)
    if not m:
        return value
    name = m.group(1)
    marker = BOT_MARKERS.get(name, "⚠️")
    if '"marker"' in value:
        value = re.sub(r'"marker": "[^"]*"', f'"marker": "{marker}"', value)
    else:
        value = value.replace(
            f'"name": "{name}"',
            f'"name": "{name}", "marker": "{marker}"',
        )
    return value


def main() -> None:
    """Обновляет bot-msg-result и bot-setv-format."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")

    result = next(n for n in sheet["nodes"] if n["id"] == "bot-msg-result")
    result["data"]["messageText"] = RESULT_MESSAGE

    fmt = next(n for n in sheet["nodes"] if n["id"] == "bot-setv-format")
    for a in fmt["data"]["assignments"]:
        if a.get("id") == "fmt_bots":
            a["value"] = FORMAT_LINE

    calc = next(n for n in sheet["nodes"] if n["id"] == "bot-setv-calc")
    for a in calc["data"]["assignments"]:
        if a.get("mode") == "json_push":
            a["value"] = patch_json_push(a["value"])

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("OK: bot-msg-result — пояснения")
    print("OK: формат строки — ✅/⚠️ и ₽/BTC")
    print(f"OK: маркеры в {len(BOT_MARKERS)} json_push")


if __name__ == "__main__":
    main()
