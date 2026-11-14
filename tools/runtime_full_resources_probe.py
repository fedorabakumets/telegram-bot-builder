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
from collections import deque
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
import worker_runtime_model_counters
import worker_isolation
bot_env_overlay.install()
# Необязательный наблюдатель отдельного диагностического запуска не включается в приёмочную нагрузку.
SNAPSHOT_HOOK = None
# Ошибочные сценарии используют отдельный диагностический наблюдатель после настоящей готовности.
ACTIVATION_HOOK = None


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
            elif isinstance(owner, types.CoroutineType):
                label += ':' + owner.cr_code.co_qualname
                if owner.cr_frame:
                    label += ':locals=' + ','.join(key for key, value in owner.cr_frame.f_locals.items() if value is target)
            next_path = path + [label]
            if isinstance(owner, types.FrameType) or (isinstance(owner, dict) and isinstance(owner.get('__name__'), str) and not owner['__name__'].startswith('bot_')):
                found.append(next_path)
            else:
                item = (owner, next_path)
                excluded.add(id(item))
                queue.append(item)
    return {'visited': len(visited), 'paths': found}


async def exercise(source, args):
    """Запускает одинаковые серии полных активаций с ограниченными реестрами наблюдения."""
    pg_source, redis_source = service_values(args)
    background_sources = {}
    if source.lstrip().startswith('{'):
        payload = json.loads(source)
        source, background_sources = payload['main'], payload['background']
    # Разные тестовые БД получают разные Telegram-ID и Redis lease-ключи, не мешая соседним пробам.
    token_base = 18000 + (int(hashlib.sha256(args.database.encode()).hexdigest()[:8], 16) % 1000000) * 1000
    role_tokens = dict(zip(('47', '26', '5', '11'), range(token_base + 1, token_base + 5)))
    from runtime_background_fixture import seed_background, warm_background, background_snapshot
    pg_url = local_url(pg_source, args.database)
    redis_url = local_url(redis_source, '14')
    observer = await asyncpg.connect(pg_url)
    pg_capacity = int(await observer.fetchval('SHOW max_connections'))
    peak_pg_connections = 1
    # Родительские сущности минимальны; функции аналитики берутся из настоящих миграций.
    await observer.execute('CREATE TABLE IF NOT EXISTS bot_projects(id integer PRIMARY KEY); '
                           'CREATE TABLE IF NOT EXISTS bot_tokens(id integer PRIMARY KEY, project_id integer); '
                           'INSERT INTO bot_projects VALUES(987654321) ON CONFLICT DO NOTHING; '
                           f'INSERT INTO bot_tokens SELECT n,987654321 FROM generate_series({token_base + 1},{token_base + 4 + args.bots}) n ON CONFLICT DO NOTHING')
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
    await observer.execute('CREATE INDEX IF NOT EXISTS idx_bot_messages_project_token ON bot_messages(project_id,token_id)')
    await observer.execute('''CREATE TABLE IF NOT EXISTS media_files(id integer PRIMARY KEY,project_id integer,url text);
        CREATE TABLE IF NOT EXISTS media_file_tokens(media_file_id integer,token_id integer,file_id text);
        CREATE TABLE IF NOT EXISTS bot_tables(id serial PRIMARY KEY,project_id integer,name text);
        CREATE TABLE IF NOT EXISTS bot_table_columns(id serial PRIMARY KEY,table_id integer,name text,position integer);
        CREATE TABLE IF NOT EXISTS bot_table_rows(table_id integer,data jsonb,row_index integer);''')
    for migration in ('0010_create_message_activity_daily.sql', '0017_create_user_activity_daily.sql'):
        await observer.execute((ROOT / 'migrations' / migration).read_text(encoding='utf-8'))
    background_metadata = await seed_background(observer, 987654321, role_tokens) if background_sources else None
    redis_name = args.database
    original_redis_from_url = redis.from_url
    client = redis.from_url(redis_url, client_name=redis_name)
    await client.ping()
    sent = {}
    code = compile(source, '<полный-сгенерированный-сценарий>', 'exec')
    active = {}
    database_errors = []
    # Слабый словарь удаляет завершённые объекты автоматически и не хранит историю 150 тысяч ссылок.
    controls = weakref.WeakValueDictionary()
    activation_count = 0
    latencies = deque(maxlen=4096)
    started_at = time.monotonic()
    processed = 0
    current_batch = 0
    sequences = {}
    bot_contexts = {}
    checkpoints = {1, 5, 10, 25, 50, 100, args.cycles}

    class ActivationControl:
        """Позволяет наблюдать освобождение пространства активации, не удерживая его ссылкой."""
    worker = BotWorker()
    generated_directory = tempfile.TemporaryDirectory(prefix='tbb-full-generated-')
    generated_path = Path(generated_directory.name) / 'bot.py'
    generated_path.write_text(source, encoding='utf-8')
    generated_paths = {}
    for role, background_source in background_sources.items():
        path = Path(generated_directory.name) / f'background_{role}.py'
        path.write_text(background_source, encoding='utf-8')
        background_code = compile(background_source, str(path), 'exec')
        bot_code_cache._publish_cache(bot_code_cache._cache_file_path(path), path, background_code)
        generated_paths[role_tokens[role]] = path
    if args.real_bytecode_cache:
        # Готовый диск-кеш воспроизводит production marshal.load без прогрева отдельного компилятора.
        bot_code_cache._publish_cache(bot_code_cache._cache_file_path(generated_path), generated_path, code)
    def checked_proxy_method(original):
        """Оборачивает прокси реального пула только наблюдением ошибок, сохраняя SQL без изменений."""
        async def call(connection, query, *arguments, **kwargs):
            """Делегирует запрос настоящему asyncpg и сохраняет диагностическую причину сбоя."""
            try:
                expected_token = worker_isolation.current_token_id.get()
                setting_scope = query.strip() == "SELECT set_config('app.project_id', $1, false), set_config('app.token_id', $2, false)"
                # setup вызывается после RESET ALL: проверять его результат нужно после настоящего set_config.
                if setting_scope:
                    result = await original(connection, query, *arguments, **kwargs)
                if expected_token:
                    scope = await connection._con.fetchrow("SELECT current_setting('app.project_id',true) AS project, current_setting('app.token_id',true) AS token")
                    assert scope['project'] == '987654321' and scope['token'] == str(expected_token), f"SQL исполняется вне RLS-области: expected={expected_token}, actual={dict(scope)}, operation={query[:120]}"
                if setting_scope:
                    return result
                return await original(connection, query, *arguments, **kwargs)
            except Exception as error:
                if len(database_errors) < 3:
                    database_errors.append(type(error).__name__)
                if len(database_errors) <= 3:
                    print(json.dumps({'databaseError': str(error)}), flush=True)
                raise
        return call

    async def telegram(session, bot, method, timeout=None):
        """Подменяет только Telegram HTTP; модели, Dispatcher и БД остаются настоящими."""
        name = type(method).__name__
        assert worker_isolation.current_token_id.get() == bot.id, 'Telegram-вызов вышел из контекста своего бота'
        if name == 'GetMe':
            bot_contexts[bot.id] = contextvars.copy_context()
            return User(id=bot.id, is_bot=True, first_name='Проверка', username=f'probe_{bot.id}_bot')
        if name == 'GetUpdates':
            await asyncio.sleep(.2)
            return []
        if name == 'GetUserProfilePhotos':
            return UserProfilePhotos(total_count=0, photos=[])
        if name.startswith('Send'):
            assert int(method.chat_id) == 100000 + bot.id, 'Ответ отправлен в чат другого тестового бота'
            assert sent.get(bot.id, 0) + 1 == sequences.get(bot.id), 'Пропущен или повторно отправлен ответ последовательности'
            sent[bot.id] = sent.get(bot.id, 0) + 1
            return Message(message_id=sent[bot.id], date=int(time.time()),
                           chat={'id': int(method.chat_id), 'type': 'private'}, text='Проверка').as_(bot)
        return True

    async def activate(token_id):
        """Исполняет полный модуль и ждёт штатного подтверждения готовности main."""
        nonlocal activation_count
        activation_started = time.monotonic()
        ctx = BotContext(token_id, f'{token_id}:{token_id:035d}', str(generated_paths.get(token_id, generated_path)))
        ctx.project_id = 987654321
        ctx.env = {'DATABASE_URL': pg_url, 'REDIS_URL': redis_url,
                   'PROJECT_ID': '987654321', 'BOT_ENV_SOURCE': 'inline', 'LOG_LEVEL': 'WARNING',
                   'BOT_DB_POOL_IDLE_SECONDS': '60',
                   'ANALYTICS_SPOOL_DIR': os.environ['ANALYTICS_SPOOL_DIR']}
        async def ingress(dp, bot, stop):
            """Оставляет приём событий внешнему контролируемому Dispatcher-вводу."""
            ctx.module._probe_context = contextvars.copy_context()
            await stop.wait()
        async def preserve_state(module):
            """Перенос состояния не нужен минимальному stateless-маршруту этой проверки."""
        demand = types.SimpleNamespace(feed=ingress, state=types.SimpleNamespace(load_into=preserve_state, save=preserve_state))
        permanent_background = background_sources and token_id in role_tokens.values()
        task = asyncio.create_task(worker._run_bot(ctx, None if permanent_background else demand))
        try:
            deadline = time.monotonic() + 40
            while ctx.status == 'starting' and not task.done():
                if time.monotonic() > deadline:
                    raise TimeoutError('Бот не подтвердил готовность')
                await asyncio.sleep(.01)
            assert ctx.status == 'running' and ctx.module is not None, 'Настоящий воркер не запустил сценарий'
            namespace = ctx.module.__dict__
            if permanent_background:
                namespace['_probe_context'] = bot_contexts.pop(token_id)
            namespace['_probe_control'] = ActivationControl()
            namespace['_probe_control'].token_id = token_id
            activation_count += 1
            controls[activation_count] = namespace['_probe_control']
            if len(controls) > args.max_live_controls:
                raise AssertionError('Число живых активаций превысило безопасный предел наблюдения')
            latencies.append(time.monotonic() - activation_started)
            assert namespace.get('db_pool') is not None, 'Полный сценарий не подключился к PostgreSQL'
            assert namespace['_database_pool_idle_seconds']() == 60, 'Параметр простоя пула отличается от плана'
            async def verify_scope():
                """Проверяет реальный setup RLS после выдачи соединения настоящим пулом."""
                async with namespace['db_pool'].acquire() as connection:
                    scope = await connection.fetchrow("SELECT current_setting('app.project_id',true) AS project, current_setting('app.token_id',true) AS token")
                    assert scope['project'] == '987654321' and scope['token'] == str(token_id), 'Соединение потеряло область RLS своего бота'
            await asyncio.create_task(verify_scope(), context=namespace['_probe_context'])
            if background_sources and token_id in role_tokens.values():
                await asyncio.create_task(warm_background(namespace, next(role for role, key in role_tokens.items() if key == token_id)), context=namespace['_probe_context'])
        except BaseException:
            if task.done():
                task.result()
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)
            raise
        active[token_id] = (namespace, task)
        if ACTIVATION_HOOK:
            await ACTIVATION_HOOK(ctx, namespace, task)

    async def dispatch(token_id, sequence):
        """Передаёт настоящее обновление Telegram реальному Dispatcher."""
        ns, _ = active[token_id]
        update = Update.model_validate({'update_id': sequence, 'message': {'message_id': sequence,
            'date': int(time.time()), 'chat': {'id': 100000 + token_id, 'type': 'private'},
            'from': {'id': 100000 + token_id, 'is_bot': False, 'first_name': 'Проверка'},
            'text': '/start', 'entities': [{'type': 'bot_command', 'offset': 0, 'length': 6}]}})
        await asyncio.create_task(ns['dp'].feed_update(ns['bot'], update), context=ns['_probe_context'])

    async def stop(token_id):
        """Завершает main через его штатный сигнал, не применяя GC или trim."""
        ns, task = active.pop(token_id)
        ns['request_bot_stop']()
        await asyncio.wait_for(task, 30)
        bot_contexts.pop(token_id, None)

    async def await_persistence(group):
        """Ждёт настоящие записи аналитики и истории до выгрузки, сохраняя ограниченный таймаут."""
        nonlocal peak_pg_connections
        deadline = time.monotonic() + args.flush_timeout
        while True:
            complete = True
            for table in ('analytics_events_v2', 'bot_messages'):
                rows = await observer.fetch(f'SELECT token_id,count(*) AS total FROM {table} WHERE project_id=987654321 AND token_id=ANY($1::int[]) GROUP BY token_id', group)
                totals = {row['token_id']: row['total'] for row in rows}
                complete = complete and all(totals.get(key, 0) == sequences[key] * 2 for key in group)
            if complete:
                peak_pg_connections = max(peak_pg_connections, await observer.fetchval('SELECT count(*) FROM pg_stat_activity WHERE datname=current_database()'))
                assert peak_pg_connections < pg_capacity, 'Проба исчерпала вместимость локального PostgreSQL'
                return
            if time.monotonic() >= deadline:
                raise TimeoutError('Реальные записи не завершились до выгрузки')
            await asyncio.sleep(.01)

    async def snapshot(stage, settling_seconds=None):
        """Снимает RSS, реальные пулы, серверные соединения и фоновые задачи."""
        def pool_pids():
            """Читает только PID уже открытых локальных соединений без дополнительных acquire."""
            return {holder._con.get_server_pid() for ns, _ in active.values() if ns.get('db_pool')
                    for holder in ns['db_pool']._holders if holder._con is not None and not holder._con.is_closed()}
        deadline = time.monotonic() + 5
        stable = 0
        while stable < 2:
            before = pool_pids()
            server = {row['pid'] for row in await observer.fetch('SELECT pid FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid()')}
            after = pool_pids()
            stable = stable + 1 if before == after == server else 0
            if time.monotonic() > deadline:
                raise AssertionError(f'Стабильный набор PG-подключений не совпал с пулами: pool={sorted(after)}, server={sorted(server)}')
            if stable < 2:
                await asyncio.sleep(.02)
        pools = {str(key): {'size': ns['db_pool'].get_size(), 'idle': ns['db_pool'].get_idle_size()}
                 for key, (ns, _) in active.items() if ns.get('db_pool')}
        connections = 1 + len(server)
        models = prepared_models()
        redis_connections = await client.client_list()
        owned_redis = sum(entry.get('name') == redis_name for entry in redis_connections)
        frame = {'stage': stage, 'pid': os.getpid(), **memory_details(), 'pools': pools,
                 'background': {str(key): background_snapshot(ns) for key, (ns, _) in active.items() if key in role_tokens.values()} if background_sources else {},
                 'pgConnectionsIncludingObserver': connections, 'redisClients': owned_redis,
                 'peakPgConnectionsIncludingObserver': peak_pg_connections, 'postgresMaxConnections': pg_capacity,
                 'redisTotalServerClients': len(redis_connections),
                 'tasks': len(asyncio.all_tasks()), 'sent': sum(sent.values()),
                 'analyticsEvents': await observer.fetchval('SELECT count(*) FROM analytics_events_v2'),
                 'historyMessages': await observer.fetchval('SELECT count(*) FROM bot_messages'),
                 'preparedAiogramModels': sum(len(names) for names in models.values()),
                 'preparedAiogramTypes': len(models['types']), 'preparedAiogramMethods': len(models['methods']),
                 'preparedModelNames': models,
                 'runtimeModelCounters': worker_runtime_model_counters.snapshot(),
                 'liveActivationControls': len(controls),
                 'liveActivationTokenIds': [control.token_id for control in controls.values()],
                 'activationCount': activation_count, 'elapsedSeconds': time.monotonic() - started_at,
                 'cpuSeconds': time.process_time(), 'processed': processed, 'batch': current_batch,
                 'kind': 'control_idle' if stage.startswith('control_idle') else 'batch_idle' if stage.startswith('batch_idle') else 'load' if '_load_' in stage else 'observation',
                 'settlingSeconds': settling_seconds,
                 'activationLatencyRecentCount': len(latencies),
                 'activationLatencyRecentP95Seconds': sorted(latencies)[int((len(latencies) - 1) * .95)] if latencies else None,
                 'updateEventTypeCache': Update.event_type.fget.cache_info()._asdict() if hasattr(Update.event_type.fget, 'cache_info') else None,
                 'gcStats': gc.get_stats()}
        if stage.startswith('all_stopped') or stage.startswith('diagnostic_gc'):
            assert owned_redis == 1, 'После остановки остались подключения Redis этого прогона'
        if SNAPSHOT_HOOK:
            SNAPSHOT_HOOK(frame)
        print(json.dumps(frame), flush=True)
        if frame['rssKiB'] > args.max_rss_mib * 1024:
            raise MemoryError('RSS превысил заранее заданный защитный предел; это не плато')

    async def sample_idle(prefix, duration):
        """Сохраняет одинаковые сырые контрольные точки простоя без вмешательства в GC."""
        deadline = time.monotonic() + duration
        idle_started = time.monotonic()
        index = 0
        while True:
            await snapshot(f'{prefix}_{index}', time.monotonic() - idle_started)
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                return
            await asyncio.sleep(min(args.sample_interval, remaining))
            index += 1

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
            print(json.dumps({'platform': platform.platform(), 'python': platform.python_version(), 'pid': os.getpid(),
                              'gcThreshold': gc.get_threshold(),
                              'allocatorEnvironment': {name: os.environ.get(name) for name in ('PYTHONMALLOC', 'PYTHONTRACEMALLOC', 'MALLOC_ARENA_MAX', 'PYTHONHASHSEED', 'LD_PRELOAD')},
                              'gcEnabled': gc.isenabled(), 'tracing': tracemalloc.is_tracing(),
                              'cycles': args.cycles, 'batches': args.batches, 'warmupCycles': args.warmup_cycles,
                              'permanentBots': 4, 'temporaryBots': args.bots,
                              'generatedSha256': hashlib.sha256(source.encode()).hexdigest(),
                              'libraries': {name: version(name) for name in ('aiogram', 'pydantic', 'asyncpg', 'redis')},
                              'uncachedUpdateEventType': args.uncached_update_event_type,
                              'realBytecodeCache': args.real_bytecode_cache}), flush=True)
            print(json.dumps({'runtimeEvidence': worker_runtime_model_counters.snapshot(),
                              'backgroundGeneratedSha256': {role: hashlib.sha256(value.encode()).hexdigest() for role, value in background_sources.items()},
                              'runtimeFilesSha256': {name: hashlib.sha256((ROOT / 'server/python' / name).read_bytes()).hexdigest() for name in ('worker.py', 'aiogram_update_cache.py', 'lazy_aiogram.py', 'worker_runtime_model_counters.py', 'worker_namespace_counters.py', 'worker_runtime_counters.py')},
                              'probeFilesSha256': {name: hashlib.sha256((ROOT / 'tools' / name).read_bytes()).hexdigest() for name in ('runtime_full_resources_probe.py', 'runtime_full_resources_probe.ts', 'runtime_background_fixture.py', 'runtime_background_fixture.ts')},
                              'concurrency': args.concurrency, 'poolIdleSeconds': 60, 'postgresMaxConnections': pg_capacity}), flush=True)
            print(json.dumps({'testTokenBase': token_base, 'permanentRoleTokens': role_tokens}), flush=True)
            if background_metadata:
                print(json.dumps({'backgroundFixture': background_metadata}), flush=True)
            await snapshot('baseline')
            for key in role_tokens.values():
                await activate(key)
            await snapshot('four_permanent')
            if args.baseline_idle:
                await asyncio.sleep(args.baseline_idle)
                await snapshot('four_permanent_idle_baseline')
            temporary_ids = range(token_base + 5, token_base + 5 + args.bots)
            for batch in range(args.batches + bool(args.warmup_cycles)):
                warming = bool(args.warmup_cycles) and batch == 0
                cycles = args.warmup_cycles if warming else args.cycles
                label = 'warmup' if warming else f'batch_{batch + (not args.warmup_cycles)}'
                current_batch = 0 if warming else batch + (not args.warmup_cycles)
                for iteration in range(cycles):
                    suffix = '' if args.batches == 1 and not args.warmup_cycles else label + '_'
                    if args.max_seconds and time.monotonic() - started_at > args.max_seconds:
                        raise TimeoutError('Превышено заданное время полного прогона')
                    for offset in range(0, args.bots, args.concurrency):
                        group = list(temporary_ids)[offset:offset + args.concurrency]
                        for key in group:
                            await activate(key)
                            sequences[key] = sequences.get(key, 0) + 1
                            await dispatch(key, sequences[key])
                        # Сон разрешён после завершения записей, а не сразу после первого Telegram-ответа.
                        await asyncio.sleep(args.idle)
                        await await_persistence(group)
                        if offset + args.concurrency >= args.bots and (iteration + 1 in checkpoints or iteration + 1 == cycles):
                            await snapshot(f'{suffix}active_{iteration + 1}')
                        for key in group:
                            await stop(key)
                        if not warming:
                            processed += len(group)
                    await asyncio.sleep(args.idle)
                    if iteration + 1 in checkpoints or iteration + 1 == cycles:
                        await snapshot(f'{suffix}idle_{iteration + 1}')
                    if args.batches > 1:
                        await snapshot(f'{label}_load_{iteration + 1}')
                if warming and args.control_idle:
                    await sample_idle('control_idle', args.control_idle)
                if args.batch_idle and not warming:
                    await sample_idle(f'batch_idle_{current_batch}', args.batch_idle)
            expected_cycles = args.cycles * args.batches + args.warmup_cycles
            assert all(sent.get(key, 0) == expected_cycles for key in temporary_ids), 'Число ответов команды отличается от числа входов'
            assert not database_errors, 'При записи в PostgreSQL возникли ошибки'
            for table in ('analytics_events_v2', 'bot_messages'):
                rows = await observer.fetch(f'SELECT token_id,count(*) AS total FROM {table} GROUP BY token_id')
                totals = {row['token_id']: row['total'] for row in rows}
                assert all(totals.get(key, 0) == expected_cycles * 2 for key in temporary_ids), f'Нарушена полнота или появились дубли: {table}'
            print(json.dumps({'deliveryVerified': True, 'perBotProcessed': sequences,
                              'expectedPerBot': expected_cycles, 'batchCount': args.batches}), flush=True)
        finally:
            primary_failure = sys.exc_info()[0]
            for key in list(active):
                await stop(key)
            await snapshot('all_stopped')
            assert len(asyncio.all_tasks()) == 1, 'После остановки остались дочерние задачи'
            if args.final_collect:
                gc.collect()
                await asyncio.sleep(0)
                await snapshot('diagnostic_gc_after_all_stopped')
                if args.diagnose_retention:
                    if controls:
                        print(json.dumps({'retention': retention_paths(next(iter(controls.values())))}), flush=True)
                    gc.collect()
                    await asyncio.sleep(0)
                    await snapshot('diagnostic_gc_second_pass')
                if primary_failure:
                    # Текущий traceback законно удерживает свои кадры до выхода из finally; исходную ошибку не маскируем.
                    print(json.dumps({'retentionAssertionSkippedForPrimaryFailure': primary_failure.__name__}), flush=True)
                else:
                    assert not controls, 'Активации удерживаются после отдельного GC'
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


def parse_options(argv=None):
    """Возвращает единый набор параметров для CLI и отдельных диагностических запускателей."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--database', required=True)
    parser.add_argument('--cycles', type=int, default=3)
    parser.add_argument('--bots', type=int, default=2)
    parser.add_argument('--batches', type=int, default=1)
    parser.add_argument('--warmup-cycles', type=int, default=0)
    parser.add_argument('--baseline-idle', type=float, default=0)
    parser.add_argument('--batch-idle', type=float, default=0)
    parser.add_argument('--max-seconds', type=float, default=0)
    parser.add_argument('--control-idle', type=float, default=0)
    parser.add_argument('--sample-interval', type=float, default=5)
    parser.add_argument('--concurrency', type=int, default=2)
    parser.add_argument('--background-fixture', action='store_true')
    parser.add_argument('--flush-timeout', type=float, default=30)
    parser.add_argument('--max-live-controls', type=int, default=2048)
    parser.add_argument('--max-rss-mib', type=float, default=2048)
    parser.add_argument('--idle', type=float, default=1)
    parser.add_argument('--existing-database', action='store_true')
    parser.add_argument('--allow-dotenv', action='store_true')
    parser.add_argument('--final-collect', action='store_true')
    parser.add_argument('--diagnose-retention', action='store_true')
    parser.add_argument('--uncached-update-event-type', action='store_true')
    parser.add_argument('--real-bytecode-cache', action='store_true')
    options = parser.parse_args(argv)
    if (not re.fullmatch(r'tbb_full_probe_[a-z0-9_]{1,40}', options.database)
            or options.cycles < 1 or options.bots < 1 or options.batches < 1 or options.concurrency < 1 or options.sample_interval <= 0
            or min(options.idle, options.warmup_cycles, options.baseline_idle, options.batch_idle, options.max_seconds, options.control_idle) < 0):
        parser.error('Нужна изолированная база tbb_full_probe_* и положительные параметры')
    return options


if __name__ == '__main__':
    options = parse_options()
    logging.getLogger().setLevel(logging.ERROR)
    with tempfile.TemporaryDirectory(prefix='tbb-full-probe-') as spool:
        os.environ['ANALYTICS_SPOOL_DIR'] = spool
        asyncio.run(isolated_run(sys.stdin.read(), options))
