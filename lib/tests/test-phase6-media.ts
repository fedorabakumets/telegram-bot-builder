/**
 * @fileoverview Фаза 6 — Медиа — JSON-мутации
 *
 * Блок A: Sticker — file_id, URL, stickerSetName, mediaCaption, disableNotification
 * Блок B: Voice — voiceUrl, mediaCaption, mediaDuration, disableNotification
 * Блок C: Animation — внешний URL, /uploads/ путь, пустой URL, кастомный отступ
 * Блок D: message с imageUrl — задан/пустой, спецсимволы, /uploads/ путь
 * Блок E: message с videoUrl
 * Блок F: message с audioUrl
 * Блок G: message с documentUrl
 * Блок H: attachedMedia — один файл, несколько, пустой массив, imageUrlVar/videoUrlVar/audioUrlVar/documentUrlVar
 * Блок I: start-узел с медиа (imageUrl, videoUrl, audioUrl, documentUrl)
 * Блок J: command-узел с медиа
 * Блок K: Комбинации — imageUrl + attachedMedia, все медиа одновременно, mediaCaption со спецсимволами
 * Блок L: Граничные случаи — URL со спецсимволами, очень длинный URL, пустые строки, disableNotification
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Константы ───────────────────────────────────────────────────────────────

const PROJECT_PATH = 'bots/импортированный_проект_1723_60_53/project.json';
const BASE = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf-8'));

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

/** Патчит start-узел (nodes[0]) */
function patchStart(patch: Record<string, unknown>) {
  const p = clone(BASE);
  Object.assign(p.sheets[0].nodes[0].data, patch);
  return p;
}

/** Патчит message-узел (nodes[1]), очищает attachedMedia в start-узле чтобы не мешал проверкам */
function patchMsg(patch: Record<string, unknown>) {
  const p = clone(BASE);
  // Очищаем attachedMedia в start-узле чтобы он не генерировал медиа-код
  p.sheets[0].nodes[0].data.attachedMedia = [];
  p.sheets[0].nodes[0].data.imageUrl = '';
  p.sheets[0].nodes[0].data.videoUrl = '';
  p.sheets[0].nodes[0].data.audioUrl = '';
  p.sheets[0].nodes[0].data.documentUrl = '';
  Object.assign(p.sheets[0].nodes[1].data, patch);
  return p;
}

/** Добавляет новый узел заданного типа */
function addNode(type: string, data: Record<string, unknown>) {
  const p = clone(BASE);
  p.sheets[0].nodes.push({
    id: `test_${type}_node`,
    type,
    position: { x: 0, y: 0 },
    data,
  });
  return p;
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase6_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

function genDB(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase6DB_${label}`,
    userDatabaseEnabled: true,
    enableComments: false,
  });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p6_${label}.py`;
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

// ─── Раннер ──────────────────────────────────────────────────────────────────

type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

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

function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

// ─── Тесты ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║         Фаза 6 — Медиа (100+ тестов)                       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Sticker
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Sticker ───────────────────────────────────────────────');

test('A01', 'sticker: только stickerFileId → answer_sticker с file_id', () => {
  const code = gen(addNode('sticker', {
    stickerFileId: 'CAACAgQAAxkBAAIC_test123',
  }), 'a01');
  syntax(code, 'a01');
  ok(code.includes('CAACAgQAAxkBAAIC_test123'), 'file_id должен быть в коде');
  ok(code.includes('answer_sticker'), 'answer_sticker должен быть');
});

test('A02', 'sticker: только stickerUrl → загрузка через aiohttp', () => {
  const code = gen(addNode('sticker', {
    stickerUrl: 'https://example.com/sticker.webp',
  }), 'a02');
  syntax(code, 'a02');
  ok(code.includes('https://example.com/sticker.webp'), 'URL должен быть в коде');
  ok(code.includes('aiohttp'), 'должна быть загрузка через aiohttp');
  ok(code.includes('answer_sticker'), 'answer_sticker должен быть');
});

test('A03', 'sticker: stickerSetName без file_id и URL → отправка из набора', () => {
  const code = gen(addNode('sticker', {
    stickerSetName: 'MyAwesomePack',
  }), 'a03');
  syntax(code, 'a03');
  ok(code.includes('MyAwesomePack'), 'stickerSetName должен быть в коде');
  ok(code.includes('answer_sticker'), 'answer_sticker должен быть');
});

test('A04', 'sticker: mediaCaption → caption в коде', () => {
  const code = gen(addNode('sticker', {
    stickerFileId: 'CAACtest',
    mediaCaption: 'Привет от стикера!',
  }), 'a04');
  syntax(code, 'a04');
  ok(code.includes('Привет от стикера!'), 'caption должен быть в коде');
  ok(code.includes('caption=caption'), 'caption= должен передаваться');
});

test('A05', 'sticker: disableNotification:true → disable_notification=True', () => {
  const code = gen(addNode('sticker', {
    stickerFileId: 'CAACtest',
    disableNotification: true,
  }), 'a05');
  syntax(code, 'a05');
  ok(code.includes('disable_notification=True'), 'disable_notification=True должен быть');
});

test('A06', 'sticker: disableNotification:false → нет disable_notification', () => {
  const code = gen(addNode('sticker', {
    stickerFileId: 'CAACtest',
    disableNotification: false,
  }), 'a06');
  syntax(code, 'a06');
  ok(!code.includes('disable_notification=True'), 'disable_notification не должен быть при false');
});

test('A07', 'sticker: пустые поля → "Стикер не настроен"', () => {
  const code = gen(addNode('sticker', {}), 'a07');
  syntax(code, 'a07');
  ok(code.includes('Стикер не настроен'), 'fallback должен быть');
});

test('A08', 'sticker: mediaCaption со спецсимволами Python', () => {
  const code = gen(addNode('sticker', {
    stickerFileId: 'CAACtest',
    mediaCaption: 'Привет "мир"! \\n Новая строка',
  }), 'a08');
  syntax(code, 'a08');
  ok(code.includes('answer_sticker'), 'answer_sticker должен быть');
});

test('A09', 'sticker: file_id приоритетнее URL', () => {
  const code = gen(addNode('sticker', {
    stickerFileId: 'CAACtest_fileid',
    stickerUrl: 'https://example.com/sticker.webp',
  }), 'a09');
  syntax(code, 'a09');
  ok(code.includes('CAACtest_fileid'), 'file_id должен быть');
  // В блоке sticker-обработчика file_id должен быть, aiohttp для sticker — нет
  const stickerHandlerStart = code.indexOf('handle_sticker_test_sticker_node');
  const stickerHandlerEnd = code.indexOf('\n@dp.', stickerHandlerStart + 1);
  const stickerBlock = stickerHandlerEnd > 0
    ? code.slice(stickerHandlerStart, stickerHandlerEnd)
    : code.slice(stickerHandlerStart);
  ok(stickerBlock.includes('CAACtest_fileid'), 'file_id должен быть в блоке обработчика');
  ok(!stickerBlock.includes('aiohttp'), 'aiohttp не должен быть в блоке при file_id');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Voice
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Voice ─────────────────────────────────────────────────');

test('B01', 'voice: voiceUrl → answer_voice через aiohttp', () => {
  const code = gen(addNode('voice', {
    voiceUrl: 'https://example.com/voice.ogg',
  }), 'b01');
  syntax(code, 'b01');
  ok(code.includes('https://example.com/voice.ogg'), 'URL должен быть в коде');
  ok(code.includes('answer_voice'), 'answer_voice должен быть');
  ok(code.includes('aiohttp'), 'должна быть загрузка через aiohttp');
});

test('B02', 'voice: mediaCaption → caption передаётся', () => {
  const code = gen(addNode('voice', {
    voiceUrl: 'https://example.com/voice.ogg',
    mediaCaption: 'Голосовое сообщение',
  }), 'b02');
  syntax(code, 'b02');
  ok(code.includes('Голосовое сообщение'), 'caption должен быть в коде');
  ok(code.includes('caption=caption'), 'caption= должен передаваться');
});

test('B03', 'voice: mediaDuration → duration передаётся', () => {
  const code = gen(addNode('voice', {
    voiceUrl: 'https://example.com/voice.ogg',
    mediaDuration: 42,
  }), 'b03');
  syntax(code, 'b03');
  ok(code.includes('42'), 'duration должен быть в коде');
  ok(code.includes('duration=duration'), 'duration= должен передаваться');
});

test('B04', 'voice: mediaCaption + mediaDuration вместе', () => {
  const code = gen(addNode('voice', {
    voiceUrl: 'https://example.com/voice.ogg',
    mediaCaption: 'Привет!',
    mediaDuration: 15,
  }), 'b04');
  syntax(code, 'b04');
  ok(code.includes('caption=caption'), 'caption= должен быть');
  ok(code.includes('duration=duration'), 'duration= должен быть');
});

test('B05', 'voice: disableNotification:true → disable_notification=True', () => {
  const code = gen(addNode('voice', {
    voiceUrl: 'https://example.com/voice.ogg',
    disableNotification: true,
  }), 'b05');
  syntax(code, 'b05');
  ok(code.includes('disable_notification=True'), 'disable_notification=True должен быть');
});

test('B06', 'voice: пустой voiceUrl → "Голосовое сообщение не настроено"', () => {
  const code = gen(addNode('voice', {}), 'b06');
  syntax(code, 'b06');
  ok(code.includes('Голосовое сообщение не настроено'), 'fallback должен быть');
});

test('B07', 'voice: mediaDuration=0 → нет duration в вызове', () => {
  const code = gen(addNode('voice', {
    voiceUrl: 'https://example.com/voice.ogg',
    mediaDuration: 0,
  }), 'b07');
  syntax(code, 'b07');
  // mediaDuration=0 — falsy, не должен генерировать duration
  ok(!code.includes('duration=duration'), 'duration не должен быть при 0');
});

test('B08', 'voice: mediaCaption со спецсимволами', () => {
  const code = gen(addNode('voice', {
    voiceUrl: 'https://example.com/voice.ogg',
    mediaCaption: 'Текст с "кавычками" и \\n переносом',
  }), 'b08');
  syntax(code, 'b08');
  ok(code.includes('answer_voice'), 'answer_voice должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Animation
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Animation ─────────────────────────────────────────────');

test('C01', 'animation: внешний URL → send_animation с URL', () => {
  const code = gen(addNode('animation', {
    animationUrl: 'https://example.com/anim.gif',
  }), 'c01');
  syntax(code, 'c01');
  ok(code.includes('https://example.com/anim.gif'), 'URL должен быть в коде');
  ok(code.includes('send_animation'), 'send_animation должен быть');
});

test('C02', 'animation: /uploads/ путь → FSInputFile', () => {
  const code = gen(addNode('animation', {
    animationUrl: '/uploads/my_animation.gif',
  }), 'c02');
  syntax(code, 'c02');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть для локального файла');
  ok(code.includes('get_upload_file_path'), 'get_upload_file_path должен быть');
  ok(code.includes('send_animation'), 'send_animation должен быть');
});

test('C03', 'animation: пустой animationUrl → нет send_animation', () => {
  const code = gen(addNode('animation', {
    animationUrl: '',
  }), 'c03');
  syntax(code, 'c03');
  ok(!code.includes('send_animation'), 'send_animation не должен быть при пустом URL');
});

test('C04', 'animation: URL с пробелами и спецсимволами', () => {
  const code = gen(addNode('animation', {
    animationUrl: 'https://example.com/path/to/anim%20file.gif',
  }), 'c04');
  syntax(code, 'c04');
  ok(code.includes('send_animation'), 'send_animation должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: message с imageUrl
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: message с imageUrl ────────────────────────────────────');

test('D01', 'message: imageUrl задан → answer_photo', () => {
  const code = gen(patchMsg({ imageUrl: 'https://example.com/photo.jpg', attachedMedia: [] }), 'd01');
  syntax(code, 'd01');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
  ok(code.includes('https://example.com/photo.jpg'), 'URL должен быть в коде');
});

test('D02', 'message: imageUrl пустой → нет answer_photo', () => {
  const code = gen(patchMsg({ imageUrl: '', attachedMedia: [] }), 'd02');
  syntax(code, 'd02');
  ok(!code.includes('answer_photo'), 'answer_photo не должен быть при пустом URL');
});

test('D03', 'message: imageUrl="undefined" → нет answer_photo', () => {
  const code = gen(patchMsg({ imageUrl: 'undefined', attachedMedia: [] }), 'd03');
  syntax(code, 'd03');
  ok(!code.includes('answer_photo'), 'answer_photo не должен быть при "undefined"');
});

test('D04', 'message: imageUrl /uploads/ → FSInputFile', () => {
  const code = gen(patchMsg({ imageUrl: '/uploads/photo.jpg', attachedMedia: [] }), 'd04');
  syntax(code, 'd04');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть для локального файла');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
});

test('D05', 'message: imageUrl + formatMode=html → parse_mode="HTML"', () => {
  const code = gen(patchMsg({
    imageUrl: 'https://example.com/photo.jpg',
    formatMode: 'html',
    attachedMedia: [],
  }), 'd05');
  syntax(code, 'd05');
  ok(code.includes('parse_mode="HTML"'), 'parse_mode="HTML" должен быть');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
});

test('D06', 'message: imageUrl + formatMode=markdown → parse_mode="Markdown"', () => {
  const code = gen(patchMsg({
    imageUrl: 'https://example.com/photo.jpg',
    formatMode: 'markdown',
    attachedMedia: [],
  }), 'd06');
  syntax(code, 'd06');
  ok(code.includes('parse_mode="Markdown"'), 'parse_mode="Markdown" должен быть');
});

test('D07', 'message: imageUrl сохраняется в user_data', () => {
  const code = gen(patchMsg({ imageUrl: 'https://example.com/photo.jpg', attachedMedia: [] }), 'd07');
  syntax(code, 'd07');
  ok(code.includes('image_url_'), 'image_url_ должен сохраняться в user_data');
});

test('D08', 'message: imageUrl + userDatabaseEnabled → update_user_data_in_db', () => {
  const code = genDB(patchMsg({ imageUrl: 'https://example.com/photo.jpg', attachedMedia: [] }), 'd08');
  syntax(code, 'd08');
  ok(code.includes('update_user_data_in_db'), 'update_user_data_in_db должен быть');
  ok(code.includes('image_url_'), 'image_url_ должен сохраняться в БД');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: message с videoUrl
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: message с videoUrl ────────────────────────────────────');

test('E01', 'message: videoUrl задан → answer_video', () => {
  const code = gen(patchMsg({ videoUrl: 'https://example.com/video.mp4', attachedMedia: [] }), 'e01');
  syntax(code, 'e01');
  ok(code.includes('answer_video'), 'answer_video должен быть');
  ok(code.includes('https://example.com/video.mp4'), 'URL должен быть в коде');
});

test('E02', 'message: videoUrl пустой → нет answer_video', () => {
  const code = gen(patchMsg({ videoUrl: '', attachedMedia: [] }), 'e02');
  syntax(code, 'e02');
  ok(!code.includes('answer_video'), 'answer_video не должен быть при пустом URL');
});

test('E03', 'message: videoUrl /uploads/ → FSInputFile', () => {
  const code = gen(patchMsg({ videoUrl: '/uploads/video.mp4', attachedMedia: [] }), 'e03');
  syntax(code, 'e03');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть');
  ok(code.includes('answer_video'), 'answer_video должен быть');
});

test('E04', 'message: videoUrl сохраняется в user_data', () => {
  const code = gen(patchMsg({ videoUrl: 'https://example.com/video.mp4', attachedMedia: [] }), 'e04');
  syntax(code, 'e04');
  ok(code.includes('video_url_'), 'video_url_ должен сохраняться в user_data');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: message с audioUrl
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: message с audioUrl ────────────────────────────────────');

test('F01', 'message: audioUrl задан → answer_audio', () => {
  const code = gen(patchMsg({ audioUrl: 'https://example.com/audio.mp3', attachedMedia: [] }), 'f01');
  syntax(code, 'f01');
  ok(code.includes('answer_audio'), 'answer_audio должен быть');
  ok(code.includes('https://example.com/audio.mp3'), 'URL должен быть в коде');
});

test('F02', 'message: audioUrl пустой → нет answer_audio', () => {
  const code = gen(patchMsg({ audioUrl: '', attachedMedia: [] }), 'f02');
  syntax(code, 'f02');
  ok(!code.includes('answer_audio'), 'answer_audio не должен быть при пустом URL');
});

test('F03', 'message: audioUrl /uploads/ → FSInputFile', () => {
  const code = gen(patchMsg({ audioUrl: '/uploads/audio.mp3', attachedMedia: [] }), 'f03');
  syntax(code, 'f03');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть');
  ok(code.includes('answer_audio'), 'answer_audio должен быть');
});

test('F04', 'message: audioUrl сохраняется в user_data', () => {
  const code = gen(patchMsg({ audioUrl: 'https://example.com/audio.mp3', attachedMedia: [] }), 'f04');
  syntax(code, 'f04');
  ok(code.includes('audio_url_'), 'audio_url_ должен сохраняться в user_data');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: message с documentUrl
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: message с documentUrl ─────────────────────────────────');

test('G01', 'message: documentUrl задан → answer_document', () => {
  const code = gen(patchMsg({ documentUrl: 'https://example.com/doc.pdf', attachedMedia: [] }), 'g01');
  syntax(code, 'g01');
  ok(code.includes('answer_document'), 'answer_document должен быть');
  ok(code.includes('https://example.com/doc.pdf'), 'URL должен быть в коде');
});

test('G02', 'message: documentUrl пустой → нет answer_document', () => {
  const code = gen(patchMsg({ documentUrl: '', attachedMedia: [] }), 'g02');
  syntax(code, 'g02');
  ok(!code.includes('answer_document'), 'answer_document не должен быть при пустом URL');
});

test('G03', 'message: documentUrl /uploads/ → FSInputFile', () => {
  const code = gen(patchMsg({ documentUrl: '/uploads/doc.pdf', attachedMedia: [] }), 'g03');
  syntax(code, 'g03');
  ok(code.includes('FSInputFile'), 'FSInputFile должен быть');
  ok(code.includes('answer_document'), 'answer_document должен быть');
});

test('G04', 'message: documentUrl сохраняется в user_data', () => {
  const code = gen(patchMsg({ documentUrl: 'https://example.com/doc.pdf', attachedMedia: [] }), 'g04');
  syntax(code, 'g04');
  ok(code.includes('document_url_'), 'document_url_ должен сохраняться в user_data');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: attachedMedia
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: attachedMedia ─────────────────────────────────────────');

test('H01', 'message: attachedMedia пустой → нет attached-media блока', () => {
  const code = gen(patchMsg({ attachedMedia: [] }), 'h01');
  syntax(code, 'h01');
  // Без attachedMedia должен быть обычный answer
  ok(code.includes('message.answer(text'), 'обычный answer должен быть');
});

test('H02', 'message: attachedMedia с imageUrlVar + imageUrl → user_data["imageUrlVar"]', () => {
  const code = gen(patchMsg({
    attachedMedia: ['imageUrlVar'],
    imageUrl: 'https://example.com/photo.jpg',
  }), 'h02');
  syntax(code, 'h02');
  ok(code.includes('imageUrlVar'), 'imageUrlVar должен быть в коде');
});

test('H03', 'message: attachedMedia с videoUrlVar + videoUrl → user_data["videoUrlVar"]', () => {
  const code = gen(patchMsg({
    attachedMedia: ['videoUrlVar'],
    videoUrl: 'https://example.com/video.mp4',
  }), 'h03');
  syntax(code, 'h03');
  ok(code.includes('videoUrlVar'), 'videoUrlVar должен быть в коде');
});

test('H04', 'message: attachedMedia с audioUrlVar + audioUrl → user_data["audioUrlVar"]', () => {
  const code = gen(patchMsg({
    attachedMedia: ['audioUrlVar'],
    audioUrl: 'https://example.com/audio.mp3',
  }), 'h04');
  syntax(code, 'h04');
  ok(code.includes('audioUrlVar'), 'audioUrlVar должен быть в коде');
});

test('H05', 'message: attachedMedia с documentUrlVar + documentUrl → user_data["documentUrlVar"]', () => {
  const code = gen(patchMsg({
    attachedMedia: ['documentUrlVar'],
    documentUrl: 'https://example.com/doc.pdf',
  }), 'h05');
  syntax(code, 'h05');
  ok(code.includes('documentUrlVar'), 'documentUrlVar должен быть в коде');
});

test('H06', 'message: attachedMedia с video_url_ + videoUrl → user_data["video_url_..."]', () => {
  const code = gen(patchMsg({
    attachedMedia: ['video_url_node123'],
    videoUrl: 'https://example.com/video.mp4',
  }), 'h06');
  syntax(code, 'h06');
  ok(code.includes('video_url_node123'), 'video_url_node123 должен быть в коде');
});

test('H07', 'message: несколько attachedMedia переменных', () => {
  const code = gen(patchMsg({
    attachedMedia: ['imageUrlVar', 'videoUrlVar', 'audioUrlVar'],
    imageUrl: 'https://example.com/photo.jpg',
    videoUrl: 'https://example.com/video.mp4',
    audioUrl: 'https://example.com/audio.mp3',
  }), 'h07');
  syntax(code, 'h07');
  ok(code.includes('imageUrlVar'), 'imageUrlVar должен быть');
  ok(code.includes('videoUrlVar'), 'videoUrlVar должен быть');
  ok(code.includes('audioUrlVar'), 'audioUrlVar должен быть');
});

test('H08', 'message: attachedMedia задан, imageUrl задан → answer_photo (не answer)', () => {
  const code = gen(patchMsg({
    attachedMedia: ['imageUrlVar'],
    imageUrl: 'https://example.com/photo.jpg',
  }), 'h08');
  syntax(code, 'h08');
  ok(code.includes('answer_photo'), 'answer_photo должен быть при imageUrl + attachedMedia');
});

// ─── Новые тесты: attachedMedia как массив URL-строк ─────────────────────────

test('H09', 'start: attachedMedia=[jpg URL] → answer_photo (нет imageUrl)', () => {
  const code = gen(patchStart({
    attachedMedia: ['https://example.com/photo.jpg'],
    imageUrl: '',
    videoUrl: '',
    audioUrl: '',
    documentUrl: '',
  }), 'h09');
  syntax(code, 'h09');
  ok(code.includes('answer_photo'), 'answer_photo должен быть из attachedMedia URL');
  ok(code.includes('example.com/photo.jpg'), 'URL должен быть в коде');
});

test('H10', 'start: attachedMedia=[mp4 URL] → answer_video', () => {
  const code = gen(patchStart({
    attachedMedia: ['https://example.com/video.mp4'],
    imageUrl: '',
    videoUrl: '',
    audioUrl: '',
    documentUrl: '',
  }), 'h10');
  syntax(code, 'h10');
  ok(code.includes('answer_video'), 'answer_video должен быть из attachedMedia mp4 URL');
});

test('H11', 'start: attachedMedia=[mp3 URL] → answer_audio', () => {
  const code = gen(patchStart({
    attachedMedia: ['https://example.com/audio.mp3'],
    imageUrl: '',
    videoUrl: '',
    audioUrl: '',
    documentUrl: '',
  }), 'h11');
  syntax(code, 'h11');
  ok(code.includes('answer_audio'), 'answer_audio должен быть из attachedMedia mp3 URL');
});

test('H12', 'start: attachedMedia=[pdf URL] → answer_document', () => {
  const code = gen(patchStart({
    attachedMedia: ['https://example.com/doc.pdf'],
    imageUrl: '',
    videoUrl: '',
    audioUrl: '',
    documentUrl: '',
  }), 'h12');
  syntax(code, 'h12');
  ok(code.includes('answer_document'), 'answer_document должен быть из attachedMedia pdf URL');
});

test('H13', 'message: attachedMedia=[jpg URL] → answer_photo', () => {
  const code = gen(patchMsg({
    attachedMedia: ['https://example.com/photo.jpg'],
    imageUrl: '',
    videoUrl: '',
    audioUrl: '',
    documentUrl: '',
  }), 'h13');
  syntax(code, 'h13');
  ok(code.includes('answer_photo'), 'answer_photo должен быть из attachedMedia URL в message');
});

test('H14', 'start: реальный project.json attachedMedia → answer_photo', () => {
  // Тест с реальным project.json как есть (attachedMedia = ["https://irecommend.ru/...jpg"])
  const p = clone(BASE);
  const code = gen(p, 'h14');
  syntax(code, 'h14');
  ok(code.includes('answer_photo'), 'answer_photo должен быть из реального attachedMedia');
  ok(code.includes('irecommend.ru'), 'URL из attachedMedia должен быть в коде');
});

test('H15', 'start: imageUrl имеет приоритет над attachedMedia URL', () => {
  const code = gen(patchStart({
    attachedMedia: ['https://example.com/from_array.jpg'],
    imageUrl: 'https://example.com/explicit.jpg',
  }), 'h15');
  syntax(code, 'h15');
  ok(code.includes('explicit.jpg'), 'явный imageUrl должен использоваться');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: start-узел с медиа
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: start-узел с медиа ────────────────────────────────────');

test('I01', 'start: imageUrl → сохраняется в user_data + answer_photo', () => {
  const code = gen(patchStart({ imageUrl: 'https://example.com/photo.jpg', attachedMedia: [] }), 'i01');
  syntax(code, 'i01');
  ok(code.includes('image_url_'), 'image_url_ должен сохраняться');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
});

test('I02', 'start: videoUrl → сохраняется в user_data + answer_video', () => {
  const code = gen(patchStart({ videoUrl: 'https://example.com/video.mp4', attachedMedia: [] }), 'i02');
  syntax(code, 'i02');
  ok(code.includes('video_url_'), 'video_url_ должен сохраняться');
  ok(code.includes('answer_video'), 'answer_video должен быть');
});

test('I03', 'start: audioUrl → сохраняется в user_data + answer_audio', () => {
  const code = gen(patchStart({ audioUrl: 'https://example.com/audio.mp3', attachedMedia: [] }), 'i03');
  syntax(code, 'i03');
  ok(code.includes('audio_url_'), 'audio_url_ должен сохраняться');
  ok(code.includes('answer_audio'), 'answer_audio должен быть');
});

test('I04', 'start: documentUrl → сохраняется в user_data + answer_document', () => {
  const code = gen(patchStart({ documentUrl: 'https://example.com/doc.pdf', attachedMedia: [] }), 'i04');
  syntax(code, 'i04');
  ok(code.includes('document_url_'), 'document_url_ должен сохраняться');
  ok(code.includes('answer_document'), 'answer_document должен быть');
});

test('I05', 'start: imageUrl + userDatabaseEnabled → update_user_data_in_db', () => {
  const code = genDB(patchStart({ imageUrl: 'https://example.com/photo.jpg', attachedMedia: [] }), 'i05');
  syntax(code, 'i05');
  ok(code.includes('update_user_data_in_db'), 'update_user_data_in_db должен быть');
  ok(code.includes('image_url_'), 'image_url_ должен сохраняться в БД');
});

test('I06', 'start: imageUrl="undefined" → нет answer_photo', () => {
  const code = gen(patchStart({ imageUrl: 'undefined', attachedMedia: [] }), 'i06');
  syntax(code, 'i06');
  ok(!code.includes('answer_photo'), 'answer_photo не должен быть при "undefined"');
});

test('I07', 'start: attachedMedia с imageUrlVar + imageUrl → answer_photo', () => {
  const code = gen(patchStart({
    attachedMedia: ['imageUrlVar'],
    imageUrl: 'https://example.com/photo.jpg',
  }), 'i07');
  syntax(code, 'i07');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: command-узел с медиа
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: command-узел с медиа ──────────────────────────────────');

test('J01', 'command: imageUrl → answer_photo', () => {
  const p = clone(BASE);
  p.sheets[0].nodes.push({
    id: 'cmd_media_test',
    type: 'command',
    position: { x: 0, y: 0 },
    data: {
      command: '/photo',
      messageText: 'Вот фото',
      imageUrl: 'https://example.com/photo.jpg',
      attachedMedia: [],
      keyboardType: 'none',
      buttons: [],
      formatMode: 'none',
    },
  });
  const code = gen(p, 'j01');
  syntax(code, 'j01');
  ok(code.includes('answer_photo'), 'answer_photo должен быть в command-узле');
});

test('J02', 'command: videoUrl → answer_video', () => {
  const p = clone(BASE);
  p.sheets[0].nodes.push({
    id: 'cmd_video_test',
    type: 'command',
    position: { x: 0, y: 0 },
    data: {
      command: '/video',
      messageText: 'Вот видео',
      videoUrl: 'https://example.com/video.mp4',
      attachedMedia: [],
      keyboardType: 'none',
      buttons: [],
      formatMode: 'none',
    },
  });
  const code = gen(p, 'j02');
  syntax(code, 'j02');
  ok(code.includes('answer_video'), 'answer_video должен быть в command-узле');
});

test('J03', 'command: documentUrl → answer_document', () => {
  const p = clone(BASE);
  p.sheets[0].nodes.push({
    id: 'cmd_doc_test',
    type: 'command',
    position: { x: 0, y: 0 },
    data: {
      command: '/doc',
      messageText: 'Вот документ',
      documentUrl: 'https://example.com/doc.pdf',
      attachedMedia: [],
      keyboardType: 'none',
      buttons: [],
      formatMode: 'none',
    },
  });
  const code = gen(p, 'j03');
  syntax(code, 'j03');
  ok(code.includes('answer_document'), 'answer_document должен быть в command-узле');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК K: Комбинации
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: Комбинации ────────────────────────────────────────────');

test('K01', 'message: imageUrl + attachedMedia → answer_photo (attachedMedia не перекрывает)', () => {
  const code = gen(patchMsg({
    imageUrl: 'https://example.com/photo.jpg',
    attachedMedia: ['imageUrlVar'],
  }), 'k01');
  syntax(code, 'k01');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
});

test('K02', 'message: imageUrl + videoUrl + audioUrl + documentUrl → только imageUrl (приоритет)', () => {
  const code = gen(patchMsg({
    imageUrl: 'https://example.com/photo.jpg',
    videoUrl: 'https://example.com/video.mp4',
    audioUrl: 'https://example.com/audio.mp3',
    documentUrl: 'https://example.com/doc.pdf',
    attachedMedia: [],
  }), 'k02');
  syntax(code, 'k02');
  ok(code.includes('answer_photo'), 'answer_photo должен быть (imageUrl приоритетнее)');
});

test('K03', 'message: только videoUrl + audioUrl + documentUrl → только videoUrl (приоритет)', () => {
  const code = gen(patchMsg({
    videoUrl: 'https://example.com/video.mp4',
    audioUrl: 'https://example.com/audio.mp3',
    documentUrl: 'https://example.com/doc.pdf',
    attachedMedia: [],
  }), 'k03');
  syntax(code, 'k03');
  ok(code.includes('answer_video'), 'answer_video должен быть (videoUrl приоритетнее audio/doc)');
});

test('K04', 'sticker: mediaCaption с переменными {user_name}', () => {
  const code = gen(addNode('sticker', {
    stickerFileId: 'CAACtest',
    mediaCaption: 'Привет, {user_name}!',
  }), 'k04');
  syntax(code, 'k04');
  ok(code.includes('replace_variables_in_text'), 'замена переменных должна быть');
  ok(code.includes('{user_name}'), 'переменная должна быть в caption');
});

test('K05', 'voice: mediaCaption с переменными {first_name}', () => {
  const code = gen(addNode('voice', {
    voiceUrl: 'https://example.com/voice.ogg',
    mediaCaption: 'Привет, {first_name}!',
  }), 'k05');
  syntax(code, 'k05');
  ok(code.includes('replace_variables_in_text'), 'замена переменных должна быть');
});

test('K06', 'message: imageUrl + formatMode=html + attachedMedia → parse_mode="HTML"', () => {
  const code = gen(patchMsg({
    imageUrl: 'https://example.com/photo.jpg',
    formatMode: 'html',
    attachedMedia: ['imageUrlVar'],
  }), 'k06');
  syntax(code, 'k06');
  ok(code.includes('parse_mode="HTML"'), 'parse_mode="HTML" должен быть');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
});

test('K07', 'message: videoUrl + formatMode=markdown → parse_mode="Markdown"', () => {
  const code = gen(patchMsg({
    videoUrl: 'https://example.com/video.mp4',
    formatMode: 'markdown',
    attachedMedia: [],
  }), 'k07');
  syntax(code, 'k07');
  ok(code.includes('parse_mode="Markdown"'), 'parse_mode="Markdown" должен быть');
  ok(code.includes('answer_video'), 'answer_video должен быть');
});

test('K08', 'sticker + voice + animation в одном проекте → все обработчики', () => {
  const p = clone(BASE);
  p.sheets[0].nodes.push(
    { id: 'stk1', type: 'sticker', position: { x: 0, y: 0 }, data: { stickerFileId: 'CAACtest1' } },
    { id: 'voc1', type: 'voice', position: { x: 0, y: 0 }, data: { voiceUrl: 'https://example.com/v.ogg' } },
    { id: 'ani1', type: 'animation', position: { x: 0, y: 0 }, data: { animationUrl: 'https://example.com/a.gif' } },
  );
  const code = gen(p, 'k08');
  syntax(code, 'k08');
  ok(code.includes('answer_sticker'), 'answer_sticker должен быть');
  ok(code.includes('answer_voice'), 'answer_voice должен быть');
  ok(code.includes('send_animation'), 'send_animation должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК L: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок L: Граничные случаи ──────────────────────────────────────');

test('L01', 'sticker: URL с кириллицей в пути', () => {
  const code = gen(addNode('sticker', {
    stickerUrl: 'https://example.com/стикеры/pack.webp',
  }), 'l01');
  syntax(code, 'l01');
  ok(code.includes('answer_sticker'), 'answer_sticker должен быть');
});

test('L02', 'voice: очень длинный URL (500 символов)', () => {
  const longUrl = 'https://example.com/' + 'a'.repeat(480) + '.ogg';
  const code = gen(addNode('voice', { voiceUrl: longUrl }), 'l02');
  syntax(code, 'l02');
  ok(code.includes('answer_voice'), 'answer_voice должен быть');
});

test('L03', 'message: imageUrl с query-параметрами', () => {
  const code = gen(patchMsg({
    imageUrl: 'https://example.com/photo.jpg?size=large&format=webp',
    attachedMedia: [],
  }), 'l03');
  syntax(code, 'l03');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
});

test('L04', 'message: imageUrl с хэшем в URL', () => {
  const code = gen(patchMsg({
    imageUrl: 'https://example.com/photo.jpg#section',
    attachedMedia: [],
  }), 'l04');
  syntax(code, 'l04');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
});

test('L05', 'sticker: disableNotification:true + mediaCaption + stickerFileId — всё вместе', () => {
  const code = gen(addNode('sticker', {
    stickerFileId: 'CAACtest_full',
    mediaCaption: 'Полный набор параметров',
    disableNotification: true,
  }), 'l05');
  syntax(code, 'l05');
  ok(code.includes('disable_notification=True'), 'disable_notification=True должен быть');
  ok(code.includes('caption=caption'), 'caption= должен быть');
  ok(code.includes('CAACtest_full'), 'file_id должен быть');
});

test('L06', 'voice: disableNotification:true + mediaCaption + mediaDuration — всё вместе', () => {
  const code = gen(addNode('voice', {
    voiceUrl: 'https://example.com/voice.ogg',
    mediaCaption: 'Полный набор',
    mediaDuration: 99,
    disableNotification: true,
  }), 'l06');
  syntax(code, 'l06');
  ok(code.includes('disable_notification=True'), 'disable_notification=True должен быть');
  ok(code.includes('caption=caption'), 'caption= должен быть');
  ok(code.includes('duration=duration'), 'duration= должен быть');
});

test('L07', 'message: imageUrl с одинарными кавычками в URL', () => {
  const code = gen(patchMsg({
    imageUrl: "https://example.com/photo's.jpg",
    attachedMedia: [],
  }), 'l07');
  syntax(code, 'l07');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
});

test('L08', 'animation: URL с query-параметрами', () => {
  const code = gen(addNode('animation', {
    animationUrl: 'https://example.com/anim.gif?token=abc123',
  }), 'l08');
  syntax(code, 'l08');
  ok(code.includes('send_animation'), 'send_animation должен быть');
});

test('L09', 'message: все медиа пустые + attachedMedia пустой → обычный answer', () => {
  const code = gen(patchMsg({
    imageUrl: '',
    videoUrl: '',
    audioUrl: '',
    documentUrl: '',
    attachedMedia: [],
  }), 'l09');
  syntax(code, 'l09');
  ok(code.includes('message.answer(text'), 'обычный answer должен быть');
  ok(!code.includes('answer_photo'), 'answer_photo не должен быть');
  ok(!code.includes('answer_video'), 'answer_video не должен быть');
  ok(!code.includes('answer_audio'), 'answer_audio не должен быть');
  ok(!code.includes('answer_document'), 'answer_document не должен быть');
});

test('L10', 'message: documentUrl + audioUrl (без image/video) → audioUrl приоритетнее doc', () => {
  const code = gen(patchMsg({
    audioUrl: 'https://example.com/audio.mp3',
    documentUrl: 'https://example.com/doc.pdf',
    attachedMedia: [],
  }), 'l10');
  syntax(code, 'l10');
  ok(code.includes('answer_audio'), 'answer_audio должен быть (audioUrl приоритетнее documentUrl)');
});

// ════════════════════════════════════════════════════════════════════════════
// ИТОГИ
// ════════════════════════════════════════════════════════════════════════════

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итого: ${passed}/${results.length} пройдено, ${failed} провалено`.padEnd(63) + '║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) {
  console.log('Провалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
}
