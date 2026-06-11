<!-- @fileoverview Концепция узла `parallel_split` для BotCraft Studio.
     Fan-out — параллельный запуск нескольких веток нод без точки сбора. -->

# Узел `parallel_split` — параллельный запуск веток

## Статус

🔲 Не реализовано — концепция, ожидает реализации

---

## 1. Проблема

Сейчас цепочки нод выполняются **строго последовательно**: `autoTransitionTo` — это
`await` следующего обработчика. Если шаги друг от друга не зависят, время выполнения
всё равно складывается из суммы всех шагов.

| Сценарий | Последовательно | С parallel_split |
|----------|-----------------|------------------|
| 5 HTTP-запросов к разным API | сумма таймаутов | максимальный таймаут |
| Рассылка в 4 канала/чата | 4 × время отправки | 1 × время отправки |
| Опрос 15 внешних ботов через userbot | 2–3 мин | ~30 сек |
| 3 SQL-отчёта для дашборда | сумма запросов | самый долгий запрос |
| Проверка подписки + капча + загрузка профиля | сумма проверок | самая долгая проверка |

**Реальная проблема:** пользователь смотрит на «⏳ Загрузка…» минуты, хотя
большую часть этого времени бот просто ждёт независимые ответы по очереди.

---

## 2. Концепция

Узел `parallel_split` запускает **каждый выходной порт как отдельную asyncio-задачу**.
Ветки выполняются одновременно и дальше живут своей жизнью — точки сбора (join) у ноды нет.

Сбор результатов (если нужен) собирается из **существующих нод**:
каждая ветка в конце инкрементит счётчик (`set_variable`), а `condition`
проверяет «все ли финишировали» — последняя завершившаяся ветка запускает итог.

### Аналоги

| Платформа | Реализация |
|-----------|-----------|
| n8n | несколько связей из одного выхода (ветки независимы) |
| Make (Integromat) | Router — разветвление на параллельные маршруты |
| BPMN | Parallel Gateway (fork) |
| Python | `asyncio.create_task()` на каждую ветку |

### Ключевые свойства

- **Без join**: нода только запускает ветки; куда они придут — дело каждой ветки
- **Порты как у condition**: массив веток с `target`, UI-механизм портов переиспользуется
- **Лимит одновременности**: `maxConcurrent` — батчи для защиты от rate-limit (Telegram FloodWait, API-квоты)
- **Совместимость**: любая нода с обработчиком работает внутри ветки без изменений
- **Сбор — паттерн, не механизм**: счётчик + condition из существующих кирпичей

---

## 3. Как выглядит в UI

### На холсте (canvas)

```
┌─────────────────────────────────┐
│ ⚡ Параллельная группа           │
│                                 │
│ Одновременно: 5                 │
│                                 │
│  ● Ветка 1 ──→ [http_request: погода]
│  ● Ветка 2 ──→ [http_request: курсы валют]
│  ● Ветка 3 ──→ [psql_query: статистика]
│  + Добавить ветку               │
└─────────────────────────────────┘
```

Каждая ветка — отдельный выходной Handle/порт (как branches у `condition`).
Кнопка «+ Добавить ветку» добавляет порт; стрелку можно тянуть куда угодно.

### Панель настроек (правый сайдбар)

```
┌─────────────────────────────────────┐
│ ⚡ Параллельная группа               │
├─────────────────────────────────────┤
│                                     │
│ Ветки:                              │
│ ┌───────────────────────────────┐   │
│ │ 1. Погода            [✏][🗑]  │   │
│ │ 2. Курсы валют       [✏][🗑]  │   │
│ │ 3. Статистика        [✏][🗑]  │   │
│ └───────────────────────────────┘   │
│ [+ Добавить ветку]                  │
│ ℹ️ Подпись отображается на порту    │
│                                     │
│ ─── Дополнительно ───               │
│                                     │
│ Максимум одновременных веток:       │
│ ┌───────────────────────────────┐   │
│ │ 5                             │   │
│ └───────────────────────────────┘   │
│ ℹ️ Остальные ждут в очереди         │
│    (anti-flood / API-квоты)         │
│                                     │
│ ☑ Не запускать повторно, пока       │
│   предыдущий прогон не завершён     │
│ ℹ️ Защита от двойного нажатия       │
│                                     │
│ ☐ Ждать завершения всех веток       │
│   перед продолжением (await)        │
│ ℹ️ По умолчанию fire-and-forget     │
│                                     │
└─────────────────────────────────────┘
```

---

## 4. Структура узла в `project.json`

```json
{
  "id": "split-dashboard",
  "type": "parallel_split",
  "position": { "x": 800, "y": 400 },
  "data": {
    "parallelBranches": [
      { "id": "br_weather", "label": "Погода", "target": "http-weather" },
      { "id": "br_rates", "label": "Курсы валют", "target": "http-rates" },
      { "id": "br_stats", "label": "Статистика", "target": "psql-stats", "onErrorTarget": "setv-stats-failed" }
    ],
    "maxConcurrent": 5,
    "awaitAll": false,
    "skipIfRunning": true
  }
}
```

### Схема полей `data`

| Поле | Тип | Обязательное | По умолчанию | Описание |
|------|-----|:---:|:---:|---------|
| `parallelBranches` | `array` | ✅ | `[]` | Ветки параллельного запуска |
| `parallelBranches[].id` | `string` | ✅ | — | Уникальный ID порта |
| `parallelBranches[].label` | `string` | ❌ | `""` | Подпись порта на холсте |
| `parallelBranches[].target` | `string` | ✅ | — | ID стартовой ноды ветки |
| `parallelBranches[].onErrorTarget` | `string` | ❌ | — | Нода, запускаемая при ошибке ветки (обычно setv-инкремент, чтобы сбор не завис) |
| `maxConcurrent` | `number` | ❌ | `5` | Лимит одновременных веток (0 = без лимита) |
| `awaitAll` | `boolean` | ❌ | `false` | Дождаться всех веток перед выходом из обработчика |
| `skipIfRunning` | `boolean` | ❌ | `true` | Не запускать повторно, пока предыдущий прогон этого пользователя не завершён |

---

## 5. Сценарии использования

### 5.1 Дашборд из нескольких источников

Команда `/dashboard` собирает данные из трёх мест одновременно:

```
setv (dash_done = 0)
  → parallel_split
      ● → http_request (погода)      → setv (dash_done + 1) → cond (== 3?)
      ● → http_request (курсы валют) → setv (dash_done + 1) → cond (== 3?)
      ● → psql_query (статистика)    → setv (dash_done + 1) → cond (== 3?)

cond (dash_done == 3):
  да  → message "🌤 {weather} | 💱 {rates} | 📊 {stats}"
  нет → (ветка завершается)
```

Время ответа = самый долгий запрос, а не сумма трёх.

### 5.2 Уведомления в несколько каналов

Заявка пользователя дублируется сразу всем — сбор не нужен:

```
input (заявка) → parallel_split
    ● → message (канал менеджеров)
    ● → forward_message (админу в ЛС)
    ● → http_request (POST в CRM)
    ● → bot_table (записать в таблицу заявок)
```

### 5.3 Гонка провайдеров — «кто быстрее»

Запрос к двум платёжным шлюзам / LLM / геокодерам, побеждает первый ответ:

```
setv (race_winner = "")
  → parallel_split
      ● → http_request (провайдер A) → cond (race_winner пустой?)
                                          да → setv (race_winner = "A") → message
      ● → http_request (провайдер B) → cond (race_winner пустой?)
                                          да → setv (race_winner = "B") → message
```

Оператор `filled`/`empty` у `condition` уже существует.

### 5.4 Онбординг: параллельные проверки

При входе нового пользователя — три независимые проверки:

```
start → parallel_split
    ● → http_request (проверка подписки на канал) → setv (check_sub = 1) → cond
    ● → psql_query (история банов)                → setv (check_ban = 1) → cond
    ● → http_request (загрузка аватара/профиля)   → setv (check_prof = 1) → cond

cond (все 3 готовы) → condition (есть бан?) → приветствие / отказ
```

### 5.5 Живой прогресс

Каждая ветка по завершении сама обновляет сообщение — статусы появляются
в порядке реального финиша:

```
ветка N: … → setv (progress_text += "✅ {имя ветки}\n") → edit_message → setv (count+1) → cond
```

### 5.6 Частичный результат — «любые 2 из 3»

Показать ответ, когда готово большинство источников, не дожидаясь самого медленного:

```
cond (done_count greater_than 1) → показать предварительный результат
cond (done_count equals 3)       → дорисовать полный
```

### 5.7 Медиа-обработка

Пользователь прислал видео — параллельно:

```
input (видео) → parallel_split
    ● → convert_file (mp4 → gif)        → setv +1 → cond
    ● → convert_file (извлечь аудио)    → setv +1 → cond
    ● → http_request (загрузка в облако) → setv +1 → cond

cond (== 3) → message "Готово: gif, аудио, ссылка"
```

### 5.8 Health-check сервисов по расписанию

```
schedule_trigger (каждые 5 мин) → parallel_split
    ● → http_request (сервис 1) → cond (status != 200?) → message (алерт админу)
    ● → http_request (сервис 2) → cond (…) → …
    ● → http_request (сервис 3) → cond (…) → …
```

Сбор не нужен — каждая ветка сама решает, алертить или молчать.

### 5.9 Опрос внешних ботов через userbot

Диалоги с разными ботами — разные чаты, ответы не пересекаются.
15 цепочек последовательно — 2–3 минуты, параллельно — ~30 сек
(пример: сравнение курсов обменников в боте 242).

### 5.10 Рассылка батчами

`maxConcurrent: 10` превращает split в управляемый пул отправки:
100 веток-получателей идут пачками по 10 — быстро, но без FloodWait.

### 5.11 Ответ пользователю + фоновая аналитика

Пользователь получает ответ мгновенно, а логирование/метрики не тормозят UX:

```
command → parallel_split
    ● → message (ответ пользователю)          ← мгновенно
    ● → http_request (событие в аналитику)    ← в фоне
    ● → bot_table (лог действия)              ← в фоне
```

Классический паттерн «не заставляй пользователя ждать побочные эффекты».

### 5.12 Модерация контента несколькими фильтрами

Сообщение из группы прогоняется через независимые проверки:

```
group message → parallel_split
    ● → http_request (антиспам API)       → setv (spam_score)    → setv +1 → cond
    ● → http_request (проверка токсичности) → setv (toxic_score) → setv +1 → cond
    ● → http_request (NSFW-детектор фото)  → setv (nsfw_score)   → setv +1 → cond

cond (== 3) → condition (хоть один скор выше порога?)
    да  → delete_message + mute_user + алерт модераторам
    нет → (пропустить)
```

### 5.13 Агрегатор цен / поиск по нескольким источникам

«Найди товар X» — запрос сразу к нескольким маркетплейсам/каталогам:

```
input (название товара) → parallel_split
    ● → http_request (маркетплейс A) → setv (price_a) → setv +1 → cond
    ● → http_request (маркетплейс B) → setv (price_b) → setv +1 → cond
    ● → http_request (маркетплейс C) → setv (price_c) → setv +1 → cond

cond (== 3) → setv (выбрать минимум через expression) → message "Дешевле всего: …"
```

### 5.14 Проверка доступности перед бронированием

Бот бронирований: проверить слот сразу в нескольких системах:

```
выбор даты → parallel_split
    ● → psql_query (занятость в своей БД)     → setv +1 → cond
    ● → http_request (Google Calendar)        → setv +1 → cond
    ● → http_request (CRM поставщика)         → setv +1 → cond

cond (== 3) → condition (все свободны?) → подтвердить / предложить другое время
```

### 5.15 Таймаут-сторож как сценарий

Вторая ветка — просто таймер, страхующий первую:

```
parallel_split
    ● → http_request (медленный API) → cond (answered пустой?) → setv (answered=api) → message (результат)
    ● → delay (10 сек)               → cond (answered пустой?) → setv (answered=timeout) → message "Сервис не отвечает, попробуйте позже"
```

Кто первый выставил `answered` — тот и ответил пользователю.

### 5.16 Геймификация: событие → веер реакций

Пользователь выполнил действие — параллельно срабатывает вся «обвязка»:

```
действие → parallel_split
    ● → setv (баллы +10) → psql_query (сохранить)
    ● → psql_query (проверка достижений) → condition (новое?) → message "🏆 Достижение!"
    ● → psql_query (обновить лидерборд)
    ● → message (уведомить реферера о активности)
```

Ветки независимы, сбор не нужен — каждая делает своё.

### 5.17 Бэкап / дублирование данных в несколько хранилищ

```
schedule_trigger (раз в сутки) → psql_query (выгрузка) → parallel_split
    ● → http_request (загрузка в S3)        → cond (ошибка?) → алерт
    ● → http_request (загрузка на FTP)      → cond (ошибка?) → алерт
    ● → message (дамп файлом в архивный канал)
```

### 5.18 Прогрев данных при старте сценария

Пока пользователь читает приветствие и жмёт кнопки меню — данные уже грузятся:

```
start → parallel_split
    ● → message (приветствие + меню)              ← пользователь занят чтением
    ● → http_request (профиль из CRM) → setv (…)  ← к моменту клика уже готово
    ● → psql_query (история заказов)  → setv (…)
```

К нажатию первой кнопки переменные уже заполнены — меню открывается без задержки.

### 5.19 Уведомление на нескольких языках / в несколько форматов

Один инфоповод — параллельная подготовка и доставка разных представлений:

```
событие → parallel_split
    ● → http_request (перевод RU) → message (RU-канал)
    ● → http_request (перевод EN) → message (EN-канал)
    ● → setv (краткая версия)     → message (дайджест-канал)
```

### 5.20 Антифрод параллельно с обработкой заказа

Пользователь видит «заказ принят» сразу, проверка идёт в фоне:

```
заказ → parallel_split
    ● → message "✅ Заказ принят, обрабатываем…"
    ● → http_request (антифрод-скоринг) → condition (риск высокий?)
            да → setv (order_status=hold) → message (админу: проверить вручную)
            нет → setv (order_status=ok) → edit_message "🚀 Заказ подтверждён"
```

---

## 6. Генерируемый Python-код

```python
# Реестр активных запусков split-нод: (user_id, node_id)
_active_splits: set = set()

# Обработчик параллельного запуска: split-dashboard
@dp.callback_query(lambda c: c.data == "split-dashboard")
async def handle_callback_split_dashboard(callback_query: types.CallbackQuery, state: FSMContext = None):
    """Параллельный запуск 3 веток (лимит одновременности: 5)."""
    user_id = callback_query.from_user.id

    # skipIfRunning=true: защита от двойного запуска
    _split_key = (user_id, "split-dashboard")
    if _split_key in _active_splits:
        try:
            await callback_query.answer("⏳ Уже выполняется")
        except Exception:
            pass
        return
    _active_splits.add(_split_key)

    logging.info(f"⚡ parallel_split [split-dashboard]: запуск 3 веток для {user_id}")

    try:
        await callback_query.answer()
    except Exception:
        pass

    _semaphore = asyncio.Semaphore(5)  # maxConcurrent

    async def _run_branch(_handler, _label, _on_error=None):
        async with _semaphore:
            try:
                await _handler(callback_query, state=state)
                logging.info(f"⚡ [split-dashboard] ветка '{_label}' завершена")
            except Exception as _br_err:
                logging.error(f"❌ [split-dashboard] ветка '{_label}': {_br_err}")
                if _on_error:
                    # onErrorTarget: ветка-фоллбек (обычно setv-инкремент, чтобы сбор не завис)
                    try:
                        await _on_error(callback_query, state=state)
                    except Exception as _fb_err:
                        logging.error(f"❌ [split-dashboard] фоллбек '{_label}': {_fb_err}")

    async def _run_all():
        try:
            await asyncio.gather(
                _run_branch(handle_callback_http_weather, "Погода"),
                _run_branch(handle_callback_http_rates, "Курсы валют"),
                _run_branch(handle_callback_psql_stats, "Статистика", handle_callback_setv_stats_failed),
                return_exceptions=True,
            )
        finally:
            # снимаем ключ когда ВСЕ ветки завершились — повторный запуск снова доступен
            _active_splits.discard(_split_key)

    _supervisor = asyncio.create_task(_run_all())
    # awaitAll=false: fire-and-forget, обработчик завершается сразу
```

При `awaitAll: true` последняя строка заменяется на:

```python
    await _supervisor
```

Задача-супервизор нужна в обоих режимах: она снимает ключ `skipIfRunning`
ровно в момент завершения последней ветки.

### Атомарный инкремент для паттерна сбора

Ветки шарят `user_data` — инкремент счётчика из нескольких задач должен быть атомарным.
В `set_variable` добавляется лок на пользователя (общий для всех инкрементов):

```python
_user_var_locks: dict[int, asyncio.Lock] = {}

def _get_user_var_lock(user_id: int) -> asyncio.Lock:
    if user_id not in _user_var_locks:
        _user_var_locks[user_id] = asyncio.Lock()
    return _user_var_locks[user_id]

# в set_variable (mode=expression, если включён atomic):
async with _get_user_var_lock(user_id):
    user_data[user_id]["dash_done"] = _eval_expr(...)
```

---

## 7. Паттерн сбора результатов (join без join-ноды)

Join собирается из существующих нод — `parallel_split` про это ничего не знает:

```
┌ ветка 1 ┐
│ ветка 2 ├─→ setv: done_count = int({done_count}) + 1   (atomic)
└ ветка 3 ┘        ↓
            condition: done_count
              equals "3" → итоговая нода (message / calc / отчёт)
              else       → (stop, ветка завершается)
```

Свойства паттерна:

- **Последняя ветка запускает сборку** — никто не ждёт впустую
- **Гибкость**: `equals 3` → ждать всех; `greater_than 1` → показать после 2 из 3;
  `filled` → гонка «кто первый»
- **Таймаут-страховка**: ветка с `delay` 60 сек + `condition` «итог уже показан?» —
  если какая-то ветка зависла, сборка всё равно произойдёт

---

## 8. Совместимость с существующими нодами

`parallel_split` вызывает стандартные обработчики через `asyncio.create_task` —
работает всё, что работает в обычной цепочке.

| Нода внутри ветки | Что делает | Примечание |
|---|---|---|
| `http_request` | Параллельные API-запросы | основной выигрыш по времени |
| `psql_query`, `bot_table` | Запросы/запись в БД | каждая ветка пишет свои строки |
| `set_variable` | Свой префикс на ветку | `weather_*`, `rates_*` — без конфликтов |
| `condition` | Join-паттерн, гонка, ветвление | операторы `equals`, `filled`, `greater_than` |
| `edit_message` | Живой прогресс | все ветки редактируют одно сообщение — Telegram сериализует |
| `message`, `forward_message` | Мульти-доставка | сбор не обязателен |
| `convert_file` | Параллельная обработка медиа | CPU-bound — учитывать нагрузку |
| `delay` | Таймаут-страховка | ветка-сторож для зависших задач |
| `userbot_message` / `userbot_click_button` | Диалоги с внешними ботами | разные чаты — ответы не перепутаются |
| `loop` | Цикл внутри ветки | изолирован, если `itemVariable` разные |

### Что НЕ имеет смысла внутри ветки

- `input` — несколько веток не могут одновременно ждать ввод одного пользователя (FSM один)
- триггеры (`command_trigger`, `schedule_trigger`…) — точки входа, не действия

### Входы в ноду

Любая нода с `autoTransitionTo`, ветки `condition`, кнопки `keyboard` (`action: goto`) —
для них `parallel_split` неотличима от обычной ноды.

---

## 9. Граничные случаи

### 9.1 Ветка упала с ошибкой

Каждая задача обёрнута в try/except — ошибка одной ветки не роняет остальные.
Но счётчик сбора тогда не дойдёт до N. Решения (по приоритету):

- `onErrorTarget` у ветки — при ошибке запускается указанная нода (обычно
  setv-инкремент + пометка «⚠️ н/д»), счётчик дойдёт до N даже при падении;
- ветка-сторож с `delay` (см. п. 7) — страховка от зависших (не упавших) веток.

### 9.2 Гонка инкремента счётчика

Без лока две ветки могут прочитать `done_count = 1` одновременно и обе записать `2`.
Решение — `asyncio.Lock` per-user в `set_variable` (п. 6). Без лока паттерн сбора ненадёжен —
это **обязательная** часть реализации.

### 9.3 Rate-limit внешних систем

Много одновременных запросов от одного бота/аккаунта — риск лимитов
(Telegram FloodWait, квоты API). `maxConcurrent` запускает ветки батчами
через `asyncio.Semaphore`. Рекомендация по умолчанию: 5.

### 9.4 Общий `edit_message` прогресса

Несколько веток одновременно редактируют одно сообщение. Telegram API сериализует
запросы, но возможна ошибка «message is not modified» — она уже игнорируется
в шаблоне `edit_message`.

### 9.5 Пустой список веток

`parallelBranches: []` — обработчик логирует предупреждение и завершается.

### 9.6 Один пользователь — два запуска split

Если пользователь запустил сценарий повторно до завершения первого — ветки двух
прогонов смешались бы (общие переменные, сброс счётчика посреди работы).

Защита встроена в ноду: `skipIfRunning: true` (по умолчанию) — реестр
`_active_splits` по ключу `(user_id, node_id)` не даёт запустить повторно,
пользователь получает «⏳ Уже выполняется». Ключ снимается супервизором,
когда завершились все ветки (п. 6).

Для кастомной логики (своё сообщение, таймер до разблокировки) `skipIfRunning`
можно выключить и поставить классический шлагбаум: флаг `in_progress` +
`condition` перед нодой.

### 9.7 awaitAll и долгие ветки

При `awaitAll: true` обработчик висит до завершения всех веток — Telegram callback
может протухнуть (answer уже отправлен, это ок), но aiogram-таймаутов нет.
По умолчанию `false` — рекомендуемый режим.

---

## 10. Зависимости от других фич

| Фича | Зачем нужна | Статус |
|------|-------------|--------|
| `set_variable` mode `expression` | Инкремент счётчика | ✅ уже работает |
| `condition` операторы `equals` / `filled` / `greater_than` | Join-паттерн, гонка | ✅ уже работает |
| Атомарный инкремент (Lock) | Надёжность счётчика | 🔲 добавить в set_variable |
| `delay` | Таймаут-страховка | ✅ уже работает |
| `http_request`, `psql_query`, `userbot_message` | Содержимое веток | ✅ уже работает |

---

## 11. Что нужно реализовать

| Файл | Что изменить |
|------|-------------|
| `shared/schema/tables/node-schema.ts` | Добавить `'parallel_split'` в enum типов, поля `parallelBranches` (с `onErrorTarget`), `maxConcurrent`, `awaitAll`, `skipIfRunning` |
| `lib/bot-generator/types/node-type.constants.ts` | Добавить `PARALLEL_SPLIT: 'parallel_split'` |
| `lib/templates/parallel-split/` | Создать: `parallel-split.params.ts`, `.schema.ts`, `.renderer.ts`, `.py.jinja2`, `index.ts` |
| `lib/templates/node-handlers/node-handlers.dispatcher.ts` | `case 'parallel_split'` → генератор |
| `lib/templates/filters/node-predicates.ts` | Предикат `hasParallelSplitNodes` |
| `lib/templates/set-variable/set-variable.py.jinja2` | Лок per-user для атомарного инкремента |
| `lib/index.ts` | Экспорт для внешнего использования |
| `client/components/editor/properties/utils/node-constants.ts` | Добавить в `MANAGEMENT_NODE_TYPES` |
| `client/components/editor/properties/` | Панель настроек: список веток (+ onErrorTarget), maxConcurrent, skipIfRunning |
| `client/components/editor/canvas/nodes/` | Компонент ноды с динамическими портами (по образцу condition) |
| `lib/tests/` | Фазовый тест генерации |
| `docs/bot-json-prompt.md` | Описание узла для ИИ |
| `docs/features/NODE_TYPES.md` | Описание настроек и ограничений |

### Порядок реализации (фронтенд первее lib)

1. UI: компонент ноды на холсте с динамическими портами + панель настроек + сайдбар
2. Схема + типы (shared/schema, constants)
3. Шаблон генератора (`lib/templates/parallel-split/`) + лок в set_variable
4. Регистрация в dispatcher, predicates, lib/index
5. Фазовый тест
6. Документация (bot-json-prompt, NODE_TYPES)

---

## 12. Сравнение с `loop (parallel=true)` и join-вариантом

| | `loop` parallel | `parallel_split` | `parallel_group` (с join) |
|---|---|---|---|
| Ветки | одна цепочка × N элементов | разные цепочки | разные цепочки |
| Сбор | после gather автоматически | паттерн счётчик+condition | встроенный `joinTo` |
| Гибкость сбора | нет (всегда ждать всех) | любая (все / 2 из 3 / гонка / без сбора) | только «ждать всех» |
| Код в lib | средний | минимальный | большой (state, таймауты) |
| UI | два выхода | динамические порты (как condition) | порты + join-выход |

### Почему выбран вариант без join

- Нода-минималист: вся работа — `create_task` на каждый порт
- Join из существующих кирпичей гибче встроенного (частичный сбор, гонка, сторожа)
- Меньше кода в lib = меньше поверхность ошибок
- `loop (parallel=true)` остаётся для однотипных элементов (один и тот же флоу × N данных);
  `parallel_split` — для разнородных цепочек (разные флоу одновременно)
