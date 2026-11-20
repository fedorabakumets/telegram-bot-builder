/** @fileoverview Спокойное управление раскрытием строк ботов пользователя. */
import { ChevronDown, ChevronRight } from 'lucide-react';
/**
 * Показывает количество ботов и состояние раскрытия группы.
 * @param props - Пользователь, количество ботов и обработчик переключения.
 * @returns Доступная с клавиатуры кнопка раскрытия.
 */
export function UserBotsToggle({ userId, count, expanded, onToggle }: {
  /** Telegram ID пользователя. */ userId: string;
  /** Количество ботов. */ count: number;
  /** Раскрыта ли группа. */ expanded: boolean;
  /** Переключает раскрытие. */ onToggle: () => void;
}) {
  return <button type="button" className="users-bots-toggle" aria-expanded={expanded}
    aria-label={`Боты пользователя ${userId}: ${count}`} onClick={onToggle}>
    {expanded ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}Боты · {count}
  </button>;
}
