"""
@fileoverview Проверка альтернативных API обменников
@module tools/_check_apis2
"""

import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

apis = [
    ("epichange.online", "https://epichange.online/request-exportjson.json?lang=ru"),
    ("exbitbot.net", "https://exbitbot.net/request-exportjson.json?lang=ru"),
    ("cryptobar.cc", "https://cryptobar.cc/request-exportnewxml.xml?lang=ru"),
]

for name, url in apis:
    print(f"\n--- {name} ---")
    print(f"  URL: {url}")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=15, context=ctx)
        data = resp.read().decode("utf-8")
        print(f"  ✅ Ответ: {len(data)} bytes")
        
        if url.endswith(".xml?lang=ru"):
            # XML формат
            print(f"  Формат: XML")
            print(f"  Первые 500 символов:\n{data[:500]}")
        else:
            # JSON формат
            parsed = json.loads(data)
            if isinstance(parsed, list):
                print(f"  Формат: JSON array, {len(parsed)} элементов")
                if len(parsed) > 0:
                    print(f"  Первый элемент keys: {list(parsed[0].keys())}")
                    print(f"  Пример: {json.dumps(parsed[0], ensure_ascii=False)[:300]}")
            elif isinstance(parsed, dict):
                keys = list(parsed.keys())[:10]
                print(f"  Формат: JSON object, keys: {keys}")
                if "exchange" in parsed:
                    exch_keys = list(parsed["exchange"].keys())[:5]
                    print(f"  exchange keys: {exch_keys}")
                else:
                    # Показать структуру
                    first_key = keys[0] if keys else None
                    if first_key:
                        val = parsed[first_key]
                        print(f"  [{first_key}]: {json.dumps(val, ensure_ascii=False)[:300]}")
    except urllib.error.HTTPError as e:
        print(f"  ❌ HTTP {e.code}: {e.reason}")
    except Exception as e:
        print(f"  ❌ Ошибка: {type(e).__name__}: {e}")
