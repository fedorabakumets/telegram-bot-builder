"""Применяет улучшенные раскладки клавиатур."""
import json

PATH = "bots/обменники_133_126/project.json"

with open(PATH, "r", encoding="utf-8") as f:
    d = json.load(f)

root = d.get("data") if "data" in d else d

def set_layout(node_id, new_rows, cols=2):
    for sheet in root["sheets"]:
        for node in sheet["nodes"]:
            if node["id"] == node_id:
                node["data"]["keyboardLayout"] = {
                    "rows": [{"buttonIds": r} for r in new_rows],
                    "columns": cols,
                    "autoLayout": False,
                }
                print(f"  ✓ {node_id[:55]}")
                return
    print(f"  ✗ NOT FOUND: {node_id[:55]}")

# 1. Главное меню: Кошельки отдельно, ByBit+BTC MONOPOLY вместе
print("1. Главное меню (Купить/Продать...)")
set_layout(
    "start_keyboard_1774974624659_mvun7q4ps_dup_1775330630989_e14cws36e",
    [
        ["GWNlAKYzhIrH1EDIF3NSV", "hXskuMsZk96GXf6Y7ScIe"],  # Купить, Продать
        ["3UzKMV5DQzYIYc1HTKR-b", "Vi-dWOjC2TiJaUC6jWHXc"],  # P2P, ACS
        ["mvWOkplWLm8Y2RmCyVu0A"],                             # Кошельки
        ["WBRqLmIXY81qcKeDbHzds", "1775057958734"],            # ByBit, BTC MONOPOLY
    ]
)

# 2. Список сайтов: по 2 в ряд
print("2. Список сайтов (по 2 в ряд)")
set_layout(
    "PUS-Fd5aAJ98QLk-ishTU_keyboard_1774974624659_xpxexguhg_dup_1775330630989_0edu3t58h",
    [
        ["sT9K8axGs8YSD-AjexaYO", "wtb6FTYHj95FaiM3YUGRd"],   # Sova, Epichange
        ["TsegqhpmQsdPPZYnAzTok", "0c8zYt3rHVQgVgUA3XBLb"],   # Ферма, OneMoment
        ["0AtABxOhsugHNerCubAtM", "YqzPbJkqlv_w4v_H9mSI_"],   # MetkA, Exbitbot
        ["AqwpV4FY7T3OuohdFF76I", "wDBikZWZRBbrDR0zr4d8g"],   # YodaObmen, CRIPTA
        ["xv6SNYQ-HdRjrPJMOY0ib", "ASjI_aEgTe2vj3BjiygKr"],  # CryptoBar, IN TO
        ["TXlXa9neF5dEi_i4Ju9-m", "Y1YHCV-JlDp_ZTHYDRPmV"],  # PocketEX, SWOP
        ["MHN-6ds-E-K6edXShSTT5"],                             # Назад
    ]
)

# 3. Список обменников: Squidward+BitGo в одну строку, Назад последний
print("3. Список обменников")
set_layout(
    "yw_mNIfYEudZi6qBKl9ov_keyboard_1774974624659_bplb421y4_dup_1775330630989_0qs6uycp4",
    [
        ["XyzJI-8-6PEXcb63THxtd", "_tduSErKUOkAm5Hjr1S8A"],   # ScoobyChange, Империя
        ["FsVJ8FwvkivRQ_1S-fj9-", "dL07jVzrhVUUfzjVB2sMI"],   # Shaxta, CrytoFlow
        ["8YH6JvVNE7vUZ7w2xnJYS", "JEg5ci6u-TEf-D4jA9fhN"],   # Vortex, INFINITY
        ["RaK4CeifJmwcleT7hXlcq", "qN4nC_SeOyHTK55SvOpHC"],   # Пополнятор, Sanchez
        ["mDQJBb0GSgIygslb6Tu_N", "eqCWEqtM0q4omvxKVsWqQ"],   # Hustle, BTC MONOPOLY
        ["ETAdT0nWs36MOMld6I3Wa", "N_pdRLYBqvp5X-Xk4lpgr"],   # CrazyBTC, 24CRYPTO
        ["3Y2YAxEnxNfJK6B8gt9iZ", "yvbuO0lpDtcuvrCo-_SHW"],   # Capitalist, CryptoSwap
        ["2BPmxjLVRxrw3QBgQP_Ew", "kqpJKZqKo3j7gaBkx6CzV"],  # LiteBit, BitMixer
        ["1773510125105", "1773510433603"],                     # Lucky, Love Exchange
        ["btn_2", "1773510663633"],                             # Squidward, BitGo
        ["1773512075312"],                                      # Назад
    ]
)

# 4. P2P боты: BitBridge+CryptoBot в ряд, xRoket отдельно
print("4. P2P боты")
set_layout(
    "4aK7tBp04cV48AdVkFcwy_keyboard_1774974624659_pagf8tkcj_dup_1775330630989_l95zvtddo",
    [
        ["TZM3uiDxFbPVdkQDpI2Un", "5DUtwAfY6u6AmiM-Sq1ts"],   # BitBridge, CryptoBot
        ["LyiHP7KSFBN1m7n96VLms"],                             # xRoket
        ["3K1ogZuPsMspSod93d81D"],                             # Назад
    ]
)

# 5. Кошельки: NC Wallet + Antarctic в одну строку
print("5. Кошельки")
set_layout(
    "F5YsR6I9iz9kiAD8eTbJJ_keyboard_1774974624659_wlsgzeqmr_dup_1775330630989_5i4groxbk",
    [
        ["1774261810947", "1774262058267"],  # NC Wallet, Antarctic Wallet
        ["1774262188917"],                  # Назад
    ]
)

# 6. BTC MONOPOLY карточка: Бот+Сайт в ряд, Назад отдельно
print("6. BTC MONOPOLY (Бот/Сайт)")
set_layout(
    "WAf9gve0Tt19zAGxXROdT_keyboard_1774974624659_plz2jka84_dup_1775330630989_dp3hiemyx",
    [
        ["lb9q4VnGemTRbpvissCPX", "1774861334952"],  # Бот, Сайт
        ["R1Ir7y-nBo4PcVbjezXKV"],                  # Назад
    ]
)

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print(f"\nГотово → {PATH}")
