"""@fileoverview Исполнение фрагментов шаблона polling с настоящими замыканиями."""

import asyncio
import textwrap
from pathlib import Path


def polling_block():
    """Возвращает исполняемый фрагмент шаблона наблюдения за polling."""
    template = Path(__file__).resolve().parents[2] / 'lib/templates/main/main.py.jinja2'
    source = template.read_text(encoding='utf-8')
    start = source.index('                    _polling_task = asyncio.create_task(dp.start_polling')
    end = source.index('                    try:\n                        await _polling_task', start)
    body = textwrap.dedent(source[start:end])
    namespace = {'asyncio': asyncio}
    exec('async def observe(dp, bot, _stop_event, _background_tasks):\n' +
         textwrap.indent(body, '    '), namespace)
    return namespace['observe']


def startup_callback(stop_event, ready, commit, *, external=False, webhook=''):
    """Создаёт callback шаблона в замыкании, как при настоящем запуске main."""
    template = Path(__file__).resolve().parents[2] / 'lib/templates/main/main.py.jinja2'
    source = template.read_text(encoding='utf-8')
    start = source.index('        async def _notify_worker_ready')
    end = source.index('        # Выбор режима запуска:', start)
    namespace = {'_stop_event': stop_event, '_worker_bot_ready': ready,
                 '_worker_direct_commit': commit, 'WEBHOOK_URL': webhook,
                 '_external_mode': external}
    body = textwrap.dedent(source[start:end])
    exec('def create_callback():\n    _direct_state_committed = False\n' +
         textwrap.indent(body, '    ') +
         '\n    return _notify_worker_ready\n', namespace)
    return namespace['create_callback']()
