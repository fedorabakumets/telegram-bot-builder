/**
 * @fileoverview Панель свойств узла bot_table — работа с внутренними таблицами
 * @module components/editor/properties/components/configuration/BotTableConfiguration
 */

import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { VariableNameInput } from '../variables/variable-name-input';
import type { Variable } from '../../../inline-rich/types';
import { BotTableWhereSection } from './bot-table-where-section';
import { BotTableUpdatesSection } from './bot-table-updates-section';
import { BotTableRowSection } from './bot-table-row-section';
import { useTablesQuery } from '../../../tables/hooks/use-tables-query';
import { VariableSelector } from '../variables/variable-selector';

/** Пропсы компонента BotTableConfiguration */
interface BotTableConfigurationProps {
  /** Выбранный узел bot_table */
  selectedNode: Node;
  /** ID проекта для загрузки списка таблиц */
  projectId: number;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Все узлы всех листов для выбора следующего узла */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Функция форматирования отображения узла */
  formatNodeDisplay: (node: Node, sheetName: string) => string;
  /** Доступные текстовые переменные проекта */
  textVariables: Variable[];
}

/** Метки операций */
const OPERATION_LABELS: Record<string, string> = {
  read: 'Прочитать',
  insert: 'Вставить',
  update: 'Обновить',
  upsert: 'Создать или обновить',
  delete: 'Удалить',
};

/**
 * Панель конфигурации узла работы с таблицами
 * @param props - Пропсы компонента
 * @returns JSX-элемент панели свойств
 */
export function BotTableConfiguration({
  selectedNode,
  projectId,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  textVariables,
}: BotTableConfigurationProps) {
  const data = selectedNode.data as any;
  const tableName: string = data?.tableName || '';
  const operation: string = data?.operation || 'read';
  const where: Array<{ column: string; value: string }> = data?.where || [];
  const updates: Array<{ column: string; op: string; value: string }> = data?.updates || [];
  const row: Record<string, string> = data?.row || {};
  const key: string = data?.key || '';
  const onConflict: string = data?.onConflict || 'ignore';
  const saveResultTo: string = data?.saveResultTo || '';
  const resultFormat: string = data?.resultFormat || 'first_row';
  const orderBy: string = data?.orderBy || '';
  const orderDirection: string = data?.orderDirection || 'desc';
  const limit: number = data?.limit || 0;
  const autoTransitionTo: string = data?.autoTransitionTo || '';

  /** Загрузка списка таблиц проекта */
  const { data: tables = [] } = useTablesQuery(projectId);

  /** Показывать WHERE: read, update, delete */
  const showWhere = ['read', 'update', 'delete'].includes(operation);
  /** Показывать Updates: update */
  const showUpdates = operation === 'update';
  /** Показывать Row: insert, upsert */
  const showRow = ['insert', 'upsert'].includes(operation);
  /** Показывать ключ и onConflict: upsert */
  const showUpsert = operation === 'upsert';
  /** Показывать сохранение результата: read, update, upsert */
  const showSaveResult = ['read', 'update', 'upsert'].includes(operation);
  /** Показывать формат результата: read */
  const showResultFormat = operation === 'read';

  /** Доступные узлы для перехода */
  const availableTargets = getAllNodesFromAllSheets.filter(
    ({ node }) => node.id !== selectedNode.id
  );

  return (
    <div className="space-y-4 p-4">
      {/* Заголовок */}
      <div className="flex items-center gap-2">
        <i className="fas fa-table text-amber-500 dark:text-amber-400 text-sm" />
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
          Таблица проекта
        </span>
      </div>

      {/* Описание */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        Чтение, запись и обновление данных во внутренних таблицах проекта. Поддерживает операции: чтение, вставка, обновление, upsert и удаление.
      </p>

      {/* Подсказка про управление таблицами */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'tables' }))}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 transition-colors cursor-pointer w-full text-left"
      >
        <i className="fas fa-lightbulb text-amber-500 text-xs" />
        <span className="text-xs text-amber-700 dark:text-amber-400">
          Управляйте данными во вкладке «Таблицы» →
        </span>
      </button>

      {/* Имя таблицы */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Таблица
        </Label>
        <Select
          value={tableName || 'no-table'}
          onValueChange={(value) => onNodeUpdate(selectedNode.id, { tableName: value === 'no-table' ? '' : value })}
        >
          <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60">
            <SelectValue placeholder="Выберите таблицу" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-table" disabled>Выберите таблицу</SelectItem>
            {tables.map((t: any) => (
              <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Input
            value={tableName}
            onChange={(e) => onNodeUpdate(selectedNode.id, { tableName: e.target.value })}
            placeholder="или введите имя новой таблицы"
            className="text-xs h-7 flex-1 bg-white/60 dark:bg-slate-950/60 border-dashed"
          />
          <VariableSelector
            availableVariables={textVariables}
            onSelect={(name) => onNodeUpdate(selectedNode.id, { tableName: tableName + `{${name}}` })}
          />
        </div>
      </div>

      {/* Операция */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Операция
        </Label>
        <Select
          value={operation}
          onValueChange={(value) => onNodeUpdate(selectedNode.id, { operation: value })}
        >
          <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(OPERATION_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* WHERE секция */}
      {showWhere && (
        <BotTableWhereSection
          where={where}
          onChange={(w) => onNodeUpdate(selectedNode.id, { where: w })}
        />
      )}

      {/* Updates секция */}
      {showUpdates && (
        <BotTableUpdatesSection
          updates={updates}
          onChange={(u) => onNodeUpdate(selectedNode.id, { updates: u })}
        />
      )}

      {/* Row секция */}
      {showRow && (
        <BotTableRowSection
          row={row}
          onChange={(r) => onNodeUpdate(selectedNode.id, { row: r })}
        />
      )}

      {/* Upsert: ключ и onConflict */}
      {showUpsert && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Ключ (уникальная колонка)
            </Label>
            <Input
              value={key}
              onChange={(e) => onNodeUpdate(selectedNode.id, { key: e.target.value })}
              placeholder="telegram_id"
              className="text-xs h-8 bg-white/60 dark:bg-slate-950/60"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              При конфликте
            </Label>
            <Select
              value={onConflict}
              onValueChange={(value) => onNodeUpdate(selectedNode.id, { onConflict: value })}
            >
              <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ignore">Игнорировать</SelectItem>
                <SelectItem value="update">Перезаписать</SelectItem>
                <SelectItem value="merge">Объединить (только пустые)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Формат результата (только read) */}
      {showResultFormat && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Формат результата
          </Label>
          <Select
            value={resultFormat}
            onValueChange={(value) => onNodeUpdate(selectedNode.id, { resultFormat: value })}
          >
            <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="first_row">Первая строка (объект)</SelectItem>
              <SelectItem value="all_rows">Все строки (массив)</SelectItem>
              <SelectItem value="scalar">Одно значение</SelectItem>
              <SelectItem value="count">Количество строк</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Сортировка и лимит (только read) */}
      {showResultFormat && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Сортировка
            </Label>
            <Input
              value={orderBy}
              onChange={(e) => onNodeUpdate(selectedNode.id, { orderBy: e.target.value })}
              placeholder="колонка"
              className="text-xs h-8 bg-white/60 dark:bg-slate-950/60"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Направление
            </Label>
            <Select
              value={orderDirection}
              onValueChange={(value) => onNodeUpdate(selectedNode.id, { orderDirection: value })}
            >
              <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">По возрастанию</SelectItem>
                <SelectItem value="desc">По убыванию</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {showResultFormat && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Лимит (0 = без лимита)
          </Label>
          <Input
            type="number"
            value={limit || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { limit: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className="text-xs h-8 bg-white/60 dark:bg-slate-950/60"
          />
        </div>
      )}

      {/* Сохранить результат */}
      {showSaveResult && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Сохранить результат в переменную
          </Label>
          <VariableNameInput
            value={saveResultTo}
            availableVariables={textVariables}
            onChange={(value) => onNodeUpdate(selectedNode.id, { saveResultTo: value })}
            placeholder="profile"
          />
        </div>
      )}

      {/* Следующий узел */}
      <div className="flex flex-col p-3 rounded-lg bg-gradient-to-br from-amber-50/60 to-yellow-50/40 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-200/40 dark:border-amber-700/40">
        <Label className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1.5">
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
          <SelectTrigger className="text-xs h-8 bg-white/60 dark:bg-slate-950/60 border border-amber-300/40 dark:border-amber-700/40">
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
          className="text-xs h-8 mt-1.5 bg-white/60 dark:bg-slate-950/60 border border-amber-300/40 dark:border-amber-700/40"
          placeholder="или ID вручную"
        />
      </div>
    </div>
  );
}
