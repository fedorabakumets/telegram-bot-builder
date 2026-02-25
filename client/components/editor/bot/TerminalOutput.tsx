/**
 * @fileoverview Вывод терминала
 *
 * Компонент отображает строки вывода терминала с поддержкой ANSI.
 *
 * @module TerminalOutput
 */

import Ansi from 'ansi-to-react';

interface TerminalLine {
  id: string;
  content: string;
  type: 'stdout' | 'stderr';
}

interface TerminalOutputProps {
  lines: TerminalLine[];
  containerRef: React.RefObject<HTMLDivElement>;
  height: number;
  scale: number;
  terminalTextClass: string;
  stderrTextClass: string;
  placeholderTextClass: string;
}

/**
 * Вывод терминала
 */
export function TerminalOutput({
  lines,
  containerRef,
  height,
  scale,
  terminalTextClass,
  stderrTextClass,
  placeholderTextClass
}: TerminalOutputProps) {
  return (
    <div
      ref={containerRef}
      className="overflow-y-auto p-4 whitespace-pre-wrap break-all flex flex-col"
      style={{
        height: `${height - 80}px`,
        width: '100%',
        minHeight: '0',
        fontSize: `${scale}em`,
        lineHeight: `${1.2 * scale}`
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
              style={{
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            >
              <Ansi>{line.content}</Ansi>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
