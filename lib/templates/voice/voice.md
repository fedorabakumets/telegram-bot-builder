# Шаблон голосового сообщения (voice.py.jinja2)

## Описание

Шаблон генерирует Python обработчик для отправки голосовых сообщений Telegram через бота.

## Параметры

| Параметр | Тип | Описание | Значение по умолчанию |
|----------|-----|----------|----------------------|
| nodeId | string | Уникальный идентификатор узла | - |
| voiceUrl | string | URL голосового сообщения (OGG/OPUS) | '' |
| mediaCaption | string | Подпись к голосовому сообщению | '' |
| mediaDuration | number | Длительность в секундах | undefined |
| disableNotification | boolean | Отправить без уведомления | false |

## Примеры использования

### Пример 1: Голосовое сообщение с подписью и длительностью

```typescript
generateVoice({
  nodeId: 'voice_1',
  voiceUrl: 'https://example.com/voice.ogg',
  mediaCaption: 'Привет! Это голосовое сообщение.',
  mediaDuration: 30,
});
```

### Пример 2: Только URL без подписи

```typescript
generateVoice({
  nodeId: 'voice_2',
  voiceUrl: 'https://example.com/voice2.ogg',
});
```

### Пример 3: Длительное сообщение с длительностью

```typescript
generateVoice({
  nodeId: 'voice_3',
  voiceUrl: 'https://example.com/voice3.ogg',
  mediaDuration: 120,
  disableNotification: true,
});
```

### Пример 4: Тихая отправка с подписью

```typescript
generateVoice({
  nodeId: 'voice_4',
  voiceUrl: 'https://example.com/voice4.ogg',
  mediaCaption: 'Важное сообщение',
  mediaDuration: 15,
  disableNotification: true,
});
```

## Примеры вывода

### Вывод 1: Полное голосовое сообщение

```python
@dp.message(Command("voice_voice_1"))
async def handle_voice_voice_1(message: types.Message):
    """Обработчик отправки голосового сообщения для узла voice_1"""
    user_id = message.from_user.id

    voice_url = "https://example.com/voice.ogg"

    caption = "Привет! Это голосовое сообщение."
    all_user_vars = await init_all_user_vars(user_id)
    caption = replace_variables_in_text(caption, all_user_vars, variable_filters)

    duration = 30

    if not voice_url:
        await message.answer("Голосовое сообщение не настроено")
        return

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(voice_url) as resp:
                voice_data = await resp.read()

                await message.answer_voice(
                    voice=voice_data,
                    caption=caption,
                    duration=duration
                )
    except Exception as e:
        logging.error(f"Ошибка отправки голосового сообщения: {e}")
        await message.answer("Произошла ошибка при отправке голосового сообщения")
```

### Вывод 2: Только URL

```python
@dp.message(Command("voice_voice_2"))
async def handle_voice_voice_2(message: types.Message):
    """Обработчик отправки голосового сообщения для узла voice_2"""
    user_id = message.from_user.id

    voice_url = "https://example.com/voice2.ogg"

    if not voice_url:
        await message.answer("Голосовое сообщение не настроено")
        return

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(voice_url) as resp:
                voice_data = await resp.read()

                await message.answer_voice(
                    voice=voice_data
                )
    except Exception as e:
        logging.error(f"Ошибка отправки голосового сообщения: {e}")
        await message.answer("Произошла ошибка при отправке голосового сообщения")
```

### Вывод 3: С длительностью и без уведомлений

```python
@dp.message(Command("voice_voice_3"))
async def handle_voice_voice_3(message: types.Message):
    """Обработчик отправки голосового сообщения для узла voice_3"""
    user_id = message.from_user.id

    voice_url = "https://example.com/voice3.ogg"

    duration = 120

    if not voice_url:
        await message.answer("Голосовое сообщение не настроено")
        return

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(voice_url) as resp:
                voice_data = await resp.read()

                await message.answer_voice(
                    voice=voice_data,
                    duration=duration,
                    disable_notification=True
                )
    except Exception as e:
        logging.error(f"Ошибка отправки голосового сообщения: {e}")
        await message.answer("Произошла ошибка при отправке голосового сообщения")
```

## Логика условий

- **voiceUrl не задан**: Генерируется сообщение "Голосовое сообщение не настроено"
- **mediaCaption задан**: Добавление подписи с заменой переменных
- **mediaDuration задан**: Добавление длительности в секундах
- **disableNotification = true**: Отправка без уведомления

## Тесты

Запуск тестов:

```bash
npm test -- voice.test.ts
```

Тесты покрывают:
- Валидные данные (8 тестов)
- Невалидные данные (4 теста)
- Граничные случаи (6 тестов)
- Производительность (2 теста)
- Валидация схемы (5 тестов)

## Зависимости

- aiogram (types.Message, Command)
- aiohttp (для скачивания голосовых сообщений по URL)
- logging (для логирования ошибок)

## Структура файлов

```
voice/
├── voice.py.jinja2       (шаблон обработчика)
├── voice.params.ts       (типы параметров)
├── voice.schema.ts       (Zod схема)
├── voice.renderer.ts     (функция рендеринга)
├── voice.fixture.ts      (тестовые данные)
├── voice.test.ts         (тесты)
├── voice.md              (документация)
└── index.ts              (экспорт)
```
