/**
 * @fileoverview Карточка бота
 *
 * Объединяет все части карточки бота:
 * - Заголовок с аватаркой, именем и кнопкой сворачивания
 * - Визуальный разделитель
 * - Информация о боте (токен, даты)
 * - Сетка настроек
 *
 * Поддерживает сворачивание через проп defaultCollapsed и колбэк onCollapseChange.
 *
 * @module BotCard
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BotCardHeader } from './BotCardHeader';
import { BotCardInfo } from './BotCardInfo';
import { BotSettingsGrid } from './BotSettingsGrid';
import { useBotControl } from '../bot-control-context';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import type { BotProject, BotToken } from '@shared/schema';
import type { BotInfo } from '../profile/BotProfileEditor';

/** Свойства карточки бота */
interface BotCardProps {
  /** Данные токена бота */
  token: BotToken;
  /** Проект бота */
  project: BotProject;
  /** Информация о боте из Telegram API */
  projectBotInfo: BotInfo | undefined;
  /** Запущен ли этот бот */
  isThisTokenRunning: boolean;
  /** Свёрнута ли карточка по умолчанию */
  defaultCollapsed?: boolean;
  /** Колбэк при изменении состояния сворачивания */
  onCollapseChange?: (collapsed: boolean) => void;
}

/**
 * Карточка бота
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotCard({
  token, project, projectBotInfo, isThisTokenRunning,
  defaultCollapsed = false, onCollapseChange,
}: BotCardProps) {
  const {
    editingField, editValue, setEditValue, handleSaveEdit, handleCancelEdit,
    handleStartEdit, getStatusBadge, startBotMutation, stopBotMutation,
    deleteBotMutation, toggleDatabaseMutation, currentElapsedSeconds,
    allBotStatuses, setSelectedProject, setSelectedBotInfo,
    setIsProfileSheetOpen, queryClient,
  } = useBotControl();

  const { user, isTelegramUser } = useTelegramAuth();

  /** Свёрнута ли карточка */
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);

  // Синхронизируем с внешним состоянием при его изменении (кнопка "Свернуть все")
  useEffect(() => {
    setIsCollapsed(defaultCollapsed);
  }, [defaultCollapsed]);

  /** Имеет ли текущий пользователь права управления проектом */
  const canManage = user && isTelegramUser(user) ? (user.id === project.ownerId || true) : false;

  /**
   * Переключить состояние сворачивания
   */
  function handleToggleCollapse() {
    const next = !isCollapsed;
    setIsCollapsed(next);
    onCollapseChange?.(next);
  }

  return (
    <Card className="group/card overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card via-card to-card/95 hover:border-border/50">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <BotCardHeader
          token={token} projectBotInfo={projectBotInfo}
          editingField={editingField} editValue={editValue}
          setEditValue={setEditValue} handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit} handleStartEdit={handleStartEdit}
          getStatusBadge={getStatusBadge} isBotRunning={isThisTokenRunning}
          startBotMutation={startBotMutation} stopBotMutation={stopBotMutation}
          deleteBotMutation={deleteBotMutation}
          onEditProfile={() => {
            setSelectedProject(project);
            setSelectedBotInfo(projectBotInfo ?? null);
            setIsProfileSheetOpen(true);
          }}
          isProfileLoading={!projectBotInfo}
          tokenId={token.id} projectId={project.id}
          isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse}
          showTimer={isThisTokenRunning}
          currentElapsedSeconds={currentElapsedSeconds}
        />

        <div className={`transition-all duration-200 overflow-hidden ${isCollapsed ? 'hidden' : ''}`}>
          <Separator className="opacity-40 mb-3" />
          <BotCardInfo
            token={token} project={project}
            editingField={editingField} editValue={editValue}
            setEditValue={setEditValue} handleSaveEdit={handleSaveEdit}
            handleCancelEdit={handleCancelEdit} handleStartEdit={handleStartEdit}
            queryClient={queryClient}
          />
          <BotSettingsGrid
            projectId={project.id} tokenId={token.id}
            botName={token.name ?? `Бот ${token.id}`}
            userDatabaseEnabled={project.userDatabaseEnabled}
            isBotRunning={isThisTokenRunning}
            currentElapsedSeconds={currentElapsedSeconds}
            allBotStatuses={allBotStatuses} token={token}
            toggleDatabaseMutation={toggleDatabaseMutation}
            launchMode={token.launchMode ?? 'polling'}
            webhookBaseUrl={token.webhookBaseUrl ?? null}
            webhookSecretToken={token.webhookSecretToken ?? null}
            canManage={canManage}
          />
        </div>
      </CardContent>
    </Card>
  );
}
