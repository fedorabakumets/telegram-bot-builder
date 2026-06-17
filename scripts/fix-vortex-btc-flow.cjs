/**
 * @fileoverview Удаляет устаревшие Vortex-ноды из Legacy 3 и чинит BTC-flow на листе Vortex
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

/** ID нод старой RUB-цепочки Vortex на листе Legacy 3 */
const LEGACY_VORTEX_IDS = new Set([
  'bot-ub-vortex-start',
  'bot-ub-vortex-buy',
  'bot-ub-vortex-btc',
  'bot-ub-vortex-pay',
  'bot-ub-vortex-amount',
  'bot-ub-vortex-wallet1',
  'bot-ub-vortex-address',
]);

/**
 * Обновляет data узла по id на указанном листе
 * @param {object} project - project.json
 * @param {string} sheetName - имя листа
 * @param {string} nodeId - id узла
 * @param {object} patch - поля data для merge
 */
function patchNode(project, sheetName, nodeId, patch) {
  const sheet = project.sheets.find((s) => s.name === sheetName);
  if (!sheet) throw new Error(`Лист не найден: ${sheetName}`);
  const node = sheet.nodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`Узел ${nodeId} не найден на листе ${sheetName}`);
  node.data = { ...node.data, ...patch };
}

const project = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf8'));

const legacySheet = project.sheets.find((s) => s.name === '💱 Боты · Legacy 3');
if (!legacySheet) throw new Error('Лист Legacy 3 не найден');

const before = legacySheet.nodes.length;
legacySheet.nodes = legacySheet.nodes.filter((n) => !LEGACY_VORTEX_IDS.has(n.id));
console.log(`Legacy 3: удалено ${before - legacySheet.nodes.length} vortex-нод`);

patchNode(project, '💱 Боты · Vortex', 'bot-ub-vortex-start', {
  waitSeconds: 2,
  responseStrategy: undefined,
  saveResponseIdTo: undefined,
});

patchNode(project, '💱 Боты · Vortex', 'bot-ub-vortex-buy', {
  /** last + пауза: «Выберите направление» приходит позже приветствия */
  responseStrategy: 'last',
  responseFilterRegex: undefined,
  responseWaitSeconds: 5,
  saveResponseIdTo: 'vortex_msg_id',
  waitSeconds: 1,
});

patchNode(project, '💱 Боты · Vortex', 'bot-ub-vortex-btc', {
  messageId: '{vortex_msg_id}',
  messageIdSource: 'manual',
  clickMode: 'index',
  clickValue: '0',
  clickDelivery: 'fire_and_forget',
  responseStrategy: 'edit',
  responseFilterRegex: 'способ оплаты|Текущий курс',
  responseWaitSeconds: 14,
  autoTransitionTo: 'bot-ub-vortex-pay',
});

patchNode(project, '💱 Боты · Vortex', 'bot-ub-vortex-pay', {
  messageId: '{vortex_msg_id}',
  clickMode: 'index',
  clickValue: '3',
  responseStrategy: 'edit',
  responseFilterRegex: 'Введите нужную сумму|минимальн',
  responseWaitSeconds: 14,
  autoTransitionTo: 'bot-delay-vortex-before-amount',
});

patchNode(project, '💱 Боты · Vortex', 'bot-ub-vortex-amount-btc', {
  responseStrategy: 'regex_match',
  responseFilterRegex: 'кошел|адрес|wallet',
  responseWaitSeconds: 14,
  autoTransitionTo: 'bot-delay-vortex-before-wallet',
});

patchNode(project, '💱 Боты · Vortex', 'bot-ub-vortex-wallet', {
  responseStrategy: 'regex_match',
  responseFilterRegex: 'сумма к оплате|Создать зяв|создать заяв|С правилами',
  responseWaitSeconds: 20,
  saveResponseIdTo: 'vortex_order_msg_id',
  saveResponseTextTo: 'vortex_text',
  responseFloorMessageIdVar: 'vortex_wallet_msg_id',
});

const vortexSheet = project.sheets.find((s) => s.name === '💱 Боты · Vortex');

const amountDelayId = 'bot-delay-vortex-before-amount';
if (!vortexSheet.nodes.some((n) => n.id === amountDelayId)) {
  vortexSheet.nodes.push({
    id: amountDelayId,
    type: 'delay',
    position: { x: 780, y: 480 },
    data: {
      buttons: [],
      markdown: false,
      adminOnly: false,
      showInMenu: false,
      messageText: '',
      seconds: '5',
      unit: 'seconds',
      mode: 'blocking',
      keyboardType: 'none',
      requiresAuth: false,
      isPrivateOnly: false,
      resizeKeyboard: true,
      oneTimeKeyboard: false,
      autoTransitionTo: 'bot-ub-vortex-amount-btc',
      enableStatistics: false,
      enableAutoTransition: true,
    },
  });
  console.log('Добавлена delay-нода', amountDelayId);
} else {
  patchNode(project, '💱 Боты · Vortex', amountDelayId, {
    seconds: '5',
    unit: 'seconds',
    mode: 'blocking',
    autoTransitionTo: 'bot-ub-vortex-amount-btc',
    enableAutoTransition: true,
  });
}

const delayId = 'bot-delay-vortex-before-wallet';
if (!vortexSheet.nodes.some((n) => n.id === delayId)) {
  vortexSheet.nodes.push({
    id: delayId,
    type: 'delay',
    position: { x: 780, y: 320 },
    data: {
      buttons: [],
      markdown: false,
      adminOnly: false,
      showInMenu: false,
      messageText: '',
      seconds: '5',
      unit: 'seconds',
      mode: 'blocking',
      keyboardType: 'none',
      requiresAuth: false,
      isPrivateOnly: false,
      resizeKeyboard: true,
      oneTimeKeyboard: false,
      autoTransitionTo: 'bot-ub-vortex-wallet',
      enableStatistics: false,
      enableAutoTransition: true,
    },
  });
  console.log('Добавлена delay-нода', delayId);
} else {
  patchNode(project, '💱 Боты · Vortex', delayId, {
    seconds: '5',
    unit: 'seconds',
    mode: 'blocking',
    autoTransitionTo: 'bot-ub-vortex-wallet',
    enableAutoTransition: true,
  });
}

fs.writeFileSync(PROJECT_PATH, JSON.stringify(project, null, 2), 'utf8');
console.log('OK: fix-vortex-btc-flow применён');
