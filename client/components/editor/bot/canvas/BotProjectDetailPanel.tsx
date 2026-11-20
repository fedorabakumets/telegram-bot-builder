/** @fileoverview Панель общих настроек ботов проекта на холсте. */
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BotProjectLaunchDefault } from './BotProjectLaunchDefault';
import { BotProjectRuntimeDefaults } from './BotProjectRuntimeDefaults';
import { BotProjectSettingDefaults } from './BotProjectSettingDefaults';
import { ProjectBotInheritancePicker } from './ProjectBotInheritancePicker';
import { ProjectCommonSettings } from './ProjectCommonSettings';
import type { BotProject, BotToken } from '@shared/schema';

/** Свойства панели проекта. */
interface BotProjectDetailPanelProps {
  /** Проект, которому принадлежат настройки. */
  project: BotProject;
  /** Подключённые боты. */
  tokens: BotToken[];
  /** Закрывает панель проекта. */
  onClose: () => void;
  /** Использует заголовок модальной панели на мобильном экране. */
  compact?: boolean;
}

/**
 * Показывает общие настройки проекта и управление наследованием.
 * @param props - Свойства панели проекта.
 * @returns Панель проекта.
 */
export function BotProjectDetailPanel({ project, tokens, onClose, compact }: BotProjectDetailPanelProps) {
  /** Заголовок охватывает общие параметры проекта и наследуемые значения. */
  const heading = 'Настройки проекта';

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          {compact
            ? <SheetTitle className="text-sm">{heading}</SheetTitle>
            : <h2 className="text-sm font-semibold">{heading}</h2>}
          {compact
            ? <SheetDescription className="truncate">{project.name}</SheetDescription>
            : <p className="truncate text-sm text-muted-foreground">{project.name}</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть настройки проекта">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>
      <Tabs key={project.id} defaultValue="bots" className="flex min-h-0 flex-1 flex-col">
        <TabsList aria-label="Разделы настроек проекта" className="mx-4 mt-3 h-9 shrink-0 self-start">
          {/* Названия различают наследуемые значения и настройки данных и прав. */}
          <TabsTrigger value="bots" className="px-2.5 text-xs">По умолчанию</TabsTrigger>
          <TabsTrigger value="common" className="px-2.5 text-xs">Данные и доступ</TabsTrigger>
        </TabsList>
        {/* Вкладки сохраняют черновики при переключении. */}
        <TabsContent forceMount value="bots" className="mt-0 min-h-0 flex-1 space-y-3 overflow-auto p-4 data-[state=inactive]:hidden">
          <ProjectBotInheritancePicker projectId={project.id} tokens={tokens} projectDefaults={project.botSettingDefaults} />
          <BotProjectLaunchDefault projectId={project.id} />
          <BotProjectRuntimeDefaults projectId={project.id} />
          <BotProjectSettingDefaults projectId={project.id} />
        </TabsContent>
        <TabsContent forceMount value="common" className="mt-0 min-h-0 flex-1 overflow-auto p-4 data-[state=inactive]:hidden">
          <ProjectCommonSettings project={project} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
