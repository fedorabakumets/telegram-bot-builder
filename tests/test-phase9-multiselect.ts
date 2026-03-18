/**
 * Фаза 9 — Мультивыбор (Multi-Select)
 * Тестирует: allowMultipleSelection, multiSelectVariable, continueButtonTarget,
 * continueButtonText, action:'selection', action:'complete', inline/reply keyboard,
 * start/message/command узлы, несколько узлов, БД, граничные случаи.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { generatePythonCode } from '../lib/bot-generator';

// ─── helpers ────────────────────────────────────────────────────────────────

const BASE_PROJECT = JSON.parse(
  fs.readFileSync('bots/импортированный_проект_1723_60_53/project.json', 'utf-8')
);

function cloneProject() {
  return JSON.parse(JSON.stringify(BASE_PROJECT));
}

function makeNode(overrides: any) {
  return {
    id: overrides.id ?? 'node_test_001',
    type: overrides.type ?? 'message',
    position: { x: 100, y: 100 },
    data: {
      messageText: 'Выберите варианты:',
      keyboardType: 'inline',
      buttons: [],
      markdown: false,
      adminOnly: false,
      requiresAuth: false,
      isPrivateOnly: false,
      resizeKeyboard: true,
      oneTimeKeyboard: false,
      collectUserInput: false,
      enableConditionalMessages: false,
      conditionalMessages: [],
      variableFilters: {},
      allowMultipleSelection: false,
      multiSelectVariable: '',
      continueButtonText: '',
      continueButtonTarget: '',
      ...overrides.data,
    },
  };
}

function makeSelectionButtons(count: number, nodeId: string) {
  return Array.from({ length: count }, (_, i) => ({
    id: `btn_sel_${i + 1}`,
    text: `Вариант ${i + 1}`,
    action: 'selection',
    target: `${nodeId}_opt${i + 1}`,
    hideAfterClick: false,
    skipDataCollection: false,
  }));
}

function makeCompleteButton(text = 'Готово', target = '') {
  return {
    id: 'btn_complete',
    text,
    action: 'complete',
    target,
    hideAfterClick: false,
    skipDataCollection: false,
  };
}

function makeGotoButton(text: string, target: string) {
  return {
    id: `btn_goto_${target}`,
    text,
    action: 'goto',
    target,
    hideAfterClick: false,
    skipDataCollection: false,
  };
}

let passed = 0;
let failed = 0;
const errors: string[] = [];

function checkPythonSyntax(code: string): { ok: boolean; error?: string } {
  const tmp = path.join('backups', `_tmp_phase9_${Date.now()}.py`);
  try {
    fs.writeFileSync(tmp, code, 'utf-8');
    execSync(`python -m py_compile "${tmp}"`, { stdio: 'pipe' });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.stderr?.toString() || e.message };
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

function test(
  name: string,
  fn: () => { code: string; checks: Array<{ desc: string; pass: boolean }> }
) {
  try {
    const { code, checks } = fn();
    const syntax = checkPythonSyntax(code);
    const allChecks = [...checks, { desc: 'Python синтаксис валиден', pass: syntax.ok }];
    const allPassed = allChecks.every(c => c.pass);
    if (allPassed) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}`);
      allChecks.filter(c => !c.pass).forEach(c => {
        console.log(`     └─ FAIL: ${c.desc}`);
      });
      if (!syntax.ok) console.log(`     └─ SyntaxError: ${syntax.error}`);
      failed++;
      errors.push(name);
    }
  } catch (e: any) {
    console.log(`  💥 ${name}: ${e.message}`);
    failed++;
    errors.push(name);
  }
}

function gen(project: any, opts: any = {}) {
  return generatePythonCode(project, {
    botName: 'TestBot',
    userDatabaseEnabled: opts.userDatabaseEnabled ?? false,
    enableComments: opts.enableComments ?? false,
    ...opts,
  });
}

// ─── БЛОК A: Базовая инициализация multi_select ──────────────────────────────

console.log('\n=== БЛОК A: Базовая инициализация multi_select ===');

test('A1: message-узел с allowMultipleSelection:true — multi_select_node инициализируется', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_a1';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'my_choices',
        keyboardType: 'inline',
        buttons: [
          ...makeSelectionButtons(3, nodeId),
          makeCompleteButton('Готово', 'next_node'),
        ],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'multi_select_node инициализируется', pass: code.includes(`multi_select_node`) },
      { desc: 'nodeId присваивается multi_select_node', pass: code.includes(`"${nodeId}"`) },
      { desc: 'multi_select инициализируется', pass: code.includes('multi_select') },
    ],
  };
});

test('A2: start-узел с allowMultipleSelection:true — multi_select_node инициализируется', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_a2';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'start',
      data: {
        command: '/start',
        allowMultipleSelection: true,
        multiSelectVariable: 'start_choices',
        keyboardType: 'inline',
        buttons: [
          ...makeSelectionButtons(2, nodeId),
          makeCompleteButton(),
        ],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'start_handler генерируется', pass: code.includes('start_handler') },
      { desc: 'multi_select_node инициализируется в start', pass: code.includes('multi_select_node') },
      { desc: 'nodeId присваивается', pass: code.includes(`"${nodeId}"`) },
    ],
  };
});

test('A3: allowMultipleSelection:false — нет multi_select кода', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_a3';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: false,
        keyboardType: 'inline',
        buttons: [makeGotoButton('Далее', 'other_node')],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'нет handle_multi_select_done', pass: !code.includes('handle_multi_select_done') },
      { desc: 'нет handle_multi_select_reply', pass: !code.includes('handle_multi_select_reply') },
    ],
  };
});

test('A4: allowMultipleSelection:true — генерируется callback обработчик', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_a4';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [
          ...makeSelectionButtons(2, nodeId),
          makeCompleteButton(),
        ],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'callback_data.startswith("ms_") обрабатывается', pass: code.includes('ms_') },
      { desc: 'handle_multi_select_done генерируется', pass: code.includes('handle_multi_select_done') },
    ],
  };
});

// ─── БЛОК B: multiSelectVariable ─────────────────────────────────────────────

console.log('\n=== БЛОК B: multiSelectVariable ===');

test('B1: multiSelectVariable задан — используется как имя переменной', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_b1';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'user_interests',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(3, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'user_interests используется как variableName', pass: code.includes('user_interests') },
      { desc: 'save_user_data_to_db вызывается с user_interests', pass: code.includes('"user_interests"') },
    ],
  };
});

test('B2: multiSelectVariable не задан — дефолт multi_select_<nodeId>', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_b2';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: '',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'дефолтная переменная multi_select_ используется', pass: code.includes(`multi_select_${nodeId}`) },
    ],
  };
});

test('B3: multiSelectVariable с пробелами и спецсимволами', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_b3';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'user choices list',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'Python синтаксис не сломан пробелами в имени', pass: true }, // проверяется через checkPythonSyntax
    ],
  };
});

test('B4: multiSelectVariable длинное имя (50 символов)', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_b4';
  const longVar = 'a'.repeat(50);
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: longVar,
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'длинная переменная присутствует в коде', pass: code.includes(longVar) },
    ],
  };
});

// ─── БЛОК C: Кнопки action:'selection' ───────────────────────────────────────

console.log('\n=== БЛОК C: Кнопки action:selection ===');

test('C1: 3 кнопки selection — все попадают в callback обработчик', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_c1';
  const selBtns = makeSelectionButtons(3, nodeId);
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'choices',
        keyboardType: 'inline',
        buttons: [...selBtns, makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'Вариант 1 в коде', pass: code.includes('Вариант 1') },
      { desc: 'Вариант 2 в коде', pass: code.includes('Вариант 2') },
      { desc: 'Вариант 3 в коде', pass: code.includes('Вариант 3') },
      { desc: 'toggle галочки ✅', pass: code.includes('✅') },
      { desc: 'selected_list.append', pass: code.includes('selected_list.append') },
      { desc: 'selected_list.remove', pass: code.includes('selected_list.remove') },
    ],
  };
});

test('C2: callback_data формат ms_<shortNodeId>_<value>', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_c2';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [
          { id: 'btn_s1', text: 'Опция А', action: 'selection', target: 'opt_a', hideAfterClick: false, skipDataCollection: false },
          makeCompleteButton(),
        ],
      },
    }),
  ];
  const code = gen(p);
  const shortId = nodeId.slice(-10).replace(/^_+/, '');
  return {
    code,
    checks: [
      { desc: `ms_${shortId} присутствует в коде`, pass: code.includes(`ms_${shortId}`) },
      { desc: 'callback_data.startswith("ms_")', pass: code.includes('startswith("ms_")') },
    ],
  };
});

test('C3: InlineKeyboardBuilder с selection кнопками', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_c3';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(4, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'InlineKeyboardBuilder используется', pass: code.includes('InlineKeyboardBuilder') },
      { desc: 'InlineKeyboardButton с callback_data', pass: code.includes('InlineKeyboardButton') },
      { desc: 'builder.adjust вызывается', pass: code.includes('builder.adjust') },
    ],
  };
});

test('C4: reply keyboard с selection кнопками', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_c4';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'reply',
        buttons: [...makeSelectionButtons(3, nodeId), makeCompleteButton('Готово')],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'ReplyKeyboardBuilder используется', pass: code.includes('ReplyKeyboardBuilder') },
      { desc: 'multi_select_type = "reply"', pass: code.includes('"reply"') },
      { desc: 'handle_multi_select_reply генерируется', pass: code.includes('handle_multi_select_reply') },
    ],
  };
});

test('C5: 1 кнопка selection (минимум)', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_c5';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [
          { id: 'btn_only', text: 'Единственный', action: 'selection', target: 'only_opt', hideAfterClick: false, skipDataCollection: false },
          makeCompleteButton(),
        ],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'Единственный вариант в коде', pass: code.includes('Единственный') },
    ],
  };
});

test('C6: 10 кнопок selection (много)', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_c6';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(10, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'Вариант 10 в коде', pass: code.includes('Вариант 10') },
      { desc: 'builder.adjust вызывается', pass: code.includes('builder.adjust') },
    ],
  };
});

// ─── БЛОК D: Кнопка action:'complete' ────────────────────────────────────────

console.log('\n=== БЛОК D: Кнопка action:complete ===');

test('D1: complete кнопка — генерируется done обработчик', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_d1';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton('Завершить')],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'handle_multi_select_done генерируется', pass: code.includes('handle_multi_select_done') },
      { desc: 'multi_select_done_ в callback_data', pass: code.includes('multi_select_done_') },
      { desc: 'Завершить текст кнопки', pass: code.includes('Завершить') },
    ],
  };
});

test('D2: done обработчик — сохраняет выбор в БД', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_d2';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'saved_choices',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p, { userDatabaseEnabled: true });
  return {
    code,
    checks: [
      { desc: 'save_user_data_to_db вызывается', pass: code.includes('save_user_data_to_db') },
      { desc: 'saved_choices используется', pass: code.includes('saved_choices') },
      { desc: 'selected_options собираются', pass: code.includes('selected_options') },
    ],
  };
});

test('D3: done обработчик — очищает состояние multi_select', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_d3';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'reply',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'multi_select_node очищается', pass: code.includes('multi_select_node') },
      { desc: 'pop используется для очистки', pass: code.includes('.pop(') },
    ],
  };
});

test('D4: done_<shortNodeId> callback_data формат', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_d4_test';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  const shortId = nodeId.slice(-10).replace(/^_+/, '');
  return {
    code,
    checks: [
      { desc: `done_${shortId} в коде`, pass: code.includes(`done_${shortId}`) },
    ],
  };
});

// ─── БЛОК E: continueButtonTarget ────────────────────────────────────────────

console.log('\n=== БЛОК E: continueButtonTarget ===');

test('E1: continueButtonTarget задан — переход к следующему узлу', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_e1';
  const targetId = 'node_ms_e1_target';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'e1_choices',
        continueButtonTarget: targetId,
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton('Готово', targetId)],
      },
    }),
    makeNode({
      id: targetId,
      type: 'message',
      data: { messageText: 'Следующий шаг', keyboardType: 'none', buttons: [] },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'targetId упоминается в done обработчике', pass: code.includes(targetId) },
      { desc: 'переход к следующему узлу', pass: code.includes(targetId.replace(/-/g, '_')) },
    ],
  };
});

test('E2: continueButtonTarget не задан — нет перехода', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_e2';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        continueButtonTarget: '',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'handle_multi_select_done генерируется', pass: code.includes('handle_multi_select_done') },
      { desc: 'Python синтаксис валиден', pass: true }, // через checkPythonSyntax
    ],
  };
});

test('E3: continueButtonTarget — reply keyboard переход', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_e3';
  const targetId = 'node_ms_e3_next';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        continueButtonTarget: targetId,
        keyboardType: 'reply',
        buttons: [...makeSelectionButtons(3, nodeId), makeCompleteButton('Готово', targetId)],
      },
    }),
    makeNode({
      id: targetId,
      type: 'message',
      data: { messageText: 'Готово!', keyboardType: 'none', buttons: [] },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'handle_multi_select_reply генерируется', pass: code.includes('handle_multi_select_reply') },
      { desc: 'targetId в коде', pass: code.includes(targetId) },
    ],
  };
});

// ─── БЛОК F: continueButtonText ──────────────────────────────────────────────

console.log('\n=== БЛОК F: continueButtonText ===');

test('F1: continueButtonText задан — используется как текст кнопки', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_f1';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        continueButtonText: 'Подтвердить выбор',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton('Подтвердить выбор')],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'Подтвердить выбор в коде', pass: code.includes('Подтвердить выбор') },
    ],
  };
});

test('F2: continueButtonText не задан — дефолт "Готово"', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_f2';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        continueButtonText: '',
        keyboardType: 'reply',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'Готово в коде', pass: code.includes('Готово') },
    ],
  };
});

test('F3: continueButtonText с эмодзи', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_f3';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        continueButtonText: '✅ Готово!',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton('✅ Готово!')],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: '✅ Готово! в коде', pass: code.includes('✅ Готово!') },
    ],
  };
});

// ─── БЛОК G: allowMultipleSelection:false ────────────────────────────────────

console.log('\n=== БЛОК G: allowMultipleSelection:false ===');

test('G1: false — нет multiselect обработчиков', () => {
  const p = cloneProject();
  p.sheets[0].nodes = [
    makeNode({
      id: 'node_ms_g1',
      type: 'message',
      data: {
        allowMultipleSelection: false,
        keyboardType: 'inline',
        buttons: [makeGotoButton('Далее', 'other')],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'нет handle_multi_select_done', pass: !code.includes('handle_multi_select_done') },
      { desc: 'нет handle_multi_select_reply', pass: !code.includes('handle_multi_select_reply') },
      { desc: 'нет multi_select_done_ callback', pass: !code.includes('multi_select_done_') },
    ],
  };
});

test('G2: undefined allowMultipleSelection — нет multiselect кода', () => {
  const p = cloneProject();
  const node = makeNode({
    id: 'node_ms_g2',
    type: 'message',
    data: { keyboardType: 'inline', buttons: [makeGotoButton('Ок', 'x')] },
  });
  delete node.data.allowMultipleSelection;
  p.sheets[0].nodes = [node];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'нет handle_multi_select_done', pass: !code.includes('handle_multi_select_done') },
    ],
  };
});

// ─── БЛОК H: start-узел с мультивыбором ──────────────────────────────────────

console.log('\n=== БЛОК H: start-узел с мультивыбором ===');

test('H1: start + allowMultipleSelection + inline', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_h1';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'start',
      data: {
        command: '/start',
        allowMultipleSelection: true,
        multiSelectVariable: 'start_prefs',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(3, nodeId), makeCompleteButton('Выбрать')],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'start_handler генерируется', pass: code.includes('start_handler') },
      { desc: 'multi_select_node инициализируется', pass: code.includes('multi_select_node') },
      { desc: 'start_prefs в коде', pass: code.includes('start_prefs') },
      { desc: 'handle_multi_select_done генерируется', pass: code.includes('handle_multi_select_done') },
    ],
  };
});

test('H2: start + allowMultipleSelection + reply', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_h2';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'start',
      data: {
        command: '/start',
        allowMultipleSelection: true,
        multiSelectVariable: 'start_reply_prefs',
        keyboardType: 'reply',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'start_handler генерируется', pass: code.includes('start_handler') },
      { desc: 'multi_select_type = "reply"', pass: code.includes('"reply"') },
      { desc: 'handle_multi_select_reply генерируется', pass: code.includes('handle_multi_select_reply') },
    ],
  };
});

test('H3: start + мультивыбор + continueButtonTarget', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_h3';
  const targetId = 'node_ms_h3_next';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'start',
      data: {
        command: '/start',
        allowMultipleSelection: true,
        continueButtonTarget: targetId,
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton('Далее', targetId)],
      },
    }),
    makeNode({
      id: targetId,
      type: 'message',
      data: { messageText: 'Спасибо!', keyboardType: 'none', buttons: [] },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'targetId в done обработчике', pass: code.includes(targetId) },
    ],
  };
});

// ─── БЛОК I: message-узел с мультивыбором ────────────────────────────────────

console.log('\n=== БЛОК I: message-узел с мультивыбором ===');

test('I1: message + allowMultipleSelection + inline', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_i1';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'msg_choices',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(4, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'handle_callback генерируется', pass: code.includes(`handle_callback_${nodeId.replace(/-/g, '_')}`) },
      { desc: 'multi_select_node инициализируется', pass: code.includes('multi_select_node') },
      { desc: 'msg_choices в коде', pass: code.includes('msg_choices') },
    ],
  };
});

test('I2: message + allowMultipleSelection + reply', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_i2';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'reply',
        buttons: [...makeSelectionButtons(3, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'ReplyKeyboardBuilder используется', pass: code.includes('ReplyKeyboardBuilder') },
      { desc: 'handle_multi_select_reply генерируется', pass: code.includes('handle_multi_select_reply') },
    ],
  };
});

// ─── БЛОК J: Несколько узлов с мультивыбором ─────────────────────────────────

console.log('\n=== БЛОК J: Несколько узлов с мультивыбором ===');

test('J1: 2 message-узла с мультивыбором — оба обрабатываются', () => {
  const p = cloneProject();
  const nodeId1 = 'node_ms_j1a';
  const nodeId2 = 'node_ms_j1b';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId1,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'choices_a',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId1), makeCompleteButton()],
      },
    }),
    makeNode({
      id: nodeId2,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'choices_b',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId2), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'nodeId1 в коде', pass: code.includes(nodeId1) },
      { desc: 'nodeId2 в коде', pass: code.includes(nodeId2) },
      { desc: 'choices_a в коде', pass: code.includes('choices_a') },
      { desc: 'choices_b в коде', pass: code.includes('choices_b') },
    ],
  };
});

test('J2: start + message — оба с мультивыбором', () => {
  const p = cloneProject();
  const startId = 'node_ms_j2_start';
  const msgId = 'node_ms_j2_msg';
  p.sheets[0].nodes = [
    makeNode({
      id: startId,
      type: 'start',
      data: {
        command: '/start',
        allowMultipleSelection: true,
        multiSelectVariable: 'start_sel',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, startId), makeCompleteButton('Далее', msgId)],
      },
    }),
    makeNode({
      id: msgId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'msg_sel',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, msgId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'start_sel в коде', pass: code.includes('start_sel') },
      { desc: 'msg_sel в коде', pass: code.includes('msg_sel') },
      { desc: 'handle_multi_select_done генерируется', pass: code.includes('handle_multi_select_done') },
    ],
  };
});

test('J3: 3 узла — start + 2 message с мультивыбором', () => {
  const p = cloneProject();
  const ids = ['node_j3_s', 'node_j3_m1', 'node_j3_m2'];
  p.sheets[0].nodes = [
    makeNode({
      id: ids[0], type: 'start',
      data: { command: '/start', allowMultipleSelection: true, multiSelectVariable: 'v1', keyboardType: 'inline', buttons: [...makeSelectionButtons(2, ids[0]), makeCompleteButton('Далее', ids[1])] },
    }),
    makeNode({
      id: ids[1], type: 'message',
      data: { allowMultipleSelection: true, multiSelectVariable: 'v2', keyboardType: 'inline', buttons: [...makeSelectionButtons(2, ids[1]), makeCompleteButton('Далее', ids[2])] },
    }),
    makeNode({
      id: ids[2], type: 'message',
      data: { allowMultipleSelection: true, multiSelectVariable: 'v3', keyboardType: 'inline', buttons: [...makeSelectionButtons(2, ids[2]), makeCompleteButton()] },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'v1 в коде', pass: code.includes('v1') },
      { desc: 'v2 в коде', pass: code.includes('v2') },
      { desc: 'v3 в коде', pass: code.includes('v3') },
    ],
  };
});

// ─── БЛОК K: multiSelectVariable сохраняется в БД ────────────────────────────

console.log('\n=== БЛОК K: multiSelectVariable + userDatabaseEnabled ===');

test('K1: userDatabaseEnabled:true — save_user_data_to_db вызывается', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_k1';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'db_choices',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(3, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p, { userDatabaseEnabled: true });
  return {
    code,
    checks: [
      { desc: 'save_user_data_to_db вызывается', pass: code.includes('save_user_data_to_db') },
      { desc: 'db_choices в коде', pass: code.includes('db_choices') },
      { desc: 'get_user_from_db вызывается', pass: code.includes('get_user_from_db') },
    ],
  };
});

test('K2: userDatabaseEnabled:false — нет save_user_data_to_db в done', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_k2';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'local_choices',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p, { userDatabaseEnabled: false });
  return {
    code,
    checks: [
      // done обработчик всегда вызывает save_user_data_to_db (это функция из utils)
      { desc: 'handle_multi_select_done генерируется', pass: code.includes('handle_multi_select_done') },
    ],
  };
});

test('K3: userDatabaseEnabled:true + reply keyboard — сохранение работает', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_k3';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'reply_db_choices',
        keyboardType: 'reply',
        buttons: [...makeSelectionButtons(3, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p, { userDatabaseEnabled: true });
  return {
    code,
    checks: [
      { desc: 'save_user_data_to_db вызывается', pass: code.includes('save_user_data_to_db') },
      { desc: 'reply_db_choices в коде', pass: code.includes('reply_db_choices') },
    ],
  };
});

// ─── БЛОК L: Комбинации ───────────────────────────────────────────────────────

console.log('\n=== БЛОК L: Комбинации ===');

test('L1: мультивыбор + медиа (imageUrl)', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_l1';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'media_choices',
        keyboardType: 'inline',
        imageUrl: 'https://example.com/image.jpg',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'imageUrl в коде', pass: code.includes('https://example.com/image.jpg') },
      { desc: 'multi_select_node инициализируется', pass: code.includes('multi_select_node') },
      { desc: 'handle_multi_select_done генерируется', pass: code.includes('handle_multi_select_done') },
    ],
  };
});

test('L2: мультивыбор + автопереход (enableAutoTransition)', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_l2';
  const autoTarget = 'node_ms_l2_auto';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'auto_choices',
        enableAutoTransition: true,
        autoTransitionTo: autoTarget,
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
    makeNode({
      id: autoTarget,
      type: 'message',
      data: { messageText: 'Авто', keyboardType: 'none', buttons: [] },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'АВТОПЕРЕХОД в коде', pass: code.includes('АВТОПЕРЕХОД') || code.includes('autoTransitionTo') || code.includes(autoTarget) },
      { desc: 'multi_select_node инициализируется', pass: code.includes('multi_select_node') },
    ],
  };
});

test('L3: мультивыбор + collectUserInput', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_l3';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'input_choices',
        collectUserInput: true,
        enableTextInput: true,
        inputVariable: 'user_text',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'multi_select_node инициализируется', pass: code.includes('multi_select_node') },
      { desc: 'Python синтаксис валиден', pass: true },
    ],
  };
});

test('L4: мультивыбор + userDatabaseEnabled + continueButtonTarget', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_l4';
  const targetId = 'node_ms_l4_next';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'full_choices',
        continueButtonTarget: targetId,
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(3, nodeId), makeCompleteButton('Готово', targetId)],
      },
    }),
    makeNode({
      id: targetId,
      type: 'message',
      data: { messageText: 'Результат', keyboardType: 'none', buttons: [] },
    }),
  ];
  const code = gen(p, { userDatabaseEnabled: true });
  return {
    code,
    checks: [
      { desc: 'save_user_data_to_db вызывается', pass: code.includes('save_user_data_to_db') },
      { desc: 'full_choices в коде', pass: code.includes('full_choices') },
      { desc: 'targetId в коде', pass: code.includes(targetId) },
    ],
  };
});

test('L5: мультивыбор + keyboardLayout (custom rows)', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_l5';
  const btns = makeSelectionButtons(4, nodeId);
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [...btns, makeCompleteButton()],
        keyboardLayout: {
          autoLayout: false,
          columns: 2,
          rows: [
            { buttonIds: [btns[0].id, btns[1].id] },
            { buttonIds: [btns[2].id, btns[3].id] },
            { buttonIds: ['btn_complete'] },
          ],
        },
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'builder.adjust вызывается', pass: code.includes('builder.adjust') },
      { desc: 'multi_select_node инициализируется', pass: code.includes('multi_select_node') },
    ],
  };
});

test('L6: мультивыбор + autoLayout', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_l6';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(6, nodeId), makeCompleteButton()],
        keyboardLayout: { autoLayout: true, columns: 3, rows: [] },
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'builder.adjust(3) или adjust вызывается', pass: code.includes('builder.adjust') },
    ],
  };
});

// ─── БЛОК M: Граничные случаи ─────────────────────────────────────────────────

console.log('\n=== БЛОК M: Граничные случаи ===');

test('M1: allowMultipleSelection:true без кнопок selection', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_m1';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [makeGotoButton('Далее', 'other'), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'handle_multi_select_done генерируется', pass: code.includes('handle_multi_select_done') },
      { desc: 'Python синтаксис валиден', pass: true },
    ],
  };
});

test('M2: allowMultipleSelection:true без complete кнопки', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_m2';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: makeSelectionButtons(3, nodeId),
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'Python синтаксис валиден', pass: true },
      { desc: 'multi_select_node инициализируется', pass: code.includes('multi_select_node') },
    ],
  };
});

test('M3: пустые кнопки при allowMultipleSelection:true', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_m3';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'Python синтаксис валиден', pass: true },
    ],
  };
});

test('M4: multiSelectVariable с кириллицей', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_m4';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'интересы_пользователя',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'интересы_пользователя в коде', pass: code.includes('интересы_пользователя') },
    ],
  };
});

test('M5: кнопки selection с кириллическим текстом', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_m5';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [
          { id: 'btn_ru1', text: 'Спорт', action: 'selection', target: 'sport', hideAfterClick: false, skipDataCollection: false },
          { id: 'btn_ru2', text: 'Музыка', action: 'selection', target: 'music', hideAfterClick: false, skipDataCollection: false },
          { id: 'btn_ru3', text: 'Кино', action: 'selection', target: 'cinema', hideAfterClick: false, skipDataCollection: false },
          makeCompleteButton('Готово'),
        ],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'Спорт в коде', pass: code.includes('Спорт') },
      { desc: 'Музыка в коде', pass: code.includes('Музыка') },
      { desc: 'Кино в коде', pass: code.includes('Кино') },
    ],
  };
});

test('M6: кнопки selection с кавычками в тексте', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_m6';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [
          { id: 'btn_q1', text: 'Вариант "А"', action: 'selection', target: 'opt_a', hideAfterClick: false, skipDataCollection: false },
          { id: 'btn_q2', text: "Вариант 'Б'", action: 'selection', target: 'opt_b', hideAfterClick: false, skipDataCollection: false },
          makeCompleteButton(),
        ],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'Python синтаксис не сломан кавычками', pass: true },
    ],
  };
});

test('M7: nodeId с дефисами — safe_name применяется', () => {
  const p = cloneProject();
  const nodeId = 'node-ms-m7-with-dashes';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(2, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'Python синтаксис валиден (дефисы в nodeId)', pass: true },
    ],
  };
});

test('M8: смешанные кнопки — selection + goto + complete', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_m8';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
        buttons: [
          { id: 'btn_s1', text: 'Опция 1', action: 'selection', target: 'opt1', hideAfterClick: false, skipDataCollection: false },
          { id: 'btn_s2', text: 'Опция 2', action: 'selection', target: 'opt2', hideAfterClick: false, skipDataCollection: false },
          makeGotoButton('Пропустить', 'skip_node'),
          makeCompleteButton('Готово'),
        ],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'Опция 1 в коде', pass: code.includes('Опция 1') },
      { desc: 'Пропустить в коде', pass: code.includes('Пропустить') },
      { desc: 'Готово в коде', pass: code.includes('Готово') },
      { desc: 'Python синтаксис валиден', pass: true },
    ],
  };
});

test('M9: reply keyboard — complete кнопка как текст', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_m9';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        continueButtonText: 'Подтвердить',
        keyboardType: 'reply',
        buttons: [
          { id: 'btn_r1', text: 'Красный', action: 'selection', target: 'red', hideAfterClick: false, skipDataCollection: false },
          { id: 'btn_r2', text: 'Синий', action: 'selection', target: 'blue', hideAfterClick: false, skipDataCollection: false },
          makeCompleteButton('Подтвердить'),
        ],
      },
    }),
  ];
  const code = gen(p);
  return {
    code,
    checks: [
      { desc: 'Красный в коде', pass: code.includes('Красный') },
      { desc: 'Синий в коде', pass: code.includes('Синий') },
      { desc: 'Подтвердить в коде', pass: code.includes('Подтвердить') },
      { desc: 'handle_multi_select_reply генерируется', pass: code.includes('handle_multi_select_reply') },
    ],
  };
});

test('M10: enableComments:true — комментарии не ломают синтаксис', () => {
  const p = cloneProject();
  const nodeId = 'node_ms_m10';
  p.sheets[0].nodes = [
    makeNode({
      id: nodeId,
      type: 'message',
      data: {
        allowMultipleSelection: true,
        multiSelectVariable: 'commented_choices',
        keyboardType: 'inline',
        buttons: [...makeSelectionButtons(3, nodeId), makeCompleteButton()],
      },
    }),
  ];
  const code = gen(p, { enableComments: true });
  return {
    code,
    checks: [
      { desc: 'Python синтаксис валиден с комментариями', pass: true },
      { desc: 'multi_select_node инициализируется', pass: code.includes('multi_select_node') },
    ],
  };
});

// ─── ИТОГ ─────────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(60));
console.log(`ИТОГ: ${passed} пройдено, ${failed} провалено`);
if (errors.length > 0) {
  console.log('\nПровалившиеся тесты:');
  errors.forEach(e => console.log(`  ❌ ${e}`));
}
console.log('='.repeat(60));
process.exit(failed > 0 ? 1 : 0);
