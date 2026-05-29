"""
Скрипт для замены generic реф-ссылок на реальные в bot-setv-calc узле.
Заменяет ?start=ref_compare на актуальные реферальные параметры.
"""

import json
import os

PROJECT_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'bots', 'новый_бот_1_242_163', 'project.json'
)

# Маппинг: старый URL → новый URL
URL_REPLACEMENTS = {
    "https://t.me/scdoo_bot?start=ref_compare": "https://t.me/scdoo_bot?start=7733607050",
    "https://t.me/btccapital_bot?start=ref_compare": "https://t.me/btccapital_bot?start=7733607050",
    "https://t.me/Exchange24Crypto_bot?start=ref_compare": "https://t.me/Exchange24Crypto_bot?start=r-7733607050",
    "https://t.me/shaxta24_bot?start=ref_compare": "https://t.me/shaxta24_bot?start=r-7733607050",
    "https://t.me/bitmixerac_bot?start=ref_compare": "https://t.me/bitmixerac_bot?start=7a88e5da",
    "https://t.me/litebitbit_bot?start=ref_compare": "https://t.me/litebitbit_bot?start=7733607050",
    "https://t.me/Sanchez_exchange_bot?start=ref_compare": "https://t.me/Sanchez_exchange_bot?start=REF_IED1WL",
    "https://t.me/IMPERIA_OBMENA_BOT?start=ref_compare": "https://t.me/IMPERIA_OBMENA_BOT?start=7733607050",
    "https://t.me/Crypto_Flow_exchange_bot?start=ref_compare": "https://t.me/Crypto_Flow_exchange_bot?start=ref7733607050",
    "https://t.me/vrtxbtc_bot?start=ref_compare": "https://t.me/vrtxbtc_bot?start=7733607050",
    "https://t.me/BTCrzyBOT?start=ref_compare": "https://t.me/BTCrzyBOT?start=7733607050",
    "https://t.me/Infinity_exchange_bot?start=ref_compare": "https://t.me/Infinity_exchange_bot?start=jBmKj8kM8Z",
    "https://t.me/LuckyExchange_Bot?start=ref_compare": "https://t.me/LuckyExchange_Bot?start=ref_cmj72beqs0001lz016qurlvoz",
    "https://t.me/Exchange_Love_Bot?start=ref_compare": "https://t.me/Exchange_Love_Bot?start=ref_7733607050",
    "https://t.me/casper_btc_bot?start=ref_compare": "https://t.me/casper_btc_bot?start=jDr1Wi8Y",
    "https://t.me/Btc_Monopoly_Bot?start=ref_compare": "https://t.me/BTC_Monopoly_bot?start=7733607050",
}


def fix_ref_urls():
    """Заменяет generic реф-ссылки на реальные в json_push assignments узла bot-setv-calc."""
    with open(PROJECT_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    changes = []

    # Ищем узел bot-setv-calc во всех sheets
    for sheet in data.get('sheets', []):
        for node in sheet.get('nodes', []):
            if node.get('id') != 'bot-setv-calc':
                continue

            assignments = node.get('data', {}).get('assignments', [])
            for assignment in assignments:
                if assignment.get('mode') != 'json_push':
                    continue

                value = assignment.get('value', '')
                new_value = value

                for old_url, new_url in URL_REPLACEMENTS.items():
                    if old_url in new_value:
                        new_value = new_value.replace(old_url, new_url)
                        changes.append(f"  [{assignment['id']}] {old_url} → {new_url}")

                if new_value != value:
                    assignment['value'] = new_value

    if changes:
        with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ Заменено {len(changes)} URL:")
        for c in changes:
            print(c)
    else:
        print("⚠️ Ничего не найдено для замены")


if __name__ == '__main__':
    fix_ref_urls()
