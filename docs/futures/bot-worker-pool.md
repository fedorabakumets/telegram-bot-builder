# Bot Worker Pool — масштабируемый запуск ботов

## Проблема

Текущая архитектура запускает каждого Telegram-бота как отдельный Python процесс (`python3 bot.py`).
При небольшом количестве ботов это работает хорошо, но при росте до сотен ботов возникают проблемы:

- **Память:** каждый Python процесс потребляет ~80MB RAM. 500 ботов = 40GB.
- **Процессы:** ОС имеет лимит на количество одновременных процессов.
- **Время запуска:** каждый процесс инициализирует Python runtime заново (~1-2 сек).

## Решение

Заменить модель "один процесс на бота" на **пул воркеров** — несколько долгоживущих Python процессов, каждый из которых запускает множество ботов через `asyncio`.

```
Текущая архитектура:
Node.js → spawn python3 bot_1.py  (80MB)
Node.js → spawn python3 bot_2.py  (80MB)
Node.js → spawn python3 bot_3.py  (80MB)
...

Новая архитектура:
Node.js → Worker 1 (Python asyncio) → bot_1, bot_2, bot_3  (150MB суммарно)
Node.js → Worker 2 (Python asyncio) → bot_4, bot_5, bot_6  (150MB суммарно)
```

Потребление памяти снижается в ~10 раз: 500 ботов = 2.5-5GB вместо 40GB.

## Архитектура

### Python Worker

Долгоживущий Python процесс на базе `aiogram`. Принимает команды через stdin (JSON) и управляет пулом ботов внутри одного `asyncio` event loop.

**Команды:**
```json
{ "cmd": "start_bot", "token": "123:ABC...", "token_id": 42, "project_id": 10 }
{ "cmd": "stop_bot",  "token_id": 42 }
{ "cmd": "status" }
```

**Вывод логов** — каждая строка stdout содержит `token_id` для маршрутизации:
```json
{ "token_id": 42, "type": "stdout", "content": "Bot started" }
```

### Node.js изменения

- `startBot.ts` — вместо `spawn('python3', [file])` отправляет команду свободному воркеру
- `stopBot.ts` — отправляет команду `stop_bot` воркеру, не убивает процесс
- `botWorkerManager.ts` — новый модуль, управляет пулом воркеров, балансирует нагрузку

### База данных

Новые таблицы:

```sql
-- Воркеры (мастер-процессы)
CREATE TABLE worker_processes (
  id          SERIAL PRIMARY KEY,
  pid         INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'running',  -- running | stopped | error
  bots_count  INTEGER NOT NULL DEFAULT 0,
  memory_mb   INTEGER,
  cpu_percent REAL,
  started_at  TIMESTAMP DEFAULT NOW()
);

-- Привязка бота к воркеру
CREATE TABLE bot_worker_assignments (
  token_id    INTEGER NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  worker_id   INTEGER NOT NULL REFERENCES worker_processes(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (token_id)
);
```

### Redis (опционально, для горизонтального масштабирования)

При нескольких Node.js инстансах:
- **Pub/Sub** — рассылка WebSocket событий между инстансами
- **Queue** — очередь команд воркерам
- **Cache** — статусы ботов без запросов в PostgreSQL

## UI изменения

Для пользователя интерфейс не меняется — те же карточки, кнопки, терминал.

Добавляется статус-бар в шапке панели ботов:
```
[●] Workers: 2 активных  |  Ботов: 47  |  RAM: 380MB
```

## Балансировка

Воркер выбирается по наименьшей нагрузке:
```ts
function pickWorker(workers: Worker[]): Worker {
  return workers
    .filter(w => w.status === 'running' && w.botsCount < MAX_BOTS_PER_WORKER)
    .sort((a, b) => a.botsCount - b.botsCount)[0];
}
```

`MAX_BOTS_PER_WORKER` — настраивается через env, рекомендуется 50-100.

## Восстановление после сбоя

При падении воркера — все его боты перераспределяются на другие воркеры.
Логика аналогична текущему `restoreRunningBots`, но на уровне воркера.

## Когда реализовывать

Имеет смысл при 50+ одновременно запущенных ботах на одном сервере.
До этого порога текущая архитектура работает без проблем.
