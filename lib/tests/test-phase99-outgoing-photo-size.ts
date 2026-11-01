/**
 * @fileoverview Фазовая проверка сохранения размера исходящих фото во всех обёртках генератора.
 * Проверяет Python-синтаксис и выполнение выражений метаданных без сети и Telegram.
 */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { generateMessageLoggingCode } from '../templates/middleware/middleware.renderer';
import { generateMediaFunctions } from '../templates/media-functions/media-functions.renderer';

/** Временная папка только для артефактов этой проверки. */
const directory = mkdtempSync(join(tmpdir(), 'tbb-photo-size-'));
/** Проверка Python AST и значений размера, включая отсутствие поля у ответа Telegram. */
const verification = `
import ast
import sys
from types import SimpleNamespace

sources = [open(path, encoding="utf-8").read() for path in sys.argv[1:]]
found = 0
for source in sources:
    compile(source, "generated.py", "exec")
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if not isinstance(node, ast.Assign) or not isinstance(node.value, ast.Dict):
            continue
        if not any(isinstance(target, ast.Subscript) and isinstance(target.value, ast.Name) and target.value.id == "message_data_obj" and isinstance(target.slice, ast.Constant) and target.slice.value == "photo" for target in node.targets):
            continue
        keys = [key.value for key in node.value.keys if isinstance(key, ast.Constant)]
        if "file_unique_id" not in keys and "width" not in keys:
            continue
        assert "file_size" in keys, "Исходящее фото теряет file_size"
        expression = compile(ast.Expression(node.value), "photo_metadata", "eval")
        for size in (353200, None, "missing"):
            photo = SimpleNamespace(file_id="test", file_unique_id="unique", width=1280, height=720)
            if size != "missing":
                photo.file_size = size
            result = eval(expression, {"largest_photo": photo, "largest": photo})
            assert result["file_size"] == (None if size == "missing" else size)
            assert result["file_id"] == "test"
        found += 1
assert found == 3, f"Ожидались 3 пути отправки фото, проверено {found}"
print("OK: три пути отправки фото, известный и отсутствующий размер, синтаксис Python")
`;
try {
  const middleware = join(directory, 'middleware.py');
  const media = join(directory, 'media.py');
  const checker = join(directory, 'verify.py');
  writeFileSync(middleware, generateMessageLoggingCode(true, false, 1));
  writeFileSync(media, generateMediaFunctions());
  writeFileSync(checker, verification);
  console.log(execFileSync('python', [checker, middleware, media], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }).trim());
} finally {
  rmSync(directory, { recursive: true, force: true });
}
