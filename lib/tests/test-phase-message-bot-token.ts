/**
 * @fileoverview Фазовый тест — поддержка botToken в получателях узла message и media-node
 *
 * Блок A: Базовая генерация botToken (5 тестов)
 * Блок B: Переменные в botToken (3 теста)
 * Блок C: Несколько получателей (3 теста)
 * Блок D: media-node (3 теста)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Вспомогательные утилиты ─────────────────────────────────────────────────

/**
 * Создаёт минимальный проект с заданными узлами
 * @param nodes - Массив узлов
 * @returns Объект проекта
 */
function makeProject(nodes: any[]) {
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
    botName: `PhaseBotToken_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код для проверки
 * @param label - Метка для временного файла
 */
function syntax(code: string, label: string): void {
  const tmp = `_tmp_bt_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
  } catch (e: any) {
    try { fs.unlinkSync(tmp); } catch {}
    throw new Error(`Синтаксическая ошибка:\n${e.stderr?.toString() ?? String(e)}`);
  }
}

/** Тип результата теста */
type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

/**
 * Запускает тест и записывает результат
 * @param id - Идентификатор теста
 * @param name - Название теста
 * @param fn - Функция теста
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
 * Проверяет условие, бросает ошибку если не выполнено
 * @param cond - Условие
 * @param msg - Сообщение об ошибке
 */
function ok(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

// ─── Вспомогательные функции для создания узлов ──────────────────────────────

/**
 * Создаёт message-узел с опциональными получателями
 * @param id - ID узла
 * @param text - Текст сообщения
 * @param recipients - Список получателей
 * @returns Объект узла типа message
 */
function makeMessageNode(id: string, text = 'Сообщение', recipients: any[] = []): any {
  return {
    id, type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: text,
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      messageSendRecipients: recipients,
    },
  };
}

/**
 * Создаёт media-узел с опциональными получателями
 * @param id - ID узла
 * @param media - Массив URL медиафайлов
 * @param recipients - Список получателей
 * @returns Объект узла типа media
 */
function makeMediaNode(id: string, media: string[], recipients: any[] = []): any {
  return {
    id, type: 'media',
    position: { x: 0, y: 0 },
    data: {
      attachedMedia: media,
      enableAutoTransition: false,
      autoTransitionTo: '',
      buttons: [],
      keyboardType: 'none',
      messageSendRecipients: recipients,
    },
  };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фазовый тест — botToken в получателях message/media-node   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация botToken
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация botToken ────────────────────────────');

test('A01', 'при botToken генерируется Bot(token=...)', () => {
  const p = makeProject([makeMessageNode('msg1', 'Привет', [
    { id: 'r1', type: 'chat_id', chatId: '123456789', botToken: 'my_token_123' },
  ])]);
  const code = gen(p, 'a01');
  ok(code.includes('_rbot = Bot(token='), '_rbot = Bot(token=...) должен быть в коде при наличии botToken');
});

test('A02', 'при botToken вызывается replace_variables_in_text для токена', () => {
  const p = makeProject([makeMessageNode('msg1', 'Привет', [
    { id: 'r1', type: 'chat_id', chatId: '123456789', botToken: '{my_token}' },
  ])]);
  const code = gen(p, 'a02');
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text должен быть в коде');
  ok(code.includes('_rbot_token'), '_rbot_token должен быть в коде');
});

test('A03', 'без botToken НЕ генерируется Bot(token=...)', () => {
  const p = makeProject([makeMessageNode('msg1', 'Привет', [
    { id: 'r1', type: 'chat_id', chatId: '123456789' },
  ])]);
  const code = gen(p, 'a03');
  ok(!code.includes('_rbot = Bot(token='), '_rbot = Bot(token=...) НЕ должен быть без botToken');
});

test('A04', 'синтаксис Python корректен с botToken', () => {
  const p = makeProject([makeMessageNode('msg1', 'Привет', [
    { id: 'r1', type: 'chat_id', chatId: '{target_chat}', botToken: '{token_status.instance.token}' },
  ])]);
  syntax(gen(p, 'a04'), 'a04');
});

test('A05', '_send_to функция принимает параметр _bot=None', () => {
  const p = makeProject([makeMessageNode('msg1', 'Привет', [
    { id: 'r1', type: 'chat_id', chatId: '123456789', botToken: 'tok' },
  ])]);
  const code = gen(p, 'a05');
  ok(code.includes('_bot=None'), '_bot=None должен быть в сигнатуре функции _send_to');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Переменные в botToken
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Переменные в botToken ─────────────────────────────────');

test('B01', '{token_status.instance.token} подставляется через replace_variables_in_text', () => {
  const p = makeProject([makeMessageNode('msg1', 'Уведомление', [
    { id: 'r1', type: 'chat_id', chatId: '{target_user_id}', botToken: '{token_status.instance.token}' },
  ])]);
  const code = gen(p, 'b01');
  ok(code.includes('{token_status.instance.token}'), 'шаблон токена должен быть в коде');
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text должен быть в коде');
  ok(code.includes('_rbot_token'), '_rbot_token должен быть в коде');
  syntax(code, 'b01');
});

test('B02', 'прямой токен (не переменная) тоже работает', () => {
  const p = makeProject([makeMessageNode('msg1', 'Уведомление', [
    { id: 'r1', type: 'chat_id', chatId: '123456789', botToken: '1234567890:ABCDEFabcdef' },
  ])]);
  const code = gen(p, 'b02');
  ok(code.includes('_rbot = Bot(token='), '_rbot = Bot(token=...) должен быть в коде');
  ok(code.includes('1234567890:ABCDEFabcdef'), 'прямой токен должен быть в коде');
  syntax(code, 'b02');
});

test('B03', 'пустой botToken не генерирует Bot(token=...)', () => {
  const p = makeProject([makeMessageNode('msg1', 'Уведомление', [
    { id: 'r1', type: 'chat_id', chatId: '123456789', botToken: '' },
  ])]);
  const code = gen(p, 'b03');
  ok(!code.includes('_rbot = Bot(token='), '_rbot = Bot(token=...) НЕ должен быть при пустом botToken');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Несколько получателей
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Несколько получателей ─────────────────────────────────');

test('C01', 'один с botToken, один без — каждый обрабатывается правильно', () => {
  const p = makeProject([makeMessageNode('msg1', 'Уведомление', [
    { id: 'r1', type: 'chat_id', chatId: '111', botToken: '{my_token}' },
    { id: 'r2', type: 'chat_id', chatId: '222' },
  ])]);
  const code = gen(p, 'c01');
  ok(code.includes('_rbot = Bot(token='), '_rbot = Bot(token=...) должен быть для первого получателя');
  ok(code.includes('_send_to_msg1(_rchat_id, _rthread_int)\n'), 'вызов без _bot= должен быть для второго получателя');
  syntax(code, 'c01');
});

test('C02', 'два с разными botToken — оба генерируют Bot(token=...)', () => {
  const p = makeProject([makeMessageNode('msg1', 'Уведомление', [
    { id: 'r1', type: 'chat_id', chatId: '111', botToken: '{token_a}' },
    { id: 'r2', type: 'chat_id', chatId: '222', botToken: '{token_b}' },
  ])]);
  const code = gen(p, 'c02');
  const count = (code.match(/_rbot = Bot\(token=/g) || []).length;
  ok(count >= 2, `Должно быть минимум 2 _rbot = Bot(token=...), найдено: ${count}`);
  syntax(code, 'c02');
});

test('C03', 'синтаксис Python корректен для нескольких получателей', () => {
  const p = makeProject([makeMessageNode('msg1', 'Уведомление', [
    { id: 'r1', type: 'user' },
    { id: 'r2', type: 'chat_id', chatId: '{chat_a}', botToken: '{tok_a}' },
    { id: 'r3', type: 'chat_id', chatId: '{chat_b}' },
  ])]);
  syntax(gen(p, 'c03'), 'c03');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: media-node
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: media-node ────────────────────────────────────────────');

test('D01', 'media-node с botToken генерирует Bot(token=...)', () => {
  const p = makeProject([makeMediaNode('media1', ['https://example.com/photo.jpg'], [
    { id: 'r1', type: 'chat_id', chatId: '{target_user_id}', botToken: '{token_status.instance.token}' },
  ])]);
  const code = gen(p, 'd01');
  ok(code.includes('_rbot = Bot(token='), '_rbot = Bot(token=...) должен быть в коде media-node');
  ok(code.includes('_rbot_token'), '_rbot_token должен быть в коде');
});

test('D02', 'синтаксис Python корректен для media-node с botToken', () => {
  const p = makeProject([makeMediaNode('media1', ['https://example.com/photo.jpg'], [
    { id: 'r1', type: 'chat_id', chatId: '{target_chat}', botToken: '{my_bot_token}' },
  ])]);
  syntax(gen(p, 'd02'), 'd02');
});

test('D03', 'без botToken в media-node — поведение не изменилось', () => {
  const p = makeProject([makeMediaNode('media1', ['https://example.com/photo.jpg'], [
    { id: 'r1', type: 'chat_id', chatId: '123456789' },
  ])]);
  const code = gen(p, 'd03');
  ok(!code.includes('_rbot = Bot(token='), '_rbot = Bot(token=...) НЕ должен быть без botToken в media-node');
  ok(code.includes('_send_media_to_media1'), '_send_media_to_media1 должен быть в коде');
  syntax(code, 'd03');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║   Итого: ${passed}/${total} пройдено${failed > 0 ? `, ${failed} провалено` : ''}${' '.repeat(Math.max(0, 40 - String(passed).length - String(total).length - (failed > 0 ? String(failed).length + 10 : 0)))}║`);
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) {
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
} else {
  console.log('✅ Все тесты пройдены!\n');
  process.exit(0);
}
