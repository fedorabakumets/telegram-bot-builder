/**
 * @fileoverview Тесты обложки видео (thumbnail)
 *
 * Блок A: message-нода — thumbnailFileIds (file_id обложки)
 * Блок B: message-нода — thumbnailUrls (прямой URL обложки)
 * Блок C: message-нода — FSInputFile обложки (/uploads/)
 * Блок D: media-нода — thumbnailFileIds
 * Блок E: media-нода — thumbnailUrls
 * Блок F: Приоритет thumbnailFileIds над thumbnailUrls
 * Блок G: Обложка не установлена — лог "не установлена"
 * Блок H: Синтаксис Python — все варианты
 * Блок I: Обложка только для видео, не для других типов
 * Блок J: attachedMediaThumbnails в нодах project.json (fallback)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Результат одного теста */
type TestResult = { id: string; name: string; passed: boolean; note: string };
const results: TestResult[] = [];

/**
 * Запускает тест и записывает результат
 * @param id - Идентификатор теста
 * @param name - Название теста
 * @param fn - Тело теста
 */
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

/**
 * Проверяет условие, бросает ошибку если false
 * @param cond - Условие
 * @param msg - Сообщение об ошибке
 */
function ok(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

/**
 * Проверяет синтаксис Python через py_compile
 * @param code - Python-код
 * @param label - Метка для временного файла
 */
function syntax(code: string, label: string): void {
  const tmp = `_tmp_thumb_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
  } catch (e: any) {
    try { fs.unlinkSync(tmp); } catch {}
    throw new Error(`Синтаксическая ошибка:\n${e.stderr?.toString() ?? String(e)}`);
  }
}

/**
 * Создаёт минимальный проект с одной нодой
 * @param nodes - Массив нод
 */
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

/**
 * Создаёт message-ноду с видео
 * @param id - ID ноды
 * @param videoUrl - URL видео
 * @param isLocal - Является ли путь локальным /uploads/
 */
function makeVideoMessageNode(id: string, videoUrl: string, isLocal = false): any {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: 'Видео',
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      videoUrl,
      isLocalVideoUrl: isLocal,
    },
  };
}

/**
 * Создаёт media-ноду с видео
 * @param id - ID ноды
 * @param videoUrl - URL видео
 */
function makeVideoMediaNode(id: string, videoUrl: string): any {
  return {
    id,
    type: 'media',
    position: { x: 0, y: 0 },
    data: {
      attachedMedia: [videoUrl],
      enableAutoTransition: false,
      autoTransitionTo: '',
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 * Генерирует код с опциями обложки
 */
function gen(project: any, label: string, opts: {
  thumbnailFileIds?: Record<string, string>;
  thumbnailUrls?: Record<string, string>;
} = {}): string {
  return generatePythonCode(project, {
    botName: `Thumb_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
    ...opts,
  });
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тесты обложки видео (thumbnail)                            ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: message-нода — thumbnailFileIds (file_id обложки)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: message-нода — thumbnailFileIds ───────────────────────');

test('A01', 'thumbnail= добавляется в send_video при наличии thumbnailFileIds', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  const code = gen(p, 'a01', { thumbnailFileIds: { '/uploads/v.mp4': 'AgACBQADthumb1' } });
  ok(code.includes('thumbnail='), 'thumbnail= должен быть в send_video');
  ok(code.includes('AgACBQADthumb1'), 'file_id обложки должен быть в коде');
});

test('A02', 'лог 🖼 обложка через file_id присутствует', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  const code = gen(p, 'a02', { thumbnailFileIds: { '/uploads/v.mp4': 'AgACBQADthumb1' } });
  ok(code.includes('обложка через file_id'), 'лог обложки через file_id должен быть');
});

test('A03', 'синтаксис OK — send_video с thumbnail file_id', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  const code = gen(p, 'a03', { thumbnailFileIds: { '/uploads/v.mp4': 'AgACBQADthumb1' } });
  syntax(code, 'a03');
});

test('A04', 'thumbnail= для URL-видео с thumbnailFileIds', () => {
  const p = makeProject([makeVideoMessageNode('msg1', 'https://ex.com/v.mp4', false)]);
  const code = gen(p, 'a04', { thumbnailFileIds: { 'https://ex.com/v.mp4': 'AgACBQADthumb2' } });
  ok(code.includes('thumbnail='), 'thumbnail= должен быть');
  ok(code.includes('AgACBQADthumb2'), 'file_id обложки должен быть');
  syntax(code, 'a04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: message-нода — thumbnailUrls (внешний URL обложки)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: message-нода — thumbnailUrls (внешний URL) ────────────');

test('B01', 'thumbnail= с внешним URL обложки', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  const code = gen(p, 'b01', { thumbnailUrls: { '/uploads/v.mp4': 'https://ex.com/thumb.jpg' } });
  ok(code.includes('thumbnail='), 'thumbnail= должен быть');
  ok(code.includes('https://ex.com/thumb.jpg'), 'URL обложки должен быть в коде');
});

test('B02', 'лог 🖼 обложка через URL присутствует', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  const code = gen(p, 'b02', { thumbnailUrls: { '/uploads/v.mp4': 'https://ex.com/thumb.jpg' } });
  ok(code.includes('обложка через URL'), 'лог обложки через URL должен быть');
});

test('B03', 'синтаксис OK — send_video с thumbnail URL', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  const code = gen(p, 'b03', { thumbnailUrls: { '/uploads/v.mp4': 'https://ex.com/thumb.jpg' } });
  syntax(code, 'b03');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: message-нода — FSInputFile обложки (/uploads/)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: message-нода — FSInputFile обложки (/uploads/) ────────');

test('C01', 'thumbnail=FSInputFile для локального пути обложки', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  const code = gen(p, 'c01', { thumbnailUrls: { '/uploads/v.mp4': '/uploads/238/thumb.jpg' } });
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть для /uploads/ обложки');
  ok(code.includes('/uploads/238/thumb.jpg'), 'путь обложки должен быть в коде');
});

test('C02', 'лог 🖼 обложка через FSInputFile присутствует', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  const code = gen(p, 'c02', { thumbnailUrls: { '/uploads/v.mp4': '/uploads/238/thumb.jpg' } });
  ok(code.includes('обложка через FSInputFile'), 'лог FSInputFile обложки должен быть');
});

test('C03', 'синтаксис OK — send_video с thumbnail FSInputFile', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  const code = gen(p, 'c03', { thumbnailUrls: { '/uploads/v.mp4': '/uploads/238/thumb.jpg' } });
  syntax(code, 'c03');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: media-нода — thumbnailFileIds
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: media-нода — thumbnailFileIds ─────────────────────────');

test('D01', 'thumbnail= в answer_video для media-ноды с thumbnailFileIds', () => {
  const p = makeProject([makeVideoMediaNode('m1', '/uploads/v.mp4')]);
  const code = gen(p, 'd01', { thumbnailFileIds: { '/uploads/v.mp4': 'AgACBQADthumb3' } });
  ok(code.includes('thumbnail=') || code.includes('AgACBQADthumb3'), 'thumbnail должен быть в answer_video');
});

test('D02', 'синтаксис OK — media-нода с thumbnail file_id', () => {
  const p = makeProject([makeVideoMediaNode('m1', '/uploads/v.mp4')]);
  const code = gen(p, 'd02', { thumbnailFileIds: { '/uploads/v.mp4': 'AgACBQADthumb3' } });
  syntax(code, 'd02');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: media-нода — thumbnailUrls
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: media-нода — thumbnailUrls ────────────────────────────');

test('E01', 'thumbnail= в answer_video для media-ноды с thumbnailUrls (/uploads/)', () => {
  const p = makeProject([makeVideoMediaNode('m1', '/uploads/v.mp4')]);
  const code = gen(p, 'e01', { thumbnailUrls: { '/uploads/v.mp4': '/uploads/238/thumb.jpg' } });
  ok(code.includes('thumbnail=') || code.includes('/uploads/238/thumb.jpg'), 'thumbnail должен быть');
});

test('E02', 'синтаксис OK — media-нода с thumbnail URL', () => {
  const p = makeProject([makeVideoMediaNode('m1', '/uploads/v.mp4')]);
  const code = gen(p, 'e02', { thumbnailUrls: { '/uploads/v.mp4': 'https://ex.com/thumb.jpg' } });
  syntax(code, 'e02');
});

test('E03', 'синтаксис OK — media-нода с thumbnail FSInputFile', () => {
  const p = makeProject([makeVideoMediaNode('m1', '/uploads/v.mp4')]);
  const code = gen(p, 'e03', { thumbnailUrls: { '/uploads/v.mp4': '/uploads/238/thumb.jpg' } });
  syntax(code, 'e03');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Приоритет thumbnailFileIds над thumbnailUrls
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Приоритет thumbnailFileIds над thumbnailUrls ──────────');

test('F01', 'thumbnailFileIds имеет приоритет над thumbnailUrls', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  const code = gen(p, 'f01', {
    thumbnailFileIds: { '/uploads/v.mp4': 'AgACBQADpriority' },
    thumbnailUrls: { '/uploads/v.mp4': 'https://ex.com/ignored.jpg' },
  });
  ok(code.includes('AgACBQADpriority'), 'file_id должен быть в коде');
  ok(!code.includes('ignored.jpg'), 'URL обложки не должен быть при наличии file_id');
});

test('F02', 'синтаксис OK — оба словаря переданы', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  const code = gen(p, 'f02', {
    thumbnailFileIds: { '/uploads/v.mp4': 'AgACBQADpriority' },
    thumbnailUrls: { '/uploads/v.mp4': 'https://ex.com/ignored.jpg' },
  });
  syntax(code, 'f02');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Обложка не установлена — лог "не установлена"
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Обложка не установлена ────────────────────────────────');

test('G01', 'лог "обложка не установлена" при отсутствии thumbnailFileIds и thumbnailUrls', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  const code = gen(p, 'g01');
  ok(code.includes('обложка не установлена'), 'лог "не установлена" должен быть');
});

test('G02', 'thumbnail= НЕ добавляется если обложка не установлена', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  const code = gen(p, 'g02');
  ok(!code.includes('thumbnail='), 'thumbnail= НЕ должен быть без обложки');
});

test('G03', 'синтаксис OK — видео без обложки', () => {
  const p = makeProject([makeVideoMessageNode('msg1', '/uploads/v.mp4', true)]);
  syntax(gen(p, 'g03'), 'g03');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Синтаксис Python — все варианты
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Синтаксис Python — все варианты ───────────────────────');

test('H01', 'синтаксис OK — URL-видео + thumbnail file_id', () => {
  const p = makeProject([makeVideoMessageNode('msg1', 'https://ex.com/v.mp4', false)]);
  syntax(gen(p, 'h01', { thumbnailFileIds: { 'https://ex.com/v.mp4': 'AgACBQADthumb' } }), 'h01');
});

test('H02', 'синтаксис OK — URL-видео + thumbnail URL', () => {
  const p = makeProject([makeVideoMessageNode('msg1', 'https://ex.com/v.mp4', false)]);
  syntax(gen(p, 'h02', { thumbnailUrls: { 'https://ex.com/v.mp4': 'https://ex.com/t.jpg' } }), 'h02');
});

test('H03', 'синтаксис OK — несколько видео с разными обложками', () => {
  const p = makeProject([
    makeVideoMessageNode('msg1', '/uploads/v1.mp4', true),
    makeVideoMessageNode('msg2', '/uploads/v2.mp4', true),
  ]);
  syntax(gen(p, 'h03', {
    thumbnailFileIds: { '/uploads/v1.mp4': 'AgACBQADthumbA' },
    thumbnailUrls: { '/uploads/v2.mp4': '/uploads/238/thumb2.jpg' },
  }), 'h03');
});

test('H04', 'синтаксис OK — media-нода + message-нода с обложками', () => {
  const p = makeProject([
    makeVideoMediaNode('m1', '/uploads/v1.mp4'),
    makeVideoMessageNode('msg1', '/uploads/v2.mp4', true),
  ]);
  syntax(gen(p, 'h04', {
    thumbnailFileIds: { '/uploads/v1.mp4': 'AgACBQADthumbM' },
    thumbnailUrls: { '/uploads/v2.mp4': '/uploads/238/thumb.jpg' },
  }), 'h04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: Обложка только для видео, не для других типов
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: Обложка только для видео ──────────────────────────────');

test('I01', 'thumbnail= НЕ добавляется для фото', () => {
  const p = makeProject([{
    id: 'msg1', type: 'message', position: { x: 0, y: 0 },
    data: { messageText: 'Фото', buttons: [], keyboardType: 'none', formatMode: 'none',
      imageUrl: '/uploads/photo.jpg', isLocalImageUrl: true },
  }]);
  const code = gen(p, 'i01', { thumbnailFileIds: { '/uploads/photo.jpg': 'AgACBQADthumb' } });
  ok(!code.includes('thumbnail='), 'thumbnail= НЕ должен быть для фото');
});

test('I02', 'thumbnail= НЕ добавляется для аудио', () => {
  const p = makeProject([{
    id: 'msg1', type: 'message', position: { x: 0, y: 0 },
    data: { messageText: 'Аудио', buttons: [], keyboardType: 'none', formatMode: 'none',
      audioUrl: '/uploads/audio.mp3', isLocalAudioUrl: true },
  }]);
  const code = gen(p, 'i02', { thumbnailFileIds: { '/uploads/audio.mp3': 'AgACBQADthumb' } });
  ok(!code.includes('thumbnail='), 'thumbnail= НЕ должен быть для аудио');
});

test('I03', 'thumbnail= НЕ добавляется для документа', () => {
  const p = makeProject([{
    id: 'msg1', type: 'message', position: { x: 0, y: 0 },
    data: { messageText: 'Документ', buttons: [], keyboardType: 'none', formatMode: 'none',
      documentUrl: '/uploads/doc.pdf', isLocalDocumentUrl: true },
  }]);
  const code = gen(p, 'i03', { thumbnailFileIds: { '/uploads/doc.pdf': 'AgACBQADthumb' } });
  ok(!code.includes('thumbnail='), 'thumbnail= НЕ должен быть для документа');
});

test('I04', 'thumbnail= НЕ добавляется для фото в media-ноде', () => {
  const p = makeProject([{
    id: 'm1', type: 'media', position: { x: 0, y: 0 },
    data: { attachedMedia: ['/uploads/photo.jpg'], enableAutoTransition: false,
      autoTransitionTo: '', buttons: [], keyboardType: 'none' },
  }]);
  const code = gen(p, 'i04', { thumbnailFileIds: { '/uploads/photo.jpg': 'AgACBQADthumb' } });
  ok(!code.includes('thumbnail='), 'thumbnail= НЕ должен быть для фото в media-ноде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: attachedMediaThumbnails в нодах project.json (fallback)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: attachedMediaThumbnails в нодах project.json ──────────');

/**
 * Создаёт media-ноду с видео и обложкой в attachedMediaThumbnails
 * @param id - ID ноды
 * @param videoUrl - URL видео
 * @param thumbUrl - URL обложки
 */
function makeVideoMediaNodeWithThumbnail(id: string, videoUrl: string, thumbUrl: string): any {
  return {
    id,
    type: 'media',
    position: { x: 0, y: 0 },
    data: {
      attachedMedia: [videoUrl],
      attachedMediaThumbnails: { [videoUrl]: thumbUrl },
      enableAutoTransition: false,
      autoTransitionTo: '',
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 * Создаёт message-ноду с видео и обложкой в attachedMediaThumbnails
 * @param id - ID ноды
 * @param videoUrl - URL видео
 * @param thumbUrl - URL обложки
 * @param isLocal - Является ли путь локальным /uploads/
 */
function makeVideoMessageNodeWithThumbnail(id: string, videoUrl: string, thumbUrl: string, isLocal = false): any {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: 'Видео',
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      videoUrl,
      isLocalVideoUrl: isLocal,
      attachedMediaThumbnails: { [videoUrl]: thumbUrl },
    },
  };
}

/**
 * Извлекает attachedMediaThumbnails из нод проекта (симуляция generateCode.ts)
 * @param project - Объект проекта
 * @returns Словарь URL видео → URL обложки
 */
function extractNodeThumbnails(project: any): Record<string, string> {
  const result: Record<string, string> = {};
  const sheets = project.sheets ?? [];
  for (const sheet of sheets) {
    for (const node of (sheet.nodes ?? [])) {
      const thumbs = node?.data?.attachedMediaThumbnails;
      if (!thumbs) continue;
      for (const [videoUrl, thumbUrl] of Object.entries(thumbs)) {
        if (typeof thumbUrl === 'string') result[videoUrl] = thumbUrl;
      }
    }
  }
  return result;
}

test('J01', 'attachedMediaThumbnails из media-ноды используется как thumbnailUrls', () => {
  const p = makeProject([makeVideoMediaNodeWithThumbnail('m1', '/uploads/v.mp4', '/uploads/238/thumb.jpg')]);
  const thumbnailUrls = extractNodeThumbnails(p);
  const code = gen(p, 'j01', { thumbnailUrls });
  ok(code.includes('thumbnail='), 'thumbnail= должен быть в коде');
});

test('J02', 'attachedMediaThumbnails из message-ноды используется как thumbnailUrls', () => {
  const p = makeProject([makeVideoMessageNodeWithThumbnail('msg1', '/uploads/v.mp4', 'https://ex.com/thumb.jpg', true)]);
  const thumbnailUrls = extractNodeThumbnails(p);
  const code = gen(p, 'j02', { thumbnailUrls });
  ok(code.includes('thumbnail='), 'thumbnail= должен быть в коде');
  ok(code.includes('https://ex.com/thumb.jpg'), 'URL обложки должен быть в коде');
});

test('J03', 'thumbnailFileIds из БД имеет приоритет над attachedMediaThumbnails', () => {
  const p = makeProject([makeVideoMediaNodeWithThumbnail('m1', '/uploads/v.mp4', 'https://ex.com/ignored.jpg')]);
  const nodeThumbs = extractNodeThumbnails(p);
  const code = gen(p, 'j03', {
    thumbnailFileIds: { '/uploads/v.mp4': 'AgACBQADpriority' },
    thumbnailUrls: nodeThumbs,
  });
  ok(code.includes('AgACBQADpriority'), 'file_id из БД должен быть в коде');
  ok(!code.includes('ignored.jpg'), 'URL из ноды не должен быть при наличии file_id');
});

test('J04', 'thumbnailUrls из БД имеет приоритет над attachedMediaThumbnails', () => {
  const p = makeProject([makeVideoMediaNodeWithThumbnail('m1', '/uploads/v.mp4', 'https://ex.com/ignored.jpg')]);
  const code = gen(p, 'j04', {
    thumbnailUrls: { '/uploads/v.mp4': 'https://ex.com/db-thumb.jpg' },
  });
  ok(code.includes('db-thumb.jpg'), 'URL обложки из БД должен быть в коде');
  ok(!code.includes('ignored.jpg'), 'URL из ноды не должен быть при наличии URL из БД');
});

test('J05', 'несколько нод с разными attachedMediaThumbnails — синтаксис OK', () => {
  const p = makeProject([
    makeVideoMediaNodeWithThumbnail('m1', '/uploads/v1.mp4', '/uploads/238/thumb1.jpg'),
    makeVideoMediaNodeWithThumbnail('m2', '/uploads/v2.mp4', '/uploads/238/thumb2.jpg'),
  ]);
  const thumbnailUrls = extractNodeThumbnails(p);
  syntax(gen(p, 'j05', { thumbnailUrls }), 'j05');
});

test('J06', 'синтаксис OK — media-нода с attachedMediaThumbnails FSInputFile', () => {
  const p = makeProject([makeVideoMediaNodeWithThumbnail('m1', '/uploads/v.mp4', '/uploads/238/thumb.jpg')]);
  const thumbnailUrls = extractNodeThumbnails(p);
  syntax(gen(p, 'j06', { thumbnailUrls }), 'j06');
});

test('J07', 'attachedMediaThumbnails пустой словарь — thumbnail не добавляется', () => {
  const node = makeVideoMediaNodeWithThumbnail('m1', '/uploads/v.mp4', '');
  node.data.attachedMediaThumbnails = {};
  const p = makeProject([node]);
  const thumbnailUrls = extractNodeThumbnails(p);
  ok(Object.keys(thumbnailUrls).length === 0, 'extractNodeThumbnails должен вернуть {}');
  const code = gen(p, 'j07');
  ok(!code.includes('thumbnail='), 'thumbnail= НЕ должен быть без обложки');
});

// ════════════════════════════════════════════════════════════════════════════
// Итоги
// ════════════════════════════════════════════════════════════════════════════

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
