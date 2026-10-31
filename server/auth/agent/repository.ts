/** @fileoverview Транзакционное создание профиля, подключения и персонального PAT. */
import type { PoolClient } from 'pg';
import { pool } from '../../database/db';
import { generateAgentToken } from '../../utils/agent-token-crypto';
import { AgentAuthError } from './config';

/** Подтверждённые сервером агента данные отправителя. */
export interface AgentIdentity {
  /** Telegram ID человека */
  id: number;
  /** Имя из Telegram Update */
  firstName: string;
  /** Фамилия, если передана Telegram */
  lastName?: string;
  /** Текущий username, если передан Telegram */
  username?: string;
}

/** Выполняет операцию в транзакции, всегда освобождает соединение. */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

/** Находит или создаёт профиль; отключённое подключение не восстанавливает. */
export async function exchangeAgentToken(agentId: string, user: AgentIdentity) {
  return transaction(async (client) => {
    await client.query(`INSERT INTO telegram_users(id,first_name,last_name,username)
      VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET
      first_name=EXCLUDED.first_name,
      last_name=COALESCE(EXCLUDED.last_name,telegram_users.last_name),
      username=COALESCE(EXCLUDED.username,telegram_users.username), updated_at=now()`,
    [user.id, user.firstName, user.lastName ?? null, user.username ?? null]);
    await client.query(`INSERT INTO agent_connections(agent_id,owner_id) VALUES($1,$2)
      ON CONFLICT(agent_id,owner_id) DO NOTHING`, [agentId, user.id]);
    const { rows: [connection] } = await client.query(
      'SELECT id,enabled FROM agent_connections WHERE agent_id=$1 AND owner_id=$2 FOR UPDATE', [agentId, user.id]);
    if (!connection.enabled) throw new AgentAuthError(403, 'CONNECTION_REVOKED');
    const { token, tokenHash, prefix } = generateAgentToken();
    const expiresAt = new Date(Date.now() + 86_400_000);
    await client.query(`INSERT INTO agent_tokens(owner_id,label,token_hash,prefix,scopes,expires_at,connection_id)
      VALUES($1,$2,$3,$4,'read,write',$5,$6)`,
    [user.id, 'Telegram Agent', tokenHash, prefix, expiresAt, connection.id]);
    await client.query('UPDATE agent_connections SET updated_at=now() WHERE id=$1', [connection.id]);
    return { token, expiresAt: expiresAt.toISOString(), connectionId: connection.id, ownerId: user.id };
  });
}

/** Меняет состояние под блокировкой строки, при отключении отзывает все PAT. */
export async function setConnectionState(ownerId: number, id: number, enabled: boolean): Promise<boolean> {
  return transaction(async (client) => {
    const { rows } = await client.query('SELECT id FROM agent_connections WHERE id=$1 AND owner_id=$2 FOR UPDATE', [id, ownerId]);
    if (!rows.length) return false;
    await client.query('UPDATE agent_connections SET enabled=$2,updated_at=now() WHERE id=$1', [id, enabled]);
    if (!enabled) await client.query('UPDATE agent_tokens SET revoked_at=COALESCE(revoked_at,now()) WHERE connection_id=$1', [id]);
    return true;
  });
}

/** Отключает исключительно подключение вызывающего доверенного агента. */
export async function disconnectAgent(agentId: string, ownerId: number): Promise<void> {
  const { rows: [connection] } = await pool.query('SELECT id FROM agent_connections WHERE agent_id=$1 AND owner_id=$2', [agentId, ownerId]);
  if (connection) await setConnectionState(ownerId, connection.id, false);
}

/** Возвращает метаданные подключений владельца без секретов. */
export async function listConnections(ownerId: number) {
  const { rows } = await pool.query(`SELECT id,agent_id AS "agentId",enabled,
    created_at AS "createdAt",updated_at AS "updatedAt" FROM agent_connections WHERE owner_id=$1 ORDER BY id`, [ownerId]);
  return rows;
}

/** Отзывает обычный PAT или полностью отключает связанное автоматическое подключение. */
export async function revokeOwnedAgentToken(id: number, ownerId: number): Promise<boolean> {
  return transaction(async (client) => {
    const { rows: [token] } = await client.query('SELECT connection_id FROM agent_tokens WHERE id=$1 AND owner_id=$2 AND revoked_at IS NULL', [id, ownerId]);
    if (!token) return false;
    if (token.connection_id) {
      await client.query('SELECT id FROM agent_connections WHERE id=$1 FOR UPDATE', [token.connection_id]);
      await client.query('UPDATE agent_connections SET enabled=false,updated_at=now() WHERE id=$1', [token.connection_id]);
      await client.query('UPDATE agent_tokens SET revoked_at=COALESCE(revoked_at,now()) WHERE connection_id=$1', [token.connection_id]);
    } else await client.query('UPDATE agent_tokens SET revoked_at=now() WHERE id=$1 AND owner_id=$2', [id, ownerId]);
    return true;
  });
}
