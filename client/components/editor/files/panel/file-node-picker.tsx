/** @fileoverview Выбор блока прикрепления по списку, названию или точному ID без перехода на холст. */
import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AttachTarget, SheetInfo } from './panel-types';
import './file-node-picker.css';

/** Свойства выбора блока назначения. */
interface FileNodePickerProps {
  /** Листы текущего проекта. */
  sheets: SheetInfo[];
  /** Выбранная цель прикрепления. */
  target?: AttachTarget | null;
  /** Выбрать существующий блок проекта. */
  onSelect: (nodeId: string | null) => void;
}

/**
 * Показывает селектор блоков и поле для прямого выбора по ID.
 * @param props - Листы, выбранная цель и обработчик
 * @returns Форма выбора цели прикрепления
 */
export function FileNodePicker({ sheets, target, onSelect }: FileNodePickerProps) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [error, setError] = useState(false);
  const nodes = sheets.flatMap(sheet => sheet.nodes.map(node => ({
    id: node.id, sheet: sheet.name,
    label: String(node.data.messageText || node.data.label || node.id).replace(/<[^>]*>/g, '').slice(0, 80),
  })));
  const normalized = query.trim().toLowerCase();
  const filtered = nodes.filter(node => `${node.id} ${node.label} ${node.sheet}`.toLowerCase().includes(normalized));
  /** Применяет только точный ID существующего блока текущего проекта. */
  const applyId = () => {
    const node = nodes.find(item => item.id === query.trim());
    setError(!node);
    if (node) onSelect(node.id);
  };
  return <div className="file-node-picker space-y-3">
    <div className="space-y-2">
      <label htmlFor={`${id}-search`} className="block text-sm font-medium text-foreground">Название или ID блока</label>
      <div className="file-node-picker-search flex flex-wrap gap-2">
        <Input id={`${id}-search`} value={query} onChange={event => { setQuery(event.target.value); setError(false); }}
          onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); applyId(); } }}
          placeholder="Найти блок или вставить ID" className={`min-w-0 flex-1 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          aria-invalid={error} aria-describedby={error ? `${id}-error` : undefined} />
        <Button type="button" variant="outline" onClick={applyId} disabled={!query.trim()}>Выбрать по ID</Button>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">Блок с таким ID не найден в этом проекте.</p>}
    </div>
    <Select value={target?.nodeId ?? ''} onValueChange={nodeId => { onSelect(nodeId); setError(false); }}>
      <SelectTrigger aria-label="Блок для прикрепления" className="w-full min-w-0"><SelectValue placeholder="Выберите блок из списка" /></SelectTrigger>
      <SelectContent className="file-node-picker-menu" collisionPadding={12}>
        {filtered.map(node => <SelectItem key={node.id} value={node.id} textValue={`${node.label} ${node.id}`}>
          <span className="block min-w-0 space-y-1"><span className="block text-sm">{node.label}</span>
            <span className="block text-xs text-muted-foreground">{node.sheet} · {node.id}</span></span>
        </SelectItem>)}
        {!filtered.length && <p className="px-3 py-2 text-sm text-muted-foreground">Блоки не найдены</p>}
      </SelectContent>
    </Select>
    {target && <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
      <p className="min-w-0 break-all text-xs text-muted-foreground">Выбран ID: {target.nodeId}</p>
      <Button type="button" variant="ghost" size="sm" onClick={() => { onSelect(null); setQuery(''); setError(false); }}>Сбросить блок</Button>
    </div>}
  </div>;
}
