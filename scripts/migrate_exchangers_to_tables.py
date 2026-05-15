"""
@fileoverview Миграция проекта "обменники" на переменные из таблиц.

Заменяет захардкоженные URL обменников и ID валют на переменные
из пользовательских таблиц: {table.urls.*} и {table.ids.*}.

Запуск из корня проекта:
    python scripts/migrate_exchangers_to_tables.py
"""

import json
import shutil
from pathlib import Path

# Путь к файлу проекта
BOT_FILE = Path("bots/обменники_240_153/project.json")
BACKUP_FILE = BOT_FILE.with_suffix(".json.bak")

# Маппинг URL → переменная таблицы
URL_MAP = {
    "https://swop.is/valuta.json": "{table.urls.swop_url}",
    "https://sova.is/valuta.json": "{table.urls.sova_url}",
    "https://pocket-exchange.com/valuta.json": "{table.urls.pocket_url}",
    "https://ferma.cc/valuta.json": "{table.urls.ferma_url}",
}

# Маппинг ID валют в путях exchange.X.to.Y → переменные таблицы
ID_MAP = {
    "2": "{table.ids.sber_id}",
    "18": "{table.ids.tinkoff_id}",
    "48": "{table.ids.umoney_id}",
    "55": "{table.ids.usdt_id}",
    "5": "{table.ids.btc_id}",
    "107": "{table.ids.ton_id}",
    "139": "{table.ids.eth_id}",
}


def заменить_url_в_нодах(данные: dict) -> int:
    """
    Заменяет захардкоженные URL в http_request нодах на переменные таблиц.

    @param данные - Данные проекта
    @returns Количество замен
    """
    count = 0
    for лист in данные.get("sheets", []):
        for узел in лист.get("nodes", []):
            if узел.get("type") != "http_request":
                continue
            url = узел.get("data", {}).get("httpRequestUrl", "")
            if url in URL_MAP:
                узел["data"]["httpRequestUrl"] = URL_MAP[url]
                count += 1
    return count


def заменить_id_в_assignments(данные: dict) -> int:
    """
    Заменяет числовые ID валют в set_variable assignments на переменные таблиц.
    Паттерн: {r_xxx.exchange.2.to.55} → {r_xxx.exchange.{table.ids.sber_id}.to.{table.ids.usdt_id}}

    @param данные - Данные проекта
    @returns Количество замен
    """
    count = 0
    for лист in данные.get("sheets", []):
        for узел in лист.get("nodes", []):
            if узел.get("type") != "set_variable":
                continue
            assignments = узел.get("data", {}).get("assignments", [])
            for assignment in assignments:
                value = assignment.get("value", "")
                if ".exchange." not in value:
                    continue
                # Заменяем ID в пути: exchange.2.to.55
                new_value = value
                for old_id, new_var in ID_MAP.items():
                    # Заменяем .ID. (окружённый точками) или .ID} (в конце)
                    new_value = new_value.replace(f".{old_id}.", f".{new_var}.")
                    new_value = new_value.replace(f".{old_id}}}", f".{new_var}}}")
                if new_value != value:
                    assignment["value"] = new_value
                    count += 1
    return count


def заменить_тексты(данные: dict) -> int:
    """
    Заменяет текст ошибки на переменную из таблицы texts.

    @param данные - Данные проекта
    @returns Количество замен
    """
    count = 0
    for лист in данные.get("sheets", []):
        for узел in лист.get("nodes", []):
            msg = узел.get("data", {}).get("messageText", "")
            if "Ошибка загрузки курсов" in msg:
                узел["data"]["messageText"] = "{table.texts.error_msg}"
                count += 1
    return count


def main():
    """Основная функция: читает JSON, выполняет замены, сохраняет."""
    if not BOT_FILE.exists():
        print(f"❌ Файл не найден: {BOT_FILE}")
        return

    with BOT_FILE.open(encoding="utf-8") as f:
        данные = json.load(f)

    # Бэкап
    shutil.copy2(BOT_FILE, BACKUP_FILE)
    print(f"💾 Бэкап: {BACKUP_FILE}")

    # Замены
    url_count = заменить_url_в_нодах(данные)
    print(f"🔗 URL обменников → table.urls.*: {url_count} замен")

    id_count = заменить_id_в_assignments(данные)
    print(f"🔢 ID валют → table.ids.*: {id_count} замен")

    text_count = заменить_тексты(данные)
    print(f"📝 Тексты → table.texts.*: {text_count} замен")

    # Сохранение
    with BOT_FILE.open("w", encoding="utf-8") as f:
        json.dump(данные, f, ensure_ascii=False, indent=2)

    total = url_count + id_count + text_count
    print(f"\n✅ Готово! Всего {total} замен. Файл: {BOT_FILE}")


if __name__ == "__main__":
    main()
