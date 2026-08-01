/**
 * @fileoverview Ячейка «file_id по ботам» таблицы файлов (`CellFileIds`).
 * Показывает file_id с подписью владельца через TelegramFileIdOwner.
 * @module components/editor/files/panel/table/cell-file-ids
 */

import { cn } from '@/utils/utils';
import type { ProjectFile } from '../../hooks/use-project-files';
import { TelegramFileIdOwner } from '@/components/editor/properties/media/telegram-file-id-owner';
import { useProjectTokenLabels } from '@/components/editor/properties/media/use-project-token-labels';

/** Пропсы ячейки file_id по ботам */
export interface CellFileIdsProps {
  /** Данные файла */
  file: ProjectFile;
  /** ID проекта для подписей ботов */
  projectId: number;
  /** Выбранный токен бота (его file_id показывается первым) */
  selectedTokenId?: number | null;
  /** Копирование file_id в буфер обмена (legacy callback, копирование внутри Owner) */
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
 * Строит упорядоченный список file_id: выбранный токен первым,
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
 * Ячейка со списком file_id по ботам с подписями владельцев.
 * @param props - Свойства ячейки
 * @returns JSX элемент `<td>` со столбцом file_id
 */
export function CellFileIds({ file, projectId, selectedTokenId, className }: CellFileIdsProps) {
  const tokenLabels = useProjectTokenLabels(projectId);
  const byToken = file.fileIdsByToken ?? {};
  const mapAsStrings: Record<string, string> = {};
  for (const [k, v] of Object.entries(byToken)) {
    mapAsStrings[String(k)] = v;
  }

  /** Legacy: один fileId без карты — показываем как общий кэш, если tokenId неизвестен */
  const legacyId = Object.keys(mapAsStrings).length === 0 ? (file.fileId ?? null) : undefined;
  const legacyWithOwner =
    legacyId && file.tokenId != null
      ? { [String(file.tokenId)]: legacyId }
      : undefined;

  const hasAny =
    Object.keys(mapAsStrings).length > 0
    || !!legacyWithOwner
    || legacyId != null;

  return (
    <td className={cn('p-2', className)}>
      {!hasAny ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <TelegramFileIdOwner
          telegramFileId={legacyWithOwner ? undefined : legacyId}
          fileIdsByToken={Object.keys(mapAsStrings).length > 0 ? mapAsStrings : legacyWithOwner}
          tokenLabels={tokenLabels}
          selectedTokenId={selectedTokenId}
          compact
        />
      )}
    </td>
  );
}
