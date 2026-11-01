/** @fileoverview Ровный список Telegram ID в карточке файла с подписями ботов и копированием. */
import { useEffect, useRef, useState } from 'react';
import { Bot, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ProjectFile } from '../../hooks/use-project-files';
import { buildOrderedEntries } from './cell-file-ids';
import { buildBotPanelHref } from './bot-panel-link';

/** Параметры списка идентификаторов. */
interface FileCardIdsProps {
  /** Проект для перехода к настройкам бота в конструкторе. */
  projectId: number;
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
export function FileCardIds({ file, labels, selectedTokenId, projectId }: FileCardIdsProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Освобождает таймер подтверждения при закрытии карточки. */
  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);
  const entries = buildOrderedEntries(file, selectedTokenId);
  const visible = expanded ? entries : entries.slice(0, 3);
  /** Копирует значение и показывает результат без изменения данных файла. */
  async function copy(id: string) {
    try {
      await navigator.clipboard.writeText(id); setCopied(id); setError(false);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => { setCopied(null); resetTimer.current = null; }, 2000);
    }
    catch { setError(true); }
  }
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {visible.map(entry => {
          const label = cleanLabel(entry.tokenId == null ? 'Общий ID проекта' : labels[String(entry.tokenId)] ?? `Бот #${entry.tokenId}`);
          /** Переход ведёт к карточке выбранного бота текущего проекта. */
          const href = entry.tokenId != null ? buildBotPanelHref(projectId, entry.tokenId, window.location.search) : null;
          return <li key={`${entry.tokenId}:${entry.fileId}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_32px] items-center gap-x-3 gap-y-1">
            <div className="contents">
              <p className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 text-sm"><Bot className="h-4 w-4 shrink-0 text-muted-foreground" />
                {href ? <a className="truncate rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" href={href} title={`Открыть ${label} в конструкторе`}>{label}</a>
                  : <span className="truncate" title={label}>{label}</span>}
              </p>
              <button type="button" className="files-id-value col-start-1 row-start-2 block w-full min-w-0 truncate rounded-sm text-left font-mono text-xs text-foreground/80 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                onClick={() => copy(entry.fileId)} aria-label={`Копировать значение Telegram ID: ${label}`}
                title={copied === entry.fileId ? 'Скопировано' : `Нажмите, чтобы скопировать: ${entry.fileId}`}>{entry.fileId}</button>
            </div>
            <button type="button" className="files-copy-id col-start-2 row-start-2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={() => copy(entry.fileId)} aria-label={`Копировать Telegram ID: ${label}`} title={copied === entry.fileId ? 'Скопировано' : 'Копировать ID'}>
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
