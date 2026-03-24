/**
 * @fileoverview Фаза 5 — Узел media
 *
 * Блок A: Базовая генерация (одиночный файл)
 * Блок B: Типы медиа — photo/video/audio/document
 * Блок C: Медиагруппа (несколько файлов)
 * Блок D: FSInputFile (/uploads/ пути)
 * Блок E: Автопереход (enableAutoTransition)
 * Блок F: Пустой массив медиа
 * Блок G: Идентификаторы узлов (safe_name)
 * Блок H: Интеграция с полным проектом
 * Блок I: Комбинации параметров
 * Блок J: Граничные случаи URL
 * Блок K: Структура сгенерированного кода
 * Блок L: Несколько медиа-нод
 * Блок M: Производительность
 * Блок N: Отсутствие лишнего кода
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';
import { botDataWithSheetsSchema } from '../../shared/schema.ts';

type TestResult = { id: string; name: string; passed: boolean; note: string };
const results: TestResult[] = [];

function test(id: string, name: string, fn: () => void): void {
  try {
    fn();
    results.push({ id, name, passed: true, note: 'OK' });
    console.log(`  ✅ ${id}. ${name}`);
  } catch (e: any) {
    results.push({ id, name, passed: false, note: e.message });
    console.log(`  ❌ ${id}. ${name}\n     → ${e.message}`);
  }
}

function ok(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function syntax(code: string, label: string): void {
  const tmp = `_tmp_p5_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
  } catch (e: any) {
    try { fs.unlinkSync(tmp); } catch {}
    throw new Error(`Синтаксическая ошибка:\n${e.stderr?.toString() ?? String(e)}`);
  }
}

function makeProject(nodes: any[]): any {
  return {
    sheets: [{
      id: 'sheet1',
      name: 'Test',
      nodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase5_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

function genDB(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase5DB_${label}`,
    userDatabaseEnabled: true,
    enableComments: false,
  });
}

function parseProject<T>(project: T): T {
  const clone = JSON.parse(JSON.stringify(project)) as any;
  if (Array.isArray(clone?.sheets)) {
    clone.sheets = clone.sheets.map((sheet: any) => ({
      ...sheet,
      createdAt: new Date(sheet.createdAt),
      updatedAt: new Date(sheet.updatedAt),
    }));
  }
  return botDataWithSheetsSchema.parse(clone) as T;
}

function makeMediaNode(id: string, media: string[], opts: {
  enableAutoTransition?: boolean;
  autoTransitionTo?: string;
} = {}): any {
  return {
    id,
    type: 'media',
    position: { x: 0, y: 0 },
    data: {
      attachedMedia: media,
      enableAutoTransition: opts.enableAutoTransition ?? false,
      autoTransitionTo: opts.autoTransitionTo ?? '',
      buttons: [],
      keyboardType: 'none',
    },
  };
}

function makeMessageNode(id: string, text = 'Ответ'): any {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: {
      messageText: text,
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
    },
  };
}

function makeTriggerNode(id: string, command: string, targetId: string): any {
  return {
    id,
    type: 'command_trigger',
    position: { x: -200, y: 0 },
    data: {
      command,
      description: 'Команда',
      showInMenu: true,
      adminOnly: false,
      requiresAuth: false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

function makeStartNode(id = 'start1'): any {
  return {
    id,
    type: 'start',
    position: { x: -200, y: 0 },
    data: {
      messageText: 'Привет',
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
    },
  };
}

function makePhotoInputMessageNode(id: string, targetId: string, variable = 'photo', text = 'Пришли фото'): any {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: {
      messageText: text,
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      collectUserInput: true,
      enableTextInput: false,
      enablePhotoInput: true,
      enableVideoInput: false,
      enableAudioInput: false,
      enableDocumentInput: false,
      inputVariable: '',
      photoInputVariable: variable,
      videoInputVariable: '',
      audioInputVariable: '',
      documentInputVariable: '',
      inputTargetNodeId: targetId,
      enableAutoTransition: false,
    },
  };
}

function getHandlerBlock(code: string, safeName: string): string {
  const start = code.indexOf(`async def handle_callback_${safeName}`);
  ok(start !== -1, `handle_callback_${safeName} должен быть в коде`);
  const next = code.indexOf('\nasync def ', start + 1);
  return next === -1 ? code.slice(start) : code.slice(start, next);
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 5 — Узел media                                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'медиа-нода генерирует @dp.callback_query', () => {
  const p = makeProject([makeMediaNode('m1', ['https://example.com/photo.jpg'])]);
  const code = gen(p, 'a01');
  ok(code.includes('@dp.callback_query'), '@dp.callback_query должен быть в коде');
});

test('A02', 'handle_callback_<nodeId> присутствует в коде', () => {
  const p = makeProject([makeMediaNode('m1', ['https://example.com/photo.jpg'])]);
  const code = gen(p, 'a02');
  ok(code.includes('handle_callback_m1'), 'handle_callback_m1 должен быть в коде');
});

test('A03', 'logging.info с упоминанием nodeId присутствует', () => {
  const p = makeProject([makeMediaNode('m1', ['https://example.com/photo.jpg'])]);
  const code = gen(p, 'a03');
  ok(code.includes('logging.info('), 'logging.info должен быть в коде');
});

test('A04', 'синтаксис Python OK — одно фото', () => {
  const p = makeProject([makeMediaNode('m1', ['https://example.com/photo.jpg'])]);
  syntax(gen(p, 'a04'), 'a04');
});

test('A05', 'синтаксис Python OK — одно видео', () => {
  const p = makeProject([makeMediaNode('m1', ['https://example.com/clip.mp4'])]);
  syntax(gen(p, 'a05'), 'a05');
});

test('A06', 'синтаксис Python OK — одно аудио', () => {
  const p = makeProject([makeMediaNode('m1', ['https://example.com/track.mp3'])]);
  syntax(gen(p, 'a06'), 'a06');
});

test('A07', 'синтаксис Python OK — один документ', () => {
  const p = makeProject([makeMediaNode('m1', ['https://example.com/file.pdf'])]);
  syntax(gen(p, 'a07'), 'a07');
});

test('A08', 'код содержит async def handle_callback_', () => {
  const p = makeProject([makeMediaNode('m1', ['https://example.com/photo.jpg'])]);
  const code = gen(p, 'a08');
  ok(code.includes('async def handle_callback_'), 'async def handle_callback_ должен быть в коде');
});

test('A09', 'код содержит callback_query: types.CallbackQuery', () => {
  const p = makeProject([makeMediaNode('m1', ['https://example.com/photo.jpg'])]);
  const code = gen(p, 'a09');
  ok(code.includes('types.CallbackQuery'), 'types.CallbackQuery должен быть в коде');
});

test('A10', 'код содержит answer_photo для jpg', () => {
  const p = makeProject([makeMediaNode('m1', ['https://example.com/photo.jpg'])]);
  const code = gen(p, 'a10');
  ok(code.includes('answer_photo'), 'answer_photo должен быть в коде для jpg');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Типы медиа
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Типы медиа ────────────────────────────────────────────');

test('B01', '.jpg → answer_photo', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/img.jpg'])]);
  ok(gen(p, 'b01').includes('answer_photo'), 'answer_photo для .jpg');
});

test('B02', '.jpeg → answer_photo', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/img.jpeg'])]);
  ok(gen(p, 'b02').includes('answer_photo'), 'answer_photo для .jpeg');
});

test('B03', '.png → answer_photo', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/img.png'])]);
  ok(gen(p, 'b03').includes('answer_photo'), 'answer_photo для .png');
});

test('B04', '.gif → answer_photo', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/anim.gif'])]);
  ok(gen(p, 'b04').includes('answer_photo'), 'answer_photo для .gif');
});

test('B05', '.webp → answer_photo', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/img.webp'])]);
  ok(gen(p, 'b05').includes('answer_photo'), 'answer_photo для .webp');
});

test('B06', '.mp4 → answer_video', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/clip.mp4'])]);
  ok(gen(p, 'b06').includes('answer_video'), 'answer_video для .mp4');
});

test('B07', '.avi → answer_video', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/clip.avi'])]);
  ok(gen(p, 'b07').includes('answer_video'), 'answer_video для .avi');
});

test('B08', '.mov → answer_video', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/clip.mov'])]);
  ok(gen(p, 'b08').includes('answer_video'), 'answer_video для .mov');
});

test('B09', '.mp3 → answer_audio', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/track.mp3'])]);
  ok(gen(p, 'b09').includes('answer_audio'), 'answer_audio для .mp3');
});

test('B10', '.wav → answer_audio', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/track.wav'])]);
  ok(gen(p, 'b10').includes('answer_audio'), 'answer_audio для .wav');
});

test('B11', '.ogg → answer_audio', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/track.ogg'])]);
  ok(gen(p, 'b11').includes('answer_audio'), 'answer_audio для .ogg');
});

test('B12', '.pdf → answer_document', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/doc.pdf'])]);
  ok(gen(p, 'b12').includes('answer_document'), 'answer_document для .pdf');
});

test('B13', '.zip → answer_document', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/arch.zip'])]);
  ok(gen(p, 'b13').includes('answer_document'), 'answer_document для .zip');
});

test('B14', '.txt → answer_document', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/readme.txt'])]);
  ok(gen(p, 'b14').includes('answer_document'), 'answer_document для .txt');
});

test('B15', 'неизвестное расширение .xyz → answer_document (fallback)', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/file.xyz'])]);
  ok(gen(p, 'b15').includes('answer_document'), 'answer_document как fallback для .xyz');
});

test('B16', 'URL без расширения → answer_document (fallback)', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/file'])]);
  ok(gen(p, 'b16').includes('answer_document'), 'answer_document как fallback без расширения');
});

test('B17', 'URL с заглавным расширением .JPG → answer_photo (case-insensitive)', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/img.JPG'])]);
  ok(gen(p, 'b17').includes('answer_photo'), 'answer_photo для .JPG (case-insensitive)');
});

test('B18', 'URL с заглавным .MP4 → answer_video (case-insensitive)', () => {
  const p = makeProject([makeMediaNode('m1', ['https://cdn.example.com/clip.MP4'])]);
  ok(gen(p, 'b18').includes('answer_video'), 'answer_video для .MP4 (case-insensitive)');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Медиагруппа
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Медиагруппа ───────────────────────────────────────────');

test('C01', '2 файла → answer_media_group', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg', 'https://ex.com/b.jpg'])]);
  ok(gen(p, 'c01').includes('answer_media_group'), 'answer_media_group для 2 файлов');
});

test('C02', '3 файла → answer_media_group', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg', 'https://ex.com/b.mp4', 'https://ex.com/c.mp3'])]);
  ok(gen(p, 'c02').includes('answer_media_group'), 'answer_media_group для 3 файлов');
});

test('C03', '10 файлов → answer_media_group, синтаксис OK', () => {
  const urls = Array.from({ length: 10 }, (_, i) => `https://ex.com/photo${i}.jpg`);
  const p = makeProject([makeMediaNode('m1', urls)]);
  const code = gen(p, 'c03');
  ok(code.includes('answer_media_group'), 'answer_media_group для 10 файлов');
  syntax(code, 'c03');
});

test('C04', 'медиагруппа содержит InputMediaPhoto для jpg', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg', 'https://ex.com/b.jpg'])]);
  ok(gen(p, 'c04').includes('InputMediaPhoto'), 'InputMediaPhoto должен быть в медиагруппе');
});

test('C05', 'медиагруппа содержит InputMediaVideo для mp4', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.mp4', 'https://ex.com/b.mp4'])]);
  ok(gen(p, 'c05').includes('InputMediaVideo'), 'InputMediaVideo должен быть в медиагруппе');
});

test('C06', 'медиагруппа содержит InputMediaAudio для mp3', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.mp3', 'https://ex.com/b.mp3'])]);
  ok(gen(p, 'c06').includes('InputMediaAudio'), 'InputMediaAudio должен быть в медиагруппе');
});

test('C07', 'медиагруппа содержит InputMediaDocument для pdf', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.pdf', 'https://ex.com/b.pdf'])]);
  ok(gen(p, 'c07').includes('InputMediaDocument'), 'InputMediaDocument должен быть в медиагруппе');
});

test('C08', 'смешанная группа jpg+mp4 → InputMediaPhoto и InputMediaVideo', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg', 'https://ex.com/b.mp4'])]);
  const code = gen(p, 'c08');
  ok(code.includes('InputMediaPhoto'), 'InputMediaPhoto должен быть');
  ok(code.includes('InputMediaVideo'), 'InputMediaVideo должен быть');
});

test('C09', 'медиагруппа содержит _media_group = [', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg', 'https://ex.com/b.jpg'])]);
  ok(gen(p, 'c09').includes('_media_group'), '_media_group должен быть в коде');
});

test('C10', '2 файла → НЕТ answer_photo (только answer_media_group)', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg', 'https://ex.com/b.jpg'])]);
  const code = gen(p, 'c10');
  ok(!code.includes('answer_photo('), 'answer_photo НЕ должен быть при медиагруппе');
  ok(code.includes('answer_media_group'), 'answer_media_group должен быть');
});

test('C11', 'синтаксис OK — смешанная группа из 5 файлов', () => {
  const urls = [
    'https://ex.com/a.jpg', 'https://ex.com/b.mp4',
    'https://ex.com/c.mp3', 'https://ex.com/d.pdf',
    'https://ex.com/e.png',
  ];
  syntax(gen(makeProject([makeMediaNode('m1', urls)]), 'c11'), 'c11');
});

test('C12', 'медиагруппа — каждый элемент содержит media=', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg', 'https://ex.com/b.jpg'])]);
  const code = gen(p, 'c12');
  const count = (code.match(/media=/g) || []).length;
  ok(count >= 2, `Должно быть минимум 2 media=, найдено: ${count}`);
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: FSInputFile (/uploads/ пути)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: FSInputFile (/uploads/ пути) ──────────────────────────');

test('D01', '/uploads/ путь → FSInputFile в коде', () => {
  const p = makeProject([makeMediaNode('m1', ['/uploads/photo.jpg'])]);
  ok(gen(p, 'd01').includes('FSInputFile'), 'FSInputFile должен быть для /uploads/ пути');
});

test('D02', '/uploads/ путь → get_upload_file_path в коде', () => {
  const p = makeProject([makeMediaNode('m1', ['/uploads/photo.jpg'])]);
  ok(gen(p, 'd02').includes('get_upload_file_path'), 'get_upload_file_path должен быть в коде');
});

test('D03', 'https:// URL → НЕТ FSInputFile', () => {
  const p = makeProject([makeMediaNode('m1', ['https://example.com/photo.jpg'])]);
  const handler = getHandlerBlock(gen(p, 'd03'), 'm1');
  ok(!handler.includes('FSInputFile'), 'FSInputFile НЕ должен быть для https:// URL внутри media-handler');
});

test('D04', '/uploads/ путь → синтаксис OK', () => {
  const p = makeProject([makeMediaNode('m1', ['/uploads/photo.jpg'])]);
  syntax(gen(p, 'd04'), 'd04');
});

test('D05', '/uploads/ видео → FSInputFile + answer_video', () => {
  const p = makeProject([makeMediaNode('m1', ['/uploads/clip.mp4'])]);
  const code = gen(p, 'd05');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть');
  ok(code.includes('answer_video'), 'answer_video должен быть');
});

test('D06', '/uploads/ аудио → FSInputFile + answer_audio', () => {
  const p = makeProject([makeMediaNode('m1', ['/uploads/track.mp3'])]);
  const code = gen(p, 'd06');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть');
  ok(code.includes('answer_audio'), 'answer_audio должен быть');
});

test('D07', '/uploads/ документ → FSInputFile + answer_document', () => {
  const p = makeProject([makeMediaNode('m1', ['/uploads/doc.pdf'])]);
  const code = gen(p, 'd07');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть');
  ok(code.includes('answer_document'), 'answer_document должен быть');
});

test('D08', 'медиагруппа из /uploads/ → FSInputFile в каждом элементе', () => {
  const p = makeProject([makeMediaNode('m1', ['/uploads/a.jpg', '/uploads/b.jpg'])]);
  const code = gen(p, 'd08');
  const count = (code.match(/FSInputFile/g) || []).length;
  ok(count >= 2, `FSInputFile должен быть минимум 2 раза, найдено: ${count}`);
});

test('D09', 'смешанная группа /uploads/ + https:// → FSInputFile только для /uploads/', () => {
  const p = makeProject([makeMediaNode('m1', ['/uploads/a.jpg', 'https://ex.com/b.jpg'])]);
  const code = gen(p, 'd09');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть для /uploads/');
  ok(code.includes('https://ex.com/b.jpg'), 'https:// URL должен быть напрямую');
  syntax(code, 'd09');
});

test('D10', '/uploads/ путь с вложенными папками → синтаксис OK', () => {
  const p = makeProject([makeMediaNode('m1', ['/uploads/2024/01/photo.jpg'])]);
  syntax(gen(p, 'd10'), 'd10');
});

test('D11', '/uploads/ путь с пробелами → синтаксис OK', () => {
  const p = makeProject([makeMediaNode('m1', ['/uploads/my photo.jpg'])]);
  syntax(gen(p, 'd11'), 'd11');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Автопереход
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Автопереход ───────────────────────────────────────────');

test('E01', 'enableAutoTransition: true → FakeCallbackQuery в коде', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'next1' }),
    makeMessageNode('next1'),
  ]);
  ok(gen(p, 'e01').includes('FakeCallbackQuery'), 'FakeCallbackQuery должен быть при автопереходе');
});

test('E02', 'enableAutoTransition: true → handle_callback_<targetId> вызывается', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'next1' }),
    makeMessageNode('next1'),
  ]);
  ok(gen(p, 'e02').includes('handle_callback_next1'), 'handle_callback_next1 должен вызываться');
});

test('E03', 'enableAutoTransition: false → НЕТ FakeCallbackQuery', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg'], { enableAutoTransition: false })]);
  ok(!gen(p, 'e03').includes('FakeCallbackQuery'), 'FakeCallbackQuery НЕ должен быть без автоперехода');
});

test('E04', 'enableAutoTransition: true → синтаксис OK', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'next1' }),
    makeMessageNode('next1'),
  ]);
  syntax(gen(p, 'e04'), 'e04');
});

test('E05', 'enableAutoTransition: true + медиагруппа → синтаксис OK', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg', 'https://ex.com/b.jpg'], { enableAutoTransition: true, autoTransitionTo: 'next1' }),
    makeMessageNode('next1'),
  ]);
  syntax(gen(p, 'e05'), 'e05');
});

test('E06', 'enableAutoTransition: true + /uploads/ → синтаксис OK', () => {
  const p = makeProject([
    makeMediaNode('m1', ['/uploads/photo.jpg'], { enableAutoTransition: true, autoTransitionTo: 'next1' }),
    makeMessageNode('next1'),
  ]);
  syntax(gen(p, 'e06'), 'e06');
});

test('E07', 'enableAutoTransition: true + пустой массив → синтаксис OK', () => {
  const p = makeProject([
    makeMediaNode('m1', [], { enableAutoTransition: true, autoTransitionTo: 'next1' }),
    makeMessageNode('next1'),
  ]);
  syntax(gen(p, 'e07'), 'e07');
});

test('E08', 'autoTransitionTo с дефисами → safe_name применяется, синтаксис OK', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'my-next-node' }),
    makeMessageNode('my-next-node'),
  ]);
  syntax(gen(p, 'e08'), 'e08');
});

test('E09', 'цепочка медиа-нод с автопереходом → синтаксис OK', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'm2' }),
    makeMediaNode('m2', ['https://ex.com/b.mp4'], { enableAutoTransition: true, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'e09'), 'e09');
});

test('E10', 'enableAutoTransition: true → logging.info с упоминанием автоперехода', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'next1' }),
    makeMessageNode('next1'),
  ]);
  const code = gen(p, 'e10');
  ok(code.includes('logging.info('), 'logging.info должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Пустой массив медиа
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Пустой массив медиа ───────────────────────────────────');

test('F01', 'пустой массив → генерация не падает', () => {
  const p = makeProject([makeMediaNode('m1', [])]);
  ok(true, 'генерация не должна падать');
  gen(p, 'f01');
});

test('F02', 'пустой массив → синтаксис OK', () => {
  syntax(gen(makeProject([makeMediaNode('m1', [])]), 'f02'), 'f02');
});

test('F03', 'пустой массив → НЕТ answer_photo/video/audio/document', () => {
  const code = gen(makeProject([makeMediaNode('m1', [])]), 'f03');
  ok(!code.includes('answer_photo('), 'answer_photo НЕ должен быть');
  ok(!code.includes('answer_video('), 'answer_video НЕ должен быть');
  ok(!code.includes('answer_audio('), 'answer_audio НЕ должен быть');
  ok(!code.includes('answer_document('), 'answer_document НЕ должен быть');
});

test('F04', 'пустой массив → НЕТ answer_media_group', () => {
  ok(!gen(makeProject([makeMediaNode('m1', [])]), 'f04').includes('answer_media_group'), 'answer_media_group НЕ должен быть');
});

test('F05', 'пустой массив → handle_callback_ всё равно генерируется', () => {
  ok(gen(makeProject([makeMediaNode('m1', [])]), 'f05').includes('handle_callback_m1'), 'handle_callback_m1 должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Идентификаторы узлов (safe_name)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Идентификаторы узлов (safe_name) ──────────────────────');

test('G01', 'nodeId с дефисами → safe_name, синтаксис OK', () => {
  syntax(gen(makeProject([makeMediaNode('my-media-node', ['https://ex.com/a.jpg'])]), 'g01'), 'g01');
});

test('G02', 'nodeId начинающийся с цифры → синтаксис OK', () => {
  syntax(gen(makeProject([makeMediaNode('123media', ['https://ex.com/a.jpg'])]), 'g02'), 'g02');
});

test('G03', 'nodeId с точками → синтаксис OK', () => {
  syntax(gen(makeProject([makeMediaNode('media.node.1', ['https://ex.com/a.jpg'])]), 'g03'), 'g03');
});

test('G04', 'nodeId очень длинный (80 символов) → синтаксис OK', () => {
  const longId = 'media_' + 'x'.repeat(74);
  syntax(gen(makeProject([makeMediaNode(longId, ['https://ex.com/a.jpg'])]), 'g04'), 'g04');
});

test('G05', 'nodeId с кириллицей → генерация не падает', () => {
  ok(true, 'генерация не должна падать');
  gen(makeProject([makeMediaNode('медиа_1', ['https://ex.com/a.jpg'])]), 'g05');
});

test('G06', 'nodeId с пробелами → генерация не падает', () => {
  ok(true, 'генерация не должна падать');
  gen(makeProject([makeMediaNode('media node 1', ['https://ex.com/a.jpg'])]), 'g06');
});

test('G07', 'nodeId с подчёркиванием → handle_callback_media_node_1', () => {
  const code = gen(makeProject([makeMediaNode('media_node_1', ['https://ex.com/a.jpg'])]), 'g07');
  ok(code.includes('handle_callback_media_node_1'), 'handle_callback_media_node_1 должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Интеграция с полным проектом
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Интеграция с полным проектом ──────────────────────────');

test('H01', 'command_trigger → media → синтаксис OK', () => {
  const p = makeProject([
    makeTriggerNode('t1', '/photo', 'm1'),
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
  ]);
  syntax(gen(p, 'h01'), 'h01');
});

test('H02', 'command_trigger → media → message → синтаксис OK', () => {
  const p = makeProject([
    makeTriggerNode('t1', '/photo', 'm1'),
    makeMediaNode('m1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Фото отправлено'),
  ]);
  syntax(gen(p, 'h02'), 'h02');
});

test('H03', 'start → media → синтаксис OK', () => {
  const p = makeProject([
    makeStartNode('start1'),
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
  ]);
  syntax(gen(p, 'h03'), 'h03');
});

test('H04', 'media + userDatabaseEnabled: true → синтаксис OK', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg'])]);
  syntax(genDB(p, 'h04'), 'h04');
});

test('H05', 'media + message + command_trigger → все три в коде', () => {
  const p = makeProject([
    makeTriggerNode('t1', '/start', 'm1'),
    makeMediaNode('m1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Готово'),
  ]);
  const code = gen(p, 'h05');
  ok(code.includes('@dp.message(Command('), 'command_trigger должен быть');
  ok(code.includes('handle_callback_m1'), 'media-нода должна быть');
  ok(code.includes('handle_callback_msg1'), 'message-нода должна быть');
  syntax(code, 'h05');
});

test('H06', 'несколько command_trigger → разные media-ноды → синтаксис OK', () => {
  const p = makeProject([
    makeTriggerNode('t1', '/photo', 'm1'),
    makeTriggerNode('t2', '/video', 'm2'),
    makeTriggerNode('t3', '/audio', 'm3'),
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
    makeMediaNode('m2', ['https://ex.com/b.mp4']),
    makeMediaNode('m3', ['https://ex.com/c.mp3']),
  ]);
  syntax(gen(p, 'h06'), 'h06');
});

test('H07', 'media + /uploads/ + userDatabaseEnabled → синтаксис OK', () => {
  const p = makeProject([makeMediaNode('m1', ['/uploads/photo.jpg'])]);
  syntax(genDB(p, 'h07'), 'h07');
});

test('H08', 'media + медиагруппа + автопереход + command_trigger → синтаксис OK', () => {
  const p = makeProject([
    makeTriggerNode('t1', '/gallery', 'm1'),
    makeMediaNode('m1', ['https://ex.com/a.jpg', 'https://ex.com/b.jpg'], { enableAutoTransition: true, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Галерея отправлена'),
  ]);
  syntax(gen(p, 'h08'), 'h08');
});

test('H09', 'только media-нода без триггера → синтаксис OK', () => {
  syntax(gen(makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg'])]), 'h09'), 'h09');
});

test('H10', 'media + message с inline-кнопками → синтаксис OK', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'msg1' }),
    {
      id: 'msg1', type: 'message', position: { x: 400, y: 0 },
      data: {
        messageText: 'Выбери', formatMode: 'none', markdown: false,
        buttons: [{ id: 'b1', text: 'Далее', action: 'goto', target: 'msg1' }],
        keyboardType: 'inline',
      },
    },
  ]);
  syntax(gen(p, 'h10'), 'h10');
});

// ─────────────────────────────────────────────────────────────────────────────
// БЛОК I: Комбинации параметров
// ─────────────────────────────────────────────────────────────────────────────

console.log('── Блок I: Комбинации параметров ───────────────────────────────────');

test('I01', 'одиночный /uploads/ файл + автопереход → FSInputFile + FakeCallbackQuery + target handler', () => {
  const p = makeProject([
    makeMediaNode('m1', ['/uploads/photo.jpg'], { enableAutoTransition: true, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'i01');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть для /uploads/ файла');
  ok(code.includes('FakeCallbackQuery'), 'FakeCallbackQuery должен быть при автопереходе');
  ok(code.includes('handle_callback_msg1'), 'handle_callback_msg1 должен быть в коде');
  syntax(code, 'i01');
});

test('I02', 'смешанная медиагруппа + автопереход → answer_media_group + FakeCallbackQuery', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg', '/uploads/b.mp4'], { enableAutoTransition: true, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'i02');
  ok(code.includes('answer_media_group'), 'answer_media_group должен быть в коде');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть для /uploads/ элемента');
  ok(code.includes('FakeCallbackQuery'), 'FakeCallbackQuery должен быть при автопереходе');
  syntax(code, 'i02');
});

test('I03', 'пустой массив + enableAutoTransition: false → pass и НЕТ FakeCallbackQuery', () => {
  const p = makeProject([makeMediaNode('m1', [], { enableAutoTransition: false })]);
  const code = gen(p, 'i03');
  ok(code.includes('pass'), 'pass должен быть при пустом массиве');
  ok(!code.includes('FakeCallbackQuery'), 'FakeCallbackQuery не должен быть без автоперехода');
});

test('I04', 'одиночный /uploads/ документ + автопереход → answer_document + FSInputFile + target', () => {
  const p = makeProject([
    makeMediaNode('m1', ['/uploads/doc.pdf'], { enableAutoTransition: true, autoTransitionTo: 'next-doc' }),
    makeMessageNode('next-doc'),
  ]);
  const code = gen(p, 'i04');
  ok(code.includes('answer_document'), 'answer_document должен быть для pdf');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть для /uploads/ пути');
  ok(code.includes('handle_callback_next_doc'), 'safe_name должен примениться к next-doc');
  syntax(code, 'i04');
});

test('I05', 'смешанная группа remote + uploads + userDatabaseEnabled → синтаксис OK', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg', '/uploads/b.jpg', 'https://ex.com/c.pdf'], {
      enableAutoTransition: true,
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]);
  syntax(genDB(p, 'i05'), 'i05');
});

test('I06', 'одиночное remote audio + автопереход → answer_audio без FSInputFile', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/track.mp3'], { enableAutoTransition: true, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'i06');
  const handler = getHandlerBlock(code, 'm1');
  ok(code.includes('answer_audio'), 'answer_audio должен быть для mp3');
  ok(!handler.includes('FSInputFile'), 'FSInputFile не должен быть для remote URL внутри media-handler');
  ok(code.includes('FakeCallbackQuery'), 'FakeCallbackQuery должен быть при автопереходе');
});

// ─────────────────────────────────────────────────────────────────────────────
// БЛОК J: Граничные случаи URL
// ─────────────────────────────────────────────────────────────────────────────

console.log('── Блок J: Граничные случаи URL ───────────────────────────────────');

test('J01', 'URL с query-параметром .jpg?token=1 → answer_photo', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/photo.jpg?token=1'])]);
  ok(gen(p, 'j01').includes('answer_photo'), 'answer_photo должен быть для .jpg?token=1');
});

test('J02', 'URL с fragment .mp4#download → answer_video', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/clip.mp4#download'])]);
  ok(gen(p, 'j02').includes('answer_video'), 'answer_video должен быть для .mp4#download');
});

test('J03', 'URL с uppercase и query .PDF?dl=1 → answer_document', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/DOC.PDF?dl=1'])]);
  ok(gen(p, 'j03').includes('answer_document'), 'answer_document должен быть для .PDF?dl=1');
});

test('J04', 'URL, где .jpg встречается внутри пути → answer_photo по текущему правилу шаблона', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/api/photo.jpg/download'])]);
  ok(gen(p, 'j04').includes('answer_photo'), 'answer_photo должен быть из-за substring match .jpg');
});

test('J05', '/uploads/ путь с uppercase расширением .JPG → FSInputFile + answer_photo', () => {
  const p = makeProject([makeMediaNode('m1', ['/uploads/PHOTO.JPG'])]);
  const code = gen(p, 'j05');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть для /uploads/ пути');
  ok(code.includes('answer_photo'), 'answer_photo должен быть для .JPG');
});

test('J06', 'URL без расширения, но с filename=photo.jpg в query → answer_photo по substring match', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/download?filename=photo.jpg'])]);
  ok(gen(p, 'j06').includes('answer_photo'), 'answer_photo должен быть из-за photo.jpg в query');
});

// ─────────────────────────────────────────────────────────────────────────────
// БЛОК K: Структура сгенерированного кода
// ─────────────────────────────────────────────────────────────────────────────

console.log('── Блок K: Структура сгенерированного кода ────────────────────────');

test('K01', 'handler содержит is_fake_callback = getattr(callback_query, \'_is_fake\', False)', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg'])]);
  const code = gen(p, 'k01');
  ok(code.includes("is_fake_callback = getattr(callback_query, '_is_fake', False)"), 'is_fake_callback должен быть в handler');
});

test('K02', 'одиночный файл → есть комментарий про одиночный медиафайл и НЕТ _media_group', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg'])]);
  const code = gen(p, 'k02');
  ok(code.includes('Оправка') || code.includes('Отправка одиночного медиафайла') || code.includes('РћС‚РїСЂР°РІРєР° РѕРґРёРЅРѕС‡РЅРѕРіРѕ'), 'комментарий про одиночный файл должен быть');
  ok(!code.includes('_media_group = ['), '_media_group не должен быть для одиночного файла');
});

test('K03', 'медиагруппа → есть _media_group и answer_media_group(_media_group)', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg', 'https://ex.com/b.jpg'])]);
  const code = gen(p, 'k03');
  ok(code.includes('_media_group = ['), '_media_group должен быть в коде');
  ok(code.includes('answer_media_group(_media_group)'), 'answer_media_group(_media_group) должен быть в коде');
});

test('K04', 'пустой массив → есть комментарий про отсутствие медиа и pass', () => {
  const p = makeProject([makeMediaNode('m1', [])]);
  const code = gen(p, 'k04');
  ok(code.includes('pass'), 'pass должен быть при пустом массиве');
  ok(code.includes('Нет медиафайлов') || code.includes('РќРµС‚ РјРµРґРёР°С„Р°Р№Р»РѕРІ'), 'комментарий про отсутствие медиа должен быть');
});

test('K05', 'автопереход → fake_cb создаётся через FakeCallbackQuery(callback_query.message, "next1")', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'next1' }),
    makeMessageNode('next1'),
  ]);
  const code = gen(p, 'k05');
  ok(code.includes('fake_cb = FakeCallbackQuery(callback_query.message, "next1")'), 'fake_cb должен создаваться через FakeCallbackQuery');
});

test('K06', 'logging.info идёт раньше отправки media', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg'])]);
  const code = gen(p, 'k06');
  const logIdx = code.indexOf('logging.info(');
  const sendIdx = code.indexOf('answer_photo');
  ok(logIdx !== -1, 'logging.info должен быть в коде');
  ok(sendIdx !== -1, 'answer_photo должен быть в коде');
  ok(logIdx < sendIdx, 'logging.info должен идти раньше отправки media');
});

test('K07', 'для одной media-ноды node-маркеры и основной media-handler присутствуют', () => {
  const p = makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg'])]);
  const code = gen(p, 'k07');
  const nodeStarts = (code.match(/# @@NODE_START:m1@@/g) || []).length;
  const nodeEnds = (code.match(/# @@NODE_END:m1@@/g) || []).length;
  const mainHandler = getHandlerBlock(code, 'm1');
  ok(nodeStarts === 1, `Ожидался 1 @@NODE_START:m1@@, найдено: ${nodeStarts}`);
  ok(nodeEnds === 1, `Ожидался 1 @@NODE_END:m1@@, найдено: ${nodeEnds}`);
  ok(mainHandler.includes('Обработчик медиа-ноды для узла m1') || mainHandler.includes('медиа-ноды'), 'основной media-handler должен присутствовать');
});

// ─────────────────────────────────────────────────────────────────────────────
// БЛОК L: Несколько media-нод
// ─────────────────────────────────────────────────────────────────────────────

console.log('── Блок L: Несколько media-нод ────────────────────────────────────');

test('L01', 'две media-ноды → оба handler-а присутствуют', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
    makeMediaNode('m2', ['https://ex.com/b.mp4']),
  ]);
  const code = gen(p, 'l01');
  ok(code.includes('handle_callback_m1'), 'handle_callback_m1 должен быть');
  ok(code.includes('handle_callback_m2'), 'handle_callback_m2 должен быть');
});

test('L02', 'две media-ноды разных типов → answer_photo и answer_video в одном проекте', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
    makeMediaNode('m2', ['https://ex.com/b.mp4']),
  ]);
  const code = gen(p, 'l02');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
  ok(code.includes('answer_video'), 'answer_video должен быть');
  syntax(code, 'l02');
});

test('L03', 'цепочка из трёх media-нод с автопереходами → все handler-ы и синтаксис OK', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'm2' }),
    makeMediaNode('m2', ['https://ex.com/b.mp4'], { enableAutoTransition: true, autoTransitionTo: 'm3' }),
    makeMediaNode('m3', ['https://ex.com/c.mp3']),
  ]);
  const code = gen(p, 'l03');
  ok(code.includes('handle_callback_m1'), 'handle_callback_m1 должен быть');
  ok(code.includes('handle_callback_m2'), 'handle_callback_m2 должен быть');
  ok(code.includes('handle_callback_m3'), 'handle_callback_m3 должен быть');
  syntax(code, 'l03');
});

test('L04', 'три media-ноды: одиночная, группа и пустая → все три сценария присутствуют', () => {
  const p = makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
    makeMediaNode('m2', ['https://ex.com/b.jpg', 'https://ex.com/c.jpg']),
    makeMediaNode('m3', []),
  ]);
  const code = gen(p, 'l04');
  ok(code.includes('answer_photo'), 'одиночная отправка должна быть');
  ok(code.includes('answer_media_group'), 'медиагруппа должна быть');
  ok(code.includes('pass'), 'ветка пустого массива должна быть');
});

test('L05', 'несколько trigger-ов на разные media-ноды → синтаксис OK', () => {
  const p = makeProject([
    makeTriggerNode('t1', '/one', 'm1'),
    makeTriggerNode('t2', '/two', 'm2'),
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
    makeMediaNode('m2', ['https://ex.com/b.jpg', 'https://ex.com/c.jpg']),
  ]);
  syntax(gen(p, 'l05'), 'l05');
});

test('L06', 'несколько media-нод с /uploads/ и remote URL → корректный mix FSInputFile и remote send', () => {
  const p = makeProject([
    makeMediaNode('m1', ['/uploads/a.jpg']),
    makeMediaNode('m2', ['https://ex.com/b.pdf']),
    makeMediaNode('m3', ['/uploads/c.jpg', 'https://ex.com/d.mp4']),
  ]);
  const code = gen(p, 'l06');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть для /uploads/');
  ok(code.includes('answer_document'), 'answer_document должен быть для pdf');
  ok(code.includes('answer_media_group'), 'answer_media_group должен быть для mixed group');
  syntax(code, 'l06');
});

// ─────────────────────────────────────────────────────────────────────────────
// БЛОК M: Производительность
// ─────────────────────────────────────────────────────────────────────────────

console.log('── Блок M: Производительность ─────────────────────────────────────');

test('M01', '20 media-нод в одном проекте → синтаксис OK', () => {
  const nodes = Array.from({ length: 20 }, (_, i) =>
    makeMediaNode(`m${i + 1}`, [`https://ex.com/file${i + 1}.jpg`])
  );
  syntax(gen(makeProject(nodes), 'm01'), 'm01');
});

test('M02', 'медиагруппа из 20 файлов → answer_media_group и синтаксис OK', () => {
  const urls = Array.from({ length: 20 }, (_, i) => `https://ex.com/img${i + 1}.jpg`);
  const code = gen(makeProject([makeMediaNode('m1', urls)]), 'm02');
  ok(code.includes('answer_media_group'), 'answer_media_group должен быть для 20 файлов');
  syntax(code, 'm02');
});

test('M03', '10 trigger + 10 media-нод → синтаксис OK', () => {
  const nodes = Array.from({ length: 10 }, (_, i) => [
    makeTriggerNode(`t${i + 1}`, `/cmd${i + 1}`, `m${i + 1}`),
    makeMediaNode(`m${i + 1}`, [`https://ex.com/file${i + 1}.jpg`]),
  ]).flat();
  syntax(gen(makeProject(nodes), 'm03'), 'm03');
});

test('M04', 'медиагруппа из 12 /uploads/ файлов → много FSInputFile и синтаксис OK', () => {
  const urls = Array.from({ length: 12 }, (_, i) => `/uploads/photo_${i + 1}.jpg`);
  const code = gen(makeProject([makeMediaNode('m1', urls)]), 'm04');
  const count = (code.match(/FSInputFile/g) || []).length;
  ok(count >= 12, `FSInputFile должен встречаться минимум 12 раз, найдено: ${count}`);
  syntax(code, 'm04');
});

test('M05', 'крупный проект: start + 8 trigger + 8 media + 8 message → синтаксис OK', () => {
  const nodes = [
    makeStartNode('start1'),
    ...Array.from({ length: 8 }, (_, i) => makeTriggerNode(`t${i + 1}`, `/cmd${i + 1}`, `m${i + 1}`)),
    ...Array.from({ length: 8 }, (_, i) =>
      makeMediaNode(`m${i + 1}`, [`https://ex.com/file${i + 1}.jpg`], {
        enableAutoTransition: true,
        autoTransitionTo: `msg${i + 1}`,
      })
    ),
    ...Array.from({ length: 8 }, (_, i) => makeMessageNode(`msg${i + 1}`, `Message ${i + 1}`)),
  ];
  syntax(gen(makeProject(nodes), 'm05'), 'm05');
});

// ─────────────────────────────────────────────────────────────────────────────
// БЛОК N: Отсутствие лишнего кода
// ─────────────────────────────────────────────────────────────────────────────

console.log('── Блок N: Отсутствие лишнего кода ───────────────────────────────');

test('N01', 'single photo → НЕТ answer_video/audio/document/media_group', () => {
  const code = gen(makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg'])]), 'n01');
  ok(!code.includes('answer_video('), 'answer_video не должен быть для single photo');
  ok(!code.includes('answer_audio('), 'answer_audio не должен быть для single photo');
  ok(!code.includes('answer_document('), 'answer_document не должен быть для single photo');
  ok(!code.includes('answer_media_group'), 'answer_media_group не должен быть для single photo');
});

test('N02', 'single video → НЕТ answer_photo/audio/document/media_group', () => {
  const code = gen(makeProject([makeMediaNode('m1', ['https://ex.com/a.mp4'])]), 'n02');
  ok(!code.includes('answer_photo('), 'answer_photo не должен быть для single video');
  ok(!code.includes('answer_audio('), 'answer_audio не должен быть для single video');
  ok(!code.includes('answer_document('), 'answer_document не должен быть для single video');
  ok(!code.includes('answer_media_group'), 'answer_media_group не должен быть для single video');
});

test('N03', 'медиагруппа → НЕТ одиночных answer_photo/video/audio/document вызовов', () => {
  const code = gen(makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg', 'https://ex.com/b.mp4'])]), 'n03');
  ok(!code.includes('answer_photo('), 'answer_photo не должен быть для медиагруппы');
  ok(!code.includes('answer_video('), 'answer_video не должен быть для медиагруппы');
  ok(!code.includes('answer_audio('), 'answer_audio не должен быть для медиагруппы');
  ok(!code.includes('answer_document('), 'answer_document не должен быть для медиагруппы');
});

test('N04', 'без автоперехода → НЕТ fake_cb и вызова handle_callback_<target>(fake_cb)', () => {
  const code = gen(makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg'])]), 'n04');
  ok(!code.includes('fake_cb = FakeCallbackQuery'), 'fake_cb не должен быть без автоперехода');
  ok(!code.includes('(fake_cb)'), 'вызов handler с fake_cb не должен быть без автоперехода');
});

test('N05', 'remote URL → НЕТ get_upload_file_path', () => {
  const code = gen(makeProject([makeMediaNode('m1', ['https://ex.com/a.jpg'])]), 'n05');
  const handler = getHandlerBlock(code, 'm1');
  ok(!handler.includes('get_upload_file_path'), 'get_upload_file_path не должен быть для remote URL внутри media-handler');
});

test('N06', 'пустой массив → НЕТ FSInputFile', () => {
  const code = gen(makeProject([makeMediaNode('m1', [])]), 'n06');
  const handler = getHandlerBlock(code, 'm1');
  ok(!handler.includes('FSInputFile'), 'FSInputFile не должен быть при пустом массиве внутри media-handler');
});

// ─────────────────────────────────────────────────────────────────────────────
// БЛОК O: Реалистичные сценарии проекта
// ─────────────────────────────────────────────────────────────────────────────

console.log('── Блок O: Реалистичные сценарии проекта ─────────────────────────');

test('O01', 'message с photoInputVariable=photo + media-нода в одном проекте → синтаксис OK', () => {
  const p = makeProject([
    makePhotoInputMessageNode('msg_photo', 'm1', 'photo'),
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
  ]);
  syntax(gen(p, 'o01'), 'o01');
});

test('O02', 'message с photoInputVariable=photo → waiting_for_input содержит photo_variable', () => {
  const p = makeProject([
    makePhotoInputMessageNode('msg_photo', 'm1', 'photo'),
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
  ]);
  const code = gen(p, 'o02');
  ok(code.includes('"photo_variable": "photo"'), 'photo_variable=photo должен быть в waiting_for_input');
});

test('O03', 'command_trigger → message(photo input) → media → синтаксис OK', () => {
  const p = makeProject([
    makeTriggerNode('t1', '/photo', 'msg_photo'),
    makePhotoInputMessageNode('msg_photo', 'm1', 'photo'),
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
  ]);
  syntax(gen(p, 'o03'), 'o03');
});

test('O04', 'message(photo input) + media + userDatabaseEnabled → синтаксис OK', () => {
  const p = makeProject([
    makePhotoInputMessageNode('msg_photo', 'm1', 'photo'),
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
  ]);
  syntax(genDB(p, 'o04'), 'o04');
});

test('O05', 'несколько photo-input message-нод с разными переменными → обе переменные в коде', () => {
  const p = makeProject([
    makePhotoInputMessageNode('msg_photo_1', 'm1', 'photo'),
    makePhotoInputMessageNode('msg_photo_2', 'm2', 'passport_photo'),
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
    makeMediaNode('m2', ['https://ex.com/b.jpg']),
  ]);
  const code = gen(p, 'o05');
  ok(code.includes('"photo_variable": "photo"'), 'photo_variable=photo должен быть');
  ok(code.includes('"photo_variable": "passport_photo"'), 'photo_variable=passport_photo должен быть');
});

test('O06', 'message(photo input) c target на media-группу → синтаксис OK', () => {
  const p = makeProject([
    makePhotoInputMessageNode('msg_photo', 'gallery1', 'photo'),
    makeMediaNode('gallery1', ['https://ex.com/a.jpg', 'https://ex.com/b.jpg']),
  ]);
  syntax(gen(p, 'o06'), 'o06');
});

// ─────────────────────────────────────────────────────────────────────────────
// БЛОК P: Изоляция handler-ов и границы узлов
// ─────────────────────────────────────────────────────────────────────────────

console.log('── Блок P: Изоляция handler-ов и границы узлов ───────────────────');

test('P01', 'handler m1 не содержит URL из m2', () => {
  const code = gen(makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
    makeMediaNode('m2', ['https://ex.com/b.mp4']),
  ]), 'p01');
  const h1 = getHandlerBlock(code, 'm1');
  ok(h1.includes('https://ex.com/a.jpg'), 'handler m1 должен содержать свой URL');
  ok(!h1.includes('https://ex.com/b.mp4'), 'handler m1 не должен содержать URL из m2');
});

test('P02', 'handler remote media не содержит upload helper даже если другой узел использует /uploads/', () => {
  const code = gen(makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
    makeMediaNode('m2', ['/uploads/b.jpg']),
  ]), 'p02');
  const h1 = getHandlerBlock(code, 'm1');
  ok(!h1.includes('get_upload_file_path'), 'remote handler не должен содержать get_upload_file_path');
  ok(!h1.includes('FSInputFile'), 'remote handler не должен содержать FSInputFile');
});

test('P03', 'для двух media-нод каждая имеет свой @@NODE_START и @@NODE_END ровно по одному разу', () => {
  const code = gen(makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
    makeMediaNode('m2', ['https://ex.com/b.jpg']),
  ]), 'p03');
  ok((code.match(/# @@NODE_START:m1@@/g) || []).length === 1, 'm1 должен иметь один @@NODE_START');
  ok((code.match(/# @@NODE_END:m1@@/g) || []).length === 1, 'm1 должен иметь один @@NODE_END');
  ok((code.match(/# @@NODE_START:m2@@/g) || []).length === 1, 'm2 должен иметь один @@NODE_START');
  ok((code.match(/# @@NODE_END:m2@@/g) || []).length === 1, 'm2 должен иметь один @@NODE_END');
});

test('P04', 'handler c автопереходом содержит fake_cb и target handler внутри своего блока', () => {
  const code = gen(makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg'], { enableAutoTransition: true, autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]), 'p04');
  const h1 = getHandlerBlock(code, 'm1');
  ok(h1.includes('fake_cb = FakeCallbackQuery'), 'fake_cb должен быть внутри handler');
  ok(h1.includes('handle_callback_msg1'), 'target handler должен быть внутри handler');
});

test('P05', 'handler медиагруппы содержит answer_media_group и не содержит одиночный answer_photo(', () => {
  const code = gen(makeProject([
    makeMediaNode('m1', ['https://ex.com/a.jpg', 'https://ex.com/b.jpg']),
  ]), 'p05');
  const h1 = getHandlerBlock(code, 'm1');
  ok(h1.includes('answer_media_group'), 'answer_media_group должен быть внутри handler');
  ok(!h1.includes('answer_photo('), 'одиночный answer_photo не должен быть внутри handler медиагруппы');
});

test('P06', 'handler пустой media-ноды содержит pass и не содержит answer_* вызовов', () => {
  const code = gen(makeProject([makeMediaNode('m1', [])]), 'p06');
  const h1 = getHandlerBlock(code, 'm1');
  ok(h1.includes('pass'), 'pass должен быть внутри handler пустой media-ноды');
  ok(!h1.includes('answer_photo('), 'answer_photo не должен быть внутри пустого handler');
  ok(!h1.includes('answer_media_group'), 'answer_media_group не должен быть внутри пустого handler');
});

function makeConditionBranch(operator: string, target = '', value = '', value2 = ''): any {
  return {
    id: `${operator}_${target || 'none'}`,
    label: operator,
    operator,
    value,
    value2,
    target,
  };
}

function makeConditionNode(id: string, variable: string, branches: any[]): any {
  return {
    id,
    type: 'condition',
    position: { x: 200, y: 0 },
    data: {
      variable,
      branches,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

console.log('── Блок Q: Регрессии condition → media ──────────────────────────');

test('Q01', 'schema parse сохраняет else-only condition без variable для command_trigger → media', () => {
  const project = parseProject(makeProject([
    makeTriggerNode('t1', '/start', 'cond1'),
    makeConditionNode('cond1', '', [makeConditionBranch('else', 'm1')]),
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
  ]));
  const code = gen(project, 'q01');
  ok(code.includes('async def handle_callback_cond1'), 'else-only condition должен пережить schema parse');
  ok(code.includes('await handle_callback_cond1(mock_callback)'), 'trigger должен вызывать condition handler');
});

test('Q02', 'else-only condition → media генерирует без NameError-подобной дыры', () => {
  const code = gen(makeProject([
    makeTriggerNode('t1', '/start', 'cond1'),
    makeConditionNode('cond1', '', [makeConditionBranch('else', 'm1')]),
    makeMediaNode('m1', ['https://ex.com/a.jpg']),
  ]), 'q02');
  const conditionHandler = getHandlerBlock(code, 'cond1');
  ok(conditionHandler.includes('if True:'), 'pass-through condition должен иметь unconditional branch');
  ok(conditionHandler.includes('await handle_callback_m1(callback_query)'), 'condition должен переходить в media handler');
  syntax(code, 'q02');
});

test('Q03', 'start → else-only condition → media-group → синтаксис OK', () => {
  const code = gen(makeProject([
    makeStartNode('start1'),
    makeConditionNode('cond1', '', [makeConditionBranch('else', 'gallery1')]),
    makeMediaNode('gallery1', ['https://ex.com/a.jpg', 'https://ex.com/b.jpg']),
  ]), 'q03');
  ok(code.includes('async def handle_callback_cond1'), 'condition handler должен быть в коде');
  ok(code.includes('answer_media_group'), 'media-group должна остаться рабочей после condition');
  syntax(code, 'q03');
});

test('Q04', 'schema parse сохраняет system operator is_admin в condition перед media', () => {
  const project = parseProject(makeProject([
    makeTriggerNode('t1', '/admin', 'cond_admin'),
    makeConditionNode('cond_admin', '', [
      makeConditionBranch('is_admin', 'm1'),
      makeConditionBranch('else', 'm2'),
    ]),
    makeMediaNode('m1', ['https://ex.com/admin.jpg']),
    makeMediaNode('m2', ['https://ex.com/user.jpg']),
  ]));
  const code = gen(project, 'q04');
  const conditionHandler = getHandlerBlock(code, 'cond_admin');
  ok(conditionHandler.includes('callback_query.from_user.id in ADMIN_IDS'), 'is_admin должен пережить schema parse');
  ok(conditionHandler.includes('await handle_callback_m1(callback_query)'), 'admin branch должен вести в m1');
  ok(conditionHandler.includes('await handle_callback_m2(callback_query)'), 'else branch должен вести в m2');
});

test('Q05', 'schema parse сохраняет is_subscribed в condition перед media', () => {
  const project = parseProject(makeProject([
    makeTriggerNode('t1', '/sub', 'cond_sub'),
    makeConditionNode('cond_sub', '', [
      makeConditionBranch('is_subscribed', 'm1', '@news_channel'),
      makeConditionBranch('else', 'm2'),
    ]),
    makeMediaNode('m1', ['https://ex.com/subscribed.jpg']),
    makeMediaNode('m2', ['https://ex.com/fallback.jpg']),
  ]));
  const code = gen(project, 'q05');
  const conditionHandler = getHandlerBlock(code, 'cond_sub');
  ok(conditionHandler.includes('await _is_user_subscribed("@news_channel")'), 'is_subscribed должен пережить schema parse');
  ok(conditionHandler.includes('await handle_callback_m1(callback_query)'), 'subscription branch должен вести в m1');
  ok(conditionHandler.includes('await handle_callback_m2(callback_query)'), 'else branch должен вести в m2');
});

test('Q06', 'condition is_not_subscribed → media генерирует валидный Python', () => {
  const code = gen(makeProject([
    makeTriggerNode('t1', '/nosub', 'cond_nosub'),
    makeConditionNode('cond_nosub', '', [
      makeConditionBranch('is_not_subscribed', 'm1', 'https://t.me/news_channel'),
      makeConditionBranch('else', 'm2'),
    ]),
    makeMediaNode('m1', ['https://ex.com/need_subscribe.jpg']),
    makeMediaNode('m2', ['https://ex.com/already_subscribed.jpg']),
  ]), 'q06');
  const conditionHandler = getHandlerBlock(code, 'cond_nosub');
  ok(conditionHandler.includes('not await _is_user_subscribed("https://t.me/news_channel")'), 'is_not_subscribed должен быть в коде');
  ok(conditionHandler.includes('return f"@{_slug}"'), 'нормализация ссылки должна быть в helper');
  ok(conditionHandler.includes('await handle_callback_m1(callback_query)'), 'ветка is_not_subscribed должна вести в media');
  syntax(code, 'q06');
});

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log(`\nИтого: ${passed}/${total} пройдено${failed > 0 ? `, ${failed} провалено` : ' ✅'}`);

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
}
