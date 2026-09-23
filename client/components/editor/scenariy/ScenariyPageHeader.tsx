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
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-2 sm:gap-3 min-h-9">
          <Link to="/">
            <Button variant="ghost" size="sm" className="shrink-0 min-w-[7.5rem] justify-start">
              <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">{label}</span>
            </Button>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold truncate flex-1 min-w-0">
            Сценарии ботов
          </h1>
          {onStartLearn ? (
            <Button
              type="button"
              variant={learnActive ? 'secondary' : 'outline'}
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={onStartLearn}
              title={
                learnActive
                  ? 'Начать обучение заново с первого шага'
                  : 'Пройти обучение по каталогу'
              }
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden xs:inline">Обучение</span>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
