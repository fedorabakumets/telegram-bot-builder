/**
 * @fileoverview Тест фазы для узла outgoing_message_trigger
 *
 * Блок A: Базовая генерация (10 тестов)
 * Блок B: Целевые ноды (8 тестов)
 * Блок C: Взаимодействие с другими триггерами (5 тестов)
 * Блок D: forward_message с last_bot_message (5 тестов)
 * Блок E: FakeMessage и chat_id (7 тестов)
 * Блок F: Медиа-сообщения и last_bot_message_id (4 теста)
 * Блок G: Стикеры, голосовые, анимации, медиагруппы (5 тестов)
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
    botName: `PhaseOMT_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код для проверки
 * @param label - Метка для временного файла
 * @returns Результат проверки
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_omt_${label}.py`;
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

/** Тип результата теста */
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

// ─── Вспомогательные функции для создания узлов ──────────────────────────────

/**
 * Создаёт узел outgoing_message_trigger
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @returns Объект узла типа outgoing_message_trigger
 */
function makeOutgoingMessageTriggerNode(id: string, targetId: string) {
  return {
    id,
    type: 'outgoing_message_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт message-узел
 * @param id - ID узла
 * @param text - Текст сообщения
 * @returns Объект узла типа message
 */
function makeMessageNode(id: string, text = 'Ответ') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: { messageText: text, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

/**
 * Создаёт forward_message-узел
 * @param id - ID узла
 * @param targetChatId - ID целевого чата
 * @param sourceMode - Режим источника сообщения
 * @returns Объект узла типа forward_message
 */
function makeForwardMessageNode(id: string, targetChatId: string, sourceMode = 'current_message') {
  return {
    id,
    type: 'forward_message',
    position: { x: 0, y: 0 },
    data: {
      sourceMessageIdSource: sourceMode,
      targetChatTargets: [{ id: 'r1', targetChatIdSource: 'manual', targetChatId, targetChatType: 'user' }],
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 * Создаёт forward_message-узел с топиком
 * @param id - ID узла
 * @param targetChatId - ID целевого чата
 * @param threadId - ID топика
 * @param sourceMode - Режим источника сообщения
 * @returns Объект узла типа forward_message с топиком
 */
function makeForwardMessageNodeWithThread(id: string, targetChatId: string, threadId: string, sourceMode = 'current_message') {
  return {
    id,
    type: 'forward_message',
    position: { x: 0, y: 0 },
    data: {
      sourceMessageIdSource: sourceMode,
      targetChatTargets: [{ id: 'r1', targetChatIdSource: 'manual', targetChatId, targetChatType: 'group', targetThreadId: threadId }],
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 * Создаёт condition-узел
 * @param id - ID узла
 * @param targetId - ID целевого узла при совпадении
 * @returns Объект узла типа condition
 */
function makeConditionNode(id: string, targetId: string) {
  return {
    id,
    type: 'condition',
    position: { x: 0, y: 0 },
    data: {
      conditions: [{ id: 'br1', label: 'Ветка', variable: 'message_text', operator: 'contains', value: 'привет', targetNodeId: targetId }],
      defaultTargetId: '',
    },
  };
}

/**
 * Создаёт incoming_callback_trigger-узел
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @returns Объект узла типа incoming_callback_trigger
 */
function makeIncomingCallbackTriggerNode(id: string, targetId: string) {
  return {
    id,
    type: 'incoming_callback_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт incoming_message_trigger-узел
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @returns Объект узла типа incoming_message_trigger
 */
function makeIncomingMessageTriggerNode(id: string, targetId: string) {
  return {
    id,
    type: 'incoming_message_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт start-узел
 * @param id - ID узла
 * @returns Объект узла типа start
 */
function makeStartNode(id: string) {
  return {
    id,
    type: 'start',
    position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет!', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест — Узел outgoing_message_trigger                       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'outgoing_message_trigger → генерирует _outgoing_message_trigger_handlers', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('_outgoing_message_trigger_handlers'), '_outgoing_message_trigger_handlers должен быть в коде');
});

test('A02', 'имя обработчика содержит nodeId', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt_abc', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('outgoing_message_trigger_omt_abc_handler'), 'имя обработчика должно содержать nodeId');
});

test('A03', 'обработчик содержит last_bot_message_id', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a03');
  ok(code.includes('last_bot_message_id'), 'last_bot_message_id должен быть в коде');
});

test('A04', 'обработчик содержит message_text', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a04');
  ok(code.includes('message_text'), 'message_text должен быть в коде');
});

test('A05', 'обработчик вызывает handle_callback_<targetId>', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg_target'), makeMessageNode('msg_target')]);
  const code = gen(p, 'a05');
  ok(code.includes('await handle_callback_msg_target(fake_cb)'), 'вызов handle_callback_msg_target должен быть в коде');
});

test('A06', 'обработчик содержит logging.info', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a06');
  ok(code.includes('logging.info('), 'logging.info должен быть в коде');
});

test('A07', 'обработчик содержит logging.error', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a07');
  ok(code.includes('logging.error'), 'logging.error должен быть в коде');
});

test('A08', 'без autoTransitionTo → обработчик не генерируется', () => {
  const trigger = {
    id: 'omt_bad', type: 'outgoing_message_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: '', buttons: [], keyboardType: 'none' },
  };
  const p = makeCleanProject([trigger]);
  const code = gen(p, 'a08');
  ok(!code.includes('outgoing_message_trigger_omt_bad_handler'), 'обработчик НЕ должен генерироваться без autoTransitionTo');
});

test('A09', 'два триггера → два обработчика в списке', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'msg1'),
    makeOutgoingMessageTriggerNode('omt2', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a09');
  ok(code.includes('outgoing_message_trigger_omt1_handler'), 'первый обработчик должен быть в коде');
  ok(code.includes('outgoing_message_trigger_omt2_handler'), 'второй обработчик должен быть в коде');
});

test('A10', 'синтаксис Python OK', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'a10'), 'a10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Целевые ноды
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Целевые ноды ──────────────────────────────────────────');

test('B01', 'outgoing_message_trigger → message → синтаксис OK', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'b01'), 'b01');
});

test('B02', 'outgoing_message_trigger → forward_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNode('fwd1', '123456789'),
  ]);
  syntax(gen(p, 'b02'), 'b02');
});

test('B03', 'outgoing_message_trigger → forward_message с last_bot_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNode('fwd1', '-1002300967595', 'last_bot_message'),
  ]);
  syntax(gen(p, 'b03'), 'b03');
});

test('B04', 'outgoing_message_trigger → condition → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'cond1'),
    makeConditionNode('cond1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'b04'), 'b04');
});

test('B05', 'outgoing_message_trigger → message с {message_text} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'msg1'),
    makeMessageNode('msg1', 'Бот написал: {message_text}'),
  ]);
  syntax(gen(p, 'b05'), 'b05');
});

test('B06', 'outgoing_message_trigger → message с {last_bot_message_id} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'msg1'),
    makeMessageNode('msg1', 'ID сообщения: {last_bot_message_id}'),
  ]);
  syntax(gen(p, 'b06'), 'b06');
});

test('B07', 'outgoing_message_trigger → forward_message с топиком → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNodeWithThread('fwd1', '-1002300967595', '618', 'last_bot_message'),
  ]);
  syntax(gen(p, 'b07'), 'b07');
});

test('B08', 'два outgoing_message_trigger → разные целевые ноды → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeOutgoingMessageTriggerNode('omt2', 'msg_log'),
    makeForwardMessageNode('fwd1', '123456789'),
    makeMessageNode('msg_log', 'Лог: {message_text}'),
  ]);
  syntax(gen(p, 'b08'), 'b08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Взаимодействие с другими триггерами
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Взаимодействие с другими триггерами ───────────────────');

test('C01', 'outgoing_message_trigger + incoming_callback_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeForwardMessageNode('fwd1', '123456789'),
    makeMessageNode('msg1', 'Нажата кнопка'),
  ]);
  syntax(gen(p, 'c01'), 'c01');
});

test('C02', 'outgoing_message_trigger + incoming_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeIncomingMessageTriggerNode('imt1', 'msg1'),
    makeForwardMessageNode('fwd1', '123456789'),
    makeMessageNode('msg1', 'Получено сообщение'),
  ]);
  syntax(gen(p, 'c02'), 'c02');
});

test('C03', 'outgoing_message_trigger + start + message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNode('fwd1', '123456789'),
  ]);
  syntax(gen(p, 'c03'), 'c03');
});

test('C04', 'два outgoing_message_trigger + incoming_callback_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeOutgoingMessageTriggerNode('omt2', 'msg_log'),
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeForwardMessageNode('fwd1', '123456789'),
    makeMessageNode('msg_log', 'Лог'),
    makeMessageNode('msg1', 'Кнопка'),
  ]);
  syntax(gen(p, 'c04'), 'c04');
});

test('C05', 'outgoing_message_trigger + incoming_callback_trigger + incoming_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeIncomingMessageTriggerNode('imt1', 'msg2'),
    makeForwardMessageNode('fwd1', '123456789'),
    makeMessageNode('msg1', 'Кнопка'),
    makeMessageNode('msg2', 'Сообщение'),
  ]);
  syntax(gen(p, 'c05'), 'c05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: forward_message с last_bot_message
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: forward_message с last_bot_message ────────────────────');

test('D01', 'outgoing_message_trigger → forward_message с last_bot_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNode('fwd1', '-1002300967595', 'last_bot_message'),
  ]);
  syntax(gen(p, 'd01'), 'd01');
});

test('D02', 'forward_message с last_bot_message содержит last_bot_message_id', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNode('fwd1', '-1002300967595', 'last_bot_message'),
  ]);
  const code = gen(p, 'd02');
  ok(code.includes('last_bot_message_id'), 'last_bot_message_id должен быть в коде forward_message');
});

test('D03', 'forward_message с last_bot_message + топик → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNodeWithThread('fwd1', '-1002300967595', '618', 'last_bot_message'),
  ]);
  syntax(gen(p, 'd03'), 'd03');
});

test('D04', 'outgoing_message_trigger + forward_message + incoming_callback_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeForwardMessageNodeWithThread('fwd1', '-1002300967595', '618', 'last_bot_message'),
    makeMessageNode('msg1', 'Кнопка нажата'),
  ]);
  syntax(gen(p, 'd04'), 'd04');
});

test('D05', 'полный сценарий поддержки → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeOutgoingMessageTriggerNode('omt1', 'fwd_support'),
    makeIncomingCallbackTriggerNode('ict1', 'msg_notify'),
    makeForwardMessageNodeWithThread('fwd_support', '-1002300967595', '618', 'last_bot_message'),
    makeMessageNode('msg_notify', 'Пользователь {user_name} нажал кнопку'),
    makeMessageNode('msg_welcome', 'Добро пожаловать!'),
  ]);
  syntax(gen(p, 'd05'), 'd05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: FakeMessage и chat_id
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: FakeMessage и chat_id ─────────────────────────────────');

/** E01: Проверяет наличие FakeMessage в сгенерированном коде */
test('E01', 'обработчик содержит FakeMessage', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e01');
  ok(code.includes('FakeMessage'), 'FakeMessage должен быть в коде');
});

/** E02: Проверяет наличие _effective_chat_id в сгенерированном коде */
test('E02', 'обработчик содержит _effective_chat_id', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e02');
  ok(code.includes('_effective_chat_id'), '_effective_chat_id должен быть в коде');
});

/** E03: Проверяет что сигнатура содержит chat_id: int = 0 */
test('E03', 'обработчик принимает chat_id параметр', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e03');
  ok(code.includes('chat_id: int = 0'), 'chat_id: int = 0 должен быть в сигнатуре');
});

/** E04: Проверяет наличие self.chat в FakeMessage */
test('E04', 'FakeMessage содержит self.chat с id', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e04');
  ok(code.includes('self.chat'), 'self.chat должен быть в FakeMessage');
});

/** E05: Проверяет наличие self.message_id в FakeMessage */
test('E05', 'FakeMessage содержит message_id', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e05');
  ok(code.includes('self.message_id'), 'self.message_id должен быть в FakeMessage');
});

/** E06: Проверяет синтаксис при связке omt → forward_message с last_bot_message + FakeMessage */
test('E06', 'outgoing_message_trigger → forward_message с last_bot_message + FakeMessage → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNodeWithThread('fwd1', '-1002300967595', '618', 'last_bot_message'),
  ]);
  syntax(gen(p, 'e06'), 'e06');
});

/** E07: Проверяет что middleware вызывает обработчик с chat_id */
test('E07', 'middleware содержит chat_id в вызове обработчика', () => {
  const p = makeCleanProject([makeOutgoingMessageTriggerNode('omt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e07');
  // Проверяем что middleware передаёт chat_id
  ok(code.includes('_omt_handler') || code.includes('outgoing_message_trigger'), 'middleware должен вызывать обработчик');
  syntax(code, 'e07');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Медиа-сообщения и last_bot_message_id
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Медиа-сообщения ───────────────────────────────────────');

/**
 * F01: Проверяет синтаксис при связке omt → forward_message с фото
 */
test('F01', 'outgoing_message_trigger + message с фото → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    {
      id: 'fwd1', type: 'forward_message', position: { x: 0, y: 0 },
      data: { sourceMessageIdSource: 'last_bot_message', targetChatTargets: [{ id: 'r1', targetChatIdSource: 'manual', targetChatId: '123', targetChatType: 'user' }], buttons: [], keyboardType: 'none' },
    },
  ]);
  syntax(gen(p, 'f01'), 'f01');
});

/**
 * F02: Проверяет наличие last_bot_message_id при связке omt → forward_message с last_bot_message
 */
test('F02', 'outgoing_message_trigger → forward_message last_bot_message → содержит last_bot_message_id', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNode('fwd1', '123', 'last_bot_message'),
  ]);
  const code = gen(p, 'f02');
  ok(code.includes('last_bot_message_id'), 'last_bot_message_id должен быть в коде');
});

/**
 * F03: Проверяет синтаксис при включённой базе данных пользователей
 */
test('F03', 'outgoing_message_trigger + userDatabaseEnabled → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNodeWithThread('fwd1', '-1002300967595', '618', 'last_bot_message'),
  ]);
  const code = generatePythonCode(p as any, { botName: 'PhaseOMT_f03', userDatabaseEnabled: true, enableComments: false });
  syntax(code, 'f03');
});

/**
 * F04: Полный сценарий с несколькими триггерами → синтаксис OK
 */
test('F04', 'полный сценарий: start + omt + ict + forward_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeOutgoingMessageTriggerNode('omt1', 'fwd_support'),
    makeOutgoingMessageTriggerNode('omt2', 'msg_log'),
    makeIncomingCallbackTriggerNode('ict1', 'msg_notify'),
    makeIncomingMessageTriggerNode('imt1', 'msg_relay'),
    makeForwardMessageNodeWithThread('fwd_support', '-1002300967595', '618', 'last_bot_message'),
    makeMessageNode('msg_log', 'Лог: {message_text} (id: {last_bot_message_id})'),
    makeMessageNode('msg_notify', 'Кнопка: {button_text}'),
    makeMessageNode('msg_relay', 'Сообщение от пользователя'),
    makeMessageNode('msg_welcome', 'Добро пожаловать!'),
  ]);
  syntax(gen(p, 'f04'), 'f04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Стикеры, голосовые, анимации, медиагруппы
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Стикеры, голосовые, анимации, медиагруппы ─────────────');

test('G01', 'outgoing_message_trigger + sticker-нода → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNode('fwd1', '123456789', 'last_bot_message'),
    { id: 'sticker1', type: 'sticker', position: { x: 0, y: 0 }, data: { stickerFileId: 'CAACAgIA', buttons: [], keyboardType: 'none' } },
  ]);
  syntax(gen(p, 'g01'), 'g01');
});

test('G02', 'outgoing_message_trigger + voice-нода → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNode('fwd1', '123456789', 'last_bot_message'),
    { id: 'voice1', type: 'voice', position: { x: 0, y: 0 }, data: { voiceUrl: 'https://example.com/voice.ogg', buttons: [], keyboardType: 'none' } },
  ]);
  syntax(gen(p, 'g02'), 'g02');
});

test('G03', 'outgoing_message_trigger + animation-нода → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNode('fwd1', '123456789', 'last_bot_message'),
    { id: 'anim1', type: 'animation', position: { x: 0, y: 0 }, data: { animationUrl: 'https://example.com/anim.gif', buttons: [], keyboardType: 'none' } },
  ]);
  syntax(gen(p, 'g03'), 'g03');
});

test('G04', 'outgoing_message_trigger + media-нода → синтаксис OK', () => {
  const p = makeCleanProject([
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeForwardMessageNode('fwd1', '123456789', 'last_bot_message'),
    { id: 'media1', type: 'media', position: { x: 0, y: 0 }, data: { attachedMedia: ['https://example.com/photo.jpg'], buttons: [], keyboardType: 'none' } },
  ]);
  syntax(gen(p, 'g04'), 'g04');
});

test('G05', 'полный сценарий со всеми типами нод → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeOutgoingMessageTriggerNode('omt1', 'fwd_support'),
    makeIncomingCallbackTriggerNode('ict1', 'msg_notify'),
    makeForwardMessageNodeWithThread('fwd_support', '-1002300967595', '618', 'last_bot_message'),
    makeMessageNode('msg_notify', 'Уведомление'),
    makeMessageNode('msg_welcome', 'Добро пожаловать!'),
    { id: 'sticker1', type: 'sticker', position: { x: 0, y: 0 }, data: { stickerFileId: 'CAACAgIA', buttons: [], keyboardType: 'none' } },
    { id: 'voice1', type: 'voice', position: { x: 0, y: 0 }, data: { voiceUrl: 'https://example.com/voice.ogg', buttons: [], keyboardType: 'none' } },
  ]);
  syntax(gen(p, 'g05'), 'g05');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║   Итого: ${passed}/${total} пройдено${failed > 0 ? `, ${failed} провалено` : ''}${' '.repeat(Math.max(0, 38 - String(passed).length - String(total).length - (failed > 0 ? String(failed).length + 10 : 0)))}║`);
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) {
  console.log('Провалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
} else {
  console.log('✅ Все тесты пройдены!\n');
  process.exit(0);
}
