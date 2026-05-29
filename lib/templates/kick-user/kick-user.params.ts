/**
 * @fileoverview Параметры шаблона узла kick_user
 * @module templates/kick-user/kick-user.params
 */

/** Режим определения ID пользователя */
export type KickUserIdSource = 'current_user' | 'reply_user' | 'custom';

/** Режим определения ID чата */
export type KickUserChatIdSource = 'current_chat' | 'custom';

/**
 * Один узел kick_user
 */
export interface KickUserEntry {
  /** ID узла */
  nodeId: string;
  /** Безопасное имя для Python-функции */
  safeName: string;
  /** ID следующего узла (автопереход) */
  targetNodeId: string;
  /** Тип следующего узла */
  targetNodeType: string;
  /** Источник ID пользователя */
  userIdSource: KickUserIdSource;
  /** ID пользователя вручную или {переменная} — для режима custom */
  userIdManual: string;
  /** Источник ID чата */
  chatIdSource: KickUserChatIdSource;
  /** ID чата вручную или {переменная} — для режима custom */
  chatIdManual: string;
  /** Не прерывать сценарий при ошибке */
  ignoreErrors: boolean;
}

/**
 * Параметры для генерации обработчиков узла kick_user
 */
export interface KickUserTemplateParams {
  /** Массив узлов kick_user */
  entries: KickUserEntry[];
}
