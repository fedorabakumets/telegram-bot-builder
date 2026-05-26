"""
@fileoverview Добавляет сортировку результатов сравнения ботов по выгодности.

Вместо захардкоженного текста в bot-msg-result, реализует динамический подход:
1. В bot-setv-calc добавляет init массива + json_push для каждого бота
2. Создаёт новую ноду bot-setv-format (json_format с сортировкой по rate)
3. Обновляет bot-msg-result — использует переменную bot_rates_text

Аналогично тому, как сделано для сайтов в setv-compare-best.
"""

import json
from pathlib import Path

PROJECT_PATH = Path(
    r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"
)

# Список ботов: (id_суффикс, название, url, переменная_btc, переменная_rate)
# Для bitmixer/litebit/monopoly rate вычисляется обратно из btc
BOTS = [
    ("scooby", "ScoobyChange", "https://t.me/scdoo_bot", "scooby_btc", "scooby_rate"),
    ("capitalist", "Capitalist", "https://t.me/btccapital_bot", "capitalist_btc", "capitalist_rate"),
    ("crypto24", "24Crypto", "https://t.me/Exchange24Crypto_bot", "crypto24_btc", "crypto24_rate"),
    ("shaxta", "Shaxta", "https://t.me/shaxta24_bot", "shaxta_btc", "shaxta_rate"),
    ("bitmixer", "BitMixer", "https://t.me/bitmixerac_bot", "bitmixer_btc", "bitmixer_rate"),
    ("litebit", "LiteBit", "https://t.me/litebitbit_bot", "litebit_btc", "litebit_rate"),
    ("sanchez", "Sanchez", "https://t.me/Sanchez_exchange_bot", "sanchez_btc", "sanchez_rate"),
    ("imperia", "Империя", "https://t.me/IMPERIA_OBMENA_BOT", "imperia_btc", "imperia_rate"),
    ("viron", "VIRON", "https://t.me/popol_ni_bot", "viron_btc", "viron_rate"),
    ("cf", "CryptoFlow", "https://t.me/Crypto_Flow_exchange_bot", "cf_btc", "cf_rate"),
    ("vortex", "Vortex", "https://t.me/vrtxbtc_bot", "vortex_btc", "vortex_rate"),
    ("crazy", "CrazyBTC", "https://t.me/BTCrzyBOT", "crazy_btc", "crazy_rate"),
    ("inf", "INFINITY", "https://t.me/Infinity_exchange_bot", "inf_btc", "inf_rate"),
    ("lucky", "Lucky", "https://t.me/LuckyExchange_Bot", "lucky_btc", "lucky_rate"),
    ("love", "Love", "https://t.me/Exchange_Love_Bot", "love_btc", "love_rate"),
    ("casper", "CASPER", "https://t.me/casper_btc_bot", "casper_btc", "casper_rate"),
    ("monopoly", "BTC Monopoly", "https://t.me/Btc_Monopoly_Bot", "monopoly_btc", None),
]


def find_node(sheets, node_id):
    """
    Ищет ноду по ID во всех листах
    @param sheets - список листов проекта
    @param node_id - ID искомой ноды
    @returns кортеж (sheet, node) или (None, None)
    """
    for sheet in sheets:
        for node in sheet.get("nodes", []):
            if node["id"] == node_id:
                return sheet, node
    return None, None


def build_init_assignment():
    """
    Создаёт assignment для инициализации пустого массива bot_compare_results
    @returns dict с assignment
    """
    return {
        "id": "init_arr",
        "mode": "text",
        "value": "[]",
        "variable": "bot_compare_results",
    }


def build_push_assignment(bot_id, name, url, btc_var, rate_var):
    """
    Создаёт json_push assignment для одного бота
    @param bot_id - суффикс для id assignment'а
    @param name - отображаемое имя бота
    @param url - реферальная ссылка
    @param btc_var - переменная с количеством BTC
    @param rate_var - переменная с курсом (или None для monopoly)
    @returns dict с assignment
    """
    # Для BTC Monopoly нет raw_rate — вычисляем обратно
    if rate_var is None:
        raw_rate_expr = (
            "=int({user_amount} / float({monopoly_btc})) "
            "if float({monopoly_btc}) > 0 else 0"
        )
    else:
        raw_rate_expr = "={" + rate_var + "}"

    value_obj = {
        "name": name,
        "url": url,
        "rate": "={" + btc_var + "}",
        "raw_rate": raw_rate_expr,
    }

    return {
        "id": f"push_{bot_id}",
        "mode": "json_push",
        "value": json.dumps(value_obj, ensure_ascii=False),
        "variable": "bot_compare_results",
    }


def build_format_node():
    """
    Создаёт ноду bot-setv-format с json_format сортировкой и сохранением текста
    @returns dict с нодой
    """
    return {
        "id": "bot-setv-format",
        "type": "set_variable",
        "position": {"x": 6100, "y": 3000},
        "data": {
            "assignments": [
                {
                    "id": "fmt_bots",
                    "mode": "json_format",
                    "value": (
                        '🔸 <a href="{item.url}">{item.name}</a>: '
                        "<b>{item.rate} BTC</b> ({item.raw_rate} ₽)\n"
                    ),
                    "variable": "bot_compare_results",
                    "lookupField": "rate",
                },
                {
                    "id": "save_text",
                    "mode": "text",
                    "value": "{bot_compare_results}",
                    "variable": "bot_rates_text",
                },
            ],
            "autoTransitionTo": "bot-delete-loading",
            "enableAutoTransition": True,
        },
    }


def main():
    """
    Основная функция: читает project.json, модифицирует и сохраняет
    """
    print(f"📂 Читаю {PROJECT_PATH}...")
    data = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))
    sheets = data["sheets"]

    # === 1. Модифицируем bot-setv-calc ===
    sheet_calc, node_calc = find_node(sheets, "bot-setv-calc")
    if not node_calc:
        raise RuntimeError("Нода bot-setv-calc не найдена!")

    assignments = node_calc["data"]["assignments"]

    # Добавляем init_arr в начало
    assignments.insert(0, build_init_assignment())
    print("  ✅ Добавлен init_arr (инициализация массива)")

    # Добавляем json_push для каждого бота в конец
    for bot_id, name, url, btc_var, rate_var in BOTS:
        assignments.append(build_push_assignment(bot_id, name, url, btc_var, rate_var))
    print(f"  ✅ Добавлено {len(BOTS)} json_push assignments")

    # Меняем autoTransitionTo на bot-setv-format
    node_calc["data"]["autoTransitionTo"] = "bot-setv-format"
    print("  ✅ bot-setv-calc → autoTransitionTo = 'bot-setv-format'")

    # === 2. Добавляем ноду bot-setv-format ===
    format_node = build_format_node()
    sheet_calc["nodes"].append(format_node)
    print("  ✅ Добавлена нода bot-setv-format")

    # === 3. Обновляем bot-msg-result ===
    _, node_result = find_node(sheets, "bot-msg-result")
    if not node_result:
        raise RuntimeError("Нода bot-msg-result не найдена!")

    new_message = (
        "💱 <b>Сравнение курсов</b>\n"
        "\n"
        "💰 Сумма: <b>{user_amount_fmt}</b> ₽\n"
        "\n"
        "{bot_rates_text}"
    )
    node_result["data"]["messageText"] = new_message
    print("  ✅ Обновлён messageText в bot-msg-result")

    # === 4. Сохраняем ===
    output = json.dumps(data, ensure_ascii=False, indent=2)
    PROJECT_PATH.write_text(output, encoding="utf-8")
    print(f"\n💾 Сохранено: {PROJECT_PATH}")
    print(f"   Размер: {len(output):,} байт")

    # === 5. Валидация JSON ===
    try:
        json.loads(PROJECT_PATH.read_text(encoding="utf-8"))
        print("   ✅ JSON валидный")
    except json.JSONDecodeError as e:
        print(f"   ❌ JSON невалидный: {e}")
        raise


if __name__ == "__main__":
    main()
