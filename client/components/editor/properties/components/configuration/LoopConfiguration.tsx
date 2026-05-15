/**
 * @fileoverview Панель свойств узла loop — настройка цикла по массиву
 * @module components/editor/properties/components/configuration/LoopConfiguration
 */

import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNodeDisplay } from '../../utils/node-formatters';

/** Пропсы компонента LoopConfiguration */
interface LoopConfigurationProps {
  /** Выбранный узел loop */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Все узлы всех листов для выбора целевого узла */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
}

/**
 * Панель конфигурации узла цикла (loop)
 * @param props - Пропсы компонента
 * @returns JSX-элемент панели свойств
 */
export function LoopConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
}: LoopConfigurationProps) {
  const data = selectedNode.data as any;
  const sourceVariable: string = data?.sourceVariable || '';
  const itemVariable: string = data?.itemVariable || 'item';
  const indexVariable: string = data?.indexVariable || 'index';
  const parallel: boolean = data?.parallel || false;
  const delaySeconds: number = data?.delaySeconds || 0;
  const maxIterations: number = data?.maxIterations || 0;
  const autoTransitionTo: string = data?.autoTransitionTo || '';
  const afterLoopTo: string = data?.afterLoopTo || '';

  /** Доступные узлы для перехода (исключаем текущий) */
  const availableTargets = getAllNodesFromAllSheets.filter(
    ({ node }) => node.id !== selectedNode.id
  );

  return (
    <div className="w-full bg-gradient-to-br from-violet-50/40 to-purple-50/20 dark:from-violet-950/30 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-violet-200/40 dark:border-violet-800/40 backdrop-blur-sm">
      <div className="space-y-4">
        {/* Заголовок секции */}
        <div className="flex items-center gap-2">
          <i className="fas fa-sync-alt text-violet-500 dark:text-violet-400 text-sm" />
          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            Цикл по массиву
          </span>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Выполняет цепочку нод для каждого элемента массива
        </p>

        {/* Переменная-источник */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Переменная-источник *</Label>
          <Input
            value={sourceVariable}
            onChange={(e) => onNodeUpdate(selectedNode.id, { sourceVariable: e.target.value } as any)}
            placeholder="exchangers_list"
            className="h-8 text-sm"
          />
          <p className="text-[10px] text-muted-foreground">
            Имя переменной с массивом для итерации
          </p>
        </div>

        {/* Имя элемента */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Имя элемента *</Label>
          <Input
            value={itemVariable}
            onChange={(e) => onNodeUpdate(selectedNode.id, { itemVariable: e.target.value } as any)}
            placeholder="item"
            className="h-8 text-sm"
          />
          <p className="text-[10px] text-muted-foreground">
            Доступно как {'{'}
            {itemVariable || 'item'}
            {'}'} и {'{'}
            {itemVariable || 'item'}.field{'}'}
          </p>
        </div>

        {/* Имя индекса */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Имя индекса</Label>
          <Input
            value={indexVariable}
            onChange={(e) => onNodeUpdate(selectedNode.id, { indexVariable: e.target.value } as any)}
            placeholder="index"
            className="h-8 text-sm"
          />
          <p className="text-[10px] text-muted-foreground">
            Номер итерации (0, 1, 2...)
          </p>
        </div>

        {/* Разделитель */}
        <div className="border-t border-violet-200/40 dark:border-violet-700/30 pt-3">
          <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
            Дополнительно
          </span>
        </div>

        {/* Параллельное выполнение */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="loop-parallel"
            checked={parallel}
            onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { parallel: !!checked } as any)}
          />
          <Label htmlFor="loop-parallel" className="text-xs cursor-pointer">
            Параллельное выполнение (asyncio.gather)
          </Label>
        </div>

        {/* Задержка между итерациями */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Задержка между итерациями (сек)</Label>
          <Input
            type="number"
            min={0}
            step={0.1}
            value={delaySeconds}
            onChange={(e) => onNodeUpdate(selectedNode.id, { delaySeconds: parseFloat(e.target.value) || 0 } as any)}
            className="h-8 text-sm"
          />
          <p className="text-[10px] text-muted-foreground">
            Anti-flood: пауза между шагами
          </p>
        </div>

        {/* Максимум итераций */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Максимум итераций</Label>
          <Input
            type="number"
            min={0}
            value={maxIterations}
            onChange={(e) => onNodeUpdate(selectedNode.id, { maxIterations: parseInt(e.target.value) || 0 } as any)}
            className="h-8 text-sm"
          />
          <p className="text-[10px] text-muted-foreground">
            0 = без лимита
          </p>
        </div>

        {/* Разделитель — переходы */}
        <div className="border-t border-violet-200/40 dark:border-violet-700/30 pt-3">
          <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
            Переходы
          </span>
        </div>

        {/* Тело цикла (autoTransitionTo) */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">↻ Тело цикла</Label>
          <Select
            value={autoTransitionTo || '__none__'}
            onValueChange={(value) => onNodeUpdate(selectedNode.id, {
              autoTransitionTo: value === '__none__' ? '' : value,
              enableAutoTransition: value !== '__none__',
            } as any)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Выберите узел..." />
            </SelectTrigger>
            <SelectContent className="max-h-48 overflow-y-auto">
              <SelectItem value="__none__">— Не выбрано —</SelectItem>
              {availableTargets.map(({ node, sheetName }) => (
                <SelectItem key={node.id} value={node.id}>
                  {formatNodeDisplay(node, sheetName)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            Первый узел цепочки, выполняемой для каждого элемента
          </p>
        </div>

        {/* После цикла (afterLoopTo) */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">→ После цикла</Label>
          <Select
            value={afterLoopTo || '__none__'}
            onValueChange={(value) => onNodeUpdate(selectedNode.id, {
              afterLoopTo: value === '__none__' ? '' : value,
            } as any)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Выберите узел..." />
            </SelectTrigger>
            <SelectContent className="max-h-48 overflow-y-auto">
              <SelectItem value="__none__">— Не выбрано —</SelectItem>
              {availableTargets.map(({ node, sheetName }) => (
                <SelectItem key={node.id} value={node.id}>
                  {formatNodeDisplay(node, sheetName)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            Куда перейти после завершения всех итераций
          </p>
        </div>
      </div>
    </div>
  );
}
