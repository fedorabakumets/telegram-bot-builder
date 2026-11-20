/** @fileoverview Адаптивные действия обучения, поддержки и сообщества в редакторе. */
import { CircleHelp, Ellipsis, Github, GraduationCap, MessageCircle, Send } from 'lucide-react';
import { useRef } from 'react';
import { WorkspaceHeaderActionItems } from '@/components/ui/workspace-header-action-items';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditorLearnButton } from '@/components/editor/canvas/learn/EditorLearnButton';
import { EditorLearnMenuItems } from '@/components/editor/canvas/learn/EditorLearnMenuItems';
import { requestEditorLearn, useEditorLearnActive } from '@/components/editor/canvas/learn/editor-learn-bridge';
import { SupportChatButton } from '@/components/support/support-chat-button';
import { GITHUB_REPOSITORY_URL } from './github-button';
import { TELEGRAM_CHAT_URL } from './telegram-chat-invite';

/** Свойства общей группы помощи. */
interface EditorHelpActionsProps {
  /** Принудительно показывает единое меню для запасных входов в помощь. */
  compact?: boolean;
  /** Открывает чат поддержки для пользователей с доступом. */
  canUseSupport: boolean;
  /** Разделы обучения можно запустить в текущем редакторе. */
  showLearning: boolean;
}

/** Показывает ссылки на репозиторий и чат сообщества. */
function HelpLinks() {
  return (
    <WorkspaceHeaderActionItems items={[
      { id: 'github', content: <DropdownMenuItem asChild><a href={GITHUB_REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
        <Github aria-hidden="true" /> GitHub
      </a></DropdownMenuItem> },
      { id: 'telegram', content: <DropdownMenuItem asChild><a href={TELEGRAM_CHAT_URL} target="_blank" rel="noopener noreferrer">
        <Send aria-hidden="true" /> Telegram
      </a></DropdownMenuItem> },
    ]} />
  );
}

/**
 * Показывает общий вход в помощь в узком контейнере и отдельные действия в широком.
 * @param props - Доступность действий для текущего пользователя и вкладки.
 * @returns Адаптивная группа помощи.
 */
export function EditorHelpActions({ compact = false, canUseSupport, showLearning }: EditorHelpActionsProps) {
  const learnActive = useEditorLearnActive();
  const helpTriggerRef = useRef<HTMLButtonElement>(null);
  /** Использует один экземпляр панели поддержки для обоих вариантов шапки. */
  const renderActions = (openSupport?: (trigger?: HTMLElement) => void, unread = 0) => {
    const unreadLabel = unread > 0 ? (unread > 9 ? '9+' : unread) : null;
    return (
      <>
        {/* Единый интервал между действиями, как в соседних рабочих вкладках. */}
        {!compact && <div className="hidden shrink-0 items-center gap-2 @[480px]:flex">
          <WorkspaceHeaderActionItems items={[
            { id: 'learning', content: showLearning && <EditorLearnButton showLabel active={learnActive} onStart={requestEditorLearn} /> },
            { id: 'support', content: openSupport && <Button type="button" variant="outline" size="sm"
            className="h-8 shrink-0 gap-1.5 px-2" data-testid="button-support-chat"
            onClick={(event) => openSupport(event.currentTarget)}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Поддержка
            {unreadLabel && <span className="tabular-nums text-primary" aria-label={`Непрочитанных ответов: ${unread}`}>{unreadLabel}</span>}
          </Button> },
            { id: 'github', content: <Button asChild variant="outline" size="sm" className="hidden h-8 gap-1.5 px-2 @[800px]:inline-flex">
              <a href={GITHUB_REPOSITORY_URL} target="_blank" rel="noopener noreferrer"><Github className="h-4 w-4" aria-hidden="true" /> GitHub</a>
            </Button> },
            { id: 'telegram', content: <Button asChild variant="outline" size="sm" className="hidden h-8 gap-1.5 px-2 @[800px]:inline-flex">
              <a href={TELEGRAM_CHAT_URL} target="_blank" rel="noopener noreferrer"><Send className="h-4 w-4" aria-hidden="true" /> Telegram</a>
            </Button> },
            { id: 'more', content: <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 px-2 @[800px]:hidden">
                  <Ellipsis className="h-4 w-4" aria-hidden="true" /> Ещё
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end"><HelpLinks /></DropdownMenuContent>
            </DropdownMenu> },
          ]} />
        </div>}
        <div className={compact ? 'shrink-0' : 'shrink-0 @[480px]:hidden'}>
          {/* На узкой панели действия помощи собраны в одну кнопку. */}
          <WorkspaceHeaderActionItems items={[{ id: 'help', content: <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button ref={helpTriggerRef} type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 px-2">
                <CircleHelp className="h-4 w-4" aria-hidden="true" /> Помощь
                {unreadLabel && <span className="tabular-nums text-primary" aria-label={`Непрочитанных ответов: ${unread}`}>{unreadLabel}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <WorkspaceHeaderActionItems items={[
              { id: 'learning', content: showLearning && <DropdownMenuSub>
                <DropdownMenuSubTrigger><GraduationCap aria-hidden="true" /> Обучение</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="max-h-[var(--radix-dropdown-menu-content-available-height)] w-64 max-w-[calc(100vw-1rem)] overflow-y-auto">
                    <EditorLearnMenuItems onStart={requestEditorLearn} />
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub> },
              { id: 'support', content: openSupport && <DropdownMenuItem onSelect={() => openSupport(helpTriggerRef.current ?? undefined)}>
                <MessageCircle aria-hidden="true" /> Поддержка
              </DropdownMenuItem> },
              ]} />
              <HelpLinks />
            </DropdownMenuContent>
          </DropdownMenu> }]} />
        </div>
      </>
    );
  };
  return canUseSupport ? <SupportChatButton renderTrigger={renderActions} /> : renderActions();
}
