/**
 * @fileoverview Чинит парсинг Vortex: ожидание заявки на wallet + regex под жирный текст
 */

const fs = require('fs');
const path = require('path');

const PROJECT_PATH = path.join(
  __dirname,
  '..',
  'bots',
  'новый_бот_1_242_163',
  'project.json'
);

const project = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf8'));

/**
 * @param {string} sheetName
 * @param {string} nodeId
 * @param {object} patch
 */
function patchNode(sheetName, nodeId, patch) {
  const sheet = project.sheets.find((s) => s.name === sheetName);
  const node = sheet?.nodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`${nodeId} не найден`);
  node.data = { ...node.data, ...patch };
}

/**
 * @param {string} nodeId
 * @param {string} assignmentId
 * @param {object} assignment
 */
function upsertAssignment(nodeId, assignmentId, assignment) {
  for (const sheet of project.sheets) {
    const node = sheet.nodes.find((n) => n.id === nodeId);
    if (!node || node.type !== 'set_variable') continue;
    const list = node.data.assignments || (node.data.assignments = []);
    const idx = list.findIndex((a) => a.id === assignmentId);
    if (idx >= 0) list[idx] = { ...list[idx], ...assignment };
    else list.push({ id: assignmentId, ...assignment });
    return;
  }
  throw new Error(`set_variable ${nodeId} не найден`);
}

patchNode('💱 Боты · Vortex', 'bot-ub-vortex-wallet', {
  /** без saveResponseIdTo шаблон не ждёт ответ — vortex_text пустой */
  saveResponseIdTo: 'vortex_order_msg_id',
  saveResponseTextTo: 'vortex_text',
  responseStrategy: 'regex_match',
  responseFilterRegex: 'сумма к оплате|Создать зяв|создать заяв|С правилами',
  responseWaitSeconds: 20,
  responseFloorMessageIdVar: 'vortex_wallet_msg_id',
});

upsertAssignment('bot-setv-init', 'init_vortex_order_msg_id', {
  mode: 'text',
  value: '',
  variable: 'vortex_order_msg_id',
});

upsertAssignment('bot-setv-parse-vortex', 'vx_strip_bold', {
  mode: 'str_replace',
  value: '**',
  variable: 'vortex_text',
  replaceWith: '',
});

upsertAssignment('bot-setv-parse-vortex', 'vx_btc_raw', {
  mode: 'regex_extract',
  value: '{vortex_text}',
  pattern: '(?i)сумма\\s*:?\\s*([0-9.,]+)\\s*BTC',
  variable: 'vortex_btc_raw',
  regexGroup: '1',
});

upsertAssignment('bot-setv-parse-vortex', 'vx_pay_raw', {
  mode: 'regex_extract',
  value: '{vortex_text}',
  pattern: '(?i)сумма к оплате составит\\s*:?\\s*([0-9\\s.,]+)\\s*руб',
  variable: 'vortex_payment_raw',
  regexGroup: '1',
});

/** generator expression в _eval_expr не поддерживается — только replace как у scooby/hustle */
upsertAssignment('bot-setv-parse-vortex', 'vx_payment', {
  mode: 'expression',
  value:
    "int('{vortex_payment_raw}'.replace(' ', '')) if '{vortex_payment_raw}'.strip() else 0",
  variable: 'vortex_payment',
});

upsertAssignment('bot-setv-parse-vortex', 'vx_rub_equiv', {
  mode: 'expression',
  value:
    "int('{vortex_rub_equiv_raw}'.replace(' ', '')) if '{vortex_rub_equiv_raw}'.strip() else 0",
  variable: 'vortex_rub_equiv',
});

const parseNode = project.sheets
  .flatMap((s) => s.nodes)
  .find((n) => n.id === 'bot-setv-parse-vortex');
if (parseNode) {
  const order = [
    'vx_strip_star',
    'vx_strip_bold',
    'vx_strip_nbsp',
    'vx_btc_raw',
    'vx_rub_equiv_raw',
    'vx_pay_raw',
    'vx_btc',
    'vx_rub_equiv',
    'vx_payment',
    'vx_rate',
  ];
  const byId = Object.fromEntries(parseNode.data.assignments.map((a) => [a.id, a]));
  parseNode.data.assignments = order.filter((id) => byId[id]).map((id) => byId[id]);
}

fs.writeFileSync(PROJECT_PATH, JSON.stringify(project, null, 2), 'utf8');
console.log('OK: fix-vortex-parse');
