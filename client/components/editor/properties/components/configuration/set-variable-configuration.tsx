/**
 * @fileoverview Панель свойств узла set_variable — редактирование присваиваний переменных
 *
 * Отображает список пар «переменная → значение» с возможностью
 * добавления, изменения и удаления строк, а также выбор следующего узла.
 * Поддерживает вставку переменных через селектор.
 *
 * @module components/editor/properties/components/configuration/set-variable-configuration
 */

import { Node } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { getNodeTypeLabel } from '../../utils/node-formatters';
import { VariableNameInput } from '../variables/variable-name-input';
import { VariableSelector } from '../variables/variable-selector';
import type { Variable } from '../../../inline-rich/types';

/** Одно присваивание переменной */
interface Assignment {
  /** Уникальный идентификатор */
  id: string;
  /** Имя переменной */
  variable: string;
  /** Значение или шаблон */
  value: string;
}

/** Пропсы компонента SetVariableConfiguration */
interface SetVariableConfigurationProps {
  /** Выбранный узел set_variable */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Все узлы всех листов для выбора следующего узла */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Функция форматирования отображения узла */
  formatNodeDisplay: (node: Node, sheetName: string) => string;
  /** Доступные переменные проекта */
  textVariables: Variable[];
}

/** Пропсы строки присваивания */
interface AssignmentRowProps {
  /** Данные присваивания */
  assignment: Assignment;
  /** Обработчик изменения поля */
  onChange: (id: string, field: 'variable' | 'value', val: string) => void;
  /** Обработчик удаления */
  onRemove: (id: string) => void;
  /** Можно ли удалить строку */
  canRemove: boolean;
  /** Доступные переменные для вставки */
  textVariables: Variable[];
}

/**
 * Строка одного присваивания переменной
 *
 * @param props - Пропсы строки
 * @returns JSX-элемент строки
 */
function AssignmentRow({ assignment, onChange, onRemove, canRemove, textVariables }: AssignmentRowProps) {
  /**
   * Вставляет переменную в поле значения в формате {varName}
   * @param varName - имя переменной для вставки
   */
  const handleInsertVariable = (varName: string) => {
    const wrapped = `{${varName}}`;
    onChange(assignment.id, 'value', assignment.value + wrapped);
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Поле имени переменной с селектором */}
      <div className="flex-1">
        <VariableNameInput
          value={assignment.variable}
          availableVariables={textVariables}
          onChange={(val) => onChange(assignment.id, 'variable', val)}
          placeholder="имя_переменной"
        />
      </div>

      <span className="text-muted-foreground text-xs flex-shrink-0">→</span>

      {/* Поле значения с кнопкой вставки переменной */}
      <div className="flex-1 flex items-center gap-1">
        <Input
          placeholder="значение или {переменная}"
          value={assignment.value}
          onChange={(e) => onChange(assignment.id, 'value', e.target.value)}
          className="flex-1 text-xs h-8"
        />
        <VariableSelector
          availableVariables={textVariables}
          onSelect={handleInsertVariable}
        />
      </div>

      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(assignment.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

/**
 * Панель конфигурации узла установки переменных
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент панели свойств
 */
export function SetVariableConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  textVariables,
}: SetVariableConfigurationProps) {
  const data = selectedNode.data as any;
  const assignments: Assignment[] = data?.assignments || [];
  const autoTransitionTo: string = data?.autoTransitionTo || '';

  /** Доступные узлы для перехода (исключаем текущий) */
  const availableTargets = getAllNodesFromAllSheets.filter(
    ({ node }) => node.id !== selectedNode.id
  );

  /**
   * Обновляет поле конкретного присваивания
   * @param id - ID присваивания
   * @param field - поле для изменения
   * @param val - новое значение
   */
  const handleChange = (id: string, field: 'variable' | 'value', val: string) => {
    const updated = assignments.map((a) =>
      a.id === id ? { ...a, [field]: val } : a
    );
    onNodeUpdate(selectedNode.id, { assignments: updated });
  };

  /**
   * Удаляет присваивание по ID
   * @param id - ID присваивания для удаления
   */
  const handleRemove = (id: string) => {
    onNodeUpdate(selectedNode.id, {
      assignments: assignments.filter((a) => a.id !== id),
    });
  };

  /**
   * Добавляет новое пустое присваивание
   */
  const handleAdd = () => {
    const newAssignment: Assignment = {
      id: `assign_${Date.now()}`,
      variable: '',
      value: '',
    };
    onNodeUpdate(selectedNode.id, {
      assignments: [...assignments, newAssignment],
    });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Заголовок секции */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <i className="fas fa-pen text-emerald-500 dark:text-emerald-400 text-sm" />
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Установить переменные
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Задайте переменные и их значения. Поддерживаются шаблоны: {'{first_name}'}, {'{response.data.name}'}
        </p>
      </div>

      {/* Список присваиваний */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Переменная → Значение
        </Label>

        <div className="space-y-2">
          {assignments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-2">
              Нет присваиваний — нажмите «Добавить»
            </p>
          ) : (
            assignments.map((a) => (
              <AssignmentRow
                key={a.id}
                assignment={a}
                onChange={handleChange}
                onRemove={handleRemove}
                canRemove={assignments.length > 1}
                textVariables={textVariables}
              />
            ))
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs border-dashed"
          onClick={handleAdd}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Добавить переменную
        </Button>
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
        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1.5">
          Куда перейти после установки переменных
        </p>
      </div>
    </div>
  );
}
