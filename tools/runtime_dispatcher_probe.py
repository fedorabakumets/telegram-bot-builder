"""@fileoverview Проверка первого и повторных апдейтов настоящего Dispatcher без сети."""
import asyncio
import json
from pathlib import Path
import sys
import time


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'server/python'))


async def main(mode):
    """Сравнивает режимы на одинаковом маршруте разбора и обработки апдейта.

    @param mode - Ленивый либо обычный импорт моделей.
    @returns Снимки памяти и ответы обработчика.
    """
    from process_memory import total_rss_kb
    import lazy_aiogram
    preimported = 'aiogram' in sys.modules
    baseline = total_rss_kb()
    applied = lazy_aiogram.enable() if mode == 'lazy' else False
    if mode == 'lazy' and not applied:
        raise RuntimeError('Ленивая сборка не включена до импорта aiogram')
    from aiogram import Bot, Dispatcher
    from aiogram.client.session.base import BaseSession
    from aiogram.filters import CommandStart
    from aiogram.types import Message, Update
    imports = total_rss_kb()
    requests = []

    class Session(BaseSession):
        """Заменяет только сетевую доставку запросов Bot API."""

        async def close(self):
            """Закрывает транспорт без внешних ресурсов."""

        async def make_request(self, bot, method, timeout=None):
            """Сохраняет сериализацию запроса и возвращает настоящее сообщение."""
            prepared = self.prepare_value(method.model_dump(warnings=False), bot=bot, files={})
            requests.append(json.loads(prepared) if isinstance(prepared, str) else prepared)
            return Message(message_id=99, date=0, chat={'id': 1, 'type': 'private'}, text='ok')

        async def stream_content(self, *args, **kwargs):
            """Предоставляет интерфейс файлового транспорта без скачивания."""
            if False:
                yield b''

    bot = Bot('123456:' + 'a' * 35, session=Session())
    dispatcher = Dispatcher()

    @dispatcher.message(CommandStart())
    async def start(message: Message):
        """Отвечает через настоящий фильтр команд и метод Message.answer."""
        await message.answer('ответ')

    after_dispatcher = total_rss_kb()
    timings = []
    after_first = None
    try:
        for index in range(5):
            started = time.perf_counter()
            update = Update.model_validate({
                'update_id': index + 1,
                'message': {'message_id': index + 1, 'date': 0,
                            'chat': {'id': 1, 'type': 'private'},
                            'from': {'id': 1, 'is_bot': False, 'first_name': 'Тест'},
                            'text': '/start',
                            'entities': [{'type': 'bot_command', 'offset': 0, 'length': 6}]},
            }, context={'bot': bot})
            await dispatcher.feed_update(bot, update)
            timings.append(round((time.perf_counter() - started) * 1000, 3))
            if index == 0:
                after_first = total_rss_kb()
    finally:
        await dispatcher.storage.close()
        await bot.session.close()
    assert len(requests) == 5, requests
    assert all(request['text'] == 'ответ' and request['chat_id'] == 1 for request in requests)
    return {'mode': mode, 'preimported': preimported, 'lazyApplied': applied,
            'rssKiB': {'baseline': baseline, 'imports': imports, 'dispatcher': after_dispatcher,
                       'firstUpdate': after_first, 'repeatedUpdates': total_rss_kb()},
            'updateMilliseconds': timings, 'responses': len(requests), 'ok': True,
            'coverage': 'real_Dispatcher_CommandStart_Update_Message_fake_Telegram_transport'}


if __name__ == '__main__':
    print(json.dumps(asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else 'lazy')),
                     ensure_ascii=True))
