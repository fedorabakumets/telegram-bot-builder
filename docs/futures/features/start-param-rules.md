# Start Param Rules — Универсальный парсинг параметра /start

## Проблема

Сейчас в узле `command_trigger` парсинг параметра `/start` работает так:
- Один узел = одно правило совпадения
- `ref_` захардкожен в шаблоне как магический префикс для рефералок
- Нельзя одновременно обрабатывать `ref_123` и `promo_summer` в одном узле

Это не масштабируется. Пользователь конструктора должен сам решать что делать с параметром.

---

## Идея

Добавить в узел `/start` массив правил парсинга параметра.
Каждое правило: если параметр начинается с префикса X → сохранить остаток в переменную Y.

### UI в редакторе

```
┌─────────────────────────────────────────────────────┐
│  /start — обработка параметра                       │
├─────────────────────────────────────────────────────┤
│  Сохранить параметр целиком в: [start_param    ]    │
│                                                     │
│  Правила парсинга:                                  │
│  ┌─────────────────────────────────────────────┐   │
│  │ если начинается с [ref_    ]                │   │
│  │ → сохранить остаток в [referrer_id     ]    │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ если начинается с [promo_  ]                │   │
│  │ → сохранить остаток в [promo_code      ]    │   │
│  └─────────────────────────────────────────────┘   │
│  [+ Добавить правило]                               │
└─────────────────────────────────────────────────────┘
```

### Генерируемый код

```python
args = command.args or ""

# Сохраняем весь параметр целиком
await set_user_var(user_id, "start_param", args)

# Правила парсинга
if args.startswith("ref_"):
    await set_user_var(user_id, "referrer_id", args[4:])
elif args.startswith("promo_"):
    await set_user_var(user_id, "promo_code", args[6:])
elif args.startswith("invite_"):
    await set_user_var(user_id, "inviter_id", args[7:])
```

---

## Примеры использования

**Реферальная программа:**
```
prefix: ref_     → varName: referrer_id
```
`?start=ref_123456789` → `referrer_id = "123456789"`

**Промокоды:**
```
prefix: promo_   → varName: promo_code
```
`?start=promo_summer` → `promo_code = "summer"`

**A/B тесты:**
```
prefix: ab_      → varName: ab_variant
```
`?start=ab_control` → `ab_variant = "control"`

**Источники трафика (без парсинга, просто сохранить):**
```
Сохранить целиком в: utm_source
```
`?start=instagram` → `utm_source = "instagram"`

**Комбо — источник + кампания:**
```
prefix: ig_      → varName: campaign
prefix: yt_      → varName: campaign
```
`?start=ig_giveaway` → `campaign = "giveaway"` + `start_param = "ig_giveaway"`

---

## Схема данных

### Новое поле в узле `command_trigger`

```typescript
interface StartParamConfig {
  /** Имя переменной для сохранения полного параметра */
  saveFullParamAs?: string;           // например "start_param"

  /** Правила парсинга по префиксу */
  rules?: StartParamRule[];
}

interface StartParamRule {
  /** Префикс для совпадения */
  prefix: string;                     // например "ref_"
  /** Имя переменной для сохранения остатка */
  varName: string;                    // например "referrer_id"
}
```

### Пример конфига узла

```json
{
  "type": "command_trigger",
  "data": {
    "command": "/start",
    "startParamConfig": {
      "saveFullParamAs": "start_param",
      "rules": [
        { "prefix": "ref_",   "varName": "referrer_id" },
        { "prefix": "promo_", "varName": "promo_code"  }
      ]
    }
  }
}
```

---

## Что нужно изменить

### 1. Схема узла
```
lib/templates/command-trigger/command-trigger.params.ts
lib/templates/command-trigger/command-trigger.schema.ts
```
Добавить `startParamConfig` в типы и Zod схему.

### 2. Шаблон генерации
```
lib/templates/command-trigger/command-trigger.py.jinja2
```
- Убрать захардкоженный `ref_` автопарсинг
- Генерировать `if/elif` цепочку по `startParamConfig.rules`
- Генерировать `set_user_var` для `saveFullParamAs`

### 3. Редактор
```
client/components/editor/nodes/command-trigger/
```
- UI для поля "Сохранить параметр в переменную"
- UI для добавления/удаления правил парсинга

### 4. Тесты
```
lib/tests/test-phase2-command-trigger-deeplink.ts
```
Добавить блок T: правила парсинга параметра.

---

## Обратная совместимость

Старые проекты с `deepLinkSaveToVar` + `deepLinkVarName` продолжают работать.
Новый `startParamConfig` — дополнительное поле, не замена.

Захардкоженный `ref_` автопарсинг убирается только после того как новый UI готов.

---

## Приоритет

**Medium** — после Этапа 2 (UI аналитики).

Текущий `ref_` автопарсинг работает для базовых случаев.
Эта фича нужна когда пользователи конструктора начнут просить кастомные префиксы.
