# media-input-handlers

Шаблон генерации Python-обработчиков входящих медиафайлов от пользователя (фото, видео, аудио, документ, геолокация, контакт).

## Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `hasPhotoInput` | `boolean` | Есть узлы с enablePhotoInput |
| `hasVideoInput` | `boolean` | Есть узлы с enableVideoInput |
| `hasAudioInput` | `boolean` | Есть узлы с enableAudioInput |
| `hasDocumentInput` | `boolean` | Есть узлы с enableDocumentInput |
| `hasLocationInput` | `boolean` | Есть узлы с enableLocationInput |
| `hasContactInput` | `boolean` | Есть узлы с enableContactInput |
| `navigationCode` | `string` | Код навигации к следующему узлу |
| `mediaMetadataConfigs` | `MediaMetadataConfig[]` | Конфигурация сохранения метаданных (опционально) |

### MediaMetadataConfig

| Поле | Тип | Описание |
|------|-----|----------|
| `mediaType` | `string` | Тип медиа: `photo`, `video`, `audio`, `document` |
| `baseVariable` | `string` | Имя базовой переменной (из неё формируются суффиксы) |
| `enabledSuffixes` | `string[]` | Включённые суффиксы. Пустой массив = все суффиксы |
| `customNames` | `Record<string, string>` | Кастомные имена переменных: ключ — суффикс, значение — имя |

## Доступные суффиксы по типу медиа

### Photo
- `file_id` — Telegram file_id (максимальный размер)
- `file_unique_id` — уникальный ID файла
- `file_size` — размер файла (байт)
- `width` — ширина (px)
- `height` — высота (px)
- `small_file_id` — file_id миниатюры (минимальный размер)
- `small_width` — ширина миниатюры (px)
- `small_height` — высота миниатюры (px)
- `sizes_count` — количество размеров
- `all_sizes` — JSON всех размеров `[{file_id, w, h, size}]`

### Video
- `file_id` — Telegram file_id
- `file_unique_id` — уникальный ID файла
- `thumbnail` — file_id обложки
- `duration` — длительность (сек)
- `file_size` — размер файла (байт)
- `file_name` — имя файла
- `width` — ширина (px)
- `height` — высота (px)
- `mime_type` — MIME тип

### Audio
- `file_id` — Telegram file_id (audio или voice)
- `file_unique_id` — уникальный ID файла
- `thumbnail` — file_id обложки
- `duration` — длительность (сек)
- `file_size` — размер файла (байт)
- `file_name` — имя файла
- `title` — название трека
- `performer` — исполнитель
- `mime_type` — MIME тип

### Document
- `file_id` — Telegram file_id
- `file_unique_id` — уникальный ID файла
- `thumbnail` — file_id обложки
- `file_name` — имя файла
- `file_size` — размер файла (байт)
- `mime_type` — MIME тип

## Пример входных данных

```ts
const params: MediaInputHandlersTemplateParams = {
  hasPhotoInput: true,
  hasVideoInput: true,
  hasAudioInput: false,
  hasDocumentInput: false,
  hasLocationInput: false,
  hasContactInput: false,
  navigationCode: 'await process_node(next_node_id, user_id, message, user_vars)',
  mediaMetadataConfigs: [
    {
      mediaType: 'video',
      baseVariable: 'my_video',
      enabledSuffixes: ['duration', 'file_size', 'thumbnail'],
      customNames: { duration: 'video_len' },
    },
  ],
};
```

## Пример выходного кода (фрагмент для video)

```python
    # Сохранение метаданных видео
    user_data[user_id]["my_video_thumbnail"] = message.video.thumbnail.file_id if message.video.thumbnail else ""
    await update_user_data_in_db(user_id, "my_video_thumbnail", message.video.thumbnail.file_id if message.video.thumbnail else "")
    user_data[user_id]["video_len"] = message.video.duration
    await update_user_data_in_db(user_id, "video_len", message.video.duration)
    user_data[user_id]["my_video_file_size"] = message.video.file_size or 0
    await update_user_data_in_db(user_id, "my_video_file_size", message.video.file_size or 0)
```

## Обратная совместимость

Если `mediaMetadataConfigs` не передан или пуст — шаблон генерирует код без блоков метаданных, как и раньше.
