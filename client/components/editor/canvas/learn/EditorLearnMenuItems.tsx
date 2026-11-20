/** @fileoverview Общие пункты меню для запуска разделов обучения редактора. */
import { Check } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { EDITOR_LEARN_SECTIONS, type EditorLearnSectionId } from './editor-learn-sections';
import { getEditorLearnDoneSections } from './editor-learn-storage';

/** Свойства пунктов обучения. */
interface EditorLearnMenuItemsProps {
  /** Начинает выбранный раздел обучения. */
  onStart: (sectionId: EditorLearnSectionId) => void;
}

/**
 * Показывает разделы обучения и отмечает пройденные.
 * @param props - Действие запуска раздела.
 * @returns Пункты раскрывающегося меню.
 */
export function EditorLearnMenuItems({ onStart }: EditorLearnMenuItemsProps) {
  const done = getEditorLearnDoneSections();
  return EDITOR_LEARN_SECTIONS.map((section) => (
    <DropdownMenuItem key={section.id} className="items-start gap-2 py-2" onSelect={() => onStart(section.id)}>
      <Check aria-label={done.has(section.id) ? 'Пройдено' : undefined}
        className={done.has(section.id) ? 'mt-0.5 h-4 w-4 text-primary' : 'mt-0.5 h-4 w-4 opacity-0'} />
      <div className="min-w-0">
        <p className="text-sm font-medium">{section.title}</p>
        <p className="text-xs text-muted-foreground">{section.steps.length} шагов · {section.description}</p>
      </div>
    </DropdownMenuItem>
  ));
}
