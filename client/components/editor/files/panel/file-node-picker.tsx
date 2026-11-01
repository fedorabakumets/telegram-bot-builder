/** @fileoverview Выбор блока прикрепления по списку, названию или точному ID без перехода на холст. */
import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AttachTarget, SheetInfo } from './panel-types';
import './file-node-picker.css';
import { NodePhotoGallery } from './node-photo-gallery';
import { canAttachNodeMedia } from './can-attach-node-media';
import { NodeMediaSummary } from './node-media-summary';

/** Свойства выбора блока назначения. */
interface FileNodePickerProps {
  /** Проект для просмотра прикреплённых фотографий. */
  projectId: number;
  /** Предпочитаемый токен Telegram для фотографий. */
  tokenId?: number | null;
  /** Листы текущего проекта. */
  sheets: SheetInfo[];
  /** Выбранная цель прикрепления. */
  target?: AttachTarget | null;
  /** Выбрать существующий блок проекта. */
  onSelect: (nodeId: string | null) => void;
  /** Открыть лист и сфокусировать выбранный блок на холсте. */
  onGoToNode?: (nodeId: string, sheetId: string) => void;
}

/**
 * Показывает селектор блоков и поле для прямого выбора по ID.
 * @param props - Листы, выбранная цель и обработчик
 * @returns Форма выбора цели прикрепления
 */
export function FileNodePicker({ sheets, target, onSelect, projectId, tokenId, onGoToNode }: FileNodePickerProps) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [error, setError] = useState(false);
  const nodes = sheets.flatMap(sheet => sheet.nodes.filter(canAttachNodeMedia).map(node => ({
    id: node.id, sheet: sheet.name, data: node.data,
    label: String(node.data.messageText || node.data.label || node.id).replace(/<[^>]*>/g, '').slice(0, 80),
  })));
  const normalized = query.trim().toLowerCase();
  const filtered = nodes.filter(node => `${node.id} ${node.label} ${node.sheet}`.toLowerCase().includes(normalized));
  /** Лист назначения берётся из актуального проекта, включая неактивные листы. */
  const targetSheet = target && sheets.find(sheet => sheet.nodes.some(node => node.id === target.nodeId));
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
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">Блок не найден или не поддерживает прикрепление медиа. Выберите блок из списка.</p>}
    </div>
    <Select value={target?.nodeId ?? ''} onValueChange={nodeId => { onSelect(nodeId); setError(false); }}>
      <SelectTrigger aria-label="Блок для прикрепления" className="w-full min-w-0">
        <SelectValue placeholder="Выберите блок из списка">
          {target ? <span className="block truncate">{nodes.find(node => node.id === target.nodeId)?.label ?? target.nodeLabel}</span> : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="file-node-picker-menu" collisionPadding={12}>
        {filtered.map(node => <SelectItem key={node.id} value={node.id} textValue={`${node.label} ${node.id}`}>
          <NodeMediaSummary data={node.data} label={node.label} description={`${node.sheet} · ${node.id}`} projectId={projectId} tokenId={tokenId} />
        </SelectItem>)}
        {!filtered.length && <p className="px-3 py-2 text-sm text-muted-foreground">Блоки не найдены</p>}
      </SelectContent>
    </Select>
    {target && <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
      <p className="min-w-0 break-all text-xs text-muted-foreground">Выбран ID: {target.nodeId}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {targetSheet && onGoToNode && <Button type="button" variant="outline" size="sm" onClick={() => onGoToNode(target.nodeId, targetSheet.id)}>Перейти к блоку →</Button>}
        <Button type="button" variant="ghost" size="sm" onClick={() => { onSelect(null); setQuery(''); setError(false); }}>Сбросить блок</Button>
      </div>
    </div>}
    <NodePhotoGallery key={target?.nodeId ?? 'none'} projectId={projectId} target={target} sheets={sheets} tokenId={tokenId} />
  </div>;
}
