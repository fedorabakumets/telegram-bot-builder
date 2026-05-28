"""
@fileoverview Проверяем курсы для разных направлений (СБП/Карта → BTC)
у сайтов-обменников. Смотрим есть ли разница между парами.
"""
import json
import sys
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

# Сайты с valuta.json (swop, sova, ferma, onemoment, metka, pocket)
VALUTA_SITES = [
    ("swop.is", "https://swop.is/valuta.json"),
    ("sova.is", "https://sova.is/valuta.json"),
]

# Пары из таблицы pair_map:
# swop_from=2, swop_to=5 (текущая пара СБП→BTC)
# Нужно проверить есть ли другие пары (Карта→BTC)

print("=== Проверяем valuta.json — какие пары доступны ===\n")

for name, url in VALUTA_SITES:
    print(f"--- {name} ---")
    try:
        resp = urllib.request.urlopen(url, timeout=10)
        data = json.loads(resp.read().decode())
        
        # Структура: exchange.{from_id}.to.{to_id}
        exchange = data.get('exchange', {})
        
        # Ищем все пары которые ведут к BTC (to=5 обычно)
        btc_pairs = []
        for from_id, to_map in exchange.items():
            if isinstance(to_map, dict) and 'to' in to_map:
                for to_id, rate_data in to_map['to'].items():
                    if to_id == '5':  # BTC
                        btc_pairs.append((from_id, to_id, rate_data))
        
        print(f"  Пар → BTC (to=5): {len(btc_pairs)}")
        for from_id, to_id, rate_data in btc_pairs:
            rate = rate_data if not isinstance(rate_data, dict) else rate_data.get('xr', rate_data)
            print(f"    from={from_id} → to={to_id}: {rate}")
        
        # Также покажем что за from_id=2 (текущий)
        if '2' in exchange and 'to' in exchange['2'] and '5' in exchange['2']['to']:
            print(f"\n  Текущая пара (2→5): {exchange['2']['to']['5']}")
        
        print()
    except Exception as e:
        print(f"  Ошибка: {e}\n")

# Проверяем epichange (другой формат)
print("--- epichange.online ---")
try:
    resp = urllib.request.urlopen("https://epichange.online/request-exportjson.json?lang=ru", timeout=10)
    data = json.loads(resp.read().decode())
    exchange = data.get('exchange', {})
    
    # Текущая пара: 580→579
    if '580' in exchange and 'to' in exchange['580'] and '579' in exchange['580']['to']:
        print(f"  Пара 580→579 (СБП→BTC): {exchange['580']['to']['579']}")
    
    # Ищем другие пары → 579 (BTC)
    btc_pairs = []
    for from_id, to_map in exchange.items():
        if isinstance(to_map, dict) and 'to' in to_map:
            for to_id, rate_data in to_map['to'].items():
                if to_id == '579':
                    btc_pairs.append((from_id, rate_data))
    
    print(f"  Всего пар → BTC (579): {len(btc_pairs)}")
    for from_id, rate_data in btc_pairs[:10]:
        xr = rate_data.get('xr', '?') if isinstance(rate_data, dict) else rate_data
        print(f"    from={from_id}: xr={xr}")
except Exception as e:
    print(f"  Ошибка: {e}")
