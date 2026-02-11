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
import { useTheme } from '@/components/theme-provider';

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

  // Состояние для хранения уровня масштабирования
  const [scale, setScale] = useState<number>(1);

  // Состояние для хранения размеров терминала
  const [dimensions, setDimensions] = useState({ width: 600, height: 320 });

  // Ссылки для отслеживания состояния перетаскивания
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startWidthRef = useRef(0);
  const startHeightRef = useRef(0);

  // Ссылка на контейнер с выводом для автопрокрутки
  const outputContainerRef = useRef<HTMLDivElement>(null);

  // Получаем текущую тему из провайдера
  const { theme } = useTheme();

  // Эффект для автопрокрутки к последной строке
  useEffect(() => {
    if (outputContainerRef.current) {
      // Учитываем масштаб при прокрутке
      // При масштабировании высота контента изменяется, поэтому прокручиваем на полную высоту
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
  }, [lines, scale]);

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
   * Изменить масштаб текста
   * @param factor - Множитель для изменения масштаба
   */
  const adjustScale = (factor: number) => {
    setScale(prevScale => Math.max(0.5, Math.min(2, prevScale * factor)));
  };

  /**
   * Обработчик начала перетаскивания для изменения размера
   * @param e - Событие мыши
   */
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();

    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;

    startWidthRef.current = dimensions.width;
    startHeightRef.current = dimensions.height;

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  };

  /**
   * Обработчик изменения размера
   * @param e - Событие мыши
   */
  const resize = (e: MouseEvent) => {
    if (!isResizingRef.current) return;

    const width = startWidthRef.current + (e.clientX - startXRef.current);
    const height = startHeightRef.current + (e.clientY - startYRef.current);

    // Минимальные размеры
    const minWidth = 400;
    const minHeight = 200;

    // Максимальные размеры
    const maxWidth = window.innerWidth - 50;
    const maxHeight = window.innerHeight - 50;

    setDimensions({
      width: Math.max(minWidth, Math.min(maxWidth, width)),
      height: Math.max(minHeight, Math.min(maxHeight, height))
    });
  };

  /**
   * Обработчик окончания перетаскивания
   */
  const stopResize = () => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  };

  /**
   * Очистить терминал
   */
  const clearTerminal = () => {
    setLines([]);
  };

  // Определяем классы для стилей в зависимости от темы
  const terminalBgClass = theme === 'dark' ? 'bg-black' : 'bg-gray-100';
  const terminalTextClass = theme === 'dark' ? 'text-green-400' : 'text-green-800';
  const headerBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300';
  const buttonTextColorClass = theme === 'dark' ? 'text-white' : 'text-black';
  const buttonHoverClass = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-400';
  const placeholderTextClass = theme === 'dark' ? 'text-gray-500' : 'text-gray-400';
  const stderrTextClass = theme === 'dark' ? 'text-red-400' : 'text-red-600';

  return (
    <div
      className={`border rounded-lg overflow-hidden ${terminalBgClass} ${terminalTextClass} font-mono text-sm transition-all duration-200 w-full ${isVisible ? 'opacity-100' : 'hidden'}`}
      style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
    >
      {/* Заголовок терминала */}
      <div className={`${headerBgClass} px-4 py-2 flex justify-between items-center`}>
        <h3 className="font-semibold">Терминал</h3>
        <div className="flex space-x-2 flex-wrap justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => adjustScale(1.2)}
            className={`${buttonTextColorClass} ${buttonHoverClass} mb-1`}
          >
            Увеличить
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => adjustScale(0.8)}
            className={`${buttonTextColorClass} ${buttonHoverClass} mb-1`}
          >
            Уменьшить
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            className={`${buttonTextColorClass} ${buttonHoverClass} mb-1`}
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
            className={`${buttonTextColorClass} ${buttonHoverClass} mb-1`}
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
            className={`${buttonTextColorClass} ${buttonHoverClass} mb-1`}
          >
            Сохранить
          </Button>
          {onToggleVisibility && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVisibility}
              className={`${buttonTextColorClass} ${buttonHoverClass} mb-1`}
            >
              Скрыть
            </Button>
          )}
        </div>
      </div>

      {/* Контейнер для вывода */}
      <div
        className="overflow-hidden p-4 whitespace-pre-wrap break-all flex flex-col"
        style={{
          height: `${dimensions.height - 80}px`,
          width: '100%',
          minHeight: '0'
        }}
      >
        <div
          ref={outputContainerRef}
          className="overflow-y-auto h-full w-full"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: '100%',
            minHeight: '0',
            padding: '0',
            margin: '0'
          }}
        >
          {lines.length === 0 ? (
            <div className="flex items-center justify-center h-full italic" style={{ color: placeholderTextClass }}>
              Нет вывода...
            </div>
          ) : (
            <>
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={line.type === 'stderr' ? stderrTextClass : terminalTextClass}
                  style={{ lineHeight: '1.2' }}
                >
                  <Ansi>{line.content}</Ansi>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Элемент для изменения размера */}
      <div
        className="resizer-corner cursor-se-resize absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-gray-400"
        onMouseDown={startResize}
        style={{ marginBottom: '2px', marginRight: '2px' }}
      />
    </div>
  );
});