/**
 * @fileoverview Чинит выражения парсинга Vortex и calc-btc (без generator expr)
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

const PAY_EXPR =
  "int('{vortex_payment_raw}'.replace(' ', '')) if '{vortex_payment_raw}'.strip() else 0";
const RUB_EXPR =
  "int('{vortex_rub_equiv_raw}'.replace(' ', '')) if '{vortex_rub_equiv_raw}'.strip() else 0";

const project = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf8'));

/** @param {string} nodeId */
function findNode(nodeId) {
  for (const sheet of project.sheets) {
    const node = sheet.nodes.find((n) => n.id === nodeId);
    if (node) return node;
  }
  throw new Error(`${nodeId} не найден`);
}

/** @param {object} node @param {string} id @param {object} patch */
function patchAssign(node, id, patch) {
  const list = node.data.assignments;
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) throw new Error(`${node.id}.${id} не найден`);
  list[idx] = { ...list[idx], ...patch };
}

const parseNode = findNode('bot-setv-parse-vortex');
patchAssign(parseNode, 'vx_payment', { mode: 'expression', value: PAY_EXPR });
patchAssign(parseNode, 'vx_rub_equiv', { mode: 'expression', value: RUB_EXPR });

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

const calcNode = findNode('bot-setv-calc-btc');
patchAssign(calcNode, 'btc_vortex_fmt_payment', {
  mode: 'format_number',
  value: '{vortex_payment_raw}',
  variable: 'vortex_payment_fmt',
});
patchAssign(calcNode, 'btc_vortex_lbl_payment', {
  mode: 'expression',
  variable: 'vortex_payment_label',
  value:
    "thousands(int('{vortex_payment_raw}'.replace(' ', ''))) + ' ₽' if '{vortex_payment_raw}'.strip() and int('{vortex_payment_raw}'.replace(' ', '')) > 0 else '⚠️ н/д'",
});

/** format_number from raw digits */
patchAssign(calcNode, 'btc_vortex_fmt_payment', {
  mode: 'expression',
  variable: 'vortex_payment_fmt',
  value:
    "thousands(int('{vortex_payment_raw}'.replace(' ', ''))) if '{vortex_payment_raw}'.strip() else '0'",
});

/** comm_rate from raw */
patchAssign(calcNode, 'btc_vortex_comm_rate', {
  mode: 'expression',
  value:
    "int(round(int('{vortex_payment_raw}'.replace(' ', '')) / float({vortex_btc}))) if float({vortex_btc}) > 0 and '{vortex_payment_raw}'.strip() else int({vortex_rate})",
});

fs.writeFileSync(PROJECT_PATH, JSON.stringify(project, null, 2), 'utf8');

const check = parseNode.data.assignments.find((a) => a.id === 'vx_payment').value;
if (check.includes('join(c for c')) {
  console.error('FAIL: vx_payment still broken');
  process.exit(1);
}
console.log('OK:', check.slice(0, 60));
