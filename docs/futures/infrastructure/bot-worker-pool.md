# Bot Worker Pool — масштабируемый запуск ботов

## Проблема

Текущая архитектура запускает каждого Telegram-бота как отдельный Python процесс (`spawn python3 bot.py`).
При небольшом количестве ботов это работает хорошо, но при росте до сотен ботов возникают проблемы:

- **Память:** каждый Python процесс потребляет ~80MB RAM. 500 ботов = 40GB.
- **Процессы:** ОС имеет лимит на количество одновременных процессов.
- **Время запуска:** каждый процесс инициализирует Python runtime заново (~1-2 сек).

## Решение

Модель **"1 проект = 1 воркер (Python процесс) = N ботов внутри"**.

Один долгоживущий Python процесс на базе `asyncio` + `aiogram` обслуживает все боты одного проекта.

```
Текущая архитектура:
Node.js → spawn python3 bot_1.py  (80MB)
Node.js → spawn python3 bot_2.py  (80MB)
Node.js → spawn python3 bot_3.py  (80MB)

Новая архитектура:
Node.js → Worker проекта (Python asyncio) → bot_1, bot_2, bot_3  (150MB суммарно)
```

Потребление памяти снижается в ~10 раз: 500 ботов = 2.5-5GB вместо 40GB.

### Жизненный цикл воркера

- **0 ботов запущено** → воркера нет, память не тратится
- **Первый бот запускается** → создаём воркер проекта → отправляем `start_bot`
- **Ещё боты запускаются** → воркер уже есть → просто отправляем `start_bot`
- **Бот останавливается** → отправляем `stop_bot` → воркер продолжает (другие боты крутятся)
- **Последний бот остановлен** → воркер пустой → убиваем воркер

Для пользователя ничего не меняется — те же кнопки "Запустить" / "Остановить".

---

## Текущая архитектура (что меняем)

### Запуск (`server/bots/startBot.ts`)
1. Убивает старые процессы (`ps aux` / `tasklist`)
2. Сбрасывает webhook (в polling режиме)
3. Генерирует Python-код → `generatePythonCode()`
4. Создаёт файлы → `createCompleteBotFiles()`
5. `spawn(python3, [mainFile])` с env: `PROJECT_ID`, `TOKEN_ID`, `BOT_TOKEN`...
6. Сохраняет в `botProcesses` Map (ключ: `${projectId}_${tokenId}`)
7. Записывает в БД (`botInstances`, `launchHistory`)
8. Обработчик `exit` — автоперезапуск при краше (exponential backoff)

### Остановка (`server/bots/stopBot.ts`)
1. Удаляет webhook
2. Ищет Python-процессы по `PROJECT_ID` + `TOKEN_ID` → kill
3. SIGTERM → 2с → SIGKILL
4. Чистит слушатели, flush логов, обновляет БД, удаляет Redis lock

### Перезапуск (`server/bots/restartBotIfRunning.ts`)
- `stopBot()` → ждёт 5с → `startBot()` — вызывается при сохранении проекта

### Восстановление (`server/bots/restoreRunningBots.ts`)
- Ищет в БД боты со статусом `running` или маркером `__server_restart__`
- Для каждого вызывает `startBot()`

### Graceful Shutdown (`server/utils/graceful-shutdown.ts`)
- Маркер `__server_restart__` → SIGTERM/SIGKILL всех → очищает Map → закрывает БД

---

## Архитектура Worker Pool

### Python Worker (`server/python/worker.py`)

Долгоживущий Python процесс. Принимает команды через stdin (JSON), управляет ботами внутри одного `asyncio` event loop.

**Команды:**
```json
{ "cmd": "start_bot", "token": "123:ABC...", "token_id": 42, "bot_file": "/path/to/bot.py" }
{ "cmd": "stop_bot", "token_id": 42 }
{ "cmd": "status" }
{ "cmd": "shutdown" }
```

**Вывод логов** — каждая строка stdout содержит `token_id` для маршрутизации:
```json
{ "token_id": 42, "type": "stdout", "content": "Bot started" }
{ "token_id": 42, "type": "stderr", "content": "WARNING: rate limit" }
```

### Изоляция переменных

Каждый бот внутри воркера имеет свой namespace:

```python
bot_contexts = {
    42: {"user_vars": {}, "dispatcher": dp1},   # tokenId=42
    43: {"user_vars": {}, "dispatcher": dp2},   # tokenId=43
}
```

Боты не видят переменные друг друга. Поведение идентично текущему.

### Логи

Цепочка доставки не меняется:
```
Python (flush=True) → stdout воркера (JSON) → Node.js парсит → WebSocket → UI терминал
```

Единственная разница — `JSON.parse()` для маршрутизации по `token_id`. Задержка не ощутима.

### Изоляция ошибок

Если один бот бросает необработанное исключение — остальные продолжают работать.
`try/except` вокруг каждого бота + механизм перезапуска конкретного бота без рестарта воркера.

### Rate Limiting

Telegram ограничивает ~30 запросов/сек на один IP. Глобальный throttler на уровне воркера
предотвращает rate limit при 100+ ботах.

---

## Этапы реализации

### ~~Этап 1 — Python Worker~~ ✅ РЕАЛИЗОВАНО

**Файл:** `server/python/worker.py`

- [x] Приём команд через stdin (JSON protocol)
- [x] `start_bot` — загрузка bot.py через `compile()` + `exec()`
- [x] `stop_bot` — остановка через `task.cancel()`
- [x] `shutdown` — остановка всех ботов
- [x] `status` — список активных ботов
- [x] Маршрутизация логов по `token_id` (JSON)
- [x] Изоляция переменных (отдельный namespace)
- [x] try/except (ошибка одного не роняет остальных)
- [x] Перехват root logger → JSON с token_id
- [x] Перехват signal.signal → no-op
- [x] Перехват print → emit_log
- [x] sys.path вместо os.chdir
- [x] UTF-8 stdout на Windows
- [x] Threading для stdin (Windows-совместимо)

---

### ~~Этап 2 — Node.js интеграция~~ ✅ РЕАЛИЗОВАНО

**Файл:** `server/bots/botWorkerManager.ts`

| Изменённый файл | Что сделано |
|---|---|
| `server/bots/startBot.ts` | Блок `USE_WORKER_POOL` — запуск через воркер |
| `server/bots/stopBot.ts` | Остановка через воркер |
| `server/bots/restartBotIfRunning.ts` | Мгновенный перезапуск (500мс) |
| `server/terminal/setupBotProcessListeners.ts` | Подписка на `bot-log` |
| `server/utils/graceful-shutdown.ts` | `workerManager.shutdownAll()` |
| `server/routes/.../botStatusByTokenHandler.ts` | `workerManager.isBotRunning()` |
| `lib/templates/main/main.py.jinja2` | `except asyncio.CancelledError` |

- [x] Lifecycle: создание/убийство воркера
- [x] Маршрутизация raw логов
- [x] Fallback на spawn если `USE_WORKER_POOL` не задан

---

### ~~Этап 3 — БД + UI~~ ✅ РЕАЛИЗОВАНО

| Файл | Что добавлено |
|---|---|
| `migrations/0033_create_worker_processes.sql` | SQL миграция |
| `shared/schema/tables/worker-processes.ts` | Drizzle-схема |
| `server/database/DatabaseStorage.ts` | Методы storage |
| `server/routes/.../workerStatsHandler.ts` | `GET /api/workers/stats` |
| `client/.../WorkerPoolStatus.tsx` | UI статус-бар |

- [x] Таблица `worker_processes`
- [x] API: workers, totalBots, totalMemoryMb, details
- [x] UI: "1 воркер · 2 бота · 150 MB"
- [x] Метрики RAM через tasklist/ps

---

### Этап 4 — Масштабирование (когда 1 воркер не справляется)

- [ ] Несколько воркеров на проект (пул)
- [ ] Балансировщик по наименьшей нагрузке
- [ ] Redis для координации между Node.js инстансами
- [ ] Нагрузочный тест: 100+ ботов на одном воркере
- [ ] Тест восстановления при падении воркера

---

## Hot Reload кода

При перегенерации `bot.py` (сохранение проекта):
1. Отправить `stop_bot` воркеру (конкретный tokenId)
2. Перегенерировать файл
3. Отправить `start_bot` с новым файлом

Воркер не перезапускается — остальные боты продолжают работать.

---

## Когда реализовывать

Имеет смысл при 50+ одновременно запущенных ботах на одном сервере.
До этого порога текущая архитектура работает без проблем.

---

## Сравнение

| Метрика | Сейчас (1 процесс/бот) | Worker Pool (1 воркер/проект) |
|---|---|---|
| RAM на 10 ботов | ~800MB | ~150MB |
| RAM на 100 ботов | ~8GB | ~500MB |
| Время запуска бота | 1-2 сек (init Python) | ~100мс (добавление в loop) |
| Изоляция между проектами | ✅ (разные процессы) | ✅ (разные воркеры) |
| Изоляция между ботами | ✅ (разные процессы) | ✅ (разные namespace) |
| Hot reload | Перезапуск процесса | stop_bot + start_bot (мгновенно) |
| Логи в UI | stdout процесса → WS | JSON stdout → parse → WS |
