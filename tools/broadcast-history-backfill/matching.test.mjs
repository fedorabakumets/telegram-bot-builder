/**
 * @fileoverview Адресные тесты однозначного восстановления истории без подключения к БД.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { planBackfill } from './matching.mjs';

/** Создаёт обезличенный пример задания, истории и результата доставки. */
function fixture() {
  return {
    broadcast: { id: 1, message_text: 'Текст', buttons: [{ text: 'Открыть', url: 'https://example.org' }], buttons_per_row: 2 },
    messages: [{ id: 3, user_id: '100', chat_id: null, message_type: 'bot', message_text: 'Текст', telegram_message_id: null,
      message_data: { broadcastId: 1, sentFromBroadcast: true, custom: 'сохранить' } }],
    results: [{ user_id: '100', status: 'sent', telegram_message_id: 7 }],
  };
}

test('восстанавливает ID, кнопки и раскладку, не меняя исходные данные', () => {
  const f = fixture();
  const before = structuredClone(f);
  const plan = planBackfill(f.broadcast, f.messages, f.results);
  assert.equal(plan.changes.length, 1);
  assert.equal(plan.changes[0].telegramMessageId, 7);
  assert.equal(plan.changes[0].messageData.buttonsPerRow, 2);
  assert.equal(plan.changes[0].messageData.custom, 'сохранить');
  assert.deepEqual(f, before);
});

test('повторное выполнение не предлагает изменений', () => {
  const f = fixture();
  const first = planBackfill(f.broadcast, f.messages, f.results).changes[0];
  f.messages[0].telegram_message_id = first.telegramMessageId;
  f.messages[0].message_data = first.messageData;
  assert.deepEqual(planBackfill(f.broadcast, f.messages, f.results).skipped, { already_complete: 1 });
});

test('не выбирает произвольно среди дублей истории или результатов', () => {
  for (const key of ['messages', 'results']) {
    const f = fixture();
    f[key].push(structuredClone(f[key][0]));
    const plan = planBackfill(f.broadcast, f.messages, f.results);
    assert.equal(plan.changes.length, 0);
    assert.ok(plan.skipped.ambiguous);
  }
});

test('пропускает конфликтующий ID, текст, клавиатуру и непроверенную доставку', () => {
  const cases = [
    f => { f.messages[0].telegram_message_id = 9; },
    f => { f.messages[0].message_text = 'Другая версия'; },
    f => { f.messages[0].message_data.buttons = []; },
    f => { f.messages[0].message_data.buttonsPerRow = 1; },
    f => { f.results[0].status = 'failed'; },
    f => { f.results[0].telegram_message_id = null; },
    f => { f.messages[0].chat_id = '-200'; },
    f => { f.messages[0].message_data.broadcastId = 2; },
    f => { f.messages[0].message_data.sentFromBroadcast = false; },
  ];
  for (const mutate of cases) {
    const f = fixture();
    mutate(f);
    assert.equal(planBackfill(f.broadcast, f.messages, f.results).changes.length, 0);
  }
});

test('для группового сообщения сопоставляет ID чата с получателем', () => {
  const f = fixture();
  f.messages[0].user_id = '-100';
  f.messages[0].chat_id = '-100';
  f.results[0].user_id = '-100';
  assert.equal(planBackfill(f.broadcast, f.messages, f.results).changes.length, 1);
});
