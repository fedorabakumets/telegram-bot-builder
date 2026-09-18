/**
 * @fileoverview Фазовые тесты узла send_invoice (phase80)
 *
 * Блок A: Генерация счёта (answer_invoice, XTR, LabeledPrice)
 * Блок B: pre_checkout и successful_payment
 * Блок C: нет перехода сразу после отправки; импорт LabeledPrice
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/**
 * Собирает минимальный project.json для генерации
 * @param nodes - Узлы листа
 * @returns Объект проекта
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
 * Генерирует Python-код бота
 * @param project - Проект
 * @param label - Метка для имени бота
 * @returns Сгенерированный код
 */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase80_${label}`,
    userDatabaseEnabled: false,
  });
}

/**
 * Проверяет синтаксис Python через py_compile
 * @param code - Код
 * @param label - Метка временного файла
 * @returns Результат проверки
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p80_${label}.py`;
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

/**
 * Запускает один тест и пишет результат в консоль
 * @param id - Идентификатор теста
 * @param name - Название
 * @param fn - Тело теста
 */
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

/**
 * Утверждает условие или бросает ошибку
 * @param cond - Условие
 * @param msg - Сообщение об ошибке
 */
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

/**
 * Проверяет синтаксис и падает при ошибке
 * @param code - Код
 * @param label - Метка
 */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

/**
 * Создаёт узел send_invoice
 * @param id - ID узла
 * @param targetId - ID следующего узла после оплаты
 * @param extra - Дополнительные поля data
 * @returns Узел
 */
function makeInvoiceNode(id: string, targetId: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    type: 'send_invoice',
    position: { x: 0, y: 0 },
    data: {
      invoiceTitle: 'Тестовый товар',
      invoiceDescription: 'Описание товара',
      invoiceAmount: '5',
      invoicePhotoUrl: '',
      invoicePayload: '',
      savePaymentAmountTo: 'paid_amount',
      savePaymentChargeIdTo: 'paid_charge',
      autoTransitionTo: targetId,
      enableAutoTransition: true,
      keyboardType: 'none',
      buttons: [],
      ...extra,
    },
  };
}

/**
 * Создаёт узел message
 * @param id - ID узла
 * @returns Узел
 */
function makeMessageNode(id: string) {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: {
      messageText: 'Спасибо за оплату!',
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
    },
  };
}

/**
 * Вырезает тело handle_callback_inv1 из кода
 * @param code - Полный код бота
 * @returns Тело функции или пустая строка
 */
function extractInvoiceHandlerBody(code: string): string {
  const start = code.indexOf('async def handle_callback_inv1');
  if (start < 0) return '';
  const nextDef = code.indexOf('\nasync def ', start + 1);
  const nextAt = code.indexOf('\n@dp.', start + 1);
  let end = code.length;
  if (nextDef >= 0) end = Math.min(end, nextDef);
  if (nextAt >= 0) end = Math.min(end, nextAt);
  return code.slice(start, end);
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест phase80 — send_invoice (счёт в звёздах)               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('── Блок A: Генерация счёта ──────────────────────────────────────');

test('A01', 'answer_invoice / send_invoice, XTR, пустой provider_token', () => {
  const p = makeCleanProject([makeInvoiceNode('inv1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('handle_callback_inv1'), 'обработчик inv1');
  ok(
    code.includes('answer_invoice') || code.includes('send_invoice'),
    'вызов answer_invoice или send_invoice',
  );
  ok(code.includes('currency": "XTR"') || code.includes("currency': 'XTR'") || code.includes('"XTR"'), 'валюта XTR');
  ok(code.includes('provider_token') && code.includes('""'), 'пустой provider_token');
  ok(code.includes('LabeledPrice'), 'LabeledPrice');
});

test('A02', 'один LabeledPrice и карта _stars_payment_targets', () => {
  const p = makeCleanProject([makeInvoiceNode('inv1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('_stars_payment_targets'), 'карта целей оплаты');
  const priceMatches = code.match(/LabeledPrice\(/g) || [];
  ok(priceMatches.length >= 1, 'есть LabeledPrice');
});

test('A03', 'синтаксис Python OK', () => {
  const p = makeCleanProject([makeInvoiceNode('inv1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'a03'), 'a03');
});

test('A04', 'EUR + inline: токен литералом в коде', () => {
  const p = makeCleanProject([
    makeInvoiceNode('inv1', 'msg1', {
      invoiceCurrency: 'EUR',
      invoiceProviderSource: 'inline',
      invoiceProviderToken: '2051:TEST:abc',
      invoiceAmount: '100',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a04');
  ok(code.includes('"EUR"') || code.includes("'EUR'"), 'валюта EUR');
  ok(code.includes('2051:TEST:abc'), 'токен inline в коде');
  ok(!code.includes('os.getenv("PAYMENT_PROVIDER_TOKEN")'), 'нет getenv при inline');
  syntax(code, 'a04');
});

test('A05', 'EUR + env: provider_token из os.getenv', () => {
  const p = makeCleanProject([
    makeInvoiceNode('inv1', 'msg1', {
      invoiceCurrency: 'EUR',
      invoiceProviderSource: 'env',
      invoiceProviderTokenEnv: 'PAYMENT_PROVIDER_TOKEN',
      invoiceAmount: '100',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a05');
  ok(code.includes('os.getenv("PAYMENT_PROVIDER_TOKEN")'), 'getenv токена');
  ok(code.includes('"EUR"') || code.includes("'EUR'"), 'валюта EUR');
  syntax(code, 'a05');
});

test('A06', 'EUR + need_email: kwargs и запись order_info', () => {
  const p = makeCleanProject([
    makeInvoiceNode('inv1', 'msg1', {
      invoiceCurrency: 'EUR',
      invoiceProviderSource: 'inline',
      invoiceProviderToken: '2051:TEST:abc',
      invoiceAmount: '100',
      invoiceNeedEmail: true,
      saveOrderEmailTo: 'buyer_email',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a06');
  ok(code.includes('need_email'), 'need_email в kwargs');
  ok(
    code.includes('"save_email_to": "buyer_email"') || code.includes("'save_email_to': 'buyer_email'"),
    'save_email_to в targets',
  );
  ok(code.includes('order_info'), 'чтение order_info после оплаты');
  ok(code.includes('buyer_email'), 'переменная buyer_email');
  syntax(code, 'a06');
});

console.log('── Блок B: pre_checkout и successful_payment ────────────────────');

test('B01', 'pre_checkout_query с ok=True', () => {
  const p = makeCleanProject([makeInvoiceNode('inv1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'b01');
  ok(code.includes('pre_checkout_query'), 'декоратор pre_checkout_query');
  ok(code.includes('ok=True') || code.includes('ok = True'), 'answer(ok=True)');
});

test('B02', 'successful_payment и переход на handle_callback_msg1', () => {
  const p = makeCleanProject([makeInvoiceNode('inv1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'b02');
  ok(code.includes('successful_payment'), 'фильтр successful_payment');
  ok(code.includes('handle_callback_msg1'), 'вызов следующего узла');
  ok(code.includes('FakeCallbackQuery') || code.includes('fake_cb'), 'FakeCallbackQuery');
  ok(code.includes('paid_amount') || code.includes('save_amount'), 'сохранение суммы');
});

test('B03', 'без send_invoice нет pre_checkout и LabeledPrice', () => {
  const p = makeCleanProject([makeMessageNode('msg1')]);
  const code = gen(p, 'b03');
  ok(!code.includes('on_pre_checkout_query_stars'), 'нет pre_checkout хендлера');
  ok(!code.includes('_stars_payment_targets'), 'нет карты оплаты');
  ok(!code.includes('from aiogram.types import LabeledPrice'), 'нет импорта LabeledPrice');
});

console.log('── Блок C: нет раннего перехода и дублей ─────────────────────────');

test('C01', 'нет автоперехода сразу после отправки счёта', () => {
  const p = makeCleanProject([makeInvoiceNode('inv1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'c01');
  const body = extractInvoiceHandlerBody(code);
  ok(body.length > 0, 'тело handle_callback_inv1 найдено');
  ok(body.includes('answer_invoice') || body.includes('send_invoice'), 'в теле есть отправка счёта');
  ok(
    !body.includes('handle_callback_msg1'),
    'в хендлере отправки нет вызова следующего узла',
  );
});

test('C02', 'нет пустого дубля callback-хендлера inv1', () => {
  const p = makeCleanProject([makeInvoiceNode('inv1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'c02');
  const matches = code.match(/async def handle_callback_inv1\b/g) || [];
  ok(matches.length === 1, `ожидался 1 хендлер inv1, найдено ${matches.length}`);
});

test('C03', 'импорт LabeledPrice при наличии счёта', () => {
  const p = makeCleanProject([makeInvoiceNode('inv1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'c03');
  ok(code.includes('LabeledPrice'), 'LabeledPrice в коде');
  ok(
    code.includes('from aiogram.types import LabeledPrice')
      || /from aiogram\.types import \([\s\S]*LabeledPrice/.test(code),
    'импорт LabeledPrice',
  );
});

test('C04', 'синтаксис с двумя счетами OK', () => {
  const p = makeCleanProject([
    makeInvoiceNode('inv1', 'msg1'),
    makeInvoiceNode('inv2', 'msg1', { invoiceAmount: '10', invoiceTitle: 'Второй' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'c04'), 'c04');
});

test('C05', 'картинка /uploads/ → API_BASE_URL', () => {
  const p = makeCleanProject([
    makeInvoiceNode('inv1', 'msg1', { invoicePhotoUrl: '/uploads/1/cover.jpg' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c05');
  ok(code.includes('/uploads/1/cover.jpg'), 'путь uploads в коде');
  ok(code.includes('API_BASE_URL'), 'склейка с API_BASE_URL');
  syntax(code, 'c05');
});

console.log('── Блок D: клавиатура у счёта ───────────────────────────────────');

/**
 * Создаёт узел клавиатуры с кнопкой оплаты и отменой
 * @param id - ID узла
 * @param cancelTarget - Цель кнопки «Отмена»
 * @returns Узел keyboard
 */
function makeInvoiceKeyboard(id: string, cancelTarget: string) {
  return {
    id,
    type: 'keyboard',
    position: { x: 200, y: 0 },
    data: {
      keyboardType: 'inline',
      buttons: [
        {
          id: 'pay1',
          text: 'Оплатить ⭐',
          action: 'pay',
          buttonType: 'normal',
          skipDataCollection: true,
          hideAfterClick: false,
        },
        {
          id: 'cancel1',
          text: 'Отмена',
          action: 'goto',
          target: cancelTarget,
          buttonType: 'normal',
          skipDataCollection: false,
          hideAfterClick: false,
        },
      ],
    },
  };
}

test('D01', 'с клавиатурой: pay=True и кнопка Отмена', () => {
  const p = makeCleanProject([
    makeInvoiceNode('inv1', 'msg1', { keyboardNodeId: 'kbd1' }),
    makeInvoiceKeyboard('kbd1', 'msg_cancel'),
    makeMessageNode('msg1'),
    {
      id: 'msg_cancel',
      type: 'message',
      position: { x: 400, y: 100 },
      data: { messageText: 'Отменено', buttons: [], keyboardType: 'none', formatMode: 'none' },
    },
  ]);
  const code = gen(p, 'd01');
  const body = extractInvoiceHandlerBody(code);
  ok(body.includes('pay=True') || body.includes('pay = True'), 'кнопка оплаты pay=True');
  ok(body.includes('Отмена') || body.includes('msg_cancel') || body.includes('cancel1'), 'кнопка Отмена');
  ok(body.includes('reply_markup'), 'reply_markup у счёта');
  syntax(code, 'd01');
});

test('D02', 'без клавиатуры нет pay=True в хендлере счёта', () => {
  const p = makeCleanProject([makeInvoiceNode('inv1', 'msg1'), makeMessageNode('msg1')]);
  const body = extractInvoiceHandlerBody(gen(p, 'd02'));
  ok(!body.includes('pay=True') && !body.includes('pay = True'), 'нет pay без клавиатуры');
  ok(!body.includes('reply_markup'), 'нет reply_markup без клавиатуры');
});

console.log('── Блок E: подписка 30 дней (только ссылка) ───────────────────');

test('E01', 'send_invoice игнорирует invoiceSubscription (SUBSCRIPTION_EXPORT_MISSING)', () => {
  const p = makeCleanProject([
    makeInvoiceNode('inv1', 'msg1', { invoiceSubscription: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'e01');
  ok(!code.includes('subscription_period'), 'нет subscription_period у счёта в чат');
  ok(!code.includes('2592000'), 'нет 2592000 у счёта в чат');
  syntax(code, 'e01');
});

test('E02', 'обычный send_invoice без subscription_period', () => {
  const p = makeCleanProject([makeInvoiceNode('inv1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e02');
  ok(!code.includes('subscription_period'), 'нет subscription_period');
});

console.log('── Блок F: платёжное ядро + prices[] + доставка ─────────────────');

test('F01', 'protect_content и start_parameter в answer_invoice', () => {
  const p = makeCleanProject([
    makeInvoiceNode('inv1', 'msg1', {
      invoiceProtectContent: true,
      invoiceStartParameter: 'promo_start',
    }),
    makeMessageNode('msg1'),
  ]);
  const body = extractInvoiceHandlerBody(gen(p, 'f01'));
  ok(body.includes('protect_content'), 'protect_content');
  ok(body.includes('start_parameter'), 'start_parameter');
  ok(body.includes('promo_start'), 'значение start_parameter');
  syntax(gen(p, 'f01s'), 'f01s');
});

test('F02', 'need_shipping + is_flexible + tips + provider_data (EUR)', () => {
  const p = makeCleanProject([
    makeInvoiceNode('inv1', 'msg1', {
      invoiceCurrency: 'EUR',
      invoiceProviderSource: 'inline',
      invoiceProviderToken: '2051:TEST:abc',
      invoiceAmount: '100',
      invoiceNeedShipping: true,
      invoiceIsFlexible: true,
      invoiceMaxTipAmount: '50',
      invoiceSuggestedTipAmounts: '10,20,50',
      invoiceProviderData: '{"order_id":"42"}',
      invoiceSendPhoneToProvider: true,
      invoiceSendEmailToProvider: true,
    }),
    makeMessageNode('msg1'),
  ]);
  const body = extractInvoiceHandlerBody(gen(p, 'f02'));
  ok(body.includes('need_shipping_address'), 'need_shipping_address');
  ok(body.includes('is_flexible'), 'is_flexible');
  ok(body.includes('max_tip_amount'), 'max_tip_amount');
  ok(body.includes('suggested_tip_amounts'), 'suggested_tip_amounts');
  ok(body.includes('provider_data'), 'provider_data');
  ok(body.includes('send_phone_number_to_provider'), 'send phone to provider');
  ok(body.includes('send_email_to_provider'), 'send email to provider');
  syntax(gen(p, 'f02s'), 'f02s');
});

test('F03', 'две строки invoicePrices → два LabeledPrice', () => {
  const p = makeCleanProject([
    makeInvoiceNode('inv1', 'msg1', {
      invoiceCurrency: 'EUR',
      invoiceProviderSource: 'inline',
      invoiceProviderToken: '2051:TEST:abc',
      invoicePrices: [
        { id: 'p1', label: 'Товар', amount: '100' },
        { id: 'p2', label: 'Доставка', amount: '20' },
      ],
    }),
    makeMessageNode('msg1'),
  ]);
  const body = extractInvoiceHandlerBody(gen(p, 'f03'));
  const labeledCount = (body.match(/LabeledPrice\(/g) || []).length;
  ok(labeledCount >= 2, `ожидалось ≥2 LabeledPrice, получили ${labeledCount}`);
  ok(body.includes('Товар') || body.includes('"Товар"'), 'label Товар');
  ok(body.includes('Доставка') || body.includes('"Доставка"'), 'label Доставка');
  syntax(gen(p, 'f03s'), 'f03s');
});

test('F04', 'message_thread_id и disable_notification', () => {
  const p = makeCleanProject([
    makeInvoiceNode('inv1', 'msg1', {
      invoiceMessageThreadId: '12345',
      invoiceDisableNotification: true,
      invoiceReplyToMessageId: '99',
      invoiceAllowPaidBroadcast: true,
    }),
    makeMessageNode('msg1'),
  ]);
  const body = extractInvoiceHandlerBody(gen(p, 'f04'));
  ok(body.includes('message_thread_id'), 'message_thread_id');
  ok(body.includes('disable_notification'), 'disable_notification');
  ok(body.includes('reply_to_message_id'), 'reply_to_message_id');
  ok(body.includes('allow_paid_broadcast'), 'allow_paid_broadcast');
  syntax(gen(p, 'f04s'), 'f04s');
});

console.log('\n── Итог ─────────────────────────────────────────────────────────');
const failed = results.filter(r => !r.passed);
console.log(`Пройдено: ${results.length - failed.length}/${results.length}`);
if (failed.length) {
  console.log('Провалы:');
  for (const f of failed) console.log(`  - ${f.id}: ${f.note}`);
  process.exit(1);
}
console.log('Все тесты phase80 прошли.\n');
process.exit(0);
