/**
 * @fileoverview Экспорт модуля обработчиков синонимов
 * @module templates/synonyms/index
 */

export type { SynonymsTemplateParams, SynonymEntry, SynonymNodeType } from './synonyms.params';
export type { SynonymsParams } from './synonyms.schema';
export { synonymsParamsSchema } from './synonyms.schema';
export { generateSynonyms } from './synonyms.renderer';
export * from './synonyms.fixture';
