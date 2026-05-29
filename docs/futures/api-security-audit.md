# Аудит безопасности API — Проблемы и план исправлений

## Дата: 2026-05-29

---

## 🔴 Критические проблемы

### 1. Гости имеют полный доступ к проектам

**Файл:** `server/middleware/requireProjectAccess.ts` (строки 47-51)

```typescript
const ownerId = getOwnerIdFromRequest(req);
if (ownerId === null) {
    next(); // ← ГОСТИ ПРОПУСКАЮТСЯ БЕЗ ПРОВЕРКИ
    return;
}
```

**Проблема:** Если пользователь не авторизован, middleware пропускает его без какой-либо проверки. Это полностью обнуляет смысл `requireProjectAccess` — любой неавторизованный запрос получает доступ к любому проекту.

**Решение:** Возвращать `401 Unauthorized` для неавторизованных пользователей:
```typescript
const ownerId = getOwnerIdFromRequest(req);
if (ownerId === null) {
    res.status(401).json({ message: "Требуется авторизация" });
    return;
}
```

---

### 2. ~50 эндпоинтов bot integration без проверки доступа

**Файл:** `server/routes/setupBotIntegrationRoutes.ts`

**Проблема:** Все эндпоинты для работы с ботами (сообщения, группы, рассылки, управление участниками, файлы) не используют ни `requireAuth`, ни `requireProjectAccess`.

**Затронутые эндпоинты (примеры):**
- `GET /api/projects/:projectId/bot/data` — данные бота
- `GET /api/projects/:projectId/users/:userId/messages` — сообщения пользователей
- `POST /api/projects/:projectId/users/:userId/send-message` — отправка сообщений от имени бота
- `POST /api/projects/:projectId/users/:userId/send-node-message` — отправка сообщений с медиа
- `DELETE /api/projects/:projectId/users/:userId/messages` — удаление истории
- `GET /api/projects/:projectId/files` — файлы проекта
- `DELETE /api/projects/:projectId/files` — удаление файлов
- `POST /api/projects/:projectId/bot/send-group-message` — сообщения в группы
- `GET /api/projects/:projectId/groups/:groupId/messages` — сообщения групп
- И ещё ~40 эндпоинтов

**Риск:** Любой человек может читать переписки пользователей, отправлять сообщения от имени бота, удалять данные — без авторизации.

**Решение:** Добавить `requireAuth, requireProjectAccess` ко всем эндпоинтам:
```typescript
app.get("/api/projects/:projectId/bot/data", requireAuth, requireProjectAccess, getBotDataHandler);
```

---

### 3. Полное отсутствие rate limiting

**Проблема:** Ни один эндпоинт не защищён от brute-force атак или DDoS. Поиск по `rate-limit` в проекте — 0 результатов.

**Риски:**
- Brute-force авторизации
- Спам через API отправки сообщений
- DDoS через тяжёлые эндпоинты (генерация кода, экспорт)
- Скрейпинг данных

**Решение:** Установить `express-rate-limit`:
```bash
npm install express-rate-limit
```
```typescript
import rateLimit from 'express-rate-limit';

// Глобальный лимит
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 запросов на IP
});

// Строгий лимит для auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);
```

---

### 4. Hardcoded session secret

**Файл:** `server/routes/routes.ts` (строка ~418)

```typescript
secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production'
```

**Проблема:** Если `SESSION_SECRET` не задан в env — используется предсказуемый секрет. Атакующий может подделать сессию.

**Решение:** Падать при старте если секрет не задан:
```typescript
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable is required');
}
```

---

## 🟠 Серьёзные проблемы

### 5. Body limit 50MB для всех запросов

**Файл:** `server/index.ts` (строка ~42)

```typescript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.text({ limit: '50mb', type: 'text/plain' }));
```

**Проблема:** Любой может отправить 50MB JSON и забить память сервера. Для обычных API-запросов это в 50-500 раз больше необходимого.

**Решение:** Дифференцированные лимиты:
```typescript
// Глобально — 1MB
app.use(express.json({ limit: '1mb' }));

// Для upload-эндпоинтов — отдельный middleware
const largeBodyParser = express.json({ limit: '50mb' });
app.post('/api/projects/:id/import', largeBodyParser, importHandler);
```

---

### 6. Нет CORS middleware

**Проблема:** Не найден `cors` пакет в конфигурации сервера. Без CORS любой сайт может делать запросы к API.

**Решение:**
```bash
npm install cors
```
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
  credentials: true,
}));
```

---

### 7. Нет helmet (security headers)

**Проблема:** Отсутствуют заголовки безопасности: X-Frame-Options, Content-Security-Policy, X-Content-Type-Options и т.д.

**Решение:**
```bash
npm install helmet
```
```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

### 8. Токены ботов возвращаются клиенту

**Файл:** `server/routes/routes.ts` (строки ~570-580)

```typescript
const tokens = await storage.getBotTokensByProject(projectId);
const safeTokens = tokens.map(token => {
  const botId = token.token ? token.token.split(':')[0] : null;
  return { ...token, botId }; // ← token всё ещё в объекте!
});
```

**Проблема:** Spread `...token` включает полный токен бота в ответ. Маскировка через `botId` не убирает оригинальное поле.

**Решение:**
```typescript
const safeTokens = tokens.map(({ token, ...rest }) => ({
  ...rest,
  botId: token ? token.split(':')[0] : null,
  tokenMasked: token ? `${token.slice(0, 5)}...${token.slice(-4)}` : null,
}));
```

---

### 9. Незащищённые служебные эндпоинты

| Эндпоинт | Файл | Риск |
|----------|------|------|
| `GET /api/workers/stats` | setupBotManagementRoutes.ts | Утечка внутренней информации |
| `GET /api/projects/import-from-files` | routes.ts | Импорт проектов без авторизации |
| `POST /api/settings/comments-generation` | setupProjectRoutes.ts | Изменение настроек без авторизации |
| `POST /api/bot-folders/cleanup` | setupProjectRoutes.ts | Удаление папок без авторизации |
| `POST /api/telegram-settings` | routes.ts | Сохранение API credentials без авторизации |
| `GET /api/tokens/:tokenId/bot-status` | setupBotManagementRoutes.ts | Статус чужого бота |
| `GET /api/tokens/:tokenId/launch-history` | setupBotManagementRoutes.ts | История запусков чужого бота |

**Решение:** Добавить `requireAuth` ко всем, `requireProjectAccess` где применимо.

---

### 10. Глобальный error handler может крашить процесс

**Файл:** `server/index.ts` (строка ~103)

**Проблема:** Если error handler бросает исключение — процесс падает.

**Решение:** Обернуть в try/catch, логировать, возвращать 500.

---

## 🟡 Проблемы с валидацией

### Где валидация ЕСТЬ (Zod):
| Хендлер | Что валидируется |
|---------|-----------------|
| `createProjectHandler.ts` | `insertBotProjectSchema.parse(bodyData)` ✅ |
| `updateProjectHandler.ts` | `insertBotProjectSchema.partial().parse(req.body)` ✅ |
| `sendMessageHandler.ts` | `sendMessageSchema.safeParse(req.body)` ✅ |
| `createBotTokenHandler.ts` | regex валидация формата токена ✅ |

### Где валидации НЕТ (~80% эндпоинтов):
- Все bot integration эндпоинты (POST/PUT/DELETE body не валидируется)
- Query params нигде не валидируются (пагинация, фильтры)
- `POST /api/projects/:id/tokens/parse` — только `if (!token)`, без проверки формата
- Все эндпоинты групп, рассылок, файлов

**Решение:** Создать Zod-схемы для каждого эндпоинта и валидировать через middleware:
```typescript
import { z } from 'zod';

const sendMessageSchema = z.object({
  text: z.string().min(1).max(4096),
  replyToMessageId: z.number().optional(),
});

function validateBody(schema: z.ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten() });
    }
    req.body = result.data;
    next();
  };
}
```

---

## План исправлений (приоритет)

### Неделя 1 — Критическое
- [ ] Исправить `requireProjectAccess` — блокировать неавторизованных
- [ ] Добавить `requireAuth` + `requireProjectAccess` на все bot integration эндпоинты
- [ ] Убрать fallback session secret
- [ ] Добавить rate limiting (express-rate-limit)

### Неделя 2 — Серьёзное
- [ ] Снизить body limit до 1MB (50MB только для upload)
- [ ] Добавить CORS
- [ ] Добавить helmet
- [ ] Замаскировать токены ботов в ответах API
- [ ] Защитить служебные эндпоинты

### Неделя 3 — Валидация
- [ ] Создать Zod-схемы для всех POST/PUT эндпоинтов
- [ ] Добавить валидацию query params (пагинация, фильтры)
- [ ] Добавить middleware для централизованной валидации
- [ ] Добавить логирование подозрительных запросов

---

## Итого

| Категория | Количество проблем | Статус |
|-----------|-------------------|--------|
| 🔴 Критические | 4 | Нужно фиксить немедленно |
| 🟠 Серьёзные | 6 | Фиксить на следующей неделе |
| 🟡 Валидация | ~80% эндпоинтов | Постепенно покрывать |

Основная проблема — **проект работает фактически без авторизации**. Middleware `requireProjectAccess` пропускает гостей, а большинство эндпоинтов вообще не используют никакой проверки доступа.
