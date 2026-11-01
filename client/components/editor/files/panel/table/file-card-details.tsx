/**
 * @fileoverview Компактные сведения о файле и явные переходы к использующим его блокам.
 */
import { FileSourceNode } from './file-source-node';
import { FileMessageLink } from './file-message-link';
import { getFileOrigin } from './file-origin';
import { ArrowUpRight } from 'lucide-react';
import { FileCardIds } from './file-card-ids';
import { useProjectTokenLabels } from '@/components/editor/properties/media/use-project-token-labels';
import { useFileNodeUsages } from '../../hooks/use-file-node-usages';
import type { FileRowProps } from './file-row';

/**
 * Выводит сведения ровными строками с понятными пустыми состояниями.
 * @param props - Файл, участники проекта и переход к блокам
 * @returns Раскрываемая область сведений
 */
export function FileCardDetails({ file, projectId, selectedTokenId, collaborators, allSheets, onGoToNode }: FileRowProps) {
  const labels = useProjectTokenLabels(projectId);
  const origin = getFileOrigin(file, collaborators, labels);
  const usages = useFileNodeUsages(file.url, allSheets ?? []);
  const ids = Object.fromEntries(Object.entries(file.fileIdsByToken ?? {}));
  const hasIds = Object.keys(ids).length > 0 || !!file.fileId;
  return (
    <details className="files-card-details text-sm border-t pt-3">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Сведения о файле</summary>
      <dl className="mt-3 divide-y text-sm">
        <div className="files-detail-overview">
          <div className="files-detail-row"><dt>Хранилище</dt><dd>{origin.storage}</dd></div>
          <div className="files-detail-row"><dt>ID файла</dt><dd className="font-mono">{file.id}</dd></div>
        </div>
        <div className="files-detail-row files-detail-author"><dt>{origin.authorLabel}</dt><dd className="flex flex-wrap items-center gap-x-4 gap-y-2"><span>{origin.author}</span><FileMessageLink file={file} projectId={projectId} /></dd></div>
        <div className="files-detail-row files-detail-ids"><dt>Telegram ID</dt><dd>
          {hasIds ? <FileCardIds projectId={projectId} file={file} labels={labels} selectedTokenId={selectedTokenId} />
            : <span className="text-muted-foreground">Не присвоен</span>}
        </dd></div>
        <FileSourceNode file={file} allSheets={allSheets} onGoToNode={onGoToNode} />
        {allSheets && <div className="files-detail-row files-detail-usage"><dt>Использование</dt><dd>
          {usages.length === 0 ? <span className="text-muted-foreground">Не используется в блоках</span> : <ul className="space-y-2">
            {usages.map((usage) => <li key={`${usage.sheetId}:${usage.nodeId}`}>
              {onGoToNode ? <button type="button" className="text-left inline-flex max-w-full items-start gap-2 hover:underline" onClick={() => onGoToNode(usage.nodeId, usage.sheetId)}>
                <span className="min-w-0 break-words">{usage.nodeLabel}<span className="block text-xs text-muted-foreground">{usage.sheetName}</span></span><ArrowUpRight className="h-4 w-4 shrink-0" />
              </button> : <span>{usage.nodeLabel}</span>}
            </li>)}
          </ul>}
        </dd></div>}
      </dl>
    </details>
  );
}
