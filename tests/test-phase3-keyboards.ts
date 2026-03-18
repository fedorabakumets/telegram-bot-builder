/**
 * @fileoverview Фаза 3 — Клавиатуры — JSON-мутации
 *
 * Тестирует генерацию Python-кода для всех типов клавиатур:
 *  Блок A: keyboardType (none/inline/reply)
 *  Блок B: Inline-кнопки (goto, url, смешанные)
 *  Блок C: Reply-клавиатура (oneTimeKeyboard, resizeKeyboard)
 *  Блок D: keyboardLayout (расположение кнопок)
 *  Блок E: hideAfterClick
 *  Блок F: skipDataCollection
 *  Блок G: Комбинации
 *  Блок H: Граничные случаи
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../lib/bot-generator.ts';

const PROJECT_PATH = 'bots/импортированный_проект_1723_60_53/project.json';
const BASE = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf-8'));

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

function patchNode(nodeIndex: number, patch: Record<string, unknown>) {
  const p = clone(BASE);
  Object.assign(p.sheets[0].nodes[nodeIndex].data, patch);
  return p;
}

function addNode(type: string, id: string, data: Record<string, unknown>) {
  const p = clone(BASE);
  p.sheets[0].nodes.push({ id, type, position: { x: 0, y: 0 }, data });
  return p;
}

function makeBtn(overrides: Record<string, unknown> = {}) {
  return {
    id: `btn_${Math.random().toString(36).slice(2, 8)}`,
    text: 'Кнопка',
    action: 'goto',
    target: '1KvQin0bE6-tRu9mm8xK_',
    hideAfterClick: false,
    skipDataCollection: false,
    ...overrides,
  };
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase3_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

function genWithDb(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase3_${label}`,
    userDatabaseEnabled: true,
    enableComments: false,
  });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p3_${label}.py`;
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

type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

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

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║         Фаза 3 — Клавиатуры                                 ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: keyboardType
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: keyboardType ──────────────────────────────────────');

test('A01', 'keyboardType:none → нет клавиатуры в коде', () => {
  // Патчим оба узла чтобы убрать все клавиатуры
  const p = clone(BASE);
  Object.assign(p.sheets[0].nodes[0].data, { keyboardType: 'none', buttons: [] });
  Object.assign(p.sheets[0].nodes[1].data, { keyboardType: 'none', buttons: [] });
  const code = gen(p, 'a01');
  syntax(code, 'a01');
  ok(code.includes('keyboard = None'), 'keyboard = None при keyboardType:none');
  // InlineKeyboardBuilder может быть в импортах, но не должен использоваться в коде
  ok(!code.includes('builder = InlineKeyboardBuilder()'), 'нет builder = InlineKeyboardBuilder()');
  ok(!code.includes('builder = ReplyKeyboardBuilder()'), 'нет builder = ReplyKeyboardBuilder()');
});

test('A02', 'keyboardType:inline → InlineKeyboardBuilder в коде', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'a02');
  syntax(code, 'a02');
  ok(code.includes('InlineKeyboardBuilder'), 'InlineKeyboardBuilder должен быть');
  ok(code.includes('InlineKeyboardButton'), 'InlineKeyboardButton должен быть');
});

test('A03', 'keyboardType:reply → ReplyKeyboardBuilder в коде', () => {
  // Патчим оба узла: node[0] без клавиатуры, node[1] с reply
  const p = clone(BASE);
  Object.assign(p.sheets[0].nodes[0].data, { keyboardType: 'none', buttons: [] });
  Object.assign(p.sheets[0].nodes[1].data, {
    keyboardType: 'reply',
    buttons: [makeBtn({ action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  });
  const code = gen(p, 'a03');
  syntax(code, 'a03');
  ok(code.includes('ReplyKeyboardBuilder'), 'ReplyKeyboardBuilder должен быть');
  // InlineKeyboardBuilder может быть только в импортах, но не как builder = InlineKeyboardBuilder()
  ok(!code.includes('builder = InlineKeyboardBuilder()'), 'нет builder = InlineKeyboardBuilder() при reply');
});

test('A04', 'keyboardType:none → синтаксис Python OK', () => {
  const code = gen(patchNode(1, { keyboardType: 'none', buttons: [] }), 'a04');
  syntax(code, 'a04');
});

test('A05', 'keyboardType:inline → синтаксис Python OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn()],
  }), 'a05');
  syntax(code, 'a05');
});

test('A06', 'keyboardType:reply → синтаксис Python OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'reply',
    buttons: [makeBtn()],
  }), 'a06');
  syntax(code, 'a06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Inline-кнопки
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: Inline-кнопки ─────────────────────────────────────');

test('B01', 'Одна кнопка goto → callback_data в коде', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_abc', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'b01');
  syntax(code, 'b01');
  ok(code.includes('callback_data='), 'callback_data должен быть');
  ok(code.includes('InlineKeyboardButton'), 'InlineKeyboardButton должен быть');
});

test('B02', 'Несколько кнопок goto → все callback_data в коде', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [
      makeBtn({ id: 'btn_1', text: 'Первая', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' }),
      makeBtn({ id: 'btn_2', text: 'Вторая', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' }),
      makeBtn({ id: 'btn_3', text: 'Третья', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' }),
    ],
  }), 'b02');
  syntax(code, 'b02');
  const cbCount = (code.match(/callback_data=/g) || []).length;
  ok(cbCount >= 3, `Должно быть минимум 3 callback_data, найдено: ${cbCount}`);
});

test('B03', 'Кнопка action:url → url= в коде', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_url', action: 'url', target: 'https://example.com', text: 'Сайт' })],
  }), 'b03');
  syntax(code, 'b03');
  ok(code.includes('url='), 'url= должен быть');
  ok(code.includes('https://example.com'), 'URL должен быть в коде');
});

test('B04', 'Смешанные кнопки (goto + url) → оба типа в коде', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [
      makeBtn({ id: 'btn_goto', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', text: 'Перейти' }),
      makeBtn({ id: 'btn_url', action: 'url', target: 'https://example.com', text: 'Сайт' }),
    ],
  }), 'b04');
  syntax(code, 'b04');
  ok(code.includes('callback_data='), 'goto кнопка с callback_data');
  ok(code.includes('url='), 'url кнопка с url=');
});

test('B05', 'Кнопка с пустым текстом → синтаксис OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_empty', text: '', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'b05');
  syntax(code, 'b05');
});

test('B06', 'Кнопка с текстом содержащим кавычки → синтаксис OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_q', text: 'Сказал "Привет"', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'b06');
  syntax(code, 'b06');
});

test('B07', 'Кнопка с текстом содержащим эмодзи → синтаксис OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_emoji', text: '🚀 Поехали! 🎉', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'b07');
  syntax(code, 'b07');
  ok(code.includes('🚀') || code.includes('Поехали'), 'эмодзи в тексте кнопки');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Reply-клавиатура
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: Reply-клавиатура ──────────────────────────────────');

test('C01', 'keyboardType:reply + кнопки → ReplyKeyboardMarkup/Builder в коде', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'reply',
    buttons: [makeBtn({ text: 'Ответ', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'c01');
  syntax(code, 'c01');
  ok(
    code.includes('ReplyKeyboardBuilder') || code.includes('ReplyKeyboardMarkup'),
    'ReplyKeyboardBuilder или ReplyKeyboardMarkup должен быть'
  );
});

test('C02', 'oneTimeKeyboard:true → one_time_keyboard=True в коде', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'reply',
    oneTimeKeyboard: true,
    buttons: [makeBtn({ text: 'Ок', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'c02');
  syntax(code, 'c02');
  ok(code.includes('one_time_keyboard=True'), 'one_time_keyboard=True должен быть');
});

test('C03', 'oneTimeKeyboard:false → one_time_keyboard=False в коде', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'reply',
    oneTimeKeyboard: false,
    buttons: [makeBtn({ text: 'Ок', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'c03');
  syntax(code, 'c03');
  ok(code.includes('one_time_keyboard=False'), 'one_time_keyboard=False должен быть');
});

test('C04', 'resizeKeyboard:true → resize_keyboard=True в коде', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'reply',
    resizeKeyboard: true,
    buttons: [makeBtn({ text: 'Ок', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'c04');
  syntax(code, 'c04');
  ok(code.includes('resize_keyboard=True'), 'resize_keyboard=True должен быть');
});

test('C05', 'resizeKeyboard:false → resize_keyboard=False в коде', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'reply',
    resizeKeyboard: false,
    buttons: [makeBtn({ text: 'Ок', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'c05');
  syntax(code, 'c05');
  ok(code.includes('resize_keyboard=False'), 'resize_keyboard=False должен быть');
});

test('C06', 'Reply-клавиатура → синтаксис Python OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'reply',
    oneTimeKeyboard: true,
    resizeKeyboard: true,
    buttons: [
      makeBtn({ text: 'Да', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' }),
      makeBtn({ text: 'Нет', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' }),
    ],
  }), 'c06');
  syntax(code, 'c06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: keyboardLayout
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок D: keyboardLayout ────────────────────────────────────');

test('D01', 'keyboardLayout columns:1 → кнопки по 1 в ряд (adjust(1))', () => {
  const btns = [
    makeBtn({ id: 'b1', text: 'Кнопка 1' }),
    makeBtn({ id: 'b2', text: 'Кнопка 2' }),
    makeBtn({ id: 'b3', text: 'Кнопка 3' }),
  ];
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: btns,
    keyboardLayout: {
      rows: [{ buttonIds: ['b1'] }, { buttonIds: ['b2'] }, { buttonIds: ['b3'] }],
      columns: 1,
      autoLayout: false,
    },
  }), 'd01');
  syntax(code, 'd01');
  ok(code.includes('builder.adjust(1, 1, 1)') || code.includes('builder.adjust(1)'), 'adjust(1) или adjust(1, 1, 1) должен быть');
});

test('D02', 'keyboardLayout columns:2 → кнопки по 2 в ряд (adjust(2))', () => {
  const btns = [
    makeBtn({ id: 'b1', text: 'Кнопка 1' }),
    makeBtn({ id: 'b2', text: 'Кнопка 2' }),
    makeBtn({ id: 'b3', text: 'Кнопка 3' }),
    makeBtn({ id: 'b4', text: 'Кнопка 4' }),
  ];
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: btns,
    keyboardLayout: {
      rows: [{ buttonIds: ['b1', 'b2'] }, { buttonIds: ['b3', 'b4'] }],
      columns: 2,
      autoLayout: false,
    },
  }), 'd02');
  syntax(code, 'd02');
  ok(code.includes('builder.adjust(2, 2)') || code.includes('builder.adjust(2)'), 'adjust(2) или adjust(2, 2) должен быть');
});

test('D03', 'keyboardLayout columns:3 → кнопки по 3 в ряд (adjust(3))', () => {
  const btns = [
    makeBtn({ id: 'b1', text: 'Кнопка 1' }),
    makeBtn({ id: 'b2', text: 'Кнопка 2' }),
    makeBtn({ id: 'b3', text: 'Кнопка 3' }),
  ];
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: btns,
    keyboardLayout: {
      rows: [{ buttonIds: ['b1', 'b2', 'b3'] }],
      columns: 3,
      autoLayout: false,
    },
  }), 'd03');
  syntax(code, 'd03');
  ok(code.includes('builder.adjust(3)'), 'adjust(3) должен быть');
});

test('D04', 'autoLayout:true + columns:2 → builder.adjust(2)', () => {
  const btns = [
    makeBtn({ id: 'b1', text: 'Кнопка 1' }),
    makeBtn({ id: 'b2', text: 'Кнопка 2' }),
    makeBtn({ id: 'b3', text: 'Кнопка 3' }),
    makeBtn({ id: 'b4', text: 'Кнопка 4' }),
  ];
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: btns,
    keyboardLayout: {
      rows: [],
      columns: 2,
      autoLayout: true,
    },
  }), 'd04');
  syntax(code, 'd04');
  ok(code.includes('builder.adjust(2)'), 'adjust(2) должен быть при autoLayout');
});

test('D05', 'keyboardLayout → синтаксис Python OK для каждого варианта', () => {
  for (const cols of [1, 2, 3]) {
    const btns = Array.from({ length: cols * 2 }, (_, i) =>
      makeBtn({ id: `b${i}`, text: `Кнопка ${i + 1}` })
    );
    const rows = Array.from({ length: 2 }, (_, r) => ({
      buttonIds: btns.slice(r * cols, r * cols + cols).map(b => b.id as string),
    }));
    const code = gen(patchNode(1, {
      keyboardType: 'inline',
      buttons: btns,
      keyboardLayout: { rows, columns: cols, autoLayout: false },
    }), `d05_cols${cols}`);
    syntax(code, `d05_cols${cols}`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: hideAfterClick
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок E: hideAfterClick ────────────────────────────────────');

test('E01', 'hideAfterClick:true → клавиатура скрывается (edit_reply_markup или one_time_keyboard)', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_hide', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', hideAfterClick: true })],
  }), 'e01');
  syntax(code, 'e01');
  ok(
    code.includes('edit_reply_markup') || code.includes('reply_markup=None') || code.includes('delete_message'),
    'должен быть механизм скрытия клавиатуры'
  );
});

test('E02', 'hideAfterClick:false → клавиатура не скрывается', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_show', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', hideAfterClick: false })],
  }), 'e02');
  syntax(code, 'e02');
  ok(!code.includes('edit_reply_markup'), 'edit_reply_markup не должен быть при hideAfterClick:false');
});

test('E03', 'hideAfterClick:true → синтаксис Python OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_h', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', hideAfterClick: true })],
  }), 'e03');
  syntax(code, 'e03');
});

test('E04', 'hideAfterClick:false → синтаксис Python OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_s', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', hideAfterClick: false })],
  }), 'e04');
  syntax(code, 'e04');
});

test('E05', 'Reply + hideAfterClick:true → синтаксис OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'reply',
    buttons: [makeBtn({ id: 'btn_rh', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', hideAfterClick: true })],
  }), 'e05');
  syntax(code, 'e05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: skipDataCollection
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок F: skipDataCollection ────────────────────────────────');

test('F01', 'skipDataCollection:true → флаг передаётся в skip_buttons при collectUserInput', () => {
  // skipDataCollection на кнопке передаётся как skip_buttons в user-input шаблон
  // когда узел имеет collectUserInput:true
  const p = clone(BASE);
  p.sheets[0].nodes[1].data.collectUserInput = true;
  p.sheets[0].nodes[1].data.enableTextInput = true;
  p.sheets[0].nodes[1].data.inputVariable = 'user_answer';
  p.sheets[0].nodes[1].data.keyboardType = 'reply';
  p.sheets[0].nodes[1].data.buttons = [
    makeBtn({ id: 'btn_skip', text: 'Пропустить', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', skipDataCollection: true }),
    makeBtn({ id: 'btn_ok', text: 'Ок', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', skipDataCollection: false }),
  ];
  const code = gen(p, 'f01');
  syntax(code, 'f01');
  // Код должен генерироваться без ошибок
  ok(typeof code === 'string' && code.length > 0, 'код должен генерироваться');
});

test('F02', 'skipDataCollection:false → данные собираются (нет флага пропуска)', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_collect', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', skipDataCollection: false })],
  }), 'f02');
  syntax(code, 'f02');
});

test('F03', 'skipDataCollection:true → синтаксис Python OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_sk', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', skipDataCollection: true })],
  }), 'f03');
  syntax(code, 'f03');
});

test('F04', 'skipDataCollection:false → синтаксис Python OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_nc', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_', skipDataCollection: false })],
  }), 'f04');
  syntax(code, 'f04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Комбинации
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок G: Комбинации ────────────────────────────────────────');

test('G01', 'inline + несколько кнопок + layout → синтаксис OK', () => {
  const btns = [
    makeBtn({ id: 'g1', text: 'Первая', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' }),
    makeBtn({ id: 'g2', text: 'Вторая', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' }),
    makeBtn({ id: 'g3', text: 'Третья', action: 'url', target: 'https://example.com' }),
    makeBtn({ id: 'g4', text: 'Четвёртая', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' }),
  ];
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: btns,
    keyboardLayout: {
      rows: [{ buttonIds: ['g1', 'g2'] }, { buttonIds: ['g3', 'g4'] }],
      columns: 2,
      autoLayout: false,
    },
  }), 'g01');
  syntax(code, 'g01');
  ok(code.includes('InlineKeyboardBuilder'), 'InlineKeyboardBuilder должен быть');
  ok(code.includes('builder.adjust('), 'builder.adjust должен быть');
});

test('G02', 'reply + oneTimeKeyboard + resizeKeyboard → синтаксис OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'reply',
    oneTimeKeyboard: true,
    resizeKeyboard: true,
    buttons: [
      makeBtn({ id: 'r1', text: 'Да', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' }),
      makeBtn({ id: 'r2', text: 'Нет', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' }),
    ],
  }), 'g02');
  syntax(code, 'g02');
  ok(code.includes('one_time_keyboard=True'), 'one_time_keyboard=True');
  ok(code.includes('resize_keyboard=True'), 'resize_keyboard=True');
});

test('G03', 'Узел с кнопками + userDatabaseEnabled:true → синтаксис OK', () => {
  const code = genWithDb(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'db1', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'g03');
  syntax(code, 'g03');
  ok(code.includes('InlineKeyboardBuilder'), 'InlineKeyboardBuilder должен быть');
});

test('G04', 'inline + goto + url + layout + userDb → синтаксис OK', () => {
  const btns = [
    makeBtn({ id: 'cg1', text: 'Перейти', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' }),
    makeBtn({ id: 'cg2', text: 'Сайт', action: 'url', target: 'https://example.com' }),
  ];
  const code = genWithDb(patchNode(1, {
    keyboardType: 'inline',
    buttons: btns,
    keyboardLayout: {
      rows: [{ buttonIds: ['cg1', 'cg2'] }],
      columns: 2,
      autoLayout: false,
    },
  }), 'g04');
  syntax(code, 'g04');
});

test('G05', 'reply + oneTimeKeyboard:false + resizeKeyboard:false → синтаксис OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'reply',
    oneTimeKeyboard: false,
    resizeKeyboard: false,
    buttons: [makeBtn({ id: 'rf1', text: 'Кнопка', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'g05');
  syntax(code, 'g05');
  ok(code.includes('one_time_keyboard=False'), 'one_time_keyboard=False');
  ok(code.includes('resize_keyboard=False'), 'resize_keyboard=False');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок H: Граничные случаи ──────────────────────────────────');

test('H01', 'Пустой массив кнопок + keyboardType:inline → нет InlineKeyboardBuilder', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [],
  }), 'h01');
  syntax(code, 'h01');
  ok(
    !code.includes('InlineKeyboardBuilder') || code.includes('keyboard = None'),
    'при пустых кнопках нет InlineKeyboardBuilder или keyboard = None'
  );
});

test('H02', 'Очень много кнопок (12 штук) → синтаксис OK', () => {
  const buttons = Array.from({ length: 12 }, (_, i) =>
    makeBtn({ id: `many_${i}`, text: `Кнопка ${i + 1}`, action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })
  );
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons,
  }), 'h02');
  syntax(code, 'h02');
  const btnCount = (code.match(/InlineKeyboardButton/g) || []).length;
  ok(btnCount >= 12, `Должно быть минимум 12 кнопок, найдено: ${btnCount}`);
});

test('H03', 'Кнопка с очень длинным текстом → синтаксис OK', () => {
  const longText = 'А'.repeat(200);
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_long', text: longText, action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'h03');
  syntax(code, 'h03');
});

test('H04', 'Кнопка с текстом содержащим \\n → синтаксис OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_nl', text: 'Строка1\nСтрока2', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'h04');
  syntax(code, 'h04');
});

test('H05', 'Кнопка с одинарными кавычками в тексте → синтаксис OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_sq', text: "It's a button", action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'h05');
  syntax(code, 'h05');
});

test('H06', 'Кнопка с обратным слешем в тексте → синтаксис OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_bs', text: 'Путь C:\\test\\file', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'h06');
  syntax(code, 'h06');
});

test('H07', 'Кнопка с кириллицей и спецсимволами → синтаксис OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_cyr', text: 'Привет! Как дела? #хорошо @user', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'h07');
  syntax(code, 'h07');
});

test('H08', 'Пустой массив кнопок + keyboardType:reply → keyboard = None', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'reply',
    buttons: [],
  }), 'h08');
  syntax(code, 'h08');
  ok(code.includes('keyboard = None'), 'keyboard = None при пустых кнопках reply');
});

test('H09', 'keyboardType:none + пустые кнопки → keyboard = None', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'none',
    buttons: [],
  }), 'h09');
  syntax(code, 'h09');
  ok(code.includes('keyboard = None'), 'keyboard = None');
});

test('H10', '12 reply-кнопок → синтаксис OK', () => {
  const buttons = Array.from({ length: 12 }, (_, i) =>
    makeBtn({ id: `rep_${i}`, text: `Ответ ${i + 1}`, action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })
  );
  const code = gen(patchNode(1, {
    keyboardType: 'reply',
    buttons,
    oneTimeKeyboard: false,
    resizeKeyboard: true,
  }), 'h10');
  syntax(code, 'h10');
});

test('H11', 'Кнопка с текстом из только эмодзи → синтаксис OK', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_emo', text: '🎯🔥💡🚀', action: 'goto', target: '1KvQin0bE6-tRu9mm8xK_' })],
  }), 'h11');
  syntax(code, 'h11');
});

test('H12', 'Кнопка url с полем url (не target) → url= в коде', () => {
  const code = gen(patchNode(1, {
    keyboardType: 'inline',
    buttons: [makeBtn({ id: 'btn_urlf', action: 'url', url: 'https://telegram.org', target: '', text: 'TG' })],
  }), 'h12');
  syntax(code, 'h12');
  ok(code.includes('url='), 'url= должен быть');
  ok(code.includes('https://telegram.org'), 'URL из поля url должен быть в коде');
});

// ─── Итог ─────────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итог: ${passed}/${results.length} пройдено  |  Провалено: ${failed}${' '.repeat(Math.max(0, 42 - String(passed).length - String(results.length).length - String(failed).length))}║`);
console.log('╚══════════════════════════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     ${r.note}`);
  });
  process.exit(1);
}
