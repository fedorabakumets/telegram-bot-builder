/**
 * @fileoverview Анимация аватара при смене состояния процесса бота.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { BotCanvasStatus } from './bot-canvas-status';
import './bot-status-motion.css';

/** Свойства обёртки аватара. */
interface BotStatusMotionProps {
  /** Подтверждённый статус или выполняемая операция */
  status: BotCanvasStatus;
  /** Аватар бота */
  children: ReactNode;
}

/**
 * Рисует кольцо операции и однократный импульс результата без сдвига карточки.
 * @param props - Статус и содержимое аватара
 * @returns Обёртка с декоративной анимацией
 */
export function BotStatusMotion({ status, children }: BotStatusMotionProps) {
  const previous = useRef(status);
  const [pulse, setPulse] = useState<BotCanvasStatus | null>(null);
  useEffect(() => {
    if (previous.current === status) return;
    previous.current = status;
    setPulse(['online', 'offline', 'failed', 'invalid', 'error'].includes(status) ? status : null);
    const timer = window.setTimeout(() => setPulse(null), 900);
    return () => window.clearTimeout(timer);
  }, [status]);
  return (
    <span className="bot-status-motion" data-status={status} data-pulse={pulse ?? undefined}>
      {children}
      <span className="bot-status-halo" aria-hidden="true" />
      <svg className="bot-status-orbit" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="22" />
      </svg>
    </span>
  );
}
