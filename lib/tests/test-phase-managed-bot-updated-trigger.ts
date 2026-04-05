/**
 * @fileoverview Тест фазы для узла managed_bot_updated_trigger
 *
 * Блок A: Базовая генерация (10 тестов)
 * Блок B: Целевые ноды (6 тестов)
 * Блок C: Фильтр по user_id (4 теста)
 * Блок D: Взаимодействие с другими триггерами (5 тестов)
 * Блок E: FakeCallbackQuery (4 теста)
 * Блок F: Полные сценарии (3 теста)
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
    botName: `PhaseMBU_${label}`,
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
  const tmp = `_tmp_mbu_${label}.py`;
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
 * Создаёт узел managed_bot_updated_trigger
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @param extra - Дополнительные поля data
 * @returns Объект узла типа managed_bot_updated_trigger
 */
function makeManagedBotUpdatedTriggerNode(id: string, targetId: string, extra: Record<string, any> = {}) {
  return {
    id,
    type: 'managed_bot_updated_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none', ...extra },
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
 * @returns Объект узла типа forward_message
 */
function makeForwardMessageNode(id: string, targetChatId: string) {
  return {
    id,
    type: 'forward_message',
    position: { x: 0, y: 0 },
    data: {
      sourceMessageIdSource: 'current_message',
      targetChatTargets: [{ id: 'r1', targetChatIdSource: 'manual', targetChatId, targetChatType: 'user' }],
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
      conditions: [{ id: 'br1', label: 'Ветка', variable: 'bot_id', operator: 'not_empty', value: '', targetNodeId: targetId }],
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
 * Создаёт outgoing_message_trigger-узел
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
console.log('║   Тест — Узел managed_bot_updated_trigger                    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'managed_bot_updated_trigger → генерирует outer_middleware', () => {
  const p = makeCleanProject([makeManagedBotUpdatedTriggerNode('mbu1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('@dp.update.outer_middleware()'), '@dp.update.outer_middleware() должен быть в коде');
});

test('A02', 'имя middleware содержит nodeId', () => {
  const p = makeCleanProject([makeManagedBotUpdatedTriggerNode('mbu_abc', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('managed_bot_updated_trigger_mbu_abc_middleware'), 'имя middleware должно содержать nodeId');
});

test('A03', 'middleware содержит saveBotIdTo переменную', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1', { saveBotIdTo: 'bot_id' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a03');
  ok(code.includes('"bot_id"'), 'bot_id должен быть в коде');
});

test('A04', 'middleware содержит saveCreatorIdTo переменную', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1', { saveCreatorIdTo: 'creator_id' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a04');
  ok(code.includes('"creator_id"'), 'creator_id должен быть в коде');
});

test('A05', 'middleware вызывает handle_callback_<targetId>', () => {
  const p = makeCleanProject([makeManagedBotUpdatedTriggerNode('mbu1', 'msg_target'), makeMessageNode('msg_target')]);
  const code = gen(p, 'a05');
  ok(code.includes('await handle_callback_msg_target(fake_cb)'), 'вызов handle_callback_msg_target должен быть в коде');
});

test('A06', 'middleware содержит logging.info', () => {
  const p = makeCleanProject([makeManagedBotUpdatedTriggerNode('mbu1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a06');
  ok(code.includes('logging.info('), 'logging.info должен быть в коде');
});

test('A07', 'middleware содержит logging.error', () => {
  const p = makeCleanProject([makeManagedBotUpdatedTriggerNode('mbu1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a07');
  ok(code.includes('logging.error'), 'logging.error должен быть в коде');
});

test('A08', 'без autoTransitionTo → middleware не генерируется', () => {
  const trigger = {
    id: 'mbu_bad', type: 'managed_bot_updated_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: '', buttons: [], keyboardType: 'none' },
  };
  const p = makeCleanProject([trigger]);
  const code = gen(p, 'a08');
  ok(!code.includes('managed_bot_updated_trigger_mbu_bad_middleware'), 'middleware НЕ должен генерироваться без autoTransitionTo');
});

test('A09', 'два триггера → два middleware', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1'),
    makeManagedBotUpdatedTriggerNode('mbu2', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a09');
  ok(code.includes('managed_bot_updated_trigger_mbu1_middleware'), 'первый middleware должен быть в коде');
  ok(code.includes('managed_bot_updated_trigger_mbu2_middleware'), 'второй middleware должен быть в коде');
});

test('A10', 'синтаксис Python OK', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1', { saveBotIdTo: 'bot_id', saveCreatorIdTo: 'creator_id' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'a10'), 'a10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Целевые ноды
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Целевые ноды ──────────────────────────────────────────');

test('B01', 'managed_bot_updated_trigger → message → синтаксис OK', () => {
  const p = makeCleanProject([makeManagedBotUpdatedTriggerNode('mbu1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'b01'), 'b01');
});

test('B02', 'managed_bot_updated_trigger → forward_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'fwd1'),
    makeForwardMessageNode('fwd1', '123456789'),
  ]);
  syntax(gen(p, 'b02'), 'b02');
});

test('B03', 'managed_bot_updated_trigger → condition → синтаксис OK', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'cond1', { saveBotIdTo: 'bot_id' }),
    makeConditionNode('cond1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'b03'), 'b03');
});

test('B04', 'managed_bot_updated_trigger → message с {bot_id} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1', { saveBotIdTo: 'bot_id' }),
    makeMessageNode('msg1', 'ID бота: {bot_id}'),
  ]);
  syntax(gen(p, 'b04'), 'b04');
});

test('B05', 'managed_bot_updated_trigger → message с {creator_id} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1', { saveCreatorIdTo: 'creator_id' }),
    makeMessageNode('msg1', 'Создатель: {creator_id}'),
  ]);
  syntax(gen(p, 'b05'), 'b05');
});

test('B06', 'два managed_bot_updated_trigger → разные целевые ноды → синтаксис OK', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1', { saveBotIdTo: 'bot_id' }),
    makeManagedBotUpdatedTriggerNode('mbu2', 'fwd1'),
    makeMessageNode('msg1', 'Бот: {bot_id}'),
    makeForwardMessageNode('fwd1', '123456789'),
  ]);
  syntax(gen(p, 'b06'), 'b06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Фильтр по user_id
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Фильтр по user_id ─────────────────────────────────────');

test('C01', 'filterByUserId → содержит условие фильтрации', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1', { filterByUserId: '123456789' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c01');
  ok(code.includes('"123456789"'), 'filterByUserId должен быть в коде');
  ok(code.includes('str(user_id)'), 'str(user_id) должен быть в коде');
});

test('C02', 'filterByUserId → синтаксис OK', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1', { filterByUserId: '987654321' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'c02'), 'c02');
});

test('C03', 'без filterByUserId → нет условия фильтрации', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c03');
  ok(!code.includes('str(user_id) !='), 'условие фильтрации НЕ должно быть без filterByUserId');
});

test('C04', 'filterByUserId + saveBotIdTo → синтаксис OK', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1', { filterByUserId: '123456789', saveBotIdTo: 'bot_id' }),
    makeMessageNode('msg1', 'Бот: {bot_id}'),
  ]);
  syntax(gen(p, 'c04'), 'c04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Взаимодействие с другими триггерами
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Взаимодействие с другими триггерами ───────────────────');

test('D01', 'managed_bot_updated_trigger + incoming_callback_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1'),
    makeIncomingCallbackTriggerNode('ict1', 'msg2'),
    makeMessageNode('msg1', 'Бот создан'),
    makeMessageNode('msg2', 'Кнопка нажата'),
  ]);
  syntax(gen(p, 'd01'), 'd01');
});

test('D02', 'managed_bot_updated_trigger + incoming_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1'),
    makeIncomingMessageTriggerNode('imt1', 'msg2'),
    makeMessageNode('msg1', 'Бот создан'),
    makeMessageNode('msg2', 'Сообщение получено'),
  ]);
  syntax(gen(p, 'd02'), 'd02');
});

test('D03', 'managed_bot_updated_trigger + outgoing_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1'),
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeMessageNode('msg1', 'Бот создан'),
    makeForwardMessageNode('fwd1', '123456789'),
  ]);
  syntax(gen(p, 'd03'), 'd03');
});

test('D04', 'managed_bot_updated_trigger + start → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1', { saveBotIdTo: 'bot_id' }),
    makeMessageNode('msg1', 'Бот: {bot_id}'),
  ]);
  syntax(gen(p, 'd04'), 'd04');
});

test('D05', 'все триггеры вместе → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg_bot', { saveBotIdTo: 'bot_id' }),
    makeIncomingCallbackTriggerNode('ict1', 'msg_cb'),
    makeIncomingMessageTriggerNode('imt1', 'msg_in'),
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeMessageNode('msg_bot', 'Бот: {bot_id}'),
    makeMessageNode('msg_cb', 'Кнопка'),
    makeMessageNode('msg_in', 'Входящее'),
    makeForwardMessageNode('fwd1', '123456789'),
  ]);
  syntax(gen(p, 'd05'), 'd05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: FakeCallbackQuery
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: FakeCallbackQuery ─────────────────────────────────────');

test('E01', 'middleware содержит FakeCallbackQuery', () => {
  const p = makeCleanProject([makeManagedBotUpdatedTriggerNode('mbu1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e01');
  ok(code.includes('FakeCallbackQuery'), 'FakeCallbackQuery должен быть в коде');
});

test('E02', 'FakeCallbackQuery содержит from_user', () => {
  const p = makeCleanProject([makeManagedBotUpdatedTriggerNode('mbu1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e02');
  ok(code.includes('from_user'), 'from_user должен быть в FakeCallbackQuery');
});

test('E03', 'FakeCallbackQuery содержит _is_fake = True', () => {
  const p = makeCleanProject([makeManagedBotUpdatedTriggerNode('mbu1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e03');
  ok(code.includes('_is_fake = True'), '_is_fake = True должен быть в FakeCallbackQuery');
});

test('E04', 'FakeCallbackQuery не содержит FakeMessage (нет message_id/chat_id)', () => {
  const p = makeCleanProject([makeManagedBotUpdatedTriggerNode('mbu1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e04');
  ok(!code.includes('FakeMessage'), 'FakeMessage НЕ должен быть в managed_bot_updated_trigger');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Полные сценарии
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Полные сценарии ───────────────────────────────────────');

test('F01', 'полный сценарий с userDatabaseEnabled → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg_bot', {
      saveBotIdTo: 'bot_id',
      saveBotUsernameTo: 'bot_username',
      saveCreatorIdTo: 'creator_id',
    }),
    makeMessageNode('msg_bot', 'Бот @{bot_username} (id: {bot_id}) создан пользователем {creator_id}'),
  ]);
  const code = generatePythonCode(p as any, { botName: 'PhaseMBU_f01', userDatabaseEnabled: true, enableComments: false });
  syntax(code, 'f01');
});

test('F02', 'несколько триггеров с разными переменными → синтаксис OK', () => {
  const p = makeCleanProject([
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg1', { saveBotIdTo: 'bot_id', filterByUserId: '111' }),
    makeManagedBotUpdatedTriggerNode('mbu2', 'msg2', { saveBotUsernameTo: 'bot_username', saveCreatorIdTo: 'creator_id' }),
    makeMessageNode('msg1', 'Бот: {bot_id}'),
    makeMessageNode('msg2', '@{bot_username} от {creator_id}'),
  ]);
  syntax(gen(p, 'f02'), 'f02');
});

test('F03', 'полный сценарий: start + mbu + ict + imt + omt → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg_bot', { saveBotIdTo: 'bot_id', saveCreatorIdTo: 'creator_id' }),
    makeIncomingCallbackTriggerNode('ict1', 'msg_cb'),
    makeIncomingMessageTriggerNode('imt1', 'msg_in'),
    makeOutgoingMessageTriggerNode('omt1', 'fwd1'),
    makeMessageNode('msg_bot', 'Бот {bot_id} от {creator_id}'),
    makeMessageNode('msg_cb', 'Кнопка'),
    makeMessageNode('msg_in', 'Входящее'),
    makeForwardMessageNode('fwd1', '123456789'),
  ]);
  syntax(gen(p, 'f03'), 'f03');
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
