<!--
 * @fileoverview Фича: совместный доступ к проекту (коллабораторы)
 * @module docs/futures/project-collaborators
-->

# Совместный доступ к проекту

Возможность добавлять нескольких пользователей к одному проекту с полным доступом.

---

## Проблема

Сейчас у каждого проекта один владелец (`bot_projects.owner_id`). Если несколько людей работают над одним ботом — им приходится шарить один аккаунт или дублировать проект. Реальный кейс: проект TorLink с 10+ токенами разных людей — все работают в одном проекте, но владелец только один.

---

## Решение

Добавить таблицу `project_collaborators` — список пользователей с доступом к проекту.

### Миграция БД

```sql
CREATE TABLE project_collaborators (
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  user_id    BIGINT  NOT NULL REFERENCES telegram_users(id) ON DELETE CASCADE,
  invited_by BIGINT  REFERENCES telegram_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX idx_project_collaborators_user ON project_collaborators(user_id);
```

---

## Логика доступа

Пользователь имеет доступ к проекту если:
- он является `owner_id` проекта, **или**
- он есть в `project_collaborators` для этого проекта

```ts
// Проверка доступа
async function hasProjectAccess(projectId: number, userId: number): Promise<boolean> {
  const project = await storage.getBotProject(projectId);
  if (project?.ownerId === userId) return true;
  const collab = await storage.getCollaborator(projectId, userId);
  return collab !== null;
}
```

---

## Затронутые места в коде

Все проверки вида `project.owner_id === user_id` нужно заменить на `hasProjectAccess()`:

| Файл | Что меняется |
|---|---|
| `server/routes/userProjectsTokens/handlers/projects/getBotProjectsHandler.ts` | Возвращать проекты где юзер коллаборатор |
| `server/routes/userProjectsTokens/handlers/projects/getBotProjectDetailHandler.ts` | Проверка доступа |
| `server/routes/userProjectsTokens/handlers/projects/updateBotProjectHandler.ts` | Проверка доступа |
| `server/routes/userProjectsTokens/handlers/projects/deleteBotProjectHandler.ts` | Только owner может удалять |
| `server/routes/userProjectsTokens/handlers/tokens/getBotProjectTokensHandler.ts` | Проверка доступа |
| `server/routes/userProjectsTokens/handlers/tokens/createBotTokenHandler.ts` | Проверка доступа |
| `server/routes/userProjectsTokens/handlers/tokens/deleteBotTokenHandler.ts` | Проверка доступа |

---

## API эндпоинты

```
POST   /api/user/projects/:id/collaborators        — добавить коллаборатора
DELETE /api/user/projects/:id/collaborators/:userId — удалить коллаборатора
GET    /api/user/projects/:id/collaborators        — список коллабораторов
```

---

## UX

- В настройках проекта раздел **«Участники»** — список с аватарами и кнопкой удаления
- Добавление по Telegram ID или username
- Владелец видит кнопку «Добавить участника», коллаборатор — нет
- При удалении коллаборатора его токены остаются в проекте

---

## Что не входит в первую версию

- Роли (owner / editor / viewer) — оставить на потом
- Приглашения по ссылке
- Уведомления в Telegram при добавлении
