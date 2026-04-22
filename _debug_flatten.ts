/**
 * @fileoverview Отладка: проверяем что _flatten_dict генерирует для bot_photos
 */
import { generatePythonCode } from './lib/bot-generator.ts';
import fs from 'fs';
import { execSync } from 'child_process';

// Симулируем что вернул getUserProfilePhotos
const mockBotPhotos = {
  ok: true,
  result: {
    total_count: 1,
    photos: [
      [
        { file_id: "SMALL_FILE_ID", width: 160, height: 160 },
        { file_id: "MEDIUM_FILE_ID", width: 320, height: 320 },
        { file_id: "LARGE_FILE_ID", width: 640, height: 640 }
      ]
    ]
  }
};

// Запускаем Python чтобы проверить что генерирует _flatten_dict
const project = JSON.parse(fs.readFileSync('bots/импортированный_проект_2316_157_131/project.json', 'utf-8'));
const code = generatePythonCode(project as any, { botName: 'Test', userDatabaseEnabled: false, enableComments: false });

// Извлекаем _flatten_dict из кода
const flattenStart = code.indexOf('def _flatten_dict(');
const flattenEnd = code.indexOf('\n    _flat_keys = {}', flattenStart);
const flattenCode = code.slice(flattenStart, flattenEnd + 200);

const testScript = `
import json

${flattenCode}

bot_photos = ${JSON.stringify(mockBotPhotos)}

_flat_keys = {}
_flatten_dict("bot_photos", bot_photos, _flat_keys)

# Ищем ключи с photos
photo_keys = {k: v for k, v in _flat_keys.items() if 'photos' in k and 'file_id' in k}
print("Ключи с file_id:")
for k, v in sorted(photo_keys.items()):
    print(f"  {k!r} = {v!r}")

# Проверяем конкретный ключ
target = "bot_photos.result.photos[0][-1].file_id"
print(f"\\nКлюч {target!r}: {_flat_keys.get(target, 'НЕ НАЙДЕН')}")
target2 = "bot_photos.result.photos[0][2].file_id"
print(f"Ключ {target2!r}: {_flat_keys.get(target2, 'НЕ НАЙДЕН')}")
`;

fs.writeFileSync('_test_flatten.py', testScript, 'utf-8');
try {
  const result = execSync('python _test_flatten.py', { encoding: 'utf-8' });
  console.log(result);
} catch (e: any) {
  console.log('Ошибка:', e.stderr || e.message);
} finally {
  fs.unlinkSync('_test_flatten.py');
}
