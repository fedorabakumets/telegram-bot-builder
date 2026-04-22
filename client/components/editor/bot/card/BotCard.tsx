/**
 * @fileoverview Карточка бота
 *
 * Объединяет все части карточки бота:
 * - Заголовок с аватаркой и именем
 * - Визуальный разделитель
 * - Информация о боте (токен, даты)
 * - Сетка настроек
 *
 * Данные редактирования и мутации берёт из BotControlContext.
 *
 * @module BotCard
 */

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BotCardHeader } from './BotCardHeader';
import { BotCardInfo } from './BotCardInfo';
import { BotSettingsGrid } from './BotSettingsGrid';
import { useBotControl } from '../bot-control-context';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import type { BotProject, BotToken } from '@shared/schema';
import type { BotInfo } from '../profile/BotProfileEditor';

/**
 * Свойства карточки бота
 */
interface BotCardProps {
  /** Данные токена бота */
  token: BotToken;
  /** Проект бота */
  project: BotProject;
  /** Информация о боте из Telegram API */
  projectBotInfo: BotInfo | undefined;
  /** Запущен ли этот бот */
  isThisTokenRunning: boolean;
}

/**
 * Карточка бота
 */
export function BotCard({ token, project, projectBotInfo, isThisTokenRunning }: BotCardProps) {
  const {
    editingField,
    editValue,
    setEditValue,
    handleSaveEdit,
    handleCancelEdit,
    handleStartEdit,
    getStatusBadge,
    startBotMutation,
    stopBotMutation,
    deleteBotMutation,
    toggleDatabaseMutation,
    currentElapsedSeconds,
    allBotStatuses,
    setSelectedProject,
    setSelectedBotInfo,
    setIsProfileSheetOpen,
    queryClient,
  } = useBotControl();

  const { user, isTelegramUser } = useTelegramAuth();

  /** Имеет ли текущий пользователь права управления проектом (временно: все авторизованные; бэкенд проверит права) */
  const canManage = user && isTelegramUser(user)
    ? (user.id === project.ownerId || true)
    : false;

  return (
    <Card className="group/card overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card via-card to-card/95 hover:border-border/50">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <BotCardHeader
          token={token}
          projectBotInfo={projectBotInfo}
          editingField={editingField}
          editValue={editValue}
          setEditValue={setEditValue}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
          handleStartEdit={handleStartEdit}
          getStatusBadge={getStatusBadge}
          isBotRunning={isThisTokenRunning}
          startBotMutation={startBotMutation}
          stopBotMutation={stopBotMutation}
          deleteBotMutation={deleteBotMutation}
          onEditProfile={() => {
            setSelectedProject(project);
            setSelectedBotInfo(projectBotInfo ?? null);
            setIsProfileSheetOpen(true);
          }}
          isProfileLoading={!projectBotInfo}
          tokenId={token.id}
          projectId={project.id}
        />

        <Separator className="opacity-40" />

        <BotCardInfo
          token={token}
          project={project}
          editingField={editingField}
          editValue={editValue}
          setEditValue={setEditValue}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
          handleStartEdit={handleStartEdit}
          queryClient={queryClient}
        />

        <BotSettingsGrid
          projectId={project.id}
          tokenId={token.id}
          botName={token.name ?? `Бот ${token.id}`}
          userDatabaseEnabled={project.userDatabaseEnabled}
          isBotRunning={isThisTokenRunning}
          currentElapsedSeconds={currentElapsedSeconds}
          allBotStatuses={allBotStatuses}
          token={token}
          toggleDatabaseMutation={toggleDatabaseMutation}
          launchMode={token.launchMode ?? 'polling'}
          webhookBaseUrl={token.webhookBaseUrl ?? null}
          webhookSecretToken={token.webhookSecretToken ?? null}
          canManage={canManage}
        />
      </CardContent>
    </Card>
  );
}
