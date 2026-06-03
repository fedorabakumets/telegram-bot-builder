"""
@fileoverview Патч bot-setv-calc: lookup fee из bot_commissions + учёт в расчёте BTC
"""
import json
from pathlib import Path

PROJECT = Path("bots/новый_бот_1_242_163/project.json")

# prefix → username в bot_commissions
FEE_BOTS = [
    ("scooby", "@scdoo_bot"),
    ("capitalist", "@btccapital_bot"),
    ("crypto24", "@Exchange24Crypto_bot"),
    ("shaxta", "@shaxta24_bot"),
    ("bitmixer", "@bitmixerac_bot"),
    ("litebit", "@litebitbit_bot"),
    ("sanchez", "@Sanchez_exchange_bot"),
    ("imperia", "@IMPERIA_OBMENA_BOT"),
    ("cf", "@Crypto_Flow_exchange_bot"),
    ("vortex", "@vrtxbtc_bot"),
    ("crazy", "@BTCrzyBOT"),
    ("inf", "@Infinity_exchange_bot"),
    ("lucky", "@LuckyExchange_Bot"),
    ("love", "@Exchange_Love_Bot"),
    ("casper", "@casper_btc_bot"),
    ("monopoly", "@Btc_Monopoly_bot"),
]

# id calc-нод → prefix (rate-based)
RATE_CALCS = {
    "calc1": "scooby",
    "calc2": "capitalist",
    "calc3": "crypto24",
    "calc4": "shaxta",
    "calc5": "sanchez",
    "calc_imp": "imperia",
    "calc_cf": "cf",
    "calc_vortex": "vortex",
    "calc_crazy": "crazy",
    "calc_inf": "inf",
    "calc_lucky": "lucky",
    "calc_love": "love",
    "calc_casper": "casper",
}


def make_fee_lookup(prefix: str, username: str) -> dict:
    """Создаёт assignment lookup fee из bot_commissions."""
    return {
        "id": f"fee_{prefix}",
        "mode": "lookup",
        "value": "",
        "variable": f"{prefix}_fee",
        "lookupTable": "bot_commissions",
        "lookupField": "fee",
        "lookupWhere": [{"field": "username", "value": username}],
    }


def rate_btc_expr(prefix: str) -> str:
    """BTC из базового курса с учётом fee: amount / (rate × (1 + fee))."""
    rate = f"{prefix}_rate"
    fee = f"{prefix}_fee"
    return (
        f"round({{user_amount}} / (float({{{rate}}}) * (1 + float({{{fee}}}))), 8) "
        f"if float({{{rate}}}) > 0 else 0"
    )


def btc_raw_expr(prefix: str, source_var: str) -> str:
    """BTC из сырого значения с учётом fee: raw / (1 + fee)."""
    fee = f"{prefix}_fee"
    return (
        f"round(float({{{source_var}}}) / (1 + float({{{fee}}})), 8) "
        f"if float({{{source_var}}}) > 0 else 0"
    )


def main() -> None:
    """Обновляет bot-setv-calc и fee Scooby в seed-таблице."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    calc = next(n for n in sheet["nodes"] if n["id"] == "bot-setv-calc")
    assignments = calc["data"]["assignments"]

    if any(a.get("id") == "fee_scooby" for a in assignments):
        print("fee lookups уже есть, пропуск")
        return

    new_assignments: list[dict] = []
    fee_lookups = [make_fee_lookup(p, u) for p, u in FEE_BOTS]

    for a in assignments:
        if a["id"] == "init_arr":
            new_assignments.append(a)
            new_assignments.extend(fee_lookups)
            continue

        if a["id"] in RATE_CALCS:
            prefix = RATE_CALCS[a["id"]]
            new_assignments.append(
                {**a, "value": rate_btc_expr(prefix)}
            )
            continue

        if a["id"] == "calc_monopoly_rate":
            new_assignments.append(
                {
                    "id": "calc_monopoly_btc",
                    "mode": "expression",
                    "value": btc_raw_expr("monopoly", "monopoly_btc"),
                    "variable": "monopoly_btc",
                }
            )
            new_assignments.append(a)
            continue

        new_assignments.append(a)

    # bitmixer и litebit: вставить после fee-блока, перед fmt6
    insert_idx = next(i for i, a in enumerate(new_assignments) if a["id"] == "fmt6")
    btc_direct = [
        {
            "id": "calc_bitmixer_btc",
            "mode": "expression",
            "value": btc_raw_expr("bitmixer", "bitmixer_btc"),
            "variable": "bitmixer_btc",
        },
        {
            "id": "calc_litebit_btc",
            "mode": "expression",
            "value": btc_raw_expr("litebit", "litebit_btc_raw"),
            "variable": "litebit_btc",
        },
    ]
    new_assignments[insert_idx:insert_idx] = btc_direct

    calc["data"]["assignments"] = new_assignments

    # Scooby fee 0.353 в seed
    for n in sheet["nodes"]:
        if n["id"] == "tbl-init-comm-1":
            n["data"]["row"]["fee"] = "0.353"
            n["data"]["row"]["comment"] = "10k→13530, btc_raw 0.00203286"
            break

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print(f"OK: +{len(fee_lookups)} fee lookups, обновлены формулы BTC в bot-setv-calc")


if __name__ == "__main__":
    main()
