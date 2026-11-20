/** @fileoverview Компактная шапка диалогов в общем стиле рабочих вкладок. */
import type { ReactNode } from 'react';
import type { BotToken } from '@shared/schema';
import { MessageSquare, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceTabHeading } from '@/components/ui/workspace-tab-heading';
import { WorkspaceTabActions } from '@/components/ui/workspace-tab-actions';
import { ProjectSelector } from '../components/header';
import { DialogBotSelector } from './dialog-bot-selector';
import { useQueryClient } from '@tanstack/react-query';
import { WorkspaceAdaptiveHeader } from '@/components/ui/workspace-adaptive-header';

/** Проект, доступный в селекторе области переписки. */
interface DialogProject {
  /** Идентификатор проекта. */ id: number;
  /** Название проекта. */ name: string;
}

/** Область выбранной переписки и действия заголовка. */
interface DialogsWorkspaceHeaderProps {
  /** Текущий проект. */ projectId: number;
  /** Доступные проекты. */ projects?: DialogProject[];
  /** Выбор другого проекта. */ onProjectChange?: (id: number) => void;
  /** Боты выбранного проекта. */ tokens: BotToken[];
  /** Выбранный бот; null открывает диалоги всех ботов проекта. */ tokenId: number | null;
  /** Изменение выбранного бота. */ onSelectToken: (id: number | null) => void;
  /** Открытие формы новой рассылки. */ onNewBroadcast: () => void;
  /** Сведения о выбранном собеседнике. */ children?: ReactNode;
  /** Наличие открытой переписки или рассылки. */ hasConversation: boolean;
}

/**
 * Объединяет название, выбор области и действия в адаптивной шапке.
 * @param props - Проект, бот и действия переписки.
 * @returns Заголовок вкладки и строка выбранного собеседника.
 */
export function DialogsWorkspaceHeader({ projectId, projects, onProjectChange, tokens,
  tokenId, onSelectToken, onNewBroadcast, children, hasConversation }: DialogsWorkspaceHeaderProps) {
  const queryClient = useQueryClient();
  /** Обновляет данные только текущего проекта, сохраняя выбранную переписку. */
  const refreshDialogs = () => {
    void queryClient.invalidateQueries({ predicate: query => query.queryKey.some(part =>
      part === projectId || (typeof part === 'string' && part.startsWith(`/api/projects/${projectId}/`))) });
  };
  return <>
    <header className="workspace-tab-frame dialogs-workspace-header">
      <WorkspaceAdaptiveHeader className="dialogs-header-content" scopeSelector=".dialogs-scope" actionsSelector=".dialogs-heading-actions">
        <WorkspaceTabHeading title="Диалоги" icon={<MessageSquare />}
          description="Переписка с пользователями и группами."
          actions={<div className="dialogs-heading-actions">
            <WorkspaceTabActions docsPath="interface/dialogs" section="Диалоги" onRefresh={refreshDialogs} />
            <Button variant="outline" size="sm" onClick={onNewBroadcast} className="dialogs-new-broadcast">
              <Megaphone aria-hidden="true" className="h-4 w-4" />Рассылка
            </Button>
          </div>} />
        <div className="dialogs-scope" role="group" aria-label="Проект и бот">
          {projects && projects.length > 1 && onProjectChange && <ProjectSelector
            projects={projects} selectedProjectId={projectId} showBotCount={tokenId == null} onSelect={onProjectChange} />}
          {tokens.length > 0 && <DialogBotSelector projectId={projectId} tokens={tokens}
            selectedTokenId={tokenId} allowAll onSelect={onSelectToken} />}
        </div>
      </WorkspaceAdaptiveHeader>
    </header>
    {hasConversation && children && <div className="dialogs-conversation-heading">{children}</div>}
  </>;
}
