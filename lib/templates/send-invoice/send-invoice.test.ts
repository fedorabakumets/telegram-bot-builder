/**
 * @fileoverview Unit-тесты шаблона send_invoice
 * @module templates/send-invoice/send-invoice.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { collectSendInvoiceEntries, generateSendInvoiceHandlers } from './send-invoice.renderer';
import { sendInvoiceParamsSchema } from './send-invoice.schema';
import {
  nodesWithInvoice,
  nodesWithoutInvoice,
  validParamsSingle,
} from './send-invoice.fixture';

describe('collectSendInvoiceEntries()', () => {
  it('собирает узел send_invoice', () => {
    const entries = collectSendInvoiceEntries(nodesWithInvoice as any);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].nodeId, 'inv_1');
    assert.equal(entries[0].payload, 'inv_1');
    assert.equal(entries[0].amount, '50');
    assert.equal(entries[0].autoTransitionTo, 'msg_1');
    assert.equal(entries[0].preCheckoutMode, 'always');
  });

  it('возвращает пустой массив без счетов', () => {
    assert.equal(collectSendInvoiceEntries(nodesWithoutInvoice as any).length, 0);
  });
});

describe('sendInvoiceParamsSchema', () => {
  it('валидирует корректные параметры', () => {
    const parsed = sendInvoiceParamsSchema.parse(validParamsSingle);
    assert.equal(parsed.sendInvoiceEntries.length, 1);
  });
});

describe('generateSendInvoiceHandlers()', () => {
  it('генерирует answer_invoice, XTR и pre_checkout', () => {
    const code = generateSendInvoiceHandlers(nodesWithInvoice as any);
    assert.ok(code.includes('answer_invoice'));
    assert.ok(code.includes('XTR'));
    assert.ok(code.includes('provider_token'));
    assert.ok(code.includes('LabeledPrice'));
    assert.ok(code.includes('pre_checkout_query'));
    assert.ok(code.includes('ok=True'));
    assert.ok(!code.includes('ok=False'));
    assert.ok(!code.includes('pre_mode'));
    assert.ok(code.includes('successful_payment'));
    assert.ok(code.includes('handle_callback_msg_1'));
  });

  it('не переходит сразу после отправки счёта', () => {
    const code = generateSendInvoiceHandlers(nodesWithInvoice as any);
    const sendHandler = code.split('@dp.pre_checkout_query')[0];
    assert.ok(!sendHandler.includes('await handle_callback_msg_1'));
  });

  it('для /uploads/ собирает абсолютный URL через API_BASE_URL', () => {
    const code = generateSendInvoiceHandlers(nodesWithInvoice as any);
    assert.ok(code.includes('/uploads/1/product.jpg'));
    assert.ok(code.includes('API_BASE_URL'));
    assert.ok(code.includes('startswith("/uploads/")'));
  });

  it('возвращает пустую строку без узлов', () => {
    assert.equal(generateSendInvoiceHandlers(nodesWithoutInvoice as any), '');
  });

  it('только триггер — successful_payment без pre_checkout', () => {
    const nodes = [
      {
        id: 'spt_1',
        type: 'successful_payment_trigger',
        position: { x: 0, y: 0 },
        data: {
          payloadFilter: 'all',
          payloadValue: '',
          savePaymentAmountTo: 'payment_amount',
          savePaymentChargeIdTo: 'payment_charge_id',
          autoTransitionTo: 'msg_1',
        },
      },
      {
        id: 'msg_1',
        type: 'message',
        position: { x: 100, y: 0 },
        data: { messageText: 'ok', buttons: [], keyboardType: 'none' },
      },
    ];
    const code = generateSendInvoiceHandlers(nodes as any);
    assert.ok(code.includes('successful_payment'));
    assert.ok(!code.includes('pre_checkout_query'));
    assert.ok(code.includes('handle_callback_msg_1'));
  });

  it('с кнопками клавиатуры добавляет pay=True и reply_markup', () => {
    const nodes = [
      {
        id: 'inv_kb',
        type: 'send_invoice',
        position: { x: 0, y: 0 },
        data: {
          invoiceTitle: 'Товар',
          invoiceDescription: 'Описание',
          invoiceAmount: '1',
          invoicePhotoUrl: '',
          invoicePayload: '',
          savePaymentAmountTo: '',
          savePaymentChargeIdTo: '',
          autoTransitionTo: '',
          keyboardType: 'inline',
          buttons: [
            { id: 'pay1', text: 'Оплатить ⭐', action: 'pay' },
            { id: 'c1', text: 'Отмена', action: 'goto', target: 'msg_x' },
          ],
        },
      },
    ];
    const code = generateSendInvoiceHandlers(nodes as any);
    assert.ok(code.includes('pay=True'));
    assert.ok(code.includes('reply_markup'));
    assert.ok(code.includes('Отмена'));
  });

  it('EUR + inline: токен в коде, currency EUR', () => {
    const nodes = [
      {
        id: 'inv_eur',
        type: 'send_invoice',
        position: { x: 0, y: 0 },
        data: {
          invoiceTitle: 'Товар',
          invoiceDescription: 'Описание',
          invoiceAmount: '100',
          invoiceCurrency: 'EUR',
          invoiceProviderSource: 'inline',
          invoiceProviderToken: '2051:TEST:token',
          keyboardType: 'none',
          buttons: [],
        },
      },
    ];
    const code = generateSendInvoiceHandlers(nodes as any);
    assert.ok(code.includes('"EUR"'));
    assert.ok(code.includes('2051:TEST:token'));
    assert.ok(!code.includes('os.getenv("PAYMENT_PROVIDER_TOKEN")'));
  });

  it('EUR + env: os.getenv по ключу', () => {
    const nodes = [
      {
        id: 'inv_env',
        type: 'send_invoice',
        position: { x: 0, y: 0 },
        data: {
          invoiceTitle: 'Товар',
          invoiceDescription: 'Описание',
          invoiceAmount: '100',
          invoiceCurrency: 'EUR',
          invoiceProviderSource: 'env',
          invoiceProviderTokenEnv: 'PAYMENT_PROVIDER_TOKEN',
          keyboardType: 'none',
          buttons: [],
        },
      },
    ];
    const code = generateSendInvoiceHandlers(nodes as any);
    assert.ok(code.includes('os.getenv("PAYMENT_PROVIDER_TOKEN")'));
    assert.ok(code.includes('"EUR"'));
  });

  it('create_invoice_link: подписка только при XTR', () => {
    const nodesFiat = [
      {
        id: 'link_eur',
        type: 'create_invoice_link',
        position: { x: 0, y: 0 },
        data: {
          invoiceTitle: 'Товар',
          invoiceDescription: 'Описание',
          invoiceAmount: '100',
          invoiceCurrency: 'EUR',
          invoiceProviderSource: 'inline',
          invoiceProviderToken: 'tok',
          invoiceSubscription: true,
          saveInvoiceLinkTo: 'url',
        },
      },
    ];
    const code = generateSendInvoiceHandlers(nodesFiat as any);
    assert.ok(!code.includes('subscription_period'));
    assert.ok(code.includes('"EUR"'));
  });

  it('EUR + need_email: kwargs и save order_info в переменные', () => {
    const nodes = [
      {
        id: 'inv_oi',
        type: 'send_invoice',
        position: { x: 0, y: 0 },
        data: {
          invoiceTitle: 'Товар',
          invoiceDescription: 'Описание',
          invoiceAmount: '100',
          invoiceCurrency: 'EUR',
          invoiceProviderSource: 'inline',
          invoiceProviderToken: 'tok',
          invoiceNeedEmail: true,
          saveOrderEmailTo: 'buyer_email',
          keyboardType: 'none',
          buttons: [],
        },
      },
    ];
    const code = generateSendInvoiceHandlers(nodes as any);
    assert.ok(code.includes('need_email'));
    assert.ok(code.includes('"save_email_to": "buyer_email"') || code.includes("'save_email_to': 'buyer_email'"));
    assert.ok(code.includes('order_info'));
    assert.ok(code.includes('buyer_email'));
  });

  it('XTR: статические need_* из галок не попадают в kwargs', () => {
    const nodes = [
      {
        id: 'inv_xtr',
        type: 'send_invoice',
        position: { x: 0, y: 0 },
        data: {
          invoiceTitle: 'Товар',
          invoiceDescription: 'Описание',
          invoiceAmount: '1',
          invoiceCurrency: 'XTR',
          invoiceNeedName: true,
          invoiceNeedEmail: true,
          invoiceNeedPhone: true,
          keyboardType: 'none',
          buttons: [],
        },
      },
    ];
    const code = generateSendInvoiceHandlers(nodes as any);
    // Галочки сброшены для Stars; runtime shop_need_* допустимы только внутри if _currency != XTR
    assert.ok(code.includes('if _currency != "XTR"'));
    assert.ok(!/"need_name":\s*True/.test(code));
    assert.ok(!/"need_email":\s*True/.test(code));
    assert.ok(!/"need_phone_number":\s*True/.test(code));
  });

  it('валюта из {переменной} резолвится в runtime', () => {
    const nodes = [
      {
        id: 'inv_var',
        type: 'send_invoice',
        position: { x: 0, y: 0 },
        data: {
          invoiceTitle: 'Товар',
          invoiceDescription: 'Описание',
          invoiceAmount: '100',
          invoiceCurrency: '{shop_currency}',
          invoiceProviderSource: 'inline',
          invoiceProviderToken: 'tok',
          invoiceNeedEmail: true,
          keyboardType: 'none',
          buttons: [],
        },
      },
    ];
    const code = generateSendInvoiceHandlers(nodes as any);
    assert.ok(code.includes('replace_variables_in_text("{shop_currency}"') || code.includes("replace_variables_in_text('{shop_currency}'"));
    assert.ok(code.includes('need_email'));
    assert.ok(code.includes('_currency != "XTR"') || code.includes("_currency != 'XTR'"));
  });

  it('condition: отказ по payload, текст с переменной, переход после оплаты на месте', () => {
    const nodes = [
      {
        id: 'inv_gate',
        type: 'send_invoice',
        position: { x: 0, y: 0 },
        data: {
          invoiceTitle: 'Товар',
          invoiceDescription: 'Описание',
          invoiceAmount: '5',
          invoicePayload: 'sku_1',
          preCheckoutMode: 'condition',
          preCheckoutVariable: 'can_pay',
          preCheckoutOperator: 'equals',
          preCheckoutValue: 'yes',
          preCheckoutErrorMessage: 'Нельзя: {reason}',
          autoTransitionTo: 'msg_ok',
          keyboardType: 'none',
          buttons: [],
        },
      },
      {
        id: 'msg_ok',
        type: 'message',
        position: { x: 100, y: 0 },
        data: { messageText: 'ок', buttons: [], keyboardType: 'none' },
      },
    ];
    const code = generateSendInvoiceHandlers(nodes as any);
    assert.ok(code.includes('ok=False'));
    assert.ok(code.includes('error_message'));
    assert.ok(code.includes('"sku_1"'));
    assert.ok(code.includes('"can_pay"'));
    assert.ok(code.includes('"equals"'));
    assert.ok(code.includes('Нельзя: {reason}'));
    assert.ok(code.includes('_stars_pre_checkout_rules'));
    assert.ok(code.includes('_stars_pre_checkout_ok'));
    assert.ok(code.includes('handle_callback_msg_ok'));
    assert.ok(code.includes('successful_payment'));
  });

  it('пустой текст отказа заменяется коротким русским', () => {
    const nodes = [
      {
        id: 'inv_empty_err',
        type: 'send_invoice',
        position: { x: 0, y: 0 },
        data: {
          invoiceTitle: 'Товар',
          invoiceDescription: 'Описание',
          invoiceAmount: '1',
          invoicePayload: 'sku_empty',
          preCheckoutMode: 'condition',
          preCheckoutVariable: 'vip',
          preCheckoutOperator: 'filled',
          preCheckoutErrorMessage: '   ',
          keyboardType: 'none',
          buttons: [],
        },
      },
    ];
    const code = generateSendInvoiceHandlers(nodes as any);
    assert.ok(code.includes('"pre_error": "Оплата сейчас недоступна"'));
  });

  it('два счёта: в статической карте только payload с condition', () => {
    const base = {
      invoiceTitle: 'Товар',
      invoiceDescription: 'Описание',
      invoiceAmount: '1',
      keyboardType: 'none',
      buttons: [],
    };
    const nodes = [
      {
        id: 'inv_open',
        type: 'send_invoice',
        position: { x: 0, y: 0 },
        data: { ...base, invoicePayload: 'payload_open' },
      },
      {
        id: 'inv_gate',
        type: 'send_invoice',
        position: { x: 0, y: 80 },
        data: {
          ...base,
          invoicePayload: 'payload_gate',
          preCheckoutMode: 'condition',
          preCheckoutVariable: 'score',
          preCheckoutOperator: 'greater_than',
          preCheckoutValue: '10',
          preCheckoutErrorMessage: 'Мало баллов',
        },
      },
    ];
    const code = generateSendInvoiceHandlers(nodes as any);
    const start = code.indexOf('_stars_pre_checkout_rules');
    const end = code.indexOf('@dp.callback_query', start);
    const rules = code.slice(start, end);
    assert.ok(rules.includes('payload_gate'));
    assert.ok(!rules.includes('payload_open'));
    assert.ok(code.includes('"greater_than"'));
    assert.ok(code.includes('ok=True'));
  });

  it('payload с {переменной} не кладётся в статическую карту, но пишется при создании счёта', () => {
    const nodes = [
      {
        id: 'inv_dyn',
        type: 'send_invoice',
        position: { x: 0, y: 0 },
        data: {
          invoiceTitle: 'Товар',
          invoiceDescription: 'Описание',
          invoiceAmount: '1',
          invoicePayload: 'order_{id}',
          preCheckoutMode: 'condition',
          preCheckoutVariable: 'can_pay',
          preCheckoutOperator: 'equals',
          preCheckoutValue: '1',
          preCheckoutErrorMessage: 'Нет',
          keyboardType: 'none',
          buttons: [],
        },
      },
    ];
    const code = generateSendInvoiceHandlers(nodes as any);
    const start = code.indexOf('_stars_pre_checkout_rules');
    const end = code.indexOf('@dp.callback_query', start);
    const rules = code.slice(start, end);
    assert.ok(!rules.includes('order_{id}'));
    const handlerEnd = code.indexOf('@dp.pre_checkout_query');
    const handler = code.slice(0, handlerEnd);
    assert.ok(handler.includes('"pre_mode": "condition"'));
    assert.ok(handler.includes('order_{id}'));
  });

  it('неизвестный оператор не включает отказ', () => {
    const nodes = [
      {
        id: 'inv_bad',
        type: 'send_invoice',
        position: { x: 0, y: 0 },
        data: {
          invoiceTitle: 'Товар',
          invoiceDescription: 'Описание',
          invoiceAmount: '1',
          preCheckoutMode: 'condition',
          preCheckoutVariable: 'x',
          preCheckoutOperator: 'is_admin',
          preCheckoutErrorMessage: 'Нет',
          keyboardType: 'none',
          buttons: [],
        },
      },
    ];
    const code = generateSendInvoiceHandlers(nodes as any);
    assert.ok(code.includes('ok=True'));
    assert.ok(!code.includes('ok=False'));
    assert.ok(!code.includes('pre_mode'));
  });

  it('create_invoice_link: condition и переход после оплаты', () => {
    const nodes = [
      {
        id: 'link_1',
        type: 'create_invoice_link',
        position: { x: 0, y: 0 },
        data: {
          invoiceTitle: 'Товар',
          invoiceDescription: 'Описание',
          invoiceAmount: '2',
          invoicePayload: 'link_sku',
          saveInvoiceLinkTo: 'invoice_url',
          preCheckoutMode: 'condition',
          preCheckoutVariable: 'can_pay',
          preCheckoutOperator: 'filled',
          preCheckoutErrorMessage: '',
          afterPaymentTo: 'msg_paid',
          autoTransitionTo: 'msg_link',
        },
      },
    ];
    const code = generateSendInvoiceHandlers(nodes as any);
    assert.ok(code.includes('create_invoice_link'));
    assert.ok(code.includes('ok=False'));
    assert.ok(code.includes('"link_sku"'));
    assert.ok(code.includes('"pre_error": "Оплата сейчас недоступна"'));
    assert.ok(code.includes('handle_callback_msg_paid'));
    assert.ok(code.includes('handle_callback_msg_link'));
  });
});
