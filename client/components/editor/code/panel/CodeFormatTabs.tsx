/**
 * @fileoverview Выбор экспортируемого файла с пояснением его назначения.
 */
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CodeFormat } from '../hooks/use-code-generator';
import { normalizeProjectNameToFile } from '@/utils/normalize-file-name';

/** Свойства списка файлов проекта. */
interface CodeFormatTabsProps {
  /** Выбранный формат. */
  selectedFormat: CodeFormat;
  /** Название проекта для имени файла Python. */
  projectName: string;
  /** Обработчик выбора файла. */
  onFormatChange: (format: CodeFormat) => void;
}

/** Описание экспортируемого файла. */
interface FileOption {
  /** Формат генератора. */
  format: CodeFormat;
  /** Имя файла. */
  name: string;
  /** Короткая метка типа. */
  tag: string;
  /** Назначение файла. */
  description: string;
}

/**
 * Показывает файлы в виде доступного с клавиатуры вертикального списка.
 * @param props - Текущий формат, имя проекта и обработчик выбора.
 * @returns Список вкладок файлов.
 */
export function CodeFormatTabs({ selectedFormat, projectName, onFormatChange }: CodeFormatTabsProps) {
  const files: FileOption[] = [
    { format: 'python', name: `${normalizeProjectNameToFile(projectName)}.py`, tag: 'PY', description: 'Код Telegram бота' },
    { format: 'json', name: 'project.json', tag: '{}', description: 'Структура сценария для редактирования' },
    { format: 'requirements', name: 'requirements.txt', tag: 'TXT', description: 'Зависимости Python для запуска' },
    { format: 'readme', name: 'README.md', tag: 'MD', description: 'Инструкция по настройке и запуску' },
    { format: 'dockerfile', name: 'Dockerfile', tag: 'Docker', description: 'Сборка контейнера для размещения бота' },
    { format: 'env', name: '.env', tag: 'ENV', description: 'Переменные окружения и настройки' },
  ];
  return (
    <section className="code-files space-y-3" aria-label="Файлы проекта">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Файлы проекта</h3><span className="text-xs text-muted-foreground">6 файлов</span>
      </div>
      <Tabs value={selectedFormat} orientation="vertical" activationMode="manual" onValueChange={(value) => onFormatChange(value as CodeFormat)}>
        <TabsList aria-label="Выберите файл проекта" className="code-file-list flex h-auto w-full flex-col gap-2 bg-transparent p-0">
          {files.map((file) => <TabsTrigger key={file.format} value={file.format}
            title={`${file.name} · ${file.description}`} aria-label={`${file.name} ${file.description}`}
            onClick={() => { if (selectedFormat === file.format) onFormatChange(file.format); }}
            className="code-file code-action flex w-full min-w-0 justify-start gap-3 whitespace-normal rounded-xl border p-3 text-left font-normal shadow-none">
            <span aria-hidden="true" className="code-file-tag code-inset flex h-10 w-12 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">{file.tag}</span>
            <span className="code-file-text min-w-0 flex-1 space-y-1">
              <span className="code-file-name block break-all text-sm font-medium">{file.name}</span>
              <span className="code-file-description block text-pretty text-xs text-muted-foreground">{file.description}</span>
            </span>
            <span className="code-file-marker h-2 w-2 shrink-0 rounded-full" aria-hidden="true" />
          </TabsTrigger>)}
        </TabsList>
      </Tabs>
    </section>
  );
}
