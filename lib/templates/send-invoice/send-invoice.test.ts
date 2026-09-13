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
});
