"""
@fileoverview Показывает все доступные направления обмена из банков в крипто
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


data = fetch_json("https://swop.is/valuta.json")

currencies = data['currencies']['list']  # {id: code}
exchange = data['exchange']

# Определяем фиат (банки) и крипто по коду
BANK_CODES = {
    '2': 'Сбербанк (SBERRUB)',
    '18': 'Тинькофф (TCSBRUB)',
    '48': 'ЮMoney',
}

# Найдём все банковские id
print("📋 Все валюты (currencies.list):")
fiat_ids = {}
crypto_ids = {}
for cid, code in sorted(currencies.items(), key=lambda x: x[1]):
    if 'RUB' in code or 'QIWI' in code:
        fiat_ids[cid] = code
        print(f"  💳 id={cid:>4} | {code}")
    else:
        crypto_ids[cid] = code

print(f"\n  🪙 Крипто ({len(crypto_ids)}):")
for cid, code in sorted(crypto_ids.items(), key=lambda x: x[1]):
    print(f"     id={cid:>4} | {code}")

# Направления из банков
print(f"\n{'='*60}")
print(f"  НАПРАВЛЕНИЯ ИЗ БАНКОВ")
print(f"{'='*60}")

for bank_id, bank_name in sorted(fiat_ids.items(), key=lambda x: x[1]):
    if bank_id in exchange:
        targets = exchange[bank_id].get('to', {})
        print(f"\n  🏦 {bank_name} (id={bank_id}) → {len(targets)} направлений:")
        for tid, rate in sorted(targets.items(), key=lambda x: currencies.get(x[0], '')):
            tcode = currencies.get(tid, f'???({tid})')
            print(f"    → id={tid:>4} | {tcode:>12} | курс: {rate}")
