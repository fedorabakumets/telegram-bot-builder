# Сравнение курсов (project 242)

Скрипты для `bots/новый_бот_1_242_163/project.json`. Запуск из **корня репозитория**.

## Основные

| Команда | Назначение |
|---------|------------|
| `python tools/compare_bots/check.py` | Цепочка, calc, маркеры ✅/⚠️ |
| `python tools/compare_bots/restore_all_bots.py` | 15 ботов, полный calc (без Империи/VIRON) |

## Патч «реальный BTC»

| Команда | Бот |
|---------|-----|
| `python tools/compare_bots/patch_scooby.py` | ScoobyChange |
| `python tools/compare_bots/patch_capitalist.py` | Capitalist |
| `python tools/compare_bots/patch_love.py` | Love |
| `python tools/compare_bots/patch_crazy.py` | CrazyBTC |
| `python tools/compare_bots/patch_lucky.py` | Lucky |
| `python tools/compare_bots/patch_inf.py` | INFINITY |

## Изоляция (тест одного бота)

| Команда | Бот |
|---------|-----|
| `python tools/compare_bots/isolate_scooby.py` | ScoobyChange |
| `python tools/compare_bots/isolate_capitalist.py` | Capitalist |
| `python tools/compare_bots/isolate_24crypto.py` | 24Crypto |
| `python tools/compare_bots/isolate_love.py` | Love |
| `python tools/compare_bots/isolate_crazy.py` | CrazyBTC |
| `python tools/compare_bots/isolate_lucky.py` | Lucky |
| `python tools/compare_bots/isolate_inf.py` | INFINITY |

После теста: `restore_all_bots.py`.

## Скрапы (в папке бота, не в git)

- `bots/новый_бот_1_242_163/scrape_crazy.py`
- `bots/новый_бот_1_242_163/scrape_lucky.py`
- `bots/новый_бот_1_242_163/scrape_inf.py`

`--sample` — проверка regex без Telethon.
