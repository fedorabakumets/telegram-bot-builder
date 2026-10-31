/** @fileoverview Интеграционные проверки транзакций в отдельной схеме тестового PostgreSQL. */
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { hashAgentToken } from '../../utils/agent-token-crypto';
const database = await vi.hoisted(async () => {
  const { Pool } = await import('pg');
  const schema = `agent_auth_test_${process.pid}_${Date.now()}`;
  const connectionString = process.env.AGENT_TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
  const admin = new Pool({ connectionString });
  const pool = new Pool({ connectionString, options: `-c search_path=${schema}` });
  return { admin, pool, schema };
});
vi.mock('../../database/db', () => ({ pool: database.pool }));
import { exchangeAgentToken, revokeOwnedAgentToken, setConnectionState, disconnectAgent, listConnections } from './repository';

beforeAll(async () => {
  await database.admin.query(`CREATE SCHEMA ${database.schema}`);
  await database.pool.query(`CREATE TABLE telegram_users(id bigint PRIMARY KEY,first_name text NOT NULL,
    last_name text,username text,photo_url text,auth_date bigint,updated_at timestamptz DEFAULT now());
    CREATE TABLE agent_tokens(id serial PRIMARY KEY,owner_id bigint REFERENCES telegram_users(id),label text,
    token_hash text,prefix text,scopes text,expires_at timestamptz,revoked_at timestamptz);`);
  await database.pool.query(readFileSync('migrations/0022_agent_connections.sql', 'utf8'));
});
afterAll(async () => {
  await database.pool.end();
  await database.admin.query(`DROP SCHEMA ${database.schema} CASCADE`);
  await database.admin.end();
});
describe('Жизненный цикл подключения', () => {
  it('атомарно создаёт один профиль и подключение при параллельном входе', async () => {
    const tokens = await Promise.all(Array.from({ length: 8 }, () => exchangeAgentToken('agent', { id: 42, firstName: 'Тест' })));
    expect(new Set(tokens.map((t) => t.connectionId)).size).toBe(1);
    expect(new Set(tokens.map((t) => t.token)).size).toBe(8);
    const { rows } = await database.pool.query('SELECT * FROM agent_tokens WHERE owner_id=42');
    expect(rows).toHaveLength(8); expect(rows.every((r) => r.scopes === 'read,write')).toBe(true);
    expect(rows[0].token_hash).not.toContain('mcp_');
    expect(Date.parse(tokens[0].expiresAt) - Date.now()).toBeGreaterThan(86_390_000);
  });
  it('сохраняет фото и отсутствующие поля; username не меняет владельца', async () => {
    await database.pool.query("UPDATE telegram_users SET photo_url='photo',last_name='Фамилия',auth_date=123 WHERE id=42");
    const access = await exchangeAgentToken('agent', { id: 42, firstName: 'Новое', username: 'new_name' });
    expect(access.ownerId).toBe(42);
    const { rows: [user] } = await database.pool.query('SELECT * FROM telegram_users WHERE id=42');
    expect(user).toMatchObject({ photo_url: 'photo', last_name: 'Фамилия', username: 'new_name', auth_date: '123' });
  });
  it('не даёт управлять чужим подключением или токеном', async () => {
    const access = await exchangeAgentToken('agent', { id: 43, firstName: 'Другой' });
    expect(await setConnectionState(42, access.connectionId, false)).toBe(false);
    const { rows: [token] } = await database.pool.query('SELECT id FROM agent_tokens WHERE token_hash=$1', [hashAgentToken(access.token)]);
    expect(await revokeOwnedAgentToken(token.id, 42)).toBe(false);
    expect((await listConnections(42)).every((c) => c.id !== access.connectionId)).toBe(true);
  });
  it('отзыв PAT отключает подключение и все PAT; обмен не восстанавливает его', async () => {
    const { rows: [token] } = await database.pool.query('SELECT id,connection_id FROM agent_tokens WHERE owner_id=42 LIMIT 1');
    expect(await revokeOwnedAgentToken(token.id, 42)).toBe(true);
    await expect(exchangeAgentToken('agent', { id: 42, firstName: 'Тест' })).rejects.toMatchObject({ code: 'CONNECTION_REVOKED' });
    const { rows } = await database.pool.query('SELECT id FROM agent_tokens WHERE owner_id=42 AND revoked_at IS NULL');
    expect(rows).toHaveLength(0);
    await setConnectionState(42, token.connection_id, true);
    expect((await exchangeAgentToken('agent', { id: 42, firstName: 'Тест' })).ownerId).toBe(42);
  });
  it('отключение и обмен сериализуются без живого токена отключённого подключения', async () => {
    await Promise.allSettled([exchangeAgentToken('agent', { id: 43, firstName: 'Другой' }), disconnectAgent('agent', 43)]);
    const { rows } = await database.pool.query(`SELECT t.id FROM agent_tokens t JOIN agent_connections c ON c.id=t.connection_id
      WHERE c.owner_id=43 AND NOT c.enabled AND t.revoked_at IS NULL`);
    expect(rows).toHaveLength(0);
    await expect(exchangeAgentToken('agent', { id: 43, firstName: 'Другой' })).rejects.toMatchObject({ code: 'CONNECTION_REVOKED' });
  });
});
