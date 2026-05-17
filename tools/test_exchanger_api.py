"""
@fileoverview Тестовый запрос к API обменников.
Проверяет реальные ответы и пытается извлечь курс по json_path.
"""

import json
import sys
import urllib.request
import ssl


# Пара для теста: Сбербанк (2) → Bitcoin (5)
SELECTED_FROM_ID = "2"
SELECTED_TO_ID = "5"

# Маппинг из pair_map для этой пары
EPI_FROM = "580"
EPI_TO = "579"
EXB_FROM = "577"
EXB_TO = "578"
CB_FROM = "CARDRUB"
CB_TO = "BTC"

# Обменники из таблицы exchangers
EXCHANGERS = [
    {
        "name": "swop.is",
        "url": "https://swop.is/valuta.json",
        "json_path": "exchange.{selected_from_id}.to.{selected_to_id}"
    },
    {
        "name": "sova.is",
        "url": "https://sova.is/valuta.json",
        "json_path": "exchange.{selected_from_id}.to.{selected_to_id}"
    },
    {
        "name": "pocket-exchange.com",
        "url": "https://pocket-exchange.com/valuta.json",
        "json_path": "exchange.{selected_from_id}.to.{selected_to_id}"
    },
    {
        "name": "epichange.online",
        "url": "https://epichange.online/request-exportjson.json?lang=ru",
        "json_path": "exchange.{epi_from}.to.{epi_to}.xr"
    },
    {
        "name": "exbitbot.net",
        "url": "https://exbitbot.net/request-exportjson.json?lang=ru",
        "json_path": "exchange.{exb_from}.to.{exb_to}.xr"
    },
    {
        "name": "cryptobar.cc",
        "url": "https://cryptobar.cc/request-exportnewxml.xml?lang=ru",
        "json_path": "item.?from={cb_from}&to={cb_to}.in"
    },
]

# Переменные для подстановки
VARS = {
    "selected_from_id": SELECTED_FROM_ID,
    "selected_to_id": SELECTED_TO_ID,
    "epi_from": EPI_FROM,
    "epi_to": EPI_TO,
    "exb_from": EXB_FROM,
    "exb_to": EXB_TO,
    "cb_from": CB_FROM,
    "cb_to": CB_TO,
}


def replace_vars(text: str, vars_dict: dict) -> str:
    """
    Подставляет переменные в строку
    @param text - строка с {var} плейсхолдерами
    @param vars_dict - словарь переменных
    @returns строка с подставленными значениями
    """
    for k, v in vars_dict.items():
        text = text.replace("{" + k + "}", v)
    return text


def extract_by_path(data, path: str):
    """
    Извлекает значение из dict/list по dot-notation пути
    @param data - JSON данные
    @param path - путь вида 'exchange.2.to.5'
    @returns найденное значение или None
    """
    parts = path.split('.')
    current = data
    for part in parts:
        if current is None:
            return None
        if isinstance(current, dict):
            current = current.get(part)
        elif isinstance(current, list):
            try:
                current = current[int(part)]
            except (ValueError, IndexError):
                return None
        else:
            return None
    return current


def fetch_json(url: str) -> dict | None:
    """
    Загружает JSON по URL
    @param url - URL для запроса
    @returns словарь или None при ошибке
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
            raw = resp.read().decode('utf-8')
            return json.loads(raw)
    except Exception as e:
        return {"__error__": str(e)}


def main():
    """
    Тестирует API каждого обменника и показывает результат извлечения
    """
    print(f"{'='*60}")
    print(f"  ТЕСТ API ОБМЕННИКОВ")
    print(f"  Пара: Сбербанк ({SELECTED_FROM_ID}) → Bitcoin ({SELECTED_TO_ID})")
    print(f"{'='*60}")

    for exch in EXCHANGERS:
        name = exch['name']
        url = replace_vars(exch['url'], VARS)
        json_path = replace_vars(exch['json_path'], VARS)

        print(f"\n{'─'*60}")
        print(f"  🔸 {name}")
        print(f"  URL: {url}")
        print(f"  JSON Path: {json_path}")

        data = fetch_json(url)
        if data and "__error__" in data:
            print(f"  ❌ Ошибка: {data['__error__']}")
            continue

        if data is None:
            print(f"  ❌ Пустой ответ")
            continue

        # Показываем структуру верхнего уровня
        if isinstance(data, dict):
            keys = list(data.keys())[:10]
            print(f"  Ключи верхнего уровня: {keys}")

            # Пробуем извлечь по json_path
            value = extract_by_path(data, json_path)
            print(f"  Извлечённое значение: {value}")

            if value is None:
                # Попробуем показать что есть по частичному пути
                parts = json_path.split('.')
                partial = data
                for i, part in enumerate(parts):
                    if isinstance(partial, dict) and part in partial:
                        partial = partial[part]
                    else:
                        print(f"  ⚠️ Путь обрывается на '{part}' (шаг {i+1}/{len(parts)})")
                        if isinstance(partial, dict):
                            avail_keys = list(partial.keys())[:15]
                            print(f"     Доступные ключи: {avail_keys}")
                        break
        elif isinstance(data, list):
            print(f"  Ответ — массив, длина: {len(data)}")
            if data:
                print(f"  Первый элемент: {json.dumps(data[0], ensure_ascii=False)[:200]}")


if __name__ == '__main__':
    main()
