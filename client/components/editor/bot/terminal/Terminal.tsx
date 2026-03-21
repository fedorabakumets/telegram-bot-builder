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

  // Хук изменения размера (используется для будущего ресайза)
  useTerminalResize({ fullSize: true });

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
      className={`border rounded-lg overflow-hidden ${themeClasses.terminalBgClass} ${themeClasses.terminalTextClass} font-mono text-sm transition-all duration-200 w-full h-full flex flex-col ${isVisible ? 'opacity-100' : 'hidden'}`}
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
      <div className="flex-1 overflow-auto p-4">
        <TerminalOutput
          lines={lines}
          containerRef={outputContainerRef}
          scale={scale}
          terminalTextClass={themeClasses.terminalTextClass}
          stderrTextClass={themeClasses.stderrTextClass}
          placeholderTextClass={themeClasses.placeholderTextClass}
        />
      </div>
    </div>
  );
});
