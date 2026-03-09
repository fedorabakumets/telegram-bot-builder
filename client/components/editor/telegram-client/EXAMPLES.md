# Примеры использования сервисов telegram-client

Примеры использования сервисов модуля `telegram-client`.

## 📦 Сервисы

### TelegramAuthService

Сервис для работы с Telegram Auth API.

```typescript
import { createTelegramAuthService } from '@/components/editor/telegram-client';

// Создать экземпляр сервиса
const authService = createTelegramAuthService();

// Получить статус авторизации
const status = await authService.getStatus();
console.log(status); // { isAuthenticated: true, hasCredentials: true, ... }

// Сохранить API credentials
await authService.saveCredentials({
  apiId: '12345678',
  apiHash: 'abcdef1234567890abcdef1234567890',
});

// Сгенерировать QR-код
const qrResponse = await authService.generateQr();
console.log(qrResponse); // { success: true, token: '...', qrUrl: '...' }

// Проверить статус QR
const checkResponse = await authService.checkQr(token);
console.log(checkResponse); // { success: true, isAuthenticated: true }

// Выйти из аккаунта
await authService.logout();

// Сбросить credentials
await authService.resetCredentials();
```

### NotificationService

Сервис уведомлений (абстракция над toast).

```typescript
import { createNotificationService } from '@/components/editor/telegram-client';

// Создать сервис (требуется toast функция)
const notifications = createNotificationService(toast);

// Показать успешное уведомление
notifications.success('Готово', 'Данные сохранены');

// Показать ошибку
notifications.error('Ошибка', 'Не удалось подключиться к серверу');

// Показать информационное уведомление
notifications.info('Инфо', 'Обновление доступно');
```

### ValidationService

Сервис валидации данных.

```typescript
import { 
  validateApiCredentials, 
  isValidCredentials 
} from '@/components/editor/telegram-client';

// Валидировать credentials
const errors = validateApiCredentials({
  apiId: '12345',
  apiHash: 'invalid-hash',
});

if (Object.keys(errors).length > 0) {
  console.log(errors); // { apiHash: 'API Hash должен быть 32-символьной hex строкой' }
}

// Проверить валидность
const isValid = isValidCredentials({
  apiId: '12345678',
  apiHash: 'abcdef1234567890abcdef1234567890',
});

console.log(isValid); // true
```

### LoggerService

Сервис логирования с уровнями.

```typescript
import { createLogger } from '@/components/editor/telegram-client';

// Создать логгер с префиксом
const logger = createLogger({ 
  prefix: '[MyComponent]',
  minLevel: 'info' // 'debug' | 'info' | 'warn' | 'error'
});

// Логирование с уровнями
logger.debug('Отладочное сообщение', { data: 123 });
logger.info('Информационное сообщение');
logger.warn('Предупреждение');
logger.error('Ошибка', error);

// Логгер автоматически добавляет timestamp и префикс
// [MyComponent] [INFO] 2026-03-06T12:00:00.000Z: Информационное сообщение
```

## 🔧 Комбинированное использование

Пример использования нескольких сервисов вместе:

```typescript
import { 
  createTelegramAuthService,
  createNotificationService,
  validateApiCredentials,
  createLogger,
} from '@/components/editor/telegram-client';

async function handleSaveCredentials(
  credentials: { apiId: string; apiHash: string },
  toast: (options: any) => void
) {
  const logger = createLogger({ prefix: '[Auth]' });
  const notifications = createNotificationService(toast);
  const authService = createTelegramAuthService();
  
  // Валидация
  const errors = validateApiCredentials(credentials);
  if (Object.keys(errors).length > 0) {
    notifications.error('Ошибка валидации', Object.values(errors).join(', '));
    return;
  }
  
  try {
    // Сохранение
    await authService.saveCredentials(credentials);
    notifications.success('Успешно', 'API credentials сохранены');
    
    // Обновление статуса
    const status = await authService.getStatus();
    logger.info('Статус авторизации обновлён', status);
    
  } catch (error) {
    logger.error('Ошибка сохранения credentials', error);
    notifications.error('Ошибка', 'Не удалось сохранить credentials');
  }
}
```

## 📊 Константы

Использование констант модуля:

```typescript
import {
  QR_POLL_INTERVAL,      // 25000 (мс)
  QR_TOKEN_EXPIRY,       // 30 (сек)
  QR_ERROR_CORRECTION,   // 'H'
  QR_DEFAULT_SIZE,       // 200 (px)
  REQUEST_TIMEOUT,       // 5000 (мс)
  MAX_RETRY_ATTEMPTS,    // 3
} from '@/components/editor/telegram-client';

// Пример: использование в polling
useEffect(() => {
  const interval = setInterval(async () => {
    await refreshQrToken();
  }, QR_POLL_INTERVAL);
  
  return () => clearInterval(interval);
}, []);
```

## 🎯 Полные примеры

### Пример 1: Авторизация через QR

```typescript
import { createTelegramAuthService } from '@/components/editor/telegram-client';

async function authorizeWithQr() {
  const authService = createTelegramAuthService();
  
  // Шаг 1: Проверить credentials
  const status = await authService.getStatus();
  if (!status.hasCredentials) {
    throw new Error('Сначала сохраните API credentials');
  }
  
  // Шаг 2: Сгенерировать QR-код
  const qr = await authService.generateQr();
  if (qr.requiresPassword) {
    console.log('Требуется 2FA пароль');
    return;
  }
  
  // Шаг 3: Ожидать сканирования
  console.log('QR URL:', qr.qrUrl);
  console.log('Токен:', qr.token);
  
  // Шаг 4: Проверять статус каждые 5 секунд
  const checkInterval = setInterval(async () => {
    const result = await authService.checkQr(qr.token);
    if (result.isAuthenticated) {
      clearInterval(checkInterval);
      console.log('Авторизация успешна!');
    }
  }, 5000);
}
```

### Пример 2: Управление сессией

```typescript
import { 
  createTelegramAuthService,
  createNotificationService,
  createLogger,
} from '@/components/editor/telegram-client';

class SessionManager {
  private authService;
  private notifications;
  private logger;
  
  constructor(toast: (options: any) => void) {
    this.authService = createTelegramAuthService();
    this.notifications = createNotificationService(toast);
    this.logger = createLogger({ prefix: '[SessionManager]' });
  }
  
  async startSession() {
    try {
      const status = await this.authService.getStatus();
      
      if (!status.isAuthenticated) {
        this.notifications.info('Вход', 'Требуется авторизация');
        return false;
      }
      
      this.logger.info('Сессия активна', { 
        userId: status.userId, 
        username: status.username 
      });
      
      return true;
    } catch (error) {
      this.logger.error('Ошибка проверки сессии', error);
      return false;
    }
  }
  
  async endSession() {
    try {
      await this.authService.logout();
      this.notifications.success('Выход', 'Сеанс завершён');
      return true;
    } catch (error) {
      this.logger.error('Ошибка выхода', error);
      return false;
    }
  }
}
```

## 📝 Примечания

1. **Создание сервисов**: Сервисы создаются через фабрики (`create*`), что упрощает тестирование.

2. **Переиспользование**: Создавайте один экземпляр сервиса и передавайте его в компоненты.

3. **Типизация**: Все сервисы полностью типизированы TypeScript.

4. **Логирование**: Используйте `LoggerService` вместо `console.log` для консистентности.

5. **Обработка ошибок**: Сервисы не выбрасывают исключения, а возвращают результаты операций.
