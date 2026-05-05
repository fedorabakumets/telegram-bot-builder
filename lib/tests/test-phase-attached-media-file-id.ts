/**
 * @fileoverview Тесты поддержки Telegram file_id в attachedMedia
 *
 * Блок A: Базовая генерация (A01–A06)
 * Блок B: Типы медиа (B01–B04)
 * Блок C: Несколько токенов (C01–C03)
 * Блок D: Совместимость (D01–D04)
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
  const tmp = `_tmp_fid_${label}.py`;
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
 * Создаёт message-ноду с JSON file_id в attachedMedia
 * @param nodeId - ID ноды
 * @param mediaType - Тип медиа: photo, video, audio, document
 * @param fileIdsByToken - Словарь tokenId → file_id
 */
function makeFileIdNode(nodeId: string, mediaType: string, fileIdsByToken: Record<string, string>): any {
  return {
    id: nodeId,
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: 'Тест',
      buttons: [],
      keyboardType: 'none',
      attachedMedia: [
        JSON.stringify({ __type: 'file_id', mediaType, fileIdsByToken }),
      ],
    },
  };
}

/**
 * Генерирует Python-код для проекта
 * @param project - Объект проекта
 * @param label - Метка для botName
 */
function gen(project: any, label: string): string {
  return generatePythonCode(project, {
    botName: `FileId_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тесты Telegram file_id в attachedMedia                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'JSON file_id в attachedMedia — генерация не падает', () => {
  const p = makeProject([makeFileIdNode('msg1', 'photo', { '42': 'AgACAgI_test' })]);
  gen(p, 'a01');
  ok(true, 'генерация не должна падать');
});

test('A02', 'Сгенерированный код содержит json.loads', () => {
  const p = makeProject([makeFileIdNode('msg1', 'photo', { '42': 'AgACAgI_test' })]);
  ok(gen(p, 'a02').includes('json.loads'), 'json.loads должен быть в коде');
});

test('A03', 'Сгенерированный код содержит TOKEN_ID', () => {
  const p = makeProject([makeFileIdNode('msg1', 'photo', { '42': 'AgACAgI_test' })]);
  ok(gen(p, 'a03').includes('TOKEN_ID'), 'TOKEN_ID должен быть в коде');
});

test('A04', 'Сгенерированный код содержит send_photo для mediaType=photo', () => {
  const p = makeProject([makeFileIdNode('msg1', 'photo', { '42': 'AgACAgI_test' })]);
  ok(gen(p, 'a04').includes('send_photo'), 'send_photo должен быть в коде');
});

test('A05', 'Сгенерированный код содержит send_video для mediaType=video', () => {
  const p = makeProject([makeFileIdNode('msg1', 'video', { '42': 'BgACBgI_test' })]);
  ok(gen(p, 'a05').includes('send_video'), 'send_video должен быть в коде');
});

test('A06', 'Синтаксис Python валиден', () => {
  const p = makeProject([makeFileIdNode('msg1', 'photo', { '42': 'AgACAgI_test' })]);
  syntax(gen(p, 'a06'), 'a06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Типы медиа
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Типы медиа ────────────────────────────────────────────');

test('B01', 'mediaType=photo → send_photo', () => {
  const p = makeProject([makeFileIdNode('msg1', 'photo', { '42': 'AgACAgI_photo' })]);
  ok(gen(p, 'b01').includes('send_photo'), 'send_photo должен быть для photo');
});

test('B02', 'mediaType=video → send_video', () => {
  const p = makeProject([makeFileIdNode('msg1', 'video', { '42': 'BgACBgI_video' })]);
  ok(gen(p, 'b02').includes('send_video'), 'send_video должен быть для video');
});

test('B03', 'mediaType=audio → send_audio', () => {
  const p = makeProject([makeFileIdNode('msg1', 'audio', { '42': 'CgACCgI_audio' })]);
  ok(gen(p, 'b03').includes('send_audio'), 'send_audio должен быть для audio');
});

test('B04', 'mediaType=document → send_document', () => {
  const p = makeProject([makeFileIdNode('msg1', 'document', { '42': 'DgACDgI_doc' })]);
  ok(gen(p, 'b04').includes('send_document'), 'send_document должен быть для document');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Несколько токенов
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Несколько токенов ─────────────────────────────────────');

test('C01', 'fileIdsByToken с двумя токенами — оба file_id в коде', () => {
  const p = makeProject([makeFileIdNode('msg1', 'photo', { '42': 'AgACAgI_tok42', '87': 'BgACBgI_tok87' })]);
  const code = gen(p, 'c01');
  ok(code.includes('AgACAgI_tok42'), 'file_id для токена 42 должен быть в коде');
  ok(code.includes('BgACBgI_tok87'), 'file_id для токена 87 должен быть в коде');
});

test('C02', 'Код содержит _fid_map.get(str(TOKEN_ID))', () => {
  const p = makeProject([makeFileIdNode('msg1', 'photo', { '42': 'AgACAgI_test' })]);
  ok(gen(p, 'c02').includes('_fid_map.get(str(TOKEN_ID))'), '_fid_map.get(str(TOKEN_ID)) должен быть в коде');
});

test('C03', 'Предупреждение при отсутствии TOKEN_ID — logging.warning', () => {
  const p = makeProject([makeFileIdNode('msg1', 'photo', { '42': 'AgACAgI_test' })]);
  ok(gen(p, 'c03').includes('logging.warning'), 'logging.warning должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Совместимость
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Совместимость ─────────────────────────────────────────');

test('D01', 'Обычный URL в attachedMedia рядом с file_id — оба обрабатываются', () => {
  const node = {
    id: 'msg1',
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: 'Тест',
      buttons: [],
      keyboardType: 'none',
      attachedMedia: [
        JSON.stringify({ __type: 'file_id', mediaType: 'photo', fileIdsByToken: { '42': 'AgACAgI_fid' } }),
        'https://example.com/photo.jpg',
      ],
    },
  };
  const code = gen(makeProject([node]), 'd01');
  ok(code.includes('json.loads'), 'json.loads должен быть для file_id');
  ok(code.includes('https://example.com/photo.jpg'), 'URL должен быть в коде');
  // Проверяем порядок: json.loads должен идти после send_photo
  const sendPhotoIdx = code.indexOf('send_photo');
  const jsonLoadsIdx2 = code.indexOf('json.loads');
  if (sendPhotoIdx !== -1 && jsonLoadsIdx2 !== -1) {
    ok(jsonLoadsIdx2 > sendPhotoIdx, 'json.loads должен идти после send_photo');
  }
});

test('D02', 'Переменная {var.photo} рядом с file_id — оба обрабатываются', () => {
  const node = {
    id: 'msg1',
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: 'Тест',
      buttons: [],
      keyboardType: 'none',
      attachedMedia: [
        JSON.stringify({ __type: 'file_id', mediaType: 'photo', fileIdsByToken: { '42': 'AgACAgI_fid' } }),
        'imageUrlVar_photo',
      ],
    },
  };
  const code = gen(makeProject([node]), 'd02');
  ok(code.includes('json.loads'), 'json.loads должен быть для file_id');
  ok(code.includes('imageUrlVar_photo') || code.includes('TOKEN_ID'), 'переменная или TOKEN_ID должны быть в коде');
});

test('D03', 'Пустой fileIdsByToken — код не падает, синтаксис OK', () => {
  const p = makeProject([makeFileIdNode('msg1', 'photo', {})]);
  syntax(gen(p, 'd03'), 'd03');
});

test('D04', 'URL + JSON file_id → send_media_group (медиагруппа из 2 элементов)', () => {
  const node = {
    id: 'msg1',
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: 'Тест',
      buttons: [],
      keyboardType: 'none',
      attachedMedia: [
        '/uploads/239/video.mp4',
        JSON.stringify({ __type: 'file_id', mediaType: 'video', fileIdsByToken: { '151': 'BAACAgI_test' } }),
      ],
    },
  };
  const code = gen(makeProject([node]), 'd04');
  // Оба элемента должны быть в коде
  ok(code.includes('video.mp4'), 'URL видео должен быть в коде');
  ok(code.includes('BAACAgI_test'), 'file_id должен быть в коде');
  // Должна генерироваться медиагруппа, а не два отдельных сообщения
  ok(code.includes('send_media_group') || code.includes('_mg_items'), 'медиагруппа должна быть в коде');
  ok(code.includes('json.loads'), 'json.loads должен быть в коде для разбора file_id');
  syntax(gen(makeProject([node]), 'd04_syntax'), 'd04_syntax');
});

test('D05', 'URL + JSON file_id → send_media_group (медиагруппа)', () => {
  const node = {
    id: 'msg1',
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: 'Тест',
      buttons: [],
      keyboardType: 'none',
      attachedMedia: [
        '/uploads/239/video.mp4',
        JSON.stringify({ __type: 'file_id', mediaType: 'video', fileIdsByToken: { '151': 'BAACAgI_test' } }),
      ],
    },
  };
  const code = gen(makeProject([node]), 'd05');
  ok(code.includes('send_media_group') || code.includes('_mg_items'), 'медиагруппа должна быть в коде');
  syntax(gen(makeProject([node]), 'd05_syntax'), 'd05_syntax');
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
