/**
 * @fileoverview Проверяет общий пул обработчиков аватарок и данных бота без сети и PostgreSQL.
 */
import assert from 'node:assert/strict';
import { build } from 'esbuild';

/** Собирает настоящий обработчик с изолированными внешними зависимостями. */
async function loadHandler(name) {
  const result = await build({
    entryPoints: [`server/routes/botIntegration/handlers/botData/${name}.ts`],
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: [{
      name: 'isolated-handler-dependencies',
      /** Заменяет только окружение обработчика; его собственная логика остаётся настоящей. */
      setup(builder) {
        builder.onResolve({ filter: /database\/db|storages\/storage|telegram-proxy|resolve-request-token|telegram-api-url|set-private-media-cache/ }, args => ({ path: args.path, namespace: 'mock' }));
        builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({
          contents: `export const pool = globalThis.__handlerTest.pool;
            export const storage = globalThis.__handlerTest.storage;
            export const fetchWithProxy = globalThis.__handlerTest.fetch;
            export const getRequestTokenId = () => 7;
            export const resolveProjectBotToken = async () => null;
            export const getTelegramApiBaseUrl = () => 'https://invalid.test';
            export const setPrivateMediaCacheHeaders = () => {};`,
        }));
      },
    }],
  });
  return (await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`))[name];
}

/** Создаёт ответ Express и регистрирует его результат. */
function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; }, set() {}, send(body) { this.body = body; } };
}
const calls = [];
let fail = false;
globalThis.__handlerTest = {
  pool: {
    /** Имитирует успешную выборку либо отказ БД. Метода end намеренно нет. */
    async query(sql, values) {
      calls.push({ sql, values });
      if (fail) throw new Error('Смоделирован отказ БД');
      return { rows: [{ avatarUrl: 'cached', userName: 'example', avatar_url: 'https://invalid.test/photo' }] };
    },
  },
  storage: {
    async getDefaultBotToken() { return { id: 7, token: '123:fake', lastUsedAt: new Date() }; },
    async getBotTokensByProject() { return []; },
  },
  async fetch() { return { ok: true, headers: new Headers({ 'content-type': 'image/png' }), arrayBuffer: async () => new Uint8Array([1, 2]).buffer }; },
};
const bot = await loadHandler('getBotDataHandler');
const avatar = await loadHandler('getAvatarHandler');
const req = { params: { projectId: '12', userId: '456' } };
for (const handler of [bot, avatar]) {
  const res = response();
  await handler(req, res);
  assert.equal(res.code, 200);
  assert.ok(res.body);
}
assert.deepEqual(calls[0].values, [7]);
assert.deepEqual(calls[1].values, ['456', 12, 7]);
assert.match(calls[1].sql, /token_id = \$3/);
fail = true;
const originalError = console.error;
try {
  console.error = () => {};
  for (const handler of [bot, avatar]) {
    const res = response();
    await handler(req, res);
    assert.equal(res.code, 500);
  }
} finally {
  console.error = originalError;
  delete globalThis.__handlerTest;
}
console.log('4 проверки: успех и отказ БД в обоих обработчиках; общий пул не закрывается.');
