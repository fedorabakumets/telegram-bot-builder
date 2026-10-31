/** @fileoverview Настройки и ошибки доверенного подключения агента. */
export class AgentAuthError extends Error {
  /** Создаёт безопасную ошибку API без данных запроса. */
  constructor(public status: number, public code: string) { super(code); }
}

/** Возвращает настройки обмена; без явного включения доступ закрыт. */
export function agentAuthConfig() {
  return {
    enabled: process.env.AGENT_AUTO_AUTH_ENABLED === 'true',
    agentId: process.env.AGENT_AUTO_AUTH_ID || 'bot-builder-agent',
    secret: process.env.AGENT_AUTO_AUTH_SECRET || '',
    allowedIds: (process.env.AGENT_AUTO_AUTH_ALLOWED_IDS || '').split(',').map((id) => id.trim()).filter(Boolean),
  };
}
