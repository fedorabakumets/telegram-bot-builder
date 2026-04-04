/**
 * @fileoverview Тест фазы для узла incoming_callback_trigger
 *
 * Блок A: Базовая генерация middleware
 * Блок B: Целевая нода — message
 * Блок C: Целевая нода — condition
 * Блок D: Целевая нода — keyboard
 * Блок E: Целевая нода — message с инлайн-кнопками (callback_data = nodeId)
 * Блок F: Целевая нода — forward_message
 * Блок G: Целевая нода — create_forum_topic
 * Блок H: Целевая нода — broadcast
 * Блок I: Взаимодействие с callback_trigger
 * Блок J: Взаимодействие с виртуальными триггерами (customCallbackData)
 * Блок K: Взаимодействие с incoming_message_trigger
 * Блок L: Переменные callback_data и button_text
 * Блок M: Синтаксис Python — все комбинации
 * Блок N: Сложные сценарии
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
    botName: `PhaseICT_${label}`,
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
  const tmp = `_tmp_ict_${label}.py`;
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
 * Создаёт узел incoming_callback_trigger
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
 * Создаёт message-узел с инлайн-кнопками
 * @param id - ID узла
 * @param text - Текст сообщения
 * @param buttons - Массив кнопок
 * @returns Объект узла типа message с инлайн-клавиатурой
 */
function makeMessageNodeWithButtons(id: string, text: string, buttons: any[]) {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: { messageText: text, buttons, keyboardType: 'inline', formatMode: 'none', markdown: false },
  };
}

/**
 * Создаёт message-узел с двумя кнопками с customCallbackData
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @returns Объект узла типа message с двумя кнопками customCallbackData
 */
function makeMessageWithCustomCallbacks(id: string, targetId: string) {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: 'Выберите:',
      keyboardType: 'inline',
      buttons: [
        { id: 'btn_yes', text: 'Да', action: 'goto', target: targetId, customCallbackData: 'yes_cb', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
        { id: 'btn_no', text: 'Нет', action: 'goto', target: targetId, customCallbackData: 'no_cb', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      ],
      formatMode: 'none',
      markdown: false,
    },
  };
}

/**
 * Создаёт condition-узел
 * @param id - ID узла
 * @param branches - Ветки условия
 * @returns Объект узла типа condition
 */
function makeConditionNode(id: string, branches: Array<{ id: string; label: string; operator: string; value: string; target?: string }>) {
  return {
    id,
    type: 'condition',
    position: { x: 0, y: 0 },
    data: {
      conditions: branches.map(b => ({
        id: b.id,
        label: b.label,
        variable: 'callback_data',
        operator: b.operator,
        value: b.value,
        targetNodeId: b.target ?? '',
      })),
      defaultTargetId: '',
    },
  };
}

/**
 * Создаёт keyboard-узел
 * @param id - ID узла
 * @param buttons - Массив кнопок
 * @returns Объект узла типа keyboard
 */
function makeKeyboardNode(id: string, buttons: any[]) {
  return {
    id,
    type: 'keyboard',
    position: { x: 0, y: 0 },
    data: { buttons, keyboardType: 'inline', messageText: 'Клавиатура' },
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
    data: { targetChatId, messageText: 'Пересланное сообщение', buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт create_forum_topic-узел
 * @param id - ID узла
 * @param forumChatId - ID форум-чата
 * @param topicName - Название топика
 * @returns Объект узла типа create_forum_topic
 */
function makeCreateForumTopicNode(id: string, forumChatId: string, topicName: string) {
  return {
    id,
    type: 'create_forum_topic',
    position: { x: 0, y: 0 },
    data: { forumChatId, topicName, buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт broadcast-узел
 * @param id - ID узла
 * @returns Объект узла типа broadcast
 */
function makeBroadcastNode(id: string) {
  return {
    id,
    type: 'broadcast',
    position: { x: 0, y: 0 },
    data: { messageText: 'Рассылка', buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт callback_trigger-узел
 * @param id - ID узла
 * @param callbackData - Значение callback_data
 * @param targetId - ID целевого узла
 * @returns Объект узла типа callback_trigger
 */
function makeCallbackTriggerNode(id: string, callbackData: string, targetId: string) {
  return {
    id,
    type: 'callback_trigger',
    position: { x: 0, y: 0 },
    data: {
      callbackData,
      matchType: 'exact',
      adminOnly: false,
      requiresAuth: false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
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

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест — Узел incoming_callback_trigger                      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация middleware
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация middleware ──────────────────────────');

test('A01', 'incoming_callback_trigger → генерирует dp.callback_query.middleware', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('dp.callback_query.middleware'), 'dp.callback_query.middleware должен быть в коде');
});

test('A02', 'имя middleware содержит nodeId', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict_abc', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('incoming_callback_trigger_ict_abc_middleware'), 'имя middleware должно содержать nodeId');
});

test('A03', 'middleware содержит return await handler(event, data)', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a03');
  ok(code.includes('return await handler(event, data)'), 'return await handler(event, data) должен быть в коде');
});

test('A04', 'middleware содержит class MockCallback', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a04');
  ok(code.includes('class MockCallback:'), 'class MockCallback: должен быть в коде');
});

test('A05', 'middleware вызывает handle_callback_<targetId>', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg_target'), makeMessageNode('msg_target')]);
  const code = gen(p, 'a05');
  ok(code.includes('await handle_callback_msg_target(mock_callback)'), 'вызов handle_callback_msg_target должен быть в коде');
});

test('A06', 'middleware содержит logging.info с user_id', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a06');
  ok(code.includes('logging.info('), 'logging.info должен быть в коде');
  ok(code.includes('user_id'), 'user_id должен упоминаться');
});

test('A07', 'middleware содержит logging.error', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a07');
  ok(code.includes('logging.error'), 'logging.error должен быть в коде');
});

test('A08', 'без autoTransitionTo → middleware не генерируется', () => {
  const trigger = {
    id: 'ict_bad', type: 'incoming_callback_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: '', buttons: [], keyboardType: 'none' },
  };
  const p = makeCleanProject([trigger]);
  const code = gen(p, 'a08');
  ok(!code.includes('incoming_callback_trigger_ict_bad_middleware'), 'middleware НЕ должен генерироваться без autoTransitionTo');
});

test('A09', 'два incoming_callback_trigger → два middleware', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeIncomingCallbackTriggerNode('ict2', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a09');
  ok(code.includes('incoming_callback_trigger_ict1_middleware'), 'первый middleware должен быть в коде');
  ok(code.includes('incoming_callback_trigger_ict2_middleware'), 'второй middleware должен быть в коде');
});

test('A10', 'middleware содержит event.from_user.id', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a10');
  ok(code.includes('event.from_user.id'), 'event.from_user.id должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Целевая нода — message
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Целевая нода — message ────────────────────────────────');

test('B01', 'incoming_callback_trigger → message → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'b01'), 'b01');
});

test('B02', 'incoming_callback_trigger → message с текстом → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1', 'Привет, пользователь!')]);
  syntax(gen(p, 'b02'), 'b02');
});

test('B03', 'incoming_callback_trigger → message с {callback_data} в тексте → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1', 'Вы нажали: {callback_data}')]);
  syntax(gen(p, 'b03'), 'b03');
});

test('B04', 'incoming_callback_trigger → message с {button_text} в тексте → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1', 'Кнопка: {button_text}')]);
  syntax(gen(p, 'b04'), 'b04');
});

test('B05', 'incoming_callback_trigger → message с {user_name} → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1', 'Привет, {user_name}!')]);
  syntax(gen(p, 'b05'), 'b05');
});

test('B06', 'incoming_callback_trigger → message с HTML форматированием → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: '<b>Жирный</b> текст', buttons: [], keyboardType: 'none', formatMode: 'html', markdown: false } },
  ]);
  syntax(gen(p, 'b06'), 'b06');
});

test('B07', 'incoming_callback_trigger → message с Markdown → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: '*Жирный* текст', buttons: [], keyboardType: 'none', formatMode: 'markdown', markdown: true } },
  ]);
  syntax(gen(p, 'b07'), 'b07');
});

test('B08', 'incoming_callback_trigger → message с userDatabaseEnabled: true → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1', 'Привет!')]);
  const code = generatePythonCode(p as any, { botName: 'PhaseICT_b08', userDatabaseEnabled: true, enableComments: false });
  syntax(code, 'b08');
});

test('B09', 'incoming_callback_trigger → message с adminOnly: true → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Только для админов', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false, adminOnly: true } },
  ]);
  syntax(gen(p, 'b09'), 'b09');
});

test('B10', 'incoming_callback_trigger → message с requiresAuth: true → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Только авторизованным', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false, requiresAuth: true } },
  ]);
  syntax(gen(p, 'b10'), 'b10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Целевая нода — condition
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Целевая нода — condition ──────────────────────────────');

test('C01', 'incoming_callback_trigger → condition → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'cond1'),
    makeConditionNode('cond1', [{ id: 'br1', label: 'Да', operator: 'equals', value: 'yes', target: 'msg_yes' }]),
    makeMessageNode('msg_yes', 'Да!'),
  ]);
  syntax(gen(p, 'c01'), 'c01');
});

test('C02', 'incoming_callback_trigger → condition с ветками → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'cond1'),
    makeConditionNode('cond1', [
      { id: 'br1', label: 'Да', operator: 'equals', value: 'yes', target: 'msg_yes' },
      { id: 'br2', label: 'Нет', operator: 'equals', value: 'no', target: 'msg_no' },
    ]),
    makeMessageNode('msg_yes', 'Да!'),
    makeMessageNode('msg_no', 'Нет!'),
  ]);
  syntax(gen(p, 'c02'), 'c02');
});

test('C03', 'incoming_callback_trigger → condition → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'cond1'),
    makeConditionNode('cond1', [{ id: 'br1', label: 'Ветка', operator: 'equals', value: 'action', target: 'msg_result' }]),
    makeMessageNode('msg_result', 'Результат: {callback_data}'),
  ]);
  syntax(gen(p, 'c03'), 'c03');
});

test('C04', 'incoming_callback_trigger → condition с else веткой → синтаксис OK', () => {
  const condNode = {
    id: 'cond1', type: 'condition', position: { x: 0, y: 0 },
    data: {
      conditions: [{ id: 'br1', label: 'Да', variable: 'callback_data', operator: 'equals', value: 'yes', targetNodeId: 'msg_yes' }],
      defaultTargetId: 'msg_default',
    },
  };
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'cond1'),
    condNode,
    makeMessageNode('msg_yes', 'Да!'),
    makeMessageNode('msg_default', 'По умолчанию'),
  ]);
  syntax(gen(p, 'c04'), 'c04');
});

test('C05', 'incoming_callback_trigger → condition проверяет callback_data → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'cond1'),
    makeConditionNode('cond1', [{ id: 'br1', label: 'Проверка', operator: 'equals', value: 'confirm', target: 'msg_ok' }]),
    makeMessageNode('msg_ok', 'Подтверждено'),
  ]);
  syntax(gen(p, 'c05'), 'c05');
});

test('C06', 'incoming_callback_trigger → condition с несколькими ветками → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'cond1'),
    makeConditionNode('cond1', [
      { id: 'br1', label: 'A', operator: 'equals', value: 'a', target: 'msg_a' },
      { id: 'br2', label: 'B', operator: 'equals', value: 'b', target: 'msg_b' },
      { id: 'br3', label: 'C', operator: 'equals', value: 'c', target: 'msg_c' },
    ]),
    makeMessageNode('msg_a', 'A'),
    makeMessageNode('msg_b', 'B'),
    makeMessageNode('msg_c', 'C'),
  ]);
  syntax(gen(p, 'c06'), 'c06');
});

test('C07', 'incoming_callback_trigger → condition → message с кнопками → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'cond1'),
    makeConditionNode('cond1', [{ id: 'br1', label: 'Да', operator: 'equals', value: 'yes', target: 'msg_btns' }]),
    makeMessageNodeWithButtons('msg_btns', 'Выберите:', [
      { id: 'btn1', text: 'Ок', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg_end', 'Готово'),
  ]);
  syntax(gen(p, 'c07'), 'c07');
});

test('C08', 'два incoming_callback_trigger → разные condition → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'cond1'),
    makeIncomingCallbackTriggerNode('ict2', 'cond2'),
    makeConditionNode('cond1', [{ id: 'br1', label: 'Ветка 1', operator: 'equals', value: 'x', target: 'msg1' }]),
    makeConditionNode('cond2', [{ id: 'br2', label: 'Ветка 2', operator: 'equals', value: 'y', target: 'msg2' }]),
    makeMessageNode('msg1', 'Ответ 1'),
    makeMessageNode('msg2', 'Ответ 2'),
  ]);
  syntax(gen(p, 'c08'), 'c08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Целевая нода — keyboard
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Целевая нода — keyboard ───────────────────────────────');

test('D01', 'incoming_callback_trigger → keyboard → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'kb1'),
    makeKeyboardNode('kb1', [{ id: 'btn1', text: 'Кнопка', action: 'goto', target: 'msg1', buttonType: 'normal' }]),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'd01'), 'd01');
});

test('D02', 'incoming_callback_trigger → keyboard с инлайн-кнопками → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'kb1'),
    makeKeyboardNode('kb1', [
      { id: 'btn1', text: 'Кнопка 1', action: 'goto', target: 'msg1', buttonType: 'normal' },
      { id: 'btn2', text: 'Кнопка 2', action: 'goto', target: 'msg1', buttonType: 'normal' },
    ]),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'd02'), 'd02');
});

test('D03', 'incoming_callback_trigger → keyboard с reply-кнопками → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'kb1'),
    { id: 'kb1', type: 'keyboard', position: { x: 0, y: 0 }, data: { buttons: [{ id: 'btn1', text: 'Reply', action: 'goto', target: 'msg1' }], keyboardType: 'reply', messageText: 'Клавиатура' } },
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'd03'), 'd03');
});

test('D04', 'incoming_callback_trigger → message → keyboard → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeMessageNodeWithButtons('msg1', 'Меню:', [
      { id: 'btn1', text: 'Открыть клавиатуру', action: 'goto', target: 'kb1', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeKeyboardNode('kb1', [{ id: 'btn2', text: 'Назад', action: 'goto', target: 'msg1', buttonType: 'normal' }]),
  ]);
  syntax(gen(p, 'd04'), 'd04');
});

test('D05', 'incoming_callback_trigger → keyboard с customCallbackData → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'kb1'),
    makeKeyboardNode('kb1', [
      { id: 'btn1', text: 'Custom', action: 'goto', target: 'msg1', customCallbackData: 'my_custom', buttonType: 'normal' },
    ]),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'd05'), 'd05');
});

test('D06', 'два incoming_callback_trigger → разные keyboard → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'kb1'),
    makeIncomingCallbackTriggerNode('ict2', 'kb2'),
    makeKeyboardNode('kb1', [{ id: 'btn1', text: 'KB1', action: 'goto', target: 'msg1', buttonType: 'normal' }]),
    makeKeyboardNode('kb2', [{ id: 'btn2', text: 'KB2', action: 'goto', target: 'msg2', buttonType: 'normal' }]),
    makeMessageNode('msg1', 'Ответ 1'),
    makeMessageNode('msg2', 'Ответ 2'),
  ]);
  syntax(gen(p, 'd06'), 'd06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Целевая нода — message с инлайн-кнопками (callback_data = nodeId)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Целевая нода — message с инлайн-кнопками ─────────────');

test('E01', 'incoming_callback_trigger → message с goto-кнопками → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_menu'),
    makeMessageNodeWithButtons('msg_menu', 'Меню:', [
      { id: 'btn1', text: 'Пункт 1', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg_end', 'Выбрано'),
  ]);
  syntax(gen(p, 'e01'), 'e01');
});

test('E02', 'incoming_callback_trigger → message с кнопками с customCallbackData → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_src'),
    makeMessageWithCustomCallbacks('msg_src', 'msg_answer'),
    makeMessageNode('msg_answer', 'Ответ: {callback_data}'),
  ]);
  syntax(gen(p, 'e02'), 'e02');
});

test('E03', 'incoming_callback_trigger → message с кнопками → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_step1'),
    makeMessageNodeWithButtons('msg_step1', 'Шаг 1:', [
      { id: 'btn1', text: 'Далее', action: 'goto', target: 'msg_step2', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg_step2', 'Шаг 2'),
  ]);
  syntax(gen(p, 'e03'), 'e03');
});

test('E04', 'incoming_callback_trigger → message с кнопками → condition → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_q'),
    makeMessageNodeWithButtons('msg_q', 'Вопрос:', [
      { id: 'btn_yes', text: 'Да', action: 'goto', target: 'cond1', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeConditionNode('cond1', [{ id: 'br1', label: 'Да', operator: 'equals', value: 'yes', target: 'msg_ok' }]),
    makeMessageNode('msg_ok', 'Ок'),
  ]);
  syntax(gen(p, 'e04'), 'e04');
});

test('E05', 'incoming_callback_trigger → message с кнопками → message с {button_text} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_menu'),
    makeMessageNodeWithButtons('msg_menu', 'Выберите:', [
      { id: 'btn1', text: 'Вариант А', action: 'goto', target: 'msg_result', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn2', text: 'Вариант Б', action: 'goto', target: 'msg_result', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg_result', 'Вы выбрали: {button_text}'),
  ]);
  syntax(gen(p, 'e05'), 'e05');
});

test('E06', 'incoming_callback_trigger → message с несколькими кнопками → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_menu'),
    makeMessageNodeWithButtons('msg_menu', 'Меню:', [
      { id: 'btn1', text: 'Пункт 1', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn2', text: 'Пункт 2', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn3', text: 'Пункт 3', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn4', text: 'Пункт 4', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg_end', 'Выбрано: {button_text}'),
  ]);
  syntax(gen(p, 'e06'), 'e06');
});

test('E07', 'incoming_callback_trigger → message с кнопками с hideAfterClick → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_menu'),
    makeMessageNodeWithButtons('msg_menu', 'Нажмите:', [
      { id: 'btn1', text: 'Скрыть', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: true },
    ]),
    makeMessageNode('msg_end', 'Кнопка скрыта'),
  ]);
  syntax(gen(p, 'e07'), 'e07');
});

test('E08', 'incoming_callback_trigger → message с кнопками с style → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_menu'),
    makeMessageNodeWithButtons('msg_menu', 'Стили:', [
      { id: 'btn1', text: 'Primary', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false, style: 'primary' },
      { id: 'btn2', text: 'Danger', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false, style: 'danger' },
    ]),
    makeMessageNode('msg_end', 'Готово'),
  ]);
  syntax(gen(p, 'e08'), 'e08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Целевая нода — forward_message
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Целевая нода — forward_message ────────────────────────');

test('F01', 'incoming_callback_trigger → forward_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'fwd1'),
    makeForwardMessageNode('fwd1', '123456789'),
  ]);
  syntax(gen(p, 'f01'), 'f01');
});

test('F02', 'incoming_callback_trigger → forward_message с targetChatId → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'fwd1'),
    makeForwardMessageNode('fwd1', '-100987654321'),
  ]);
  syntax(gen(p, 'f02'), 'f02');
});

test('F03', 'incoming_callback_trigger → forward_message с переменной → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'fwd1'),
    { id: 'fwd1', type: 'forward_message', position: { x: 0, y: 0 }, data: { targetChatId: '{chat_id}', messageText: 'Текст', buttons: [], keyboardType: 'none' } },
  ]);
  syntax(gen(p, 'f03'), 'f03');
});

test('F04', 'incoming_callback_trigger → forward_message → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'fwd1'),
    { id: 'fwd1', type: 'forward_message', position: { x: 0, y: 0 }, data: { targetChatId: '123', messageText: 'Текст', buttons: [{ id: 'btn1', text: 'Далее', action: 'goto', target: 'msg_end' }], keyboardType: 'inline' } },
    makeMessageNode('msg_end', 'Переслано'),
  ]);
  syntax(gen(p, 'f04'), 'f04');
});

test('F05', 'два incoming_callback_trigger → разные forward_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'fwd1'),
    makeIncomingCallbackTriggerNode('ict2', 'fwd2'),
    makeForwardMessageNode('fwd1', '111111111'),
    makeForwardMessageNode('fwd2', '222222222'),
  ]);
  syntax(gen(p, 'f05'), 'f05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Целевая нода — create_forum_topic
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Целевая нода — create_forum_topic ─────────────────────');

test('G01', 'incoming_callback_trigger → create_forum_topic → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'forum1'),
    makeCreateForumTopicNode('forum1', '-100123456789', 'Новый топик'),
  ]);
  syntax(gen(p, 'g01'), 'g01');
});

test('G02', 'incoming_callback_trigger → create_forum_topic с topicName → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'forum1'),
    makeCreateForumTopicNode('forum1', '-100123456789', 'Топик: {callback_data}'),
  ]);
  syntax(gen(p, 'g02'), 'g02');
});

test('G03', 'incoming_callback_trigger → create_forum_topic → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'forum1'),
    { id: 'forum1', type: 'create_forum_topic', position: { x: 0, y: 0 }, data: { forumChatId: '-100123', topicName: 'Топик', buttons: [{ id: 'btn1', text: 'Готово', action: 'goto', target: 'msg_done' }], keyboardType: 'inline' } },
    makeMessageNode('msg_done', 'Топик создан'),
  ]);
  syntax(gen(p, 'g03'), 'g03');
});

test('G04', 'incoming_callback_trigger → create_forum_topic с переменной → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'forum1'),
    makeCreateForumTopicNode('forum1', '{forum_chat_id}', 'Топик от {user_name}'),
  ]);
  syntax(gen(p, 'g04'), 'g04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Целевая нода — broadcast
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Целевая нода — broadcast ──────────────────────────────');

test('H01', 'incoming_callback_trigger → broadcast → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'bc1'),
    makeBroadcastNode('bc1'),
  ]);
  syntax(gen(p, 'h01'), 'h01');
});

test('H02', 'incoming_callback_trigger → broadcast → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'bc1'),
    { id: 'bc1', type: 'broadcast', position: { x: 0, y: 0 }, data: { messageText: 'Рассылка', buttons: [{ id: 'btn1', text: 'Ок', action: 'goto', target: 'msg_done' }], keyboardType: 'inline' } },
    makeMessageNode('msg_done', 'Рассылка завершена'),
  ]);
  syntax(gen(p, 'h02'), 'h02');
});

test('H03', 'incoming_callback_trigger → broadcast с userDatabaseEnabled: true → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'bc1'),
    makeBroadcastNode('bc1'),
  ]);
  const code = generatePythonCode(p as any, { botName: 'PhaseICT_h03', userDatabaseEnabled: true, enableComments: false });
  syntax(code, 'h03');
});

test('H04', 'два incoming_callback_trigger → разные broadcast → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'bc1'),
    makeIncomingCallbackTriggerNode('ict2', 'bc2'),
    makeBroadcastNode('bc1'),
    makeBroadcastNode('bc2'),
  ]);
  syntax(gen(p, 'h04'), 'h04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: Взаимодействие с callback_trigger
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: Взаимодействие с callback_trigger ─────────────────────');

test('I01', 'incoming_callback_trigger + callback_trigger → оба генерируются', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeCallbackTriggerNode('ct1', 'confirm', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'i01');
  ok(code.includes('dp.callback_query.middleware'), 'middleware должен быть в коде');
  ok(code.includes('callback_trigger_ct1_handler'), 'callback_trigger обработчик должен быть в коде');
});

test('I02', 'incoming_callback_trigger + callback_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeCallbackTriggerNode('ct1', 'confirm', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'i02'), 'i02');
});

test('I03', 'incoming_callback_trigger + callback_trigger к одной ноде → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_shared'),
    makeCallbackTriggerNode('ct1', 'specific_action', 'msg_shared'),
    makeMessageNode('msg_shared', 'Общий ответ: {callback_data}'),
  ]);
  syntax(gen(p, 'i03'), 'i03');
});

test('I04', 'incoming_callback_trigger + несколько callback_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeCallbackTriggerNode('ct1', 'action_a', 'msg1'),
    makeCallbackTriggerNode('ct2', 'action_b', 'msg1'),
    makeCallbackTriggerNode('ct3', 'action_c', 'msg1'),
    makeMessageNode('msg1', 'Ответ: {callback_data}'),
  ]);
  syntax(gen(p, 'i04'), 'i04');
});

test('I05', 'incoming_callback_trigger + callback_trigger с adminOnly → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    {
      id: 'ct1', type: 'callback_trigger', position: { x: 0, y: 0 },
      data: { callbackData: 'admin_action', matchType: 'exact', adminOnly: true, requiresAuth: false, autoTransitionTo: 'msg1', buttons: [], keyboardType: 'none' },
    },
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'i05'), 'i05');
});

test('I06', 'incoming_callback_trigger + callback_trigger с requiresAuth → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    {
      id: 'ct1', type: 'callback_trigger', position: { x: 0, y: 0 },
      data: { callbackData: 'auth_action', matchType: 'exact', adminOnly: false, requiresAuth: true, autoTransitionTo: 'msg1', buttons: [], keyboardType: 'none' },
    },
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'i06'), 'i06');
});

test('I07', 'incoming_callback_trigger + callback_trigger startswith → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    {
      id: 'ct1', type: 'callback_trigger', position: { x: 0, y: 0 },
      data: { callbackData: 'order_', matchType: 'startswith', adminOnly: false, requiresAuth: false, autoTransitionTo: 'msg1', buttons: [], keyboardType: 'none' },
    },
    makeMessageNode('msg1', 'Заказ: {callback_data}'),
  ]);
  syntax(gen(p, 'i07'), 'i07');
});

test('I08', 'incoming_callback_trigger + callback_trigger + message с переменными → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_result'),
    makeCallbackTriggerNode('ct1', 'confirm', 'msg_result'),
    makeMessageNode('msg_result', 'Данные: {callback_data}, кнопка: {button_text}, пользователь: {user_name}'),
  ]);
  syntax(gen(p, 'i08'), 'i08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: Взаимодействие с виртуальными триггерами (customCallbackData)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Взаимодействие с виртуальными триггерами ──────────────');

test('J01', 'incoming_callback_trigger + кнопки с customCallbackData → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_answer'),
    makeMessageWithCustomCallbacks('msg_src', 'msg_answer'),
    makeMessageNode('msg_answer', 'Ответ: {callback_data}'),
  ]);
  syntax(gen(p, 'j01'), 'j01');
});

test('J02', 'incoming_callback_trigger + виртуальные триггеры → оба middleware генерируются', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_answer'),
    makeMessageWithCustomCallbacks('msg_src', 'msg_answer'),
    makeMessageNode('msg_answer', 'Ответ'),
  ]);
  const code = gen(p, 'j02');
  ok(code.includes('dp.callback_query.middleware'), 'middleware должен быть в коде');
  ok(code.includes('lambda c: c.data == "yes_cb"') || code.includes('lambda c: c.data == "no_cb"'), 'виртуальные обработчики должны быть в коде');
});

test('J03', 'incoming_callback_trigger + customCallbackData к той же ноде → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_target'),
    makeMessageWithCustomCallbacks('msg_src', 'msg_target'),
    makeMessageNode('msg_target', 'Ответ: {button_text}'),
  ]);
  syntax(gen(p, 'j03'), 'j03');
});

test('J04', 'incoming_callback_trigger + несколько кнопок с customCallbackData → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_answer'),
    {
      id: 'msg_src', type: 'message', position: { x: 0, y: 0 },
      data: {
        messageText: 'Выберите:',
        keyboardType: 'inline',
        buttons: [
          { id: 'btn1', text: 'A', action: 'goto', target: 'msg_answer', customCallbackData: 'choice_a', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
          { id: 'btn2', text: 'B', action: 'goto', target: 'msg_answer', customCallbackData: 'choice_b', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
          { id: 'btn3', text: 'C', action: 'goto', target: 'msg_answer', customCallbackData: 'choice_c', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
        ],
        formatMode: 'none', markdown: false,
      },
    },
    makeMessageNode('msg_answer', 'Выбор: {callback_data}'),
  ]);
  syntax(gen(p, 'j04'), 'j04');
});

test('J05', 'incoming_callback_trigger + явный callback_trigger с тем же callbackData → нет дублирования', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_answer'),
    makeCallbackTriggerNode('ct_explicit', 'yes_cb', 'msg_answer'),
    makeMessageWithCustomCallbacks('msg_src', 'msg_answer'),
    makeMessageNode('msg_answer', 'Ответ'),
  ]);
  const code = gen(p, 'j05');
  const count = (code.match(/lambda c: c\.data == "yes_cb"/g) || []).length;
  ok(count <= 1, `Не должно быть дублирования обработчика для "yes_cb", найдено: ${count}`);
});

test('J06', 'incoming_callback_trigger + виртуальные + явные триггеры → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_answer'),
    makeCallbackTriggerNode('ct1', 'explicit_action', 'msg_answer'),
    makeMessageWithCustomCallbacks('msg_src', 'msg_answer'),
    makeMessageNode('msg_answer', 'Ответ: {callback_data}'),
  ]);
  syntax(gen(p, 'j06'), 'j06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК K: Взаимодействие с incoming_message_trigger
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: Взаимодействие с incoming_message_trigger ─────────────');

test('K01', 'incoming_callback_trigger + incoming_message_trigger → оба генерируются', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeIncomingMessageTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'k01');
  ok(code.includes('dp.callback_query.middleware'), 'callback middleware должен быть в коде');
  ok(code.includes('dp.message.middleware'), 'message middleware должен быть в коде');
});

test('K02', 'incoming_callback_trigger + incoming_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeIncomingMessageTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'k02'), 'k02');
});

test('K03', 'incoming_callback_trigger + incoming_message_trigger к одной ноде → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_shared'),
    makeIncomingMessageTriggerNode('imt1', 'msg_shared'),
    makeMessageNode('msg_shared', 'Общий ответ'),
  ]);
  syntax(gen(p, 'k03'), 'k03');
});

test('K04', 'несколько incoming_callback_trigger + несколько incoming_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeIncomingCallbackTriggerNode('ict2', 'msg2'),
    makeIncomingMessageTriggerNode('imt1', 'msg1'),
    makeIncomingMessageTriggerNode('imt2', 'msg2'),
    makeMessageNode('msg1', 'Ответ 1'),
    makeMessageNode('msg2', 'Ответ 2'),
  ]);
  syntax(gen(p, 'k04'), 'k04');
});

test('K05', 'все типы триггеров вместе → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeIncomingMessageTriggerNode('imt1', 'msg1'),
    makeCallbackTriggerNode('ct1', 'action', 'msg1'),
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', buttons: [], keyboardType: 'none', formatMode: 'none' } },
    makeMessageNode('msg1', 'Ответ: {callback_data} {button_text}'),
  ]);
  syntax(gen(p, 'k05'), 'k05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК L: Переменные callback_data и button_text
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок L: Переменные callback_data и button_text ────────────────');

test('L01', 'middleware сохраняет user_data[user_id]["callback_data"]', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'l01');
  ok(code.includes('user_data[user_id]["callback_data"]'), 'user_data[user_id]["callback_data"] должен быть в коде');
});

test('L02', 'middleware сохраняет user_data[user_id]["button_text"]', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'l02');
  ok(code.includes('user_data[user_id]["button_text"]'), 'user_data[user_id]["button_text"] должен быть в коде');
});

test('L03', 'middleware читает reply_markup', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'l03');
  ok(code.includes('reply_markup'), 'reply_markup должен быть в коде');
});

test('L04', 'middleware содержит _ict_btn_text', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'l04');
  ok(code.includes('_ict_btn_text'), '_ict_btn_text должен быть в коде');
});

test('L05', 'middleware содержит inline_keyboard', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'l05');
  ok(code.includes('inline_keyboard'), 'inline_keyboard должен быть в коде');
});

test('L06', 'middleware содержит try/except вокруг чтения reply_markup', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'l06');
  ok(code.includes('except Exception:'), 'except Exception: должен быть в коде');
});

test('L07', 'incoming_callback_trigger → message с {callback_data} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeMessageNode('msg1', 'Вы нажали кнопку с данными: {callback_data}'),
  ]);
  syntax(gen(p, 'l07'), 'l07');
});

test('L08', 'incoming_callback_trigger → message с {button_text} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeMessageNode('msg1', 'Текст нажатой кнопки: {button_text}'),
  ]);
  syntax(gen(p, 'l08'), 'l08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК M: Синтаксис Python — все комбинации
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок M: Синтаксис Python — все комбинации ─────────────────────');

test('M01', 'только incoming_callback_trigger → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'm01'), 'm01');
});

test('M02', 'incoming_callback_trigger + message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeMessageNode('msg1', 'Ответ: {callback_data}'),
  ]);
  syntax(gen(p, 'm02'), 'm02');
});

test('M03', 'incoming_callback_trigger + condition → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'cond1'),
    makeConditionNode('cond1', [{ id: 'br1', label: 'Ветка', operator: 'equals', value: 'test', target: 'msg1' }]),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'm03'), 'm03');
});

test('M04', 'incoming_callback_trigger + keyboard → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'kb1'),
    makeKeyboardNode('kb1', [{ id: 'btn1', text: 'Кнопка', action: 'goto', target: 'msg1', buttonType: 'normal' }]),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'm04'), 'm04');
});

test('M05', 'incoming_callback_trigger + callback_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeCallbackTriggerNode('ct1', 'action', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'm05'), 'm05');
});

test('M06', 'incoming_callback_trigger + incoming_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeIncomingMessageTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'm06'), 'm06');
});

test('M07', 'incoming_callback_trigger + forward_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'fwd1'),
    makeForwardMessageNode('fwd1', '123456789'),
  ]);
  syntax(gen(p, 'm07'), 'm07');
});

test('M08', 'incoming_callback_trigger + create_forum_topic → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'forum1'),
    makeCreateForumTopicNode('forum1', '-100123456789', 'Топик'),
  ]);
  syntax(gen(p, 'm08'), 'm08');
});

test('M09', 'incoming_callback_trigger + broadcast → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'bc1'),
    makeBroadcastNode('bc1'),
  ]);
  syntax(gen(p, 'm09'), 'm09');
});

test('M10', 'все типы нод вместе → синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Старт', buttons: [], keyboardType: 'none', formatMode: 'none' } },
    makeIncomingCallbackTriggerNode('ict1', 'msg_menu'),
    makeIncomingMessageTriggerNode('imt1', 'msg_menu'),
    makeCallbackTriggerNode('ct1', 'action', 'msg_menu'),
    makeMessageNodeWithButtons('msg_menu', 'Меню:', [
      { id: 'btn1', text: 'Вперёд', action: 'goto', target: 'cond1', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeConditionNode('cond1', [{ id: 'br1', label: 'Ветка', operator: 'equals', value: 'yes', target: 'fwd1' }]),
    makeForwardMessageNode('fwd1', '123456789'),
    makeCreateForumTopicNode('forum1', '-100123', 'Топик'),
    makeBroadcastNode('bc1'),
    makeMessageNode('msg_end', 'Конец: {callback_data} {button_text}'),
  ]);
  syntax(gen(p, 'm10'), 'm10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК N: Сложные сценарии
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок N: Сложные сценарии ──────────────────────────────────────');

test('N01', 'полный проект (start + message + keyboard + incoming_callback_trigger) → синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Добро пожаловать!', buttons: [], keyboardType: 'none', formatMode: 'none' } },
    makeIncomingCallbackTriggerNode('ict1', 'msg_menu'),
    makeMessageNodeWithButtons('msg_menu', 'Главное меню:', [
      { id: 'btn1', text: 'Профиль', action: 'goto', target: 'msg_profile', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn2', text: 'Настройки', action: 'goto', target: 'msg_settings', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg_profile', 'Ваш профиль. Нажали: {button_text}'),
    makeMessageNode('msg_settings', 'Настройки. Нажали: {button_text}'),
  ]);
  syntax(gen(p, 'n01'), 'n01');
});

test('N02', 'incoming_callback_trigger → message → condition → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_q'),
    makeMessageNodeWithButtons('msg_q', 'Вопрос:', [
      { id: 'btn_yes', text: 'Да', action: 'goto', target: 'cond1', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn_no', text: 'Нет', action: 'goto', target: 'cond1', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeConditionNode('cond1', [
      { id: 'br1', label: 'Да', operator: 'equals', value: 'yes', target: 'msg_yes' },
      { id: 'br2', label: 'Нет', operator: 'equals', value: 'no', target: 'msg_no' },
    ]),
    makeMessageNode('msg_yes', 'Вы ответили Да!'),
    makeMessageNode('msg_no', 'Вы ответили Нет!'),
  ]);
  syntax(gen(p, 'n02'), 'n02');
});

test('N03', 'incoming_callback_trigger → message с кнопками → message с {button_text} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_menu'),
    makeMessageNodeWithButtons('msg_menu', 'Выберите пункт:', [
      { id: 'btn1', text: 'Пункт А', action: 'goto', target: 'msg_result', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn2', text: 'Пункт Б', action: 'goto', target: 'msg_result', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn3', text: 'Пункт В', action: 'goto', target: 'msg_result', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg_result', 'Вы выбрали: {button_text} (данные: {callback_data})'),
  ]);
  syntax(gen(p, 'n03'), 'n03');
});

test('N04', 'несколько incoming_callback_trigger к разным нодам → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_a'),
    makeIncomingCallbackTriggerNode('ict2', 'msg_b'),
    makeIncomingCallbackTriggerNode('ict3', 'msg_c'),
    makeIncomingCallbackTriggerNode('ict4', 'msg_d'),
    makeMessageNode('msg_a', 'Ответ A: {callback_data}'),
    makeMessageNode('msg_b', 'Ответ B: {button_text}'),
    makeMessageNode('msg_c', 'Ответ C'),
    makeMessageNode('msg_d', 'Ответ D: {callback_data} {button_text}'),
  ]);
  syntax(gen(p, 'n04'), 'n04');
});

test('N05', 'incoming_callback_trigger + callback_trigger + виртуальные + incoming_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_answer'),
    makeCallbackTriggerNode('ct1', 'explicit_cb', 'msg_answer'),
    makeIncomingMessageTriggerNode('imt1', 'msg_answer'),
    makeMessageWithCustomCallbacks('msg_src', 'msg_answer'),
    makeMessageNode('msg_answer', 'Ответ: {callback_data} / {button_text}'),
  ]);
  syntax(gen(p, 'n05'), 'n05');
});

test('N06', 'incoming_callback_trigger → message с userDatabaseEnabled: true → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeMessageNode('msg1', 'Привет, {callback_data}!'),
  ]);
  const code = generatePythonCode(p as any, { botName: 'PhaseICT_n06', userDatabaseEnabled: true, enableComments: false });
  syntax(code, 'n06');
});

test('N07', 'incoming_callback_trigger → message с adminOnly: true → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_admin'),
    {
      id: 'msg_admin', type: 'message', position: { x: 0, y: 0 },
      data: { messageText: 'Только для администраторов', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false, adminOnly: true },
    },
  ]);
  syntax(gen(p, 'n07'), 'n07');
});

test('N08', 'incoming_callback_trigger → message с requiresAuth: true → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_auth'),
    {
      id: 'msg_auth', type: 'message', position: { x: 0, y: 0 },
      data: { messageText: 'Только для авторизованных', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false, requiresAuth: true },
    },
  ]);
  syntax(gen(p, 'n08'), 'n08');
});

test('N09', 'incoming_callback_trigger → forward_message → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'fwd1'),
    {
      id: 'fwd1', type: 'forward_message', position: { x: 0, y: 0 },
      data: {
        targetChatId: '123456789',
        messageText: 'Пересланное',
        buttons: [{ id: 'btn1', text: 'Далее', action: 'goto', target: 'msg_done' }],
        keyboardType: 'inline',
      },
    },
    makeMessageNode('msg_done', 'Сообщение переслано. Нажали: {button_text}'),
  ]);
  syntax(gen(p, 'n09'), 'n09');
});

test('N10', 'максимально сложный проект (все типы нод, все типы триггеров) → синтаксис OK', () => {
  const p = makeCleanProject([
    // Триггеры
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Старт', buttons: [], keyboardType: 'none', formatMode: 'none' } },
    makeIncomingCallbackTriggerNode('ict1', 'msg_main'),
    makeIncomingCallbackTriggerNode('ict2', 'cond_main'),
    makeIncomingMessageTriggerNode('imt1', 'msg_main'),
    makeCallbackTriggerNode('ct1', 'explicit_action', 'msg_main'),
    // Сообщения с кнопками
    makeMessageNodeWithButtons('msg_main', 'Главное меню:', [
      { id: 'btn1', text: 'Профиль', action: 'goto', target: 'msg_profile', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn2', text: 'Настройки', action: 'goto', target: 'cond_main', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn3', text: 'Рассылка', action: 'goto', target: 'bc1', customCallbackData: 'start_broadcast', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    // Условие
    makeConditionNode('cond_main', [
      { id: 'br1', label: 'Настройки', operator: 'equals', value: 'settings', target: 'msg_settings' },
      { id: 'br2', label: 'Форум', operator: 'equals', value: 'forum', target: 'forum1' },
    ]),
    // Разные типы нод
    makeMessageNode('msg_profile', 'Профиль: {user_name}. Нажали: {button_text}'),
    makeMessageNode('msg_settings', 'Настройки. Данные: {callback_data}'),
    makeForwardMessageNode('fwd1', '-100123456789'),
    makeCreateForumTopicNode('forum1', '-100987654321', 'Топик от {user_name}'),
    makeBroadcastNode('bc1'),
    makeKeyboardNode('kb1', [{ id: 'kbtn1', text: 'Назад', action: 'goto', target: 'msg_main', buttonType: 'normal' }]),
  ]);
  syntax(gen(p, 'n10'), 'n10');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итого: ${passed} пройдено, ${failed} провалено из ${results.length}`.padEnd(63) + '║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) {
  console.log('Провалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => console.log(`  ❌ ${r.id}. ${r.name}\n     → ${r.note}`));
  process.exit(1);
}
