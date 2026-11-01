/** @fileoverview Выбор блока прикрепления по списку, названию или точному ID без перехода на холст. */
import { useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { ChevronDown } from 'lucide-react';
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
  /** Список не перехватывает фокус при наборе поискового запроса. */
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  /** Контейнер результатов для перехода к первому варианту клавишей вниз. */
  const resultsRef = useRef<HTMLDivElement>(null);
  const nodes = sheets.flatMap(sheet => sheet.nodes.filter(canAttachNodeMedia).map(node => ({
    id: node.id, sheet: sheet.name, data: node.data,
    label: String(node.data.messageText || node.data.label || node.id).replace(/<[^>]*>/g, '').slice(0, 80),
  })));
  /** Общее поле фильтрует список и позволяет выбрать блок по точному ID. */
  const normalized = query.trim().toLowerCase();
  const filtered = nodes.filter(node => `${node.id} ${node.label} ${node.sheet}`.toLowerCase().includes(normalized));
  /** Лист назначения берётся из актуального проекта, включая неактивные листы. */
  const targetSheet = target && sheets.find(sheet => sheet.nodes.some(node => node.id === target.nodeId));
  /** Применяет только точный ID существующего блока текущего проекта. */
  const applyId = () => {
    const node = nodes.find(item => item.id === query.trim());
    setError(!node);
    if (node) { onSelect(node.id); setOpen(false); }
  };
  return <div className="file-node-picker space-y-3">
    <div className="space-y-2">
      <label htmlFor={`${id}-search`} className="block text-sm font-medium text-foreground">Название или ID блока</label>
      <div className="file-node-picker-search flex flex-wrap gap-2">
        <Input ref={searchRef} id={`${id}-search`} value={query} onChange={event => { setQuery(event.target.value); setError(false); setOpen(true); }}
          onKeyDown={event => {
            if (event.key === 'Escape') setOpen(false);
            if (event.key === 'ArrowDown') { event.preventDefault(); resultsRef.current?.querySelector('button')?.focus(); }
            if (event.key === 'Enter') { event.preventDefault(); applyId(); }
          }}
          placeholder="Найти блок или вставить ID" className={`min-w-0 flex-1 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          aria-invalid={error} aria-describedby={error ? `${id}-error` : undefined} />
        <Button type="button" variant="outline" onClick={applyId} disabled={!query.trim()}>Выбрать по ID</Button>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">Блок не найден или не поддерживает прикрепление медиа. Выберите блок из списка.</p>}
    </div>
    <Button type="button" variant="outline" aria-expanded={open} aria-controls={`${id}-results`} aria-label="Блок для прикрепления" onClick={() => setOpen(!open)} className="w-full min-w-0 justify-between">
      <span className="truncate">{target ? nodes.find(node => node.id === target.nodeId)?.label ?? target.nodeLabel : 'Выберите блок из списка'}</span><ChevronDown className="h-4 w-4" />
    </Button>
      {/* Результаты входят в поток формы и сдвигают список файлов вместо перекрытия. */}
      {open && <div ref={resultsRef} id={`${id}-results`} role="region" aria-label="Найденные блоки" className="file-node-search-results"
        onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); searchRef.current?.focus(); } }}>
        {filtered.map(node => <button type="button" key={node.id} className="file-node-search-result" onClick={() => { onSelect(node.id); setError(false); setOpen(false); searchRef.current?.focus(); }}>
          <NodeMediaSummary data={node.data} label={node.label} description={`${node.sheet} · ${node.id}`} projectId={projectId} tokenId={tokenId} />
        </button>)}
        {!filtered.length && <p className="px-3 py-2 text-sm text-muted-foreground">Блоки не найдены</p>}
      </div>}
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
