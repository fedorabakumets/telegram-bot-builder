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
| `messageSendRecipients` | `MediaSendRecipient[]` | ❌ | Список получателей (если пустой — отправка пользователю) |
| `telegramFileIds`     | `Record<string, string>` | ❌ | Словарь кэшированных Telegram file_id. Ключ — URL файла, значение — file_id. При наличии — отправка через file_id напрямую без загрузки файла. |
| `thumbnailFileIds`    | `Record<string, string>` | ❌ | Словарь обложек видео: ключ — URL видео, значение — Telegram file_id обложки. Передаётся как `thumbnail=` в `answer_video`. |
| `state`               | `FSMContext` | ❌         | Опциональный FSM контекст (state: FSMContext = None). Используется для чтения/записи данных между переходами. |

## Тип MediaSendRecipient

| Поле | Тип | Обязательный | Описание |
|------|-----|:------------:|----------|
| `id` | `string` | ✅ | Уникальный идентификатор получателя |
| `type` | `'user' \| 'chat_id' \| 'admin_ids'` | ✅ | Тип получателя |
| `chatId` | `string` | ❌ | ID чата, @username или {переменная} |
| `threadId` | `string` | ❌ | ID топика или {переменная} |
| `isGroup` | `boolean` | ❌ | Добавить префикс -100 для групп/каналов |
| `botToken` | `string` | ❌ | Токен бота для отправки. Если задан — создаётся `Bot(token=...)` на лету. По умолчанию — глобальный `bot`. |

## Логика определения типа файла

| Расширения                        | Метод отправки   | InputMedia класс   |
|-----------------------------------|------------------|--------------------|
| `.gif` и видео из `sendAsGifUrls` | `answer_animation` / `send_animation` | `InputMediaAnimation` |
| `.jpg`, `.jpeg`, `.png`, `.webp` | `answer_photo`   | `InputMediaPhoto`  |
| `.mp4`, `.avi`, `.mov`, `.webm`, `.mkv`, `.m4v` | `answer_video`   | `InputMediaVideo`  |
| `.mp3`, `.wav`, `.ogg`            | `answer_audio`   | `InputMediaAudio`  |
| остальные                         | `answer_document`| `InputMediaDocument`|
| `{переменная}` с `type: "file"` | `answer_photo` / `answer_audio` / `answer_video` / `answer_document` через `BufferedInputFile` (выбор по `mimeType`) | — |

## Поведение

- **1 файл** — одиночная отправка через `answer_photo` / `answer_video` / `answer_audio` / `answer_document`
- **2+ файла** — медиагруппа через `answer_media_group` с соответствующими `InputMedia*` объектами
- **0 файлов** — генерируется `pass` (нет отправки)
- **`/uploads/` пути** — используется `FSInputFile(get_upload_file_path(...))`
- **Автопереход** — генерирует `FakeCallbackQuery` и вызов следующего обработчика
- **Кэшированный file_id** — если для URL есть запись в `telegramFileIds`, отправка идёт напрямую через file_id (`📎` в логах). При первой отправке без кэша — логируется `📤` и полученный file_id записывается в лог (`✅`).
- **Переменная типа `file`** — если переменная содержит объект `{type: "file", data, mimeType, fileName}`, метод отправки выбирается по `mimeType`: `image/*` → `answer_photo`, `audio/*` → `answer_audio`, `video/*` → `answer_video`, остальное → `answer_document`

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
