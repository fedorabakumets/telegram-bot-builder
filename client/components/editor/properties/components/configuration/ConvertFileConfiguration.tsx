/**
 * @fileoverview Панель свойств узла convert_file — настройка конвертации данных в файл
 * @module components/editor/properties/components/configuration/ConvertFileConfiguration
 */

import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { VariableNameInput } from '../variables/variable-name-input';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы компонента ConvertFileConfiguration */
interface ConvertFileConfigurationProps {
  /** Выбранный узел convert_file */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Все узлы всех листов для выбора следующего узла */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Функция форматирования отображения узла */
  formatNodeDisplay: (node: Node, sheetName: string) => string;
  /** Доступные текстовые переменные проекта */
  textVariables: Variable[];
}

/**
 * Панель конфигурации узла конвертации файлов
 * @param props - Пропсы компонента
 * @returns JSX-элемент панели свойств
 */
export function ConvertFileConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  textVariables,
}: ConvertFileConfigurationProps) {
  const data = selectedNode.data as any;
  const format: string = data?.convertFileFormat || 'csv';
  const inputVariable: string = data?.convertFileInputVariable || '';
  const fileName: string = data?.convertFileFileName || 'export_{date}.csv';
  const csvDelimiter: string = data?.convertFileCsvDelimiter || ',';
  const includeHeaderRow: boolean = data?.convertFileIncludeHeaderRow ?? true;
  const outputVariable: string = data?.convertFileOutputVariable || '';
  const autoTransitionTo: string = data?.autoTransitionTo || '';

  /** Доступные узлы для перехода (исключаем текущий) */
  const availableTargets = getAllNodesFromAllSheets.filter(
    ({ node }) => node.id !== selectedNode.id
  );

  return (
    <div className="space-y-4 p-4">
      {/* Заголовок секции */}
      <div className="flex items-center gap-2">
        <i className="fas fa-file-export text-emerald-500 dark:text-emerald-400 text-sm" />
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          Конвертер файлов
        </span>
      </div>

      {/* Формат выходного файла */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Формат файла
        </Label>
        <Select
          value={format}
          onValueChange={(value) => onNodeUpdate(selectedNode.id, { convertFileFormat: value as any })}
        >
          <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Входная переменная */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Входная переменная (json-массив)
        </Label>
        <VariableNameInput
          value={inputVariable}
          availableVariables={textVariables}
          onChange={(value) => onNodeUpdate(selectedNode.id, { convertFileInputVariable: value })}
          placeholder="users_data"
        />
      </div>

      {/* Имя файла */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Имя файла
        </Label>
        <Input
          value={fileName}
          onChange={(e) => onNodeUpdate(selectedNode.id, { convertFileFileName: e.target.value })}
          placeholder="export_{date}.csv"
          className="text-xs h-8 font-mono bg-white/60 dark:bg-slate-950/60"
        />
        <p className="text-xs text-muted-foreground">
          Поддерживает {'{'+'date'+'}'} — текущая дата
        </p>
      </div>

      {/* CSV-специфичные настройки */}
      {format === 'csv' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Разделитель CSV
            </Label>
            <Input
              value={csvDelimiter}
              onChange={(e) => onNodeUpdate(selectedNode.id, { convertFileCsvDelimiter: e.target.value })}
              placeholder=","
              className="text-xs h-8 font-mono bg-white/60 dark:bg-slate-950/60 w-20"
              maxLength={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={includeHeaderRow}
              onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { convertFileIncludeHeaderRow: checked })}
            />
            <Label className="text-xs text-muted-foreground cursor-pointer">
              Включать строку заголовков
            </Label>
          </div>
        </>
      )}

      {/* Выходная переменная */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Сохранить файл в переменную
        </Label>
        <VariableNameInput
          value={outputVariable}
          availableVariables={textVariables}
          onChange={(value) => onNodeUpdate(selectedNode.id, { convertFileOutputVariable: value })}
          placeholder="export_file"
        />
      </div>

      {/* Следующий узел */}
      <div className="flex flex-col p-3 rounded-lg bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/40 dark:border-emerald-700/40">
        <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
          <i className="fas fa-share-right text-xs" />
          Следующий узел
        </Label>
        <Select
          value={autoTransitionTo || 'no-transition'}
          onValueChange={(value) =>
            onNodeUpdate(selectedNode.id, {
              autoTransitionTo: value === 'no-transition' ? '' : value,
              enableAutoTransition: value !== 'no-transition',
            })
          }
        >
          <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60 border border-emerald-300/40 dark:border-emerald-700/40">
            <SelectValue placeholder="Без перехода" />
          </SelectTrigger>
          <SelectContent className="max-h-48 overflow-y-auto">
            <SelectItem value="no-transition">Без перехода</SelectItem>
            {availableTargets.map(({ node, sheetName }) => (
              <SelectItem key={node.id} value={node.id}>
                <span className="text-xs font-mono truncate">
                  {formatNodeDisplay(node, sheetName)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={autoTransitionTo && autoTransitionTo !== 'no-transition' ? autoTransitionTo : ''}
          onChange={(e) =>
            onNodeUpdate(selectedNode.id, {
              autoTransitionTo: e.target.value || '',
              enableAutoTransition: Boolean(e.target.value),
            })
          }
          className="text-xs h-8 mt-1.5 bg-white/60 dark:bg-slate-950/60 border border-emerald-300/40 dark:border-emerald-700/40"
          placeholder="или ID вручную"
        />
      </div>
    </div>
  );
}
