/**
 * @fileoverview Баннер с инструкцией, как прикрепить файлы к ноде.
 * @module components/editor/files/panel/file-attach-hint
 */

import { Button } from '@/components/ui/button';
import { Paperclip } from 'lucide-react';
import type { ReactNode } from 'react';

import { ATTACH_HINT_CLASS } from './panel-styles';
import { getAttachHintKind, getAttachHintText, type AttachHintMode } from './file-attach-hint-text';

/** Пропсы баннера подсказки прикрепления */
export interface FileAttachHintProps {
  /** Режим панели */
  mode: AttachHintMode;
  /** Включён ли режим прикрепления на странице */
  attachModeEnabled: boolean;
  /** Есть ли целевая нода */
  hasTarget: boolean;
  /** Имя целевой ноды */
  nodeLabel?: string;
  /** Открыть холст для выбора блока. */
  onChooseNode?: () => void;
  /** Выбор блока непосредственно внутри подсказки. */
  children?: ReactNode;
}

/**
 * Показывает, что загрузка не равна прикреплению, и куда нажать дальше.
 * @param props - Режим панели и цель прикрепления
 * @returns JSX баннера
 */
export function FileAttachHint({
  mode,
  attachModeEnabled,
  hasTarget,
  nodeLabel,
  onChooseNode,
  children,
}: FileAttachHintProps): React.JSX.Element {
  const kind = getAttachHintKind({ mode, attachModeEnabled, hasTarget });
  const text = getAttachHintText(kind, nodeLabel, mode);
  /** Выделяем только описание блока, сохраняя инструкцию и безопасный текстовый вывод. */
  const label = (nodeLabel ?? 'нода').trim() || 'нода';
  const labelStart = kind === 'ready' ? text.indexOf(label) : -1;
  const hintContent = labelStart < 0 ? text : <>{text.slice(0, labelStart)}<strong className="font-semibold text-foreground">{label}</strong>{text.slice(labelStart + label.length)}</>;

  if (mode === 'page' && !attachModeEnabled) {
    return <details className="files-attach-help shrink-0 rounded-lg text-sm text-muted-foreground" data-testid="file-attach-hint" data-kind={kind}>
      <summary aria-label="Как прикрепить файл к блоку" className="cursor-pointer rounded-lg px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Как прикрепить</summary>
      <p className="px-3 pb-3 text-pretty text-sm">{text}</p>
    </details>;
  }

  /** Инструкция находится в раскрываемой справке; активная форма не повторяет её текст. */
  if (mode === 'page') {
    return <div className={ATTACH_HINT_CLASS} data-testid="file-attach-hint" data-kind="form">
      <div className="min-w-0 flex-1 space-y-3">
        {children}
        {onChooseNode && <Button type="button" variant="outline" size="sm" onClick={onChooseNode}>Выбрать блок на холсте →</Button>}
      </div>
    </div>;
  }

  return (
    <div className={ATTACH_HINT_CLASS} data-testid="file-attach-hint" data-kind={kind}>
      <Paperclip className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1 space-y-3"><p>{hintContent}</p>
        {children}
      </div>
    </div>
  );
}
