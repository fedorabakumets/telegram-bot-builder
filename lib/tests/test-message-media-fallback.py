"""@fileoverview Проверяет резервную доставку сгенерированного обработчика без Telegram и сети."""
import ast
import asyncio
import logging
import json
import sys
from types import SimpleNamespace


class MediaNotFoundError(Exception):
    """Подтверждённое отсутствие исходника в хранилище."""


class MediaAccessError(Exception):
    """Ошибка доступа, которую нельзя подменять отсутствующим медиа."""


class MediaStorageError(Exception):
    """Сбой хранилища, который нельзя скрывать отправкой текста."""


class MediaTimeoutError(Exception):
    """Истечение ожидания хранилища без подтверждения отсутствия файла."""


class Media:
    """Минимальный элемент альбома для выполнения сгенерированного кода."""
    def __init__(self, media, **kwargs):
        """Сохраняет медиа, остальные поля для проверки доставки не нужны."""
        self.media = media


async def check(source, kind):
    """Проверяет ошибки исходника, повтор по file_id и защиту после успешной доставки."""
    tree = ast.parse(source)
    fn = next(n for n in ast.walk(tree) if isinstance(n, ast.AsyncFunctionDef)
              and n.name == '_send_to_fallback_runtime')
    compiled = compile(ast.fix_missing_locations(ast.Module(body=[fn], type_ignores=[])), '<test>', 'exec')
    for error in [MediaNotFoundError, MediaAccessError, MediaStorageError, MediaTimeoutError, ValueError]:
        for scenario in ['resolve', 'empty', 'cached', 'delivered', 'extra']:
            calls = []
            keyboard = object()
            text = '' if scenario == 'empty' else '<b>Текст</b>'

            class Bot:
                """Регистрирует вызовы вместо отправки настоящих сообщений."""
                def __getattr__(self, method):
                    """Создаёт поддельный метод отправки с управляемой ошибкой."""
                    async def send(chat_id, *args, **kwargs):
                        """Имитирует успешную доставку, старый file_id или ошибку клавиатуры альбома."""
                        calls.append((method, chat_id, args, kwargs))
                        if scenario == 'extra' and kind == 'extra' and method == 'send_document':
                            raise error('дополнительное вложение')
                        if scenario == 'cached' and args and args[0] == 'old':
                            raise ValueError('wrong file_id')
                        if scenario == 'delivered' and kind == 'album' and method == 'send_message':
                            raise error('после успешного альбома')
                        if method == 'send_media_group':
                            return [SimpleNamespace(message_id=1)]
                        return SimpleNamespace(message_id=1, photo=[SimpleNamespace(file_id='new')],
                                               video=SimpleNamespace(file_id='new', thumbnail=None),
                                               audio=SimpleNamespace(file_id='new'), document=SimpleNamespace(file_id='new'))
                    return send

            async def resolve(value):
                """Разрешает исходник либо имитирует типизированную ошибку хранилища."""
                if scenario not in ['delivered', 'extra']:
                    raise error('исходник недоступен')
                return value

            async def save(*args):
                """Имитирует поздний сбой сохранения после уже успешной отправки."""
                if scenario != 'extra':
                    raise error('после успешной доставки')

            async def invalidate(*args):
                """Имитирует очистку устаревшего file_id без обращения к базе."""
                return None

            async def registered(*args):
                """Считает тестовый путь зарегистрированным медиа."""
                return True

            bot = Bot()
            namespace = dict(json=json, bot=bot, text=text, keyboard=keyboard, logging=logging, _parse_mode='HTML',
                             MediaNotFoundError=MediaNotFoundError, resolve_media_input=resolve,
                             is_registered_media=registered, _save_media_file_id=save,
                             _invalidate_media_file_id=invalidate, TOKEN_ID=1,
                             _media_file_id_cache={f'/uploads/main.{kind}': 'old'} if scenario == 'cached' else {},
                             _is_wrong_file_id_error=lambda err: str(err) == 'wrong file_id',
                             InputMediaPhoto=Media, InputMediaVideo=Media, InputMediaAudio=Media, InputMediaDocument=Media)
            exec(compiled, namespace)
            result = await namespace['_send_to_fallback_runtime'](123, 42)
            fallback = [call for call in calls if call[0] == 'send_message' and call[2] == (text,)]
            expected = error is MediaNotFoundError and scenario in ['resolve', 'cached']
            if scenario == 'extra' and kind == 'extra':
                assert len([call for call in calls if call[0] == 'send_photo']) == 1, calls
                assert len([call for call in calls if call[0] == 'send_document']) == 1, calls
            assert len(fallback) == int(expected), (kind, error, scenario, calls)
            if expected:
                assert result.message_id == 1
                assert fallback[0][1] == 123
                assert fallback[0][3] == dict(parse_mode='HTML', reply_markup=keyboard,
                                              message_thread_id=42, node_id='fallback_runtime')


asyncio.run(check(open(sys.argv[1], encoding='utf-8').read(), sys.argv[2]))
