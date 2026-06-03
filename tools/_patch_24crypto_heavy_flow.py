"""
@fileoverview 24Crypto: heavy flow (Купить→BTC→СБП→сумма→адрес→parse→Отменить).
"""
import json
import re
from copy import deepcopy
from pathlib import Path

PROJECT = Path("bots/новый_бот_1_242_163/project.json")
ENTITY = "@Exchange24Crypto_bot"
ADDRESS = "bc1q5at58r5qlwuclpvk4hv0c0wughe69evxle068q"
BASE_X, BASE_Y = 5600, 400

CRYPTO24_PARSE = [
    {
        "id": "p24_payment_raw",
        "mode": "regex_extract",
        "value": "{crypto24_order_text}",
        "pattern": "Сумма\\s*[-–—➖]\\s*[`\\*]*([\\d\\s]+)[`\\*]*\\s*р",
        "variable": "crypto24_payment_raw",
        "regexGroup": "1",
    },
    {
        "id": "p24_payment",
        "mode": "expression",
        "value": (
            "int('{crypto24_payment_raw}'.replace(' ', '')) "
            "if '{crypto24_payment_raw}' else 0"
        ),
        "variable": "crypto24_payment",
    },
    {
        "id": "p24_btc_raw",
        "mode": "regex_extract",
        "value": "{crypto24_order_text}",
        "pattern": "К получению\\s*[-–—➖]\\s*[`\\*]*([\\d.]+)[`\\*]*\\s*BTC",
        "variable": "crypto24_btc_raw",
        "regexGroup": "1",
    },
    {
        "id": "p24_btc",
        "mode": "expression",
        "value": (
            "round(float({crypto24_btc_raw}) * float({user_amount}) / "
            "float({crypto24_payment}), 8) if float({crypto24_payment}) > 0 else 0"
        ),
        "variable": "crypto24_btc",
    },
    {
        "id": "p24_rate",
        "mode": "expression",
        "value": (
            "round(float({user_amount}) / float({crypto24_btc}), 0) "
            "if float({crypto24_btc}) > 0 else 0"
        ),
        "variable": "crypto24_rate",
    },
]

LEGEND_OLD = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): 24Crypto, Shaxta, Sanchez, BitMixer, CryptoFlow, Vortex, INFINITY, Lucky, Love, CASPER, Monopoly"
)

LEGEND_NEW = (
    "✅ <b>С комиссией</b> (реальный пересчёт): ScoobyChange, LiteBit, Capitalist, 24Crypto\n"
    "⚠️ <b>Базовый курс</b> (комиссия может не учтена): Shaxta, Sanchez, BitMixer, CryptoFlow, Vortex, INFINITY, Lucky, Love, CASPER, Monopoly"
)


def click_node(nid: str, click_value: str, target: str, y: int) -> dict:
    """Создаёт ноду userbot_click_button."""
    return {
        "id": nid,
        "type": "userbot_click_button",
        "position": {"x": BASE_X, "y": y},
        "data": {
            "buttons": [],
            "markdown": False,
            "adminOnly": False,
            "clickMode": "text",
            "messageId": "",
            "messageIdSource": "last",
            "clickValue": click_value,
            "showInMenu": True,
            "messageText": "",
            "saveAlertTo": "",
            "saveMediaTo": "",
            "keyboardType": "none",
            "requiresAuth": False,
            "saveResultTo": "",
            "isPrivateOnly": False,
            "saveButtonsTo": "",
            "userbotEntity": ENTITY,
            "resizeKeyboard": True,
            "saveHasMediaTo": "",
            "oneTimeKeyboard": False,
            "autoTransitionTo": target,
            "enableStatistics": True,
            "responseStrategy": "new_message",
            "enableAutoTransition": True,
        },
    }


def message_node(
    nid: str,
    text: str,
    target: str,
    y: int,
    *,
    save_text: str = "",
    filter_regex: str = "",
    wait: int = 5,
    strategy: str = "regex_match",
) -> dict:
    """Создаёт ноду userbot_message."""
    data: dict = {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "formatMode": "html",
        "showInMenu": True,
        "messageText": text,
        "keyboardType": "none",
        "requiresAuth": False,
        "attachedMedia": [],
        "isPrivateOnly": False,
        "userbotEntity": ENTITY,
        "resizeKeyboard": True,
        "oneTimeKeyboard": False,
        "saveMessageIdTo": "ub_sent_msg_id",
        "autoTransitionTo": target,
        "enableStatistics": True,
        "responseStrategy": strategy,
        "saveResponseIdTo": f"{nid.rsplit('-', 1)[-1]}_resp",
        "disableLinkPreview": False,
        "responseWaitSeconds": wait,
        "enableAutoTransition": True,
    }
    if save_text:
        data["saveResponseTextTo"] = save_text
    if filter_regex:
        data["responseFilterRegex"] = filter_regex
    return {"id": nid, "type": "userbot_message", "position": {"x": BASE_X, "y": y}, "data": data}


def upsert_node(nodes: list[dict], node: dict) -> None:
    """Добавляет или заменяет ноду по id."""
    for i, n in enumerate(nodes):
        if n["id"] == node["id"]:
            nodes[i] = node
            return
    nodes.append(node)


def main() -> None:
    """Патчит heavy flow 24Crypto."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes_list = sheet["nodes"]
    nodes = {n["id"]: n for n in nodes_list}

    upsert_node(nodes_list, click_node("bot-ub-24crypto-btc", "BTC", "bot-ub-24crypto-pay", BASE_Y + 80))
    upsert_node(nodes_list, click_node("bot-ub-24crypto-pay", "СБП", "bot-ub-24crypto-amount", BASE_Y + 160))
    upsert_node(
        nodes_list,
        message_node(
            "bot-ub-24crypto-amount",
            "{user_amount}",
            "bot-ub-24crypto-address",
            BASE_Y + 240,
            filter_regex="адрес",
            wait=8,
        ),
    )
    upsert_node(
        nodes_list,
        message_node(
            "bot-ub-24crypto-address",
            ADDRESS,
            "bot-setv-parse-24crypto",
            BASE_Y + 320,
            save_text="crypto24_order_text",
            filter_regex="заявк",
            wait=12,
            strategy="longest",
        ),
    )
    upsert_node(
        nodes_list,
        message_node(
            "bot-ub-24crypto-cancel",
            "Отменить сделку",
            "bot-ub-shaxta-start",
            BASE_Y + 480,
            wait=4,
            strategy="first",
        ),
    )

    click = nodes["bot-ub-24crypto-click"]
    click["data"]["clickValue"] = "Купить"
    click["data"]["messageId"] = ""
    click["data"]["messageIdSource"] = "last"
    click["data"]["responseStrategy"] = "new_message"
    click["data"]["autoTransitionTo"] = "bot-ub-24crypto-btc"
    click["position"] = {"x": BASE_X, "y": BASE_Y}

    parse = nodes["bot-setv-parse-24crypto"]
    parse["data"]["assignments"] = CRYPTO24_PARSE
    parse["data"]["autoTransitionTo"] = "bot-ub-24crypto-cancel"
    parse["data"]["enableAutoTransition"] = True

    clean = nodes["bot-setv-24crypto-clean"]
    clean["data"]["autoTransitionTo"] = "bot-ub-shaxta-start"

    calc = nodes["bot-setv-calc"]
    calc["data"]["assignments"] = [a for a in calc["data"]["assignments"] if a.get("id") != "calc3"]
    for a in calc["data"]["assignments"]:
        if a.get("id") == "push_crypto24":
            a["value"] = a["value"].replace('"marker": "⚠️"', '"marker": "✅"')

    result = nodes["bot-msg-result"]
    text = result["data"].get("messageText", "")
    if LEGEND_OLD in text:
        result["data"]["messageText"] = text.replace(LEGEND_OLD, LEGEND_NEW)

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print("OK: Купить → BTC → СБП → {user_amount} → адрес → parse → Отменить")
    print("OK: crypto24_btc = btc_raw × user_amount / payment, marker ✅")


if __name__ == "__main__":
    main()
