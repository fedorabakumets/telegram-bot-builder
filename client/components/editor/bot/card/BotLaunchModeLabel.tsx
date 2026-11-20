/** @fileoverview Подпись сохранённого режима запуска на карточке бота. */
import { effectiveLaunchMode } from './bot-launch-helpers';

/** Свойства подписи режима. */
interface BotLaunchModeLabelProps {
  /** Выбор бота или признак наследования. */
  choice: string | null;
  /** Режим проекта по умолчанию. */
  projectMode?: string | null;
}

/**
 * Отличает унаследованный режим от индивидуального.
 * @param props - Источник и режим запуска.
 * @returns Подпись режима следующего запуска.
 */
export function BotLaunchModeLabel({ choice, projectMode }: BotLaunchModeLabelProps) {
  const mode = effectiveLaunchMode(choice, projectMode) === 'webhook' ? 'Webhook' : 'Polling';
  return (
    <span className="min-w-0 truncate text-[11px] text-muted-foreground">
      {mode} · {choice === 'inherit' ? 'из проекта' : 'свой'}
    </span>
  );
}
