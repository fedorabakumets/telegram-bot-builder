"""Проверяет отправку оригинала сгенерированным ботом без панели и Telegram."""
import asyncio
import runpy
import sys
from types import SimpleNamespace

module = runpy.run_path(sys.argv[1], run_name='export_probe')
received = []

class Message:
    """Подставной Telegram получает объект файла и проверяет его содержимое."""
    async def answer_photo(self, photo):
        """Принимает вложение и сохраняет байты для проверки."""
        with open(photo.path, 'rb') as source:
            received.append(source.read())
        return SimpleNamespace(photo=[])

class Callback:
    """Подставной callback с сообщением Telegram."""
    message = Message()

    async def answer(self):
        """Подтверждает callback без сетевого запроса."""
        pass

async def main():
    """Запускает сгенерированный обработчик и закрывает сессию бота."""
    try:
        await module['handle_callback_m1'](Callback())
        assert received == [b'abc'], received
    finally:
        await module['bot'].session.close()

asyncio.run(main())
