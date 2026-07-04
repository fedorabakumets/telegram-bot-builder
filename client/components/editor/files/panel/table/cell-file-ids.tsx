/**
 * @fileoverview Ячейка «file_id по ботам» таблицы файлов (`CellFileIds`).
 * Отображает file_id для каждого бота из `file.fileIdsByToken` (Req 8.2).
 * Когда в селекторе выбран бот (`selectedTokenId`), его file_id показывается
 * первым, остальные — ниже в детерминированном порядке по tokenId (Req 8.3).
 * Если карта пуста, используется одиночный `file.fileId` (обратная
 * совместимость). Каждый id копируется в буфер по клику через `onCopy`.
 * @module components/editor/files/panel/table/cell-file-ids
 */

import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import type { ProjectFile } from '../../hooks/use-project-files';

/** Пропсы ячейки file_id по ботам */
export interface CellFileIdsProps {
  /** Данные файла */
  file: ProjectFile;
  /** Выбранный токен бота (его file_id показывается первым, Req 8.3) */
  selectedTokenId?: number | null;
  /** Копирование file_id в буфер обмена */
  onCopy: (fileId: string) => void;
  /** Дополнительные классы для `td` */
  className?: string;
}

/** Одна запись file_id с привязкой к токену бота */
export interface FileIdEntry {
  /** ID токена бота (null — одиночный file_id без привязки) */
  tokenId: number | null;
  /** Значение Telegram file_id */
  fileId: string;
}

/**
 * Строит упорядоченный список file_id: выбранный токен первым (Req 8.3),
 * остальные — по возрастанию tokenId; при пустой карте — одиночный fileId.
 * @param file - Данные файла
 * @param selectedTokenId - Выбранный токен бота
 * @returns Упорядоченный массив записей file_id
 */
export function buildOrderedEntries(file: ProjectFile, selectedTokenId?: number | null): FileIdEntry[] {
  const byToken = file.fileIdsByToken ?? {};
  const tokenIds = Object.keys(byToken).map(Number);
  if (tokenIds.length === 0) {
    return file.fileId ? [{ tokenId: file.tokenId ?? null, fileId: file.fileId }] : [];
  }
  const sorted = tokenIds.sort((a, b) => {
    if (a === selectedTokenId) return -1;
    if (b === selectedTokenId) return 1;
    return a - b;
  });
  return sorted.map((tokenId) => ({ tokenId, fileId: byToken[tokenId] }));
}

/**
 * Ячейка со списком file_id по ботам.
 * @param props - Свойства ячейки
 * @returns JSX элемент `<td>` со столбцом file_id
 */
export function CellFileIds({ file, selectedTokenId, onCopy, className }: CellFileIdsProps) {
  const entries = buildOrderedEntries(file, selectedTokenId);

  return (
    <td className={cn('p-2', className)}>
      {entries.length === 0 ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <div className="flex flex-col gap-0.5">
          {entries.map((entry, idx) => (
            <div key={`${entry.tokenId ?? 'default'}-${idx}`} className="flex items-center gap-1">
              <span
                className={cn(
                  'font-mono text-[10px] truncate max-w-[120px] cursor-pointer hover:text-primary',
                  entry.tokenId != null && entry.tokenId === selectedTokenId && 'text-primary font-semibold',
                )}
                onClick={() => onCopy(entry.fileId)}
                title={entry.fileId}
              >
                {entry.fileId}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0"
                onClick={() => onCopy(entry.fileId)}
                title="Копировать file_id"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </td>
  );
}
