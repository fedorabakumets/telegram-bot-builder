import { useState } from 'react';
import type { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TriggerTargetSelector } from './TriggerTargetSelector';
import { formatNodeDisplay as defaultFormatNodeDisplay } from '../../utils/node-formatters';

interface TextTriggerConfigurationProps {
  selectedNode: Node;
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
  formatNodeDisplay?: (node: Node, sheetName?: string) => string;
}

export function TextTriggerConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay = defaultFormatNodeDisplay,
}: TextTriggerConfigurationProps) {
  const texts: string[] = (selectedNode.data as any)?.textSynonyms || [];
  const matchType: string = (selectedNode.data as any)?.textMatchType || 'exact';
  const [newText, setNewText] = useState('');

  /** Обновляет массив текстов */
  const updateTexts = (newTexts: string[]) => {
    onNodeUpdate(selectedNode.id, { textSynonyms: newTexts });
  };

  /** Добавляет новый текст */
  const addText = () => {
    const trimmed = newText.trim();
    if (trimmed && !texts.includes(trimmed)) {
      updateTexts([...texts, trimmed]);
      setNewText('');
    }
  };

  /** Удаляет текст по индексу */
  const removeText = (index: number) => {
    updateTexts(texts.filter((_, i) => i !== index));
  };

  /** Обработка Enter в поле ввода */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addText();
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Тексты для срабатывания */}
      <div className="space-y-2">
        <Label>Тексты для срабатывания</Label>

        {/* Список существующих текстов */}
        {texts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {texts.map((text, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs"
              >
                {text}
                <button
                  type="button"
                  onClick={() => removeText(i)}
                  className="text-blue-400 hover:text-red-400 transition-colors ml-0.5"
                >
                  <i className="fas fa-times text-[9px]"></i>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Поле добавления нового текста */}
        <div className="flex gap-2">
          <Input
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите текст и нажмите Enter"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addText}
            disabled={!newText.trim()}
          >
            <i className="fas fa-plus mr-1"></i>
            Добавить
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Триггер сработает на любой из указанных текстов
        </div>
      </div>

      {/* Режим совпадения */}
      <div className="space-y-2">
        <Label>Режим совпадения</Label>
        <Select
          value={matchType}
          onValueChange={(v) => onNodeUpdate(selectedNode.id, { textMatchType: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="exact">Точное совпадение</SelectItem>
            <SelectItem value="contains">Содержит подстроку</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground">
          {matchType === 'exact'
            ? 'Сообщение должно быть точно равно одному из указанных текстов'
            : 'Сообщение должно содержать один из указанных текстов'}
        </div>
      </div>

      <TriggerTargetSelector
        selectedNode={selectedNode}
        autoTransitionTo={selectedNode.data?.autoTransitionTo || ''}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        onNodeUpdate={onNodeUpdate}
        formatNodeDisplay={formatNodeDisplay}
      />
    </div>
  );
}
