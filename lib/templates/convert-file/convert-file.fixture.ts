/**
 * @fileoverview Тестовые данные для шаблона узла convert_file
 * @module templates/convert-file/convert-file.fixture
 */
import type { ConvertFileTemplateParams } from './convert-file.params';
import type { Node } from '@shared/schema';

// ─── Вспомогательная функция ─────────────────────────────────────────────────

/**
 * Создаёт минимальный узел для тестов
 * @param id - ID узла
 * @param type - Тип узла
 * @param data - Данные узла
 * @returns Объект узла
 */
export function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

// ─── Низкоуровневые фикстуры (ConvertFileTemplateParams) ─────────────────────

/** Узел без outputVariable и autoTransitionTo */
export const validParamsEmpty: ConvertFileTemplateParams = {
  nodeId: 'cf_1',
  inputVariable: 'data',
  format: 'csv',
  fileName: 'export.csv',
  csvDelimiter: ',',
  includeHeaderRow: true,
  outputVariable: '',
  autoTransitionTo: '',
};

/** CSV с заголовками и автопереходом */
export const validParamsCsv: ConvertFileTemplateParams = {
  nodeId: 'cf_2',
  inputVariable: 'users_data',
  format: 'csv',
  fileName: 'users_{date}.csv',
  csvDelimiter: ',',
  includeHeaderRow: true,
  outputVariable: 'export_file',
  autoTransitionTo: 'msg_export',
};

/** JSON формат */
export const validParamsJson: ConvertFileTemplateParams = {
  nodeId: 'cf_3',
  inputVariable: 'my_data',
  format: 'json',
  fileName: 'my_data.json',
  csvDelimiter: ',',
  includeHeaderRow: false,
  outputVariable: 'json_file',
  autoTransitionTo: '',
};

// ─── Высокоуровневые фикстуры (Node[]) для collectConvertFileEntries ──────────

/** Массив узлов с convert_file */
export const nodesWithConvertFile: Node[] = [
  makeNode('cf_1', 'convert_file', {
    convertFileInputVariable: 'users_data',
    convertFileFormat: 'csv',
    convertFileFileName: 'users_{date}.csv',
    convertFileCsvDelimiter: ',',
    convertFileIncludeHeaderRow: true,
    convertFileOutputVariable: 'export_file',
    autoTransitionTo: 'msg_1',
  }),
  makeNode('msg_1', 'message', { messageText: 'Файл готов!' }),
];

/** Массив без convert_file */
export const nodesWithoutConvertFile: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узел + convert_file + message */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('cf_1', 'convert_file', {
    convertFileInputVariable: 'data',
    convertFileFormat: 'json',
    convertFileFileName: 'data.json',
    convertFileCsvDelimiter: ',',
    convertFileIncludeHeaderRow: true,
    convertFileOutputVariable: 'file_out',
    autoTransitionTo: '',
  }),
  makeNode('msg_1', 'message', {}),
];
