/**
 * @fileoverview Экран приветствия с тремя карточками создания проекта
 * @module components/editor/no-projects/NoProjectsScreen
 */

import { useState } from 'react';
import { Bot } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { apiRequest } from '@/queryClient';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { isTelegramUser } from '@/types/telegram-user';
import { useNoProjectsImport } from './use-no-projects-import';
import { useNoProjects } from './hooks/use-no-projects';
import { NoProjectsActions } from './NoProjectsActions';
import { NoProjectsCreateDialog } from './NoProjectsCreateDialog';
/**
 * Экран приветствия для пользователя без проектов
 * @returns JSX элемент экрана
 */
export function NoProjectsScreen() {
  const [projectName, setProjectName] = useState('');
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { openImport, importDialog } = useNoProjectsImport();
  const { user } = useTelegramAuth();
  /** Имя для приветствия; при отсутствии имени используем нейтральное обращение. */
  const firstName = user && isTelegramUser(user) ? user.firstName?.trim() : '';
  const {
    isCreateOpen,
    setIsCreateOpen,
    handleCreateProject,
    handleTemplates,
    handleLogout,
  } = useNoProjects();

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
    <div className="flex items-center justify-center min-h-dvh bg-background py-4 dark:bg-[#08080a]">
      <Card className="w-full max-w-[44rem] mx-4 rounded-xl border-0 shadow-none dark:bg-[#0d0d10] dark:text-white">
        <CardHeader className="items-center text-center space-y-2 px-4 pb-6 pt-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-transparent">
            <Bot className="size-7 text-primary" />
          </div>
          <h1 className="text-2xl font-normal text-balance">{firstName ? `Привет, ${firstName}!` : 'Привет!'} </h1>
          <p className="text-base text-muted-foreground">
            Что хотите сделать?
          </p>
        </CardHeader>

        <CardContent className="px-4 pb-5 pt-0">
          <NoProjectsActions
            ready={true}
            instant={true}
            onCreate={handleCreateProject}
            onImport={openImport}
            onTemplates={handleTemplates}
            onLogout={handleLogout}
            isImporting={false}
          />
        </CardContent>
      </Card>

      {importDialog}
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
