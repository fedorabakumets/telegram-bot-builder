/**
 * @fileoverview Шапка страницы сценариев
 * @module components/editor/scenariy/ScenariyPageHeader
 */

import { Link } from 'wouter';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Пропсы шапки */
export interface ScenariyPageHeaderProps {
  /**
   * Подпись кнопки назад.
   * pending — ещё грузимся, показываем нейтральное «Назад».
   */
  backLabel: 'back' | 'editor' | 'pending';
  /** Идёт ли сейчас режим обучения */
  learnActive?: boolean;
  /** Запуск / повтор обучения */
  onStartLearn?: () => void;
}

/**
 * Липкая шапка страницы сценариев
 * @param props - Свойства
 * @returns JSX элемент
 */
export function ScenariyPageHeader({
  backLabel,
  learnActive = false,
  onStartLearn,
}: ScenariyPageHeaderProps) {
  const label = backLabel === 'editor' ? 'Назад к редактору' : 'Назад';

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-2">
        <div className="flex items-center gap-2 sm:gap-3 min-h-9">
          <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1.5 font-normal hover:bg-transparent hover:text-sky-700 dark:hover:text-sky-400">
            <Link to="/" aria-label={label}>
              <ArrowLeft className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-400" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          </Button>
          <h1 className="text-lg sm:text-xl font-normal truncate flex-1 min-w-0">
            Сценарии ботов
          </h1>
          {onStartLearn ? (
            <Button
              type="button"
              variant={learnActive ? 'secondary' : 'ghost'}
              size="sm"
              className="shrink-0 gap-1.5 font-normal hover:bg-transparent hover:text-violet-700 dark:hover:text-violet-400"
              onClick={onStartLearn}
              title={
                learnActive
                  ? 'Начать обучение заново с первого шага'
                  : 'Пройти обучение по каталогу'
              }
            >
              <GraduationCap className="h-4 w-4 text-violet-700 dark:text-violet-400" />
              <span className="hidden xs:inline">Обучение</span>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
