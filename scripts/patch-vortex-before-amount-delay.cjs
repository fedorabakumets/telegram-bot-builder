/**
 * @fileoverview Пауза 5 сек между «Введите сумму» и отправкой BTC в цепочке Vortex
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
const sheet = project.sheets.find((s) => s.name === '💱 Боты · Vortex');
if (!sheet) throw new Error('Лист Vortex не найден');

const delayId = 'bot-delay-vortex-before-amount';
const pay = sheet.nodes.find((n) => n.id === 'bot-ub-vortex-pay');
if (!pay) throw new Error('bot-ub-vortex-pay не найден');

pay.data.autoTransitionTo = delayId;

let delay = sheet.nodes.find((n) => n.id === delayId);
if (!delay) {
  delay = {
    id: delayId,
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
  };
  sheet.nodes.push(delay);
} else {
  delay.data.seconds = '5';
  delay.data.mode = 'blocking';
  delay.data.autoTransitionTo = 'bot-ub-vortex-amount-btc';
  delay.data.enableAutoTransition = true;
}

fs.writeFileSync(PROJECT_PATH, JSON.stringify(project, null, 2), 'utf8');
console.log('OK: pay → delay 5s → amount-btc');
