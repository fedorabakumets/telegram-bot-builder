/**
 * @fileoverview Регрессионные тесты для обработки медиа URL
 *
 * Проверяет что внешние URL содержащие /uploads/ в пути
 * не обрабатываются как локальные файлы.
 *
 * Блок A: Регрессия — внешние URL с /uploads/ в пути
 * Блок B: Локальные /uploads/ пути работают корректно
 * Блок C: Разные типы медиа
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Создаёт минимальный проект с заданными узлами */
function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{
      id: 'sheet1', name: 'Test', nodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

/**
 * Генерирует Python-код для проекта
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 * @returns Сгенерированный Python-код
 */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `PhaseMediaURL_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

/**
 * Проверяет синтаксис Python-кода
 * @param code - Python-код для проверки
 * @param label - Метка для временного файла
 * @returns Результат проверки
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_murl_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
    return { ok: true };
  } catch (e: any) {
    try { fs.unlinkSync(tmp); } catch {}
    return { ok: false, error: e.stderr?.toString() ?? String(e) };
  }
}

type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

/**
 * Запускает тест и записывает результат
 * @param id - Идентификатор теста
 * @param name - Название теста
 * @param fn - Функция теста
 */
function test(id: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ id, name, passed: true, note: 'OK' });
    console.log(`  ✅ ${id}. ${name}`);
  } catch (e: any) {
    results.push({ id, name, passed: false, note: e.message });
    console.log(`  ❌ ${id}. ${name}\n     → ${e.message}`);
  }
}

/**
 * Проверяет условие, бросает ошибку если не выполнено
 * @param cond - Условие
 * @param msg - Сообщение об ошибке
 */
function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

/**
 * Проверяет синтаксис Python, бросает ошибку при неверном синтаксисе
 * @param code - Python-код
 * @param label - Метка
 */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

// ─── Вспомогательные функции ─────────────────────────────────────────────────

/**
 * Создаёт message-узел с внешним URL изображения содержащим /uploads/ в пути
 * @param id - ID узла
 * @param imageUrl - URL изображения
 * @returns Объект узла типа message
 */
function makeMessageWithExternalImageUrl(id: string, imageUrl: string) {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: { messageText: 'Привет!', imageUrl, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

/**
 * Создаёт message-узел с локальным /uploads/ путём
 * @param id - ID узла
 * @param imageUrl - Локальный путь к изображению
 * @returns Объект узла типа message
 */
function makeMessageWithLocalUpload(id: string, imageUrl: string) {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: { messageText: 'Привет!', imageUrl, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Регрессия — Медиа URL с /uploads/ в пути                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Регрессия — внешние URL с /uploads/ в пути
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Регрессия — внешние URL с /uploads/ в пути ────────────');

test('A01', 'внешний URL с /uploads/ → НЕ вызывает get_upload_file_path', () => {
  const externalUrl = 'https://s2.stc.all.kpcdn.net/russia/wp-content/uploads/2019/10/photo.jpg';
  const p = makeCleanProject([makeMessageWithExternalImageUrl('msg1', externalUrl)]);
  const code = gen(p, 'a01');
  // Внешний URL должен передаваться напрямую в bot.send_photo, не через get_upload_file_path
  ok(!code.includes(`get_upload_file_path("${externalUrl}")`), 'get_upload_file_path НЕ должен вызываться для внешнего URL');
  ok(code.includes(externalUrl), 'URL должен присутствовать в коде');
});

test('A02', 'внешний URL с /uploads/ → синтаксис Python OK', () => {
  const externalUrl = 'https://example.com/wp-content/uploads/2024/photo.jpg';
  const p = makeCleanProject([makeMessageWithExternalImageUrl('msg1', externalUrl)]);
  syntax(gen(p, 'a02'), 'a02');
});

test('A03', 'внешний URL с /uploads/ → отправляется как URL (send_photo с URL)', () => {
  const externalUrl = 'https://cdn.example.com/uploads/images/photo.png';
  const p = makeCleanProject([makeMessageWithExternalImageUrl('msg1', externalUrl)]);
  const code = gen(p, 'a03');
  // Должен использоваться send_photo с URL напрямую
  ok(code.includes(`"${externalUrl}"`), 'URL должен передаваться напрямую в send_photo');
});

test('A04', 'URL без /uploads/ → тоже работает корректно', () => {
  const externalUrl = 'https://example.com/images/photo.jpg';
  const p = makeCleanProject([makeMessageWithExternalImageUrl('msg1', externalUrl)]);
  const code = gen(p, 'a04');
  ok(!code.includes(`get_upload_file_path("${externalUrl}")`), 'get_upload_file_path НЕ должен вызываться');
  syntax(code, 'a04');
});

test('A05', 'URL с /uploads/ в начале домена → не путается с локальным путём', () => {
  const externalUrl = 'https://uploads.example.com/photo.jpg';
  const p = makeCleanProject([makeMessageWithExternalImageUrl('msg1', externalUrl)]);
  const code = gen(p, 'a05');
  ok(!code.includes(`get_upload_file_path("${externalUrl}")`), 'get_upload_file_path НЕ должен вызываться');
  syntax(code, 'a05');
});

test('A06', 'реальный URL из бага — kpcdn.net с /uploads/ → синтаксис OK', () => {
  const bugUrl = 'https://s2.stc.all.kpcdn.net/russia/wp-content/uploads/2019/10/Prielbruse.jpg';
  const p = makeCleanProject([makeMessageWithExternalImageUrl('msg1', bugUrl)]);
  const code = gen(p, 'a06');
  // Именно этот URL вызывал баг /app/ttps://...
  ok(!code.includes('/app/ttps://'), 'путь /app/ttps:// НЕ должен появляться в коде');
  ok(!code.includes(`get_upload_file_path("${bugUrl}")`), 'get_upload_file_path НЕ должен вызываться');
  syntax(code, 'a06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Локальные /uploads/ пути работают корректно
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Локальные /uploads/ пути работают корректно ───────────');

test('B01', 'локальный /uploads/ путь → вызывает get_upload_file_path', () => {
  const localPath = '/uploads/116/photo.jpg';
  const p = makeCleanProject([makeMessageWithLocalUpload('msg1', localPath)]);
  const code = gen(p, 'b01');
  ok(code.includes(`get_upload_file_path("${localPath}")`), 'get_upload_file_path ДОЛЖЕН вызываться для локального пути');
});

test('B02', 'локальный /uploads/ путь → синтаксис Python OK', () => {
  const localPath = '/uploads/116/2024/photo.jpg';
  const p = makeCleanProject([makeMessageWithLocalUpload('msg1', localPath)]);
  syntax(gen(p, 'b02'), 'b02');
});

test('B03', 'локальный /uploads/ путь → содержит os.path.exists проверку', () => {
  const localPath = '/uploads/116/photo.jpg';
  const p = makeCleanProject([makeMessageWithLocalUpload('msg1', localPath)]);
  const code = gen(p, 'b03');
  ok(code.includes('os.path.exists'), 'os.path.exists должен проверяться для локального файла');
});

test('B04', 'локальный /uploads/ путь → содержит FSInputFile', () => {
  const localPath = '/uploads/116/photo.jpg';
  const p = makeCleanProject([makeMessageWithLocalUpload('msg1', localPath)]);
  const code = gen(p, 'b04');
  ok(code.includes('FSInputFile'), 'FSInputFile должен использоваться для локального файла');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Разные типы медиа
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Разные типы медиа ─────────────────────────────────────');

test('C01', 'внешний videoUrl с /uploads/ → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'msg1', type: 'message', position: { x: 0, y: 0 },
    data: { messageText: '', videoUrl: 'https://example.com/wp-content/uploads/video.mp4', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  }]);
  syntax(gen(p, 'c01'), 'c01');
});

test('C02', 'внешний audioUrl с /uploads/ → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'msg1', type: 'message', position: { x: 0, y: 0 },
    data: { messageText: '', audioUrl: 'https://example.com/uploads/audio.mp3', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  }]);
  syntax(gen(p, 'c02'), 'c02');
});

test('C03', 'внешний documentUrl с /uploads/ → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'msg1', type: 'message', position: { x: 0, y: 0 },
    data: { messageText: '', documentUrl: 'https://example.com/uploads/doc.pdf', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  }]);
  syntax(gen(p, 'c03'), 'c03');
});

test('C04', 'локальный videoUrl /uploads/ → вызывает get_upload_file_path', () => {
  const localPath = '/uploads/116/video.mp4';
  const p = makeCleanProject([{
    id: 'msg1', type: 'message', position: { x: 0, y: 0 },
    data: { messageText: '', videoUrl: localPath, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  }]);
  const code = gen(p, 'c04');
  ok(code.includes(`get_upload_file_path("${localPath}")`), 'get_upload_file_path ДОЛЖЕН вызываться для локального пути');
  syntax(code, 'c04');
});

test('C05', 'animation-нода с внешним URL содержащим /uploads/ → синтаксис OK', () => {
  const p = makeCleanProject([{
    id: 'anim1', type: 'animation', position: { x: 0, y: 0 },
    data: { animationUrl: 'https://example.com/wp-content/uploads/anim.gif', buttons: [], keyboardType: 'none' },
  }]);
  syntax(gen(p, 'c05'), 'c05');
});

test('C06', 'animation-нода с локальным /uploads/ → вызывает get_upload_file_path', () => {
  const localPath = '/uploads/116/anim.gif';
  const p = makeCleanProject([{
    id: 'anim1', type: 'animation', position: { x: 0, y: 0 },
    data: { animationUrl: localPath, buttons: [], keyboardType: 'none' },
  }]);
  const code = gen(p, 'c06');
  ok(code.includes(`get_upload_file_path("${localPath}")`), 'get_upload_file_path ДОЛЖЕН вызываться для локального пути');
  syntax(code, 'c06');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итого: ${passed} пройдено, ${failed} провалено из ${total}`.padEnd(63) + '║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) {
  console.log('Провалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => console.log(`  ❌ ${r.id}. ${r.name}\n     → ${r.note}`));
  process.exit(1);
}
