/**
 * @fileoverview Компонент выбора целевого узла для кнопки ответа
 * @description Отображает селектор с узлами, разделёнными на команды и другие узлы.
 */

import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TargetNodeSelectorProps {
  option: { id: string; text: string; target?: string; url?: string; action: string; value?: string; };
  index: number;
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  selectedNode: Node;
  onOptionsUpdate: (updatedOptions: any[]) => void;
  formatNodeDisplay: (node: Node, sheetName: string) => string;
}

/** Информация об узле для отображения */
interface NodeInfo { name: string; icon: string; }

const NODE_INFO: Record<string, { name: string; icon: string }> = {
  message: { name: 'Сообщение', icon: 'fas fa-comment text-blue-500' },
  location: { name: 'Геолокация', icon: 'fas fa-map-marker-alt text-pink-500' },
  contact: { name: 'Контакт', icon: 'fas fa-address-book text-teal-500' },
  sticker: { name: 'Стикер', icon: 'fas fa-smile text-yellow-400' },
  voice: { name: 'Голосовое', icon: 'fas fa-microphone text-blue-400' },
  animation: { name: 'Анимация', icon: 'fas fa-play-circle text-green-400' }
};

const getNodeInfo = (node: Node): NodeInfo => {
  if (node.type in NODE_INFO) return NODE_INFO[node.type];
  if (node.data?.collectUserInput) return { name: 'Сбор данных', icon: 'fas fa-user-edit text-indigo-500' };
  return { name: 'Узел', icon: 'fas fa-cube text-gray-400' };
};

/**
 * Компонент выбора целевого узла
 */
export function TargetNodeSelector({
  option, index, getAllNodesFromAllSheets, selectedNode, onOptionsUpdate, formatNodeDisplay
}: TargetNodeSelectorProps) {
  const updateTarget = (value: string) => {
    const updated = [...(selectedNode.data.responseOptions || [])];
    updated[index] = { ...option, target: value } as any;
    onOptionsUpdate(updated);
  };

  return (
    <div>
      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 block">Выберите экран</Label>
      <Select value={option.target || ''} onValueChange={updateTarget}>
        <SelectTrigger className="text-xs bg-white/60 dark:bg-slate-950/60 border border-blue-300/40 dark:border-blue-700/40 hover:border-blue-400/60 focus:border-blue-500 focus:ring-blue-400/30">
          <SelectValue placeholder="⊘ Не выбрано" />
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 max-h-48 overflow-y-auto">
          {getAllNodesFromAllSheets.filter(n => n.node.id !== selectedNode.id && (n.node.type === 'start' || n.node.type === 'command'))
            .map(({ node, sheetName }) => (
              <SelectItem key={node.id} value={node.id}>
                <span className="text-xs font-mono text-sky-700 dark:text-sky-300 truncate">{formatNodeDisplay(node, sheetName)}</span>
              </SelectItem>
            ))}
          {getAllNodesFromAllSheets.filter(n => n.node.id !== selectedNode.id && n.node.type !== 'start' && n.node.type !== 'command')
            .map(({ node, sheetName }) => {
              const { name, icon } = getNodeInfo(node);
              return (
                <SelectItem key={node.id} value={node.id}>
                  <div className="flex items-center gap-2">
                    <i className={`${icon} text-xs`}></i>
                    <span>{name}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">({sheetName})</span>
                  </div>
                </SelectItem>
              );
            })}
        </SelectContent>
      </Select>
      <Input value={option.target || ''} onChange={(e) => updateTarget(e.target.value)}
        className="text-xs border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200 mt-1"
        placeholder="или введите ID экрана вручную" />
    </div>
  );
}
