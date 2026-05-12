/**
 * @fileoverview Главный компонент вкладки "Диалоги"
 * @description Двухколоночный layout в стиле мессенджера: список слева, диалог справа.
 * На мобайле — переключение между списком и открытым диалогом.
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserBotData } from '@shared/schema';
import { DialogPanel } from '../../dialog/dialog-panel';
import { DialogList } from './dialog-list';
import { useLiveInvalidate } from '../hooks/use-live-invalidate';
import { useProjectTokens } from '@/hooks/use-project-tokens';

/**
 * Пропсы компонента DialogsTabContent
 */
interface DialogsTabContentProps {
  /** ID проекта */
  projectId: number;
  /** ID выбранного токена бота */
  selectedTokenId?: number | null;
  /** Колбэк для обновления выбранного токена снаружи */
  onSelectToken?: (tokenId: number | null) => void;
}

/**
 * Заглушка для правой колонки когда диалог не выбран
 * @returns JSX элемент заглушки
 */
function NoDialogSelected(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
      <MessageSquare className="h-12 w-12 opacity-20" />
      <p className="text-sm">Выберите диалог</p>
    </div>
  );
}

/**
 * Главный layout вкладки "Диалоги"
 * @param props - Пропсы компонента
 * @returns JSX элемент вкладки диалогов
 */
export function DialogsTabContent({
  projectId,
  selectedTokenId: selectedTokenIdProp,
  onSelectToken,
}: DialogsTabContentProps): React.JSX.Element {
  const [selectedUser, setSelectedUser] = useState<UserBotData | null>(null);

  // Автоматически выбираем токен по умолчанию если снаружи не передан
  const projectTokensInfo = useProjectTokens([projectId]);
  const projectTokens = projectTokensInfo[0]?.tokens ?? [];
  const [internalTokenId, setInternalTokenId] = useState<number | null>(selectedTokenIdProp ?? null);
  const resolvedTokenId = selectedTokenIdProp ?? internalTokenId;

  useEffect(() => {
    if (resolvedTokenId !== null || projectTokens.length === 0) return;
    const defaultToken = projectTokens.find((t) => t.isDefault === 1) ?? projectTokens[0];
    if (!defaultToken) return;
    setInternalTokenId(defaultToken.id);
    onSelectToken?.(defaultToken.id);
  }, [projectTokens, resolvedTokenId, onSelectToken]);

  // Подписываемся на WS-события: обновляет кэш infinite-users (lastMessageText, порядок)
  useLiveInvalidate({ projectId, selectedTokenId: resolvedTokenId });

  /** Сброс выбранного пользователя */
  const handleClose = () => setSelectedUser(null);

  /** Выбор пользователя из списка или из DialogPanel */
  const handleSelectUser = (user: UserBotData) => setSelectedUser(user);

  return (
    <>
      {/* Desktop: двухколоночный layout */}
      <div className="hidden md:flex h-full min-h-0">
        {/* Левая колонка — список диалогов */}
        <div className="w-80 flex-shrink-0 border-r border-border flex flex-col min-h-0">
          <DialogList
            projectId={projectId}
            selectedTokenId={resolvedTokenId}
            selectedUserId={selectedUser ? String(selectedUser.userId) : null}
            onSelectUser={handleSelectUser}
          />
        </div>

        {/* Правая колонка — открытый диалог или заглушка */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {selectedUser ? (
            <DialogPanel
              projectId={projectId}
              selectedTokenId={resolvedTokenId}
              user={selectedUser}
              onClose={handleClose}
              onSelectUser={handleSelectUser}
            />
          ) : (
            <NoDialogSelected />
          )}
        </div>
      </div>

      {/* Mobile: переключение между списком и диалогом */}
      <div className="flex md:hidden flex-col h-full min-h-0">
        {selectedUser ? (
          <div className="flex flex-col h-full min-h-0">
            {/* Кнопка "Назад" */}
            <div className="flex-shrink-0 px-2 py-1 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="gap-1 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <DialogPanel
                projectId={projectId}
                selectedTokenId={resolvedTokenId}
                user={selectedUser}
                onClose={handleClose}
                onSelectUser={handleSelectUser}
              />
            </div>
          </div>
        ) : (
          <DialogList
            projectId={projectId}
            selectedTokenId={resolvedTokenId}
            selectedUserId={null}
            onSelectUser={handleSelectUser}
          />
        )}
      </div>
    </>
  );
}
