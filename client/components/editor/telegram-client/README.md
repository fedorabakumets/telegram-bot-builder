# Telegram Client API Module

Модуль для настройки и авторизации Telegram Client API (Userbot).

## 📁 Структура папки

```
telegram-client/
├── types/                          # Типы TypeScript
│   ├── auth-status.ts              # Тип AuthStatus
│   ├── api-credentials.ts          # Тип ApiCredentials
│   ├── telegram-auth-props.ts      # Тип TelegramAuthProps
│   ├── telegram-auth-state.ts      # Типы AuthStep, QrState
│   ├── telegram-auth-view-props.ts # Пропсы для view-компонентов
│   ├── group-members-panel-props.ts # Пропсы GroupMembersClientPanel
│   ├── qr-code-generator-props.ts  # Пропсы QrCodeGenerator
│   └── index.ts                    # Экспорт всех типов
│
├── hooks/                          # React хуки
│   ├── use-telegram-auth.ts        # Главный хук авторизации
│   ├── use-telegram-auth-state.ts  # Хук состояния
│   ├── use-telegram-auth-actions.ts # Хук действий
│   ├── use-qr-auth.ts              # Хук QR авторизации
│   ├── use-qr-polling.ts           # Хук polling для QR
│   ├── actions/                    # Фабрики действий
│   │   ├── create-load-status-handler.ts
│   │   ├── create-save-credentials-handler.ts
│   │   ├── create-logout-handler.ts
│   │   ├── create-reset-credentials-handler.ts
│   │   └── index.ts
│   ├── qr-actions/                 # QR действия
│   │   ├── generate-qr-code.ts
│   │   ├── check-qr-status.ts
│   │   ├── refresh-qr-token.ts
│   │   └── index.ts
│   ├── load-auth-status.ts         # Загрузка статуса
│   ├── logout.ts                   # Выход из аккаунта
│   ├── reset-credentials.ts        # Сброс credentials
│   ├── save-credentials.ts         # Сохранение credentials
│   └── index.ts                    # Экспорт всех хуков
│
├── services/                       # Сервисы (бизнес-логика)
│   ├── telegram-auth-service.ts    # API вызовы
│   ├── notification-service.ts     # Уведомления
│   ├── validation-service.ts       # Валидация данных
│   ├── logger-service.ts           # Логирование
│   └── index.ts                    # Экспорт сервисов
│
├── components/                     # React компоненты
│   ├── client-api-card-header.tsx  # Заголовок карточки
│   ├── warning-alert.tsx           # Предупреждение о рисках
│   ├── telegram-auth-header.tsx    # Заголовок диалога
│   ├── api-credentials-form.tsx    # Форма ввода credentials
│   ├── api-credentials-saved.tsx   # Сообщение о сохранении
│   ├── auth-status-panel.tsx       # Панель статуса
│   ├── start-step-view.tsx         # Начальный шаг
│   ├── qr-step-view.tsx            # Шаг с QR-кодом
│   ├── qr-password-step-view.tsx   # Шаг с 2FA паролем
│   ├── qr-code-generator.tsx       # Генератор QR-кода
│   ├── qr-code-display.tsx         # Отображение QR-кода
│   ├── qr-countdown-badge.tsx      # Индикатор таймера
│   ├── qr-status-header.tsx        # Заголовок статуса QR
│   ├── qr-info-text.tsx            # Информационные тексты
│   ├── qr-status-button.tsx        # Кнопка проверки статуса
│   ├── qr-action-buttons.tsx       # Кнопки действий QR
│   └── index.ts                    # Экспорт компонентов
│
├── constants.ts                    # Константы модуля
├── TelegramClientConfig.tsx        # Главный компонент настройки
├── telegram-auth.tsx               # Диалог авторизации
├── index.ts                        # Главный экспорт модуля
├── EXAMPLES.md                     # Примеры использования
└── README.md                       # Этот файл
```

## 📦 Основные компоненты

### TelegramClientConfig

Главный компонент настройки Telegram Client API. Предоставляет интерфейс для:
- Ввода API ID и API Hash
- Просмотра статуса авторизации
- Управления сессией

```tsx
import { TelegramClientConfig } from '@/components/editor/telegram-client';

<TelegramClientConfig projectId={projectId} />
```

### TelegramAuth

Диалог авторизации через QR-код.

```tsx
import { TelegramAuth } from '@/components/editor/telegram-client';

<TelegramAuth
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={handleSuccess}
/>
```

## 🧰 Сервисы

Модуль предоставляет сервисы для переиспользования бизнес-логики.

### TelegramAuthService

Сервис для работы с Telegram Auth API.

```typescript
import { createTelegramAuthService } from '@/components/editor/telegram-client';

const authService = createTelegramAuthService();

// Получить статус авторизации
const status = await authService.getStatus();

// Сохранить API credentials
await authService.saveCredentials({ apiId: '123', apiHash: 'abc...' });

// Сгенерировать QR-код
const qr = await authService.generateQr();

// Проверить статус QR
const result = await authService.checkQr(token);

// Выйти из аккаунта
await authService.logout();
```

### NotificationService

Сервис уведомлений (абстракция над toast).

```typescript
import { createNotificationService } from '@/components/editor/telegram-client';

const notifications = createNotificationService(toast);

notifications.success('Успешно', 'Данные сохранены');
notifications.error('Ошибка', 'Не удалось подключиться');
notifications.info('Инфо', 'Обновление доступно');
```

### ValidationService

Сервис валидации данных.

```typescript
import { validateApiCredentials, isValidCredentials } from '@/components/editor/telegram-client';

const errors = validateApiCredentials({ apiId: '123', apiHash: 'invalid' });
// { apiHash: 'API Hash должен быть 32-символьной hex строкой' }

const isValid = isValidCredentials({ apiId: '12345678', apiHash: 'abc...' });
// true
```

### LoggerService

Сервис логирования с уровнями.

```typescript
import { createLogger } from '@/components/editor/telegram-client';

const logger = createLogger({ prefix: '[MyComponent]' });

logger.debug('Отладка', { data: 123 });
logger.info('Информация');
logger.warn('Предупреждение');
logger.error('Ошибка', error);
```

📚 **Полные примеры** смотрите в файле [EXAMPLES.md](./EXAMPLES.md).

## 🔗 API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/telegram-auth/status` | GET | Получить статус авторизации |
| `/api/telegram-auth/save-credentials` | POST | Сохранить API credentials |
| `/api/telegram-auth/qr-generate` | POST | Сгенерировать QR-код |
| `/api/telegram-auth/qr-check` | POST | Проверить статус QR |
| `/api/telegram-auth/qr-refresh` | POST | Обновить QR-токен |
| `/api/telegram-auth/logout` | POST | Выход из аккаунта |
| `/api/telegram-auth/reset-credentials` | POST | Сбросить credentials |

## 🚀 Использование

### 1. Настройка API Credentials

Получите API ID и API Hash на [my.telegram.org](https://my.telegram.org):

```tsx
<TelegramClientConfig />
```

### 2. Авторизация через QR

После сохранения credentials нажмите "Войти" для авторизации через QR-код.

### 3. Работа с ботом

После авторизации доступны расширенные функции:
- Массовые рассылки
- Управление участниками групп
- Получение полной информации о пользователях

## ⚠️ Предупреждения

> **Внимание!** Массовые рассылки через Client API могут привести к блокировке аккаунта. Используйте с осторожностью.

## 📝 Типы

### AuthStatus

```typescript
interface AuthStatus {
  isAuthenticated: boolean;
  hasCredentials: boolean;
  userId?: number | string;
  username?: string;
}
```

### ApiCredentials

```typescript
interface ApiCredentials {
  apiId: string;
  apiHash: string;
}
```

### AuthStep

```typescript
type AuthStep = 'start' | 'qr' | 'qr-password';
```

### QrState

```typescript
interface QrState {
  token: string;
  url: string;
  password: string;
  countdown: number;
}
```
