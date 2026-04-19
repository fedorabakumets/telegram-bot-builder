/**
 * @fileoverview Тестовые данные для шаблона callback-handler-init
 * @module templates/callback-handler-init/callback-handler-init.fixture
 */

import type { CallbackHandlerInitTemplateParams } from './callback-handler-init.params';

/** Валидные параметры: базовая инициализация */
export const validParamsBasic: CallbackHandlerInitTemplateParams = {
  nodeId: 'node_abc',
  hasHideAfterClick: false,
  includeStateSync: true,
  variableFilters: null,
};

/** Валидные параметры: с hideAfterClick */
export const validParamsWithHide: CallbackHandlerInitTemplateParams = {
  nodeId: 'node_xyz',
  hasHideAfterClick: true,
  includeStateSync: true,
  variableFilters: null,
};

/** Валидные параметры: с фильтрами переменных */
export const validParamsWithFilters: CallbackHandlerInitTemplateParams = {
  nodeId: 'node_filtered',
  hasHideAfterClick: false,
  includeStateSync: true,
  variableFilters: { user_role: 'admin', status: 'active' },
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: CallbackHandlerInitTemplateParams = {
  nodeId: 'node_indented',
  hasHideAfterClick: false,
  includeStateSync: true,
  variableFilters: null,
  indentLevel: '        ',
};

/** Р’Р°Р»РёРґРЅС‹Рµ РїР°СЂР°РјРµС‚СЂС‹: Р±РµР· СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё FSM */
export const validParamsWithoutStateSync: CallbackHandlerInitTemplateParams = {
  nodeId: 'node_no_state',
  hasHideAfterClick: false,
  includeStateSync: false,
  variableFilters: null,
};
