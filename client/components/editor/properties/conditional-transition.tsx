/**
 * @fileoverview Компонент выбора перехода после ввода для условного сообщения
 * @description Отображает селектор и поле ввода для выбора следующего узла.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ConditionalTransitionProps {
  condition: any;
  selectedNode: any;
  getAllNodesFromAllSheets: Array<{ node: any; sheetName: string }>;
  onNodeUpdate: (nodeId: string, updates: any) => void;
}

const updateCondition = (condition: any, selectedNode: any, updates: any, onNodeUpdate: any) => {
  const conditions = selectedNode.data.conditionalMessages || [];
  onNodeUpdate(selectedNode.id, {
    conditionalMessages: conditions.map((c: any) => c.id === condition.id ? { ...c, ...updates } : c)
  });
};

/**
 * Компонент выбора перехода после ввода
 */
export function ConditionalTransition({ condition, selectedNode, getAllNodesFromAllSheets, onNodeUpdate }: ConditionalTransitionProps) {
  const hasAnyInput = condition.enableTextInput || condition.waitForTextInput || condition.enablePhotoInput ||
    condition.enableVideoInput || condition.enableAudioInput || condition.enableDocumentInput;

  if (!hasAnyInput) return null;

  return (
    <div className="space-y-2 pt-2 border-t border-blue-200/30 dark:border-blue-800/30">
      <Label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
        <i className="fas fa-arrow-right text-blue-600 dark:text-blue-400"></i>
        <span>Переход после ответа</span>
      </Label>
      <div className="space-y-2.5">
        <Select
          value={condition.nextNodeAfterInput || 'no-transition'}
          onValueChange={(value) => updateCondition(condition, selectedNode, { nextNodeAfterInput: value === 'no-transition' ? undefined : value }, onNodeUpdate)}
        >
          <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10 bg-gradient-to-br from-blue-50/60 to-white/60 dark:from-blue-950/30 dark:to-slate-950/70 border border-blue-300/60 dark:border-blue-700/60 hover:border-blue-400/80 dark:hover:border-blue-600/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40 rounded-lg">
            <SelectValue placeholder="Выберите узел..." />
          </SelectTrigger>
          <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 max-h-48 overflow-y-auto">
            <SelectItem value="no-transition">Не переходить</SelectItem>
            {getAllNodesFromAllSheets.filter(n => n.node.id !== selectedNode.id).map(({ node, sheetName }) => {
              const nodeContent =
                node.type === 'command' ? node.data.command :
                  node.type === 'message' ? ((node.data as any).messageText || '').slice(0, 50) :
                    ((node.data as any).label || '').slice(0, 50);
              return (
                <SelectItem key={node.id} value={node.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-sky-700 dark:text-sky-300">{node.id}</span>
                    {nodeContent && <span className="text-xs text-muted-foreground truncate">{nodeContent}</span>}
                    <span className="text-xs text-blue-600 dark:text-blue-400">({sheetName})</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Input
          value={condition.nextNodeAfterInput && condition.nextNodeAfterInput !== 'no-transition' ? condition.nextNodeAfterInput : ''}
          onChange={(e) => updateCondition(condition, selectedNode, { nextNodeAfterInput: e.target.value || undefined }, onNodeUpdate)}
          className="text-xs sm:text-sm h-9 sm:h-10 bg-white/60 dark:bg-slate-950/60 border border-blue-300/40 dark:border-blue-700/40 focus:border-blue-500 rounded-lg text-foreground placeholder:text-muted-foreground/50"
          placeholder="Введите ID узла (опционально)"
        />
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed">
        Узел, куда перейти после получения ответа от пользователя
      </div>
    </div>
  );
}
