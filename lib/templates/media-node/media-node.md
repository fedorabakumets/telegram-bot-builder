# media-node — шаблон медиа-ноды

## Описание

Генерирует Python-обработчик `callback_query` для отправки медиафайлов из массива `attachedMedia`.

## Параметры

| Параметр              | Тип        | Обязательный | Описание                              |
|-----------------------|------------|:------------:|---------------------------------------|
| `nodeId`              | `string`   | ✅           | Уникальный идентификатор узла         |
| `attachedMedia`       | `string[]` | ✅           | Массив URL медиафайлов                |
| `enableAutoTransition`| `boolean`  | ❌           | Включить автопереход после отправки   |
| `autoTransitionTo`    | `string`   | ❌           | ID целевого узла автоперехода         |

## Логика определения типа файла

| Расширения                        | Метод отправки   | InputMedia класс   |
|-----------------------------------|------------------|--------------------|
| `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` | `answer_photo`   | `InputMediaPhoto`  |
| `.mp4`, `.avi`, `.mov`            | `answer_video`   | `InputMediaVideo`  |
| `.mp3`, `.wav`, `.ogg`            | `answer_audio`   | `InputMediaAudio`  |
| остальные                         | `answer_document`| `InputMediaDocument`|

## Поведение

- **1 файл** — одиночная отправка через `answer_photo` / `answer_video` / `answer_audio` / `answer_document`
- **2+ файла** — медиагруппа через `answer_media_group` с соответствующими `InputMedia*` объектами
- **0 файлов** — генерируется `pass` (нет отправки)
- **`/uploads/` пути** — используется `FSInputFile(get_upload_file_path(...))`
- **Автопереход** — генерирует `FakeCallbackQuery` и вызов следующего обработчика

## Пример использования

```typescript
import { generateMediaNode } from './media-node';

const code = generateMediaNode({
  nodeId: 'media_1',
  attachedMedia: ['https://example.com/photo.jpg', 'https://example.com/video.mp4'],
  enableAutoTransition: true,
  autoTransitionTo: 'next_node',
});
```
