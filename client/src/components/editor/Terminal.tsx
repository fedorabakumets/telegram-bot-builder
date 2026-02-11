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

  // Эффект для автопрокрутки к последной строке
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

  return (
    <div className={`border rounded-lg overflow-hidden bg-black text-green-400 font-mono text-sm transition-all duration-200 w-full ${isVisible ? 'max-h-[320px] opacity-100' : 'max-h-[320px] opacity-0 overflow-hidden'}`}>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Копируем весь вывод в буфер обмена
              const outputText = lines.map(line => line.content).join('\n');
              navigator.clipboard.writeText(outputText);
            }}
            className="text-white hover:bg-gray-700"
          >
            Копировать
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Сохраняем вывод в файл
              const outputText = lines.map(line => line.content).join('\n');
              const blob = new Blob([outputText], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `terminal-output-${new Date().toISOString().slice(0, 19)}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="text-white hover:bg-gray-700"
          >
            Сохранить
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
        className="h-64 overflow-y-auto p-4 whitespace-pre-wrap break-all flex flex-col"
      >
        {lines.length === 0 ? (
          <div className="flex-grow flex items-center justify-center text-gray-500 italic">
            Нет вывода...
          </div>
        ) : (
          <>
            {lines.map((line) => (
              <div
                key={line.id}
                className={line.type === 'stderr' ? 'text-red-400' : 'text-green-400'}
              >
                <Ansi>{line.content}</Ansi>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
});