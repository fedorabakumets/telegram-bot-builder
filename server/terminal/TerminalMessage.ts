/**
 * Тип для сообщений, передаваемых через WebSocket
 * @typedef {Object} TerminalMessage
 * @property {string} type - Тип сообщения ('stdout' | 'stderr' | 'status')
 * @property {string} content - Содержимое сообщения
 * @property {number} projectId - Идентификатор проекта
 * @property {number} tokenId - Идентификатор токена
 * @property {string} timestamp - Временная метка
 */

export interface TerminalMessage {
    type: 'stdout' | 'stderr' | 'status';
    content: string;
    projectId: number;
    tokenId: number;
    timestamp: string;
}
