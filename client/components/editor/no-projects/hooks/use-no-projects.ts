/**
 * @fileoverview Хук логики экрана "Нет проектов"
 * @module components/editor/no-projects/hooks/use-no-projects
 */

import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/queryClient';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
   * Открывает скрытый input[type=file] для выбора project.json.
   * После выбора файла отправляет POST /api/projects/import.
   */
  const handleImport = () => {
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      fileInputRef.current = input;

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
          const text = await file.text();
          const json = JSON.parse(text);
          await apiRequest('POST', '/api/projects/import', json);
          setLocation('/projects');
        } catch {
          // Ошибка импорта — молча игнорируем, пользователь увидит что ничего не изменилось
        } finally {
          setIsImporting(false);
          fileInputRef.current = null;
        }
      };
    }

    fileInputRef.current.click();
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
