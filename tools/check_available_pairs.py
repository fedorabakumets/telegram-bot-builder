"""
@fileoverview Проверяет доступные направления обмена на API обменников.
Показывает какие валюты (from/to) поддерживаются.
"""

import json
import ssl
import urllib.request


def fetch_json(url: str) -> dict | None:
    """
    Загружает JSON по URL
    @param url - URL для запроса
    @returns словарь или None
    """
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
    })
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"  ❌ Ошибка: {e}")
        return None


def main():
    """
    Загружает valuta.json с swop.is и показывает все доступные направления
    """
    print("🔍 Загружаю данные с swop.is/valuta.json...")
    data = fetch_json("https://swop.is/valuta.json")
    if not data:
        return

    currencies = data.get('currencies', {})
    exchange = data.get('exchange', {})

    # Показываем все валюты (from)
    print(f"\n{'='*60}")
    print(f"  ДОСТУПНЫЕ ВАЛЮТЫ (currencies): {len(currencies)}")
    print(f"{'='*60}")

    # Группируем по типу
    fiat = []
    crypto = []
    for cid, info in currencies.items():
        name = info.get('name', cid)
        code = info.get('code', '')
        ctype = info.get('type', '')
        if ctype == 'fiat' or 'RUB' in code or 'банк' in name.lower() or 'карт' in name.lower():
            fiat.append((cid, name, code))
        else:
            crypto.append((cid, name, code))

    print(f"\n  💳 Фиат/Банки ({len(fiat)}):")
    for cid, name, code in sorted(fiat, key=lambda x: x[1]):
        print(f"    id={cid:>4} | {name} ({code})")

    print(f"\n  🪙 Крипто ({len(crypto)}):")
    for cid, name, code in sorted(crypto, key=lambda x: x[1]):
        print(f"    id={cid:>4} | {name} ({code})")

    # Показываем доступные направления из популярных банков
    print(f"\n{'='*60}")
    print(f"  НАПРАВЛЕНИЯ ИЗ БАНКОВ → КРИПТО")
    print(f"{'='*60}")

    # Ищем банковские id
    bank_ids = {}
    for cid, info in currencies.items():
        name = info.get('name', '')
        if any(b in name.lower() for b in ['сбер', 'тиньк', 'альфа', 'втб', 'райф', 'юмани', 'qiwi', 'мир']):
            bank_ids[cid] = name

    for bank_id, bank_name in sorted(bank_ids.items(), key=lambda x: x[1]):
        if bank_id in exchange:
            targets = exchange[bank_id].get('to', {})
            crypto_targets = []
            for tid, rate in targets.items():
                tinfo = currencies.get(tid, {})
                tname = tinfo.get('name', tid)
                if tinfo.get('type') != 'fiat' and 'банк' not in tname.lower():
                    crypto_targets.append((tid, tname, rate))

            if crypto_targets:
                print(f"\n  🏦 {bank_name} (id={bank_id}) → {len(crypto_targets)} крипто:")
                for tid, tname, rate in sorted(crypto_targets, key=lambda x: x[1])[:15]:
                    print(f"    → id={tid:>4} | {tname} (курс: {rate})")


if __name__ == '__main__':
    main()
