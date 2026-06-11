/**
 * @fileoverview Панель свойств узла параллельного запуска (parallel_split).
 * Содержит список веток, лимит одновременности и переключатели режимов.
 */
import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import type { ParallelBranch } from '@shared/types/parallel-split-node';
import { ParallelSplitBranchItem } from './ParallelSplitBranchItem';

interface ParallelSplitConfigurationProps {
  /** Выбранный узел parallel_split */
  selectedNode: Node;
  /** Все узлы из всех листов для выбора цели перехода */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Компонент конфигурации узла параллельного запуска.
 * Отображает список веток с возможностью добавления и дополнительные настройки.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ParallelSplitConfiguration({ selectedNode, getAllNodesFromAllSheets, onNodeUpdate }: ParallelSplitConfigurationProps) {
  const data = selectedNode.data as any;
  const branches: ParallelBranch[] = data?.parallelBranches || [];
  const maxConcurrent: number = data?.maxConcurrent ?? 5;
  const awaitAll: boolean = data?.awaitAll ?? false;
  const skipIfRunning: boolean = data?.skipIfRunning ?? true;

  /**
   * Обновляет поле ветки по её идентификатору.
   * @param id - идентификатор ветки
   * @param field - изменяемое поле
   * @param value - новое значение
   */
  const handleBranchChange = (id: string, field: keyof ParallelBranch, value: string) => {
    const updated = branches.map(b => b.id === id ? { ...b, [field]: value } : b);
    onNodeUpdate(selectedNode.id, { parallelBranches: updated });
  };

  /**
   * Удаляет ветку по её идентификатору.
   * @param id - идентификатор ветки для удаления
   */
  const handleBranchDelete = (id: string) => {
    onNodeUpdate(selectedNode.id, { parallelBranches: branches.filter(b => b.id !== id) });
  };

  /** Добавляет новую пустую ветку в конец списка */
  const handleBranchAdd = () => {
    const newBranch: ParallelBranch = {
      id: `pbranch_${Date.now()}`,
      label: '',
      target: '',
    };
    onNodeUpdate(selectedNode.id, { parallelBranches: [...branches, newBranch] });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Список веток */}
      <div className="space-y-2">
        <Label>Ветки параллельного запуска</Label>
        {branches.map((branch, index) => (
          <ParallelSplitBranchItem
            key={branch.id}
            branch={branch}
            index={index}
            onChange={handleBranchChange}
            onDelete={handleBranchDelete}
            getAllNodesFromAllSheets={getAllNodesFromAllSheets}
          />
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={handleBranchAdd}
          className="w-full border-dashed border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-400"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Добавить ветку
        </Button>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Все ветки запускаются одновременно — каждая живёт своей жизнью
        </p>
      </div>

      {/* Лимит одновременных веток */}
      <div className="space-y-2">
        <Label>Максимум одновременных веток</Label>
        <Input
          type="number"
          min={0}
          value={maxConcurrent}
          onChange={e => onNodeUpdate(selectedNode.id, { maxConcurrent: parseInt(e.target.value, 10) || 0 })}
          className="text-sm h-8"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Остальные ждут в очереди — защита от FloodWait и квот API. 0 — без лимита
        </p>
      </div>

      {/* Защита от двойного запуска */}
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <Label>Не запускать повторно</Label>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Пока предыдущий прогон пользователя не завершён
          </p>
        </div>
        <Switch
          checked={skipIfRunning}
          onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { skipIfRunning: checked })}
        />
      </div>

      {/* Режим ожидания всех веток */}
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <Label>Ждать завершения всех веток</Label>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            По умолчанию выключено — обработчик завершается сразу
          </p>
        </div>
        <Switch
          checked={awaitAll}
          onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { awaitAll: checked })}
        />
      </div>
    </div>
  );
}
