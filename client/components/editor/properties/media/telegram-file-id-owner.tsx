/**
 * @fileoverview Отображение Telegram file_id с подписью владельца-бота.
 * Один id (legacy) помечается как общий кэш без привязки; карта fileIdsByToken
 * показывается списком с именами ботов и сворачиванием при многих токенах.
 * @module client/components/editor/properties/media/telegram-file-id-owner
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

/** Сколько строк file_id показывать до кнопки «ещё N» */
const COLLAPSE_AFTER = 3;

/** Пропсы блока владельца file_id */
export interface TelegramFileIdOwnerProps {
  /** Legacy telegram_file_id из media_files (общий кэш проекта) */
  telegramFileId?: string | null;
  /** Карта tokenId → file_id (привязка к ботам) */
  fileIdsByToken?: Record<string, string>;
  /** Подписи ботов: tokenId → «Имя (@user)» */
  tokenLabels?: Record<string, string>;
  /** Выбранный токен — его строка поднимается первой */
  selectedTokenId?: number | null;
  /** Компактный вид (таблица файлов) */
  compact?: boolean;
}

/**
 * Строит упорядоченный список пар tokenId → file_id.
 * @param byToken - Карта file_id по токенам
 * @param selectedTokenId - Токен, который показать первым
 * @returns Массив записей
 */
function buildEntries(
  byToken: Record<string, string>,
  selectedTokenId?: number | null,
): Array<{ tokenId: string; fileId: string }> {
  const ids = Object.keys(byToken);
  ids.sort((a, b) => {
    if (Number(a) === selectedTokenId) return -1;
    if (Number(b) === selectedTokenId) return 1;
    return Number(a) - Number(b);
  });
  return ids.map((tokenId) => ({ tokenId, fileId: byToken[tokenId] }));
}

/**
 * Одна строка file_id с подписью бота и копированием.
 * @param props - Подпись, id, compact, onCopy, copied
 * @returns JSX строка
 */
function FileIdLine({
  label,
  fileId,
  hint,
  compact,
  copied,
  onCopy,
}: {
  /** Подпись владельца */
  label: string;
  /** Значение file_id */
  fileId: string;
  /** Доп. подсказка под подписью */
  hint?: string;
  /** Компактный режим */
  compact?: boolean;
  /** Уже скопировано */
  copied: boolean;
  /** Копирование */
  onCopy: () => void;
}) {
  const textCls = compact
    ? 'font-mono text-[10px] truncate max-w-[120px]'
    : 'text-xs font-mono text-slate-600 dark:text-slate-300 truncate flex-1';
  const labelCls = compact
    ? 'text-[10px] text-muted-foreground shrink-0 max-w-[90px] truncate'
    : 'text-xs text-slate-500 dark:text-slate-400 shrink-0 truncate max-w-[160px]';

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className={labelCls} title={label}>🤖 {label}</span>
        <span className={textCls} title={fileId}>{fileId}</span>
        <Button size="sm" variant="ghost" onClick={onCopy} className="h-5 w-5 p-0 shrink-0" title="Скопировать File ID">
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
        </Button>
      </div>
      {hint && !compact && (
        <span className="text-[10px] text-amber-600/90 dark:text-amber-400/80 pl-5">{hint}</span>
      )}
    </div>
  );
}

/**
 * Блок File ID с владельцем: список по ботам или legacy «общий кэш».
 * @param props - Свойства блока
 * @returns JSX элемент или null, если нечего показывать
 */
export function TelegramFileIdOwner({
  telegramFileId,
  fileIdsByToken,
  tokenLabels = {},
  selectedTokenId,
  compact = false,
}: TelegramFileIdOwnerProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const byToken = fileIdsByToken ?? {};
  const tokenEntries = buildEntries(byToken, selectedTokenId);
  const hasTokenMap = tokenEntries.length > 0;
  const showLegacy = !hasTokenMap && telegramFileId !== undefined;

  if (!hasTokenMap && !showLegacy) return null;

  /**
   * Копирует file_id и кратко подсвечивает кнопку.
   * @param key - Ключ строки для индикатора
   * @param fileId - Значение для буфера
   */
  const copy = async (key: string, fileId: string) => {
    await navigator.clipboard.writeText(fileId);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (showLegacy) {
    if (!telegramFileId) {
      return (
        <div className={compact ? '' : 'pt-1'}>
          <span className="text-xs text-slate-400 italic">🤖 File ID: появится после первой отправки ботом</span>
        </div>
      );
    }
    return (
      <div className={compact ? '' : 'pt-1'}>
        <FileIdLine
          label="общий кэш проекта"
          fileId={telegramFileId}
          hint="Владелец неизвестен — id не привязан к боту (может не работать у других токенов)"
          compact={compact}
          copied={copiedKey === 'legacy'}
          onCopy={() => copy('legacy', telegramFileId)}
        />
      </div>
    );
  }

  const visible = expanded || tokenEntries.length <= COLLAPSE_AFTER
    ? tokenEntries
    : tokenEntries.slice(0, COLLAPSE_AFTER);
  const hiddenCount = tokenEntries.length - visible.length;

  return (
    <div className={compact ? 'flex flex-col gap-0.5' : 'pt-1 space-y-1'}>
      {visible.map(({ tokenId, fileId }) => (
        <FileIdLine
          key={tokenId}
          label={tokenLabels[tokenId] ?? `бот #${tokenId}`}
          fileId={fileId}
          compact={compact}
          copied={copiedKey === tokenId}
          onCopy={() => copy(tokenId, fileId)}
        />
      ))}
      {tokenEntries.length > COLLAPSE_AFTER && (
        <button
          type="button"
          className="text-[10px] text-primary flex items-center gap-0.5 pl-1 hover:underline"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" /> свернуть</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> ещё {hiddenCount}</>
          )}
        </button>
      )}
    </div>
  );
}
