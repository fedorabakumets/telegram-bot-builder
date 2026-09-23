/**
 * @fileoverview Экран «нет проектов» — онбординг с диалогом проводника
 * @module components/editor/no-projects/NoProjectsScreen
 */

import { useCallback, useMemo, useState } from 'react';
import { Bot } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { apiRequest } from '@/queryClient';
import { TypewriterDialogue } from '@/components/editor/auth/TypewriterDialogue';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { isGuest, isTelegramUser } from '@/types/telegram-user';
import { cn } from '@/utils/utils';
import { useNoProjects } from './hooks/use-no-projects';
import { NoProjectsActions } from './NoProjectsActions';
import { NoProjectsCreateDialog } from './NoProjectsCreateDialog';
import {
  isNoProjectsIntroSeen,
  markNoProjectsIntroSeen,
} from './no-projects-intro-storage';

/**
 * Экран приветствия для пользователя без проектов
 * @returns JSX элемент экрана
 */
export function NoProjectsScreen() {
  const [projectName, setProjectName] = useState('');
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useTelegramAuth();

  const userId =
    user && !isGuest(user) && isTelegramUser(user) ? user.id : 'anon';

  const [introSeen] = useState(() => isNoProjectsIntroSeen(userId));
  const [actionsReady, setActionsReady] = useState(introSeen);

  const {
    isCreateOpen,
    setIsCreateOpen,
    handleCreateProject,
    handleImport,
    handleTemplates,
    handleLogout,
    isImporting,
  } = useNoProjects();

  const firstName =
    user && !isGuest(user) && isTelegramUser(user) ? user.firstName?.trim() : '';

  const lines = useMemo(
    () => [
      firstName
        ? { text: `${firstName}, тут пока пусто — проектов ещё нет.` }
        : { text: 'Тут пока пусто — проектов ещё нет.' },
      { text: 'Можно с нуля, с готового шаблона или закинуть JSON.' },
      { text: 'С чего начнём?' },
    ],
    [firstName],
  );

  /** После диалога — кнопки и пометка в localStorage */
  const handleAllDone = useCallback(() => {
    markNoProjectsIntroSeen(userId);
    setActionsReady(true);
  }, [userId]);

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest('POST', '/api/projects', {
        name,
        data: { nodes: [], connections: [] },
      }),
    onSuccess: (project: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
      setIsCreateOpen(false);
      setProjectName('');
      setLocation(`/editor/${project.id}`);
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm mx-4 shadow-2xl border-border/50">
        <CardHeader className="items-center text-center space-y-3 pb-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 w-full">
            {introSeen ? (
              <div className={cn('space-y-2 text-center')} role="status">
                {lines.map((line) => (
                  <p key={line.text} className="text-sm text-foreground/90 leading-relaxed">
                    {line.text}
                  </p>
                ))}
              </div>
            ) : (
              <TypewriterDialogue
                lines={lines}
                startDelayMs={200}
                gapMs={380}
                speedMs={28}
                lineClassName="text-sm text-foreground/90"
                onAllDone={handleAllDone}
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <NoProjectsActions
            ready={actionsReady}
            instant={introSeen}
            onCreate={handleCreateProject}
            onImport={handleImport}
            onTemplates={handleTemplates}
            onLogout={handleLogout}
            isImporting={isImporting}
          />
        </CardContent>
      </Card>

      <NoProjectsCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onSubmit={() => createMutation.mutate(projectName.trim())}
        isPending={createMutation.isPending}
      />
    </div>
  );
}
