/**
 * @fileoverview Определение узла конвертации данных в файл для палитры сайдбара
 * @module components/editor/sidebar/massive/convert-file/convert-file
 */

import { ComponentDefinition } from '@shared/schema';

/** Определение компонента узла конвертации данных в файл */
export const convertFileNode: ComponentDefinition = {
  id: 'convert-file',
  name: 'Конвертер файлов',
  description: 'Конвертирует данные из переменной в CSV или JSON файл',
  icon: 'fas fa-file-export',
  color: 'bg-emerald-100 text-emerald-600',
  type: 'convert_file' as any,
  defaultData: {
    convertFileMode: 'toFile',
    convertFileInputVariable: '',
    convertFileFormat: 'csv',
    convertFileFileName: 'export_{date}.csv',
    convertFileCsvDelimiter: ',',
    convertFileIncludeHeaderRow: true,
    convertFileOutputVariable: '',
    enableAutoTransition: false,
    autoTransitionTo: '',
  },
};
