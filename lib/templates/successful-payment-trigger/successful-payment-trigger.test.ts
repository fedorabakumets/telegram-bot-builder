/**
 * @fileoverview Unit-тесты сбора триггера успешной оплаты
 * @module templates/successful-payment-trigger/successful-payment-trigger.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { collectSuccessfulPaymentTriggerEntries } from './successful-payment-trigger.renderer';
import { successfulPaymentTriggerParamsSchema } from './successful-payment-trigger.schema';
import {
  nodesWithExactTrigger,
  nodesWithMixedFilters,
  nodesWithoutTriggers,
  validParamsSingle,
} from './successful-payment-trigger.fixture';

describe('collectSuccessfulPaymentTriggerEntries()', () => {
  it('собирает exact-триггер', () => {
    const entries = collectSuccessfulPaymentTriggerEntries(nodesWithExactTrigger);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].payloadFilter, 'exact');
    assert.equal(entries[0].payloadValue, 'donate_1');
    assert.equal(entries[0].targetNodeId, 'msg_ok');
  });

  it('сортирует: exact → starts_with → all', () => {
    const entries = collectSuccessfulPaymentTriggerEntries(nodesWithMixedFilters);
    assert.equal(entries.length, 3);
    assert.equal(entries[0].payloadFilter, 'exact');
    assert.equal(entries[1].payloadFilter, 'starts_with');
    assert.equal(entries[2].payloadFilter, 'all');
  });

  it('без триггеров — пустой массив', () => {
    assert.equal(collectSuccessfulPaymentTriggerEntries(nodesWithoutTriggers).length, 0);
  });
});

describe('successfulPaymentTriggerParamsSchema', () => {
  it('валидирует корректные параметры', () => {
    const parsed = successfulPaymentTriggerParamsSchema.parse(validParamsSingle);
    assert.equal(parsed.entries.length, 1);
  });
});
