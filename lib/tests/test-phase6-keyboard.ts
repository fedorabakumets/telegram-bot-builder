/**
 * @fileoverview Фаза 6 — клавиатуры, новая keyboard-нода и совместимость с legacy-моделью
 *
 * Блок A: Legacy-клавиатуры внутри message/start/command
 * Блок B: Отдельная keyboard-нода
 * Блок C: Inline и reply-клавиатуры
 * Блок D: Сохранение ответа, skipDataCollection и waiting_for_input
 * Блок E: hideAfterClick
 * Блок F: Множественный выбор (multi-select)
 * Блок G: Goto / condition / transition
 * Блок H: Backward compatibility и повторное использование keyboard-ноды
 * Блок I: Краевые случаи и синтаксис
 * Блок J: customCallbackData — кастомные callback_data для кнопок и обработчиков
 * Блок O: Переменные в customCallbackData — подстановка {var} в callback_data
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

function makeProject(nodes: any[]) {
  return {
    sheets: [{
      id: 'sheet1',
      name: 'Test',
      nodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

function gen(project: unknown, label: string, userDatabaseEnabled = false): string {
  return generatePythonCode(project as any, {
    botName: `Phase6Keyboard_${label}`,
    userDatabaseEnabled,
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

function block(code: string, nodeId: string): string {
  const start = code.indexOf(`# @@NODE_START:${nodeId}@@`);
  ok(start !== -1, `Блок ${nodeId} не найден`);
  const endMarker = `# @@NODE_END:${nodeId}@@`;
  const end = code.indexOf(endMarker, start);
  ok(end !== -1, `Конец блока ${nodeId} не найден`);
  return code.slice(start, end + endMarker.length);
}

function assertIncludesAll(text: string, parts: string[], context: string) {
  for (const part of parts) {
    ok(text.includes(part), `${context}: не найдено "${part}"`);
  }
}

function assertExcludes(text: string, parts: string[], context: string) {
  for (const part of parts) {
    ok(!text.includes(part), `${context}: неожиданно найдено "${part}"`);
  }
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'x';
}

function makeButton(
  text: string,
  action: string = 'goto',
  target: string = 'msg_next',
  extra: Record<string, any> = {},
) {
  return {
    id: extra.id ?? `btn_${safeId(text)}_${safeId(action)}_${safeId(target)}`,
    text,
    action,
    target,
    buttonType: extra.buttonType ?? 'normal',
    skipDataCollection: extra.skipDataCollection ?? false,
    hideAfterClick: extra.hideAfterClick ?? false,
    url: extra.url,
    requestContact: extra.requestContact,
    requestLocation: extra.requestLocation,
    suggestedBotName: extra.suggestedBotName,
    suggestedBotUsername: extra.suggestedBotUsername,
    customCallbackData: extra.customCallbackData,
  };
}

function makeMessageNode(id: string, messageText = 'Сообщение', data: Record<string, any> = {}) {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText,
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      ...data,
    },
  };
}

function makeStartNode(id = 'start1', data: Record<string, any> = {}) {
  return {
    id,
    type: 'start',
    position: { x: 0, y: 0 },
    data: {
      command: '/start',
      messageText: 'Старт',
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      ...data,
    },
  };
}

function makeCommandNode(id: string, command: string, data: Record<string, any> = {}) {
  return {
    id,
    type: 'command',
    position: { x: 0, y: 0 },
    data: {
      command,
      messageText: 'Команда',
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      ...data,
    },
  };
}

function makeKeyboardNode(
  id: string,
  keyboardType: 'inline' | 'reply' = 'inline',
  buttons: any[] = [],
  data: Record<string, any> = {},
) {
  return {
    id,
    type: 'keyboard',
    position: { x: 300, y: 0 },
    data: {
      keyboardType,
      buttons,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      ...data,
    },
  };
}

function makeInputNode(id: string, data: Record<string, any> = {}) {
  return {
    id,
    type: 'input',
    position: { x: 300, y: 0 },
    data: {
      inputType: 'text',
      inputVariable: 'user_input',
      inputTargetNodeId: '',
      appendVariable: false,
      saveToDatabase: true,
      ...data,
    },
  };
}

function makeConditionNode(id: string, variable: string, branches: any[], data: Record<string, any> = {}) {
  return {
    id,
    type: 'condition',
    position: { x: 0, y: 0 },
    data: {
      variable,
      branches,
      ...data,
    },
  };
}

function makeBranch(operator: string, target = '', value = '') {
  return {
    id: `br_${safeId(operator)}_${Math.random().toString(36).slice(2, 7)}`,
    label: operator,
    operator,
    value,
    target,
  };
}

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 6 — клавиатуры, keyboard-нода и совместимость моделей       ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

console.log('══ Блок A: Legacy-клавиатуры внутри message/start/command ═══════════');

test('A01', 'message с legacy inline-клавиатурой генерирует InlineKeyboardBuilder', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Привет', {
      keyboardType: 'inline',
      buttons: [
        makeButton('Открыть', 'goto', 'msg_2'),
        makeButton('Сайт', 'url', 'https://example.com', { url: 'https://example.com' }),
      ],
    }),
    makeMessageNode('msg_2', 'Ответ'),
  ]);

  const code = gen(project, 'a01');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, [
    'InlineKeyboardBuilder()',
    'InlineKeyboardButton',
    'callback_data="msg_2"',
    'url="https://example.com"',
  ], 'A01');
  syntax(code, 'a01');
});

test('A02', 'start с legacy reply-клавиатурой генерирует ReplyKeyboardBuilder', () => {
  const project = makeProject([
    makeStartNode('start_1', {
      keyboardType: 'reply',
      oneTimeKeyboard: true,
      resizeKeyboard: false,
      buttons: [
        makeButton('Да', 'goto', 'msg_2', { id: 'btn_yes' }),
        makeButton('Нет', 'goto', 'msg_3', { id: 'btn_no' }),
      ],
    }),
    makeMessageNode('msg_2', 'Да'),
    makeMessageNode('msg_3', 'Нет'),
  ]);

  const code = gen(project, 'a02');
  const b = block(code, 'start_1');
  assertIncludesAll(b, [
    'ReplyKeyboardBuilder()',
    'KeyboardButton',
    'resize_keyboard=False',
    'one_time_keyboard=True',
  ], 'A02');
  syntax(code, 'a02');
});

test('A03', 'command с legacy inline-клавиатурой сохраняет callback-логику', () => {
  const project = makeProject([
    makeCommandNode('cmd_help', '/help', {
      keyboardType: 'inline',
      buttons: [
        makeButton('Далее', 'goto', 'msg_2'),
      ],
    }),
    makeMessageNode('msg_2', 'Следующий шаг'),
  ]);

  const code = gen(project, 'a03');
  const b = block(code, 'cmd_help');
  assertIncludesAll(b, [
    '@dp.message(Command("help"))',
    'InlineKeyboardBuilder()',
    'callback_data="msg_2"',
  ], 'A03');
  syntax(code, 'a03');
});

test('A04', 'legacy message поддерживает keyboardLayout и порядок кнопок', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Выберите', {
      keyboardType: 'inline',
      keyboardLayout: {
        autoLayout: false,
        rows: [{ buttonIds: ['btn_2', 'btn_1'] }],
      },
      buttons: [
        makeButton('Первая', 'goto', 'msg_2', { id: 'btn_1' }),
        makeButton('Вторая', 'goto', 'msg_3', { id: 'btn_2' }),
      ],
    }),
    makeMessageNode('msg_2', 'Первая'),
    makeMessageNode('msg_3', 'Вторая'),
  ]);

  const code = gen(project, 'a04');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, [
    'builder.adjust(2)',
    'callback_data="msg_2"',
    'callback_data="msg_3"',
  ], 'A04');
  syntax(code, 'a04');
});

test('A05', 'legacy reply-клавиатура с collectUserInput начинает waiting_for_input', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Введите ответ', {
      keyboardType: 'reply',
      collectUserInput: true,
      inputVariable: 'user_answer',
      inputTargetNodeId: 'msg_2',
      enableTextInput: true,
      buttons: [
        makeButton('Пропустить', 'goto', 'msg_2', { id: 'btn_skip', skipDataCollection: true }),
      ],
    }),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'a05');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, [
    'waiting_for_input',
    '"variable": "user_answer"',
    '"next_node_id": "msg_2"',
    'skip_buttons',
  ], 'A05');
  syntax(code, 'a05');
});

test('A06', 'legacy keyboard-код компилируется в Python', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Привет', {
      keyboardType: 'inline',
      buttons: [makeButton('Далее', 'goto', 'msg_2')],
    }),
    makeMessageNode('msg_2', 'Ок'),
  ]);

  syntax(gen(project, 'a06'), 'a06');
});

console.log('══ Блок B: Отдельная keyboard-нода ═══════════════════════════════════');

test('B01', 'message -> keyboard прикрепляет отдельную keyboard-ноду к сообщению', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Привет', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('Кнопка', 'goto', 'msg_2'),
    ]),
    makeMessageNode('msg_2', 'Ответ'),
  ]);

  const code = gen(project, 'b01');
  const msg = block(code, 'msg_1');
  const kbd = block(code, 'kbd_1');
  assertIncludesAll(msg, [
    'InlineKeyboardBuilder()',
    'callback_data="msg_2"',
    'reply_markup=keyboard',
  ], 'B01 message');
  assertIncludesAll(kbd, [
    'без самостоятельной отправки сообщения',
    'Keyboard node kbd_1 вызвана',
    'return',
  ], 'B01 keyboard');
  syntax(code, 'b01');
});

test('B02', 'message -> condition -> keyboard прикрепляет клавиатуру к message, а condition вызывает keyboard', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Старт', { keyboardNodeId: 'kbd_1' }),
    makeConditionNode('cond_1', 'user_age', [
      makeBranch('filled', 'kbd_1'),
    ]),
    makeKeyboardNode('kbd_1', 'reply', [
      makeButton('Да', 'goto', 'msg_2'),
    ]),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  const code = gen(project, 'b02');
  const msg = block(code, 'msg_1');
  assertIncludesAll(msg, [
    'ReplyKeyboardBuilder()',
    'KeyboardButton',
    'reply_markup=keyboard',
  ], 'B02 message');
  assertIncludesAll(code, [
    'async def handle_callback_cond_1',
    'await handle_callback_kbd_1(callback_query)',
  ], 'B02 condition');
  syntax(code, 'b02');
});

test('B03', 'одна keyboard-нода может использоваться несколькими сообщениями', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Первое', { keyboardNodeId: 'kbd_1' }),
    makeMessageNode('msg_2', 'Второе', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('Общая', 'goto', 'msg_3'),
    ]),
    makeMessageNode('msg_3', 'Третье'),
  ]);

  const code = gen(project, 'b03');
  const msg1 = block(code, 'msg_1');
  const msg2 = block(code, 'msg_2');
  const kbd = block(code, 'kbd_1');
  assertIncludesAll(msg1, ['callback_data="msg_3"', 'InlineKeyboardBuilder()'], 'B03 msg1');
  assertIncludesAll(msg2, ['callback_data="msg_3"', 'InlineKeyboardBuilder()'], 'B03 msg2');
  assertIncludesAll(kbd, ['без самостоятельной отправки сообщения'], 'B03 keyboard');
  syntax(code, 'b03');
});

test('B04', 'keyboard-нода без host message безопасно остаётся no-op', () => {
  const project = makeProject([
    makeKeyboardNode('kbd_orphan', 'inline', [makeButton('Сирота', 'goto', 'msg_1')]),
    makeMessageNode('msg_1', 'Ответ'),
  ]);

  const code = gen(project, 'b04');
  const kbd = block(code, 'kbd_orphan');
  assertIncludesAll(kbd, [
    'без самостоятельной отправки сообщения',
    'return',
  ], 'B04');
  syntax(code, 'b04');
});

test('B05', 'keyboard-нода с соединением через condition не ломает генерацию', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Старт', { keyboardNodeId: 'kbd_1' }),
    makeConditionNode('cond_1', 'flag', [makeBranch('filled', 'kbd_1'), makeBranch('else', 'msg_2')]),
    makeKeyboardNode('kbd_1', 'inline', [makeButton('Дальше', 'goto', 'msg_3')]),
    makeMessageNode('msg_2', 'Иначе'),
    makeMessageNode('msg_3', 'Финал'),
  ]);

  const code = gen(project, 'b05');
  assertIncludesAll(code, ['async def handle_callback_cond_1', 'await handle_callback_kbd_1(callback_query)'], 'B05');
  syntax(code, 'b05');
});

test('B06', 'отдельная keyboard-нода компилируется вместе с проектом', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Привет', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'reply', [makeButton('Да', 'goto', 'msg_2')]),
    makeMessageNode('msg_2', 'Ок'),
  ]);

  syntax(gen(project, 'b06'), 'b06');
});

test('B07', 'keyboard-нода сохраняет ручные ряды после __dynamic__ и без пустого adjust', () => {
  const project = makeProject([
    makeMessageNode('msg_b07', 'Проект', { keyboardNodeId: 'kbd_b07' }),
    makeKeyboardNode('kbd_b07', 'inline', [
      makeButton('➕ Добавить токен', 'goto', 'msg_add', { id: 'btn_add' }),
      makeButton('✏️ Переименовать', 'goto', 'msg_rename', { id: 'btn_rename' }),
      makeButton('🗑 Удалить', 'goto', 'msg_delete', { id: 'btn_delete' }),
      makeButton('◀️ К списку', 'goto', 'msg_back', { id: 'btn_back' }),
    ], {
      enableDynamicButtons: true,
      dynamicButtons: {
        sourceVariable: 'project_tokens',
        arrayPath: 'items',
        textTemplate: '{botFirstName}',
        callbackTemplate: 'token_{id}',
        columns: 1,
        styleMode: 'none',
      },
      keyboardLayout: {
        autoLayout: false,
        columns: 2,
        rows: [
          { buttonIds: ['__dynamic__'] },
          { buttonIds: ['btn_add'] },
          { buttonIds: ['btn_rename', 'btn_delete'] },
          { buttonIds: ['btn_back'] },
        ],
      },
    }),
    makeMessageNode('msg_add', 'Добавить'),
    makeMessageNode('msg_rename', 'Переименовать'),
    makeMessageNode('msg_delete', 'Удалить'),
    makeMessageNode('msg_back', 'Назад'),
  ]);

  const code = gen(project, 'b07');
  const msg = block(code, 'msg_b07');
  assertIncludesAll(msg, [
    'callback_data="msg_add"',
    'callback_data="msg_rename"',
    'callback_data="msg_delete"',
    'callback_data="msg_back"',
    'builder.row(',
  ], 'B07');
  assertExcludes(msg, ['builder.adjust()'], 'B07: не должен генерировать пустой builder.adjust()');
  syntax(code, 'b07');
});

console.log('══ Блок C: Inline и reply-клавиатуры ═════════════════════════════════');

test('C01', 'inline-клавиатура использует InlineKeyboardButton и callback_data', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Инлайн', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('Перейти', 'goto', 'msg_2'),
      makeButton('Открыть', 'url', 'https://example.com', { url: 'https://example.com' }),
    ]),
    makeMessageNode('msg_2', 'Следующий'),
  ]);

  const code = gen(project, 'c01');
  const msg = block(code, 'msg_1');
  assertIncludesAll(msg, ['InlineKeyboardButton', 'callback_data="msg_2"', 'url="https://example.com"'], 'C01');
  syntax(code, 'c01');
});

test('C02', 'reply-клавиатура использует KeyboardButton и ReplyKeyboardBuilder', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Реплай', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'reply', [
      makeButton('Контакт', 'contact', 'msg_2', { requestContact: true }),
      makeButton('Локация', 'location', 'msg_3', { requestLocation: true }),
    ]),
    makeMessageNode('msg_2', 'Контакт'),
    makeMessageNode('msg_3', 'Локация'),
  ]);

  const code = gen(project, 'c02');
  const msg = block(code, 'msg_1');
  assertIncludesAll(msg, ['ReplyKeyboardBuilder()', 'KeyboardButton', 'request_contact=True', 'request_location=True'], 'C02');
  syntax(code, 'c02');
});

test('C03', 'oneTimeKeyboard и resizeKeyboard доезжают до reply-вывода', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Старт', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'reply', [
      makeButton('Да', 'goto', 'msg_2'),
    ], {
      oneTimeKeyboard: true,
      resizeKeyboard: false,
    }),
    makeMessageNode('msg_2', 'Ок'),
  ]);

  const code = gen(project, 'c03');
  const msg = block(code, 'msg_1');
  assertIncludesAll(msg, ['one_time_keyboard=True', 'resize_keyboard=False'], 'C03');
  syntax(code, 'c03');
});

test('C04', 'action=url, action=contact и action=location сохраняются в коде', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Ссылки', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('Сайт', 'url', 'https://example.org', { url: 'https://example.org' }),
      makeButton('Команда', 'command', '/help'),
      makeButton('Дальше', 'goto', 'msg_2'),
    ]),
    makeMessageNode('msg_2', 'Конец'),
  ]);

  const code = gen(project, 'c04');
  const msg = block(code, 'msg_1');
  assertIncludesAll(msg, ['url="https://example.org"', 'callback_data="cmd_help"', 'callback_data="msg_2"'], 'C04');
  syntax(code, 'c04');
});

test('C05', 'reply-клавиатура с text placeholders использует replace_variables_in_text', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Привет, {{username}}', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'reply', [
      makeButton('Привет, {{username}}', 'goto', 'msg_2'),
    ]),
    makeMessageNode('msg_2', 'Ок'),
  ]);

  const code = gen(project, 'c05');
  const msg = block(code, 'msg_1');
  assertIncludesAll(msg, ['replace_variables_in_text', 'ReplyKeyboardBuilder()'], 'C05');
  syntax(code, 'c05');
});

test('C06', 'инлайн и reply-клавиатуры вместе компилируются без регрессий', () => {
  const project = makeProject([
    makeMessageNode('msg_inline', 'Inline', { keyboardNodeId: 'kbd_inline' }),
    makeKeyboardNode('kbd_inline', 'inline', [makeButton('Кнопка', 'goto', 'msg_next')]),
    makeMessageNode('msg_reply', 'Reply', { keyboardNodeId: 'kbd_reply' }),
    makeKeyboardNode('kbd_reply', 'reply', [makeButton('Да', 'goto', 'msg_next')]),
    makeMessageNode('msg_next', 'Ок'),
  ]);

  syntax(gen(project, 'c06'), 'c06');
});

console.log('══ Блок D: Сохранение ответа, skipDataCollection и waiting_for_input ═');

test('D01', 'reply-клавиатура с collectUserInput создаёт waiting_for_input с переменной', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Введите ответ', {
      keyboardNodeId: 'kbd_1',
      collectUserInput: true,
      inputVariable: 'answer',
      inputTargetNodeId: 'msg_2',
      enableTextInput: true,
      allowMultipleSelection: false,
    }),
    makeKeyboardNode('kbd_1', 'reply', [
      makeButton('Пропустить', 'goto', 'msg_2', { skipDataCollection: true }),
    ]),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'd01');
  assertIncludesAll(code, [
    'waiting_for_input',
    '"variable": "answer"',
    '"next_node_id": "msg_2"',
    'skip_buttons',
    'Пропустить',
  ], 'D01');
  syntax(code, 'd01');
});

test('D02', 'DB-режим сохраняет ответ пользователя в update_user_data_in_db', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Введите ответ', {
      keyboardNodeId: 'kbd_1',
      collectUserInput: true,
      inputVariable: 'answer',
      inputTargetNodeId: 'msg_2',
      enableTextInput: true,
    }),
    makeKeyboardNode('kbd_1', 'reply', [makeButton('Ок', 'goto', 'msg_2')]),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'd02', true);
  assertIncludesAll(code, [
    'update_user_data_in_db(user_id, variable_name, response_data)',
    '"save_to_database": True',
  ], 'D02');
  syntax(code, 'd02');
});

test('D03', 'skipDataCollection кнопка попадает в waiting_for_input skip_buttons', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Выберите вариант', {
      keyboardNodeId: 'kbd_1',
      collectUserInput: true,
      inputVariable: 'choice',
      inputTargetNodeId: 'msg_2',
      enableTextInput: true,
    }),
    makeKeyboardNode('kbd_1', 'reply', [
      makeButton('Пропустить', 'goto', 'msg_2', { skipDataCollection: true }),
      makeButton('Заполнить', 'goto', 'msg_3', { skipDataCollection: false }),
    ]),
    makeMessageNode('msg_2', 'Пропуск'),
    makeMessageNode('msg_3', 'Заполнение'),
  ]);

  const code = gen(project, 'd03');
  assertIncludesAll(code, [
    'skip_buttons',
    'skip_target',
    'msg_2',
    'Пропустить',
  ], 'D03');
  syntax(code, 'd03');
});

test('D04', 'skip flow не теряет переход к целевому узлу', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Ввод', {
      keyboardNodeId: 'kbd_1',
      collectUserInput: true,
      inputVariable: 'value',
      inputTargetNodeId: 'msg_2',
      enableTextInput: true,
    }),
    makeKeyboardNode('kbd_1', 'reply', [
      makeButton('Пропустить', 'goto', 'msg_2', { skipDataCollection: true }),
    ]),
    makeMessageNode('msg_2', 'Сюда'),
  ]);

  const code = gen(project, 'd04');
  assertIncludesAll(code, [
    'call_skip_target_handler',
    'skipDataCollection',
    'waiting_for_input',
  ], 'D04');
  syntax(code, 'd04');
});

test('D05', 'после ввода значение сохраняется локально в user_data[user_id][variable_name]', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Введите ответ', {
      keyboardNodeId: 'kbd_1',
      collectUserInput: true,
      inputVariable: 'answer',
      inputTargetNodeId: 'msg_2',
      enableTextInput: true,
    }),
    makeKeyboardNode('kbd_1', 'reply', [
      makeButton('Да', 'goto', 'msg_2'),
    ]),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'd05');
  assertIncludesAll(code, [
    'user_data[user_id][variable_name] = response_data',
    'logging.info(f"✅ Сохранено в user_data',
  ], 'D05');
  syntax(code, 'd05');
});

test('D06', 'waiting_for_input и skipDataCollection компилируются вместе', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Введите ответ', {
      keyboardNodeId: 'kbd_1',
      collectUserInput: true,
      inputVariable: 'answer',
      inputTargetNodeId: 'msg_2',
      enableTextInput: true,
    }),
    makeKeyboardNode('kbd_1', 'reply', [
      makeButton('Пропустить', 'goto', 'msg_2', { skipDataCollection: true }),
      makeButton('Ок', 'goto', 'msg_2'),
    ]),
    makeMessageNode('msg_2', 'Ок'),
  ]);

  syntax(gen(project, 'd06'), 'd06');
});

test('D07', 'проект без skipDataCollection не генерирует runtime-блок пропуска', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Введите ответ', {
      keyboardNodeId: 'kbd_1',
      collectUserInput: true,
      inputVariable: 'answer',
      inputTargetNodeId: 'msg_2',
      enableTextInput: true,
    }),
    makeKeyboardNode('kbd_1', 'reply', [
      makeButton('Ок', 'goto', 'msg_2'),
    ]),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'd08');
  assertExcludes(code, [
    'call_skip_target_handler',
    'skip_buttons = waiting_config.get("skip_buttons", [])',
    'skip_target = None',
  ], 'D07');
  syntax(code, 'd07');
});

test('D08', 'отдельный input-узел генерирует dedicated handler и waiting_for_input', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Введите имя', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'user_name',
      inputTargetNodeId: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'd07');
  assertIncludesAll(code, [
    'async def handle_callback_input_1',
    '"waiting_for_input"',
    '"variable": "user_name"',
    '"next_node_id": "msg_2"',
  ], 'D08');
  syntax(code, 'd08');
});

test('D09', 'после текстового ответа можно перейти в следующий input-узел', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Введите первое значение', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'first_value',
      inputTargetNodeId: 'input_2',
    }),
    makeInputNode('input_2', {
      inputType: 'contact',
      inputVariable: 'user_contact',
      inputTargetNodeId: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'd09');
  assertIncludesAll(code, [
    'await handle_callback_input_2(fake_callback)',
    'id="text_nav"',
    '"type": "contact"',
    '"contact_variable"',
  ], 'D09');
  syntax(code, 'd09');
});

console.log('══ Блок E: hideAfterClick ═══════════════════════════════════════════');

test('E01', 'inline hideAfterClick скрывает клавиатуру предыдущего сообщения', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardNodeId: 'kbd_1',
    }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('Скрыть', 'goto', 'msg_2', { hideAfterClick: true }),
    ]),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  const code = gen(project, 'e01');
  const b = block(code, 'msg_2');
  assertIncludesAll(b, ['edit_reply_markup(reply_markup=None)', 'hideAfterClick'], 'E01');
  syntax(code, 'e01');
});

test('E02', 'несколько hideAfterClick-кнопок всё равно оставляют общий hide-блок', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardNodeId: 'kbd_1',
    }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('Первый', 'goto', 'msg_2', { hideAfterClick: true }),
      makeButton('Второй', 'goto', 'msg_3', { hideAfterClick: true }),
    ]),
    makeMessageNode('msg_2', 'Первый'),
    makeMessageNode('msg_3', 'Второй'),
  ]);

  const code = gen(project, 'e02');
  const msg2 = block(code, 'msg_2');
  const msg3 = block(code, 'msg_3');
  ok(
    msg2.includes('edit_reply_markup(reply_markup=None)') || msg3.includes('edit_reply_markup(reply_markup=None)'),
    'E02: hideAfterClick-блок должен присутствовать'
  );
  syntax(code, 'e02');
});

test('E03', 'без hideAfterClick не появляется edit_reply_markup', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardNodeId: 'kbd_1',
    }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('Обычная', 'goto', 'msg_2', { hideAfterClick: false }),
    ]),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  const code = gen(project, 'e03');
  const b = block(code, 'msg_1');
  assertExcludes(b, ['edit_reply_markup(reply_markup=None)'], 'E03');
  syntax(code, 'e03');
});

test('E04', 'hideAfterClick не ломает переходы goto', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardNodeId: 'kbd_1',
    }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('Дальше', 'goto', 'msg_2', { hideAfterClick: true }),
    ]),
    makeMessageNode('msg_2', 'Следующий шаг'),
  ]);

  const code = gen(project, 'e04');
  const b = block(code, 'msg_2');
  assertIncludesAll(b, ['edit_reply_markup(reply_markup=None)'], 'E04');
  syntax(code, 'e04');
});

test('E05', 'hideAfterClick компилируется вместе с reply-веткой проекта', () => {
  const project = makeProject([
    makeStartNode('start_1', {
      keyboardType: 'reply',
      buttons: [makeButton('Скрыть', 'goto', 'msg_2', { hideAfterClick: true })],
    }),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  syntax(gen(project, 'e05'), 'e05');
});

console.log('══ Блок F: Множественный выбор (multi-select) ═══════════════════════');

test('F01', 'inline multi-select создаёт состояние multi_select_* и продолжение', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Выберите темы', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('Спорт', 'selection', 'sport', { buttonType: 'option' }),
      makeButton('Музыка', 'selection', 'music', { buttonType: 'option' }),
      makeButton('Готово', 'complete', 'msg_2', { buttonType: 'complete' }),
    ], {
      allowMultipleSelection: true,
      multiSelectVariable: 'interests',
      continueButtonTarget: 'msg_2',
      keyboardLayout: { autoLayout: true, columns: 2 },
    }),
    makeMessageNode('msg_2', 'Спасибо'),
  ]);

  const code = gen(project, 'f01');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, [
    'multi_select_msg_1',
    'multi_select_node',
    'multi_select_type"] = "inline"',
    'multi_select_variable"] = "interests"',
    'saved_selections',
    'done_msg_1',
  ], 'F01');
  syntax(code, 'f01');
});

test('F02', 'selection-кнопки получают ms_<node>_... callback_data', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Выберите', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('A', 'selection', 'a', { id: 'btn_a', buttonType: 'option' }),
      makeButton('B', 'selection', 'b', { id: 'btn_b', buttonType: 'option' }),
      makeButton('Готово', 'complete', 'msg_2', { id: 'btn_done', buttonType: 'complete' }),
    ], {
      allowMultipleSelection: true,
      multiSelectVariable: 'choices',
      continueButtonTarget: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Ок'),
  ]);

  const code = gen(project, 'f02');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, ['callback_data="ms_msg_1_a"', 'callback_data="ms_msg_1_b"', 'callback_data="done_msg_1"'], 'F02');
  syntax(code, 'f02');
});

test('F03', 'continueButtonTarget перенаправляет multi-select в следующий узел', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Выберите', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('A', 'selection', 'a'),
      makeButton('Готово', 'complete', 'msg_2'),
    ], {
      allowMultipleSelection: true,
      multiSelectVariable: 'choices',
      continueButtonTarget: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Следующий'),
  ]);

  const code = gen(project, 'f03');
  assertIncludesAll(code, ['callback_data="done_msg_1"', 'handle_callback_msg_2', 'multi_select_node'], 'F03');
  syntax(code, 'f03');
});

test('F04', 'reply multi-select использует ReplyKeyboardBuilder и multi_select_type = "reply"', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Выберите', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'reply', [
      makeButton('Да', 'selection', 'yes', { buttonType: 'option' }),
      makeButton('Нет', 'selection', 'no', { buttonType: 'option' }),
      makeButton('Готово', 'complete', 'msg_2', { buttonType: 'complete' }),
    ], {
      allowMultipleSelection: true,
      multiSelectVariable: 'reply_choices',
      continueButtonTarget: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'f04');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, ['ReplyKeyboardBuilder()', 'multi_select_type"] = "reply"', 'multi_select_variable"] = "reply_choices"'], 'F04');
  syntax(code, 'f04');
});

test('F05', 'multi-select восстанавливает сохранённые выборы из user_vars', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Выберите', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('Спорт', 'selection', 'sport'),
      makeButton('Музыка', 'selection', 'music'),
      makeButton('Готово', 'complete', 'msg_2'),
    ], {
      allowMultipleSelection: true,
      multiSelectVariable: 'interests',
      continueButtonTarget: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Ок'),
  ]);

  const code = gen(project, 'f05', true);
  const b = block(code, 'msg_1');
  assertIncludesAll(b, ['saved_selections', 'user_vars', '"interests"', 'multi_select_msg_1'], 'F05');
  syntax(code, 'f05');
});

test('F06', 'multi-select и keyboard-нода компилируются без ошибок', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Выберите', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('A', 'selection', 'a'),
      makeButton('B', 'selection', 'b'),
      makeButton('Готово', 'complete', 'msg_2'),
    ], {
      allowMultipleSelection: true,
      multiSelectVariable: 'choices',
      continueButtonTarget: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  syntax(gen(project, 'f06'), 'f06');
});

console.log('══ Блок G: Goto / condition / transition ════════════════════════════');

test('G01', 'inline goto-кнопка ведёт к целевому message', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('Вперёд', 'goto', 'msg_2'),
    ]),
    makeMessageNode('msg_2', 'Следующий'),
  ]);

  const code = gen(project, 'g01');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, ['callback_data="msg_2"', 'reply_markup=keyboard'], 'G01');
  syntax(code, 'g01');
});

test('G02', 'action=command в keyboard создаёт command callback_data', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('Помощь', 'command', '/help'),
    ]),
    makeCommandNode('cmd_help', '/help'),
  ]);

  const code = gen(project, 'g02');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, ['callback_data="cmd_help"', 'InlineKeyboardButton'], 'G02');
  syntax(code, 'g02');
});

test('G03', 'start callback остаётся совместимым с отдельной keyboard-ноды', () => {
  const project = makeProject([
    makeStartNode('start_1', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'reply', [
      makeButton('Открыть', 'goto', 'msg_2'),
    ]),
    makeMessageNode('msg_2', 'Следующий'),
  ]);

  const code = gen(project, 'g03');
  const b = block(code, 'start_1');
  assertIncludesAll(b, ['ReplyKeyboardBuilder()', 'reply_markup=keyboard'], 'G03');
  syntax(code, 'g03');
});

test('G04', 'condition ветка может вести прямо в keyboard-ноду', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Старт', { keyboardNodeId: 'kbd_1' }),
    makeConditionNode('cond_1', 'flag', [
      makeBranch('filled', 'kbd_1'),
      makeBranch('else', 'msg_2'),
    ]),
    makeKeyboardNode('kbd_1', 'inline', [makeButton('Далее', 'goto', 'msg_3')]),
    makeMessageNode('msg_2', 'Иначе'),
    makeMessageNode('msg_3', 'Финал'),
  ]);

  const code = gen(project, 'g04');
  assertIncludesAll(code, ['async def handle_callback_cond_1', 'await handle_callback_kbd_1(callback_query)', 'else'], 'G04');
  syntax(code, 'g04');
});

test('G05', 'goto, condition и keyboard вместе не ломают синтаксис', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Старт', { keyboardNodeId: 'kbd_1' }),
    makeConditionNode('cond_1', 'flag', [makeBranch('filled', 'kbd_1')]),
    makeKeyboardNode('kbd_1', 'inline', [makeButton('Дальше', 'goto', 'msg_2')]),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  syntax(gen(project, 'g05'), 'g05');
});

test('G06', 'condition -> keyboard -> message работает вместе с переходом', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Старт', { keyboardNodeId: 'kbd_1' }),
    makeConditionNode('cond_1', 'flag', [makeBranch('filled', 'kbd_1')]),
    makeKeyboardNode('kbd_1', 'inline', [makeButton('Следующий', 'goto', 'msg_2')]),
    makeMessageNode('msg_2', 'Ок'),
  ]);

  const code = gen(project, 'g06');
  assertIncludesAll(code, ['handle_callback_kbd_1', 'callback_data="msg_2"'], 'G06');
  syntax(code, 'g06');
});

test('G07', 'auto-transition -> condition -> keyboard без keyboardNodeId всё равно прикрепляет клавиатуру к host message', () => {
  const project = makeProject([
    makeMessageNode('msg_host', 'Старт', {
      enableAutoTransition: true,
      autoTransitionTo: 'cond_1',
    }),
    makeConditionNode('cond_1', 'age', [
      makeBranch('less_than', 'kbd_1', '18'),
      makeBranch('else', 'msg_2'),
    ]),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('Далее', 'goto', 'msg_2'),
    ]),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  const code = gen(project, 'g07', true);
  const host = block(code, 'msg_host');
  assertIncludesAll(host, [
    'reply_markup=keyboard',
    'InlineKeyboardBuilder()',
    'callback_data="msg_2"',
  ], 'G07 host');
  assertIncludesAll(code, [
    'await handle_callback_kbd_1(callback_query)',
    'def __init__(self, message, from_user, target_node_id):',
    'self.from_user = from_user',
    'fake_callback = FakeCallbackQuery(sent_message or callback_query.message, callback_query.from_user, "cond_1")',
  ], 'G07 condition');
  syntax(code, 'g07');
});

console.log('══ Блок H: Backward compatibility и повторное использование keyboard ═');

test('H01', 'legacy и новая модель живут в одном проекте', () => {
  const project = makeProject([
    makeStartNode('start_1', {
      keyboardType: 'reply',
      buttons: [makeButton('Меню', 'goto', 'msg_1')],
    }),
    makeMessageNode('msg_1', 'Legacy inline', {
      keyboardType: 'inline',
      buttons: [makeButton('Далее', 'goto', 'msg_2')],
    }),
    makeMessageNode('msg_2', 'New model', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [makeButton('Общая', 'goto', 'msg_3')]),
    makeMessageNode('msg_3', 'Финал'),
  ]);

  const code = gen(project, 'h01');
  assertIncludesAll(code, [
    'ReplyKeyboardBuilder()',
    'InlineKeyboardBuilder()',
    'callback_data="msg_2"',
    'callback_data="msg_3"',
  ], 'H01');
  syntax(code, 'h01');
});

test('H02', 'одна keyboard-нода, привязанная к двум сообщениям, размножается корректно', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Первое', { keyboardNodeId: 'kbd_1' }),
    makeMessageNode('msg_2', 'Второе', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [makeButton('Общая', 'goto', 'msg_3')]),
    makeMessageNode('msg_3', 'Финал'),
  ]);

  const code = gen(project, 'h02');
  const msg1 = block(code, 'msg_1');
  const msg2 = block(code, 'msg_2');
  assertIncludesAll(msg1, ['callback_data="msg_3"'], 'H02 msg1');
  assertIncludesAll(msg2, ['callback_data="msg_3"'], 'H02 msg2');
  syntax(code, 'h02');
});

test('H03', 'keyboard-нода не мешает legacy start/command обработчикам', () => {
  const project = makeProject([
    makeStartNode('start_1', {
      keyboardType: 'inline',
      buttons: [makeButton('Старт', 'goto', 'msg_1')],
    }),
    makeCommandNode('cmd_help', '/help', {
      keyboardType: 'reply',
      buttons: [makeButton('Да', 'goto', 'msg_2')],
    }),
    makeKeyboardNode('kbd_1', 'reply', [makeButton('Общая', 'goto', 'msg_3')]),
    makeMessageNode('msg_1', 'A'),
    makeMessageNode('msg_2', 'B'),
    makeMessageNode('msg_3', 'C'),
  ]);

  syntax(gen(project, 'h03'), 'h03');
});

test('H04', 'orphan keyboard остаётся безопасным no-op даже в большом проекте', () => {
  const project = makeProject([
    makeStartNode('start_1', {
      keyboardType: 'inline',
      buttons: [makeButton('Меню', 'goto', 'msg_1')],
    }),
    makeMessageNode('msg_1', 'A', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [makeButton('Общая', 'goto', 'msg_2')]),
    makeKeyboardNode('kbd_orphan', 'inline', [makeButton('Сирота', 'goto', 'msg_2')]),
    makeMessageNode('msg_2', 'B'),
  ]);

  const code = gen(project, 'h04');
  const orphan = block(code, 'kbd_orphan');
  assertIncludesAll(orphan, ['без самостоятельной отправки сообщения', 'return'], 'H04');
  syntax(code, 'h04');
});

test('H05', 'повторное использование keyboard-ноды компилируется без ошибок', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Первое', { keyboardNodeId: 'kbd_1' }),
    makeMessageNode('msg_2', 'Второе', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'reply', [makeButton('Общая', 'goto', 'msg_3')]),
    makeMessageNode('msg_3', 'Финал'),
  ]);

  syntax(gen(project, 'h05'), 'h05');
});

console.log('══ Блок I: Краевые случаи и синтаксис ═══════════════════════════════');

test('I01', 'пустая keyboard-нода не ломает генерацию', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Пустая', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', []),
  ]);

  const code = gen(project, 'i01');
  const kbd = block(code, 'kbd_1');
  assertIncludesAll(kbd, ['без самостоятельной отправки сообщения'], 'I01');
  syntax(code, 'i01');
});

test('I02', 'неизвестный keyboardType безопасно проходит через legacy fallback', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Текст', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [makeButton('Кнопка', 'goto', 'msg_2')], {
      keyboardType: 'inline',
    }),
    makeMessageNode('msg_2', 'Ок'),
  ]);

  syntax(gen(project, 'i02'), 'i02');
});

test('I03', 'inline + reply + keyboard-нода в одном коде компилируются', () => {
  const project = makeProject([
    makeStartNode('start_1', {
      keyboardType: 'reply',
      buttons: [makeButton('Старт', 'goto', 'msg_1')],
    }),
    makeMessageNode('msg_1', 'Inline', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [makeButton('Дальше', 'goto', 'msg_2')]),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  syntax(gen(project, 'i03'), 'i03');
});

test('I04', 'условие + message + keyboard сохраняют совместимость со старой моделью', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Старт', { keyboardNodeId: 'kbd_1' }),
    makeConditionNode('cond_1', 'flag', [makeBranch('filled', 'kbd_1')]),
    makeKeyboardNode('kbd_1', 'reply', [makeButton('Да', 'goto', 'msg_2')]),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'i04');
  assertIncludesAll(code, ['async def handle_callback_cond_1', 'await handle_callback_kbd_1(callback_query)', 'ReplyKeyboardBuilder()'], 'I04');
  syntax(code, 'i04');
});

test('I05', 'полный синтаксический прогон для большого keyboard-проекта', () => {
  const project = makeProject([
    makeStartNode('start_1', {
      keyboardType: 'reply',
      buttons: [
        makeButton('Меню', 'goto', 'msg_1'),
        makeButton('Помощь', 'command', '/help'),
      ],
    }),
    makeCommandNode('cmd_help', '/help', {
      keyboardType: 'inline',
      buttons: [makeButton('Назад', 'goto', 'msg_1')],
    }),
    makeMessageNode('msg_1', 'Старт', { keyboardNodeId: 'kbd_1' }),
    makeConditionNode('cond_1', 'flag', [makeBranch('filled', 'kbd_1')]),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('A', 'selection', 'a', { buttonType: 'option' }),
      makeButton('B', 'selection', 'b', { buttonType: 'option' }),
      makeButton('Готово', 'complete', 'msg_2', { buttonType: 'complete' }),
    ], {
      allowMultipleSelection: true,
      multiSelectVariable: 'topics',
      continueButtonTarget: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  syntax(gen(project, 'i05', true), 'i05');
});

console.log('══ Блок J: customCallbackData ════════════════════════════════════════');

test('J01', 'goto-кнопка с customCallbackData использует его вместо target', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Подтвердите заказ', {
      keyboardType: 'inline',
      buttons: [
        {
          ...makeButton('Подтвердить', 'goto', 'msg_2'),
          customCallbackData: 'confirm_order',
        },
      ],
    }),
    makeMessageNode('msg_2', 'Заказ подтверждён'),
  ]);

  const code = gen(project, 'j01');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, ['callback_data="confirm_order"'], 'J01: customCallbackData должен использоваться');
  assertExcludes(b, ['callback_data="msg_2"'], 'J01: target не должен использоваться как callback_data');
  syntax(code, 'j01');
});

test('J02', 'command-кнопка с customCallbackData использует его вместо cmd_*', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardType: 'inline',
      buttons: [
        {
          ...makeButton('Помощь', 'command', '/help'),
          customCallbackData: 'my_help_action',
        },
      ],
    }),
  ]);

  const code = gen(project, 'j02');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, ['callback_data="my_help_action"'], 'J02: customCallbackData должен использоваться');
  assertExcludes(b, ['callback_data="cmd_help"'], 'J02: авто-значение cmd_help не должно использоваться');
  syntax(code, 'j02');
});

test('J03', 'без customCallbackData поведение не изменилось (обратная совместимость)', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardType: 'inline',
      buttons: [
        makeButton('Далее', 'goto', 'msg_2'),
      ],
    }),
    makeMessageNode('msg_2', 'Следующий'),
  ]);

  const code = gen(project, 'j03');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, ['callback_data="msg_2"'], 'J03: target должен использоваться как callback_data');
  syntax(code, 'j03');
});

test('J04', 'selection и complete не затрагиваются customCallbackData', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Выберите', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [
      {
        ...makeButton('Вариант', 'selection', 'opt1', { buttonType: 'option' }),
        customCallbackData: 'should_be_ignored',
      },
      {
        ...makeButton('Готово', 'complete', 'msg_2', { buttonType: 'complete' }),
        customCallbackData: 'also_ignored',
      },
    ], {
      allowMultipleSelection: true,
      multiSelectVariable: 'choices',
      continueButtonTarget: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Ок'),
  ]);

  const code = gen(project, 'j04');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, ['callback_data="ms_msg_1_opt1"', 'callback_data="done_msg_1"'], 'J04: ms_ и done_ должны использоваться');
  assertExcludes(b, ['callback_data="should_be_ignored"', 'callback_data="also_ignored"'], 'J04: customCallbackData не должен применяться к selection/complete');
  syntax(code, 'j04');
});

test('J05', 'обработчик целевого узла регистрируется по customCallbackData, а не по nodeId', () => {
  // Кнопка с customCallbackData ведёт к msg_2.
  // Декоратор handle_callback_msg_2 должен слушать "confirm_order", а не "msg_2".
  const project = makeProject([
    makeMessageNode('msg_1', 'Подтвердите заказ', {
      keyboardType: 'inline',
      buttons: [
        {
          ...makeButton('Подтвердить', 'goto', 'msg_2'),
          customCallbackData: 'confirm_order',
        },
      ],
    }),
    makeMessageNode('msg_2', 'Заказ подтверждён'),
  ]);

  const code = gen(project, 'j05');
  const b = block(code, 'msg_2');
  assertIncludesAll(b, ['lambda c: c.data == "confirm_order"'], 'J05: декоратор должен использовать customCallbackData');
  assertExcludes(b, ['lambda c: c.data == "msg_2"'], 'J05: декоратор не должен использовать nodeId как паттерн');
  syntax(code, 'j05');
});

test('J06', 'кнопка в keyboard-ноде с customCallbackData использует его в кнопке и обработчике', () => {
  // Кнопка находится в отдельной keyboard-ноде (не в message напрямую).
  // После нормализации кнопка переносится в msg_1, но customCallbackData должен сохраниться.
  // Обработчик msg_2 должен слушать "go_to_msg2", а не "msg_2".
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', { keyboardNodeId: 'kbd_1' }),
    makeKeyboardNode('kbd_1', 'inline', [
      {
        ...makeButton('Перейти', 'goto', 'msg_2'),
        customCallbackData: 'go_to_msg2',
      },
    ]),
    makeMessageNode('msg_2', 'Цель'),
  ]);

  const code = gen(project, 'j06');
  const msg1 = block(code, 'msg_1');
  const msg2 = block(code, 'msg_2');

  // Кнопка использует кастомный callback
  assertIncludesAll(msg1, ['callback_data="go_to_msg2"'], 'J06: кнопка должна использовать customCallbackData');
  assertExcludes(msg1, ['callback_data="msg_2"'], 'J06: target не должен использоваться');

  // Обработчик целевого узла слушает кастомный callback
  assertIncludesAll(msg2, ['lambda c: c.data == "go_to_msg2"'], 'J06: обработчик должен слушать customCallbackData');
  assertExcludes(msg2, ['lambda c: c.data == "msg_2"'], 'J06: обработчик не должен слушать nodeId');

  syntax(code, 'j06');
});

console.log('══ Блок K: copy_text кнопки ══════════════════════════════════════════');

test('K01', 'copy_text кнопка генерирует CopyTextButton с заполненным текстом', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardNodeId: 'kbd_1',
      keyboardType: 'inline',
      buttons: [
        {
          id: 'btn_copy_k01',
          text: 'Скопировать',
          action: 'copy_text',
          copyText: 'PROMO2024',
          buttonType: 'normal',
          hideAfterClick: false,
          skipDataCollection: false,
        },
      ],
    }),
  ]);

  const code = gen(project, 'k01');
  const msg1 = block(code, 'msg_1');

  assertIncludesAll(msg1, ['CopyTextButton(text="PROMO2024")'], 'K01: должен генерировать CopyTextButton с текстом');
  syntax(code, 'k01');
});

test('K02', 'copy_text кнопка без copyText фоллбэчит на callback_data', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardType: 'inline',
      buttons: [
        {
          id: 'btn_copy_k02',
          text: 'Кнопка',
          action: 'copy_text',
          copyText: '',
          buttonType: 'normal',
          hideAfterClick: false,
          skipDataCollection: false,
        },
      ],
    }),
  ]);

  const code = gen(project, 'k02');
  const msg1 = block(code, 'msg_1');

  assertIncludesAll(msg1, ['callback_data='], 'K02: пустой copyText должен генерировать callback_data');
  assertExcludes(msg1, ['CopyTextButton'], 'K02: не должен генерировать CopyTextButton при пустом copyText');
  syntax(code, 'k02');
});

test('K03', 'copy_text с hideAfterClick скрывает клавиатуру у целевого узла', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardType: 'inline',
      buttons: [
        {
          id: 'btn_copy_k03',
          text: 'Копировать',
          action: 'copy_text',
          copyText: 'текст',
          hideAfterClick: true,
          buttonType: 'normal',
          skipDataCollection: false,
          target: 'msg_2',
        },
      ],
    }),
    makeMessageNode('msg_2', 'Цель'),
  ]);

  const code = gen(project, 'k03');
  const msg2 = block(code, 'msg_2');

  assertIncludesAll(msg2, ['edit_reply_markup(reply_markup=None)'], 'K03: hideAfterClick должен добавлять edit_reply_markup в целевом узле');
  syntax(code, 'k03');
});

test('K04', 'copy_text и goto кнопки вместе компилируются', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardType: 'inline',
      buttons: [
        {
          id: 'btn_copy_k04',
          text: 'Скопировать',
          action: 'copy_text',
          copyText: 'HELLO',
          buttonType: 'normal',
          hideAfterClick: false,
          skipDataCollection: false,
        },
        makeButton('Перейти', 'goto', 'msg_2'),
      ],
    }),
    makeMessageNode('msg_2', 'Цель'),
  ]);

  const code = gen(project, 'k04');
  syntax(code, 'k04');
});

console.log('══ Блок L: web_app кнопки ══════════════════════════════════════════');

test('L01', 'web_app кнопка генерирует WebAppInfo с URL', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardType: 'inline',
      buttons: [
        {
          id: 'btn_wa_l01',
          text: 'Открыть',
          action: 'web_app',
          webAppUrl: 'https://example.com',
          buttonType: 'normal',
          hideAfterClick: false,
          skipDataCollection: false,
        },
      ],
    }),
  ]);

  const code = gen(project, 'l01');
  const msg1 = block(code, 'msg_1');

  assertIncludesAll(msg1, ['WebAppInfo(url="https://example.com")'], 'L01: должен генерировать WebAppInfo с URL');
  syntax(code, 'l01');
});

test('L02', 'web_app без URL фоллбэчит на callback_data', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardType: 'inline',
      buttons: [
        {
          id: 'btn_wa_l02',
          text: 'Открыть',
          action: 'web_app',
          webAppUrl: '',
          buttonType: 'normal',
          hideAfterClick: false,
          skipDataCollection: false,
        },
      ],
    }),
  ]);

  const code = gen(project, 'l02');
  const msg1 = block(code, 'msg_1');

  assertIncludesAll(msg1, ['callback_data='], 'L02: пустой webAppUrl должен генерировать callback_data');
  assertExcludes(msg1, ['WebAppInfo'], 'L02: не должен генерировать WebAppInfo при пустом URL');
  syntax(code, 'l02');
});

test('L03', 'web_app и goto кнопки вместе компилируются', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardType: 'inline',
      buttons: [
        {
          id: 'btn_wa_l03',
          text: 'Открыть',
          action: 'web_app',
          webAppUrl: 'https://example.com',
          buttonType: 'normal',
          hideAfterClick: false,
          skipDataCollection: false,
        },
        makeButton('Перейти', 'goto', 'msg_2'),
      ],
    }),
    makeMessageNode('msg_2', 'Цель'),
  ]);

  const code = gen(project, 'l03');
  syntax(code, 'l03');
});

test('L04', 'web_app кнопка с ручной раскладкой попадает в правильный ряд', () => {
  const project = makeProject([
    makeKeyboardNode('kbd_l04', 'inline', [
      {
        id: 'btn_webapp',
        text: '🌐 Открыть',
        action: 'web_app',
        webAppUrl: 'https://example.com',
        buttonType: 'normal',
        hideAfterClick: false,
        skipDataCollection: false,
      },
      makeButton('Далее', 'goto', 'msg_2', { id: 'btn_goto1' }),
      makeButton('Назад', 'goto', 'msg_3', { id: 'btn_goto2' }),
    ], {
      keyboardLayout: {
        rows: [
          { buttonIds: ['btn_webapp', 'btn_goto1'] },
          { buttonIds: ['btn_goto2'] },
        ],
        columns: 2,
        autoLayout: false,
      },
    }),
    makeMessageNode('msg_1', 'Меню', { keyboardNodeId: 'kbd_l04' }),
    makeMessageNode('msg_2', 'Цель 1'),
    makeMessageNode('msg_3', 'Цель 2'),
  ]);

  const code = gen(project, 'l04');
  const msg1 = block(code, 'msg_1');

  assertIncludesAll(msg1, ['builder.adjust(2, 1)'], 'L04: должен генерировать builder.adjust(2, 1)');
  syntax(code, 'l04');
});

test('L04A', 'mixed dynamic + static manual rows сохраняет layout после __dynamic__', () => {
  const project = makeProject([
    makeKeyboardNode('kbd_l04a', 'inline', [
      makeButton('Добавить токен', 'goto', 'msg_add', { id: 'btn_add' }),
      makeButton('Переименовать', 'goto', 'msg_rename', { id: 'btn_rename' }),
      makeButton('Удалить', 'goto', 'msg_delete', { id: 'btn_delete' }),
      makeButton('К списку', 'goto', 'msg_back', { id: 'btn_back' }),
    ], {
      enableDynamicButtons: true,
      dynamicButtons: {
        sourceVariable: 'project_tokens',
        arrayPath: 'items',
        textTemplate: '{name}',
        callbackTemplate: 'token_{id}',
        styleMode: 'none',
        styleField: '',
        styleTemplate: '',
        columns: 1,
      },
      keyboardLayout: {
        rows: [
          { buttonIds: ['__dynamic__'] },
          { buttonIds: ['btn_add'] },
          { buttonIds: ['btn_rename', 'btn_delete'] },
          { buttonIds: ['btn_back'] },
        ],
        columns: 2,
        autoLayout: false,
      },
    }),
    makeMessageNode('msg_1', 'Меню', { keyboardNodeId: 'kbd_l04a' }),
    makeMessageNode('msg_add', 'Добавить'),
    makeMessageNode('msg_rename', 'Переименовать'),
    makeMessageNode('msg_delete', 'Удалить'),
    makeMessageNode('msg_back', 'Назад'),
  ]);

  const code = gen(project, 'l04a');
  const msg1 = block(code, 'msg_1');

  assertIncludesAll(msg1, [
    'if len(_dynamic_row) == 1:',
    'builder.row(*_dynamic_row)',
    'callback_data="msg_add"',
    'callback_data="msg_rename"',
    'callback_data="msg_delete"',
    'callback_data="msg_back"',
  ], 'L04A: mixed layout должен собираться через row');
  assertExcludes(msg1, ['builder.adjust('], 'L04A: mixed layout не должен использовать builder.adjust');
  syntax(code, 'l04a');
});

test('L05', 'web_app не генерирует callback обработчик', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardType: 'inline',
      buttons: [
        {
          id: 'btn_wa_l05',
          text: 'Открыть',
          action: 'web_app',
          webAppUrl: 'https://example.com',
          buttonType: 'normal',
          hideAfterClick: false,
          skipDataCollection: false,
        },
      ],
    }),
  ]);

  const code = gen(project, 'l05');

  assertExcludes(code, ['handle_callback_btn_wa_l05'], 'L05: web_app не должен создавать callback обработчик');
  syntax(code, 'l05');
});

console.log('══ Блок M: style — цвет кнопки (Bot API 9.4) ════════════════════════');

test('M01', 'style="primary" генерирует style="primary" в коде', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', { keyboardNodeId: 'kbd_m01' }),
    makeKeyboardNode('kbd_m01', 'inline', [
      { ...makeButton('Подтвердить', 'goto', 'msg_2', { id: 'btn_m01' }), style: 'primary' },
    ]),
    makeMessageNode('msg_2', 'Цель'),
  ]);

  const code = gen(project, 'm01');
  const msg1 = block(code, 'msg_1');
  assertIncludesAll(msg1, ['style="primary"'], 'M01: должен генерировать style="primary"');
  syntax(code, 'm01');
});

test('M02', 'style="destructive" генерирует style="destructive"', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', { keyboardNodeId: 'kbd_m02' }),
    makeKeyboardNode('kbd_m02', 'inline', [
      { ...makeButton('Удалить', 'goto', 'msg_2', { id: 'btn_m02' }), style: 'destructive' },
    ]),
    makeMessageNode('msg_2', 'Цель'),
  ]);

  const code = gen(project, 'm02');
  const msg1 = block(code, 'msg_1');
  assertIncludesAll(msg1, ['style="destructive"'], 'M02: должен генерировать style="destructive"');
  syntax(code, 'm02');
});

test('M03', 'кнопка без style не генерирует параметр style', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', { keyboardNodeId: 'kbd_m03' }),
    makeKeyboardNode('kbd_m03', 'inline', [
      makeButton('Обычная', 'goto', 'msg_2', { id: 'btn_m03' }),
    ]),
    makeMessageNode('msg_2', 'Цель'),
  ]);

  const code = gen(project, 'm03');
  const msg1 = block(code, 'msg_1');
  assertExcludes(msg1, ['style='], 'M03: кнопка без style не должна содержать style=');
  syntax(code, 'm03');
});

test('M04', 'style работает для reply кнопок', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', { keyboardNodeId: 'kbd_m04' }),
    makeKeyboardNode('kbd_m04', 'reply', [
      { ...makeButton('Подтвердить', 'goto', 'msg_2', { id: 'btn_m04' }), style: 'primary' },
    ]),
    makeMessageNode('msg_2', 'Цель'),
  ]);

  const code = gen(project, 'm04');
  const msg1 = block(code, 'msg_1');
  assertIncludesAll(msg1, ['style="primary"'], 'M04: reply кнопка должна генерировать style="primary"');
  syntax(code, 'm04');
});

console.log('══ Блок N: request_managed_bot (Bot API 9.6) ════════════════════════');

test('N01', 'reply-клавиатура с request_managed_bot кнопкой генерирует KeyboardButtonRequestManagedBot', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Создайте бота', {
      keyboardType: 'reply',
      buttons: [
        makeButton('🤖 Создать бота', 'request_managed_bot', 'msg_2', {
          id: 'btn_mb_n01',
          suggestedBotName: 'Мой бот',
          suggestedBotUsername: 'my_new_bot',
        }),
      ],
    }),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'n01');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, ['KeyboardButtonRequestManagedBot(', 'ReplyKeyboardBuilder'], 'N01');
  syntax(code, 'n01');
});

test('N02', 'suggestedBotName и suggestedBotUsername попадают в сгенерированный код', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Создайте бота', {
      keyboardType: 'reply',
      buttons: [
        makeButton('🤖 Создать', 'request_managed_bot', 'msg_2', {
          id: 'btn_mb_n02',
          suggestedBotName: 'Тест Бот',
          suggestedBotUsername: 'test_bot_xyz',
        }),
      ],
    }),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'n02');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, ['suggested_name="Тест Бот"', 'suggested_username="test_bot_xyz"'], 'N02');
  syntax(code, 'n02');
});

test('N03', 'request_managed_bot кнопка работает вместе с обычными reply кнопками', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Меню', {
      keyboardType: 'reply',
      buttons: [
        makeButton('🤖 Создать бота', 'request_managed_bot', 'msg_2', {
          id: 'btn_mb_n03',
          suggestedBotName: 'Бот',
          suggestedBotUsername: 'bot_n03',
        }),
        makeButton('Пропустить', 'goto', 'msg_2', { id: 'btn_skip_n03' }),
      ],
    }),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'n03');
  const b = block(code, 'msg_1');
  assertIncludesAll(b, ['KeyboardButtonRequestManagedBot(', 'Пропустить', 'ReplyKeyboardBuilder'], 'N03');
  syntax(code, 'n03');
});

// ─── Блок O: Переменные в customCallbackData ─────────────────────────────────

console.log('\n── Блок O: Переменные в customCallbackData ─────────────────────────────────');

test('O01', 'customCallbackData с {переменной} генерирует replace_variables_in_text', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Список', {
      keyboardType: 'inline',
      buttons: [
        makeButton('➡️ Далее', 'goto', 'pagination-input', {
          id: 'btn_next_o01',
          customCallbackData: 'offset_{users_data.nextOffset}',
        }),
      ],
    }),
    makeMessageNode('pagination-input', 'Загрузка...'),
  ]);

  const code = gen(project, 'o01');
  const b = block(code, 'msg_1');
  ok(
    b.includes('replace_variables_in_text("offset_{users_data.nextOffset}"'),
    'O01: ожидался replace_variables_in_text для customCallbackData с переменной'
  );
  syntax(code, 'o01');
});

test('O02', 'customCallbackData без переменных остаётся статическим', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Подтвердить?', {
      keyboardType: 'inline',
      buttons: [
        makeButton('✅ Да', 'goto', 'confirm-node', {
          id: 'btn_yes_o02',
          customCallbackData: 'confirm_order',
        }),
      ],
    }),
    makeMessageNode('confirm-node', 'Подтверждено'),
  ]);

  const code = gen(project, 'o02');
  const b = block(code, 'msg_1');
  ok(b.includes('callback_data="confirm_order"'), 'O02: ожидался статический callback_data="confirm_order"');
  ok(!b.includes('replace_variables_in_text("confirm_order"'), 'O02: статический customCallbackData не должен использовать replace_variables_in_text');
  syntax(code, 'o02');
});

test('O03', 'customCallbackData с несколькими переменными подставляется корректно', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Редактировать', {
      keyboardType: 'inline',
      buttons: [
        makeButton('✏️ Редактировать', 'goto', 'edit-node', {
          id: 'btn_edit_o03',
          customCallbackData: 'edit_{item.type}_{item.id}',
        }),
      ],
    }),
    makeMessageNode('edit-node', 'Редактор'),
  ]);

  const code = gen(project, 'o03');
  const b = block(code, 'msg_1');
  ok(
    b.includes('replace_variables_in_text("edit_{item.type}_{item.id}"'),
    'O03: ожидался replace_variables_in_text для нескольких переменных'
  );
  syntax(code, 'o03');
});

test('O04', 'customCallbackData с переменной в keyboard-ноде работает корректно', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Страница', { keyboardNodeId: 'kb_1' }),
    {
      id: 'kb_1',
      type: 'keyboard',
      position: { x: 0, y: 0 },
      data: {
        keyboardType: 'inline',
        buttons: [
          makeButton('⬅️ Назад', 'goto', 'pagination-input', {
            id: 'btn_prev_o04',
            customCallbackData: 'offset_{users_data.prevOffset}',
          }),
          makeButton('➡️ Далее', 'goto', 'pagination-input', {
            id: 'btn_next_o04',
            customCallbackData: 'offset_{users_data.nextOffset}',
          }),
        ],
        enableDynamicButtons: false,
        dynamicButtons: { columns: 2, arrayPath: '', styleMode: 'none', styleField: '', textTemplate: '', styleTemplate: '', sourceVariable: '', callbackTemplate: '' },
        resizeKeyboard: true,
        oneTimeKeyboard: false,
      },
    },
    makeMessageNode('pagination-input', 'Загрузка...'),
  ]);

  const code = gen(project, 'o04');
  ok(code.includes('replace_variables_in_text("offset_{users_data.prevOffset}"'), 'O04: prevOffset должен использовать replace_variables_in_text');
  ok(code.includes('replace_variables_in_text("offset_{users_data.nextOffset}"'), 'O04: nextOffset должен использовать replace_variables_in_text');
  syntax(code, 'o04');
});

test('O05', 'Синтаксис Python OK для кнопок с переменными в customCallbackData', () => {
  const project = makeProject([
    makeMessageNode('msg_1', 'Список', {
      keyboardType: 'inline',
      buttons: [
        makeButton('⬅️ Назад', 'goto', 'pag', { id: 'btn_p_o05', customCallbackData: 'offset_{data.prevOffset}' }),
        makeButton('➡️ Далее', 'goto', 'pag', { id: 'btn_n_o05', customCallbackData: 'offset_{data.nextOffset}' }),
        makeButton('◀️ Назад', 'goto', 'back', { id: 'btn_b_o05' }),
      ],
    }),
    makeMessageNode('pag', 'Пагинация'),
    makeMessageNode('back', 'Назад'),
  ]);

  syntax(gen(project, 'o05'), 'o05');
});

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log(`║  Итог: ${passed}/${results.length} пройдено${failed > 0 ? `, ${failed} провалено` : ' ✅'}${' '.repeat(Math.max(0, 40 - String(passed).length - String(results.length).length - String(failed).length))}║`);
console.log('╚════════════════════════════════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
}
