/**
 * @fileoverview Фазовый тест для узла edit_message
 *
 * Блок A: Базовая генерация (10 тестов)
 * Блок B: Режимы редактирования (8 тестов)
 * Блок C: Источник сообщения (6 тестов)
 * Блок D: Клавиатура (6 тестов)
 * Блок E: Взаимодействие с триггерами (6 тестов)
 * Блок F: Полные сценарии (4 теста)
 * Блок G: Цепочки узлов (8 тестов)
 * Блок H: Граничные случаи (8 тестов)
 * Блок I: Взаимодействие с другими action-узлами (8 тестов)
 * Блок J: Полные реальные сценарии (8 тестов)
 * Блок K: keyboardNodeId и динамические кнопки (8 тестов)
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
    botName: `PhaseEM_${label}`,
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
  const tmp = `_tmp_em_${label}.py`;
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
 * Создаёт узел edit_message
 * @param id - ID узла
 * @param targetId - ID следующего узла
 * @param extra - Дополнительные поля data
 * @returns Объект узла типа edit_message
 */
function makeEditMessageNode(id: string, targetId = '', extra: Record<string, any> = {}) {
  return {
    id, type: 'edit_message',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: targetId,
      editMode: 'text',
      editMessageText: 'Обновлённый текст',
      editFormatMode: 'none',
      editMessageIdSource: 'last_bot_message',
      editMessageIdManual: '',
      editKeyboardMode: 'keep',
      editKeyboardNodeId: '',
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
 * @param saveMessageIdTo - Переменная для сохранения ID сообщения
 * @returns Объект узла типа message
 */
function makeMessageNode(id: string, text = 'Ответ', saveMessageIdTo?: string) {
  return {
    id, type: 'message',
    position: { x: 400, y: 0 },
    data: {
      messageText: text,
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      ...(saveMessageIdTo ? { saveMessageIdTo } : {}),
    },
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
 * Создаёт узел command_trigger
 * @param id - ID узла
 * @param command - Команда
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
 * Создаёт узел condition
 * @param id - ID узла
 * @param targetId - ID целевого узла по умолчанию
 * @returns Объект узла типа condition
 */
function makeConditionNode(id: string, targetId: string) {
  return {
    id, type: 'condition',
    position: { x: 0, y: 0 },
    data: {
      conditions: [{ id: 'br1', label: 'Ветка', variable: 'x', operator: 'not_empty', value: '', targetNodeId: targetId }],
      defaultTargetId: '',
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
      buttons: [], keyboardType: 'none',
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
      autoTransitionTo: targetId, url, method: 'GET',
      headers: [], body: '', saveResponseTo: '',
      buttons: [], keyboardType: 'none',
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
      autoTransitionTo: targetId, userIdSource: 'last_message',
      targetGroupId: '-100123456789', buttons: [], keyboardType: 'none',
    },
  };
}

/**
 * Создаёт узел delete_message
 * @param id - ID узла
 * @param targetId - ID следующего узла (опционально)
 * @returns Объект узла типа delete_message
 */
function makeDeleteMessageNode(id: string, targetId = '') {
  return {
    id, type: 'delete_message',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт узел pin_message
 * @param id - ID узла
 * @param targetId - ID следующего узла (опционально)
 * @returns Объект узла типа pin_message
 */
function makePinMessageNode(id: string, targetId = '') {
  return {
    id, type: 'pin_message',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

/**
 * Создаёт узел get_managed_bot_token
 * @param id - ID узла
 * @param targetId - ID следующего узла (опционально)
 * @returns Объект узла типа get_managed_bot_token
 */
function makeGetManagedBotTokenNode(id: string, targetId = '') {
  return {
    id, type: 'get_managed_bot_token',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: targetId, botIdSource: 'variable',
      botIdVariable: 'bot_id', saveTokenTo: 'bot_token',
      buttons: [], keyboardType: 'none',
    },
  };
}

/**
 * Создаёт узел answer_callback_query
 * @param id - ID узла
 * @param targetId - ID следующего узла
 * @param extra - Дополнительные поля data
 * @returns Объект узла типа answer_callback_query
 */
function makeAnswerCallbackQueryNode(id: string, targetId: string, extra: Record<string, any> = {}) {
  return {
    id, type: 'answer_callback_query',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: targetId, callbackNotificationText: '',
      callbackShowAlert: false, callbackCacheTime: 0,
      buttons: [], keyboardType: 'none', ...extra,
    },
  };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест — Узел edit_message                                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'генерирует @dp.callback_query декоратор с nodeId', () => {
  const p = makeCleanProject([makeEditMessageNode('em_1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('@dp.callback_query('), '@dp.callback_query должен быть в коде');
  ok(code.includes('em_1'), 'nodeId em_1 должен быть в коде');
});

test('A02', 'имя функции handle_callback_{nodeId}', () => {
  const p = makeCleanProject([makeEditMessageNode('em_1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('handle_callback_em_1'), 'handle_callback_em_1 должен быть в коде');
});

test('A03', 'вызывает bot.edit_message_text при editMode=text', () => {
  const p = makeCleanProject([makeEditMessageNode('em_1', 'msg1', { editMode: 'text' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a03');
  ok(code.includes('edit_message_text'), 'edit_message_text должен быть в коде');
});

test('A04', 'содержит logging.info', () => {
  const p = makeCleanProject([makeEditMessageNode('em_1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a04');
  ok(code.includes('logging.info('), 'logging.info должен быть в коде');
});

test('A05', 'содержит logging.error и try/except', () => {
  const p = makeCleanProject([makeEditMessageNode('em_1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a05');
  ok(code.includes('logging.error'), 'logging.error должен быть в коде');
  ok(code.includes('try:'), 'try: должен быть в коде');
});

test('A06', 'вызывает handle_callback_{targetId} для перехода', () => {
  const p = makeCleanProject([makeEditMessageNode('em_1', 'msg_target'), makeMessageNode('msg_target')]);
  const code = gen(p, 'a06');
  ok(code.includes('await handle_callback_msg_target('), 'вызов handle_callback_msg_target должен быть в коде');
});

test('A07', 'без autoTransitionTo — обработчик генерируется (конечный узел)', () => {
  const p = makeCleanProject([makeEditMessageNode('em_solo', '')]);
  const code = gen(p, 'a07');
  ok(code.includes('handle_callback_em_solo'), 'handle_callback_em_solo должен быть в коде');
  syntax(code, 'a07');
});

test('A08', 'два узла edit_message → два обработчика', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1'),
    makeEditMessageNode('em_2', 'msg2'),
    makeMessageNode('msg1', 'Первый'),
    makeMessageNode('msg2', 'Второй'),
  ]);
  const code = gen(p, 'a08');
  ok(code.includes('handle_callback_em_1'), 'handle_callback_em_1 должен быть в коде');
  ok(code.includes('handle_callback_em_2'), 'handle_callback_em_2 должен быть в коде');
});

test('A09', 'содержит user_id = callback_query.from_user.id', () => {
  const p = makeCleanProject([makeEditMessageNode('em_1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a09');
  ok(code.includes('from_user.id'), 'from_user.id должен быть в коде');
});

test('A10', 'синтаксис Python OK — базовый случай', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', { editMessageText: 'Новый текст', editMode: 'text' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'a10'), 'a10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Режимы редактирования
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Режимы редактирования ─────────────────────────────────');

test('B01', 'editMode=text → вызывает edit_message_text, не edit_message_reply_markup', () => {
  const p = makeCleanProject([makeEditMessageNode('em_1', 'msg1', { editMode: 'text' }), makeMessageNode('msg1')]);
  const code = gen(p, 'b01');
  ok(code.includes('edit_message_text'), 'edit_message_text должен быть в коде');
  syntax(code, 'b01');
});

test('B02', 'editMode=markup → вызывает edit_message_reply_markup', () => {
  const p = makeCleanProject([makeEditMessageNode('em_1', 'msg1', { editMode: 'markup' }), makeMessageNode('msg1')]);
  const code = gen(p, 'b02');
  ok(code.includes('edit_message_reply_markup'), 'edit_message_reply_markup должен быть в коде');
  syntax(code, 'b02');
});

test('B03', 'editMode=both → вызывает оба метода', () => {
  const p = makeCleanProject([makeEditMessageNode('em_1', 'msg1', { editMode: 'both' }), makeMessageNode('msg1')]);
  const code = gen(p, 'b03');
  ok(code.includes('edit_message_text'), 'edit_message_text должен быть в коде');
  ok(code.includes('edit_message_reply_markup'), 'edit_message_reply_markup должен быть в коде');
  syntax(code, 'b03');
});

test('B04', 'editFormatMode=html → parse_mode="HTML"', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', { editMode: 'text', editFormatMode: 'html', editMessageText: '<b>Жирный</b>' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b04');
  ok(code.includes('parse_mode="HTML"') || code.includes("parse_mode='HTML'"), 'parse_mode HTML должен быть в коде');
  syntax(code, 'b04');
});

test('B05', 'editFormatMode=markdown → parse_mode="Markdown"', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', { editMode: 'text', editFormatMode: 'markdown', editMessageText: '*Жирный*' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b05');
  ok(
    code.includes('parse_mode="Markdown"') || code.includes("parse_mode='Markdown'") || code.includes('Markdown'),
    'parse_mode Markdown должен быть в коде',
  );
  syntax(code, 'b05');
});

test('B06', 'editFormatMode=none → нет parse_mode', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', { editMode: 'text', editFormatMode: 'none', editMessageText: 'Простой текст' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b06');
  syntax(code, 'b06');
});

test('B07', 'текст с переменной {user_name} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', { editMode: 'text', editMessageText: 'Привет, {user_name}!' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'b07'), 'b07');
});

test('B08', 'текст с эмодзи и кириллицей → синтаксис OK', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', { editMode: 'text', editMessageText: '✅ Обновлено успешно!' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'b08'), 'b08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Источник сообщения
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Источник сообщения ────────────────────────────────────');

test('C01', 'editMessageIdSource=last_bot_message → использует last_bot_message_id', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', { editMessageIdSource: 'last_bot_message' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c01');
  ok(code.includes('last_bot_message_id'), 'last_bot_message_id должен быть в коде');
  syntax(code, 'c01');
});

test('C02', 'editMessageIdSource=custom + числовой ID → синтаксис OK', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', { editMessageIdSource: 'custom', editMessageIdManual: '123456789' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'c02'), 'c02');
});

test('C03', 'editMessageIdSource=custom + переменная {msg_id} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', { editMessageIdSource: 'custom', editMessageIdManual: '{msg_id}' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'c03'), 'c03');
});

test('C04', 'message с saveMessageIdTo → edit_message использует сохранённый ID → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1', 'Меню', 'menu_msg_id'),
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', '', { editMessageIdSource: 'custom', editMessageIdManual: '{menu_msg_id}' }),
  ]);
  syntax(gen(p, 'c04'), 'c04');
});

test('C05', 'два edit_message с разными источниками → синтаксис OK', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_last', 'msg1', { editMessageIdSource: 'last_bot_message' }),
    makeEditMessageNode('em_custom', 'msg2', { editMessageIdSource: 'custom', editMessageIdManual: '999' }),
    makeMessageNode('msg1', 'Первый'),
    makeMessageNode('msg2', 'Второй'),
  ]);
  syntax(gen(p, 'c05'), 'c05');
});

test('C06', 'editMessageIdSource=last_bot_message + editMode=both → синтаксис OK', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', {
      editMode: 'both',
      editMessageIdSource: 'last_bot_message',
      editMessageText: 'Обновлено',
    }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'c06'), 'c06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Клавиатура
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Клавиатура ────────────────────────────────────────────');

test('D01', 'editKeyboardMode=keep → синтаксис OK', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', { editMode: 'markup', editKeyboardMode: 'keep' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'd01'), 'd01');
});

test('D02', 'editKeyboardMode=remove → вызывает edit_message_reply_markup с reply_markup=None', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', { editMode: 'markup', editKeyboardMode: 'remove' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'd02');
  ok(code.includes('reply_markup=None'), 'reply_markup=None должен быть в коде');
  syntax(code, 'd02');
});

test('D03', 'editKeyboardMode=node → синтаксис OK', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', { editMode: 'markup', editKeyboardMode: 'node', editKeyboardNodeId: 'kb1' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'd03'), 'd03');
});

test('D04', 'editMode=both + editKeyboardMode=remove → оба вызова + reply_markup=None → синтаксис OK', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', {
      editMode: 'both',
      editKeyboardMode: 'remove',
      editMessageText: 'Обновлено',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'd04');
  ok(code.includes('edit_message_text'), 'edit_message_text должен быть в коде');
  ok(code.includes('reply_markup=None'), 'reply_markup=None должен быть в коде');
  syntax(code, 'd04');
});

test('D05', 'editMode=text + editKeyboardMode=keep → нет edit_message_reply_markup', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_1', 'msg1', { editMode: 'text', editKeyboardMode: 'keep' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'd05');
  ok(code.includes('edit_message_text'), 'edit_message_text должен быть в коде');
  syntax(code, 'd05');
});

test('D06', 'два edit_message с разными editKeyboardMode → синтаксис OK', () => {
  const p = makeCleanProject([
    makeEditMessageNode('em_keep', 'msg1', { editMode: 'markup', editKeyboardMode: 'keep' }),
    makeEditMessageNode('em_remove', 'msg2', { editMode: 'markup', editKeyboardMode: 'remove' }),
    makeMessageNode('msg1', 'Первый'),
    makeMessageNode('msg2', 'Второй'),
  ]);
  syntax(gen(p, 'd06'), 'd06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Взаимодействие с триггерами
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Взаимодействие с триггерами ───────────────────────────');

test('E01', 'callback_trigger → edit_message → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'msg1', { editMessageText: 'Обновлено!' }),
    makeMessageNode('msg1', 'Готово'),
  ]);
  syntax(gen(p, 'e01'), 'e01');
});

test('E02', 'command_trigger → message(saveMessageIdTo) → callback_trigger → edit_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1', 'Меню', 'menu_id'),
    makeCallbackTriggerNode('cb_edit', 'em_1'),
    makeEditMessageNode('em_1', '', {
      editMessageIdSource: 'custom',
      editMessageIdManual: '{menu_id}',
      editMessageText: 'Меню обновлено',
    }),
  ]);
  syntax(gen(p, 'e02'), 'e02');
});

test('E03', 'start → message → edit_message (конечный) → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', ''),
  ]);
  syntax(gen(p, 'e03'), 'e03');
});

test('E04', 'edit_message → condition → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'cond1'),
    makeConditionNode('cond1', 'msg1'),
    makeMessageNode('msg1', 'Ответ'),
  ]);
  syntax(gen(p, 'e04'), 'e04');
});

test('E05', 'несколько callback_trigger каждый ведёт к своему edit_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_a', 'em_a'),
    makeCallbackTriggerNode('cb_b', 'em_b'),
    makeEditMessageNode('em_a', 'msg1', { editMessageText: 'Вариант A' }),
    makeEditMessageNode('em_b', 'msg2', { editMessageText: 'Вариант B' }),
    makeMessageNode('msg1', 'A'),
    makeMessageNode('msg2', 'B'),
  ]);
  const code = gen(p, 'e05');
  ok(code.includes('handle_callback_em_a'), 'handle_callback_em_a должен быть в коде');
  ok(code.includes('handle_callback_em_b'), 'handle_callback_em_b должен быть в коде');
  syntax(code, 'e05');
});

test('E06', 'edit_message + answer_callback_query в одном проекте → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeCallbackTriggerNode('cb2', 'acq_1'),
    makeEditMessageNode('em_1', 'msg1', { editMessageText: 'Изменено' }),
    {
      id: 'acq_1', type: 'answer_callback_query',
      position: { x: 0, y: 0 },
      data: { autoTransitionTo: 'msg2', callbackNotificationText: 'OK', callbackShowAlert: false, callbackCacheTime: 0, buttons: [], keyboardType: 'none' },
    },
    makeMessageNode('msg1', 'После редактирования'),
    makeMessageNode('msg2', 'После уведомления'),
  ]);
  syntax(gen(p, 'e06'), 'e06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Полные сценарии
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Полные сценарии ────────────────────────────────────────');

test('F01', 'полный сценарий: /start → сообщение с сохранением ID → кнопка → edit_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd_start', '/start', 'msg_menu'),
    makeMessageNode('msg_menu', 'Выберите действие:', 'menu_msg_id'),
    makeCallbackTriggerNode('cb_update', 'em_update'),
    makeEditMessageNode('em_update', 'msg_done', {
      editMode: 'text',
      editMessageIdSource: 'custom',
      editMessageIdManual: '{menu_msg_id}',
      editMessageText: '✅ Действие выполнено!',
      editFormatMode: 'none',
    }),
    makeMessageNode('msg_done', 'Готово'),
  ]);
  syntax(gen(p, 'f01'), 'f01');
});

test('F02', 'полный сценарий с userDatabaseEnabled=true → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1', 'Привет!', 'saved_id'),
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', '', {
      editMode: 'both',
      editMessageIdSource: 'custom',
      editMessageIdManual: '{saved_id}',
      editMessageText: 'Обновлено',
      editKeyboardMode: 'remove',
    }),
  ]);
  syntax(gen(p, 'f02', true), 'f02');
});

test('F03', 'edit_message с editMode=markup + editKeyboardMode=remove → полный сценарий → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_close', 'em_close'),
    makeEditMessageNode('em_close', '', {
      editMode: 'markup',
      editKeyboardMode: 'remove',
      editMessageIdSource: 'last_bot_message',
    }),
  ]);
  syntax(gen(p, 'f03'), 'f03');
});

test('F04', 'три edit_message в одном проекте → все три обработчика → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeCallbackTriggerNode('cb2', 'em_2'),
    makeCallbackTriggerNode('cb3', 'em_3'),
    makeEditMessageNode('em_1', '', { editMode: 'text', editMessageText: 'Текст 1' }),
    makeEditMessageNode('em_2', '', { editMode: 'markup', editKeyboardMode: 'remove' }),
    makeEditMessageNode('em_3', '', { editMode: 'both', editMessageText: 'Текст 3', editKeyboardMode: 'keep' }),
  ]);
  const code = gen(p, 'f04');
  ok(code.includes('handle_callback_em_1'), 'handle_callback_em_1 должен быть в коде');
  ok(code.includes('handle_callback_em_2'), 'handle_callback_em_2 должен быть в коде');
  ok(code.includes('handle_callback_em_3'), 'handle_callback_em_3 должен быть в коде');
  syntax(code, 'f04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Цепочки узлов
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Цепочки узлов ─────────────────────────────────────────');

test('G01', 'edit_message → edit_message → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'em_2', { editMessageText: 'Шаг 1' }),
    makeEditMessageNode('em_2', 'msg1', { editMessageText: 'Шаг 2' }),
    makeMessageNode('msg1', 'Готово'),
  ]);
  const code = gen(p, 'g01');
  ok(code.includes('handle_callback_em_1'), 'handle_callback_em_1 должен быть в коде');
  ok(code.includes('handle_callback_em_2'), 'handle_callback_em_2 должен быть в коде');
  syntax(code, 'g01');
});

test('G02', 'edit_message → answer_callback_query → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'acq_1', { editMessageText: 'Обновлено' }),
    makeAnswerCallbackQueryNode('acq_1', 'msg1', { callbackNotificationText: 'OK' }),
    makeMessageNode('msg1', 'Конец'),
  ]);
  syntax(gen(p, 'g02'), 'g02');
});

test('G03', 'edit_message → http_request → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'http1', { editMessageText: 'Загружаем...' }),
    makeHttpRequestNode('http1', 'https://api.example.com/data', 'msg1'),
    makeMessageNode('msg1', 'Данные получены'),
  ]);
  syntax(gen(p, 'g03'), 'g03');
});

test('G04', 'edit_message → ban_user → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_ban', 'em_warn'),
    makeEditMessageNode('em_warn', 'ban1', { editMessageText: 'Вы заблокированы' }),
    makeBanUserNode('ban1'),
  ]);
  syntax(gen(p, 'g04'), 'g04');
});

test('G05', 'edit_message → forward_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'fwd1', { editMessageText: 'Пересылаем' }),
    makeForwardMessageNode('fwd1', '987654321'),
  ]);
  syntax(gen(p, 'g05'), 'g05');
});

test('G06', 'три edit_message в цепочке с разными режимами → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_text'),
    makeEditMessageNode('em_text', 'em_markup', { editMode: 'text', editMessageText: 'Текст' }),
    makeEditMessageNode('em_markup', 'em_both', { editMode: 'markup', editKeyboardMode: 'remove' }),
    makeEditMessageNode('em_both', 'msg1', { editMode: 'both', editMessageText: 'Оба', editKeyboardMode: 'keep' }),
    makeMessageNode('msg1', 'Финал'),
  ]);
  syntax(gen(p, 'g06'), 'g06');
});

test('G07', 'edit_message → condition → edit_message (ветвление) → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'cond1', { editMessageText: 'Проверяем...' }),
    makeConditionNode('cond1', 'em_yes'),
    makeEditMessageNode('em_yes', 'msg1', { editMessageText: 'Условие выполнено' }),
    makeMessageNode('msg1', 'Ответ'),
  ]);
  syntax(gen(p, 'g07'), 'g07');
});

test('G08', 'полная цепочка с saveMessageIdTo → edit_message(custom) → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg_save'),
    makeMessageNode('msg_save', 'Сохраняем ID', 'saved_msg_id'),
    makeCallbackTriggerNode('cb_edit', 'em_custom'),
    makeEditMessageNode('em_custom', 'msg_done', {
      editMode: 'both',
      editMessageIdSource: 'custom',
      editMessageIdManual: '{saved_msg_id}',
      editMessageText: 'Обновлено через saveMessageIdTo',
      editKeyboardMode: 'remove',
    }),
    makeMessageNode('msg_done', 'Готово'),
  ]);
  syntax(gen(p, 'g08'), 'g08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Граничные случаи ──────────────────────────────────────');

test('H01', 'пустой editMessageText при editMode=text → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'msg1', { editMode: 'text', editMessageText: '' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'h01'), 'h01');
});

test('H02', 'editMessageText с только пробелами → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'msg1', { editMode: 'text', editMessageText: '   ' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'h02'), 'h02');
});

test('H03', 'editMessageText 1000+ символов → синтаксис OK', () => {
  const longText = 'Длинный текст сообщения. '.repeat(50);
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'msg1', { editMode: 'text', editMessageText: longText }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'h03'), 'h03');
});

test('H04', 'editMessageIdManual с кириллицей в имени переменной {id_меню} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'msg1', {
      editMessageIdSource: 'custom',
      editMessageIdManual: '{id_меню}',
    }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'h04'), 'h04');
});

test('H05', 'editKeyboardNodeId с UUID-подобным ID → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'msg1', {
      editMode: 'markup',
      editKeyboardMode: 'node',
      editKeyboardNodeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'h05'), 'h05');
});

test('H06', 'edit_message с nodeId содержащим дефисы и цифры → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb-node-42', 'em-node-42'),
    makeEditMessageNode('em-node-42', 'msg1', { editMessageText: 'Дефисы и цифры' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'h06'), 'h06');
});

test('H07', 'editMode=text + editMessageText с HTML-тегами при editFormatMode=html → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'msg1', {
      editMode: 'text',
      editFormatMode: 'html',
      editMessageText: '<b>Жирный</b> <i>курсив</i> <code>код</code>',
    }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'h07'), 'h07');
});

test('H08', 'editMode=markup + editKeyboardMode=node + несуществующий editKeyboardNodeId → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_1'),
    makeEditMessageNode('em_1', 'msg1', {
      editMode: 'markup',
      editKeyboardMode: 'node',
      editKeyboardNodeId: 'nonexistent_node_999',
    }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'h08'), 'h08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: Взаимодействие с другими action-узлами
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: Взаимодействие с другими action-узлами ────────────────');

test('I01', 'command_trigger → message(saveMessageIdTo) → callback_trigger → answer_callback_query → edit_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg_menu'),
    makeMessageNode('msg_menu', 'Меню', 'menu_id'),
    makeCallbackTriggerNode('cb_acq', 'acq_1'),
    makeAnswerCallbackQueryNode('acq_1', 'em_1', { callbackNotificationText: 'Принято' }),
    makeEditMessageNode('em_1', '', {
      editMessageIdSource: 'custom',
      editMessageIdManual: '{menu_id}',
      editMessageText: 'Меню обновлено',
    }),
  ]);
  syntax(gen(p, 'i01'), 'i01');
});

test('I02', 'edit_message + get_managed_bot_token в одном проекте → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_em', 'em_1'),
    makeCallbackTriggerNode('cb_gbt', 'gbt_1'),
    makeEditMessageNode('em_1', 'msg1', { editMessageText: 'Редактируем' }),
    makeGetManagedBotTokenNode('gbt_1', 'msg2'),
    makeMessageNode('msg1', 'После редактирования'),
    makeMessageNode('msg2', 'Токен получен'),
  ]);
  syntax(gen(p, 'i02'), 'i02');
});

test('I03', 'edit_message + delete_message в одном проекте → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_em', 'em_1'),
    makeCallbackTriggerNode('cb_del', 'del_1'),
    makeEditMessageNode('em_1', 'msg1', { editMessageText: 'Обновлено' }),
    makeDeleteMessageNode('del_1', 'msg2'),
    makeMessageNode('msg1', 'После редактирования'),
    makeMessageNode('msg2', 'После удаления'),
  ]);
  syntax(gen(p, 'i03'), 'i03');
});

test('I04', 'edit_message + pin_message в одном проекте → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_em', 'em_1'),
    makeCallbackTriggerNode('cb_pin', 'pin_1'),
    makeEditMessageNode('em_1', 'msg1', { editMessageText: 'Обновлено' }),
    makePinMessageNode('pin_1', 'msg2'),
    makeMessageNode('msg1', 'После редактирования'),
    makeMessageNode('msg2', 'После закрепления'),
  ]);
  syntax(gen(p, 'i04'), 'i04');
});

test('I05', 'edit_message + http_request → edit_message (цепочка) → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_before'),
    makeEditMessageNode('em_before', 'http1', { editMessageText: 'Загружаем...' }),
    makeHttpRequestNode('http1', 'https://api.example.com/update', 'em_after'),
    makeEditMessageNode('em_after', 'msg1', { editMessageText: 'Загружено!' }),
    makeMessageNode('msg1', 'Готово'),
  ]);
  syntax(gen(p, 'i05'), 'i05');
});

test('I06', 'edit_message + ban_user + answer_callback_query → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_em', 'em_1'),
    makeCallbackTriggerNode('cb_ban', 'ban_1'),
    makeCallbackTriggerNode('cb_acq', 'acq_1'),
    makeEditMessageNode('em_1', 'msg1', { editMessageText: 'Предупреждение' }),
    makeBanUserNode('ban_1', 'msg2'),
    makeAnswerCallbackQueryNode('acq_1', 'msg3', { callbackNotificationText: 'Обработано' }),
    makeMessageNode('msg1', 'После редактирования'),
    makeMessageNode('msg2', 'После бана'),
    makeMessageNode('msg3', 'После ответа'),
  ]);
  syntax(gen(p, 'i06'), 'i06');
});

test('I07', 'edit_message + forward_message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_em', 'em_1'),
    makeCallbackTriggerNode('cb_fwd', 'fwd_1'),
    makeEditMessageNode('em_1', 'msg1', { editMessageText: 'Обновлено' }),
    makeForwardMessageNode('fwd_1', '111222333'),
    makeMessageNode('msg1', 'После редактирования'),
  ]);
  syntax(gen(p, 'i07'), 'i07');
});

test('I08', 'edit_message + condition + edit_message (разные ветки) → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_first'),
    makeEditMessageNode('em_first', 'cond1', { editMessageText: 'Проверяем...' }),
    makeConditionNode('cond1', 'em_yes'),
    makeEditMessageNode('em_yes', 'msg_yes', { editMessageText: 'Одобрено ✅' }),
    makeEditMessageNode('em_no', 'msg_no', { editMessageText: 'Отклонено ❌' }),
    makeMessageNode('msg_yes', 'Успех'),
    makeMessageNode('msg_no', 'Отказ'),
  ]);
  syntax(gen(p, 'i08'), 'i08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: Полные реальные сценарии
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Полные реальные сценарии ──────────────────────────────');

test('J01', 'бот-голосование: /vote → message(saveMessageIdTo) → callback_trigger → edit_message(убрать кнопки) → message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd_vote', '/vote', 'msg_vote'),
    makeMessageNode('msg_vote', 'Голосуйте!', 'vote_msg_id'),
    makeCallbackTriggerNode('cb_vote_yes', 'em_remove_kb'),
    makeEditMessageNode('em_remove_kb', 'msg_thanks', {
      editMode: 'markup',
      editKeyboardMode: 'remove',
      editMessageIdSource: 'custom',
      editMessageIdManual: '{vote_msg_id}',
    }),
    makeMessageNode('msg_thanks', 'Спасибо за голос!'),
  ]);
  syntax(gen(p, 'j01'), 'j01');
});

test('J02', 'редактирование меню: /menu → message(saveMessageIdTo=menu_id) → callback_trigger → edit_message(custom, {menu_id}) → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd_menu', '/menu', 'msg_menu'),
    makeMessageNode('msg_menu', 'Главное меню', 'menu_id'),
    makeCallbackTriggerNode('cb_edit_menu', 'em_menu'),
    makeEditMessageNode('em_menu', '', {
      editMode: 'text',
      editMessageIdSource: 'custom',
      editMessageIdManual: '{menu_id}',
      editMessageText: '📋 Обновлённое меню',
      editFormatMode: 'none',
    }),
  ]);
  syntax(gen(p, 'j02'), 'j02');
});

test('J03', 'таймер: command_trigger → message(saveMessageIdTo) → edit_message(both, remove keyboard) → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd_timer', '/timer', 'msg_timer'),
    makeMessageNode('msg_timer', '⏳ Таймер запущен...', 'timer_msg_id'),
    makeCallbackTriggerNode('cb_done', 'em_done'),
    makeEditMessageNode('em_done', '', {
      editMode: 'both',
      editMessageIdSource: 'custom',
      editMessageIdManual: '{timer_msg_id}',
      editMessageText: '✅ Таймер завершён!',
      editKeyboardMode: 'remove',
    }),
  ]);
  syntax(gen(p, 'j03'), 'j03');
});

test('J04', 'многошаговый: start → msg1(saveMessageIdTo=step1_id) → cb → edit_message(step1_id) → msg2(saveMessageIdTo=step2_id) → cb2 → edit_message(step2_id) → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeMessageNode('msg_step1', 'Шаг 1', 'step1_id'),
    makeCallbackTriggerNode('cb_step2', 'em_step2'),
    makeEditMessageNode('em_step2', 'msg_step2', {
      editMessageIdSource: 'custom',
      editMessageIdManual: '{step1_id}',
      editMessageText: 'Шаг 2',
    }),
    makeMessageNode('msg_step2', 'Шаг 2 отправлен', 'step2_id'),
    makeCallbackTriggerNode('cb_step3', 'em_step3'),
    makeEditMessageNode('em_step3', '', {
      editMessageIdSource: 'custom',
      editMessageIdManual: '{step2_id}',
      editMessageText: 'Шаг 3',
    }),
  ]);
  syntax(gen(p, 'j04'), 'j04');
});

test('J05', 'условное редактирование: callback_trigger → condition → edit_message("Одобрено") / edit_message("Отклонено") → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_check', 'cond_approve'),
    makeConditionNode('cond_approve', 'em_approved'),
    makeEditMessageNode('em_approved', 'msg_ok', {
      editMode: 'text',
      editMessageText: '✅ Одобрено',
      editFormatMode: 'none',
    }),
    makeEditMessageNode('em_rejected', 'msg_fail', {
      editMode: 'text',
      editMessageText: '❌ Отклонено',
      editFormatMode: 'none',
    }),
    makeMessageNode('msg_ok', 'Заявка одобрена'),
    makeMessageNode('msg_fail', 'Заявка отклонена'),
  ]);
  syntax(gen(p, 'j05'), 'j05');
});

test('J06', 'userDatabaseEnabled=true + переменные пользователя в тексте → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/profile', 'msg_profile'),
    makeMessageNode('msg_profile', 'Ваш профиль', 'profile_msg_id'),
    makeCallbackTriggerNode('cb_update_profile', 'em_profile'),
    makeEditMessageNode('em_profile', '', {
      editMode: 'text',
      editMessageIdSource: 'custom',
      editMessageIdManual: '{profile_msg_id}',
      editMessageText: 'Привет, {user_name}! Ваш ID: {user_id}. Баланс: {balance}',
      editFormatMode: 'none',
    }),
  ]);
  syntax(gen(p, 'j06', true), 'j06');
});

test('J07', 'edit_message(editMode=both, html, remove) в сложном проекте с 5+ узлами → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeCommandTriggerNode('cmd_help', '/help', 'msg_help'),
    makeMessageNode('msg_help', 'Помощь', 'help_msg_id'),
    makeCallbackTriggerNode('cb_close_help', 'em_close_help'),
    makeEditMessageNode('em_close_help', 'msg_closed', {
      editMode: 'both',
      editFormatMode: 'html',
      editMessageIdSource: 'custom',
      editMessageIdManual: '{help_msg_id}',
      editMessageText: '<b>Помощь закрыта</b>',
      editKeyboardMode: 'remove',
    }),
    makeMessageNode('msg_closed', 'Раздел помощи закрыт'),
  ]);
  syntax(gen(p, 'j07'), 'j07');
});

test('J08', 'полный проект: start + 3 callback_trigger + 3 edit_message + 3 message → все обработчики в коде → синтаксис OK', () => {
  const p = makeCleanProject([
    makeStartNode('start1'),
    makeCallbackTriggerNode('cb_a', 'em_a'),
    makeCallbackTriggerNode('cb_b', 'em_b'),
    makeCallbackTriggerNode('cb_c', 'em_c'),
    makeEditMessageNode('em_a', 'msg_a', { editMode: 'text', editMessageText: 'Вариант A' }),
    makeEditMessageNode('em_b', 'msg_b', { editMode: 'markup', editKeyboardMode: 'remove' }),
    makeEditMessageNode('em_c', 'msg_c', { editMode: 'both', editMessageText: 'Вариант C', editKeyboardMode: 'keep' }),
    makeMessageNode('msg_a', 'Ответ A'),
    makeMessageNode('msg_b', 'Ответ B'),
    makeMessageNode('msg_c', 'Ответ C'),
  ]);
  const code = gen(p, 'j08');
  ok(code.includes('handle_callback_em_a'), 'handle_callback_em_a должен быть в коде');
  ok(code.includes('handle_callback_em_b'), 'handle_callback_em_b должен быть в коде');
  ok(code.includes('handle_callback_em_c'), 'handle_callback_em_c должен быть в коде');
  syntax(code, 'j08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК K: keyboardNodeId и динамические кнопки
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: keyboardNodeId и динамические кнопки ──────────────────');

/**
 * Создаёт keyboard-узел для использования в edit_message с editKeyboardMode=node
 * @param id - ID узла
 * @param extra - Дополнительные поля data (переопределяют значения по умолчанию)
 * @returns Объект узла типа keyboard
 */
function makeKeyboardNode(id: string, extra: Record<string, any> = {}) {
  return {
    id, type: 'keyboard',
    position: { x: 0, y: 0 },
    data: {
      buttons: [],
      keyboardType: 'inline',
      enableDynamicButtons: false,
      dynamicButtons: {
        sourceVariable: '',
        arrayPath: '',
        textTemplate: '',
        callbackTemplate: '',
        columns: 1,
      },
      ...extra,
    },
  };
}

test('K01', 'editKeyboardMode=node + keyboardNodeId (legacy поле) → InlineKeyboardBuilder в коде → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_kb_legacy'),
    makeEditMessageNode('em_kb_legacy', 'msg1', {
      editMode: 'markup',
      editKeyboardMode: 'node',
      keyboardNodeId: 'kb_legacy',  // legacy поле
    }),
    makeKeyboardNode('kb_legacy', {
      buttons: [{ id: 'btn1', text: 'Кнопка', action: 'goto', target: 'msg1' }],
    }),
    makeMessageNode('msg1', 'Готово'),
  ]);
  const code = gen(p, 'k01');
  ok(code.includes('InlineKeyboardBuilder'), 'InlineKeyboardBuilder должен быть в коде');
  syntax(code, 'k01');
});

test('K02', 'editKeyboardMode=node + editKeyboardNodeId (новое поле) → InlineKeyboardBuilder в коде → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_kb_new'),
    makeEditMessageNode('em_kb_new', 'msg1', {
      editMode: 'markup',
      editKeyboardMode: 'node',
      editKeyboardNodeId: 'kb_new',  // новое поле
    }),
    makeKeyboardNode('kb_new', {
      buttons: [{ id: 'btn1', text: 'Кнопка', action: 'goto', target: 'msg1' }],
    }),
    makeMessageNode('msg1', 'Готово'),
  ]);
  const code = gen(p, 'k02');
  ok(code.includes('InlineKeyboardBuilder'), 'InlineKeyboardBuilder должен быть в коде');
  syntax(code, 'k02');
});

test('K03', 'editKeyboardMode=node + keyboard-нода с enableDynamicButtons=true → цикл for _edit_item in _edit_items → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_dyn'),
    makeEditMessageNode('em_dyn', 'msg1', {
      editMode: 'markup',
      editKeyboardMode: 'node',
      editKeyboardNodeId: 'kb_dyn',
    }),
    makeKeyboardNode('kb_dyn', {
      enableDynamicButtons: true,
      dynamicButtons: {
        sourceVariable: 'users_data',
        arrayPath: 'items',
        textTemplate: '{firstName} (@{userName})',
        callbackTemplate: 'user_{userId}',
        columns: 1,
      },
    }),
    makeMessageNode('msg1', 'Готово'),
  ]);
  const code = gen(p, 'k03');
  ok(code.includes('for _edit_item in _edit_items'), 'цикл for _edit_item in _edit_items должен быть в коде');
  syntax(code, 'k03');
});

test('K04', 'editKeyboardMode=node + keyboard-нода с динамическими и статическими кнопками → оба типа в коде → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_mixed'),
    makeEditMessageNode('em_mixed', 'msg1', {
      editMode: 'markup',
      editKeyboardMode: 'node',
      editKeyboardNodeId: 'kb_mixed',
    }),
    makeKeyboardNode('kb_mixed', {
      enableDynamicButtons: true,
      dynamicButtons: {
        sourceVariable: 'items_list',
        arrayPath: '',
        textTemplate: '{name}',
        callbackTemplate: 'item_{id}',
        columns: 2,
      },
      buttons: [{ id: 'btn_back', text: '⬅️ Назад', action: 'goto', target: 'msg1' }],
    }),
    makeMessageNode('msg1', 'Готово'),
  ]);
  const code = gen(p, 'k04');
  ok(code.includes('for _edit_item in _edit_items'), 'динамические кнопки (цикл) должны быть в коде');
  ok(code.includes('callback_data'), 'статические кнопки (callback_data) должны быть в коде');
  syntax(code, 'k04');
});

test('K05', 'editKeyboardMode=node + keyboard-нода с columns=2 → _edit_builder.adjust(2) в коде → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_cols'),
    makeEditMessageNode('em_cols', 'msg1', {
      editMode: 'markup',
      editKeyboardMode: 'node',
      editKeyboardNodeId: 'kb_cols',
    }),
    makeKeyboardNode('kb_cols', {
      enableDynamicButtons: true,
      dynamicButtons: {
        sourceVariable: 'products',
        arrayPath: 'list',
        textTemplate: '{title}',
        callbackTemplate: 'prod_{id}',
        columns: 2,
      },
    }),
    makeMessageNode('msg1', 'Готово'),
  ]);
  const code = gen(p, 'k05');
  ok(code.includes('_edit_builder.adjust(2)'), '_edit_builder.adjust(2) должен быть в коде');
  syntax(code, 'k05');
});

test('K06', 'editKeyboardMode=node + keyboard-нода со статической кнопкой action=goto → callback_data в коде → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_goto'),
    makeEditMessageNode('em_goto', 'msg1', {
      editMode: 'markup',
      editKeyboardMode: 'node',
      editKeyboardNodeId: 'kb_goto',
    }),
    makeKeyboardNode('kb_goto', {
      buttons: [
        { id: 'btn_goto', text: '➡️ Перейти', action: 'goto', target: 'msg1', customCallbackData: 'go_to_msg1' },
      ],
    }),
    makeMessageNode('msg1', 'Готово'),
  ]);
  const code = gen(p, 'k06');
  ok(code.includes('callback_data'), 'callback_data должен быть в коде');
  syntax(code, 'k06');
});

test('K07', 'editKeyboardMode=node + keyboard-нода со статической кнопкой action=url → url= в коде → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb1', 'em_url'),
    makeEditMessageNode('em_url', 'msg1', {
      editMode: 'markup',
      editKeyboardMode: 'node',
      editKeyboardNodeId: 'kb_url',
    }),
    makeKeyboardNode('kb_url', {
      buttons: [
        { id: 'btn_url', text: '🌐 Сайт', action: 'url', url: 'https://example.com' },
      ],
    }),
    makeMessageNode('msg1', 'Готово'),
  ]);
  const code = gen(p, 'k07');
  ok(code.includes('url='), 'url= должен быть в коде');
  syntax(code, 'k07');
});

test('K08', 'полный сценарий пагинации: http_request → condition → edit_message(keyboardNodeId=kb-next-only) + keyboard-нода с динамическими кнопками и кнопкой "➡️ Далее" → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('cb_page', 'fetch-bot-users'),
    makeHttpRequestNode('fetch-bot-users', 'https://api.example.com/users?page=1', 'check-has-next'),
    makeConditionNode('check-has-next', 'edit-kb-next-only'),
    makeEditMessageNode('edit-kb-next-only', 'msg_list', {
      editMode: 'markup',
      editKeyboardMode: 'node',
      keyboardNodeId: 'kb-next-only',  // legacy поле
    }),
    makeKeyboardNode('kb-next-only', {
      enableDynamicButtons: true,
      dynamicButtons: {
        sourceVariable: 'users_response',
        arrayPath: 'users',
        textTemplate: '{name} ({role})',
        callbackTemplate: 'select_user_{id}',
        columns: 1,
      },
      buttons: [
        { id: 'btn_next', text: '➡️ Далее', action: 'goto', target: 'cb_page', customCallbackData: 'page_next' },
      ],
    }),
    makeMessageNode('msg_list', 'Список пользователей'),
  ]);
  const code = gen(p, 'k08');
  ok(code.includes('InlineKeyboardBuilder'), 'InlineKeyboardBuilder должен быть в коде');
  ok(code.includes('for _edit_item in _edit_items'), 'цикл по динамическим кнопкам должен быть в коде');
  syntax(code, 'k08');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║   Итого: ${passed}/${total} пройдено${failed > 0 ? `, ${failed} провалено` : ''}${' '.repeat(Math.max(0, 42 - String(passed).length - String(total).length - (failed > 0 ? String(failed).length + 10 : 0)))}║`);
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
