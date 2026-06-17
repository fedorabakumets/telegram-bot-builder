/**
 * @fileoverview Пауза перед кошельком Vortex (1с) и таймаут BTC-сравнения (60с)
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

/** @param {string} nodeId @param {(branch: object) => void} fn */
function patchConditionBranch(nodeId, fn) {
  for (const sheet of project.sheets) {
    const node = sheet.nodes.find((n) => n.id === nodeId);
    if (!node || node.type !== 'condition') continue;
    for (const branch of node.data.branches || []) fn(branch);
    console.log(`OK: ${nodeId} на листе «${sheet.name}»`);
    return;
  }
  throw new Error(`condition ${nodeId} не найден`);
}

for (const sheet of project.sheets) {
  const delay = sheet.nodes.find((n) => n.id === 'bot-delay-vortex-before-wallet');
  if (delay) {
    delay.data.seconds = '5';
    console.log('OK: bot-delay-vortex-before-wallet → 5 сек');
  }
}

patchConditionBranch('bot-cond-btc-elapsed-timeout', (b) => {
  if (b.operator === 'greater_than' && b.value === '90') b.value = '60';
});

fs.writeFileSync(PROJECT_PATH, JSON.stringify(project, null, 2), 'utf8');
console.log('Готово');
