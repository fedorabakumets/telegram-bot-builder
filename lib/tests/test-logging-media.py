"""Проверяет подготовку управляемых медиа в обёртках исходящих сообщений."""
import asyncio
import logging
from pathlib import Path
from types import SimpleNamespace

source = Path('lib/templates/middleware/send-message-with-logging.py.jinja2').read_text(encoding='utf-8').split('#}', 1)[1]
calls = []

async def resolve(value):
    """Подставляет подготовленный файл и фиксирует порядок разрешения."""
    calls.append(value)
    if value.endswith('/missing'):
        raise FileNotFoundError(value)
    return 'file:' + value

async def registered(value):
    """Распознаёт управляемые адреса в подставном проверяющем сервисе."""
    return isinstance(value, str) and value.startswith('/uploads/')

namespace = {'resolve_media_input': resolve, 'is_registered_media': registered, 'logging': logging, '_fire_save_message': lambda **kwargs: None}
exec(compile(source, 'logging.py', 'exec'), namespace)

class Item:
    """Упрощённая модель элемента альбома с копированием полей."""
    def __init__(self, media, thumbnail=None):
        self.media, self.thumbnail = media, thumbnail

    def model_copy(self, update):
        """Возвращает новый элемент с обновлёнными медиа."""
        return Item(update.get('media', self.media), update.get('thumbnail', self.thumbnail))

async def main():
    """Проверяет все обёртки, миниатюры и отказ при неполном альбоме."""
    sent = []
    async def send(chat_id, value, *args, **kwargs):
        """Запоминает фактически отправленный аргумент."""
        sent.append((value, kwargs))
        return [] if isinstance(value, list) else None
    bot = SimpleNamespace(**{f'send_{kind}': send for kind in ('sticker', 'voice', 'animation', 'video', 'audio', 'document', 'media_group')})
    for kind in ('sticker', 'voice', 'animation', 'video', 'audio', 'document', 'media_group'):
        namespace[f'_wrap_bot_send_{kind}'](bot)
    for kind in ('sticker', 'voice', 'animation', 'video', 'audio', 'document'):
        await getattr(bot, f'send_{kind}')(1, '/uploads/12/' + kind)
        assert sent[-1][0] == 'file:/uploads/12/' + kind
    await bot.send_video(1, 'telegram-file-id', thumbnail='/uploads/12/thumb')
    assert sent[-1] == ('telegram-file-id', {'caption': None, 'thumbnail': 'file:/uploads/12/thumb'})
    original = [Item('/uploads/12/a'), Item('https://example.org/uploads/b', '/uploads/12/thumb')]
    await bot.send_media_group(1, original)
    assert [item.media for item in sent[-1][0]] == ['file:/uploads/12/a', 'https://example.org/uploads/b']
    assert sent[-1][0][1].thumbnail == 'file:/uploads/12/thumb'
    assert original[0].media == '/uploads/12/a'
    count = len(sent)
    try:
        await bot.send_media_group(1, [Item('/uploads/12/a'), Item('/uploads/12/missing')])
        raise AssertionError('Альбом с отсутствующим файлом должен завершиться ошибкой')
    except FileNotFoundError:
        pass
    assert len(sent) == count

asyncio.run(main())
print('OK: обёртки медиа, миниатюры и атомарная подготовка альбома')
