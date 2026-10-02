# Railway Troubleshooting Guide

Руководство по устранению проблем при развертывании на Railway.

## 🔍 Диагностика проблем с базой данных

### Проблема: "Failed query: SELECT 1 as health"

Эта ошибка указывает на проблемы с подключением к PostgreSQL базе данных.

#### Возможные причины:
1. **Неправильная DATABASE_URL** - проверьте переменную окружения
2. **SSL проблемы** - Railway требует SSL подключения
3. **Превышение лимитов подключений** - слишком много активных соединений
4. **Проблемы с сетью** - временные сбои соединения

#### Решения:

##### 1. Проверка переменных окружения
```bash
# В Railway CLI
railway variables

# Убедитесь что DATABASE_URL установлена
railway variables set DATABASE_URL="postgresql://..."
```

##### 2. Проверка SSL настроек
Убедитесь что в `server/db.ts` включен SSL для продакшена:
```typescript
ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
```

##### 3. Тестирование подключения
```bash
# Локально с продакшен переменными
npm run db:test

# На Railway
railway run npm run db:test
```

##### 4. Проверка логов Railway
```bash
# Просмотр логов
railway logs

# Следить за логами в реальном времени
railway logs --follow
```

## 🚀 Настройка Railway проекта

### Переменные окружения
Обязательные переменные для Railway:
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3000
```

### Настройка базы данных
1. Добавьте PostgreSQL плагин в Railway
2. Скопируйте DATABASE_URL из плагина
3. Установите переменную в настройках проекта

### Настройка деплоя
Конфиг сервиса панели — только `railway.toml` в корне (отдельного `railway.json` нет), сборка по корневому `Dockerfile`:
```toml
[build]
builder = "DOCKERFILE"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
healthcheckPath = "/api/health"
healthcheckTimeout = 60
```

## 🔧 Исправление распространенных ошибок

### Ошибка: "Connection timeout"
```typescript
// Увеличьте таймауты в server/db.ts
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 20000, // Увеличено до 20 секунд
  acquireTimeoutMillis: 60000,    // Увеличено до 60 секунд
  ssl: { rejectUnauthorized: false }
};
```

### Ошибка: "Too many connections"
```typescript
// Уменьшите максимальное количество подключений
const poolConfig = {
  max: 10, // Уменьшено с 20 до 10
  min: 1,  // Уменьшено с 2 до 1
  idleTimeoutMillis: 10000 // Быстрее закрывать idle соединения
};
```

### Ошибка: "SSL required"
```typescript
// Принудительно включите SSL
ssl: {
  rejectUnauthorized: false,
  require: true
}
```

## 📊 Мониторинг и отладка

### Проверка состояния приложения
```bash
# Health check endpoint
curl https://your-app.railway.app/api/health

# Database health check
curl https://your-app.railway.app/api/db/health
```

### Просмотр метрик базы данных
```bash
# Подключение к Railway PostgreSQL
railway connect postgres

# Проверка активных подключений
SELECT count(*) FROM pg_stat_activity;

# Проверка медленных запросов
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Логирование
Добавьте подробное логирование в `server/db-utils.ts`:
```typescript
console.log('Database connection attempt:', {
  url: process.env.DATABASE_URL?.substring(0, 30) + '...',
  ssl: process.env.NODE_ENV === 'production',
  poolConfig: {
    max: poolConfig.max,
    min: poolConfig.min,
    timeout: poolConfig.connectionTimeoutMillis
  }
});
```

## 🛠️ Команды для диагностики

### Railway CLI команды
```bash
# Статус проекта
railway status

# Переменные окружения
railway variables

# Логи приложения
railway logs --follow

# Подключение к базе данных
railway connect postgres

# Запуск команд в Railway окружении
railway run npm run db:test
```

### Локальная диагностика
```bash
# Тест подключения к базе данных
npm run db:test

# Проверка TypeScript
npm run check

# Сборка проекта
npm run build
```

## 🔄 Процедура восстановления

### При полном отказе базы данных:
1. Проверьте статус PostgreSQL плагина в Railway
2. Пересоздайте DATABASE_URL если необходимо
3. Запустите миграции: `railway run npm run db:push`
4. Перезапустите приложение: `railway redeploy`

### При проблемах с подключением:
1. Проверьте логи: `railway logs`
2. Протестируйте подключение: `railway run npm run db:test`
3. Проверьте переменные: `railway variables`
4. Перезапустите сервис: `railway restart`

## 📞 Получение помощи

### Railway Support
- Discord: https://discord.gg/railway
- Документация: https://docs.railway.app
- GitHub Issues: https://github.com/railwayapp/railway/issues

### Проект Support
- GitHub Issues: https://github.com/fedorabakumets/telegram-bot-builder/issues
- Документация: `/docs/README.md`

## 🔍 Полезные ссылки

- [Railway PostgreSQL Guide](https://docs.railway.app/databases/postgresql)
- [Node.js Deployment Guide](https://docs.railway.app/deploy/deployments)
- [Environment Variables](https://docs.railway.app/develop/variables)
- [Health Checks](https://docs.railway.app/deploy/healthchecks)