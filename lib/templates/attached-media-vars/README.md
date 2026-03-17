# Шаблон attached-media-vars

## Описание

Генерирует Python-код установки переменных из `attachedMedia` в `user_data`. Используется для сохранения URL медиафайлов в переменные пользователя.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `nodeId` | `string` | Да | — | ID узла |
| `attachedMedia` | `string[]` | Нет | `[]` | Массив имён медиа-переменных |
| `imageUrl` | `string` | Нет | — | URL изображения |
| `videoUrl` | `string` | Нет | — | URL видео |
| `audioUrl` | `string` | Нет | — | URL аудио |
| `documentUrl` | `string` | Нет | — | URL документа |
| `indentLevel` | `string` | Нет | `'                '` | Базовый отступ |

## Тесты

```bash
npm run test:attached-media-vars
```
