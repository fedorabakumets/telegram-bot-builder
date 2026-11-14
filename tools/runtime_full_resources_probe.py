"""@fileoverview Проверяет полный сгенерированный runtime с локальными PostgreSQL и Redis."""
import argparse
import asyncio
import json
import logging
import gc
import re
import os
from pathlib import Path
import sys
import time
import tempfile
import contextvars
import weakref
import types
import platform
import tracemalloc
import hashlib
from importlib.metadata import version
from contextlib import ExitStack
from urllib.parse import urlsplit, urlunsplit
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'server/python'))
import lazy_aiogram
lazy_aiogram.enable()
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.types import Message, Update, User, UserProfilePhotos
from dotenv import dotenv_values
from process_memory import total_rss_kb
import asyncpg
import redis.asyncio as redis
from worker import BotContext, BotWorker
import bot_env_overlay
import bot_code_cache
bot_env_overlay.install()


def prepared_models():
    """Считает уникальные уже подготовленные модели aiogram без их принудительной сборки."""
    groups = {'types': {}, 'methods': {}}
    for name, module in list(sys.modules.items()):
        if not name.startswith('aiogram.'):
            continue
        for value in list(vars(module).values()):
            if not isinstance(value, type) or not getattr(value, '__pydantic_complete__', False):
                continue
            group = 'types' if value.__module__.startswith('aiogram.types.') else 'methods' if value.__module__.startswith('aiogram.methods.') else None
            if group:
                groups[group][id(value)] = value.__name__
    return {key: sorted(values.values()) for key, values in groups.items()}


def local_url(value, database):
    """Проверяет локальность адреса и заменяет только имя изолированной базы."""
    parsed = urlsplit(value)
    if parsed.hostname not in {'localhost', '127.0.0.1', '::1'}:
        raise ValueError('Разрешены только локальные сервисы')
    return urlunsplit((parsed.scheme, parsed.netloc, '/' + database, '', ''))


def service_values(args):
    """Использует явные локальные адреса; чтение .env допускается только отдельным флагом."""
    fallback = dotenv_values(ROOT / '.env') if args.allow_dotenv else {}
    pg = os.environ.get('PROBE_DATABASE_URL') or fallback.get('DATABASE_URL')
    redis_url = os.environ.get('PROBE_REDIS_URL') or fallback.get('REDIS_URL')
    if not pg or not redis_url:
        raise ValueError('Задайте PROBE_DATABASE_URL и PROBE_REDIS_URL для локальных сервисов')
    return pg, redis_url


def memory_details():
    """Читает текущую резидентную память и пропорциональную долю страниц Linux."""
    result = {'rssKiB': total_rss_kb(), 'pssKiB': None, 'anonymousKiB': None}
    rollup = Path('/proc/self/smaps_rollup')
    if rollup.is_file():
        rows = dict(line.split(':', 1) for line in rollup.read_text().splitlines() if ':' in line)
        for key, target in (('Pss', 'pssKiB'), ('Anonymous', 'anonymousKiB')):
            result[target] = int(rows[key].split()[0])
    return result


def retention_paths(control):
    """Ищет ограниченные обратные пути только локального контрольного объекта после GC."""
    import inspect
    queue = [(control, ['control'])]
    excluded = {id(queue), id(inspect.currentframe().f_locals)}
    visited = set()
    found = []
    while queue and len(visited) < 2500 and len(found) < 5:
        entry = queue.pop(0)
        excluded.add(id(entry))
        target, path = entry
        if id(target) in visited or len(path) > 14:
            continue
        visited.add(id(target))
        references = gc.get_referrers(target)
        excluded.add(id(references))
        for owner in references:
            if id(owner) in excluded or id(owner) in visited:
                continue
            label = type(owner).__name__
            if isinstance(owner, dict):
                label += ':' + str(owner.get('__name__', list(owner.keys())[:3]))
            elif isinstance(owner, types.FunctionType):
                label += ':' + owner.__qualname__
            elif isinstance(owner, types.FrameType):
                label += ':' + owner.f_code.co_name
            next_path = path + [label]
            if isinstance(owner, types.FrameType) or (isinstance(owner, dict) and isinstance(owner.get('__name__'), str) and not owner['__name__'].startswith('bot_')):
                found.append(next_path)
            else:
                item = (owner, next_path)
                excluded.add(id(item))
                queue.append(item)
    return {'visited': len(visited), 'paths': found}


async def exercise(source, args):
    """Запускает четыре постоянных и две повторно пробуждаемые полные активации."""
    pg_source, redis_source = service_values(args)
    pg_url = local_url(pg_source, args.database)
    redis_url = local_url(redis_source, '14')
    observer = await asyncpg.connect(pg_url)
    # Родительские сущности минимальны; функции аналитики берутся из настоящих миграций.
    await observer.execute('CREATE TABLE IF NOT EXISTS bot_projects(id integer PRIMARY KEY); '
                           'CREATE TABLE IF NOT EXISTS bot_tokens(id integer PRIMARY KEY, project_id integer); '
                           'INSERT INTO bot_projects VALUES(987654321) ON CONFLICT DO NOTHING; '
                           'INSERT INTO bot_tokens SELECT n,987654321 FROM generate_series(18001,18006) n ON CONFLICT DO NOTHING')
    for migration in ('0024_analytics_v2.sql', '0025_analytics_v2_record.sql', '0027_analytics_acquisition.sql'):
        await observer.execute((ROOT / 'migrations' / migration).read_text(encoding='utf-8'))
    # Колонки панели дополняют устаревшую standalone-схему генератора без копирования данных приложения.
    await observer.execute('''CREATE TABLE IF NOT EXISTS bot_users (
        user_id bigint, project_id integer, token_id integer, username text, first_name text,
        last_name text, avatar_url text, registered_at timestamp DEFAULT now(),
        last_interaction timestamp DEFAULT now(), interaction_count integer DEFAULT 0,
        user_data jsonb DEFAULT '{}', is_active integer DEFAULT 1,
        PRIMARY KEY(user_id,project_id,token_id));
        ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS is_bot integer DEFAULT 0;
        ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS is_blocked integer DEFAULT 0;
        ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS is_deleted integer DEFAULT 0;
        ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS is_premium integer DEFAULT 0;
        ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS language_code text;
        ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS deep_link_param text;
        ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS referrer_id text;
        CREATE TABLE IF NOT EXISTS bot_messages (
        id serial PRIMARY KEY,project_id integer,token_id integer,user_id text,message_type text,
        message_text text,message_data jsonb,node_id text,telegram_message_id integer,
        chat_type text DEFAULT 'private',chat_id text,created_at timestamptz DEFAULT now());
        ALTER TABLE bot_messages ADD COLUMN IF NOT EXISTS telegram_message_id integer;
        ALTER TABLE bot_messages ADD COLUMN IF NOT EXISTS chat_type text DEFAULT 'private';
        ALTER TABLE bot_messages ADD COLUMN IF NOT EXISTS chat_id text;''')
    await observer.execute('ALTER TABLE bot_messages ALTER COLUMN user_id TYPE text USING user_id::text')
    await observer.execute('''CREATE TABLE IF NOT EXISTS media_files(id integer PRIMARY KEY,project_id integer,url text);
        CREATE TABLE IF NOT EXISTS media_file_tokens(media_file_id integer,token_id integer,file_id text);
        CREATE TABLE IF NOT EXISTS bot_tables(id serial PRIMARY KEY,project_id integer,name text);
        CREATE TABLE IF NOT EXISTS bot_table_columns(id serial PRIMARY KEY,table_id integer,name text,position integer);
        CREATE TABLE IF NOT EXISTS bot_table_rows(table_id integer,data jsonb,row_index integer);''')
    for migration in ('0010_create_message_activity_daily.sql', '0017_create_user_activity_daily.sql'):
        await observer.execute((ROOT / 'migrations' / migration).read_text(encoding='utf-8'))
    redis_name = args.database
    original_redis_from_url = redis.from_url
    client = redis.from_url(redis_url, client_name=redis_name)
    await client.ping()
    sent = {}
    code = compile(source, '<полный-сгенерированный-сценарий>', 'exec')
    active = {}
    database_errors = []
    controls = []
    checkpoints = {1, 5, 10, 25, 50, 100, args.cycles}

    class ActivationControl:
        """Позволяет наблюдать освобождение пространства активации, не удерживая его ссылкой."""
    worker = BotWorker()
    generated_directory = tempfile.TemporaryDirectory(prefix='tbb-full-generated-')
    generated_path = Path(generated_directory.name) / 'bot.py'
    generated_path.write_text(source, encoding='utf-8')
    if args.real_bytecode_cache:
        # Готовый диск-кеш воспроизводит production marshal.load без прогрева отдельного компилятора.
        bot_code_cache._publish_cache(bot_code_cache._cache_file_path(generated_path), generated_path, code)
    def checked_proxy_method(original):
        """Оборачивает прокси реального пула только наблюдением ошибок, сохраняя SQL без изменений."""
        async def call(connection, query, *arguments, **kwargs):
            """Делегирует запрос настоящему asyncpg и сохраняет диагностическую причину сбоя."""
            try:
                return await original(connection, query, *arguments, **kwargs)
            except Exception as error:
                database_errors.append(type(error).__name__)
                if len(database_errors) <= 3:
                    print(json.dumps({'databaseError': str(error)}), flush=True)
                raise
        return call

    async def telegram(session, bot, method, timeout=None):
        """Подменяет только Telegram HTTP; модели, Dispatcher и БД остаются настоящими."""
        name = type(method).__name__
        if name == 'GetMe':
            return User(id=bot.id, is_bot=True, first_name='Проверка', username=f'probe_{bot.id}_bot')
        if name == 'GetUserProfilePhotos':
            return UserProfilePhotos(total_count=0, photos=[])
        if name.startswith('Send'):
            sent[bot.id] = sent.get(bot.id, 0) + 1
            return Message(message_id=sent[bot.id], date=int(time.time()),
                           chat={'id': int(method.chat_id), 'type': 'private'}, text='Проверка').as_(bot)
        return True

    async def activate(token_id):
        """Исполняет полный модуль и ждёт штатного подтверждения готовности main."""
        ctx = BotContext(token_id, f'{token_id}:' + 'a' * 35, str(generated_path))
        ctx.env = {'DATABASE_URL': pg_url, 'REDIS_URL': redis_url,
                   'PROJECT_ID': '987654321', 'BOT_ENV_SOURCE': 'inline', 'LOG_LEVEL': 'WARNING',
                   'ANALYTICS_SPOOL_DIR': os.environ['ANALYTICS_SPOOL_DIR']}
        async def ingress(dp, bot, stop):
            """Оставляет приём событий внешнему контролируемому Dispatcher-вводу."""
            ctx.module._probe_context = contextvars.copy_context()
            await stop.wait()
        async def preserve_state(module):
            """Перенос состояния не нужен минимальному stateless-маршруту этой проверки."""
        demand = types.SimpleNamespace(feed=ingress, state=types.SimpleNamespace(load_into=preserve_state, save=preserve_state))
        task = asyncio.create_task(worker._run_bot(ctx, demand))
        try:
            deadline = time.monotonic() + 40
            while ctx.status == 'starting' and not task.done():
                if time.monotonic() > deadline:
                    raise TimeoutError('Бот не подтвердил готовность')
                await asyncio.sleep(.01)
            assert ctx.status == 'running' and ctx.module is not None, 'Настоящий воркер не запустил сценарий'
            namespace = ctx.module.__dict__
            namespace['_probe_control'] = ActivationControl()
            namespace['_probe_control'].token_id = token_id
            controls.append(weakref.ref(namespace['_probe_control']))
            assert namespace.get('db_pool') is not None, 'Полный сценарий не подключился к PostgreSQL'
        except BaseException:
            if task.done():
                task.result()
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)
            raise
        active[token_id] = (namespace, task)

    async def dispatch(token_id, sequence):
        """Передаёт настоящее обновление Telegram реальному Dispatcher."""
        ns, _ = active[token_id]
        update = Update.model_validate({'update_id': sequence, 'message': {'message_id': sequence,
            'date': int(time.time()), 'chat': {'id': 10001, 'type': 'private'},
            'from': {'id': 10001, 'is_bot': False, 'first_name': 'Проверка'},
            'text': '/start', 'entities': [{'type': 'bot_command', 'offset': 0, 'length': 6}]}})
        await asyncio.create_task(ns['dp'].feed_update(ns['bot'], update), context=ns['_probe_context'])

    async def stop(token_id):
        """Завершает main через его штатный сигнал, не применяя GC или trim."""
        ns, task = active.pop(token_id)
        ns['request_bot_stop']()
        await asyncio.wait_for(task, 30)

    async def snapshot(stage):
        """Снимает RSS, реальные пулы, серверные соединения и фоновые задачи."""
        pools = {str(key): {'size': ns['db_pool'].get_size(), 'idle': ns['db_pool'].get_idle_size()}
                 for key, (ns, _) in active.items() if ns.get('db_pool')}
        connections = await observer.fetchval('SELECT count(*) FROM pg_stat_activity WHERE datname=current_database()')
        models = prepared_models()
        redis_connections = await client.client_list()
        owned_redis = sum(entry.get('name') == redis_name for entry in redis_connections)
        frame = {'stage': stage, **memory_details(), 'pools': pools,
                 'pgConnectionsIncludingObserver': connections, 'redisClients': owned_redis,
                 'redisTotalServerClients': len(redis_connections),
                 'tasks': len(asyncio.all_tasks()), 'sent': sum(sent.values()),
                 'analyticsEvents': await observer.fetchval('SELECT count(*) FROM analytics_events_v2'),
                 'historyMessages': await observer.fetchval('SELECT count(*) FROM bot_messages'),
                 'preparedAiogramModels': sum(len(names) for names in models.values()),
                 'preparedAiogramTypes': len(models['types']), 'preparedAiogramMethods': len(models['methods']),
                 'preparedModelNames': models,
                 'liveActivationControls': sum(reference() is not None for reference in controls),
                 'liveActivationTokenIds': [reference().token_id for reference in controls if reference() is not None],
                 'updateEventTypeCache': Update.event_type.fget.cache_info()._asdict() if hasattr(Update.event_type.fget, 'cache_info') else None,
                 'gcStats': gc.get_stats()}
        assert connections == 1 + sum(pool['size'] for pool in pools.values()), 'Серверные подключения не совпали с пулами'
        if stage.startswith('all_stopped') or stage.startswith('diagnostic_gc'):
            assert owned_redis == 1, 'После остановки остались подключения Redis этого прогона'
        print(json.dumps(frame), flush=True)

    with ExitStack() as patches:
        patches.enter_context(patch.object(AiohttpSession, 'make_request', telegram))
        # Точка входа worker._main отключает сигналы ботов; прямой вызов _run_bot сохраняет это условие.
        patches.enter_context(patch('signal.signal', new=lambda *arguments: None))
        def named_redis_from_url(url, **kwargs):
            """Помечает реальные соединения именем прогона, отделяя соседние локальные тесты."""
            kwargs['client_name'] = redis_name
            return original_redis_from_url(url, **kwargs)
        patches.enter_context(patch.object(redis, 'from_url', named_redis_from_url))
        if args.uncached_update_event_type:
            original = Update.event_type.fget
            patches.enter_context(patch.object(Update, 'event_type', property(getattr(original, '__wrapped__', original))))
        if not args.real_bytecode_cache:
            patches.enter_context(patch('worker.bot_code_cache.load_bot_code', new=lambda *arguments: code))
        patches.enter_context(patch('worker.emit_log', new=lambda *arguments: None))
        patches.enter_context(patch('worker.emit_system', new=lambda *arguments: None))
        for method in ('fetch', 'fetchrow', 'fetchval', 'execute'):
            original = getattr(asyncpg.pool.PoolConnectionProxy, method)
            patches.enter_context(patch.object(asyncpg.pool.PoolConnectionProxy, method, checked_proxy_method(original)))
        try:
            print(json.dumps({'platform': platform.platform(), 'python': platform.python_version(),
                              'gcEnabled': gc.isenabled(), 'tracing': tracemalloc.is_tracing(),
                              'cycles': args.cycles, 'permanentBots': 4, 'temporaryBots': 2,
                              'generatedSha256': hashlib.sha256(source.encode()).hexdigest(),
                              'libraries': {name: version(name) for name in ('aiogram', 'pydantic', 'asyncpg', 'redis')},
                              'uncachedUpdateEventType': args.uncached_update_event_type,
                              'realBytecodeCache': args.real_bytecode_cache}), flush=True)
            await snapshot('baseline')
            for key in range(18001, 18005):
                await activate(key)
            await snapshot('four_permanent')
            for iteration in range(args.cycles):
                for key in (18005, 18006):
                    await activate(key)
                    await dispatch(key, iteration + 1)
                # Сон разрешён после завершения записей, а не сразу после первого Telegram-ответа.
                await asyncio.sleep(args.idle)
                if iteration + 1 in checkpoints:
                    await snapshot(f'active_{iteration + 1}')
                for key in (18005, 18006):
                    await stop(key)
                await asyncio.sleep(args.idle)
                if iteration + 1 in checkpoints:
                    await snapshot(f'idle_{iteration + 1}')
            assert all(sent.get(key, 0) >= args.cycles for key in (18005, 18006)), 'Ответы команды не получены'
            assert not database_errors, 'При записи в PostgreSQL возникли ошибки'
            assert await observer.fetchval('SELECT count(*) FROM analytics_events_v2') >= args.cycles * 4, 'События аналитики потеряны'
            assert await observer.fetchval('SELECT count(*) FROM bot_messages') >= args.cycles * 4, 'История сообщений неполна'
        finally:
            for key in list(active):
                await stop(key)
            await snapshot('all_stopped')
            assert len(asyncio.all_tasks()) == 1, 'После остановки остались дочерние задачи'
            if args.final_collect:
                gc.collect()
                await asyncio.sleep(0)
                await snapshot('diagnostic_gc_after_all_stopped')
                if args.diagnose_retention:
                    for reference in controls:
                        if reference() is not None:
                            print(json.dumps({'retention': retention_paths(reference())}), flush=True)
                            break
                    gc.collect()
                    await asyncio.sleep(0)
                    await snapshot('diagnostic_gc_second_pass')
                assert all(reference() is None for reference in controls), 'Активации удерживаются после отдельного GC'
            await observer.close()
            await client.aclose()
            generated_directory.cleanup()


async def isolated_run(source, args):
    """Создаёт уникальную тестовую БД и гарантирует удаление только этой базы после проверки."""
    pg_source, _ = service_values(args)
    admin_url = local_url(pg_source, 'postgres')
    admin = await asyncpg.connect(admin_url)
    exists = await admin.fetchval('SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname=$1)', args.database)
    if exists:
        if not args.existing_database:
            await admin.close()
            raise ValueError('База уже существует; требуется явный --existing-database для переданной тестовой БД')
    else:
        await admin.execute(f'CREATE DATABASE "{args.database}"')
    try:
        await exercise(source, args)
    finally:
        await admin.execute(f'DROP DATABASE "{args.database}" WITH (FORCE)')
        await admin.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--database', required=True)
    parser.add_argument('--cycles', type=int, default=3)
    parser.add_argument('--idle', type=float, default=1)
    parser.add_argument('--existing-database', action='store_true')
    parser.add_argument('--allow-dotenv', action='store_true')
    parser.add_argument('--final-collect', action='store_true')
    parser.add_argument('--diagnose-retention', action='store_true')
    parser.add_argument('--uncached-update-event-type', action='store_true')
    parser.add_argument('--real-bytecode-cache', action='store_true')
    options = parser.parse_args()
    if not re.fullmatch(r'tbb_full_probe_[a-z0-9_]{1,40}', options.database) or options.cycles < 1 or options.idle < 0:
        parser.error('Нужна изолированная база tbb_full_probe_* и положительные параметры')
    logging.getLogger().setLevel(logging.ERROR)
    with tempfile.TemporaryDirectory(prefix='tbb-full-probe-') as spool:
        os.environ['ANALYTICS_SPOOL_DIR'] = spool
        asyncio.run(isolated_run(sys.stdin.read(), options))
