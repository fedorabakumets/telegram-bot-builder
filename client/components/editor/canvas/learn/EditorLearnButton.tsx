/**
 * @fileoverview Кнопка «Обучение» в шапке с меню разделов
 * @module components/editor/canvas/learn/EditorLearnButton
 */

import { useState } from 'react';
import { Check, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EDITOR_LEARN_SECTIONS, type EditorLearnSectionId } from './editor-learn-sections';
import { getEditorLearnDoneSections } from './editor-learn-storage';

/** Пропсы кнопки */
export interface EditorLearnButtonProps {
  /** Идёт ли обучение сейчас */
  active: boolean;
  /** Запуск раздела с первого шага */
  onStart: (sectionId: EditorLearnSectionId) => void;
}

/**
 * Кнопка «Обучение»: открывает меню разделов с отметкой «пройдено»
 * @param props - Свойства
 * @returns JSX элемент
 */
export function EditorLearnButton({ active, onStart }: EditorLearnButtonProps) {
  const [done, setDone] = useState<Set<string>>(() => new Set());

  return (
    <DropdownMenu onOpenChange={(open) => open && setDone(getEditorLearnDoneSections())}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={active ? 'secondary' : 'outline'}
          size="sm"
          className="h-8 shrink-0 gap-1.5"
          title="Разделы обучения по редактору"
        >
          <GraduationCap className="h-4 w-4" />
          <span className="hidden sm:inline">Обучение</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Разделы обучения</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {EDITOR_LEARN_SECTIONS.map((section) => (
          <DropdownMenuItem
            key={section.id}
            className="items-start gap-2 py-2"
            onSelect={() => onStart(section.id)}
          >
            <Check className={done.has(section.id) ? 'mt-0.5 h-4 w-4 text-primary' : 'mt-0.5 h-4 w-4 opacity-0'} />
            <div className="min-w-0">
              <p className="text-sm font-medium">{section.title}</p>
              <p className="text-xs text-muted-foreground">
                {section.steps.length} шагов · {section.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
