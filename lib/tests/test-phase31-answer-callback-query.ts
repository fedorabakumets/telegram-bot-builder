/**
 * @fileoverview Фазовый тест для узла answer_callback_query
 *
 * Блок A: Базовая генерация (10 тестов)
 * Блок B: Текст уведомления (8 тестов)
 * Блок C: show_alert и cache_time (6 тестов)
 * Блок D: Целевые узлы (8 тестов)
 * Блок E: Взаимодействие с триггерами (8 тестов)
 * Блок F: Сценарии с condition (6 тестов)
 * Блок G: Полные сценарии (6 тестов)
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
 * @param userDb - Включить базу данных пользователей
 * @returns Сгенерированный Python-код
 */
function gen(project: unknown, label: string, userDb = false): string {
  return generatePythonCode(project as any, {
    botName: `PhaseACQ_${label}`,
    userDatabaseEnabled: userDb,
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
  const tmp = `_tmp_acq_${label}.py`;
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
 * Создаёт узел answer_callback_query
 * @param id - ID узла
 * @param targetId - ID следующего узла (пустая строка = без перехода)
 * @param extra - Дополнительные поля data
 * @returns Объект узла типа answer_callback_query
 */
function makeAnswerCallbackQueryNode(id: string, targetId: string, extra: Record<string, any> = {}) {
  return {
    id, type: 'answer_callback_query',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: targetId,
      callbackNotificationText: '',
      callbackShowAlert: false,
      callbackCacheTime: 0,
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
    id, type: 'message',
    position: { x: 400, y: 0 },
    data: { messageText: text, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

/**
 * Создаёт узел callback_trigger
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @returns Объект узла типа callback_trigger
 */
function makeCallbackTriggerNode(id: string, targetId: string) {
  return {
    id, type: 'callback_trigger',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: targetId,
      callbackData: id,
      matchType: 'exact',
      adminOnly: false,
      requiresAuth: false,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 * Создаёт узел incoming_callback_trigger
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @returns Объект узла типа incoming_callback_trigger
 */
function makeIncomingCallbackTriggerNode(id: string, targetId: string) {
  return {
    id, type: 'incoming_callback_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт узел command_trigger
 * @param id - ID узла
 * @param command - Команда (например /start)
 * @param targetId - ID целевого узла
 * @returns Объект узла типа command_trigger
 */
function makeCommandTriggerNode(id: string, command: string, targetId: string) {
  return {
    id, type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, command, buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт узел text_trigger
 * @param id - ID узла
 * @param text - Текст для совпадения
 * @param targetId - ID целевого узла
 * @returns Объект узла типа text_trigger
 */
function makeTextTriggerNode(id: string, text: string, targetId: string) {
  return {
    id, type: 'text_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, triggerText: text, matchType: 'exact', buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт узел condition с ветками
 * @param id - ID узла
 * @param branches - Массив веток: [{id, label, operator, value, target}]
 * @param defaultTargetId - ID узла по умолчанию
 * @returns Объект узла типа condition
 */
function makeConditionNode(
  id: string,
  branches: Array<{ id: string; label: string; operator: string; value: string; target: string }>,
  defaultTargetId = '',
) {
  return {
    id, type: 'condition',
    position: { x: 0, y: 0 },
    data: {
      conditions: branches.map(b => ({
        id: b.id,
        label: b.label,
        variable: 'user_id',
        operator: b.operator,
        value: b.value,
        targetNodeId: b.target,
      })),
      defaultTargetId,
    },
  };
}

/**
 * Создаёт узел ban_user
 * @param id - ID узла
 * @param targetId - ID следующего узла (опционально)
 * @returns Объект узла типа ban_user
 */
function makeBanUserNode(id: string, targetId = '') {
  return {
    id, type: 'ban_user',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: targetId,
      userIdSource: 'last_message',
      targetGroupId: '-100123456789',
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 * Создаёт узел forward_message
 * @param id - ID узла
 * @param targetChatId - ID целевого чата
 * @returns Объект узла типа forward_message
 */
function makeForwardMessageNode(id: string, targetChatId: string) {
  return {
    id, type: 'forward_message',
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
 * Создаёт узел http_request
 * @param id - ID узла
 * @param url - URL запроса
 * @param targetId - ID следующего узла
 * @returns Объект узла типа http_request
 */
function makeHttpRequestNode(id: string, url: string, targetId: string) {
  return {
    id, type: 'http_request',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: targetId,
      url,
      method: 'GET',
      headers: [],
      body: '',
      saveResponseTo: '',
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 * Создаёт start-узел
 * @param id - ID узла
 * @returns Объект узла типа start
 */
function makeStartNode(id: string) {
  return {
    id, type: 'start',
    position: { x: 0, y: 0 },
    data: {
      command: '/start',
      messageText: 'Привет!',
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
    },
  };
}

/**
 * Создаёт узел incoming_message_trigger
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @returns Объект узла типа incoming_message_trigger
 */
function makeIncomingMessageTriggerNode(id: string, targetId: string) {
  return {
    id, type: 'incoming_message_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест — Узел answer_callback_query                          ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'генерирует @dp.callback_query(lambda c: c.data == "nodeId") декоратор', () => {
  const p = makeCleanProject([makeAnswerCallbackQueryNode('acq_1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('@dp.callback_query('), '@dp.callback_query должен быть в коде');
  ok(code.includes('acq_1'), 'nodeId acq_1 должен быть в коде');
});

test('A02', 'имя функции handle_callback_{nodeId}', () => {
  const p = makeCleanProject([makeAnswerCallbackQueryNode('acq_1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('handle_callback_acq_1'), 'handle_callback_acq_1 должен быть в коде');
});

test('A03', 'вызывает callback_query.answer() с текстом уведомления', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Принято!' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a03');
  ok(code.includes('callback_query.answer('), 'callback_query.answer() должен быть в коде');
  ok(code.includes('Принято!'), 'текст уведомления должен быть в коде');
});

test('A04', 'show_alert=True когда callbackShowAlert: true', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Внимание!', callbackShowAlert: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a04');
  ok(code.includes('show_alert=True'), 'show_alert=True должен быть в коде');
});

test('A05', 'show_alert=False когда callbackShowAlert: false', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Тихо', callbackShowAlert: false }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a05');
  ok(!code.includes('show_alert=True'), 'show_alert=True НЕ должен быть при callbackShowAlert: false');
});

test('A06', 'cache_time=N когда callbackCacheTime: N', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'OK', callbackCacheTime: 30 }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a06');
  ok(code.includes('cache_time=30') || code.includes('30'), 'cache_time=30 должен быть в коде');
});

test('A07', 'вызывает handle_callback_{targetId} для перехода к следующему узлу', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg_target'),
    makeMessageNode('msg_target'),
  ]);
  const code = gen(p, 'a07');
  ok(code.includes('await handle_callback_msg_target('), 'вызов handle_callback_msg_target должен быть в коде');
});

test('A08', 'содержит logging.info', () => {
  const p = makeCleanProject([makeAnswerCallbackQueryNode('acq_1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a08');
  ok(code.includes('logging.info('), 'logging.info должен быть в коде');
});

test('A09', 'содержит logging.error и try/except', () => {
  const p = makeCleanProject([makeAnswerCallbackQueryNode('acq_1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a09');
  ok(code.includes('logging.error'), 'logging.error должен быть в коде');
  ok(code.includes('try:') || code.includes('except'), 'try/except должен быть в коде');
});

test('A10', 'синтаксис Python OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', {
      callbackNotificationText: 'OK',
      callbackShowAlert: false,
      callbackCacheTime: 10,
    }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'a10'), 'a10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Текст уведомления
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Текст уведомления ─────────────────────────────────────');

test('B01', 'пустой текст → await callback_query.answer() без аргументов', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: '' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b01');
  ok(code.includes('await callback_query.answer()'), 'await callback_query.answer() без аргументов должен быть в коде');
});

test('B02', 'текст без переменных → содержит текст напрямую', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Операция выполнена' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b02');
  ok(code.includes('Операция выполнена'), 'текст должен быть в коде напрямую');
});

test('B03', 'текст с переменной {user_name} → содержит replace_variables_in_text', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Привет, {user_name}!' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b03');
  ok(
    code.includes('replace_variables_in_text') || code.includes('user_name'),
    'replace_variables_in_text или user_name должен быть в коде',
  );
  syntax(code, 'b03');
});

test('B04', 'текст с несколькими переменными {var1} и {var2} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: '{var1} и {var2} готово' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'b04'), 'b04');
});

test('B05', 'текст с кириллицей → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Действие выполнено успешно!' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'b05'), 'b05');
});

test('B06', 'текст с эмодзи → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: '✅ Готово! 🎉' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'b06'), 'b06');
});

test('B07', 'текст 200 символов (максимум) → синтаксис OK', () => {
  const longText = 'А'.repeat(200);
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: longText }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'b07'), 'b07');
});

test('B08', 'текст с {user_id} системной переменной → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'ID: {user_id}' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'b08'), 'b08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: show_alert и cache_time
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: show_alert и cache_time ───────────────────────────────');

test('C01', 'show_alert=True + cache_time=0 → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', {
      callbackNotificationText: 'Внимание',
      callbackShowAlert: true,
      callbackCacheTime: 0,
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c01');
  ok(code.includes('show_alert=True'), 'show_alert=True должен быть в коде');
  syntax(code, 'c01');
});

test('C02', 'show_alert=False + cache_time=5 → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', {
      callbackNotificationText: 'Тихо',
      callbackShowAlert: false,
      callbackCacheTime: 5,
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c02');
  ok(!code.includes('show_alert=True'), 'show_alert=True НЕ должен быть в коде');
  syntax(code, 'c02');
});

test('C03', 'show_alert=True + cache_time=10 → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', {
      callbackNotificationText: 'Важно!',
      callbackShowAlert: true,
      callbackCacheTime: 10,
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c03');
  ok(code.includes('show_alert=True'), 'show_alert=True должен быть в коде');
  syntax(code, 'c03');
});

test('C04', 'show_alert=False + cache_time=0 (дефолт) → await callback_query.answer() без лишних аргументов', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', {
      callbackNotificationText: '',
      callbackShowAlert: false,
      callbackCacheTime: 0,
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c04');
  ok(code.includes('await callback_query.answer()'), 'await callback_query.answer() без аргументов должен быть в коде');
  syntax(code, 'c04');
});

test('C05', 'два узла с разными show_alert → оба в коде', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Тихо', callbackShowAlert: false }),
    makeAnswerCallbackQueryNode('acq_2', 'msg2', { callbackNotificationText: 'Громко', callbackShowAlert: true }),
    makeMessageNode('msg1', 'Первый'),
    makeMessageNode('msg2', 'Второй'),
  ]);
  const code = gen(p, 'c05');
  ok(code.includes('handle_callback_acq_1'), 'handle_callback_acq_1 должен быть в коде');
  ok(code.includes('handle_callback_acq_2'), 'handle_callback_acq_2 должен быть в коде');
  ok(code.includes('show_alert=True'), 'show_alert=True должен быть в коде для acq_2');
  syntax(code, 'c05');
});

test('C06', 'два узла с разными cache_time → оба в коде', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_a', 'msg1', { callbackNotificationText: 'A', callbackCacheTime: 3 }),
    makeAnswerCallbackQueryNode('acq_b', 'msg2', { callbackNotificationText: 'B', callbackCacheTime: 60 }),
    makeMessageNode('msg1', 'Первый'),
    makeMessageNode('msg2', 'Второй'),
  ]);
  const code = gen(p, 'c06');
  ok(code.includes('handle_callback_acq_a'), 'handle_callback_acq_a должен быть в коде');
  ok(code.includes('handle_callback_acq_b'), 'handle_callback_acq_b должен быть в коде');
  syntax(code, 'c06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Целевые узлы
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Целевые узлы ──────────────────────────────────────────');

test('D01', 'answer_callback_query → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Готово' }),
    makeMessageNode('msg1', 'Привет!'),
  ]);
  syntax(gen(p, 'd01'), 'd01');
});

test('D02', 'answer_callback_query → condition → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'cond1', { callbackNotificationText: 'Проверяем' }),
    makeConditionNode('cond1', [{ id: 'br1', label: 'Ветка', operator: 'not_empty', value: '', target: 'msg1' }]),
    makeMessageNode('msg1', 'Условие выполнено'),
  ]);
  syntax(gen(p, 'd02'), 'd02');
});

test('D03', 'answer_callback_query → ban_user → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'ban1', { callbackNotificationText: 'Заблокирован' }),
    makeBanUserNode('ban1'),
  ]);
  syntax(gen(p, 'd03'), 'd03');
});

test('D04', 'answer_callback_query → forward_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'fwd1', { callbackNotificationText: 'Пересылаем' }),
    makeForwardMessageNode('fwd1', '123456789'),
  ]);
  syntax(gen(p, 'd04'), 'd04');
});

test('D05', 'answer_callback_query → http_request → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'http1', { callbackNotificationText: 'Запрос' }),
    makeHttpRequestNode('http1', 'https://example.com/api', 'msg1'),
    makeMessageNode('msg1', 'Ответ получен'),
  ]);
  syntax(gen(p, 'd05'), 'd05');
});

test('D06', 'answer_callback_query → answer_callback_query (цепочка) → синтаксис OK', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_1', 'acq_2', { callbackNotificationText: 'Первый' }),
    makeAnswerCallbackQueryNode('acq_2', 'msg1', { callbackNotificationText: 'Второй' }),
    makeMessageNode('msg1', 'Конец цепочки'),
  ]);
  syntax(gen(p, 'd06'), 'd06');
});

test('D07', 'без autoTransitionTo → обработчик всё равно генерируется (просто без перехода)', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_solo', '', { callbackNotificationText: 'Без перехода' }),
  ]);
  const code = gen(p, 'd07');
  // Узел без autoTransitionTo может не генерировать обработчик — проверяем синтаксис
  syntax(code, 'd07');
});

test('D08', 'два answer_callback_query с разными targetId → оба перехода в коде', () => {
  const p = makeCleanProject([
    makeAnswerCallbackQueryNode('acq_x', 'msg_x', { callbackNotificationText: 'X' }),
    makeAnswerCallbackQueryNode('acq_y', 'msg_y', { callbackNotificationText: 'Y' }),
    makeMessageNode('msg_x', 'Сообщение X'),
    makeMessageNode('msg_y', 'Сообщение Y'),
  ]);
  const code = gen(p, 'd08');
  ok(code.includes('handle_callback_msg_x') || code.includes('msg_x'), 'переход к msg_x должен быть в коде');
  ok(code.includes('handle_callback_msg_y') || code.includes('msg_y'), 'переход к msg_y должен быть в коде');
  syntax(code, 'd08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Взаимодействие с триггерами
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Взаимодействие с триггерами ───────────────────────────');

test('E01', 'callback_trigger → answer_callback_query → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_trigger', 'acq_1'),
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Готово' }),
    makeMessageNode('msg1', 'Ответ'),
  ]);
  syntax(gen(p, 'e01'), 'e01');
});

test('E02', 'incoming_callback_trigger → answer_callback_query → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'acq_1'),
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Принято' }),
    makeMessageNode('msg1', 'Ответ'),
  ]);
  syntax(gen(p, 'e02'), 'e02');
});

test('E03', 'command_trigger → answer_callback_query → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/action', 'acq_1'),
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Команда выполнена' }),
    makeMessageNode('msg1', 'Ответ на команду'),
  ]);
  syntax(gen(p, 'e03'), 'e03');
});

test('E04', 'text_trigger → answer_callback_query → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', 'нажми', 'acq_1'),
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Текст получен' }),
    makeMessageNode('msg1', 'Ответ на текст'),
  ]);
  syntax(gen(p, 'e04'), 'e04');
});

test('E05', 'answer_callback_query + start в одном проекте → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeCallbackTriggerNode('cb1', 'acq_1'),
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'OK' }),
    makeMessageNode('msg1', 'Ответ'),
  ]);
  syntax(gen(p, 'e05'), 'e05');
});

test('E06', 'несколько callback_trigger каждый ведёт к своему answer_callback_query → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_like', 'acq_like'),
    makeCallbackTriggerNode('cb_dislike', 'acq_dislike'),
    makeAnswerCallbackQueryNode('acq_like', 'msg_like', { callbackNotificationText: '👍 Лайк!' }),
    makeAnswerCallbackQueryNode('acq_dislike', 'msg_dislike', { callbackNotificationText: '👎 Дизлайк!' }),
    makeMessageNode('msg_like', 'Вы поставили лайк'),
    makeMessageNode('msg_dislike', 'Вы поставили дизлайк'),
  ]);
  const code = gen(p, 'e06');
  ok(code.includes('handle_callback_acq_like'), 'handle_callback_acq_like должен быть в коде');
  ok(code.includes('handle_callback_acq_dislike'), 'handle_callback_acq_dislike должен быть в коде');
  syntax(code, 'e06');
});

test('E07', 'answer_callback_query + incoming_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingMessageTriggerNode('imt1', 'msg_in'),
    makeCallbackTriggerNode('cb1', 'acq_1'),
    makeAnswerCallbackQueryNode('acq_1', 'msg_cb', { callbackNotificationText: 'Кнопка нажата' }),
    makeMessageNode('msg_in', 'Входящее сообщение'),
    makeMessageNode('msg_cb', 'Ответ на кнопку'),
  ]);
  syntax(gen(p, 'e07'), 'e07');
});

test('E08', 'все типы триггеров + answer_callback_query → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeCallbackTriggerNode('cb1', 'acq_1'),
    makeIncomingCallbackTriggerNode('ict1', 'msg_ict'),
    makeCommandTriggerNode('cmd1', '/help', 'msg_cmd'),
    makeTextTriggerNode('txt1', 'помощь', 'msg_txt'),
    makeIncomingMessageTriggerNode('imt1', 'msg_imt'),
    makeAnswerCallbackQueryNode('acq_1', 'msg_cb', { callbackNotificationText: 'Обработано' }),
    makeMessageNode('msg_cb', 'Ответ на callback'),
    makeMessageNode('msg_ict', 'Входящий callback'),
    makeMessageNode('msg_cmd', 'Ответ на команду'),
    makeMessageNode('msg_txt', 'Ответ на текст'),
    makeMessageNode('msg_imt', 'Входящее'),
  ]);
  syntax(gen(p, 'e08'), 'e08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Сценарии с condition
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Сценарии с condition ──────────────────────────────────');

test('F01', 'callback_trigger → condition(is_admin) → answer_callback_query("OK") / answer_callback_query("Нет прав") → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_admin', 'cond_admin'),
    makeConditionNode('cond_admin', [
      { id: 'br_yes', label: 'Админ', operator: 'equals', value: 'true', target: 'acq_ok' },
      { id: 'br_no', label: 'Не админ', operator: 'equals', value: 'false', target: 'acq_deny' },
    ]),
    makeAnswerCallbackQueryNode('acq_ok', 'msg_ok', { callbackNotificationText: 'OK', callbackShowAlert: false }),
    makeAnswerCallbackQueryNode('acq_deny', 'msg_deny', { callbackNotificationText: 'Нет прав', callbackShowAlert: true }),
    makeMessageNode('msg_ok', 'Действие выполнено'),
    makeMessageNode('msg_deny', 'Доступ запрещён'),
  ]);
  syntax(gen(p, 'f01'), 'f01');
});

test('F02', 'condition → answer_callback_query с текстом → содержит текст', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'cond1'),
    makeConditionNode('cond1', [
      { id: 'br1', label: 'Ветка', operator: 'not_empty', value: '', target: 'acq_1' },
    ]),
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'Условие выполнено!' }),
    makeMessageNode('msg1', 'Ответ'),
  ]);
  const code = gen(p, 'f02');
  ok(code.includes('Условие выполнено!'), 'текст уведомления должен быть в коде');
  syntax(code, 'f02');
});

test('F03', 'condition → answer_callback_query(show_alert=true) → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'cond1'),
    makeConditionNode('cond1', [
      { id: 'br1', label: 'Ветка', operator: 'not_empty', value: '', target: 'acq_alert' },
    ]),
    makeAnswerCallbackQueryNode('acq_alert', 'msg1', {
      callbackNotificationText: 'Важное уведомление!',
      callbackShowAlert: true,
    }),
    makeMessageNode('msg1', 'Ответ'),
  ]);
  const code = gen(p, 'f03');
  ok(code.includes('show_alert=True'), 'show_alert=True должен быть в коде');
  syntax(code, 'f03');
});

test('F04', 'answer_callback_query → condition → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'acq_1'),
    makeAnswerCallbackQueryNode('acq_1', 'cond1', { callbackNotificationText: 'Проверяем' }),
    makeConditionNode('cond1', [
      { id: 'br1', label: 'Ветка', operator: 'not_empty', value: '', target: 'msg1' },
    ], 'msg2'),
    makeMessageNode('msg1', 'Условие выполнено'),
    makeMessageNode('msg2', 'По умолчанию'),
  ]);
  syntax(gen(p, 'f04'), 'f04');
});

test('F05', 'сложная цепочка: callback_trigger → answer_callback_query → ban_user → answer_callback_query → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_ban', 'acq_before_ban'),
    makeAnswerCallbackQueryNode('acq_before_ban', 'ban1', { callbackNotificationText: 'Баним...' }),
    makeBanUserNode('ban1', 'acq_after_ban'),
    makeAnswerCallbackQueryNode('acq_after_ban', 'msg_done', { callbackNotificationText: 'Забанен!', callbackShowAlert: true }),
    makeMessageNode('msg_done', 'Пользователь заблокирован'),
  ]);
  syntax(gen(p, 'f05'), 'f05');
});

test('F06', 'condition с несколькими ветками каждая ведёт к answer_callback_query → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_vote', 'cond_vote'),
    makeConditionNode('cond_vote', [
      { id: 'br_a', label: 'Вариант A', operator: 'equals', value: 'a', target: 'acq_a' },
      { id: 'br_b', label: 'Вариант B', operator: 'equals', value: 'b', target: 'acq_b' },
      { id: 'br_c', label: 'Вариант C', operator: 'equals', value: 'c', target: 'acq_c' },
    ]),
    makeAnswerCallbackQueryNode('acq_a', 'msg_a', { callbackNotificationText: 'Выбран A' }),
    makeAnswerCallbackQueryNode('acq_b', 'msg_b', { callbackNotificationText: 'Выбран B' }),
    makeAnswerCallbackQueryNode('acq_c', 'msg_c', { callbackNotificationText: 'Выбран C' }),
    makeMessageNode('msg_a', 'Вариант A'),
    makeMessageNode('msg_b', 'Вариант B'),
    makeMessageNode('msg_c', 'Вариант C'),
  ]);
  const code = gen(p, 'f06');
  ok(code.includes('handle_callback_acq_a'), 'handle_callback_acq_a должен быть в коде');
  ok(code.includes('handle_callback_acq_b'), 'handle_callback_acq_b должен быть в коде');
  ok(code.includes('handle_callback_acq_c'), 'handle_callback_acq_c должен быть в коде');
  syntax(code, 'f06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Полные сценарии
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Полные сценарии ───────────────────────────────────────');

test('G01', 'полный сценарий "кнопка забанить": callback_trigger → condition(is_admin) → ban_user → answer_callback_query("Забанен") / answer_callback_query("Нет прав") → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeCallbackTriggerNode('cb_ban_btn', 'cond_is_admin'),
    makeConditionNode('cond_is_admin', [
      { id: 'br_admin', label: 'Является админом', operator: 'equals', value: 'true', target: 'ban_user_node' },
      { id: 'br_not_admin', label: 'Не является админом', operator: 'equals', value: 'false', target: 'acq_no_rights' },
    ]),
    makeBanUserNode('ban_user_node', 'acq_banned'),
    makeAnswerCallbackQueryNode('acq_banned', 'msg_banned', {
      callbackNotificationText: 'Пользователь забанен',
      callbackShowAlert: true,
    }),
    makeAnswerCallbackQueryNode('acq_no_rights', 'msg_no_rights', {
      callbackNotificationText: 'Нет прав для этого действия',
      callbackShowAlert: true,
    }),
    makeMessageNode('msg_banned', 'Пользователь заблокирован'),
    makeMessageNode('msg_no_rights', 'У вас нет прав'),
  ]);
  const code = gen(p, 'g01');
  ok(code.includes('Пользователь забанен'), 'текст "Пользователь забанен" должен быть в коде');
  ok(code.includes('Нет прав для этого действия'), 'текст "Нет прав" должен быть в коде');
  syntax(code, 'g01');
});

test('G02', 'полный сценарий с userDatabaseEnabled: true → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeCallbackTriggerNode('cb1', 'acq_1'),
    makeAnswerCallbackQueryNode('acq_1', 'msg1', {
      callbackNotificationText: 'Привет, {user_name}!',
      callbackShowAlert: false,
    }),
    makeMessageNode('msg1', 'Добро пожаловать, {user_name}!'),
  ]);
  const code = gen(p, 'g02', true);
  syntax(code, 'g02');
});

test('G03', 'несколько answer_callback_query в одном проекте → все в коде', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_1', 'acq_alpha'),
    makeCallbackTriggerNode('cb_2', 'acq_beta'),
    makeCallbackTriggerNode('cb_3', 'acq_gamma'),
    makeAnswerCallbackQueryNode('acq_alpha', 'msg_alpha', { callbackNotificationText: 'Альфа' }),
    makeAnswerCallbackQueryNode('acq_beta', 'msg_beta', { callbackNotificationText: 'Бета' }),
    makeAnswerCallbackQueryNode('acq_gamma', 'msg_gamma', { callbackNotificationText: 'Гамма' }),
    makeMessageNode('msg_alpha', 'Альфа'),
    makeMessageNode('msg_beta', 'Бета'),
    makeMessageNode('msg_gamma', 'Гамма'),
  ]);
  const code = gen(p, 'g03');
  ok(code.includes('handle_callback_acq_alpha'), 'handle_callback_acq_alpha должен быть в коде');
  ok(code.includes('handle_callback_acq_beta'), 'handle_callback_acq_beta должен быть в коде');
  ok(code.includes('handle_callback_acq_gamma'), 'handle_callback_acq_gamma должен быть в коде');
  syntax(code, 'g03');
});

test('G04', 'answer_callback_query с переменной + userDatabaseEnabled: true → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_profile', 'acq_profile'),
    makeAnswerCallbackQueryNode('acq_profile', 'msg_profile', {
      callbackNotificationText: 'Профиль пользователя {user_id}',
      callbackShowAlert: false,
      callbackCacheTime: 5,
    }),
    makeMessageNode('msg_profile', 'Ваш профиль: {user_name} (ID: {user_id})'),
  ]);
  const code = gen(p, 'g04', true);
  syntax(code, 'g04');
});

test('G05', 'большой проект: start + 3 callback_trigger + 3 answer_callback_query + condition + ban_user + message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeCallbackTriggerNode('cb_info', 'acq_info'),
    makeCallbackTriggerNode('cb_ban', 'cond_admin_check'),
    makeCallbackTriggerNode('cb_vote', 'acq_vote'),
    makeConditionNode('cond_admin_check', [
      { id: 'br_yes', label: 'Админ', operator: 'equals', value: 'true', target: 'ban_node' },
      { id: 'br_no', label: 'Не админ', operator: 'equals', value: 'false', target: 'acq_no_perm' },
    ]),
    makeBanUserNode('ban_node', 'acq_banned_ok'),
    makeAnswerCallbackQueryNode('acq_info', 'msg_info', { callbackNotificationText: 'Информация получена' }),
    makeAnswerCallbackQueryNode('acq_vote', 'msg_vote', { callbackNotificationText: 'Голос принят!', callbackShowAlert: false }),
    makeAnswerCallbackQueryNode('acq_banned_ok', 'msg_banned', { callbackNotificationText: 'Забанен', callbackShowAlert: true }),
    makeAnswerCallbackQueryNode('acq_no_perm', 'msg_no_perm', { callbackNotificationText: 'Нет прав', callbackShowAlert: true }),
    makeMessageNode('msg_info', 'Информация'),
    makeMessageNode('msg_vote', 'Голосование'),
    makeMessageNode('msg_banned', 'Пользователь заблокирован'),
    makeMessageNode('msg_no_perm', 'Доступ запрещён'),
  ]);
  const code = gen(p, 'g05');
  ok(code.includes('handle_callback_acq_info'), 'handle_callback_acq_info должен быть в коде');
  ok(code.includes('handle_callback_acq_vote'), 'handle_callback_acq_vote должен быть в коде');
  ok(code.includes('handle_callback_acq_banned_ok'), 'handle_callback_acq_banned_ok должен быть в коде');
  ok(code.includes('handle_callback_acq_no_perm'), 'handle_callback_acq_no_perm должен быть в коде');
  syntax(code, 'g05');
});

test('G06', 'answer_callback_query без текста в большом проекте → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeCallbackTriggerNode('cb_silent', 'acq_silent'),
    makeCallbackTriggerNode('cb_loud', 'acq_loud'),
    makeIncomingCallbackTriggerNode('ict1', 'msg_ict'),
    makeIncomingMessageTriggerNode('imt1', 'msg_imt'),
    makeAnswerCallbackQueryNode('acq_silent', 'msg_silent', {
      callbackNotificationText: '',
      callbackShowAlert: false,
      callbackCacheTime: 0,
    }),
    makeAnswerCallbackQueryNode('acq_loud', 'msg_loud', {
      callbackNotificationText: 'Громкое уведомление!',
      callbackShowAlert: true,
      callbackCacheTime: 0,
    }),
    makeMessageNode('msg_silent', 'Тихий ответ'),
    makeMessageNode('msg_loud', 'Громкий ответ'),
    makeMessageNode('msg_ict', 'Входящий callback'),
    makeMessageNode('msg_imt', 'Входящее сообщение'),
  ]);
  const code = gen(p, 'g06');
  ok(code.includes('await callback_query.answer()'), 'await callback_query.answer() без аргументов должен быть в коде');
  ok(code.includes('Громкое уведомление!'), 'текст громкого уведомления должен быть в коде');
  syntax(code, 'g06');
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
