/** @fileoverview Проверка передачи ID блока в исходящие сообщения и сохранения фото и альбомов без сети. */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { generateMessage } from '../templates/message/message.renderer';
import { generateMessageLoggingCode } from '../templates/middleware/middleware.renderer';

/** Проверяет AST всех сгенерированных отправок и выполняет реальные обёртки на подставном Telegram. */
const verification = `
import ast, asyncio, sys, logging
from types import SimpleNamespace as NS
middleware = open(sys.argv[1], encoding='utf-8').read()
for index, path in enumerate(sys.argv[2:]):
    source = open(path, encoding='utf-8').read()
    tree = ast.parse(source)
    calls = [n for n in ast.walk(tree) if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and isinstance(n.func.value, ast.Name) and n.func.value.id == '_b' and n.func.attr.startswith('send_')]
    assert calls, path
    for call in calls:
        origin = next((k.value for k in call.keywords if k.arg == 'node_id'), None)
        if index % 2 == 0:
            assert isinstance(origin, ast.Constant) and origin.value == 'origin_test', (path, call.lineno)
        else:
            assert origin is None, 'При выключенной БД служебный аргумент не должен попадать в Telegram'
saved = []
namespace = {'logging': logging, '_fire_save_message': lambda **kw: saved.append(kw)}
tree = ast.parse(middleware)
for node in tree.body:
    if isinstance(node, ast.FunctionDef) and node.name in ('_wrap_bot_send_photo', '_wrap_bot_send_media_group'):
        exec(compile(ast.Module(body=[node], type_ignores=[]), 'wrappers', 'exec'), namespace)
photo = NS(file_id='photo_id', file_unique_id='unique', width=100, height=100, file_size=123)
async def main():
    async def send_photo(*args, **kwargs):
        assert 'node_id' not in kwargs
        return NS(message_id=1, photo=[photo], chat=NS(type='private'))
    async def send_media_group(*args, **kwargs):
        assert 'node_id' not in kwargs
        return [NS(message_id=i, photo=[photo], caption='Фото') for i in (2, 3)]
    bot = NS(send_photo=send_photo, send_media_group=send_media_group)
    namespace['_wrap_bot_send_photo'](bot)
    namespace['_wrap_bot_send_media_group'](bot)
    await bot.send_photo(1, 'photo_id', node_id='origin_test')
    await bot.send_media_group(1, [], node_id='origin_test')
    assert len(saved) == 3
    assert all(row['node_id'] == 'origin_test' for row in saved)
    assert all(row['message_data']['photo']['file_id'] == 'photo_id' for row in saved)
asyncio.run(main())
print('OK: ID блока во всех отправках, совместимость без БД, сохранение фото и каждого элемента альбома')
`;
const directory = mkdtempSync(join(tmpdir(), 'tbb-node-origin-'));
try {
  const paths: string[] = [];
  const variants = [{}, { imageUrl: '/uploads/test.jpg' }, { imageUrl: 'https://example.org/test.jpg' },
    { videoUrl: '/uploads/test.mp4' }, { audioUrl: '/uploads/test.mp3' }, { documentUrl: '/uploads/test.pdf' },
    { attachedMedia: ['/uploads/test.jpg', JSON.stringify({ __type: 'file_id', mediaType: 'photo', fileIdsByToken: { '1': 'extra_id' } })] },
    { attachedMedia: ['/uploads/a.jpg', '/uploads/b.jpg'] },
    { attachedMedia: [JSON.stringify({ __type: 'file_id', mediaType: 'photo', fileIdsByToken: { '1': 'photo_id' } })] }];
  for (const variant of variants) for (const enabled of [true, false]) {
    const path = join(directory, `message-${paths.length}.py`);
    writeFileSync(path, generateMessage({ nodeId: 'origin_test', messageText: 'Тест', keyboardType: 'none', userDatabaseEnabled: enabled, ...variant }));
    paths.push(path);
  }
  const middleware = join(directory, 'middleware.py');
  const checker = join(directory, 'verify.py');
  writeFileSync(middleware, generateMessageLoggingCode(true, false, 9));
  writeFileSync(checker, verification);
  console.log(execFileSync('python', [checker, middleware, ...paths], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }).trim());
} finally { rmSync(directory, { recursive: true, force: true }); }
