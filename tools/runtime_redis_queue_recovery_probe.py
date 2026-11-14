"""@fileoverview Проверяет сохранность того же update при разрыве FSM Redis и повторном запуске feed."""

import argparse
import ast
import asyncio
import json
import os
from pathlib import Path
import sys
import types
from urllib.parse import urlsplit
import uuid

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'server/python'))


async def exercise(source, failure_point, engine):
    """Разрывает только собственное соединение, сохраняя реальную очередь и исходный update."""
    import lazy_aiogram
    lazy_aiogram.enable()
    from aiogram import Bot, Dispatcher
    from aiogram.fsm.storage.base import BaseStorage, StateType, StorageKey
    import redis.asyncio as redis
    from redis.exceptions import ConnectionError
    from demand_session import DemandSession
    from process_child_feed import ProcessChildFeed

    url = os.environ['PROBE_REDIS_URL']
    assert urlsplit(url).hostname in ('127.0.0.1', 'localhost', '::1'), 'Разрешён только локальный Redis'
    token_id = uuid.uuid4().int % 10**12 + 100000
    name = 'queue_recovery_' + uuid.uuid4().hex
    observer = redis.from_url(url, client_name=name, decode_responses=True)
    fsm_client = redis.from_url(url, client_name=name, decode_responses=True)
    context = types.SimpleNamespace(token=f'{token_id}:' + 'a' * 35, token_id=token_id,
        project_id=987654321, module=types.SimpleNamespace(user_data={}), env={})
    session = (ProcessChildFeed(context, url, .01) if engine == 'process' else
               DemandSession(context, {'redis_url': url, 'idle': .01}, asyncio.Semaphore(1),
                             None, None, lambda message: None))
    await session.queue.open()
    await session.queue.redis.client_setname(name)
    bot = Bot(context.token)
    delivered = []
    update = {'update_id': 77, 'message': {'message_id': 77, 'date': 1,
        'chat': {'id': 10001, 'type': 'private'},
        'from': {'id': 10001, 'is_bot': False, 'first_name': 'Проверка'}, 'text': 'исходное событие'}}
    node = next(node for node in ast.parse(source).body if isinstance(node, ast.ClassDef) and node.name == 'RedisStorage')
    namespace = {'BaseStorage': BaseStorage, 'StateType': StateType, 'StorageKey': StorageKey,
                 'user_data': context.module.user_data}
    exec(compile(ast.get_source_segment(source, node), '<настоящий-generated-RedisStorage>', 'exec'), namespace)
    dispatcher = None
    queue_client = session.queue.redis
    queue_client.connection_pool.connection_kwargs['client_name'] = name
    try:
        async with fsm_client.client() as pinned, queue_client.client() as queue_pinned:
            session.queue.redis = queue_pinned
            dispatcher = Dispatcher(storage=namespace['RedisStorage'](pinned, token_id))

            async def handle(message):
                """Отмечает именно первоначальное сообщение, а не новый update после сбоя."""
                delivered.append(message.message_id)

            dispatcher.message.register(handle)
            await session.queue.enqueue([update])
            target = pinned if failure_point == 'fsm' else queue_pinned
            before = await target.client_id()
            original_ack = session.state.save_and_ack
            ack_attempts = 0

            async def interrupted_ack(module, update_id):
                """Разрывает настоящий сокет непосредственно перед первым атомарным ACK."""
                nonlocal ack_attempts
                ack_attempts += 1
                if ack_attempts == 1:
                    assert await observer.client_kill_filter(_id=str(before)) == 1
                return await original_ack(module, update_id)

            if failure_point == 'ack':
                session.state.save_and_ack = interrupted_ack
            else:
                assert await observer.client_kill_filter(_id=str(before)) == 1
            first_error = None
            try:
                await asyncio.wait_for(session.feed(dispatcher, bot, asyncio.Event()), 5)
            except ConnectionError as error:
                first_error = type(error).__name__
            if failure_point == 'fsm':
                assert first_error is not None, 'Ожидаемая ошибка первой FSM-команды не воспроизведена'
                assert delivered == [], 'Обработчик не должен выполниться до успешного чтения FSM'
                assert (await session.queue.peek())['update_id'] == 77, 'Событие удалено до успешной обработки'
                assert await session.queue.offset() == 78
                await asyncio.wait_for(session.feed(dispatcher, bot, asyncio.Event()), 5)
            else:
                assert first_error is None, 'Безопасная стадия очереди не восстановилась автоматически'
            assert delivered == [77], 'Исходное событие не обработано ровно один раз в этом сценарии'
            assert await session.queue.peek() is None, 'После успеха событие не подтверждено'
            assert await target.client_id() != before, 'Разорванное соединение не заменено'
            assert await session.queue.offset() == 78, 'Для восстановления ошибочно понадобился новый update'
            if failure_point == 'ack':
                assert ack_attempts == 2, 'Ожидались ровно отказавший и повторный ACK без redispatch'
            print(json.dumps({'engine': engine, 'failurePoint': failure_point, 'sameUpdatePreserved': True, 'updateId': 77,
                              'firstError': first_error, 'deliveredMessageIds': delivered, 'ackAttempts': ack_attempts,
                              'newUpdateEnqueuedAfterFailure': False,
                              'automaticSessionRecovery': failure_point != 'fsm',
                              'explicitFeedRestartByProbe': failure_point == 'fsm'}), flush=True)
    finally:
        session.queue.redis = queue_client
        if dispatcher is not None:
            await dispatcher.fsm.close()
        await session.queue.redis.delete(*session.queue.keys, session.state.key)
        await session.queue.close()
        await fsm_client.aclose()
        await bot.session.close()
        owned = [client for client in await observer.client_list() if client.get('name') == name]
        assert len(owned) == 1, 'После закрытия остались соединения очереди/FSM'
        assert len(asyncio.all_tasks()) == 1, 'После проверки остались фоновые задачи'
        print(json.dumps({'ownedRedisConnectionsIncludingObserver': len(owned), 'pendingTasksExceptProbe': 0}), flush=True)
        await observer.aclose()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--failure-point', choices=('fsm', 'peek', 'ack'), default='fsm')
    parser.add_argument('--engine', choices=('demand', 'process'), default='demand')
    arguments = parser.parse_args()
    asyncio.run(exercise(arguments.source.read_text(encoding='utf-8-sig'), arguments.failure_point, arguments.engine))
