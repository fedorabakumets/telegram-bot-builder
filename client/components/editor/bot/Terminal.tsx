/**
 * @fileoverview Компонент терминала для отображения вывода питон-скрипта бота
 *
 * Этот компонент предоставляет интерфейс для отображения вывода (stdout/stderr)
 * запущенного питон-скрипта бота в формате, похожем на терминал VS Code.
 *
 * @module Terminal
 */

import { forwardRef, useImperativeHandle } from 'react';
import { TerminalHeader } from './TerminalHeader';
import { TerminalOutput } from './TerminalOutput';
import { copyTerminalOutput, saveTerminalOutput } from './terminalUtils';
import { TerminalHandle, TerminalProps } from './terminalTypes';
import { useTerminalTheme } from './useTerminalTheme';
import { useTerminalResize } from './useTerminalResize';
import { useTerminalScale } from './useTerminalScale';
import { useTerminalLines } from './useTerminalLines';
import { useTerminalMethods } from './useTerminalMethods';

export type { TerminalHandle, TerminalProps };

/**
 * Компонент терминала для отображения вывода питон-скрипта
 * @param props - Свойства компонента
 * @param ref - Ссылка для доступа к методам компонента
 * @returns JSX.Element
 */
export const Terminal = forwardRef<TerminalHandle, TerminalProps>((props, ref) => {
  const {
    isVisible = true,
    onToggleVisibility,
    wsConnection,
    projectId,
    tokenId
  } = props;

  // Ключ для доступа к логам
  const logKey = projectId && tokenId ? `${projectId}-${tokenId}` : null;

  // Хук темы
  const themeClasses = useTerminalTheme();

  // Хук изменения размера
  const { dimensions, startResize } = useTerminalResize();

  // Хук масштаба
  const { scale, adjustScale } = useTerminalScale();

  // Хук строк
  const { lines, outputContainerRef, setLines } = useTerminalLines(logKey);

  // Хук методов
  const { addLine, addLineLocal, sendToServer, clearTerminal } = useTerminalMethods({
    logKey,
    wsConnection,
    projectId,
    tokenId,
    setLines
  });

  // Предоставляем методы через ref
  useImperativeHandle(ref, () => ({
    addLine,
    addLineLocal,
    sendToServer
  }));

  return (
    <div
      className={`border rounded-lg overflow-hidden ${themeClasses.terminalBgClass} ${themeClasses.terminalTextClass} font-mono text-sm transition-all duration-200 w-full ${isVisible ? 'opacity-100' : 'hidden'}`}
      style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
    >
      <TerminalHeader
        onZoomIn={() => adjustScale(1.2)}
        onZoomOut={() => adjustScale(0.8)}
        onClear={clearTerminal}
        onCopy={() => copyTerminalOutput(lines)}
        onSave={() => saveTerminalOutput(lines)}
        onHide={onToggleVisibility}
        headerBgClass={themeClasses.headerBgClass}
        buttonTextColorClass={themeClasses.buttonTextColorClass}
        buttonHoverClass={themeClasses.buttonHoverClass}
      />

      <TerminalOutput
        lines={lines}
        containerRef={outputContainerRef}
        height={dimensions.height}
        scale={scale}
        terminalTextClass={themeClasses.terminalTextClass}
        stderrTextClass={themeClasses.stderrTextClass}
        placeholderTextClass={themeClasses.placeholderTextClass}
      />

      {/* Элемент для изменения размера */}
      <div
        className="resizer-corner cursor-se-resize absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-gray-400"
        onMouseDown={startResize}
        style={{ marginBottom: '2px', marginRight: '2px' }}
      />
    </div>
  );
});
