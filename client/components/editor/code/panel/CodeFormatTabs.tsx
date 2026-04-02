/**
 * @fileoverview Компонент вкладок форматов кода
 * Отображает список доступных форматов файлов для выбора
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnvFileTab } from '../types/env-file-tab';
import { CodeFormat } from '../hooks/use-code-generator';
import { normalizeProjectNameToFile } from '@/utils/normalize-file-name';

/**
 * Свойства компонента вкладок форматов
 */
interface CodeFormatTabsProps {
  /** Выбранный формат */
  selectedFormat: CodeFormat;
  /** Название проекта для отображения имени файла */
  projectName: string;
  /** Колбэк при смене формата */
  onFormatChange: (format: CodeFormat) => void;
}

/**
 * Компонент вкладок выбора формата кода
 * @param props - Свойства компонента
 * @returns JSX элемент с вкладками форматов
 */
export function CodeFormatTabs({ selectedFormat, projectName, onFormatChange }: CodeFormatTabsProps) {
  const tabClass = 'w-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-muted flex items-center gap-2 px-3 py-2 text-sm font-normal rounded-none border-b border-border/50 data-[state=inactive]:hover:bg-accent/20 justify-start min-w-0';

  return (
    <div className="space-y-1.5 xs:space-y-2">
      <label className="text-xs xs:text-sm font-semibold text-foreground block">Форматы:</label>
      <Tabs value={selectedFormat} onValueChange={(v) => onFormatChange(v as CodeFormat)} className="w-full">
        <TabsList className="flex flex-col h-auto p-0 bg-transparent border-none justify-start">
          <TabsTrigger value="python" className={tabClass}>
            <i className="fas fa-file-code text-blue-500 text-xs flex-shrink-0"></i>
            <span className="text-xs truncate min-w-0">{normalizeProjectNameToFile(projectName)}.py</span>
          </TabsTrigger>
          <TabsTrigger value="json" className={tabClass}>
            <i className="fas fa-file-code text-green-500 text-xs flex-shrink-0"></i>
            <span className="text-xs truncate min-w-0">project.json</span>
          </TabsTrigger>
          <TabsTrigger value="requirements" className={tabClass}>
            <i className="fas fa-file-alt text-orange-500 text-xs flex-shrink-0"></i>
            <span className="text-xs truncate min-w-0">requirements.txt</span>
          </TabsTrigger>
          <TabsTrigger value="readme" className={tabClass}>
            <i className="fas fa-file-alt text-purple-500 text-xs"></i>
            <span className="text-xs truncate min-w-0">README.md</span>
          </TabsTrigger>
          <TabsTrigger value="dockerfile" className={tabClass}>
            <i className="fab fa-docker text-cyan-500 text-xs flex-shrink-0"></i>
            <span className="text-xs truncate min-w-0">Dockerfile</span>
          </TabsTrigger>
          <EnvFileTab />
        </TabsList>
      </Tabs>
    </div>
  );
}
