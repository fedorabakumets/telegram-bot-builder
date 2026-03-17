/**
 * @fileoverview Тестовые данные для шаблона обработчиков синонимов
 * @module templates/synonyms/synonyms.fixture
 */

import type { SynonymsTemplateParams } from './synonyms.params';

/** Синонимы для команды /start */
export const validParamsStartSynonyms: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'привет', nodeId: 'start_1', nodeType: 'start', functionName: 'start', originalCommand: '/start' },
    { synonym: 'hello', nodeId: 'start_1', nodeType: 'start', functionName: 'start', originalCommand: '/start' },
  ],
};

/** Синонимы для обычной команды */
export const validParamsCommandSynonyms: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'помощь', nodeId: 'cmd_help', nodeType: 'command', functionName: 'help', originalCommand: '/help' },
  ],
};

/** Синонимы для message-узла */
export const validParamsMessageSynonyms: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'меню', nodeId: 'msg_main_menu', nodeType: 'message' },
  ],
};

/** Синонимы для pin_message */
export const validParamsPinSynonyms: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'закрепить', nodeId: 'pin_1', nodeType: 'pin_message', disableNotification: false },
    { synonym: 'открепить', nodeId: 'unpin_1', nodeType: 'unpin_message' },
    { synonym: 'удалить', nodeId: 'del_1', nodeType: 'delete_message', messageText: '🗑️ Удалено!' },
  ],
};

/** Пустой список синонимов */
export const validParamsEmpty: SynonymsTemplateParams = {
  synonyms: [],
};

/** Смешанные синонимы разных типов */
export const validParamsMixed: SynonymsTemplateParams = {
  synonyms: [
    { synonym: 'старт', nodeId: 'start_1', nodeType: 'start', functionName: 'start', originalCommand: '/start' },
    { synonym: 'главная', nodeId: 'msg_home', nodeType: 'message' },
    { synonym: 'закрепить', nodeId: 'pin_1', nodeType: 'pin_message' },
  ],
};

/** Невалидные параметры: неправильный nodeType */
export const invalidParamsWrongNodeType = {
  synonyms: [
    { synonym: 'тест', nodeId: 'node_1', nodeType: 'unknown_type' },
  ],
};
