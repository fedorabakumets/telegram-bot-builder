# Шаблон отправки прикреплённых медиафайлов (attached-media.py.jinja2)

## Описание

Частичный шаблон (partial) для генерации Python кода отправки медиафайлов в Telegram боте. Поддерживает фото, видео, аудио и документы — как локальные (`/uploads/...`), так и внешние (`http...`). При нескольких файлах формирует медиагруппу через `send_media_group`. Документы отправляются отдельной группой.

Используется через `{% include 'attached-media/attached-media.py.jinja2' %}` внутри других шаблонов.

## Параметры

| Параметр | Тип | Описание | Значение по умолчанию |
|----------|-----|----------|----------------------|
| nodeId | string | Уникальный идентификатор узла | - |
| attachedMedia | string[] | Массив URL медиафайлов | `[]` |
| formatMode | `'html' \| 'markdown' \| 'none'` | Режим форматирования | `'none'` |
| keyboardType | `'inline' \| 'reply' \| 'none'` | Тип клавиатуры | `'none'` |
| handlerContext | `'message' \| 'callback'` | Контекст обработчика | `'callback'` |

## Предвычисленные поля (renderer → шаблон)

Renderer передаёт в шаблон уже готовые данные, чтобы упростить Jinja2:

| Поле | Описание |
|------|----------|
| `mediaToSend` | Итоговый список файлов с полями `url`, `fileType`, `isLocal`, `mediaClass`, `isFirst` |
| `groupable` | Файлы photo/video/audio для `send_media_group` |
| `documents` | Документы для отдельной группы |
| `isSingle` | Один файл — используется `send_*` вместо `send_media_group` |
| `hasGroupable` | Есть photo/video/audio файлы |
| `hasDocuments` | Есть документы |
| `userIdSrc` | `message.from_user.id` или `callback_query.from_user.id` |
| `msgSrc` | `message` или `callback_query` |
| `parseModeStr` | Строка `, parse_mode="HTML"` / `, parse_mode="Markdown"` / `""` |
| `safeNodeId` | `nodeId` с заменёнными `-` на `_` |

## Примеры использования

### Пример 1: Одно фото

```typescript
generateAttachedMedia({
  nodeId: 'node_1',
  attachedMedia: ['/uploads/photo.jpg'],
  handlerContext: 'callback',
});
```

### Пример 2: Несколько фото — медиагруппа

```typescript
generateAttachedMedia({
  nodeId: 'node_2',
  attachedMedia: ['/uploads/photo1.jpg', '/uploads/photo2.png'],
  formatMode: 'html',
  handlerContext: 'message',
});
```

### Пример 3: Смешанные медиа (фото + документ)

```typescript
generateAttachedMedia({
  nodeId: 'node_3',
  attachedMedia: ['/uploads/photo.jpg', '/uploads/doc.pdf'],
  handlerContext: 'callback',
});
```

### Пример 4: С inline клавиатурой (только первый файл)

```typescript
generateAttachedMedia({
  nodeId: 'node_4',
  attachedMedia: ['/uploads/photo1.jpg', '/uploads/photo2.jpg'],
  keyboardType: 'inline',
  handlerContext: 'callback',
});
```

## Примеры вывода

### Вывод 1: Одно локальное фото

```python
try:
    media_file_0 = FSInputFile(get_upload_file_path("/uploads/photo.jpg"))
    logging.info(f"📎 Отправка photo: /uploads/photo.jpg")
    if 'all_user_vars' not in locals():
        all_user_vars = await init_all_user_vars(callback_query.from_user.id)
    variable_filters = user_data.get(callback_query.from_user.id, {}).get("_variable_filters", {})
    processed_caption = replace_variables_in_text(text, all_user_vars, variable_filters)
    await bot.send_photo(callback_query.from_user.id, media_file_0, caption=processed_caption, reply_markup=keyboard)
    logging.info(f"✅ Медиафайл отправлен для узла node_1")
except Exception as e:
    logging.error(f"❌ Ошибка отправки медиа для узла node_1: {e}")
    await callback_query.answer(processed_caption, reply_markup=keyboard)
```

### Вывод 2: Медиагруппа из нескольких фото

```python
media_group_node_2 = []
file_path_0 = get_upload_file_path("/uploads/photo1.jpg")
media_group_node_2.append(InputMediaPhoto(media=FSInputFile(file_path_0), caption=processed_caption))
file_path_1 = get_upload_file_path("/uploads/photo2.png")
media_group_node_2.append(InputMediaPhoto(media=FSInputFile(file_path_1)))

try:
    await bot.send_media_group(callback_query.from_user.id, media_group_node_2)
    logging.info(f"✅ Отправлено 2 медиафайлов для узла node_2")
    if keyboard is not None:
        await bot.send_message(callback_query.from_user.id, processed_caption, reply_markup=keyboard)
except Exception as e:
    logging.error(f"❌ Ошибка отправки медиа-группы для узла node_2: {e}")
```

## Логика условий

### Определение типа файла

По расширению URL:
- `jpg, jpeg, png, gif, webp, bmp` → `photo`
- `mp4, avi, mov, webm` → `video`
- `mp3, wav, ogg, m4a` → `audio`
- всё остальное → `document`

### Один файл vs медиагруппа

- Один файл → `bot.send_photo/video/audio/document`
- Несколько файлов → `bot.send_media_group` (photo/video/audio вместе, документы отдельно)

### Клавиатура при медиагруппе

`send_media_group` не поддерживает `reply_markup`, поэтому клавиатура отправляется отдельным `send_message`.

### Ограничение при наличии клавиатуры

Если `keyboardType` — `inline` или `reply`, и файлов больше одного, отправляется только первый файл (чтобы клавиатура была прикреплена к нему).

## Тесты

```bash
npm test -- attached-media.test.ts
```

## Структура файлов

```
attached-media/
├── attached-media.py.jinja2       (шаблон)
├── attached-media.params.ts       (типы параметров)
├── attached-media.schema.ts       (Zod схема)
├── attached-media.renderer.ts     (функция рендеринга)
├── attached-media.fixture.ts      (тестовые данные)
├── attached-media.test.ts         (тесты)
├── attached-media.md              (документация)
└── index.ts                       (экспорт)
```
