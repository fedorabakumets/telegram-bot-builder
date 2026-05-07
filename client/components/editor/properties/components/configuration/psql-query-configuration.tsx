/**
 * @fileoverview Панель свойств узла psql_query — настройка SQL-запроса к базе данных
 * @module components/editor/properties/components/configuration/psql-query-configuration
 */

import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VariableNameInput } from '../variables/variable-name-input';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы компонента PsqlQueryConfiguration */
interface PsqlQueryConfigurationProps {
  /** Выбранный узел psql_query */
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
 * Панель конфигурации узла SQL-запроса
 * @param props - Пропсы компонента
 * @returns JSX-элемент панели свойств
 */
export function PsqlQueryConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  textVariables,
}: PsqlQueryConfigurationProps) {
  const data = selectedNode.data as any;
  const query: string = data?.query || '';
  const saveResultTo: string = data?.saveResultTo || '';
  const resultFormat: string = data?.resultFormat || 'first_row';
  const textTemplate: string = data?.textTemplate || '';
  const autoTransitionTo: string = data?.autoTransitionTo || '';

  /** Доступные узлы для перехода (исключаем текущий) */
  const availableTargets = getAllNodesFromAllSheets.filter(
    ({ node }) => node.id !== selectedNode.id
  );

  return (
    <div className="space-y-4 p-4">
      {/* Заголовок секции */}
      <div className="flex items-center gap-2">
        <i className="fas fa-database text-violet-500 dark:text-violet-400 text-sm" />
        <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
          SQL-запрос
        </span>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Поддерживаются переменные в формате {'{user_id}'}, {'{referrer_id}'}
      </p>

      {/* SQL-запрос */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          SQL-запрос
        </Label>
        <Textarea
          value={query}
          onChange={(e) => onNodeUpdate(selectedNode.id, { query: e.target.value })}
          placeholder="SELECT * FROM bot_users WHERE user_id = {user_id}"
          className="text-xs font-mono min-h-[100px] resize-y bg-white/60 dark:bg-slate-950/60"
          rows={5}
        />
      </div>

      {/* Формат результата */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Формат результата
        </Label>
        <Select
          value={resultFormat}
          onValueChange={(value) => onNodeUpdate(selectedNode.id, { resultFormat: value as any })}
        >
          <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="first_row">Первая строка (объект)</SelectItem>
            <SelectItem value="json">JSON (массив объектов)</SelectItem>
            <SelectItem value="text">Текст (по шаблону)</SelectItem>
            <SelectItem value="affected">Количество затронутых строк</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Шаблон строки — только для формата text */}
      {resultFormat === 'text' && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Шаблон строки
          </Label>
          <Input
            value={textTemplate}
            onChange={(e) => onNodeUpdate(selectedNode.id, { textTemplate: e.target.value })}
            placeholder="{username} — {score} очков"
            className="text-xs h-8 font-mono bg-white/60 dark:bg-slate-950/60"
          />
          <p className="text-xs text-muted-foreground">
            Шаблон применяется к каждой строке результата
          </p>
        </div>
      )}

      {/* Сохранить результат в переменную */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Сохранить результат в переменную
        </Label>
        <VariableNameInput
          value={saveResultTo}
          availableVariables={textVariables}
          onChange={(value) => onNodeUpdate(selectedNode.id, { saveResultTo: value })}
          placeholder="stats_result"
        />
      </div>

      {/* Следующий узел */}
      <div className="flex flex-col p-3 rounded-lg bg-gradient-to-br from-violet-50/60 to-purple-50/40 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200/40 dark:border-violet-700/40">
        <Label className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-2 flex items-center gap-1.5">
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
          <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60 border border-violet-300/40 dark:border-violet-700/40">
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
          className="text-xs h-8 mt-1.5 bg-white/60 dark:bg-slate-950/60 border border-violet-300/40 dark:border-violet-700/40"
          placeholder="или ID вручную"
        />
      </div>
    </div>
  );
}
