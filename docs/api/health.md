# health

Эндпоинтов: **2**

### `GET` /api/health

Healthcheck компонентов

**Авторизация:** Публичный

Публичный liveness/readiness без авторизации.

- `database` — БД инициализирована
- `templates` — системные шаблоны загружены (независимо от БД)
- `ready` — **равно `database`** (API считает себя готовым при готовой БД)

UI: `ServerStatus` (поллинг до `ready`). Railway/балансировщики — этот path.
Заменяет устаревший `GET /api`.

```bash
curl -s http://localhost:5000/api/health
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Статус компонентов |

#### Пример ответа `200`

```json
{
  "database": true,
  "templates": true,
  "ready": true
}
```

### `HEAD` /api/health

Healthcheck без тела (204)

**Авторизация:** Публичный

Тот же probe, что GET, но **без JSON**: ответ **204** и пустое тело.

Удобно для load balancer health checks.

```bash
curl -s -I -X HEAD http://localhost:5000/api/health
```

#### Ответы

| Код | Описание |
|-----|----------|
| 204 | Сервер отвечает, тела нет |
