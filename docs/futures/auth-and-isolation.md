# Авторизация и изоляция данных — дальнейшие улучшения

## Срочно

### TELEGRAM_BOT_TOKEN на Railway
Без этой переменной Mini App авторизация не верифицирует initData в продакшене — работает только в dev-режиме.
Добавить в Railway Variables: `TELEGRAM_BOT_TOKEN=<токен @blogspotbotbotbot>`

---

## Безопасность

### Полная RSA-верификация id_token
Файл: `server/routes/auth/utils/telegramJwks.ts`
Сейчас проверяется только `exp`. Нужно реализовать полную верификацию подписи через `crypto.createPublicKey` с JWK ключом из JWKS endpoint.

### Закрыть дыру в getProjectHandler
Проекты с `ownerId != null` доступны без авторизации через прямой API запрос (без куки).
Решение: если `project.ownerId !== null` и `ownerId === null` → вернуть 401.

---

## UX

### Toast после входа/выхода
- "Добро пожаловать, {firstName}!" после успешного входа
- "Вы вышли из аккаунта" после logout
- Место: `use-telegram-auth.ts` в методах `login` и `logout`

### Блокировка запуска ботов для гостей
На вкладке Бот гость видит кнопки запуска. Нужно показывать заглушку "Войдите чтобы запустить бота".
Место: `client/components/editor/bot/card/BotActions.tsx`

---

## Архитектура

### Рефакторинг auth эндпоинтов — разделить POST /auth/telegram на login и me

**Проблема:** `POST /api/auth/telegram` сейчас используется и при первом логине, и при восстановлении сессии после перезагрузки страницы. Это вызывало race condition: `regenerateSession` менял session ID, браузер получал `Set-Cookie`, но следующий GET уходил со старым cookie → сессия не находилась → проекты возвращали `[]`.

**Текущий воркэраунд:** `regenerateSession` вызывается только при смене аккаунта, при повторном входе того же пользователя session ID не меняется.

**Правильное решение:**

```
POST /api/auth/telegram     — только при реальном логине (вызывает regenerateSession один раз)
GET  /api/auth/me           — при каждой загрузке страницы (только читает сессию, ничего не меняет)
POST /api/auth/logout       — выход
```

Клиент при загрузке:
```ts
// Вместо POST /api/auth/telegram при каждой перезагрузке:
const { data: me } = useQuery({
  queryKey: ['/api/auth/me'],
  staleTime: Infinity,
});

const { data: projects } = useQuery({
  queryKey: ['/api/projects'],
  enabled: !!me?.user,  // ждём пока знаем кто залогинен
});
```

Это устраняет необходимость в `session-restore.ts`, `sessionReady` state и всей логике ожидания сессии на клиенте.

**Файлы для изменения:**
- `server/routes/auth/handlers/telegramAuthHandler.ts` — убрать логику восстановления
- `client/components/editor/header/hooks/use-telegram-auth.ts` — заменить POST на GET /auth/me
- `client/utils/session-restore.ts` — удалить за ненадобностью

### userId в query key у useBotQueries
Файл: `client/components/editor/bot/hooks/use-bot-queries.ts`
Сейчас `queryKey: ['/api/projects']` без userId — при смене пользователя кеш не сбрасывается.
Решение: добавить userId в ключ, инвалидировать при смене.

### Миграция данных гостя при входе (улучшение)
Сейчас мигрируют только проекты. Рассмотреть миграцию токенов и других данных.

---

## Гостевой режим

### Ограничения для гостей
Определить список функций недоступных гостям:
- Запуск ботов
- Сохранение сценариев как публичных
- Экспорт в Google Sheets

### Индикатор ограничений
Показывать гостю подсказки что конкретная функция требует входа.
