/** @fileoverview Ровный список Telegram ID в карточке файла с подписями ботов и копированием. */
import { useState } from 'react';
import { Bot, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ProjectFile } from '../../hooks/use-project-files';
import { buildOrderedEntries } from './cell-file-ids';

/** Параметры списка идентификаторов. */
interface FileCardIdsProps {
  /** Файл с идентификаторами ботов. */
  file: ProjectFile;
  /** Названия ботов по ID токена. */
  labels: Record<string, string>;
  /** Выбранный бот показывается первым. */
  selectedTokenId?: number | null;
}

/**
 * Убирает повторяющийся username из подписи одного бота.
 * @param label - Полная подпись владельца
 * @returns Подпись без повторений
 */
function cleanLabel(label: string): string {
  const seen = new Set<string>();
  return label.replace(/\s*\(@[^)]+\)/g, match => {
    const normalized = match.trim().toLowerCase();
    if (seen.has(normalized)) return '';
    seen.add(normalized);
    return match;
  }).trim();
}

/**
 * Выводит имя над ID, сохраняя фиксированное место кнопки копирования.
 * @param props - Файл и подписи ботов
 * @returns Список идентификаторов с раскрытием длинного перечня
 */
export function FileCardIds({ file, labels, selectedTokenId }: FileCardIdsProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const entries = buildOrderedEntries(file, selectedTokenId);
  const visible = expanded ? entries : entries.slice(0, 3);
  /** Копирует значение и показывает результат без изменения данных файла. */
  async function copy(id: string) {
    try { await navigator.clipboard.writeText(id); setCopied(id); setError(false); }
    catch { setError(true); }
  }
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {visible.map(entry => {
          const label = cleanLabel(entry.tokenId == null ? 'Общий ID проекта' : labels[String(entry.tokenId)] ?? `Бот #${entry.tokenId}`);
          return <li key={`${entry.tokenId}:${entry.fileId}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_32px] items-center gap-3">
            <div className="min-w-0 space-y-1">
              <p className="flex min-w-0 items-center gap-2 text-sm"><Bot className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate" title={label}>{label}</span></p>
              <p className="truncate font-mono text-xs text-muted-foreground" title={entry.fileId}>{entry.fileId}</p>
            </div>
            <button type="button" className="files-copy-id flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={() => copy(entry.fileId)} aria-label={`Копировать Telegram ID: ${label}`} title={copied === entry.fileId ? 'Скопировано' : 'Копировать ID'}>
              {copied === entry.fileId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </li>;
        })}
      </ul>
      {entries.length > 3 && <button type="button" aria-expanded={expanded} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}{expanded ? 'Свернуть список' : `Ещё ${entries.length - 3}`}
      </button>}
      {copied && <span role="status" className="sr-only">Telegram ID скопирован</span>}
      {error && <p role="alert" className="text-xs text-destructive">Не удалось скопировать ID. Попробуйте ещё раз.</p>}
    </div>
  );
}
