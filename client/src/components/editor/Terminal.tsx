/**
 * @fileoverview Компонент терминала для отображения вывода питон-скрипта бота
 *
 * Этот компонент предоставляет интерфейс для отображения вывода (stdout/stderr)
 * запущенного питон-скрипта бота в формате, похожем на терминал VS Code.
 *
 * @module Terminal
 */

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import Ansi from 'ansi-to-react';

/**
 * Тип для одной строки в терминале
 * @typedef {Object} TerminalLine
 * @property {string} id - Уникальный идентификатор строки
 * @property {string} content - Содержимое строки
 * @property {'stdout' | 'stderr'} type - Тип вывода
 * @property {Date} timestamp - Время добавления строки
 */
interface TerminalLine {
  id: string;
  content: string;
  type: 'stdout' | 'stderr';
  timestamp: Date;
}

/**
 * Свойства компонента терминала
 * @interface TerminalProps
 */
interface TerminalProps {
  /** Максимальное количество строк для отображения */
  maxLines?: number;
  /** Состояние видимости терминала */
  isVisible?: boolean;
  /** Функция для переключения видимости терминала */
  onToggleVisibility?: () => void;
}

/**
 * Интерфейс для методов, доступных через ref
 * @interface TerminalHandle
 */
export interface TerminalHandle {
  /** Добавить новую строку в терминал */
  addLine: (content: string, type?: 'stdout' | 'stderr') => void;
}

/**
 * Компонент терминала для отображения вывода питон-скрипта
 * @param props - Свойства компонента
 * @param ref - Ссылка для доступа к методам компонента
 * @returns JSX.Element
 */
export const Terminal = forwardRef<TerminalHandle, TerminalProps>(({
  maxLines = 1000,
  isVisible = true,
  onToggleVisibility
}, ref) => {
  // Состояние для хранения строк терминала
  const [lines, setLines] = useState<TerminalLine[]>([]);

  // Ссылка на контейнер с выводом для автопрокрутки
  const outputContainerRef = useRef<HTMLDivElement>(null);

  // Эффект для автопрокрутки к последней строке
  useEffect(() => {
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
  }, [lines]);

  /**
   * Добавить новую строку в терминал
   * @param content - Содержимое строки
   * @param type - Тип вывода (stdout/stderr)
   */
  const addLine = (content: string, type: 'stdout' | 'stderr' = 'stdout') => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date()
    };

    setLines(prev => {
      const updatedLines = [...prev, newLine];

      // Ограничиваем количество строк до maxLines
      if (updatedLines.length > maxLines) {
        return updatedLines.slice(-maxLines);
      }

      return updatedLines;
    });
  };

  // Предоставляем методы через ref
  useImperativeHandle(ref, () => ({
    addLine
  }));


  /**
   * Очистить терминал
   */
  const clearTerminal = () => {
    setLines([]);
  };

  // Если терминал не видим, ничего не отображаем
  if (!isVisible) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-black text-green-400 font-mono text-sm">
      {/* Заголовок терминала */}
      <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
        <h3 className="font-semibold">Терминал</h3>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearTerminal}
            className="text-white hover:bg-gray-700"
          >
            Очистить
          </Button>
          {onToggleVisibility && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onToggleVisibility}
              className="text-white hover:bg-gray-700"
            >
              Скрыть
            </Button>
          )}
        </div>
      </div>
      
      {/* Контейнер для вывода */}
      <div
        ref={outputContainerRef}
        className="h-64 overflow-y-auto p-4 whitespace-pre-wrap break-all"
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className={line.type === 'stderr' ? 'text-red-400' : 'text-green-400'}
          >
            <Ansi>{line.content}</Ansi>
          </div>
        ))}

        {lines.length === 0 && (
          <div className="text-gray-500 italic">Нет вывода...</div>
        )}
      </div>
    </div>
  );
});