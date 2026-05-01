/**
 * @fileoverview Inline-строка ввода языка программирования для блока <pre>
 * @description Появляется автоматически когда курсор входит в <pre>.
 * Аналог LinkInputRow — рендерится в потоке документа, без Portal.
 */

import { useEffect, useRef, useState } from 'react';
import { Code2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Свойства компонента CodeLanguageRow
 */
export interface CodeLanguageRowProps {
  /** Открыта ли строка ввода */
  isOpen: boolean;
  /** Текущий язык блока кода (пустая строка если не задан) */
  currentLanguage: string;
  /** Callback применения языка */
  onApply: (lang: string) => void;
  /** Callback удаления языка */
  onRemove: () => void;
  /** Ref на контейнер — предотвращает закрытие при фокусе на поле ввода */
  containerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Inline-строка ввода языка для блока кода.
 * Появляется между тулбаром и редактором когда курсор стоит внутри <pre>.
 * @param props - Свойства компонента
 * @returns JSX элемент строки или null если закрыта
 */
export function CodeLanguageRow({
  isOpen,
  currentLanguage,
  onApply,
  onRemove,
  containerRef
}: CodeLanguageRowProps) {
  const [lang, setLang] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /** Синхронизируем поле с currentLanguage и фокусируем при открытии */
  useEffect(() => {
    if (isOpen) {
      setLang(currentLanguage);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, currentLanguage]);

  /** Enter — применяет язык, Escape — сбрасывает поле */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setLang(currentLanguage);
      inputRef.current?.blur();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      onApply(lang);
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={containerRef} className="flex items-center gap-2 px-1 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-900/10">
      {/* Иконка кода слева */}
      <Code2 className="h-4 w-4 text-emerald-400 shrink-0" />

      {/* Поле ввода языка */}
      <Input
        ref={inputRef}
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="python, javascript, sql..."
        className="h-7 text-xs flex-1 bg-transparent border-slate-600/50 focus:border-emerald-500/50"
      />

      {/* Кнопка применить */}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/10 shrink-0"
        onClick={() => onApply(lang)}
        title="Применить язык"
      >
        <Check className="h-3.5 w-3.5" />
      </Button>

      {/* Кнопка очистить язык — только если язык уже задан */}
      {currentLanguage && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
          onClick={onRemove}
          title="Убрать язык"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
