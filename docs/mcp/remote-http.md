# Remote HTTP MCP (без клона репозитория)

> Пользователь подключает агента по URL `https://<домен>/mcp` + Bearer PAT.
> Клон репо и `npm run mcp:bot-builder` не нужны. Stdio остаётся для локальной разработки.

Связанные документы: [[mcp/overview]], [[mcp/bot-builder]], вкладка «Агент» в редакторе.

---

## Зачем

Раньше MCP работал только как **stdio**-процесс из репозитория. Для коллабораторов (Cursor / Claude / Codex) это требовало клон + Node + `cwd`.

**Remote Streamable HTTP** поднимает тот же набор live-тулов на эндпоинте `/mcp` внутри приложения. Клиент указывает только URL и токен из вкладки «Агент».

---

## Быстрый старт

1. Откройте конструктор → проект → вкладка **«Агент»** → **Создать токен**.
2. Скопируйте токен `mcp_…` (показывается один раз) и сниппет **Remote URL**.
3. Вставьте в конфиг клиента:

### Cursor / Claude Desktop

```json
{
  "mcpServers": {
    "botcraft-builder": {
      "url": "https://<домен>/mcp",
      "headers": {
        "Authorization": "Bearer mcp_…"
      }
    }
  }
}
```

### Claude Code

Тот же JSON, плюс `"type": "http"` рядом с `url`.

### OpenAI Codex (`~/.codex/config.toml`)

```toml
[mcp_servers.botcraft-builder]
url = "https://<домен>/mcp"
bearer_token_env_var = "MCP_AGENT_TOKEN"
```

Секрет задайте в env (`MCP_AGENT_TOKEN`), не коммитьте.

4. Refresh MCP в клиенте → Connected.

---

## Архитектура

```
Клиент (Cursor/Claude/Codex)
        │  POST /mcp  Authorization: Bearer mcp_…
        ▼
Express requireMcpBearer + rate limit
        │  ALS: runWithMcpToken
        ▼
StreamableHTTP (stateless) + registerMcpTools(enableFileTools: false)
        │
        ▼
lib/bot-tools apiFetch → /api/* (тот же PAT) → БД / холст
```

- **Stateless** (`sessionIdGenerator: undefined`): новый server+transport на каждый POST — подходит для нескольких реплик без sticky sessions.
- GET/DELETE `/mcp` → `405` (SSE-сессии не используются в MVP).
- Флаг: `MCP_HTTP_ENABLED` (по умолчанию включено; `false`/`0`/`off` → `503`).

---

## Какие тулы на HTTP

| Группа | На HTTP |
|--------|---------|
| Introspection / validate / generate / mutate JSON | да |
| Live `db_*`, `update_project_db` | да |
| `load_project` / `save_project` (диск `bots/`) | **нет** |

Файловые тулы на remote писали бы в **FS сервера**, а не в БД пользователя — риск multi-tenant. Для сценария пользователя используйте `db_*` / `update_project_db`. На stdio файловые тулы остаются.

---

## Безопасность (threat model)

| Угроза | Мера |
|--------|------|
| Чужой токен в shared `process.env` | Per-request ALS (`mcp-request-context`) |
| Нет / битый / отозванный PAT | `401` до транспорта MCP |
| Брутфорс / флуд | Rate limit по IP и по `ownerId` |
| Утечка секрета в логах | Логировать только prefix, не сырой `mcp_…` |
| Украденный PAT = доступ к проектам владельца | Отзыв на вкладке «Агент», TTL при создании |
| Запись на общий диск | File-тулы отключены на HTTP |

**Фаза 2 (не в MVP):** OAuth 2.1 + PKCE по спеке MCP, enforcement scopes `read`/`write`.

---

## Локальный stdio (по-прежнему)

```bash
npm run mcp:bot-builder
```

В `mcp.json`: `command` / `cwd` / `env.API_BASE_URL` / `env.MCP_AGENT_TOKEN`. См. [[mcp/bot-builder#Установка и подключение]].

---

## Операции

| Env | Смысл |
|-----|--------|
| `MCP_HTTP_ENABLED` | Вкл/выкл `/mcp` |
| `API_BASE_URL` | Куда `apiFetch` ходит за `/api/*` (обычно тот же origin) |
| `MCP_AGENT_TOKEN` | Только для **stdio**; на HTTP токен из заголовка |

Проверка: `POST /mcp` без Bearer → `401`; с валидным PAT и MCP initialize → OK; после отзыва токена → `401`.
