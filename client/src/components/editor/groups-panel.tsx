import React, { useState } from 'react';
import { Users, Plus, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface GroupsPanelProps {
  projectId: number;
  projectName: string;
}

export function GroupsPanel({ projectId, projectName }: GroupsPanelProps) {
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [groupUrl, setGroupUrl] = useState('');
  const [groupName, setGroupName] = useState('');
  const [makeAdmin, setMakeAdmin] = useState(false);

  const handleAddGroup = () => {
    // Здесь будет логика подключения группы
    console.log('Подключение группы:', { groupUrl, groupName, makeAdmin });
    // Пока просто закрываем модалку
    setShowAddGroup(false);
    setGroupUrl('');
    setGroupName('');
    setMakeAdmin(false);
  };

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
          <Button onClick={() => setShowAddGroup(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Подключить группу
          </Button>
        </div>

        {/* Модальное окно подключения группы */}
        <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Подключить группу</DialogTitle>
              <DialogDescription>
                Введите данные Telegram группы для подключения к боту
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-url">Ссылка на группу или @username</Label>
                <Input
                  id="group-url"
                  placeholder="https://t.me/group или @groupname"
                  value={groupUrl}
                  onChange={(e) => setGroupUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="group-name">Название для отображения</Label>
                <Input
                  id="group-name"
                  placeholder="Введите название группы"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="admin-rights"
                  checked={makeAdmin}
                  onCheckedChange={setMakeAdmin}
                />
                <Label htmlFor="admin-rights">
                  Бот будет добавлен как администратор
                </Label>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAddGroup(false)} 
                className="flex-1"
              >
                Отмена
              </Button>
              <Button onClick={handleAddGroup} className="flex-1">
                Подключить группу
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}