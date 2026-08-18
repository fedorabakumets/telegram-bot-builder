/**
 * @fileoverview Баннер с инструкцией, как прикрепить файлы к ноде.
 * @module components/editor/files/panel/file-attach-hint
 */

import { Paperclip } from 'lucide-react';

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
}: FileAttachHintProps): React.JSX.Element {
  const kind = getAttachHintKind({ mode, attachModeEnabled, hasTarget });
  const text = getAttachHintText(kind, nodeLabel);

  return (
    <div className={ATTACH_HINT_CLASS} data-testid="file-attach-hint" data-kind={kind}>
      <Paperclip className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <p>{text}</p>
    </div>
  );
}
