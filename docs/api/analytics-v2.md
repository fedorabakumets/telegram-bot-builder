<!--
@fileoverview Контракт аналитики v2, автоматически экспортированный из регистрации.
-->

# API аналитики v2

Полные схемы запросов и ответов: [OpenAPI](openapi.json). Практические примеры и живые обновления: [руководство](analytics-v2-guide.md).

### GET /api/projects/{id}/analytics/v2/snapshot

Единый снимок подтверждённой аналитики v2

Новые и активные пользователи требуют направленного действия; обычная группа — отдельное наблюдение. period либо from+to, [from,to), до 500 точек. total_users — всё время. coverage объясняет ограничения старых сборок и первого взаимодействия. previous=null для all. Все карточки имеют один as_of/revision. На analytics-changed, reconnect и next_recompute_at получите новый снимок; уведомление не содержит значений.

### POST /api/projects/{id}/analytics/acquisition/budgets

Сохранить рекламный бюджет простой start-ссылки

Атомарно создаёт источник, техническое размещение, публичную метку и дневной расход; существующая метка используется повторно без изменения прежних даты начала и пояса. Сумма — decimal-строка. link_, ref и ref_ запрещены. Конфликт маршрута или занятой ссылки даёт 409. Повторный POST добавляет отдельную финансовую запись, не является идемпотентным.

### GET /api/projects/{id}/analytics/acquisition/exchange-rate

Бесплатный официальный курс USD/RUB ЦБ на дату рекламного бюджета

Ключ не нужен. rubPerUsd — decimal-строка RUB за 1 USD. effectiveDay может быть раньше requestedDay в выходной. Ничего не сохраняет: передайте курс и дату в расход явно. Ошибка сервиса 503, ручной ввод остаётся доступен.

### GET /api/projects/{id}/analytics/acquisition/report

Результаты рекламных источников, бюджет и цена нового пользователя

Без from/to — весь срок. День рекламного бюджета определяется сохранённым поясом технического размещения. returningUsers — люди с первым контактом до начала окна, снова вошедшие по метке; обычное сообщение не равно рекламному возвращению. Повторный вход впервые пришедшего внутри окна не добавляет вернувшегося. Для обрезанного дня цена null. RUB/USD раздельно, пересчёт только по сохранённому ручному RUB-за-USD курсу. Деньги — decimal-строки. costPerUser=null при неполной истории, неизвестном расходе/курсе или отсутствии новых. 3000.00 RUB / 200 = 15.00 RUB. Запуски Telegram не являются кликами.

### GET /api/projects/{id}/analytics/acquisition

Справочники рекламной аналитики проекта

Доступ: session cookie либо Bearer PAT, в пределах проекта.

### GET /api/projects/{id}/analytics/acquisition/sources/{resourceId}/history

История изменений: источники

Доступ: session cookie либо Bearer PAT, в пределах проекта.

### GET /api/projects/{id}/analytics/acquisition/sources

Получить источники

Доступ: session cookie либо Bearer PAT, в пределах проекта.

### POST /api/projects/{id}/analytics/acquisition/sources

Создать: источники

Все связи проверяются в проекте. Расходы: allocation=equal и untilDay явно распределяют сумму по дням с сохранением итога; estimated=true. Курс exchangeRateRubPerUsd — RUB за один USD. Ссылка имеет постоянную bc_-метку и не создаёт login-код. Реферер должен быть подтверждённым пользователем проекта.

### PATCH /api/projects/{id}/analytics/acquisition/sources/{resourceId}

Исправить или архивировать: источники

Изменения сохраняются в аудите. archived=true архивирует, false восстанавливает. Нельзя изменить code, источник/бота опубликованной ссылки или связь размещения.

### GET /api/projects/{id}/analytics/acquisition/placements/{resourceId}/history

История изменений: размещения

Доступ: session cookie либо Bearer PAT, в пределах проекта.

### GET /api/projects/{id}/analytics/acquisition/placements

Получить размещения

Доступ: session cookie либо Bearer PAT, в пределах проекта.

### POST /api/projects/{id}/analytics/acquisition/placements

Создать: размещения

Все связи проверяются в проекте. Расходы: allocation=equal и untilDay явно распределяют сумму по дням с сохранением итога; estimated=true. Курс exchangeRateRubPerUsd — RUB за один USD. Ссылка имеет постоянную bc_-метку и не создаёт login-код. Реферер должен быть подтверждённым пользователем проекта.

### PATCH /api/projects/{id}/analytics/acquisition/placements/{resourceId}

Исправить или архивировать: размещения

Изменения сохраняются в аудите. archived=true архивирует, false восстанавливает. Нельзя изменить code, источник/бота опубликованной ссылки или связь размещения.

### GET /api/projects/{id}/analytics/acquisition/links/{resourceId}/history

История изменений: публичные ссылки

Доступ: session cookie либо Bearer PAT, в пределах проекта.

### GET /api/projects/{id}/analytics/acquisition/links

Получить публичные ссылки

Доступ: session cookie либо Bearer PAT, в пределах проекта.

### POST /api/projects/{id}/analytics/acquisition/links

Создать: публичные ссылки

Все связи проверяются в проекте. Расходы: allocation=equal и untilDay явно распределяют сумму по дням с сохранением итога; estimated=true. Курс exchangeRateRubPerUsd — RUB за один USD. Ссылка имеет постоянную bc_-метку и не создаёт login-код. Реферер должен быть подтверждённым пользователем проекта.

### PATCH /api/projects/{id}/analytics/acquisition/links/{resourceId}

Исправить или архивировать: публичные ссылки

Изменения сохраняются в аудите. archived=true архивирует, false восстанавливает. Нельзя изменить code, источник/бота опубликованной ссылки или связь размещения.

### GET /api/projects/{id}/analytics/acquisition/expenses/{resourceId}/history

История изменений: дневные расходы

Доступ: session cookie либо Bearer PAT, в пределах проекта.

### GET /api/projects/{id}/analytics/acquisition/expenses

Получить дневные расходы

Доступ: session cookie либо Bearer PAT, в пределах проекта.

### POST /api/projects/{id}/analytics/acquisition/expenses

Создать: дневные расходы

Все связи проверяются в проекте. Расходы: allocation=equal и untilDay явно распределяют сумму по дням с сохранением итога; estimated=true. Курс exchangeRateRubPerUsd — RUB за один USD. Ссылка имеет постоянную bc_-метку и не создаёт login-код. Реферер должен быть подтверждённым пользователем проекта.

### PATCH /api/projects/{id}/analytics/acquisition/expenses/{resourceId}

Исправить или архивировать: дневные расходы

Изменения сохраняются в аудите. archived=true архивирует, false восстанавливает. Нельзя изменить code, источник/бота опубликованной ссылки или связь размещения.
