/**
 * @fileoverview Кнопка «Обучение» в шапке с меню разделов
 * @module components/editor/canvas/learn/EditorLearnButton
 */

import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { EditorLearnSectionId } from './editor-learn-sections';
import { EditorLearnMenuItems } from './EditorLearnMenuItems';

/** Пропсы кнопки */
export interface EditorLearnButtonProps {
  /** Идёт ли обучение сейчас */
  active: boolean;
  /** Запуск раздела с первого шага */
  onStart: (sectionId: EditorLearnSectionId) => void;
  /** Показывает подпись рядом с иконкой в широкой шапке. */
  showLabel?: boolean;
}

/**
 * Кнопка «Обучение»: открывает меню разделов с отметкой «пройдено»
 * @param props - Свойства
 * @returns JSX элемент
 */
export function EditorLearnButton({ active, onStart, showLabel = false }: EditorLearnButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={active ? 'secondary' : 'outline'}
          size="sm"
          className={showLabel ? 'h-8 shrink-0 gap-1.5 px-2' : 'h-8 w-8 shrink-0 p-0'}
          title="Обучение"
          aria-label="Обучение"
        >
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          {showLabel && <span>Обучение</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Разделы обучения</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <EditorLearnMenuItems onStart={onStart} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
