/**
 * @fileoverview Экспорт модуля handle_node_* функций
 * @module templates/handle-node-function/index
 */

export type { HandleNodeFunctionParams, HandleNodeFunctionsParams, ConditionalMessage } from './handle-node-function.params';
export type { HandleNodeFunctionSchemaParams, HandleNodeFunctionsSchemaParams } from './handle-node-function.schema';
export { handleNodeFunctionParamsSchema, handleNodeFunctionsParamsSchema } from './handle-node-function.schema';
export { generateHandleNodeFunction, generateHandleNodeFunctionsFromParams, generateHandleNodeFunctions } from './handle-node-function.renderer';
export * from './handle-node-function.fixture';
