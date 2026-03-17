# Шаблон error-handler

## Описание

Генерирует Python-код блока `except` для обработки ошибок при переходе между узлами.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `indentLevel` | `string` | Нет | `'        '` | Базовый отступ генерируемого кода |

## Пример использования

```typescript
import { generateErrorHandler } from './error-handler.renderer';

const code = generateErrorHandler({ indentLevel: '        ' });
```

**Вывод:**

```python
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
```

## Тесты

```bash
npm run test:error-handler
```
