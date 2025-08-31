import React from 'react';
import { Users, MessageSquare, Plus, UserPlus, Target, Clock, Settings, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface GroupsPanelProps {
  projectId: number;
  projectName: string;
}

export function GroupsPanel({ projectId, projectName }: GroupsPanelProps) {
  return (
    <div className="h-full w-full p-6 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Управление группами</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Администрирование Telegram групп для проекта "{projectName}"
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Сообщество ВПрогулке СПб</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">@vprogulke_spb</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Участников:</span>
                <span className="font-medium">1,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Сообщений сегодня:</span>
                <span className="font-medium">147</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Новых участников:</span>
                <span className="font-medium">+23</span>
              </div>
            </div>
            
            <Button className="w-full mt-4" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Настройки группы
            </Button>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Канал новостей</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">@news_channel</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Подписчиков:</span>
                <span className="font-medium">3,421</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Постов сегодня:</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Просмотров:</span>
                <span className="font-medium">15.2K</span>
              </div>
            </div>
            
            <Button className="w-full mt-4" variant="outline">
              <Edit3 className="w-4 h-4 mr-2" />
              Редактировать канал
            </Button>
          </Card>
          
          <Card className="p-6 border-dashed border-2 border-gray-300 dark:border-gray-600">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="font-semibold mb-2">Добавить группу</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Подключите новую Telegram группу для управления
              </p>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Подключить группу
              </Button>
            </div>
          </Card>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Статистика групп</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium">Всего групп</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">Участников</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">4.7K</p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium">Сообщений</span>
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">15.6K</p>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium">Активных</span>
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">892</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}