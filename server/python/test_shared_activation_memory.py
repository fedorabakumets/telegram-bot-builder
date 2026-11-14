"""@fileoverview Регрессия удержания сценариев после ста пробуждений рядом с постоянным ботом."""
import asyncio
import gc
import json
import logging
from pathlib import Path
import subprocess
import sys
import tempfile
import tracemalloc
import types
import unittest
import weakref
from unittest.mock import patch


def wrapper_depth(function):
    """Считает цепочку предыдущих answer, не сохраняя исследуемые функции."""
    seen = set()
    while callable(function) and id(function) not in seen:
        seen.add(id(function))
        cells = dict(zip(function.__code__.co_freevars, function.__closure__ or ()))
        cell = cells.get('_orig_answer')
        function = cell.cell_contents if cell else None
    return len(seen)


async def exercise():
    """Выполняет реальную загрузку воркера с сетевыми отправками через локальную сессию."""
    from aiogram import Bot
    from aiogram.client.session.base import BaseSession
    from aiogram.types import Message
    from worker import BotContext, BotWorker
    from process_memory import total_rss_kb
    import bot_env_overlay
    bot_env_overlay.install()

    class Session(BaseSession):
        """Подменяет только транспорт Telegram, сохраняя настоящие модели и методы."""
        async def close(self):
            """Сессия не владеет сетевыми ресурсами."""
        async def make_request(self, bot, method, timeout=None):
            """Возвращает минимальный ответ Telegram без обращения к сети."""
            return Message(message_id=1, date=0, chat={'id': 1, 'type': 'private'}, text='ok')
        async def stream_content(self, *args, **kwargs):
            """Поддерживает абстрактный интерфейс, не загружая файлы."""
            if False:
                yield b''

    state = types.ModuleType('_activation_memory_probe')
    state.refs, state.sent, state.errors = [], {}, []
    state.stop = asyncio.Event()
    state.Session, state.Bot, state.Message = Session, Bot, Message
    sys.modules[state.__name__] = state
    root = Path(__file__).resolve().parents[2]
    template = (root / 'lib/templates/middleware/wrap-bot-answer.py.jinja2').read_text(encoding='utf-8')
    if '--baseline' in sys.argv:
        template = subprocess.check_output(['git', 'show', '4c496220c:lib/templates/middleware/wrap-bot-answer.py.jinja2'],
                                           cwd=root, text=True, encoding='utf-8')
    template = template.split('#}', 1)[1]
    source = '''import asyncio, logging, weakref, os
import _activation_memory_probe as probe
TOKEN_ID = int(os.environ['TOKEN_ID'])
class Payload:
    """Контрольный объект, принадлежащий только активации."""
    def __init__(self):
        """Выделяет ограниченную нагрузку, делая утечку измеримой."""
        self.data = bytearray(256 * 1024)
payload = Payload()
probe.refs.append(weakref.ref(payload))
bot = probe.Bot(token=f"{TOKEN_ID}:" + 'a' * 35, session=probe.Session())
def _fire_save_message(**kwargs):
    """Учитывает обработку без базы и фоновых задач."""
    probe.sent[TOKEN_ID] = probe.sent.get(TOKEN_ID, 0) + 1
''' + template + '''
_WORKER_READY_PROTOCOL = True
async def main():
    """Держит соседа активным и завершает временный сценарий штатным путём."""
    _wrap_message_answer(bot)
    _worker_bot_ready()
    message = probe.Message(message_id=1, date=0, chat={'id': 1, 'type': 'private'}, text='in').as_(bot)
    try:
        await message.answer('ok')
        if TOKEN_ID == 901:
            while not probe.stop.is_set():
                await asyncio.sleep(0.001)
    finally:
        await bot.session.close()
'''
    traces, depths, handlers, rss = [], [], [], []
    tracemalloc.start()
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / 'bot.py'
        path.write_text(source, encoding='utf-8')
        code = compile(source, str(path), 'exec')
        worker = BotWorker()
        neighbor = BotContext(901, '901:' + 'a' * 35, str(path))
        neighbor.env = {}
        with patch('worker.bot_code_cache.load_bot_code', new=lambda *args: code), \
                patch('worker.emit_log', new=lambda *args: None), patch('worker.emit_system', new=lambda *args: None):
            permanent = asyncio.create_task(worker._run_bot(neighbor))
            while neighbor.status != 'running' and not permanent.done():
                await asyncio.sleep(0)
            for index in range(100):
                context = BotContext(902, '902:' + 'a' * 35, str(path))
                context.env = {}
                await worker._run_bot(context)
                await asyncio.sleep(0)
                gc.collect()
                if context.status == 'error':
                    state.errors.append(index)
                if index in (9, 49, 99):
                    traces.append(tracemalloc.get_traced_memory()[0])
                    depths.append(wrapper_depth(Message.answer))
                    handlers.append((len(logging.getLogger().handlers), len(logging.getLogger().filters)))
                    rss.append(total_rss_kb())
            alive = sum(reference() is not None for reference in state.refs)
            message = Message(message_id=2, date=0, chat={'id': 1, 'type': 'private'}).as_(neighbor.module.bot)
            await message.answer('сосед продолжает отвечать')
            del message
            state.stop.set()
            await permanent
    gc.collect()
    result = {'tracedBytes': traces, 'rssKb': rss, 'depths': depths, 'loggingCounts': handlers,
              'retainedDuringNeighbor': alive, 'retainedAfterStop': sum(ref() is not None for ref in state.refs),
              'sends': state.sent, 'errors': state.errors}
    print(json.dumps(result))


class SharedActivationMemoryTest(unittest.TestCase):
    """Изолирует процесс теста, не маскируя утечку ручным восстановлением глобальных методов."""
    def test_one_hundred_unloads_with_permanent_neighbor(self):
        """Проверяет освобождение старых словарей и ограниченность обёрток и журналирования."""
        run = subprocess.run([sys.executable, str(Path(__file__).resolve()), '--probe'],
                             capture_output=True, text=True, encoding='utf-8', timeout=180)
        self.assertEqual(run.returncode, 0, run.stderr[-4000:])
        result = json.loads(run.stdout.splitlines()[-1])
        print(json.dumps(result))
        self.assertEqual(result['errors'], [])
        self.assertEqual(result['retainedDuringNeighbor'], 1)
        self.assertEqual(result['retainedAfterStop'], 0)
        self.assertEqual(result['depths'][0], result['depths'][-1])
        self.assertEqual(result['loggingCounts'][0], result['loggingCounts'][-1])
        self.assertEqual(result['sends'], {'901': 2, '902': 100})
        self.assertLess(result['tracedBytes'][-1] - result['tracedBytes'][0], 2 * 1024 * 1024)


if __name__ == '__main__':
    asyncio.run(exercise()) if '--probe' in sys.argv else unittest.main()
