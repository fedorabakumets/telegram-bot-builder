/**
 * @fileoverview Заголовок панели экспорта с компактной справкой по клавишам.
 */
import { Code2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useCodeHeaderTarget } from '@/components/layout/flexible/components/code-view-navigation';
import { WorkspaceTabHeading } from '@/components/ui/workspace-tab-heading';

/** Сочетания клавиш редактора и их назначение. */
const SHORTCUTS = [
  ['Копировать код', 'Ctrl / Cmd + Alt + C'],
  ['Переключить сворачивание', 'Ctrl / Cmd + Alt + F'],
  ['Свернуть блок', 'Ctrl + Shift + ['],
  ['Развернуть блок', 'Ctrl + Shift + ]'],
  ['Развернуть всё', 'Ctrl + K, затем Ctrl + J'],
  ['Поиск в коде', 'Ctrl / Cmd + F'],
];

/**
 * Показывает название раздела и раскрываемую справку по редактору.
 * @returns Заголовок панели экспорта.
 */
export function CodePanelHeader() {
  const headerTarget = useCodeHeaderTarget();
  /** Заголовок раздела отображается в обоих режимах просмотра. */
  const heading = <WorkspaceTabHeading title="Код проекта" icon={<Code2 />}
    description="Выберите файл, чтобы посмотреть код или скачать его." />;
  return (
    <div className="code-panel-header space-y-6">
      {headerTarget ? createPortal(heading, headerTarget) : heading}
      <details className="code-shortcuts code-surface rounded-xl border p-3">
        <summary className="cursor-pointer text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Горячие клавиши</summary>
        <dl className="mt-4 grid gap-3 text-xs">
          {SHORTCUTS.map(([label, keys]) => <div key={label} className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted-foreground">{label}</dt><dd><kbd className="code-inset rounded px-2 py-1 font-mono">{keys}</kbd></dd>
          </div>)}
        </dl>
      </details>
    </div>
  );
}
