/** @fileoverview Понятная запись контента с переходом к ноде и копированием её ID. */
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { describeContent, type ContentRecord } from '../utils/content-record';
/** Свойства ссылки на ноду. */
interface ContentNodeLinkProps {
  /** Проект таблицы. */
  projectId: number;
  /** Полный ключ записи. */
  contentKey: string;
  /** Название и состояние ноды в актуальном сценарии. */
  record?: ContentRecord;
}
/**
 * Показывает название, назначение поля и второстепенный идентификатор.
 * @param props - Контекст записи контента.
 * @returns Ссылка на ноду и действие копирования ID.
 */
export function ContentNodeLink({ projectId, contentKey, record }: ContentNodeLinkProps) {
  const meta = record ?? describeContent(contentKey);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const params = new URLSearchParams({ tab: 'editor', node: meta.nodeId });
  if (meta.buttonId) params.set('button', meta.buttonId);
  /** Копирует исходный ID ноды, отдельно от суффикса записи. */
  async function copy() {
    try { await navigator.clipboard.writeText(meta.nodeId); setCopied(true); setError(''); }
    catch { setError('Не удалось скопировать ID'); }
  }
  return (
    <div className="content-record px-3 py-2">
      {meta.missing || meta.loading ? <span className="block truncate text-sm font-medium" title={meta.title}>{meta.loading ? 'Загрузка ноды…' : meta.title}</span> :
        <a href={`/projects/${projectId}?${params}`} target="_blank" rel="noopener noreferrer" title={`Открыть ноду ${meta.nodeId} в новой вкладке`}
          className="block truncate rounded-sm text-sm font-medium underline decoration-muted-foreground/40 underline-offset-2 hover:decoration-foreground focus-visible:outline focus-visible:outline-2">{meta.title}</a>}
      <span className="block text-xs text-muted-foreground">{meta.field}{meta.missing ? ' · Связь потеряна' : ''}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={contentKey}>{meta.nodeId}</span>
        <button type="button" title="Копировать ID ноды" aria-label="Копировать ID ноды" onClick={copy} className="tables-control shrink-0 rounded p-1">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
