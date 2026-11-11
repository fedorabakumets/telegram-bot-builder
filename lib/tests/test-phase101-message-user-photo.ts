/** @fileoverview Проверка закрытых аватаров Bot Manager: память, доверенный адрес и ограничения загрузки. */
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { generateMessage } from '../templates/message/message.renderer';

/** Проверяет реальный сгенерированный фрагмент с подставным транспортом без сети. */
const verification = `
import ast, asyncio, os, sys, types, logging, re
source = open(sys.argv[1], encoding='utf-8').read()
tree = ast.parse(source)
branch = next(n for n in ast.walk(tree) if isinstance(n, ast.If) and isinstance(n.test, ast.Call) and isinstance(n.test.func, ast.Attribute) and n.test.func.attr == 'fullmatch')
routine = ast.parse('async def resolve(_image_url_resolved):\\n    pass').body[0]
routine.body = [branch, ast.Return(value=ast.Name(id='_image_url_resolved', ctx=ast.Load()))]
module = ast.fix_missing_locations(ast.Module(body=[routine], type_ignores=[]))
requests = []
mode = 'ok'
class Scope:
    async def __aenter__(self): return self
    async def __aexit__(self, *args): return False
class Content:
    async def iter_chunked(self, size):
        if mode == 'timeout': raise asyncio.TimeoutError()
        if mode == 'empty': return
        yield b'avatar' if mode != 'large-stream' else b'x' * (5 * 1024 * 1024 + 1)
class Response(Scope):
    @property
    def status(self): return 302 if mode == 'redirect' else 200
    @property
    def content_length(self): return 6 * 1024 * 1024 if mode == 'large-header' else None
    content = Content()
class Session(Scope):
    def __init__(self, timeout): assert timeout == 10
    def get(self, url, **kwargs):
        requests.append((url, kwargs))
        return Response()
class Input:
    def __init__(self, data, filename): self.data, self.filename = data, filename
async def send_message(*args, **kwargs): return 'text-fallback'
sys.modules['aiohttp'] = types.SimpleNamespace(ClientSession=Session, ClientTimeout=lambda total: total)
sys.modules['aiogram.types'] = types.SimpleNamespace(BufferedInputFile=Input)
namespace = {'_avatar_re': re, 'logging': logging, '_b': types.SimpleNamespace(send_message=send_message), '_target_chat_id': 1, 'text': 'Карточка', '_thread_id': None, 'keyboard': None}
exec(compile(module, '<avatar>', 'exec'), namespace)
os.environ['API_BASE_URL'] = 'https://api.example.test'
os.environ['STUDIO_BOT_MANAGER_TOKEN'] = 'test-only-secret'
async def main():
    global mode
    path = '/api/bot/tokens/12/users/34/photo?telegram_id=56'
    result = await namespace['resolve'](path)
    assert isinstance(result, Input) and result.data == b'avatar'
    assert requests[0][0] == 'https://api.example.test' + path
    assert requests[0][1] == {'headers': {'Authorization': 'Bearer test-only-secret'}, 'allow_redirects': False}
    for address in ['https://evil.test' + path, '//evil.test' + path, path + '&url=https://evil.test', '/api/bot/tokens/0/users/34/photo?telegram_id=56']:
        before = len(requests)
        assert await namespace['resolve'](address) == address
        assert len(requests) == before
    for mode in ['redirect', 'large-header', 'large-stream', 'timeout', 'empty']:
        assert await namespace['resolve'](path) == 'text-fallback'
    mode = 'ok'
    os.environ['API_BASE_URL'] = 'https://user:password@api.example.test'
    before = len(requests)
    assert await namespace['resolve'](path) == 'text-fallback'
    assert len(requests) == before
    os.environ['API_BASE_URL'] = 'https://api.example.test'
    del os.environ['STUDIO_BOT_MANAGER_TOKEN']
    assert await namespace['resolve'](path) == 'text-fallback'
    assert len(requests) == before
asyncio.run(main())
print('OK: закрытый аватар без диска, запрет перенаправлений, лимит размера, текст при сбое')
`;

const directory = mkdtempSync(join(tmpdir(), 'tbb-user-photo-'));
try {
  const source = generateMessage({ nodeId: 'user_photo', messageText: 'Карточка', imageUrl: '{user_detail.photoDownloadUrl}', keyboardType: 'none', userDatabaseEnabled: false });
  const template = readFileSync('server/templates/bot-manager.json', 'utf8');
  assert.ok(template.includes('"imageUrl": "{user_detail.photoDownloadUrl}"'));
  assert.ok(!template.includes('"imageUrl": "{user_detail.photoUrl}"'));
  const message = join(directory, 'message.py');
  const checker = join(directory, 'verify.py');
  writeFileSync(message, source);
  writeFileSync(checker, verification);
  console.log(execFileSync('python', [checker, message], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }).trim());
} finally {
  /** Удаляется только временная директория, созданная этой проверкой. */
  rmSync(directory, { recursive: true, force: true });
}
