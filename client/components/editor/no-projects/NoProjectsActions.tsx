/**
 * @fileoverview Кнопки действий экрана «нет проектов» с появлением по очереди
 * @module components/editor/no-projects/NoProjectsActions
 */

import type { ReactNode } from 'react';
import { FileJson, LayoutTemplate, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

/** Пропсы блока действий */
export interface NoProjectsActionsProps {
  /** Диалог допечатан — можно показывать кнопки */
  ready: boolean;
  /** Без задержек каскада (повторный визит) */
  instant?: boolean;
  /** Создать проект */
  onCreate: () => void;
  /** Импорт JSON */
  onImport: () => void;
  /** Шаблоны */
  onTemplates: () => void;
  /** Выход */
  onLogout: () => void;
  /** Идёт импорт */
  isImporting: boolean;
}

/**
 * Обёртка с анимацией появления
 * @param props - visible, задержка и children
 * @returns JSX элемент
 */
function RevealSlot({
  visible,
  delayMs = 0,
  instant = false,
  children,
}: {
  visible: boolean;
  delayMs?: number;
  instant?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        !instant && 'transition-all duration-500 ease-out',
        visible
          ? 'opacity-100 translate-y-0 max-h-14'
          : 'opacity-0 translate-y-3 max-h-0 overflow-hidden pointer-events-none',
      )}
      style={{ transitionDelay: !instant && visible ? `${delayMs}ms` : '0ms' }}
      aria-hidden={!visible}
    >
      {children}
    </div>
  );
}

/**
 * Кнопки create / template / import / logout — каскад после диалога
 * @param props - Свойства
 * @returns JSX элемент
 */
export function NoProjectsActions({
  ready,
  instant = false,
  onCreate,
  onImport,
  onTemplates,
  onLogout,
  isImporting,
}: NoProjectsActionsProps) {
  const d = (ms: number) => (instant ? 0 : ms);

  return (
    <div className="flex flex-col gap-2">
      <RevealSlot visible={ready} delayMs={d(0)} instant={instant}>
        <Button className="w-full" onClick={onCreate} disabled={!ready}>
          <Plus className="h-4 w-4 mr-2" />
          Создать проект
        </Button>
      </RevealSlot>

      <RevealSlot visible={ready} delayMs={d(120)} instant={instant}>
        <Button className="w-full" variant="outline" onClick={onTemplates} disabled={!ready}>
          <LayoutTemplate className="h-4 w-4 mr-2" />
          Начать с шаблона
        </Button>
      </RevealSlot>

      <RevealSlot visible={ready} delayMs={d(240)} instant={instant}>
        <Button
          className="w-full"
          variant="outline"
          onClick={onImport}
          disabled={isImporting || !ready}
        >
          <FileJson className="h-4 w-4 mr-2" />
          {isImporting ? 'Импорт...' : 'Импортировать JSON'}
        </Button>
      </RevealSlot>

      <RevealSlot visible={ready} delayMs={d(360)} instant={instant}>
        <Button
          className="w-full text-destructive"
          variant="ghost"
          onClick={onLogout}
          disabled={!ready}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Выйти
        </Button>
      </RevealSlot>
    </div>
  );
}
