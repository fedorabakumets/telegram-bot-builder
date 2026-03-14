# Шаблон стикера (sticker.py.jinja2)

## Описание

Шаблон генерирует Python обработчик для отправки стикеров Telegram через бота.

## Параметры

| Параметр | Тип | Описание | Значение по умолчанию |
|----------|-----|----------|----------------------|
| nodeId | string | Уникальный идентификатор узла | - |
| stickerUrl | string | URL стикера для отправки | '' |
| stickerFileId | string | File ID стикера в Telegram | '' |
| stickerSetName | string | Название набора стикеров | '' |
| mediaCaption | string | Подпись к стикеру | '' |
| disableNotification | boolean | Отправить без уведомления | false |

## Примеры использования

### Пример 1: Отправка стикера по file_id

```typescript
generateSticker({
  nodeId: 'sticker_1',
  stickerFileId: 'CAACAgQAAxkBAAIC',
  mediaCaption: 'Привет!',
});
```

### Пример 2: Отправка стикера по URL

```typescript
generateSticker({
  nodeId: 'sticker_2',
  stickerUrl: 'https://example.com/sticker.webp',
  disableNotification: true,
});
```

### Пример 3: Отправка стикера из набора

```typescript
generateSticker({
  nodeId: 'sticker_3',
  stickerSetName: 'MyStickerPack',
  mediaCaption: 'Из моего набора',
});
```

### Пример 4: Тихая отправка без подписи

```typescript
generateSticker({
  nodeId: 'sticker_4',
  stickerFileId: 'CAACAgQAAxkBAAID',
  disableNotification: true,
});
```

## Примеры вывода

### Вывод 1: Стикер по file_id с подписью

```python
@dp.message(Command("sticker_sticker_1"))
async def handle_sticker_sticker_1(message: types.Message):
    """Обработчик отправки стикера для узла sticker_1"""
    user_id = message.from_user.id

    sticker_file_id = "CAACAgQAAxkBAAIC"

    caption = "Привет!"
    all_user_vars = await init_all_user_vars(user_id)
    caption = replace_variables_in_text(caption, all_user_vars, variable_filters)

    try:
        await message.answer_sticker(
            sticker=sticker_file_id,
            caption=caption
        )
    except Exception as e:
        logging.error(f"Ошибка отправки стикера: {e}")
        await message.answer("Произошла ошибка при отправке стикера")
```

### Вывод 2: Стикер по URL

```python
@dp.message(Command("sticker_sticker_2"))
async def handle_sticker_sticker_2(message: types.Message):
    """Обработчик отправки стикера для узла sticker_2"""
    user_id = message.from_user.id

    sticker_url = "https://example.com/sticker.webp"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(sticker_url) as resp:
                sticker_data = await resp.read()
                await message.answer_sticker(
                    sticker=sticker_data,
                    disable_notification=True
                )
    except Exception as e:
        logging.error(f"Ошибка отправки стикера: {e}")
        await message.answer("Произошла ошибка при отправке стикера")
```

### Вывод 3: Стикер из набора

```python
@dp.message(Command("sticker_sticker_3"))
async def handle_sticker_sticker_3(message: types.Message):
    """Обработчик отправки стикера для узла sticker_3"""
    user_id = message.from_user.id

    try:
        await message.answer_sticker(
            sticker="MyStickerPack",
            caption="Из набора"
        )
    except Exception as e:
        logging.error(f"Ошибка отправки стикера: {e}")
        await message.answer("Произошла ошибка при отправке стикера")
```

## Логика условий

- **stickerFileId задан**: Приоритетная отправка по file_id
- **stickerUrl задан**: Скачивание и отправка по URL через aiohttp
- **stickerSetName задан**: Отправка из набора стикеров
- **mediaCaption задан**: Добавление подписи с заменой переменных
- **disableNotification = true**: Отправка без уведомления

## Тесты

Запуск тестов:

```bash
npm test -- sticker.test.ts
```

Тесты покрывают:
- Валидные данные (8 тестов)
- Невалидные данные (4 теста)
- Граничные случаи (6 тестов)
- Производительность (2 теста)
- Валидация схемы (5 тестов)

## Зависимости

- aiogram (types.Message, Command)
- aiohttp (для скачивания стикеров по URL)
- logging (для логирования ошибок)

## Структура файлов

```
sticker/
├── sticker.py.jinja2       (шаблон обработчика)
├── sticker.params.ts       (типы параметров)
├── sticker.schema.ts       (Zod схема)
├── sticker.renderer.ts     (функция рендеринга)
├── sticker.fixture.ts      (тестовые данные)
├── sticker.test.ts         (тесты)
├── sticker.md              (документация)
└── index.ts                  (экспорт)
```
