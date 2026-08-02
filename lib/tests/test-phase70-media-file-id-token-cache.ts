/**
 * @fileoverview Фазовый тест: runtime-кэш file_id через media_file_tokens (per TOKEN_ID).
 *
 * Блок A: хелперы load/save/invalidate в сгенерированном коде
 * Блок B: message video/photo — save + invalidate+retry
 * Блок C: media-node — save + invalidate
 * Блок D: нет legacy load SELECT url, telegram_file_id без join
 * Блок E: синтаксис Python
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
 * Проверяет условие
 * @param cond - Условие
 * @param msg - Сообщение об ошибке
 */
function ok(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

/**
 * Проверяет синтаксис Python
 * @param code - Код
 * @param label - Метка
 */
function syntax(code: string, label: string): void {
  const tmp = `_tmp_mft_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
  } catch (e: any) {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    throw new Error(`Синтаксическая ошибка:\n${e.stderr?.toString() ?? String(e)}`);
  }
}

/**
 * Минимальный project.json
 * @param nodes - Ноды
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
 * Message-нода с локальным видео
 * @param id - ID
 * @param videoUrl - URL
 */
function makeVideoNode(id: string, videoUrl: string): any {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: 'Видео',
      buttons: [],
      keyboardType: 'none',
      markdown: false,
      adminOnly: false,
      showInMenu: false,
      requiresAuth: false,
      isPrivateOnly: false,
      resizeKeyboard: true,
      oneTimeKeyboard: false,
      enableStatistics: false,
      videoUrl,
      attachedMedia: [videoUrl],
    },
  };
}

/**
 * Message-нода с локальным фото
 * @param id - ID
 * @param imageUrl - URL
 */
function makePhotoNode(id: string, imageUrl: string): any {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: 'Фото',
      buttons: [],
      keyboardType: 'none',
      markdown: false,
      adminOnly: false,
      showInMenu: false,
      requiresAuth: false,
      isPrivateOnly: false,
      resizeKeyboard: true,
      oneTimeKeyboard: false,
      enableStatistics: false,
      imageUrl,
      attachedMedia: [imageUrl],
    },
  };
}

/**
 * Media-нода с локальным файлом
 * @param id - ID
 * @param url - URL
 */
function makeMediaNode(id: string, url: string): any {
  return {
    id,
    type: 'media',
    position: { x: 0, y: 0 },
    data: {
      messageText: '',
      buttons: [],
      keyboardType: 'none',
      markdown: false,
      adminOnly: false,
      showInMenu: false,
      requiresAuth: false,
      isPrivateOnly: false,
      resizeKeyboard: true,
      oneTimeKeyboard: false,
      enableStatistics: false,
      attachedMedia: [url],
    },
  };
}

const VIDEO = '/uploads/1/2026-04-18/demo-video.mp4';
const PHOTO = '/uploads/1/2026-04-18/demo-photo.jpg';

console.log('\n📋 Phase 70: media_file_tokens runtime cache\n');

let codeVideo = '';
let codePhoto = '';
let codeMedia = '';

test('A01', 'Генерация video message с projectId', () => {
  codeVideo = generatePythonCode(makeProject([makeVideoNode('v1', VIDEO)]), {
    projectId: 1,
    userDatabaseEnabled: true,
  } as any);
  ok(codeVideo.length > 1000, 'код слишком короткий');
});

test('A02', 'Есть _load_media_file_id_cache и media_file_tokens в load', () => {
  ok(codeVideo.includes('_load_media_file_id_cache'), 'нет _load_media_file_id_cache');
  ok(codeVideo.includes('media_file_tokens'), 'нет media_file_tokens');
  ok(codeVideo.includes('mft.token_id'), 'load не фильтрует по token_id');
  ok(codeVideo.includes('TOKEN_ID'), 'нет TOKEN_ID');
});

test('A03', 'Есть _save_media_file_id и upsert media_file_tokens', () => {
  ok(codeVideo.includes('_save_media_file_id'), 'нет _save_media_file_id');
  ok(codeVideo.includes('INSERT INTO media_file_tokens'), 'нет INSERT INTO media_file_tokens');
  ok(codeVideo.includes('ON CONFLICT (media_file_id, token_id)'), 'нет upsert по media_file_id, token_id');
});

test('A04', 'Есть _invalidate_media_file_id и _is_wrong_file_id_error', () => {
  ok(codeVideo.includes('_invalidate_media_file_id'), 'нет invalidate');
  ok(codeVideo.includes('_is_wrong_file_id_error'), 'нет _is_wrong_file_id_error');
  ok(codeVideo.includes('wrong file identifier'), 'нет проверки wrong file identifier');
});

test('B01', 'Video: retry после невалидного file_id', () => {
  ok(codeVideo.includes('await _invalidate_media_file_id'), 'нет вызова invalidate');
  ok(codeVideo.includes('переотправка'), 'нет лога переотправки');
});

test('B02', 'Video: save через хелпер, не голый UPDATE media_files без tokens', () => {
  ok(codeVideo.includes('await _save_media_file_id'), 'нет вызова _save_media_file_id');
  const legacyLoad =
    /SELECT url, telegram_file_id FROM media_files WHERE project_id = \$1 AND telegram_file_id IS NOT NULL/.test(
      codeVideo,
    );
  ok(!legacyLoad, 'остался legacy load без media_file_tokens');
});

test('B03', 'Photo message: helpers + retry', () => {
  codePhoto = generatePythonCode(makeProject([makePhotoNode('p1', PHOTO)]), {
    projectId: 1,
    userDatabaseEnabled: true,
  } as any);
  ok(codePhoto.includes('_save_media_file_id'), 'photo: нет save');
  ok(codePhoto.includes('_invalidate_media_file_id'), 'photo: нет invalidate');
  ok(codePhoto.includes('media_file_tokens'), 'photo: нет media_file_tokens');
});

test('C01', 'Media-node: save + invalidate', () => {
  codeMedia = generatePythonCode(makeProject([makeMediaNode('m1', VIDEO)]), {
    projectId: 1,
    userDatabaseEnabled: true,
  } as any);
  ok(codeMedia.includes('_save_media_file_id'), 'media-node: нет save');
  ok(codeMedia.includes('_invalidate_media_file_id'), 'media-node: нет invalidate');
  ok(codeMedia.includes('_sent_via_cache'), 'media-node: нет _sent_via_cache');
});

test('D01', 'Старт вызывает await _load_media_file_id_cache()', () => {
  ok(codeVideo.includes('await _load_media_file_id_cache()'), 'нет вызова load при старте');
});

test('E01', 'Синтаксис Python: video', () => {
  syntax(codeVideo, 'video');
});

test('E02', 'Синтаксис Python: photo', () => {
  syntax(codePhoto, 'photo');
});

test('E03', 'Синтаксис Python: media-node', () => {
  syntax(codeMedia, 'media');
});

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
console.log(`\n📊 Phase 70: ${passed}/${results.length} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
