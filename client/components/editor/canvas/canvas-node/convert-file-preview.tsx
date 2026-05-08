/**
 * @fileoverview Превью узла конвертации файлов на холсте редактора
 * @module components/editor/canvas/canvas-node/convert-file-preview
 */

import { Node } from '@shared/schema';

/** Пропсы компонента превью конвертера файлов */
interface ConvertFilePreviewProps {
  /** Узел convert_file */
  node: Node;
}

/** Метки форматов файлов для отображения */
const FORMAT_LABELS: Record<string, string> = {
  csv: 'CSV',
  json: 'JSON',
};

/**
 * Компонент превью узла конвертации файлов на холсте
 * @param props - Пропсы компонента
 * @returns JSX-элемент превью
 */
export function ConvertFilePreview({ node }: ConvertFilePreviewProps) {
  const d = node.data as any;
  const inputVariable: string = d?.convertFileInputVariable || '';
  const format: string = d?.convertFileFormat || 'csv';
  const fileName: string = d?.convertFileFileName || 'export_{date}.csv';
  const outputVariable: string = d?.convertFileOutputVariable || '';

  return (
    <div className="space-y-1.5 p-1">
      {/* Заголовок с иконкой */}
      <div className="flex items-center gap-1.5">
        <i className="fas fa-file-export text-emerald-500 dark:text-emerald-400 text-xs" />
        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          Конвертер файлов
        </span>
      </div>

      {/* Входная переменная */}
      {inputVariable ? (
        <div className="text-xs font-mono text-muted-foreground bg-slate-50 dark:bg-slate-800/50 rounded px-1.5 py-1">
          {'{' + inputVariable + '}'}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic">
          Переменная не задана
        </div>
      )}

      {/* Формат, имя файла и выходная переменная */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
          {FORMAT_LABELS[format] || format}
        </span>
        <span className="text-xs text-muted-foreground font-mono truncate max-w-[100px]">
          {fileName}
        </span>
      </div>

      {/* Выходная переменная */}
      {outputVariable && (
        <div className="text-xs text-muted-foreground">
          <span className="text-slate-400 dark:text-slate-500">→ </span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">
            {'{' + outputVariable + '}'}
          </span>
        </div>
      )}
    </div>
  );
}
