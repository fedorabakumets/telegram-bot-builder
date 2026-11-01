/** @fileoverview Прокрутка к карточке бота при переходе из другого раздела конструктора. */
import { useEffect, useRef, type ReactNode } from 'react';

/** Свойства адресуемой карточки бота. */
interface BotCardAnchorProps {
  /** Проект бота. */
  projectId: number;
  /** Идентификатор токена без секретного значения. */
  tokenId: number;
  /** Карточка бота. */
  children: ReactNode;
}

/**
 * Определяет точный якорь бота из адреса страницы.
 * @param projectId - Проект карточки
 * @param tokenId - Токен карточки
 * @returns Совпадает ли якорь с карточкой
 */
export function isBotCardTarget(projectId: number, tokenId: number): boolean {
  return window.location.hash === `#bot-${projectId}-${tokenId}`;
}

/**
 * Дожидается появления карточки и прокручивает её в область просмотра.
 * @param props - Идентификаторы и содержимое
 * @returns Контейнер с устойчивым якорем
 */
export function BotCardAnchor({ projectId, tokenId, children }: BotCardAnchorProps) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isBotCardTarget(projectId, tokenId)) return;
    const frame = requestAnimationFrame(() => root.current?.scrollIntoView({ block: 'start', behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, [projectId, tokenId]);
  return <div ref={root} id={`bot-${projectId}-${tokenId}`} className="min-w-0 scroll-mt-4">{children}</div>;
}
