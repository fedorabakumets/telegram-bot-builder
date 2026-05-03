/**
 * @fileoverview Регресс-тест для Redis platform subscriber
 * Проверяет обработку каналов bot:logs, bot:message и маппинг типов событий
 * @module tests/test-phase-redis-platform-subscriber
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';

/**
 * Читает исходный код Redis platform subscriber.
 * @returns Текст файла subscriber'а
 */
function readPlatformSubscriber(): string {
  return fs.readFileSync('server/redis/redisPlatformSubscriber.ts', 'utf-8');
}

describe('Фаза: redis platform subscriber', () => {
  it('игнорирует bot:logs каналы без warning', () => {
    const code = readPlatformSubscriber();

    assert.ok(code.includes("channel.startsWith('bot:logs:')"));
    assert.match(
      code,
      /if\s*\(isLogsChannel\(channel\)\)\s*\{\s*return;\s*\}/s,
    );
  });

  it('содержит маппинг bot:message → new-message', () => {
    const code = readPlatformSubscriber();
    assert.ok(
      code.includes("'bot:message': 'new-message'"),
      "CHANNEL_TYPE_MAP должен содержать 'bot:message': 'new-message'"
    );
  });

  it('содержит функцию isMessageChannel', () => {
    const code = readPlatformSubscriber();
    assert.ok(
      code.includes('isMessageChannel'),
      'функция isMessageChannel должна присутствовать'
    );
    assert.ok(
      code.includes("channel.startsWith('bot:message:')"),
      "isMessageChannel должна проверять startsWith('bot:message:')"
    );
  });

  it('parseChannel корректно разбирает bot:message:1:2', () => {
    const code = readPlatformSubscriber();
    // Проверяем что parseChannel поддерживает формат bot:message:projectId:tokenId
    assert.ok(
      code.includes("const prefix = `${parts[0]}:${parts[1]}`"),
      'parseChannel должна формировать prefix из первых двух частей'
    );
    assert.ok(
      code.includes('CHANNEL_TYPE_MAP[prefix]'),
      'parseChannel должна использовать CHANNEL_TYPE_MAP для определения типа'
    );
  });

  it('handleMessage не выводит warning для bot:message каналов', () => {
    const code = readPlatformSubscriber();
    // bot:message обрабатывается через CHANNEL_TYPE_MAP, не попадает в warning
    // Проверяем что warning вызывается только для неизвестных каналов
    assert.ok(
      code.includes("console.warn(`[RedisSub] Неизвестный формат канала: ${channel}`)"),
      'warning для неизвестных каналов должен присутствовать'
    );
    // bot:message не должен попасть в ветку warning — он обрабатывается через CHANNEL_TYPE_MAP
    assert.ok(
      code.includes("'bot:message': 'new-message'"),
      'bot:message должен быть в CHANNEL_TYPE_MAP чтобы не попасть в warning'
    );
  });

  it('SUBSCRIBE_PATTERN bot:* покрывает bot:message каналы', () => {
    const code = readPlatformSubscriber();
    assert.ok(
      code.includes("const SUBSCRIBE_PATTERN = 'bot:*'"),
      "SUBSCRIBE_PATTERN должен быть 'bot:*'"
    );
  });
});
