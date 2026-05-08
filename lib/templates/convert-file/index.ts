/**
 * @fileoverview Экспорт модуля шаблона узла convert_file
 * @module templates/convert-file/index
 */
export type { ConvertFileTemplateParams } from './convert-file.params';
export type { ConvertFileParams } from './convert-file.schema';
export { convertFileParamsSchema } from './convert-file.schema';
export {
  collectConvertFileEntries,
  generateConvertFileHandlers,
} from './convert-file.renderer';
export * from './convert-file.fixture';
