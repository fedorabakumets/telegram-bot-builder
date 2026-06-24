# Идеальная архитектура безопасности API

## Дата: 2026-05-29

Как должна выглядеть серверная часть с точки зрения безопасности, валидации и контроля доступа — эталонная модель для нашего проекта.

---

## Принцип: Deny by Default

Всё закрыто по умолчанию. Доступ открывается явно. Не "добавить защиту на эндпоинт", а "каждый эндпоинт защищён, если не помечен как публичный".

```typescript
// ❌ Как сейчас — защита добавляется вручную (и забывается)
app.get("/api/projects/:id/data", handler);

// ✅ Как должно быть — всё закрыто, публичное помечается явно
app.use("/api/", requireAuth); // глобально
app.get("/api/health", publicRoute, healthHandler); // явно публичный
```

---

## Слои защиты (Defense in Depth)

```
Запрос от клиента
       │
       ▼
┌─────────────────────┐
│  1. Rate Limiting   │  ← Защита от DDoS/brute-force
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  2. CORS + Helmet   │  ← Заголовки безопасности
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  3. Body Parsing    │  ← Лимиты размера, Content-Type
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  4. Authentication  │  ← Кто ты? (JWT / Session)
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  5. Authorization   │  ← Имеешь ли право? (роли, ownership)
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  6. Validation      │  ← Данные корректны? (Zod schema)
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  7. Business Logic  │  ← Обработка запроса
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  8. Response Filter │  ← Убрать sensitive data из ответа
└──────────┬──────────┘
           ▼
       Ответ клиенту
```

---

## 1. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Глобальный — 200 запросов за 15 минут на IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later' },
});

// Auth — 5 попыток за 15 минут
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

// Тяжёлые операции — 10 за час
const heavyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/projects/:id/generate', heavyLimiter);
app.use('/api/projects/:id/export', heavyLimiter);
```

---

## 2. Security Headers + CORS

```typescript
import helmet from 'helmet';
import cors from 'cors';

// Helmet — security headers
app.use(helmet());

// CORS — только наш фронтенд
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## 3. Body Parsing с дифференцированными лимитами

```typescript
// Глобально — 1MB (достаточно для 99% запросов)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Для импорта/загрузки — отдельный middleware
const largeBody = express.json({ limit: '20mb' });
const textBody = express.text({ limit: '20mb', type: 'text/plain' });

app.post('/api/projects/:id/import', requireAuth, largeBody, importHandler);
app.post('/api/projects/import-text', requireAuth, textBody, importTextHandler);
```

---

## 4. Authentication (Аутентификация)

### Идеальная модель:

```typescript
/**
 * Глобальный auth middleware — устанавливает req.user если сессия валидна.
 * Не блокирует — просто обогащает запрос.
 */
function identifyUser(req: Request, _res: Response, next: NextFunction) {
  if (req.session?.telegramUser) {
    req.user = req.session.telegramUser;
  }
  next();
}

/**
 * Блокирующий middleware — 401 если не авторизован.
 * Используется на всех защищённых роутах.
 */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Требуется авторизация',
    });
  }
  next();
}

// Порядок подключения:
app.use(sessionMiddleware);
app.use(identifyUser);          // всегда — обогащает req.user
app.use('/api/', requireAuth);  // глобально на все /api/ (кроме публичных)
```

### Session secret:

```typescript
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET is not set');
  process.exit(1); // Не запускаемся без секрета
}
```

### Публичные роуты (исключения):

```typescript
// Маркер для публичных роутов
const publicRoutes = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/telegram-callback',
  '/api/webhook/',  // Telegram webhooks (верифицируются по secret)
];

function requireAuth(req, res, next) {
  // Пропускаем публичные роуты
  if (publicRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
  next();
}
```

---

## 5. Authorization (Авторизация / Проверка прав)

### Уровни доступа:

```typescript
enum AccessLevel {
  OWNER = 'owner',       // Создатель проекта — полный доступ
  EDITOR = 'editor',     // Может редактировать (будущее: team)
  VIEWER = 'viewer',     // Только просмотр (будущее: sharing)
}
```

### Middleware проверки доступа к проекту:

```typescript
/**
 * Проверяет что авторизованный пользователь имеет доступ к проекту.
 * НИКОГДА не пропускает неавторизованных — requireAuth должен быть выше.
 */
async function requireProjectAccess(req: Request, res: Response, next: NextFunction) {
  const projectId = extractProjectId(req);

  if (isNaN(projectId)) {
    return res.status(400).json({ error: 'INVALID_PROJECT_ID' });
  }

  // req.user гарантированно есть (requireAuth выше в цепочке)
  const userId = req.user!.id;

  const hasAccess = await storage.hasProjectAccess(projectId, userId);
  if (!hasAccess) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Нет доступа к этому проекту',
    });
  }

  // Прикрепляем проект к запросу чтобы не делать повторный запрос в хендлере
  req.project = await storage.getBotProject(projectId);
  next();
}
```

### Проверка ownership для конкретных ресурсов:

```typescript
/**
 * Проверяет что токен принадлежит проекту пользователя
 */
async function requireTokenOwnership(req: Request, res: Response, next: NextFunction) {
  const tokenId = parseInt(req.params.tokenId);
  const token = await storage.getBotToken(tokenId);

  if (!token) {
    return res.status(404).json({ error: 'TOKEN_NOT_FOUND' });
  }

  const hasAccess = await storage.hasProjectAccess(token.projectId, req.user!.id);
  if (!hasAccess) {
    return res.status(403).json({ error: 'FORBIDDEN' });
  }

  req.token = token;
  next();
}
```

---

## 6. Validation (Валидация входных данных)

### Централизованный подход через Zod:

```typescript
import { z } from 'zod';

// Схемы в отдельных файлах
// server/schemas/message.schema.ts
export const sendMessageSchema = z.object({
  text: z.string().min(1).max(4096),
  replyToMessageId: z.number().int().positive().optional(),
  parseMode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['asc', 'desc']).default('desc'),
});

// Универсальный middleware валидации
function validate(schema: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, any> = {};

    if (schema.body) {
      const result = schema.body.safeParse(req.body);
      if (!result.success) errors.body = result.error.flatten();
      else req.body = result.data;
    }

    if (schema.query) {
      const result = schema.query.safeParse(req.query);
      if (!result.success) errors.query = result.error.flatten();
      else req.query = result.data as any;
    }

    if (schema.params) {
      const result = schema.params.safeParse(req.params);
      if (!result.success) errors.params = result.error.flatten();
      else req.params = result.data as any;
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors });
    }

    next();
  };
}
```

### Использование:

```typescript
app.post(
  "/api/projects/:projectId/users/:userId/send-message",
  requireAuth,
  requireProjectAccess,
  validate({
    body: sendMessageSchema,
    params: z.object({
      projectId: z.coerce.number().int().positive(),
      userId: z.coerce.number().int().positive(),
    }),
  }),
  sendMessageHandler
);

app.get(
  "/api/projects/:id/users",
  requireAuth,
  requireProjectAccess,
  validate({ query: paginationSchema }),
  getUsersHandler
);
```

---

## 7. Error Handling

### Централизованный обработчик ошибок:

```typescript
// Кастомные ошибки
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} не найден`);
  }
}

class ForbiddenError extends AppError {
  constructor() {
    super(403, 'FORBIDDEN', 'Нет доступа');
  }
}

// Глобальный error handler (последний middleware)
function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Логируем
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Известная ошибка
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
  }

  // Zod validation error (если пробросили)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: (err as any).flatten(),
    });
  }

  // Неизвестная ошибка — не показываем детали клиенту
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Внутренняя ошибка сервера',
  });
}

// Подключение (в самом конце, после всех роутов)
app.use(errorHandler);
```

---

## 8. Response Filtering (Фильтрация ответов)

### Никогда не отдавать sensitive data:

```typescript
// ❌ Плохо — токен утекает
res.json(token);

// ✅ Хорошо — явный whitelist полей
function sanitizeToken(token: BotToken) {
  return {
    id: token.id,
    projectId: token.projectId,
    botId: token.token?.split(':')[0] ?? null,
    botUsername: token.botUsername,
    botName: token.botName,
    isActive: token.isActive,
    createdAt: token.createdAt,
    // token.token — НИКОГДА не отдаём
  };
}

res.json(sanitizeToken(token));
```

### Паттерн DTO (Data Transfer Object):

```typescript
// server/dto/project.dto.ts
export function toProjectResponse(project: BotProject) {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    nodesCount: project.nodesCount,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    // НЕ включаем: ownerId, internal fields, tokens
  };
}
```

---

## Идеальная структура файлов

```
server/
├── index.ts                          # Точка входа, подключение middleware
├── app.ts                            # Создание Express app
├── config/
│   ├── env.ts                        # Валидация env переменных (zod)
│   ├── cors.ts                       # CORS конфигурация
│   └── session.ts                    # Session конфигурация
├── middleware/
│   ├── rate-limit.ts                 # Rate limiters
│   ├── auth.ts                       # identifyUser + requireAuth
│   ├── access-control.ts            # requireProjectAccess, requireTokenOwnership
│   ├── validate.ts                   # Универсальный Zod-валидатор
│   ├── error-handler.ts             # Глобальный обработчик ошибок
│   └── request-logger.ts            # Логирование запросов
├── schemas/
│   ├── auth.schema.ts               # Схемы для auth эндпоинтов
│   ├── project.schema.ts            # Схемы для проектов
│   ├── message.schema.ts            # Схемы для сообщений
│   ├── token.schema.ts              # Схемы для токенов
│   └── common.schema.ts             # Пагинация, сортировка, общие
├── dto/
│   ├── project.dto.ts               # Фильтрация ответов проектов
│   ├── token.dto.ts                 # Фильтрация ответов токенов
│   └── user.dto.ts                  # Фильтрация ответов пользователей
├── routes/
│   ├── index.ts                      # Регистрация всех роутов
│   ├── auth.routes.ts               # Auth роуты
│   ├── project.routes.ts            # Project CRUD
│   ├── bot-management.routes.ts     # Start/stop/restart
│   ├── bot-integration.routes.ts    # Messages, groups, broadcasts
│   └── admin.routes.ts              # Служебные эндпоинты
├── handlers/
│   ├── auth/
│   ├── projects/
│   ├── bot-management/
│   └── bot-integration/
├── services/                         # Бизнес-логика
├── database/                         # Drizzle, миграции
└── errors/
    └── app-error.ts                  # Кастомные классы ошибок
```

---

## Идеальный роут (полный пример)

```typescript
// server/routes/bot-integration.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireProjectAccess } from '../middleware/access-control';
import { validate } from '../middleware/validate';
import { sendMessageSchema } from '../schemas/message.schema';
import { projectParamsSchema } from '../schemas/common.schema';
import { sendMessageHandler } from '../handlers/bot-integration/send-message';

const router = Router();

// Все роуты в этом файле требуют авторизации + доступа к проекту
router.use(requireAuth);
router.use(requireProjectAccess);

router.post(
  '/:projectId/users/:userId/send-message',
  validate({
    params: projectParamsSchema.extend({
      userId: z.coerce.number().int().positive(),
    }),
    body: sendMessageSchema,
  }),
  sendMessageHandler
);

export default router;
```

```typescript
// server/handlers/bot-integration/send-message.ts
import { Request, Response } from 'express';
import { NotFoundError } from '../../errors/app-error';
import { botService } from '../../services/bot.service';

export async function sendMessageHandler(req: Request, res: Response) {
  const { projectId, userId } = req.params;
  const { text, replyToMessageId, parseMode } = req.body;
  // body уже провалидирован — можно использовать напрямую

  const result = await botService.sendMessage({
    projectId: Number(projectId),
    userId: Number(userId),
    text,
    replyToMessageId,
    parseMode,
  });

  if (!result) {
    throw new NotFoundError('Пользователь');
  }

  res.json({ success: true, messageId: result.messageId });
}
```

---

## Env валидация при старте

```typescript
// server/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().transform(s => s.split(',')),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
// Если что-то не так — приложение не запустится с понятной ошибкой
```

---

## Логирование и мониторинг

```typescript
// Каждый запрос логируется
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id ?? 'anonymous',
      ip: req.ip,
    };
    // 4xx/5xx — warn/error, остальное — info
    if (res.statusCode >= 500) console.error('[API]', log);
    else if (res.statusCode >= 400) console.warn('[API]', log);
    else console.info('[API]', log);
  });
  next();
});
```

---

## Чеклист "Новый эндпоинт"

При добавлении нового эндпоинта проверь:

- [ ] Есть `requireAuth` (или явно помечен как публичный)
- [ ] Есть `requireProjectAccess` (если работает с проектом)
- [ ] Есть `validate()` с Zod-схемой для body/query/params
- [ ] Ответ фильтруется через DTO (нет sensitive data)
- [ ] Есть rate limit (если тяжёлая операция)
- [ ] Ошибки бросаются через `AppError` (не голые throw)
- [ ] Есть JSDoc комментарий
- [ ] Добавлен в тесты

---

## Сравнение: сейчас vs идеал

| Аспект | Сейчас | Идеал |
|--------|--------|-------|
| Auth по умолчанию | Нет (opt-in) | Да (opt-out для публичных) |
| Проверка доступа | Пропускает гостей | Блокирует всех без прав |
| Валидация | ~20% эндпоинтов | 100% эндпоинтов |
| Rate limiting | Нет | Глобальный + per-endpoint |
| Security headers | Нет | helmet + CORS |
| Error handling | Может крашить процесс | Централизованный, безопасный |
| Response filtering | Токены утекают | DTO, whitelist полей |
| Body limits | 50MB на всё | 1MB глобально, 20MB для upload |
| Env validation | Fallback значения | Fail-fast при старте |
| Logging | console.log | Структурированные логи |
