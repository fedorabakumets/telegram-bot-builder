/**
 * @fileoverview Панель поиска по строкам терминала
 *
 * Всегда видимая строка поиска с навигацией между совпадениями (↑/↓)
 * и счётчиком совпадений. Стиль как у Railway — отдельная строка сверху.
 *
 * @module TerminalSearchBar
 */

import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

/** Пропсы компонента панели поиска */
interface TerminalSearchBarProps {
  /** Текущий поисковый запрос */
  searchQuery: string;
  /** Обработчик изменения запроса */
  onSearchChange: (query: string) => void;
  /** Текущий индекс совпадения (0-based) */
  currentMatch: number;
  /** Общее количество совпадений */
  totalMatches: number;
  /** Перейти к следующему совпадению */
  onNext: () => void;
  /** Перейти к предыдущему совпадению */
  onPrev: () => void;
}

/**
 * Панель поиска по терминалу с навигацией между совпадениями
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalSearchBar({
  searchQuery,
  onSearchChange,
  currentMatch,
  totalMatches,
  onNext,
  onPrev,
}: TerminalSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  /** Обработка клавиш: Enter — следующее, Shift+Enter — предыдущее */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      onPrev();
    } else if (e.key === 'Enter') {
      onNext();
    }
  };

  return (
    <div className="flex items-center gap-1 px-3 py-1 border-b border-border bg-muted/30 h-8">
      <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <Input
        ref={inputRef}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Фильтрация и поиск в журналах"
        className="h-6 text-xs flex-1 min-w-0 border-none bg-transparent shadow-none focus-visible:ring-0 px-1"
      />
      {searchQuery && (
        <>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {totalMatches > 0 ? `${currentMatch + 1} / ${totalMatches}` : '0 / 0'}
          </span>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onPrev} disabled={totalMatches === 0}>
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onNext} disabled={totalMatches === 0}>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}
