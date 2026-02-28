/**
 * @fileoverview Бочка для модуля broadcast
 * 
 * Экспортирует функции генерации обработчиков broadcast узлов.
 * 
 * @module bot-generator/transitions/broadcast
 */

export { generateBroadcastHandler, type BroadcastHandlerParams } from './generate-broadcast-handler';
export { generateAllNodesDict, generateBroadcastConfirmationHandler, generateBroadcastDirectHandler, type BroadcastGlobalHandlerParams } from './generate-broadcast-global-handler';
