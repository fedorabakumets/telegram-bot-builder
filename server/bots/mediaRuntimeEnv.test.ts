/** @fileoverview Проверка адреса и проектной изоляции доступа к медиа бота. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMediaRuntimeEnv, collectRuntimeMediaUrls } from './mediaRuntimeEnv';

describe('окружение доступа к медиа', () => {
  it('выдаёт отдельные токены проектов без секрета панели', () => {
    const old = { ...process.env };
    try {
      process.env.MEDIA_RUNTIME_SECRET = 'x'.repeat(40);
      process.env.MEDIA_RUNTIME_BASE_URL = 'https://panel.example';
      process.env.WORKER_RUNTIME = 'process';
      const first = buildMediaRuntimeEnv(1, {});
      const second = buildMediaRuntimeEnv(2, {});
      assert.notEqual(first.MEDIA_RUNTIME_TOKEN, second.MEDIA_RUNTIME_TOKEN);
      assert.notEqual(first.MEDIA_RUNTIME_WRITE_TOKEN, second.MEDIA_RUNTIME_WRITE_TOKEN);
      assert.notEqual(first.MEDIA_RUNTIME_WRITE_TOKEN, first.MEDIA_RUNTIME_TOKEN);
      assert.equal(first.MEDIA_RUNTIME_PROJECT_ID, '1');
      assert.ok(!Object.values(first).includes(process.env.MEDIA_RUNTIME_SECRET));
    } finally { process.env = old; }
  });
  it('не передаёт адрес с паролем и сохраняет запуск без секрета', () => {
    const old = { ...process.env };
    try {
      process.env.MEDIA_RUNTIME_BASE_URL = 'https://user:password@panel.example';
      assert.deepEqual(buildMediaRuntimeEnv(1, {}), {});
      process.env.MEDIA_RUNTIME_BASE_URL = 'https://panel.example';
      delete process.env.MEDIA_RUNTIME_SECRET;
      assert.deepEqual(buildMediaRuntimeEnv(1, {}), {});
      // Выбранное S3 требует runtime даже без статических вложений.
      assert.deepEqual(buildMediaRuntimeEnv(1, {}, true), { MEDIA_RUNTIME_REQUIRED: '1' });
    } finally { process.env = old; }
  });
  it('не передаёт токен по HTTP удалённому исполнителю без явного разрешения', () => {
    const old = { ...process.env };
    try {
      process.env.MEDIA_RUNTIME_SECRET = 'x'.repeat(40);
      process.env.MEDIA_RUNTIME_BASE_URL = 'http://panel.internal:5000';
      process.env.WORKER_RUNTIME = 'remote';
      delete process.env.MEDIA_RUNTIME_ALLOW_INSECURE_REMOTE;
      expectRequiredOnly();
      process.env.MEDIA_RUNTIME_ALLOW_INSECURE_REMOTE = 'true';
      assert.ok(buildMediaRuntimeEnv(1, {}).MEDIA_RUNTIME_TOKEN);
      assert.ok(buildMediaRuntimeEnv(1, {}).MEDIA_RUNTIME_WRITE_TOKEN);
    } finally { process.env = old; }
  });
  it('находит старые и абсолютные адреса для проверки записей хранилища', () => {
    assert.deepEqual([...collectRuntimeMediaUrls({ proxy: '/api/storage/proxy/a', s3: 'https://bucket.test/file' })], ['/api/storage/proxy/a', 'https://bucket.test/file']);
  });
});

/** Проверяет отказ от передачи токена при обязательном доступе к медиа. */
function expectRequiredOnly(): void {
  assert.deepEqual(buildMediaRuntimeEnv(1, {}), { MEDIA_RUNTIME_REQUIRED: '1' });
}
