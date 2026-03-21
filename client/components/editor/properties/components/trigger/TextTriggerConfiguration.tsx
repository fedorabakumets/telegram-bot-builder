/**
 * @fileoverview Панель свойств узла текстового триггера
 *
 * Позволяет редактировать список текстов и режим совпадения
 * для узла типа text_trigger в панели свойств редактора.
 * Каждый узел — один или несколько текстовых триггеров.
 *
 * Поле «Следующий узел» задаёт `autoTransitionTo` — ID узла,
 * к которому будет нарисовано жёлтое соединение на холсте.
 * @module components/editor/properties/components/trigger/TextTriggerConfiguration
 */

import { useState } from 'react';
import type { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

/**
 * Пропсы компонента TextTriggerConfiguration
 */
interface TextTriggerConfigurationProps {
  /** Выбранный узел типа text_trigger */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Компонент настройки узла текстового триггера
 *
 * Отображает поля: список текстов (теги с добавлением/удалением),
 * режим совпадения (exact/contains), следующий узел.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент панели настроек текстового триггера
 */
export function TextTriggerConfiguration({ selectedNode, onNodeUpdate }: TextTriggerConfigurationProps) {
  const [newText, setNewText] = useState('');

  /** Список текстов из данных узла */
  const texts: string[] = (selectedNode.data as any)?.textSynonyms || [];
  /** Режим совпадения */
  const matchType: 'exact' | 'contains' = (selectedNode.data as any)?.textMatchType || 'exact';

  /** Добавить новый текст в список */
  const handleAdd = () => {
    const trimmed = newText.trim();
    if (!trimmed || texts.includes(trimmed)) return;
    onNodeUpdate(selectedNode.id, { textSynonyms: [...texts, trimmed] });
    setNewText('');
  };

  /** Удалить текст из списка по индексу */
  const handleRemove = (index: number) => {
    onNodeUpdate(selectedNode.id, { textSynonyms: texts.filter((_, i) => i !== index) });
  };

  /** Обработка Enter в поле ввода */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Список текстов */}
      <div className="space-y-2">
        <Label>Тексты для срабатывания</Label>
        <div className="flex gap-2">
          <Input
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите текст и нажмите Enter"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <i className="fas fa-plus" />
          </Button>
        </div>
        {texts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {texts.map((text, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
              >
                {text}
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="ml-0.5 hover:text-red-500 transition-colors"
                  aria-label={`Удалить "${text}"`}
                >
                  <i className="fas fa-times text-[10px]" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Режим совпадения */}
      <div className="space-y-2">
        <Label>Режим совпадения</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onNodeUpdate(selectedNode.id, { textMatchType: 'exact' })}
            className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
              matchType === 'exact'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            Точное
          </button>
          <button
            type="button"
            onClick={() => onNodeUpdate(selectedNode.id, { textMatchType: 'contains' })}
            className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
              matchType === 'contains'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            Содержит
          </button>
        </div>
      </div>

      {/* Следующий узел — задаёт выходное соединение (жёлтая линия на холсте) */}
      <div className="space-y-2">
        <Label>Следующий узел (ID)</Label>
        <Input
          value={selectedNode.data?.autoTransitionTo || ''}
          onChange={e => onNodeUpdate(selectedNode.id, { autoTransitionTo: e.target.value })}
          placeholder="ID следующего узла"
          className="font-mono"
        />
      </div>
    </div>
  );
}
