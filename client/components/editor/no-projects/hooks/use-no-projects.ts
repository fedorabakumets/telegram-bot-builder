/**
 * @fileoverview Хук логики экрана "Нет проектов"
 * @module components/editor/no-projects/hooks/use-no-projects
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { isGuest } from '@/types/telegram-user';

/**
 * Результат хука экрана без проектов
 */
export interface UseNoProjectsResult {
  /** Открыт ли диалог создания проекта */
  isCreateOpen: boolean;
  /** Устанавливает состояние диалога создания */
  setIsCreateOpen: (open: boolean) => void;
  /** Открывает диалог создания проекта */
  handleCreateProject: () => void;
  /** Открывает выбор файла для импорта project.json */
  handleImport: () => void;
  /** Переходит на страницу шаблонов */
  handleTemplates: () => void;
  /** Выходит из аккаунта и редиректит на главную */
  handleLogout: () => void;
  /** Идёт ли процесс импорта */
  isImporting: boolean;
}

/**
 * Хук логики экрана "Нет проектов".
 * Управляет созданием, импортом, навигацией и выходом.
 *
 * @returns Объект с состоянием и обработчиками действий
 */
export function useNoProjects(): UseNoProjectsResult {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useTelegramAuth();
  const telegramId = user && !isGuest(user) ? (user as any).id : null;

  /** Открывает диалог создания проекта */
  const handleCreateProject = () => setIsCreateOpen(true);

  /** Переходит на страницу шаблонов */
  const handleTemplates = () => setLocation('/templates');

  /**
   * Выход из аккаунта: очищает localStorage, диспатчит событие, редиректит на /
   */
  const handleLogout = () => {
    localStorage.removeItem('telegramUser');
    window.dispatchEvent(new CustomEvent('telegram-auth-change', { detail: { user: null } }));
    setLocation('/');
  };

  /**
   * Открывает input[type=file] для выбора project.json.
   * Отправляет POST /api/bot/projects/import?telegram_id=..., редиректит в редактор.
   */
  const handleImport = () => {
    if (!telegramId) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const result = await apiRequest('POST', `/api/bot/projects/import?telegram_id=${telegramId}`, json) as { id: number };
        await queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
        setLocation(`/editor/${result.id}`);
      } catch (e) {
        console.error('Ошибка импорта проекта:', e);
      } finally {
        setIsImporting(false);
      }
    };

    input.click();
  };

  return {
    isCreateOpen,
    setIsCreateOpen,
    handleCreateProject,
    handleImport,
    handleTemplates,
    handleLogout,
    isImporting,
  };
}
