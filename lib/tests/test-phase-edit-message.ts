/**
 * @fileoverview Фазовый тест для узла edit_message
 *
 * Блок A: Базовая генерация (10 тестов)
 * Блок B: Режимы редактирования (8 тестов)
 * Блок C: Источник сообщения (6 тестов)
 * Блок D: Клавиатура (6 тестов)
 * Блок E: Взаимодействие с триггерами (6 тестов)
 * Блок F: Полные сценарии (4 теста)
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
