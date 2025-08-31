import React from 'react';
import { Users, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface GroupsPanelProps {
  projectId: number;
  projectName: string;
}

export function GroupsPanel({ projectId, projectName }: GroupsPanelProps) {
  return (
    <div className="h-full w-full p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Управление группами</h1>
          <p className="text-muted-foreground">
            Администрирование Telegram групп для проекта "{projectName}"
          </p>
        </div>
        
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Нет подключенных групп
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Добавьте первую группу для управления участниками и контентом
          </p>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Подключить группу
          </Button>
        </div>
      </div>
    </div>
  );
}