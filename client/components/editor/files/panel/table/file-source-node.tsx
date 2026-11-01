/** @fileoverview Источник отправки файла, сохранённый в истории исходящих сообщений. */
import { ArrowUpRight } from 'lucide-react';
import type { FileRowProps } from './file-row';

/**
 * Показывает блок отправки независимо от текущих ссылок на файл в сценарии.
 * @param props - Файл, листы и переход к блоку
 * @returns Строка сведений об исходящем файле
 */
export function FileSourceNode({ file, allSheets, onGoToNode }: Pick<FileRowProps, 'file' | 'allSheets' | 'onGoToNode'>) {
  if (file.source !== 'outgoing') return null;
  const sheet = allSheets?.find(item => item.nodes.some(node => node.id === file.nodeId));
  const node = sheet?.nodes.find(item => item.id === file.nodeId);
  const label = node ? String(node.data.label || node.data.messageText || node.id).replace(/<[^>]*>/g, '').slice(0, 80) : file.nodeId;
  return <div className="files-detail-row"><dt>Блок отправки</dt><dd>
    {!file.nodeId ? <span className="text-muted-foreground">Блок отправки не сохранён</span>
      : sheet && onGoToNode ? <button type="button" className="inline-flex max-w-full items-start gap-2 text-left hover:underline" onClick={() => onGoToNode(file.nodeId!, sheet.id)}><span className="min-w-0 break-words">{label}<span className="block text-xs text-muted-foreground">{sheet.name}</span></span><ArrowUpRight className="h-4 w-4 shrink-0" /></button>
        : <span className="text-muted-foreground">{label}{allSheets && ' · блок не найден в текущем сценарии'}</span>}
  </dd></div>;
}
