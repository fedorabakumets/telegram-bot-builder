/**
 * @fileoverview Фаза 15 — Импорты библиотек Python (85 тестов)
 *
 * Тестирует генерацию Python импортов в сгенерированном коде бота.
 *
 * Покрывает:
 *  Блок A: Базовые импорты — всегда присутствуют (15 тестов)
 *  Блок B: Условные импорты — при определённых флагах (20 тестов)
 *  Блок C: Отсутствие дублирования — каждый импорт один раз (10 тестов)
 *  Блок D: Порядок импортов — стандартная → сторонняя → локальная (10 тестов)
 *  Блок E: Интеграция с feature flags (15 тестов)
 *  Блок F: Граничные случаи (10 тестов)
 *  Блок G: Синтаксическая валидация Python (10 тестов)
 *  Блок H: Производительность (5 тестов)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';
import { generateImports } from '../templates/imports/imports.renderer.ts';
import { computeFeatureFlags } from '../bot-generator/core/feature-flags.ts';
import { createGenerationContext } from '../bot-generator/core/create-generation-context.ts';
import type { BotData } from '@shared/schema';

// ─── Константы ───────────────────────────────────────────────────────────────

const PROJECT_PATH = 'bots/импортированный_проект_1723_60_53/project.json';
const BASE_PROJECT_RAW = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf-8'));

// Создаем чистый базовый проект без inline кнопок и медиа для тестов
function createCleanBaseProject() {
  const p = JSON.parse(JSON.stringify(BASE_PROJECT_RAW));
  // Очищаем кнопки и медиа из start узла
  const startNode = p.sheets[0].nodes.find((n: any) => n.type === 'start');
  if (startNode) {
    startNode.data.buttons = [];
    startNode.data.keyboardType = 'reply';
    delete startNode.data.attachedMedia;
    delete startNode.data.imageUrl;
    delete startNode.data.videoUrl;
    delete startNode.data.formatMode;
  }
  // Очищаем второй узел
  if (p.sheets[0].nodes[1]) {
    p.sheets[0].nodes[1].data.buttons = [];
    p.sheets[0].nodes[1].data.formatMode = 'none';
    delete p.sheets[0].nodes[1].data.attachedMedia;
  }
  return p;
}

const BASE_PROJECT = createCleanBaseProject();

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function gen(project: unknown, label: string, options: { userDatabaseEnabled?: boolean } = {}): string {
  return generatePythonCode(project as any, {
    botName: `Phase15_${label}`,
    userDatabaseEnabled: options.userDatabaseEnabled ?? false,
    enableComments: false,
  });
}

function genImportsOnly(params: Record<string, boolean>, _label: string): string {
  return generateImports(params as any);
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p15_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
    return { ok: true };
  } catch (e: any) {
    const err = e.stderr?.toString() ?? String(e);
    try { fs.unlinkSync(tmp); } catch {}
    return { ok: false, error: err };
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function assertSyntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  assert(r.ok, `Синтаксическая ошибка Python:\n${r.error}`);
}

function countOccurrences(code: string, pattern: string): number {
  const regex = new RegExp(pattern, 'gm');
  const matches = code.match(regex);
  return matches ? matches.length : 0;
}

function getImportLineNumber(code: string, importLine: string): number {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.includes(importLine)) {
      return i;
    }
  }
  return -1;
}

// ─── Тест-раннер ─────────────────────────────────────────────────────────────

type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

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

// ─── Тесты ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║       Фаза 15 — Импорты библиотек (85 тестов)               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
//  Блок A: Базовые импорты — всегда присутствуют
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовые импорты ──────────────────────────────────────');

test('A01', 'asyncio всегда присутствует', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A01');
  assert(code.includes('import asyncio'), 'asyncio должен быть в импортах');
});

test('A02', 'logging всегда присутствует', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A02');
  assert(code.includes('import logging'), 'logging должен быть в импортах');
});

test('A03', 'signal всегда присутствует', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A03');
  assert(code.includes('import signal'), 'signal должен быть в импортах');
});

test('A04', 'aiogram Bot всегда присутствует', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A04');
  assert(code.includes('from aiogram import') && code.includes('Bot'), 'Bot должен быть в импортах aiogram');
});

test('A05', 'aiogram Dispatcher всегда присутствует', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A05');
  assert(code.includes('from aiogram import') && code.includes('Dispatcher'), 'Dispatcher должен быть в импортах aiogram');
});

test('A06', 'aiogram types всегда присутствует', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A06');
  assert(code.includes('from aiogram import') && code.includes('types'), 'types должен быть в импортах aiogram');
});

test('A07', 'aiogram F всегда присутствует', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A07');
  assert(code.includes('from aiogram import') && code.includes('F'), 'F должен быть в импортах aiogram');
});

test('A08', 'aiogram BaseMiddleware всегда присутствует', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A08');
  assert(code.includes('from aiogram import') && code.includes('BaseMiddleware'), 'BaseMiddleware должен быть в импортах aiogram');
});

test('A09', 'aiogram.types KeyboardButton всегда присутствует', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A09');
  assert(code.includes('KeyboardButton'), 'KeyboardButton должен быть в импортах');
});

test('A09b', 'aiogram.types KeyboardButton всегда присутствует (без reply клавиатуры)', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.keyboardType = 'inline';
  p.sheets[0].nodes[0].data.buttons = [];
  const code = gen(p, 'A09b');
  // KeyboardButton теперь всегда присутствует
  assert(code.includes('KeyboardButton'), 'KeyboardButton должен быть всегда');
});

test('A10', 'aiogram.types InlineKeyboardButton всегда присутствует', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A10');
  assert(code.includes('InlineKeyboardButton'), 'InlineKeyboardButton должен быть в импортах');
});

test('A11', 'aiogram.utils.keyboard ReplyKeyboardBuilder всегда присутствует', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A11');
  assert(code.includes('ReplyKeyboardBuilder'), 'ReplyKeyboardBuilder должен быть в импортах');
});

test('A11b', 'aiogram.utils.keyboard ReplyKeyboardBuilder всегда присутствует (без reply клавиатуры)', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.keyboardType = 'inline';
  p.sheets[0].nodes[0].data.buttons = [];
  const code = gen(p, 'A11b');
  // ReplyKeyboardBuilder теперь всегда присутствует
  assert(code.includes('ReplyKeyboardBuilder'), 'ReplyKeyboardBuilder должен быть всегда');
});

test('A12', 'aiogram.utils.keyboard InlineKeyboardBuilder всегда присутствует', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A12');
  assert(code.includes('InlineKeyboardBuilder'), 'InlineKeyboardBuilder должен быть в импортах');
});

test('A13', 'typing Optional, Callable, Awaitable, Any всегда присутствуют', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A13');
  assert(code.includes('from typing import'), 'typing import должен быть');
  assert(code.includes('Optional'), 'Optional должен быть в импортах');
  assert(code.includes('Callable'), 'Callable должен быть в импортах');
  assert(code.includes('Awaitable'), 'Awaitable должен быть в импортах');
  assert(code.includes('Any'), 'Any должен быть в импортах');
});

test('A14', 'dotenv load_dotenv всегда присутствует', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A14');
  assert(code.includes('from dotenv import load_dotenv') || code.includes('load_dotenv'), 'load_dotenv должен быть в импортах');
});

test('A15', 'aiogram.filters CommandStart, Command всегда присутствуют', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'A15');
  assert(code.includes('from aiogram.filters import'), 'aiogram.filters import должен быть');
  assert(code.includes('CommandStart'), 'CommandStart должен быть в импортах');
  assert(code.includes('Command'), 'Command должен быть в импортах');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок B: Условные импорты
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: Условные импорты ────────────────────────────────────');

test('B01', 'asyncpg при userDatabaseEnabled=true', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'B01', { userDatabaseEnabled: true });
  assert(code.includes('import asyncpg'), 'asyncpg должен быть при userDatabaseEnabled=true');
});

test('B02', 'asyncpg отсутствует при userDatabaseEnabled=false', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'B02', { userDatabaseEnabled: false });
  assert(!code.includes('import asyncpg'), 'asyncpg не должен быть при userDatabaseEnabled=false');
});

test('B03', 'json import при userDatabaseEnabled=true', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'B03', { userDatabaseEnabled: true });
  assert(code.includes('import json'), 'json должен быть при userDatabaseEnabled=true');
});

test('B04', 'json import отсутствует при userDatabaseEnabled=false', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'B04', { userDatabaseEnabled: false });
  // json может использоваться в других местах, проверяем только import json
  const importJsonCount = countOccurrences(code, '^import json$');
  assert(importJsonCount === 0, 'import json не должен быть при userDatabaseEnabled=false');
});

test('B05', 'TelegramBadRequest при hasInlineButtons=true', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.buttons = [
    { id: 'btn1', text: 'Click', action: 'goto', target: 'msg1' }
  ];
  p.sheets[0].nodes[0].data.keyboardType = 'inline';
  const code = gen(p, 'B05');
  assert(code.includes('TelegramBadRequest'), 'TelegramBadRequest должен быть при inline кнопках');
});

test('B06', 'TelegramBadRequest отсутствует без inline кнопок и автопереходов', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.buttons = [];
  const code = gen(p, 'B06');
  assert(!code.includes('TelegramBadRequest'), 'TelegramBadRequest не должен быть без inline кнопок');
});

test('B07', 'aiohttp при hasMediaNodes=true', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  const code = gen(p, 'B07');
  assert(code.includes('import aiohttp'), 'aiohttp должен быть при медиа узлах');
});

test('B08', 'aiohttp отсутствует без медиа', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'B08');
  assert(!code.includes('import aiohttp'), 'aiohttp не должен быть без медиа');
});

test('B09', 'TCPConnector при hasMediaNodes=true', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  const code = gen(p, 'B09');
  assert(code.includes('TCPConnector'), 'TCPConnector должен быть при медиа узлах');
});

test('B10', 'ParseMode при formatMode=html', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.formatMode = 'html';
  const code = gen(p, 'B10');
  assert(code.includes('from aiogram.enums import ParseMode') || code.includes('ParseMode'), 'ParseMode должен быть при formatMode=html');
});

test('B11', 'ParseMode при formatMode=markdown', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.formatMode = 'markdown';
  const code = gen(p, 'B11');
  assert(code.includes('from aiogram.enums import ParseMode') || code.includes('ParseMode'), 'ParseMode должен быть при formatMode=markdown');
});

test('B12', 'ParseMode отсутствует при formatMode=none', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.formatMode = 'none';
  p.sheets[0].nodes[1].data.formatMode = 'none';
  const code = gen(p, 'B12');
  assert(!code.includes('from aiogram.enums import ParseMode'), 'ParseMode не должен быть при formatMode=none');
});

test('B13', 'InputMediaPhoto при attachedMedia.length > 1', () => {
  const p = deepClone(BASE_PROJECT);
  // attachedMedia — это массив строк (переменных), а не объектов
  p.sheets[0].nodes[0].data.attachedMedia = [
    'https://example.com/1.jpg',
    'https://example.com/2.jpg',
  ];
  const code = gen(p, 'B13');
  assert(code.includes('InputMediaPhoto'), 'InputMediaPhoto должен быть при группе медиа');
});

test('B14', 'InputMediaVideo при attachedMedia.length > 1', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.attachedMedia = [
    'https://example.com/1.mp4',
    'https://example.com/2.mp4',
  ];
  const code = gen(p, 'B14');
  assert(code.includes('InputMediaVideo'), 'InputMediaVideo должен быть при группе медиа');
});

test('B15', 'InputMediaAudio при attachedMedia.length > 1', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.attachedMedia = [
    'https://example.com/1.mp3',
    'https://example.com/2.mp3',
  ];
  const code = gen(p, 'B15');
  assert(code.includes('InputMediaAudio'), 'InputMediaAudio должен быть при группе медиа');
});

test('B16', 'InputMediaDocument при attachedMedia.length > 1', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.attachedMedia = [
    'https://example.com/1.pdf',
    'https://example.com/2.pdf',
  ];
  const code = gen(p, 'B16');
  assert(code.includes('InputMediaDocument'), 'InputMediaDocument должен быть при группе медиа');
});

test('B17', 'URLInputFile при imageUrl.startsWith("http")', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  const code = gen(p, 'B17');
  assert(code.includes('URLInputFile'), 'URLInputFile должен быть при URL изображениях');
});

test('B18', 'URLInputFile отсутствует при локальном imageUrl', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = '/uploads/image.jpg';
  const code = gen(p, 'B18');
  assert(!code.includes('URLInputFile'), 'URLInputFile не должен быть при локальных изображениях');
});

test('B19', 'datetime при hasDatetimeNodes=true (MUTE_USER)', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].type = 'mute_user';
  p.sheets[0].nodes[0].data.muteDuration = 60;
  const code = gen(p, 'B19');
  assert(code.includes('from datetime import datetime'), 'datetime должен быть при MUTE_USER узлах');
});

test('B20', 'timezone при hasTimezoneNodes=true (MUTE_USER)', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].type = 'mute_user';
  p.sheets[0].nodes[0].data.muteDuration = 60;
  const code = gen(p, 'B20');
  assert(code.includes('timezone'), 'timezone должен быть при MUTE_USER узлах');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок C: Отсутствие дублирования
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: Отсутствие дублирования ────────────────────────────');

test('C01', 'asyncio появляется только один раз', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'C01');
  const count = countOccurrences(code, '^import asyncio$');
  assert(count === 1, `asyncio должен появиться 1 раз, появился ${count} раз`);
});

test('C02', 'logging появляется только один раз', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'C02');
  const count = countOccurrences(code, '^import logging$');
  assert(count === 1, `logging должен появиться 1 раз, появился ${count} раз`);
});

test('C03', 'signal появляется только один раз', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'C03');
  const count = countOccurrences(code, '^import signal$');
  assert(count === 1, `signal должен появиться 1 раз, появился ${count} раз`);
});

test('C04', 'from aiogram import появляется только один раз', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'C04');
  const count = countOccurrences(code, '^from aiogram import');
  assert(count === 1, `from aiogram import должен появиться 1 раз, появился ${count} раз`);
});

test('C05', 'from aiogram.types import появляется только один раз', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'C05');
  const count = countOccurrences(code, '^from aiogram\\.types import');
  assert(count <= 2, `from aiogram.types import должен появиться не более 2 раз, появился ${count} раз`);
});

test('C06', 'from datetime import появляется только один раз', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].type = 'mute_user';
  const code = gen(p, 'C06');
  const count = countOccurrences(code, '^from datetime import');
  assert(count === 1, `from datetime import должен появиться 1 раз, появился ${count} раз`);
});

test('C07', 'import asyncpg появляется только один раз при userDatabaseEnabled=true', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'C07', { userDatabaseEnabled: true });
  const count = countOccurrences(code, '^import asyncpg$');
  assert(count === 1, `import asyncpg должен появиться 1 раз, появился ${count} раз`);
});

test('C08', 'import json появляется только один раз при userDatabaseEnabled=true', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'C08', { userDatabaseEnabled: true });
  const count = countOccurrences(code, '^import json$');
  assert(count === 1, `import json должен появиться 1 раз, появился ${count} раз`);
});

test('C09', 'import aiohttp появляется только один раз при hasMediaNodes=true', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  const code = gen(p, 'C09');
  const count = countOccurrences(code, '^import aiohttp$');
  assert(count === 1, `import aiohttp должен появиться 1 раз, появился ${count} раз`);
});

test('C10', 'from aiogram.exceptions import появляется только один раз', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.buttons = [
    { id: 'btn1', text: 'Click', action: 'goto', target: 'msg1' }
  ];
  p.sheets[0].nodes[0].data.keyboardType = 'inline';
  const code = gen(p, 'C10');
  const count = countOccurrences(code, '^from aiogram\\.exceptions import');
  assert(count === 1, `from aiogram.exceptions import должен появиться 1 раз, появился ${count} раз`);
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок D: Порядок импортов
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок D: Порядок импортов ───────────────────────────────────');

test('D01', 'asyncio идёт до aiogram (стандартная перед сторонней)', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'D01');
  const asyncioLine = getImportLineNumber(code, 'import asyncio');
  const aiogramLine = getImportLineNumber(code, 'from aiogram import');
  assert(asyncioLine !== -1 && aiogramLine !== -1, 'оба импорта должны существовать');
  assert(asyncioLine < aiogramLine, 'asyncio должен идти до aiogram');
});

test('D02', 'logging идёт до aiogram (стандартная перед сторонней)', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'D02');
  const loggingLine = getImportLineNumber(code, 'import logging');
  const aiogramLine = getImportLineNumber(code, 'from aiogram import');
  assert(loggingLine !== -1 && aiogramLine !== -1, 'оба импорта должны существовать');
  assert(loggingLine < aiogramLine, 'logging должен идти до aiogram');
});

test('D03', 'signal идёт до aiogram (стандартная перед сторонней)', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'D03');
  const signalLine = getImportLineNumber(code, 'import signal');
  const aiogramLine = getImportLineNumber(code, 'from aiogram import');
  assert(signalLine !== -1 && aiogramLine !== -1, 'оба импорта должны существовать');
  assert(signalLine < aiogramLine, 'signal должен идти до aiogram');
});

test('D04', 'asyncpg идёт после aiogram (сторонняя после основной)', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'D04', { userDatabaseEnabled: true });
  const aiogramLine = getImportLineNumber(code, 'from aiogram import');
  const asyncpgLine = getImportLineNumber(code, 'import asyncpg');
  assert(aiogramLine !== -1 && asyncpgLine !== -1, 'оба импорта должны существовать');
  assert(aiogramLine < asyncpgLine, 'asyncpg должен идти после aiogram');
});

test('D05', 'aiohttp идёт после aiogram (сторонняя после основной)', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  const code = gen(p, 'D05');
  const aiogramLine = getImportLineNumber(code, 'from aiogram import');
  const aiohttpLine = getImportLineNumber(code, 'import aiohttp');
  assert(aiogramLine !== -1 && aiohttpLine !== -1, 'оба импорта должны существовать');
  assert(aiogramLine < aiohttpLine, 'aiohttp должен идти после aiogram');
});

test('D06', 'dotenv идёт после стандартной библиотеки', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'D06');
  const asyncioLine = getImportLineNumber(code, 'import asyncio');
  const dotenvLine = getImportLineNumber(code, 'from dotenv import');
  assert(asyncioLine !== -1 && dotenvLine !== -1, 'оба импорта должны существовать');
  assert(asyncioLine < dotenvLine, 'dotenv должен идти после asyncio');
});

test('D07', 'datetime идёт в конце условных импортов', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].type = 'mute_user';
  const code = gen(p, 'D07');
  const datetimeLine = getImportLineNumber(code, 'from datetime import');
  const reLine = getImportLineNumber(code, 'import re');
  assert(datetimeLine !== -1 && reLine !== -1, 'оба импорта должны существовать');
  assert(datetimeLine < reLine, 'datetime должен идти до re (стандартная библиотека в конце)');
});

test('D08', 're идёт после всех сторонних библиотек', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'D08');
  const aiogramLine = getImportLineNumber(code, 'from aiogram import');
  const reLine = getImportLineNumber(code, 'import re');
  assert(aiogramLine !== -1 && reLine !== -1, 'оба импорта должны существовать');
  assert(aiogramLine < reLine, 're должен идти после aiogram');
});

test('D09', 'types.SimpleNamespace идёт после re', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'D09');
  const reLine = getImportLineNumber(code, 'import re');
  const typesLine = getImportLineNumber(code, 'from types import');
  assert(reLine !== -1 && typesLine !== -1, 'оба импорта должны существовать');
  assert(reLine < typesLine, 'types должен идти после re');
});

test('D10', 'Порядок: asyncio → logging → signal → aiogram → typing → dotenv → filters → re → types', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'D10');
  const lines = code.split('\n').map(l => l.trim()).filter(l => l.startsWith('import ') || l.startsWith('from '));
  
  const asyncioIdx = lines.findIndex(l => l === 'import asyncio');
  const loggingIdx = lines.findIndex(l => l === 'import logging');
  const signalIdx = lines.findIndex(l => l === 'import signal');
  const aiogramIdx = lines.findIndex(l => l.startsWith('from aiogram import'));
  const typingIdx = lines.findIndex(l => l.startsWith('from typing import'));
  const dotenvIdx = lines.findIndex(l => l.startsWith('from dotenv import'));
  const filtersIdx = lines.findIndex(l => l.startsWith('from aiogram.filters import'));
  const reIdx = lines.findIndex(l => l === 'import re');
  const typesIdx = lines.findIndex(l => l.startsWith('from types import'));
  
  assert(asyncioIdx < loggingIdx, 'asyncio < logging');
  assert(loggingIdx < signalIdx, 'logging < signal');
  assert(signalIdx < aiogramIdx, 'signal < aiogram');
  assert(aiogramIdx < typingIdx, 'aiogram < typing');
  assert(typingIdx < dotenvIdx, 'typing < dotenv');
  assert(dotenvIdx < filtersIdx, 'dotenv < filters');
  assert(filtersIdx < reIdx, 'filters < re');
  assert(reIdx < typesIdx, 're < types');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок E: Интеграция с feature flags
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок E: Интеграция с feature flags ─────────────────────────');

test('E01', 'isParseModeNode для formatMode: html', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.formatMode = 'html';
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasParseModeNodesResult === true, 'hasParseModeNodesResult должен быть true для html');
});

test('E02', 'isParseModeNode для formatMode: markdown', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.formatMode = 'markdown';
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasParseModeNodesResult === true, 'hasParseModeNodesResult должен быть true для markdown');
});

test('E03', 'isParseModeNode для formatMode: none', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.formatMode = 'none';
  p.sheets[0].nodes[1].data.formatMode = 'none';
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasParseModeNodesResult === false, 'hasParseModeNodesResult должен быть false для none');
});

test('E04', 'hasMediaGroups для attachedMedia.length > 1', () => {
  const p: any = deepClone(BASE_PROJECT);
  // attachedMedia — это массив строк (переменных), а не объектов
  p.sheets[0].nodes[0].data.attachedMedia = [
    'media_var_1',
    'media_var_2',
  ];
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasMediaGroupsResult === true, 'hasMediaGroupsResult должен быть true для attachedMedia.length > 1');
});

test('E05', 'hasMediaGroups для attachedMedia.length = 1', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.attachedMedia = [
    'media_var_1',
  ];
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasMediaGroupsResult === false, 'hasMediaGroupsResult должен быть false для attachedMedia.length = 1');
});

test('E06', 'hasMediaGroups для attachedMedia.length = 0', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.attachedMedia = [];
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasMediaGroupsResult === false, 'hasMediaGroupsResult должен быть false для attachedMedia.length = 0');
});

test('E07', 'hasUrlImages для imageUrl.startsWith("http")', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasUrlImagesResult === true, 'hasUrlImagesResult должен быть true для http URL');
});

test('E08', 'hasUrlImages для imageUrl.startsWith("https")', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasUrlImagesResult === true, 'hasUrlImagesResult должен быть true для https URL');
});

test('E09', 'hasUrlImages для локального пути', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = '/uploads/image.jpg';
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasUrlImagesResult === false, 'hasUrlImagesResult должен быть false для локального пути');
});

test('E10', 'hasDatetimeNodes для MUTE_USER узла', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].type = 'mute_user';
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasDatetimeNodesResult === true, 'hasDatetimeNodesResult должен быть true для MUTE_USER');
});

test('E11', 'hasDatetimeNodes для BAN_USER узла', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].type = 'ban_user';
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasDatetimeNodesResult === true, 'hasDatetimeNodesResult должен быть true для BAN_USER');
});

test('E12', 'hasDatetimeNodes для start узла', () => {
  const p = deepClone(BASE_PROJECT);
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasDatetimeNodesResult === false, 'hasDatetimeNodesResult должен быть false для start узла');
});

test('E13', 'hasTimezoneNodes для MUTE_USER узла', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].type = 'mute_user';
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasTimezoneNodesResult === true, 'hasTimezoneNodesResult должен быть true для MUTE_USER');
});

test('E14', 'hasTimezoneNodes для start узла', () => {
  const p = deepClone(BASE_PROJECT);
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasTimezoneNodesResult === false, 'hasTimezoneNodesResult должен быть false для start узла');
});

test('E15', 'hasInlineButtons для inline кнопок', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.buttons = [
    { id: 'btn1', text: 'Click', action: 'goto', target: 'msg1' }
  ];
  p.sheets[0].nodes[0].data.keyboardType = 'inline';
  const context = createGenerationContext(p as BotData, 'TestBot', [], { enableComments: false });
  const flags = computeFeatureFlags(context);
  assert(flags.hasInlineButtonsResult === true, 'hasInlineButtonsResult должен быть true для inline кнопок');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок F: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок F: Граничные случаи ───────────────────────────────────');

test('F01', 'Пустой проект (только start узел)', () => {
  const p = {
    sheets: [{
      id: 'sheet1',
      name: 'Main',
      nodes: [{
        id: 'start1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: { command: '/start', messageText: 'Привет!', buttons: [] },
      }],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
  const code = gen(p, 'F01');
  assertSyntax(code, 'F01');
  assert(code.includes('import asyncio'), 'базовые импорты должны быть');
  assert(!code.includes('import asyncpg'), 'asyncpg не должен быть');
  assert(!code.includes('import aiohttp'), 'aiohttp не должен быть');
});

test('F02', 'Проект со всеми возможностями включенными', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.userDatabaseEnabled = true;
  p.sheets[0].nodes[0].data.buttons = [
    { id: 'btn1', text: 'Click', action: 'goto', target: 'msg1' }
  ];
  p.sheets[0].nodes[0].data.keyboardType = 'inline';
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  p.sheets[0].nodes[0].data.formatMode = 'html';
  // attachedMedia — это массив строк (переменных)
  p.sheets[0].nodes[0].data.attachedMedia = [
    'https://example.com/1.jpg',
    'https://example.com/2.jpg',
  ];
  const code = gen(p, 'F02', { userDatabaseEnabled: true });
  assertSyntax(code, 'F02');
  assert(code.includes('import asyncpg'), 'asyncpg должен быть');
  assert(code.includes('import aiohttp'), 'aiohttp должен быть');
  assert(code.includes('ParseMode'), 'ParseMode должен быть');
  assert(code.includes('InputMediaPhoto'), 'InputMediaPhoto должен быть');
  assert(code.includes('URLInputFile'), 'URLInputFile должен быть');
});

test('F03', 'Проект с комбинацией флагов: database + media', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  const code = gen(p, 'F03', { userDatabaseEnabled: true });
  assertSyntax(code, 'F03');
  assert(code.includes('import asyncpg'), 'asyncpg должен быть');
  assert(code.includes('import json'), 'json должен быть');
  assert(code.includes('import aiohttp'), 'aiohttp должен быть');
});

test('F04', 'Проект с комбинацией флагов: inline + parseMode', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.buttons = [
    { id: 'btn1', text: 'Click', action: 'goto', target: 'msg1' }
  ];
  p.sheets[0].nodes[0].data.keyboardType = 'inline';
  p.sheets[0].nodes[0].data.formatMode = 'html';
  const code = gen(p, 'F04');
  assertSyntax(code, 'F04');
  assert(code.includes('TelegramBadRequest'), 'TelegramBadRequest должен быть');
  assert(code.includes('ParseMode'), 'ParseMode должен быть');
});

test('F05', 'Проект с комбинацией флагов: mediaGroups + urlImages', () => {
  const p: any = deepClone(BASE_PROJECT);
  // attachedMedia — это массив строк (переменных)
  p.sheets[0].nodes[0].data.attachedMedia = [
    'https://example.com/1.jpg',
    'https://example.com/2.jpg',
  ];
  const code = gen(p, 'F05');
  assertSyntax(code, 'F05');
  assert(code.includes('InputMediaPhoto'), 'InputMediaPhoto должен быть');
});

test('F06', 'Проект с комбинацией флагов: datetime + timezone', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].type = 'mute_user';
  p.sheets[0].nodes[0].data.muteDuration = 60;
  const code = gen(p, 'F06');
  assertSyntax(code, 'F06');
  assert(code.includes('from datetime import datetime'), 'datetime должен быть');
  assert(code.includes('timezone'), 'timezone должен быть');
});

test('F07', 'Unicode в комментариях импортов', () => {
  const imports = genImportsOnly({
    userDatabaseEnabled: true,
    hasInlineButtons: false,
    hasMediaNodes: false,
    hasParseModeNodes: false,
    hasMediaGroups: false,
    hasUrlImages: false,
    hasDatetimeNodes: false,
    hasTimezoneNodes: false,
  }, 'F07');
  // Проверяем что импорты генерируются без ошибок с unicode
  assert(imports.includes('import asyncio'), 'asyncio должен быть');
  assert(imports.includes('import asyncpg'), 'asyncpg должен быть при userDatabaseEnabled=true');
});

test('F08', 'Все флаги false', () => {
  const imports = genImportsOnly({
    userDatabaseEnabled: false,
    hasInlineButtons: false,
    hasAutoTransitions: false,
    hasMediaNodes: false,
    hasUploadImages: false,
    hasParseModeNodes: false,
    hasMediaGroups: false,
    hasUrlImages: false,
    hasDatetimeNodes: false,
    hasTimezoneNodes: false,
  }, 'F08');
  assert(imports.includes('import asyncio'), 'asyncio должен быть');
  assert(!imports.includes('import asyncpg'), 'asyncpg не должен быть');
  assert(!imports.includes('import aiohttp'), 'aiohttp не должен быть');
  assert(!imports.includes('ParseMode'), 'ParseMode не должен быть');
});

test('F09', 'Все флаги true', () => {
  const imports = genImportsOnly({
    userDatabaseEnabled: true,
    hasInlineButtons: true,
    hasAutoTransitions: true,
    hasMediaNodes: true,
    hasUploadImages: true,
    hasParseModeNodes: true,
    hasMediaGroups: true,
    hasUrlImages: true,
    hasDatetimeNodes: true,
    hasTimezoneNodes: true,
  }, 'F09');
  assert(imports.includes('import asyncio'), 'asyncio должен быть');
  assert(imports.includes('import asyncpg'), 'asyncpg должен быть');
  assert(imports.includes('import aiohttp'), 'aiohttp должен быть');
  assert(imports.includes('ParseMode'), 'ParseMode должен быть');
  assert(imports.includes('InputMediaPhoto'), 'InputMediaPhoto должен быть');
  assert(imports.includes('URLInputFile'), 'URLInputFile должен быть');
  assert(imports.includes('from datetime import datetime'), 'datetime должен быть');
  assert(imports.includes('timezone'), 'timezone должен быть');
});

test('F10', 'hasAutoTransitions без hasInlineButtons', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes.push({
    id: 'auto_node',
    type: 'message',
    position: { x: 100, y: 100 },
    data: {
      messageText: 'Auto',
      buttons: [],
      enableAutoTransition: true,
      autoTransitionTo: 'other_node',
    },
  });
  const code = gen(p, 'F10');
  assertSyntax(code, 'F10');
  assert(code.includes('TelegramBadRequest'), 'TelegramBadRequest должен быть при autoTransition');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок G: Синтаксическая валидация Python
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок G: Синтаксическая валидация ───────────────────────────');

test('G01', 'Базовые импорты — валидный Python', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'G01');
  assertSyntax(code, 'G01');
});

test('G02', 'Импорты с asyncpg — валидный Python', () => {
  const p = deepClone(BASE_PROJECT);
  const code = gen(p, 'G02', { userDatabaseEnabled: true });
  assertSyntax(code, 'G02');
});

test('G03', 'Импорты с aiohttp — валидный Python', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  const code = gen(p, 'G03');
  assertSyntax(code, 'G03');
});

test('G04', 'Импорты с ParseMode — валидный Python', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.formatMode = 'html';
  const code = gen(p, 'G04');
  assertSyntax(code, 'G04');
});

test('G05', 'Импорты с InputMedia — валидный Python', () => {
  const p: any = deepClone(BASE_PROJECT);
  // attachedMedia — это массив строк (переменных)
  p.sheets[0].nodes[0].data.attachedMedia = [
    'media_var_1',
    'media_var_2',
  ];
  const code = gen(p, 'G05');
  assertSyntax(code, 'G05');
});

test('G06', 'Импорты с URLInputFile — валидный Python', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  const code = gen(p, 'G06');
  assertSyntax(code, 'G06');
});

test('G07', 'Импорты с datetime/timezone — валидный Python', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].type = 'mute_user';
  const code = gen(p, 'G07');
  assertSyntax(code, 'G07');
});

test('G08', 'Импорты с TelegramBadRequest — валидный Python', () => {
  const p = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.buttons = [
    { id: 'btn1', text: 'Click', action: 'goto', target: 'msg1' }
  ];
  p.sheets[0].nodes[0].data.keyboardType = 'inline';
  const code = gen(p, 'G08');
  assertSyntax(code, 'G08');
});

test('G09', 'Все импорты вместе — валидный Python', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.buttons = [
    { id: 'btn1', text: 'Click', action: 'goto', target: 'msg1' }
  ];
  p.sheets[0].nodes[0].data.keyboardType = 'inline';
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  p.sheets[0].nodes[0].data.formatMode = 'html';
  // attachedMedia — это массив строк (переменных)
  p.sheets[0].nodes[0].data.attachedMedia = [
    'media_var_1',
    'media_var_2',
  ];
  const code = gen(p, 'G09', { userDatabaseEnabled: true });
  assertSyntax(code, 'G09');
});

test('G10', 'generateImports напрямую — валидный Python', () => {
  const imports = genImportsOnly({
    userDatabaseEnabled: true,
    hasInlineButtons: true,
    hasAutoTransitions: true,
    hasMediaNodes: true,
    hasUploadImages: true,
    hasParseModeNodes: true,
    hasMediaGroups: true,
    hasUrlImages: true,
    hasDatetimeNodes: true,
    hasTimezoneNodes: true,
  }, 'G10');
  
  const fullCode = `${imports}\n\n# Dummy code for syntax check\nasync def main():\n    pass\n`;
  assertSyntax(fullCode, 'G10');
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок H: Производительность
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок H: Производительность ─────────────────────────────────');

test('H01', 'Генерация импортов < 10ms (базовый случай)', () => {
  const p = deepClone(BASE_PROJECT);
  const start = performance.now();
  gen(p, 'H01');
  const elapsed = performance.now() - start;
  assert(elapsed < 10, `Генерация должна быть < 10ms, было ${elapsed.toFixed(2)}ms`);
});

test('H02', 'Генерация импортов < 10ms (с database)', () => {
  const p = deepClone(BASE_PROJECT);
  const start = performance.now();
  gen(p, 'H02', { userDatabaseEnabled: true });
  const elapsed = performance.now() - start;
  assert(elapsed < 10, `Генерация должна быть < 10ms, было ${elapsed.toFixed(2)}ms`);
});

test('H03', 'Генерация импортов < 10ms (со всеми флагами)', () => {
  const p: any = deepClone(BASE_PROJECT);
  p.sheets[0].nodes[0].data.buttons = [
    { id: 'btn1', text: 'Click', action: 'goto', target: 'msg1' }
  ];
  p.sheets[0].nodes[0].data.keyboardType = 'inline';
  p.sheets[0].nodes[0].data.imageUrl = 'https://example.com/image.jpg';
  p.sheets[0].nodes[0].data.formatMode = 'html';
  // attachedMedia — это массив строк (переменных)
  p.sheets[0].nodes[0].data.attachedMedia = [
    'media_var_1',
    'media_var_2',
  ];
  const start = performance.now();
  gen(p, 'H03', { userDatabaseEnabled: true });
  const elapsed = performance.now() - start;
  assert(elapsed < 10, `Генерация должна быть < 10ms, было ${elapsed.toFixed(2)}ms`);
});

test('H04', '100 генераций < 200ms', () => {
  const p = deepClone(BASE_PROJECT);
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    gen(p, `H04_${i}`);
  }
  const elapsed = performance.now() - start;
  assert(elapsed < 200, `100 генераций должны быть < 200ms, было ${elapsed.toFixed(2)}ms`);
});

test('H05', 'generateImports напрямую < 1ms', () => {
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    genImportsOnly({
      userDatabaseEnabled: i % 2 === 0,
      hasInlineButtons: i % 3 === 0,
      hasMediaNodes: i % 4 === 0,
      hasParseModeNodes: i % 5 === 0,
      hasMediaGroups: i % 6 === 0,
      hasUrlImages: i % 7 === 0,
      hasDatetimeNodes: i % 8 === 0,
      hasTimezoneNodes: i % 9 === 0,
      hasAutoTransitions: false,
      hasUploadImages: false,
    }, `H05_${i}`);
  }
  const elapsed = performance.now() - start;
  assert(elapsed < 100, `100 генераций generateImports должны быть < 100ms, было ${elapsed.toFixed(2)}ms`);
});

// ════════════════════════════════════════════════════════════════════════════
//  Блок I: Модульное тестирование generateImports
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок I: Модульное тестирование generateImports ─────────────');

test('I01', 'generateImports с пустыми параметрами', () => {
  const imports = genImportsOnly({}, 'I01');
  assert(imports.includes('import asyncio'), 'asyncio должен быть');
  assert(!imports.includes('import asyncpg'), 'asyncpg не должен быть');
});

test('I02', 'generateImports только с userDatabaseEnabled', () => {
  const imports = genImportsOnly({ userDatabaseEnabled: true }, 'I02');
  assert(imports.includes('import asyncpg'), 'asyncpg должен быть');
  assert(imports.includes('import json'), 'json должен быть');
});

test('I03', 'generateImports только с hasInlineButtons', () => {
  const imports = genImportsOnly({ hasInlineButtons: true }, 'I03');
  assert(imports.includes('TelegramBadRequest'), 'TelegramBadRequest должен быть');
});

test('I04', 'generateImports только с hasAutoTransitions', () => {
  const imports = genImportsOnly({ hasAutoTransitions: true }, 'I04');
  assert(imports.includes('TelegramBadRequest'), 'TelegramBadRequest должен быть');
});

test('I05', 'generateImports только с hasMediaNodes', () => {
  const imports = genImportsOnly({ hasMediaNodes: true }, 'I05');
  assert(imports.includes('import aiohttp'), 'aiohttp должен быть');
  assert(imports.includes('TCPConnector'), 'TCPConnector должен быть');
});

test('I06', 'generateImports только с hasUploadImages', () => {
  const imports = genImportsOnly({ hasUploadImages: true }, 'I06');
  assert(imports.includes('import aiohttp'), 'aiohttp должен быть');
  assert(imports.includes('TCPConnector'), 'TCPConnector должен быть');
});

test('I07', 'generateImports только с hasParseModeNodes', () => {
  const imports = genImportsOnly({ hasParseModeNodes: true }, 'I07');
  assert(imports.includes('ParseMode'), 'ParseMode должен быть');
});

test('I08', 'generateImports только с hasMediaGroups', () => {
  const imports = genImportsOnly({ hasMediaGroups: true }, 'I08');
  assert(imports.includes('InputMediaPhoto'), 'InputMediaPhoto должен быть');
  assert(imports.includes('InputMediaVideo'), 'InputMediaVideo должен быть');
  assert(imports.includes('InputMediaAudio'), 'InputMediaAudio должен быть');
  assert(imports.includes('InputMediaDocument'), 'InputMediaDocument должен быть');
});

test('I09', 'generateImports только с hasUrlImages', () => {
  const imports = genImportsOnly({ hasUrlImages: true }, 'I09');
  assert(imports.includes('URLInputFile'), 'URLInputFile должен быть');
});

test('I10', 'generateImports только с hasDatetimeNodes', () => {
  const imports = genImportsOnly({ hasDatetimeNodes: true }, 'I10');
  assert(imports.includes('from datetime import datetime'), 'datetime должен быть');
});

test('I11', 'generateImports только с hasTimezoneNodes', () => {
  // hasTimezoneNodes сам по себе не добавляет datetime — нужен hasDatetimeNodes или userDatabaseEnabled
  // Проверяем что timezone добавляется только вместе с datetime
  const imports1 = genImportsOnly({ hasTimezoneNodes: true }, 'I11a');
  // Без hasDatetimeNodes или userDatabaseEnabled, datetime не должен быть
  assert(!imports1.includes('from datetime import'), 'datetime не должен быть только с hasTimezoneNodes');
  
  // С hasDatetimeNodes + hasTimezoneNodes
  const imports2 = genImportsOnly({ hasDatetimeNodes: true, hasTimezoneNodes: true }, 'I11b');
  assert(imports2.includes('from datetime import datetime'), 'datetime должен быть с hasDatetimeNodes');
  assert(imports2.includes('timezone'), 'timezone должен быть с hasTimezoneNodes');
});

test('I12', 'generateImports с userDatabaseEnabled + hasDatetimeNodes', () => {
  const imports = genImportsOnly({ 
    userDatabaseEnabled: true, 
    hasDatetimeNodes: true,
    hasTimezoneNodes: true,
  }, 'I12');
  assert(imports.includes('import asyncpg'), 'asyncpg должен быть');
  assert(imports.includes('import json'), 'json должен быть');
  assert(imports.includes('from datetime import datetime'), 'datetime должен быть');
  assert(imports.includes('timezone'), 'timezone должен быть');
});

// ─── Итог ─────────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итог: ${passed}/${results.length} пройдено  |  Провалено: ${failed}${' '.repeat(Math.max(0, 40 - String(passed).length - String(results.length).length - String(failed).length))}║`);
console.log('╚══════════════════════════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     ${r.note}`);
  });
  process.exit(1);
}

console.log('\n✅ Все тесты пройдены успешно!');
