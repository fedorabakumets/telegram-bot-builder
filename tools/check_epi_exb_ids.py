"""
@fileoverview Проверяет ID валют на epichange.online и exbitbot.net
для маппинга банков → BTC
"""

import json
import ssl
import urllib.request


def fetch_json(url: str):
    """Загружает JSON по URL"""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
    })
    with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
        return json.loads(resp.read().decode('utf-8'))


# Ищем банковские коды
BANK_KEYWORDS = {
    'SBER': 'Сбербанк',
    'TCSB': 'Тинькофф',
    'SBP': 'СБП',
    'YAM': 'ЮMoney',
    'ALFA': 'Альфа',
    'ACR': 'Альфа',
    'TB': 'Т-Банк',
    'RAIF': 'Райффайзен',
    'RFB': 'Райффайзен',
    'GPB': 'Газпром',
    'BTC': 'Bitcoin',
}

for api_name, url in [
    ("epichange.online", "https://epichange.online/request-exportjson.json?lang=ru"),
    ("exbitbot.net", "https://exbitbot.net/request-exportjson.json?lang=ru"),
]:
    print(f"\n{'='*60}")
    print(f"  {api_name}")
    print(f"{'='*60}")

    data = fetch_json(url)
    currencies = data.get('currencies', {})

    # currencies может быть {list: {id: code}, amounts: {...}}
    clist = currencies.get('list', {})
    if isinstance(clist, dict):
        print(f"  Валют: {len(clist)}")
        # Ищем банки и BTC
        for cid, code in sorted(clist.items(), key=lambda x: x[1]):
            code_upper = code.upper()
            for kw, name in BANK_KEYWORDS.items():
                if kw in code_upper:
                    print(f"    id={cid:>4} | {code:>15} | ({name})")
                    break
