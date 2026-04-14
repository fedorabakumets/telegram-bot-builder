# redis-storage

Шаблон класса `RedisStorage(BaseStorage)` для aiogram FSM.

## Описание

Используется когда `REDIS_URL` задан в `.env` бота.
Хранит FSM состояния в Redis с TTL 24 часа.
Обратно совместим с `PostgresStorage` — при отсутствии `REDIS_URL` не используется.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|---------|
| redisEnabled | boolean | false | Включён ли Redis |

## Ключи Redis

- `fsm:state:{user_id}` — FSM состояние пользователя (TTL 24ч)
- `fsm:data:{user_id}` — FSM данные пользователя (TTL 24ч)
- `vars_cache:{user_id}` — кэш переменных из БД (TTL VARS_CACHE_TTL)

## Пример использования

Задать в `.env` бота:
```
REDIS_URL=redis://localhost:6379
```

На Railway:
```
REDIS_URL=${{Redis.REDIS_URL}}
```
