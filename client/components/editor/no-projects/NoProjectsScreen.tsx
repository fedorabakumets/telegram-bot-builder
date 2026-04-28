/**
 * @fileoverview Экран "Нет проектов" — отображается когда у пользователя нет проектов
 * @module components/editor/no-projects/NoProjectsScreen
 */

import { useState } from 'react';
import { Bot, LogOut, FileJson, LayoutTemplate, Plus } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/queryClient';
import { useNoProjects } from './hooks/use-no-projects';

/**
 * Экран приветствия для пользователя без проектов.
 * Предлагает создать, импортировать, выбрать шаблон или выйти.
 *
 * @returns JSX элемент экрана
 */
export function NoProjectsScreen() {
  const [projectName, setProjectName] = useState('');
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const {
    isCreateOpen,
    setIsCreateOpen,
    handleCreateProject,
    handleImport,
    handleTemplates,
    handleLogout,
    isImporting,
  } = useNoProjects();

  /** Мутация создания нового проекта через POST /api/projects */
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
          {/* Иконка бота */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">Нет проектов</CardTitle>
            <CardDescription>
              Создайте первый проект или импортируйте существующий
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 pt-2">
          <Button className="w-full" onClick={handleCreateProject}>
            <Plus className="h-4 w-4 mr-2" />
            Создать проект
          </Button>

          <Button className="w-full" variant="outline" onClick={handleImport} disabled={isImporting}>
            <FileJson className="h-4 w-4 mr-2" />
            {isImporting ? 'Импорт...' : 'Импортировать JSON'}
          </Button>

          <Button className="w-full" variant="outline" onClick={handleTemplates}>
            <LayoutTemplate className="h-4 w-4 mr-2" />
            Выбрать шаблон
          </Button>

          <Button className="w-full text-destructive" variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </CardContent>
      </Card>

      {/* Диалог создания проекта */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый проект</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Название проекта"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && projectName.trim() && createMutation.mutate(projectName.trim())}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Отмена</Button>
              <Button
                disabled={!projectName.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate(projectName.trim())}
              >
                {createMutation.isPending ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
