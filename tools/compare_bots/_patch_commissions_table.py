"""
@fileoverview Патч project.json: schedule_trigger + bot_table цепочка bot_commissions
"""
import json
from pathlib import Path

PROJECT = Path("bots/новый_бот_1_242_163/project.json")

# fee — наценка: payment ≈ amount × (1 + fee), effective_btc = btc_raw / (1 + fee)
COMMISSIONS = [
    ("@scdoo_bot", "ScoobyChange", "0", "уточнить"),
    ("@btccapital_bot", "Capitalist", "0", "скорее реальный курс"),
    ("@Exchange24Crypto_bot", "24Crypto", "0", "уточнить"),
    ("@shaxta24_bot", "Shaxta", "0", "уточнить"),
    ("@bitmixerac_bot", "BitMixer", "0", "реальный курс"),
    ("@litebitbit_bot", "LiteBit", "0.255", "10k→12551, flow Купить"),
    ("@Sanchez_exchange_bot", "Sanchez", "0.353", "10k→13530, экран суммы сделки"),
    ("@IMPERIA_OBMENA_BOT", "Империя", "0", "уточнить"),
    ("@popol_ni_bot", "VIRON", "0", "уточнить"),
    ("@Crypto_Flow_exchange_bot", "CryptoFlow", "0", "реальный курс"),
    ("@vrtxbtc_bot", "Vortex", "0", "уточнить"),
    ("@BTCrzyBOT", "CrazyBTC", "0", "реальный курс"),
    ("@Infinity_exchange_bot", "INFINITY", "0", "уточнить"),
    ("@LuckyExchange_Bot", "Lucky", "0", "уточнить"),
    ("@Exchange_Love_Bot", "Love", "0", "уточнить"),
    ("@casper_btc_bot", "CASPER", "0", "уточнить"),
    ("@Btc_Monopoly_bot", "BTC Monopoly", "0", "реальный курс"),
]


def bot_table_base() -> dict:
    """Базовые поля bot_table ноды."""
    return {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "operation": "upsert",
        "tableName": "bot_commissions",
        "onConflict": "ignore",
        "showInMenu": False,
        "messageText": "",
        "keyboardType": "none",
        "requiresAuth": False,
        "isPrivateOnly": False,
        "resizeKeyboard": True,
        "oneTimeKeyboard": False,
        "enableStatistics": False,
        "key": "username",
        "where": [],
        "updates": [],
        "saveResultTo": "",
        "resultFormat": "first_row",
        "returnColumns": [],
        "orderBy": "",
        "orderDirection": "desc",
        "limit": 0,
        "offset": 0,
        "aggregateColumn": "",
        "returnInsertedId": False,
    }


def make_upsert_node(node_id: str, username: str, name: str, fee: str, comment: str, next_id: str, x: int, y: int) -> dict:
    """Создаёт bot_table upsert ноду для одной строки комиссий."""
    data = bot_table_base()
    data["row"] = {
        "username": username,
        "name": name,
        "fee": fee,
        "comment": comment,
    }
    data["autoTransitionTo"] = next_id
    data["enableAutoTransition"] = bool(next_id)
    return {
        "id": node_id,
        "type": "bot_table",
        "position": {"x": x, "y": y},
        "data": data,
    }


def main() -> None:
    """Добавляет schedule_trigger и цепочку инициализации bot_commissions."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    existing_ids = {n["id"] for n in sheet["nodes"]}

    if "sched-init-commissions" in existing_ids:
        print("Уже есть sched-init-commissions, пропуск")
        return

    node_ids = [f"tbl-init-comm-{i + 1}" for i in range(len(COMMISSIONS))]
    nodes = []
    base_x, base_y = 200, 3400

    for i, (username, name, fee, comment) in enumerate(COMMISSIONS):
        next_id = node_ids[i + 1] if i + 1 < len(node_ids) else ""
        nodes.append(
            make_upsert_node(
                node_ids[i],
                username,
                name,
                fee,
                comment,
                next_id,
                base_x + i * 220,
                base_y,
            )
        )

    schedule_node = {
        "id": "sched-init-commissions",
        "type": "schedule_trigger",
        "position": {"x": 200, "y": 3200},
        "data": {
            "rules": [{"mode": "interval", "intervalMinutes": 1440}],
            "timezone": "Europe/Moscow",
            "autoTransitionTo": node_ids[0],
            "runOnStart": True,
            "enabled": True,
            "maxConcurrent": 1,
            "buttons": [],
            "markdown": False,
            "adminOnly": False,
            "showInMenu": False,
            "messageText": "",
            "keyboardType": "none",
            "requiresAuth": False,
            "isPrivateOnly": False,
            "resizeKeyboard": True,
            "oneTimeKeyboard": False,
            "enableStatistics": False,
        },
    }

    sheet["nodes"].extend([schedule_node, *nodes])

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print(f"OK: +1 schedule_trigger, +{len(nodes)} bot_table upsert → bot_commissions")


if __name__ == "__main__":
    main()
