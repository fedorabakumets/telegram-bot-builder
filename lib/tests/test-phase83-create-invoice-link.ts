/**
 * @fileoverview Фазовые тесты узла create_invoice_link (phase83)
 *
 * A: create_invoice_link в коде, без answer_invoice для link-ноды
 * B: pre_checkout при одном только link
 * C: URL в переменную + afterPaymentTo в targets
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/**
 * Минимальный project.json
 * @param nodes - Узлы
 * @returns Проект
 */
function makeCleanProject(nodes: unknown[]) {
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

/**
 * Генерирует код и пишет во временный файл
 * @param nodes - Узлы
 * @returns Путь к файлу
 */
function generateToFile(nodes: unknown[]): string {
  const code = generatePythonCode(makeCleanProject(nodes) as any);
  const path = `lib/tests/_tmp_phase83_${Date.now()}.py`;
  fs.writeFileSync(path, code, 'utf8');
  return path;
}

/**
 * Читает файл и удаляет его
 * @param path - Путь
 * @returns Код
 */
function readAndCleanup(path: string): string {
  const code = fs.readFileSync(path, 'utf8');
  fs.unlinkSync(path);
  return code;
}

let passed = 0;
let failed = 0;

/**
 * Проверка условия
 * @param name - Имя
 * @param cond - Условие
 */
function check(name: string, cond: boolean) {
  if (cond) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    failed++;
  }
}

console.log('\n=== Phase 83: create_invoice_link ===\n');

console.log('A: Генерация create_invoice_link');
{
  const path = generateToFile([
    {
      id: 'cmd_buy',
      type: 'command_trigger',
      position: { x: 0, y: 0 },
      data: { command: '/buy', autoTransitionTo: 'link_1' },
    },
    {
      id: 'link_1',
      type: 'create_invoice_link',
      position: { x: 200, y: 0 },
      data: {
        invoiceTitle: 'Демо',
        invoiceDescription: '1 звезда',
        invoiceAmount: '1',
        saveInvoiceLinkTo: 'invoice_url',
        autoTransitionTo: 'msg_url',
        enableAutoTransition: true,
        afterPaymentTo: 'msg_thanks',
        savePaymentAmountTo: 'paid',
        savePaymentChargeIdTo: 'charge',
      },
    },
    {
      id: 'msg_url',
      type: 'message',
      position: { x: 400, y: 0 },
      data: { messageText: 'Оплатить: {invoice_url}', keyboardType: 'none', buttons: [] },
    },
    {
      id: 'msg_thanks',
      type: 'message',
      position: { x: 400, y: 100 },
      data: { messageText: 'Спасибо', keyboardType: 'none', buttons: [] },
    },
  ]);
  const code = readAndCleanup(path);
  check('есть create_invoice_link', code.includes('create_invoice_link'));
  check('вызов через глобальный bot (не MockCallback.bot)', code.includes('bot.create_invoice_link') && !code.includes('callback_query.bot.create_invoice_link'));
  check('нет answer_invoice для link-сценария', !code.includes('answer_invoice'));
  check('LabeledPrice импортирован', code.includes('LabeledPrice'));
  check('URL пишется в invoice_url', code.includes("user_data[user_id][\"invoice_url\"]"));
  check('afterPaymentTo в targets', code.includes('"next_node": "msg_thanks"') || code.includes("next_node\": \"msg_thanks\"") || code.includes("'next_node': 'msg_thanks'") || /"next_node":\s*"msg_thanks"/.test(code));
  check('pre_checkout есть', code.includes('pre_checkout_query'));
  check('переход после создания на msg_url', code.includes('handle_callback_msg_url') || code.includes('msg_url'));
}

console.log('\nB: Только link — pre_checkout без send_invoice');
{
  const path = generateToFile([
    {
      id: 'link_only',
      type: 'create_invoice_link',
      position: { x: 0, y: 0 },
      data: {
        invoiceTitle: 'T',
        invoiceDescription: 'D',
        invoiceAmount: '5',
        saveInvoiceLinkTo: 'url',
      },
    },
  ]);
  const code = readAndCleanup(path);
  check('pre_checkout при одном link', code.includes('on_pre_checkout_query_stars') || code.includes('pre_checkout_query'));
  check('create_invoice_link в коде', code.includes('create_invoice_link'));
  check('нет answer_invoice', !code.includes('answer_invoice'));
}

console.log('\nC: Синтаксис Python');
{
  const path = generateToFile([
    {
      id: 'link_1',
      type: 'create_invoice_link',
      position: { x: 0, y: 0 },
      data: {
        invoiceTitle: 'T',
        invoiceDescription: 'D',
        invoiceAmount: '1',
        saveInvoiceLinkTo: 'invoice_url',
        autoTransitionTo: 'msg_1',
        enableAutoTransition: true,
        afterPaymentTo: 'msg_2',
      },
    },
    {
      id: 'msg_1',
      type: 'message',
      position: { x: 200, y: 0 },
      data: { messageText: 'url', keyboardType: 'none', buttons: [] },
    },
    {
      id: 'msg_2',
      type: 'message',
      position: { x: 200, y: 100 },
      data: { messageText: 'paid', keyboardType: 'none', buttons: [] },
    },
  ]);
  try {
    execSync(`python -m py_compile "${path}"`, { stdio: 'pipe' });
    check('py_compile OK', true);
  } catch {
    check('py_compile OK', false);
  }
  readAndCleanup(path);
}

console.log('\nD: Подписка 30 дней');
{
  const path = generateToFile([
    {
      id: 'link_sub',
      type: 'create_invoice_link',
      position: { x: 0, y: 0 },
      data: {
        invoiceTitle: 'Sub',
        invoiceDescription: 'Month',
        invoiceAmount: '100',
        invoiceSubscription: true,
        saveInvoiceLinkTo: 'invoice_url',
      },
    },
  ]);
  const code = readAndCleanup(path);
  check('subscription_period в коде', code.includes('subscription_period'));
  check('период 2592000', code.includes('2592000'));
}
{
  const path = generateToFile([
    {
      id: 'link_once',
      type: 'create_invoice_link',
      position: { x: 0, y: 0 },
      data: {
        invoiceTitle: 'Once',
        invoiceDescription: 'D',
        invoiceAmount: '1',
        saveInvoiceLinkTo: 'url',
      },
    },
  ]);
  const code = readAndCleanup(path);
  check('без галки нет subscription_period', !code.includes('subscription_period'));
}

console.log(`\n=== Итого: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
