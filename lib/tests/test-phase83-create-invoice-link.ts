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

console.log('\nE: Фиат и подписка только XTR');
{
  const path = generateToFile([
    {
      id: 'link_eur',
      type: 'create_invoice_link',
      position: { x: 0, y: 0 },
      data: {
        invoiceTitle: 'Euro',
        invoiceDescription: 'D',
        invoiceAmount: '100',
        invoiceCurrency: 'EUR',
        invoiceProviderSource: 'inline',
        invoiceProviderToken: '2051:TEST:link',
        saveInvoiceLinkTo: 'invoice_url',
      },
    },
  ]);
  const code = readAndCleanup(path);
  check('EUR в коде ссылки', code.includes('"EUR"') || code.includes("'EUR'"));
  check('токен inline на ссылке', code.includes('2051:TEST:link'));
}
{
  const path = generateToFile([
    {
      id: 'link_eur_sub',
      type: 'create_invoice_link',
      position: { x: 0, y: 0 },
      data: {
        invoiceTitle: 'EuroSub',
        invoiceDescription: 'D',
        invoiceAmount: '100',
        invoiceCurrency: 'EUR',
        invoiceProviderSource: 'env',
        invoiceProviderTokenEnv: 'PAYMENT_PROVIDER_TOKEN',
        invoiceSubscription: true,
        saveInvoiceLinkTo: 'url',
      },
    },
  ]);
  const code = readAndCleanup(path);
  check('фиат: нет subscription_period даже с галкой', !code.includes('subscription_period'));
  check('фиат env: getenv', code.includes('os.getenv("PAYMENT_PROVIDER_TOKEN")'));
}
{
  const path = generateToFile([
    {
      id: 'link_eur_need',
      type: 'create_invoice_link',
      position: { x: 0, y: 0 },
      data: {
        invoiceTitle: 'EuroNeed',
        invoiceDescription: 'D',
        invoiceAmount: '100',
        invoiceCurrency: 'EUR',
        invoiceProviderSource: 'inline',
        invoiceProviderToken: '2051:TEST:need',
        invoiceNeedEmail: true,
        saveOrderEmailTo: 'buyer_email',
        saveInvoiceLinkTo: 'invoice_url',
      },
    },
  ]);
  const code = readAndCleanup(path);
  check('ссылка EUR: need_email', code.includes('need_email'));
  check(
    'ссылка: save_email_to в targets',
    code.includes('"save_email_to": "buyer_email"') || code.includes("'save_email_to': 'buyer_email'"),
  );
  check('ссылка: order_info после оплаты', code.includes('order_info'));
}

console.log('\nF: shop_need_* паритет с send_invoice');
{
  const path = generateToFile([
    {
      id: 'link_shop_need',
      type: 'create_invoice_link',
      position: { x: 0, y: 0 },
      data: {
        invoiceTitle: 'Shop',
        invoiceDescription: 'D',
        invoiceAmount: '100',
        invoiceCurrency: 'EUR',
        invoiceProviderSource: 'inline',
        invoiceProviderToken: '2051:TEST:shop',
        saveInvoiceLinkTo: 'invoice_url',
      },
    },
  ]);
  const code = readAndCleanup(path);
  // Берём только блок create_invoice_link (после маркера), не ветку send_invoice
  const linkIdx = code.indexOf('# Обработчики ссылок на счёт');
  const linkBlock = linkIdx >= 0 ? code.slice(linkIdx) : code;
  check('link: shop_need_name', linkBlock.includes('shop_need_name'));
  check('link: shop_need_email', linkBlock.includes('shop_need_email'));
  check('link: shop_need_phone', linkBlock.includes('shop_need_phone'));
  check('link: shop_need_shipping', linkBlock.includes('shop_need_shipping'));
  check('link: shop_need_photo', linkBlock.includes('shop_need_photo'));
  check('link: need_shipping_address', linkBlock.includes('need_shipping_address'));
  check('link: shipping_query хендлер', code.includes('shipping_query') || code.includes('on_shipping_query'));
}

console.log('\nG: платёжное ядро + prices[] на create_invoice_link');
{
  const path = generateToFile([
    {
      id: 'link_pay_core',
      type: 'create_invoice_link',
      position: { x: 0, y: 0 },
      data: {
        invoiceTitle: 'Bundle',
        invoiceDescription: 'D',
        invoiceCurrency: 'EUR',
        invoiceProviderSource: 'inline',
        invoiceProviderToken: '2051:TEST:core',
        invoiceNeedShipping: true,
        invoiceIsFlexible: true,
        invoiceMaxTipAmount: '30',
        invoiceSuggestedTipAmounts: '5,10,15',
        invoiceProviderData: '{"sku":"A"}',
        invoicePrices: [
          { id: 'a', label: 'Item A', amount: '200' },
          { id: 'b', label: 'Item B', amount: '50' },
        ],
        saveInvoiceLinkTo: 'invoice_url',
        autoTransitionTo: 'msg1',
        enableAutoTransition: true,
      },
    },
    {
      id: 'msg1',
      type: 'message',
      position: { x: 400, y: 0 },
      data: { messageText: 'ok', buttons: [], keyboardType: 'none' },
    },
  ]);
  const code = readAndCleanup(path);
  const linkIdx = code.indexOf('# Обработчики ссылок на счёт');
  const linkBlock = linkIdx >= 0 ? code.slice(linkIdx) : code;
  check('link: need_shipping_address (нода)', linkBlock.includes('need_shipping_address'));
  check('link: is_flexible', linkBlock.includes('is_flexible'));
  check('link: max_tip_amount', linkBlock.includes('max_tip_amount'));
  check('link: suggested_tip_amounts', linkBlock.includes('suggested_tip_amounts'));
  check('link: provider_data', linkBlock.includes('provider_data'));
  const labeledCount = (linkBlock.match(/LabeledPrice\(/g) || []).length;
  check('link: ≥2 LabeledPrice из prices[]', labeledCount >= 2);
  check('link: label Item A', linkBlock.includes('Item A'));
  check('link: label Item B', linkBlock.includes('Item B'));
}

console.log(`\n=== Итого: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
