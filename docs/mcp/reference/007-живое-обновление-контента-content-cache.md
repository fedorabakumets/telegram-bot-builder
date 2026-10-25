# Живое обновление контента (`CONTENT_CACHE`)

Флаг `contentCache` (env `CONTENT_CACHE`, значения `0`/`1`, по умолчанию `0`) управляет генерацией машинерии «живого» обновления контента из таблицы `_content`: функций `load_content`, `reload_content`, фоновых задач `_content_reload_loop` (перезагрузка кэша каждые 60 сек) и `_content_subscribe_redis` (мгновенное обновление через Redis pub/sub), а также их вызовов в `main()`.

Важно: аксессор `get_content(key, fallback)` и кэш `_content_cache` генерируются **всегда** (при заданном `projectId`), потому что текст каждой ноды обращается к `get_content(...)`. При `contentCache=0` машинерия live-reload не генерируется, кэш остаётся пустым, и `get_content` всегда возвращает вшитый в код `fallback`-текст — живого обновления нет, но код не ломается. Формула: `generateContent = (contentCache === true)`.
