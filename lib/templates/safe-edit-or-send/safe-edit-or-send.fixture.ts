/**
 * @fileoverview Тестовые данные для шаблона safe_edit_or_send
 * @module templates/safe-edit-or-send/safe-edit-or-send.fixture
 */

import type { SafeEditOrSendTemplateParams } from './safe-edit-or-send.params';

/** Валидные параметры: базовый случай (inline кнопки) */
export const validParamsBasic: SafeEditOrSendTemplateParams = {
  hasInlineButtonsOrSpecialNodes: true,
  hasAutoTransitions: false,
};

/** Валидные параметры: с автопереходами */
export const validParamsWithAutoTransitions: SafeEditOrSendTemplateParams = {
  hasInlineButtonsOrSpecialNodes: false,
  hasAutoTransitions: true,
};

/** Валидные параметры: оба флага включены */
export const validParamsBothEnabled: SafeEditOrSendTemplateParams = {
  hasInlineButtonsOrSpecialNodes: true,
  hasAutoTransitions: true,
};

/** Валидные параметры: оба флага выключены (пустой вывод) */
export const validParamsBothDisabled: SafeEditOrSendTemplateParams = {
  hasInlineButtonsOrSpecialNodes: false,
  hasAutoTransitions: false,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  hasInlineButtonsOrSpecialNodes: 'true', // должно быть boolean
  hasAutoTransitions: true,
};

/** Невалидные параметры: null вместо boolean */
export const invalidParamsNull = {
  hasInlineButtonsOrSpecialNodes: null,
  hasAutoTransitions: null,
};
