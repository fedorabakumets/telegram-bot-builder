/**
 * @fileoverview Тест фазы для узла member_trigger
 *
 * Блок A: Базовая генерация (10 тестов)
 * Блок B: Целевые ноды (6 тестов)
 * Блок C: Специфика триггера (4 теста)
 * Блок D: Взаимодействие с другими триггерами (5 тестов)
 * Блок E: FakeCallbackQuery (4 теста)
 * Блок F: Полные сценарии (3 теста)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

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
    botName: `PhaseMT_${label}`,
    userDatabaseEnabled: false,
  });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код для проверки
 * @param label - Метка для временного файла
 * @returns Результат проверки
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_mt_${label}.py`;
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

/**
 * Создаёт узел member_trigger
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @param extra - Дополнительные поля data
 * @returns Объект узла типа member_trigger
 */
function makeMemberTriggerNode(id: string, targetId: string, extra: Record<string, any> = {}) {
  return {
    id,
    type: 'member_trigger',
    position: { x: 0, y: 0 },
    data: {
      memberEventType: 'join',
      groupChatIdSource: 'manual',
      saveJoinedUserIdTo: 'joined_user_id',
      saveJoinedUsernameTo: 'joined_username',
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
      ...extra,
    },
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
      variable: 'joined_user_id',
      branches: [
        { id: 'branch_1', value: '', target: targetId, operator: 'filled' },
        { id: 'branch_else', value: '', target: '', operator: 'else' },
      ],
      buttons: [],
      keyboardType: 'none',
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
 * Создаёт managed_bot_updated_trigger-узел
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @returns Объект узла типа managed_bot_updated_trigger
 */
function makeManagedBotUpdatedTriggerNode(id: string, targetId: string) {
  return {
    id,
    type: 'managed_bot_updated_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест — Узел member_trigger                                 ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'member_trigger join → генерирует @dp.message(F.new_chat_members)', () => {
  const code = gen(makeCleanProject([makeMemberTriggerNode('mt1', 'msg1'), makeMessageNode('msg1')]), 'a01');
  ok(code.includes('@dp.message(F.new_chat_members)'), 'F.new_chat_members должен быть в коде');
  ok(code.includes('member_trigger_mt1_join_handler'), 'join handler должен быть в коде');
});

test('A02', 'member_trigger leave → генерирует @dp.message(F.left_chat_member)', () => {
  const code = gen(makeCleanProject([
    makeMemberTriggerNode('mt2', 'msg1', { memberEventType: 'leave', saveLeftUserIdTo: 'left_user_id' }),
    makeMessageNode('msg1'),
  ]), 'a02');
  ok(code.includes('@dp.message(F.left_chat_member)'), 'F.left_chat_member должен быть в коде');
  ok(code.includes('member_trigger_mt2_leave_handler'), 'leave handler должен быть в коде');
});

test('A03', 'join сохраняет joined_user_id в user_data', () => {
  const code = gen(makeCleanProject([makeMemberTriggerNode('mt1', 'msg1'), makeMessageNode('msg1')]), 'a03');
  ok(code.includes('user_data[user_id]["joined_user_id"]'), 'joined_user_id должен сохраняться');
});

test('A04', 'leave сохраняет left_user_id в user_data', () => {
  const code = gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1', { memberEventType: 'leave', saveLeftUserIdTo: 'left_user_id' }),
    makeMessageNode('msg1'),
  ]), 'a04');
  ok(code.includes('user_data[user_id]["left_user_id"]'), 'left_user_id должен сохраняться');
});

test('A05', 'обработчик вызывает handle_callback_<targetId>', () => {
  const code = gen(makeCleanProject([makeMemberTriggerNode('mt1', 'msg_target'), makeMessageNode('msg_target')]), 'a05');
  ok(code.includes('await handle_callback_msg_target(fake_cb'), 'handle_callback должен вызываться');
});

test('A06', 'содержит capture_message_context', () => {
  const code = gen(makeCleanProject([makeMemberTriggerNode('mt1', 'msg1'), makeMessageNode('msg1')]), 'a06');
  ok(code.includes('await capture_message_context(user_id, message)'), 'capture_message_context должен вызываться');
});

test('A07', 'содержит logging.info и logging.error', () => {
  const code = gen(makeCleanProject([makeMemberTriggerNode('mt1', 'msg1'), makeMessageNode('msg1')]), 'a07');
  ok(code.includes('logging.info'), 'logging.info должен быть');
  ok(code.includes('logging.error'), 'logging.error должен быть');
});

test('A08', 'без autoTransitionTo → обработчик не генерируется', () => {
  const trigger = {
    id: 'mt_bad', type: 'member_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: '', memberEventType: 'join', buttons: [], keyboardType: 'none' },
  };
  const code = gen(makeCleanProject([trigger]), 'a08');
  ok(!code.includes('member_trigger_mt_bad_join_handler'), 'обработчик не должен генерироваться');
});

test('A09', 'два триггера → два обработчика', () => {
  const code = gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1'),
    makeMemberTriggerNode('mt2', 'msg1'),
    makeMessageNode('msg1'),
  ]), 'a09');
  ok(code.includes('member_trigger_mt1_join_handler'), 'первый обработчик');
  ok(code.includes('member_trigger_mt2_join_handler'), 'второй обработчик');
});

test('A10', 'синтаксис Python OK', () => {
  syntax(gen(makeCleanProject([makeMemberTriggerNode('mt1', 'msg1'), makeMessageNode('msg1')]), 'a10'), 'a10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Целевые ноды
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Целевые ноды ──────────────────────────────────────────');

test('B01', 'member_trigger → message → синтаксис OK', () => {
  syntax(gen(makeCleanProject([makeMemberTriggerNode('mt1', 'msg1'), makeMessageNode('msg1')]), 'b01'), 'b01');
});

test('B02', 'member_trigger → forward_message → синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'fwd1'),
    makeForwardMessageNode('fwd1', '123456789'),
  ]), 'b02'), 'b02');
});

test('B03', 'member_trigger → condition → синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'cond1'),
    makeConditionNode('cond1', 'msg1'),
    makeMessageNode('msg1'),
  ]), 'b03'), 'b03');
});

test('B04', 'member_trigger → message с {joined_username} → синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1'),
    makeMessageNode('msg1', 'Новый: @{joined_username}'),
  ]), 'b04'), 'b04');
});

test('B05', 'leave → message с {left_user_id} → синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1', { memberEventType: 'leave', saveLeftUserIdTo: 'left_user_id' }),
    makeMessageNode('msg1', 'Ушёл: {left_user_id}'),
  ]), 'b05'), 'b05');
});

test('B06', 'два member_trigger → разные целевые ноды → синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1'),
    makeMemberTriggerNode('mt2', 'fwd1', { memberEventType: 'leave', saveLeftUserIdTo: 'left_user_id' }),
    makeMessageNode('msg1'),
    makeForwardMessageNode('fwd1', '123456789'),
  ]), 'b06'), 'b06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Специфика триггера
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Специфика триггера ────────────────────────────────────');

test('C01', 'both → генерирует join и leave обработчики', () => {
  const code = gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1', { memberEventType: 'both', saveLeftUserIdTo: 'left_user_id' }),
    makeMessageNode('msg1'),
  ]), 'c01');
  ok(code.includes('member_trigger_mt1_join_handler'), 'join handler');
  ok(code.includes('member_trigger_mt1_leave_handler'), 'leave handler');
});

test('C02', 'groupChatId manual → содержит фильтр _expected_chat_ids', () => {
  const code = gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1', { groupChatId: '2300967595' }),
    makeMessageNode('msg1'),
  ]), 'c02');
  ok(code.includes('_expected_chat_ids'), 'фильтр группы');
  ok(code.includes('2300967595'), 'ID группы');
});

test('C03', 'groupChatId variable → содержит groupChatVariableName', () => {
  const code = gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1', {
      groupChatIdSource: 'variable',
      groupChatVariableName: 'group_chat_id',
    }),
    makeMessageNode('msg1'),
  ]), 'c03');
  ok(code.includes('group_chat_id'), 'имя переменной группы');
  ok(code.includes('_group_chat_id_var'), 'чтение переменной');
});

test('C04', 'join итерирует new_chat_members', () => {
  const code = gen(makeCleanProject([makeMemberTriggerNode('mt1', 'msg1'), makeMessageNode('msg1')]), 'c04');
  ok(code.includes('for new_member in message.new_chat_members'), 'цикл по new_chat_members');
  ok(code.includes('if new_member.is_bot'), 'пропуск ботов');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Взаимодействие с другими триггерами
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Взаимодействие с другими триггерами ───────────────────');

test('D01', 'member_trigger + incoming_callback_trigger → синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1'),
    makeIncomingCallbackTriggerNode('ict1', 'msg2'),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]), 'd01'), 'd01');
});

test('D02', 'member_trigger + incoming_message_trigger → синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1'),
    makeIncomingMessageTriggerNode('imt1', 'msg2'),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]), 'd02'), 'd02');
});

test('D03', 'member_trigger + managed_bot_updated_trigger → синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1'),
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg2'),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]), 'd03'), 'd03');
});

test('D04', 'member_trigger leave + member_trigger join → синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeMemberTriggerNode('mt_join', 'msg1', { memberEventType: 'join' }),
    makeMemberTriggerNode('mt_leave', 'msg2', { memberEventType: 'leave', saveLeftUserIdTo: 'left_user_id' }),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]), 'd04'), 'd04');
});

test('D05', 'три триггера разных типов → синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1', { memberEventType: 'both', saveLeftUserIdTo: 'left_user_id' }),
    makeIncomingMessageTriggerNode('imt1', 'msg2'),
    makeManagedBotUpdatedTriggerNode('mbu1', 'msg3'),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
    makeMessageNode('msg3'),
  ]), 'd05'), 'd05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: FakeCallbackQuery
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: FakeCallbackQuery ─────────────────────────────────────');

test('E01', 'FakeCallbackQuery содержит self.message', () => {
  const code = gen(makeCleanProject([makeMemberTriggerNode('mt1', 'msg1'), makeMessageNode('msg1')]), 'e01');
  ok(code.includes('self.message = msg'), 'self.message должен быть');
});

test('E02', 'FakeCallbackQuery содержит _is_fake', () => {
  const code = gen(makeCleanProject([makeMemberTriggerNode('mt1', 'msg1'), makeMessageNode('msg1')]), 'e02');
  ok(code.includes('self._is_fake = True'), '_is_fake должен быть');
});

test('E03', 'join FakeCallbackQuery использует new_member как from_user', () => {
  const code = gen(makeCleanProject([makeMemberTriggerNode('mt1', 'msg1'), makeMessageNode('msg1')]), 'e03');
  ok(code.includes('FakeCallbackQuery(new_member, message)'), 'new_member передаётся в FakeCallbackQuery');
});

test('E04', 'leave FakeCallbackQuery использует left_member', () => {
  const code = gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1', { memberEventType: 'leave', saveLeftUserIdTo: 'left_user_id' }),
    makeMessageNode('msg1'),
  ]), 'e04');
  ok(code.includes('FakeCallbackQuery(left_member, message)'), 'left_member передаётся в FakeCallbackQuery');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Полные сценарии
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Полные сценарии ─────────────────────────────────────────');

test('F01', 'полный сценарий join с фильтром группы → синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1', {
      groupChatId: '2300967595',
      groupChatIdSource: 'manual',
      saveJoinedUsernameTo: 'joined_username',
    }),
    makeMessageNode('msg1', 'Добро пожаловать, @{joined_username}!'),
  ]), 'f01'), 'f01');
});

test('F02', 'полный сценарий both с variable filter → синтаксис OK', () => {
  syntax(gen(makeCleanProject([
    makeMemberTriggerNode('mt1', 'msg1', {
      memberEventType: 'both',
      groupChatIdSource: 'variable',
      groupChatVariableName: 'group_chat_id',
      saveJoinedUserIdTo: 'joined_user_id',
      saveLeftUserIdTo: 'left_user_id',
    }),
    makeMessageNode('msg1', 'Событие участника'),
  ]), 'f02'), 'f02');
});

test('F03', 'userDatabaseEnabled=true → синтаксис OK', () => {
  const p = makeCleanProject([makeMemberTriggerNode('mt1', 'msg1'), makeMessageNode('msg1')]);
  const code = generatePythonCode(p as any, {
    botName: 'PhaseMT_f03',
    userDatabaseEnabled: true,
  });
  syntax(code, 'f03');
});

// ════════════════════════════════════════════════════════════════════════════
// Итог
// ════════════════════════════════════════════════════════════════════════════

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n════════════════════════════════════════════════════════════════');
console.log(`Итого: ${passed} пройдено, ${failed} провалено из ${results.length}`);
console.log('════════════════════════════════════════════════════════════════\n');

if (failed > 0) {
  console.log('Проваленные тесты:');
  results.filter(r => !r.passed).forEach(r => console.log(`  ❌ ${r.id}: ${r.note}`));
  process.exit(1);
}

process.exit(0);
