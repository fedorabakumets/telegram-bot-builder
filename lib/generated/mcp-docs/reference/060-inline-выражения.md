# Inline-выражения {=...}

В любом текстовом поле (messageText, mediaCaption, button text, httpRequestUrl и т.д.) поддерживается синтаксис `{=выражение}` для вычисления формул прямо в тексте:

| Синтаксис | Результат | Описание |
|-----------|-----------|----------|
| `{=credits - price}` | `3800` | Арифметика |
| `{=thousands(credits)}` | `5 000` | Форматирование числа |
| `{=round(score / games, 2)}` | `70.58` | Округление |
| `{=max(hp - damage, 0)}` | `0` | Функции min/max |

Доступные функции: `round`, `abs`, `int`, `float`, `min`, `max`, `str`, `reversed`, `thousands`.

Доступные методы строк: `replace`, `strip`, `lstrip`, `rstrip`, `lower`, `upper`, `startswith`, `endswith`, `split`, `join`, `count`, `find`, `format`, а также проверки `isdigit`, `isnumeric`, `isdecimal`, `isalpha`, `isalnum`, `isspace`.

Генераторы и comprehension **не поддерживаются** — выражение вроде `''.join(c for c in x if c.isdigit())` молча вернётся как текст. Для защиты от нечислового ввода используйте `isdigit`:

```
float('{amount}'.replace(',', '.')) if '{amount}'.replace(',', '.').replace('.', '', 1).isdigit() else 0
```

Пример разворота порядка слов: `{=' '.join(reversed('{user_message}'.split()))}` → «Привет как дела» станет «дела как Привет». Разворот символов проще делать срезом: `{='{user_message}'[::-1]}`.

Переменные внутри `{=...}` пишутся **без** фигурных скобок: `{=thousands(user_amount)}`, не `{=thousands({user_amount})}`.

Выражения вычисляются через `_eval_expr` — безопасный вычислитель на основе AST. При ошибке или невалидном выражении текст `{=...}` остаётся без изменений.
