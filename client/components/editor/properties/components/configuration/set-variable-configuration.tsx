/**
 * @fileoverview Панель свойств узла set_variable — редактирование присваиваний переменных
 *
 * Отображает список пар «переменная → значение» с возможностью
 * добавления, изменения и удаления строк.
 *
 * @module components/editor/properties/components/configuration/set-variable-configuration
 */

import { Node } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

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
}

/**
 * Строка одного присваивания переменной
 *
 * @param props - Пропсы строки
 * @returns JSX-элемент строки
 */
function AssignmentRow({
  assignment,
  onChange,
  onRemove,
  canRemove,
}: {
  /** Данные присваивания */
  assignment: Assignment;
  /** Обработчик изменения поля */
  onChange: (id: string, field: 'variable' | 'value', val: string) => void;
  /** Обработчик удаления */
  onRemove: (id: string) => void;
  /** Можно ли удалить строку */
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="имя_переменной"
        value={assignment.variable}
        onChange={(e) => onChange(assignment.id, 'variable', e.target.value)}
        className="flex-1 font-mono text-xs h-8"
      />
      <span className="text-muted-foreground text-xs flex-shrink-0">←</span>
      <Input
        placeholder="значение или {переменная}"
        value={assignment.value}
        onChange={(e) => onChange(assignment.id, 'value', e.target.value)}
        className="flex-1 text-xs h-8"
      />
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
}: SetVariableConfigurationProps) {
  const data = selectedNode.data as any;
  const assignments: Assignment[] = data?.assignments || [];

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

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Переменная ← Значение
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
    </div>
  );
}
