/**
 * @fileoverview Бочка для модуля user-input
 * 
 * Экспортирует все функции генерации обработчиков пользовательского ввода.
 * 
 * @module bot-generator/user-input
 */

export { generateConditionalInputHandler, type ConditionalInputHandlerDeps } from './generate-conditional-input-handler';
export { hasUrlButtons } from './has-url-buttons';
export { generateButtonResponseCheck, generateSelectedOptionSearch, generateResponseDataStructure } from './generate-button-response-handler';
export { generateButtonActionExtract, generateUrlActionHandler } from './generate-button-navigation';
export { generateFakeMessageCreation, generateCommandHandlers, type CommandHandlerType } from './generate-command-execution';
export { generateGotoNavigation } from './generate-goto-navigation';
export { generateMediaSkipCheck, generateSkipButtonSearch, generateMediaWaitingCleanup, type MediaType } from './generate-media-skip-check';
export { generateFakeCallbackCreation, generateSkipTargetNavigation } from './generate-media-skip-navigation';
export { generateWaitingStateCheck, generateDatabaseVarsGet } from './generate-waiting-state-check';
export { generateWaitingConfigExtract, generateMediaTypeCheck, generateWaitingConfigLegacyExtract } from './generate-waiting-config-extract';
export { generateSkipButtonsCheck, generateSkipFakeCallbackCreation, generateSkipNavigation } from './generate-skip-buttons-check';
export { generateButtonResponseSave } from './generate-button-response-save';
