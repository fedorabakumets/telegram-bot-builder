/**
 * @fileoverview Тестовые данные для шаблона обработчиков синонимов
 * @module templates/synonyms/synonyms.fixture
 */

import type { SynonymsTemplateParams } from './synonyms.params';
import type { Node } from '@shared/schema';

// ─── Низкоуровневые фикстуры (SynonymsTemplateParams) ───────────────────────

export const validParamsEmpty: SynonymsTemplateParams = {
  synonyms: [],
};

export const validParamsStartSynonyms: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'привет', nodeId: 'start_1', nodeType: 'start', functionName: 'start', originalCommand: '/start' },
    { synonym: 'hello', nodeId: 'start_1', nodeType: 'start', functionName: 'start', originalCommand: '/start' },
  ],
};

export const validParamsCommandSynonyms: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'помощь', nodeId: 'cmd_help', nodeType: 'command', functionName: 'help', originalCommand: '/help' },
  ],
};

export const validParamsMessageSynonyms: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'меню', nodeId: 'msg_main_menu', nodeType: 'message' },
  ],
};

export const validParamsPinSynonyms: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'закрепить', nodeId: 'pin_1', nodeType: 'pin_message', disableNotification: false },
    { synonym: 'открепить', nodeId: 'unpin_1', nodeType: 'unpin_message' },
    { synonym: 'удалить', nodeId: 'del_1', nodeType: 'delete_message', messageText: '🗑️ Удалено!' },
  ],
};

export const validParamsBanUser: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'бан', nodeId: 'ban_1', nodeType: 'ban_user', reason: 'Спам', untilDate: 0 },
  ],
};

export const validParamsBanUserTimed: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'бан24', nodeId: 'ban_2', nodeType: 'ban_user', reason: 'Нарушение', untilDate: 1700000000 },
  ],
};

export const validParamsUnbanUser: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'разбан', nodeId: 'unban_1', nodeType: 'unban_user' },
  ],
};

export const validParamsKickUser: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'кик', nodeId: 'kick_1', nodeType: 'kick_user', reason: 'Нарушение правил' },
  ],
};

export const validParamsMuteUser: SynonymsTemplateParams = {
  synonyms: [
    {
      synonym: 'мут',
      nodeId: 'mute_1',
      nodeType: 'mute_user',
      duration: 3600,
      reason: 'Флуд',
      canSendMessages: false,
      canSendMediaMessages: false,
    },
  ],
};

export const validParamsUnmuteUser: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'размут', nodeId: 'unmute_1', nodeType: 'unmute_user' },
  ],
};

export const validParamsPromoteUser: SynonymsTemplateParams = {
  synonyms: [
    {
      synonym: 'повысить',
      nodeId: 'promote_1',
      nodeType: 'promote_user',
      canDeleteMessages: true,
      canInviteUsers: true,
      canPinMessages: false,
    },
  ],
};

export const validParamsDemoteUser: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'понизить', nodeId: 'demote_1', nodeType: 'demote_user' },
  ],
};

export const validParamsAdminRights: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'права', nodeId: 'admin_1', nodeType: 'admin_rights' },
  ],
};

export const validParamsMixed: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'старт', nodeId: 'start_1', nodeType: 'start', functionName: 'start', originalCommand: '/start' },
    { synonym: 'главная', nodeId: 'msg_home', nodeType: 'message' },
    { synonym: 'закрепить', nodeId: 'pin_1', nodeType: 'pin_message' },
    { synonym: 'бан', nodeId: 'ban_1', nodeType: 'ban_user', reason: 'Спам' },
    { synonym: 'мут', nodeId: 'mute_1', nodeType: 'mute_user', duration: 1800 },
  ],
};

export const invalidParamsWrongNodeType = {
  synonyms: [
    { synonym: 'тест', nodeId: 'node_1', nodeType: 'unknown_type' },
  ],
};

// ─── Высокоуровневые фикстуры (Node[]) для collectSynonymEntries ─────────────

function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

export const nodesWithStartSynonym: Node[] = [
  makeNode('start_1', 'start', { synonyms: ['привет', 'hello'], command: '/start' }),
];

export const nodesWithCommandSynonym: Node[] = [
  makeNode('cmd_1', 'command', { synonyms: ['помощь'], command: '/help' }),
];

export const nodesWithMessageSynonym: Node[] = [
  makeNode('msg_1', 'message', { synonyms: ['меню'] }),
];

export const nodesWithBanSynonym: Node[] = [
  makeNode('ban_1', 'ban_user', { synonyms: ['бан'], reason: 'Спам', untilDate: 0 }),
];

export const nodesWithMuteSynonym: Node[] = [
  makeNode('mute_1', 'mute_user', {
    synonyms: ['мут'],
    duration: 3600,
    reason: 'Флуд',
    canSendMessages: false,
    canSendMediaMessages: false,
  }),
];

export const nodesWithPromoteSynonym: Node[] = [
  makeNode('promote_1', 'promote_user', {
    synonyms: ['повысить'],
    canDeleteMessages: true,
    canInviteUsers: true,
    canPinMessages: false,
  }),
];

export const nodesWithAdminRightsSynonym: Node[] = [
  makeNode('admin_1', 'admin_rights', { synonyms: ['права'] }),
];

/** Узел start без самого start-узла в списке — синонимы не должны генерироваться */
export const nodesStartSynonymWithoutStartNode: Node[] = [
  // Нет ни одного узла type='start', поэтому start-синонимы не создаются.
  // Здесь намеренно только узлы без синонимов.
  makeNode('msg_1', 'message', { synonyms: [] }),
  makeNode('cmd_1', 'command', { synonyms: [] }),
];

export const nodesWithNullAndEmpty: Node[] = [
  null as unknown as Node,
  makeNode('msg_1', 'message', { synonyms: [] }),
  makeNode('msg_2', 'message', { synonyms: ['меню'] }),
];

export const nodesMixed: Node[] = [
  makeNode('start_1', 'start', { synonyms: ['старт'], command: '/start' }),
  makeNode('msg_1', 'message', { synonyms: ['главная'] }),
  makeNode('ban_1', 'ban_user', { synonyms: ['бан'], reason: 'Спам' }),
  makeNode('mute_1', 'mute_user', { synonyms: ['мут'], duration: 1800 }),
  makeNode('promote_1', 'promote_user', { synonyms: ['повысить'] }),
];
