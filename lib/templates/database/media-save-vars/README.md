# Шаблон media-save-vars

## Описание

Генерирует Python-код сохранения медиа-переменных в `user_data` и базу данных.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `nodeId` | `string` | Да | — | ID узла |
| `imageUrl` | `string` | Нет | — | URL изображения |
| `videoUrl` | `string` | Нет | — | URL видео |
| `audioUrl` | `string` | Нет | — | URL аудио |
| `documentUrl` | `string` | Нет | — | URL документа |
| `indentLevel` | `string` | Нет | `'                '` | Базовый отступ |

## Тесты

```bash
npm run test:media-save-vars
```
