/**
 * @fileoverview Диалог добавления нового бота
 *
 * Компонент предоставляет интерфейс для подключения бота:
 * - Выбор проекта
 * - Переключатель режима: "Выбрать существующий" / "Ввести новый токен"
 * - В режиме выбора — список токенов из других проектов
 * - В режиме ввода — поле ввода токена
 *
 * @module AddBotDialog
 */

import { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AddBotDialogHeader } from './AddBotDialogHeader';
import { AddBotProjectSelect } from './AddBotProjectSelect';
import { AddBotHelpBox } from './AddBotHelpBox';
import { AddBotTokenInput } from './AddBotTokenInput';
import { AddBotTokenSelect } from './AddBotTokenSelect';
import { AddBotDialogActions } from './AddBotDialogActions';
import type { BotToken } from '@shared/schema';

/**
 * Режим добавления токена
 */
type TokenMode = 'new' | 'existing';

/**
 * Свойства диалога добавления бота
 */
interface AddBotDialogProps {
  /** Показывать ли диалог */
  showAddBot: boolean;
  /** Управление видимостью диалога */
  setShowAddBot: (show: boolean) => void;
  /** ID выбранного проекта */
  projectForNewBot: number | null;
  /** Установить ID проекта */
  setProjectForNewBot: (projectId: number | null) => void;
  /** Список всех проектов */
  projects: any[];
  /** Токен нового бота */
  newBotToken: string;
  /** Обновить токен нового бота */
  setNewBotToken: (token: string) => void;
  /** Идёт ли парсинг информации о боте */
  isParsingBot: boolean;
  /** Мутация создания бота */
  createBotMutation: any;
  /** Обработчик добавления бота */
  handleAddBot: (selectedTokenId?: number | null) => void;
  /** Все токены из всех проектов (для выбора существующего) */
  allTokensFlat: (BotToken & { projectId: number })[];
}

/**
 * Диалог добавления нового бота
 */
export function AddBotDialog({
  showAddBot,
  setShowAddBot,
  projectForNewBot,
  setProjectForNewBot,
  projects,
  newBotToken,
  setNewBotToken,
  isParsingBot,
  createBotMutation,
  handleAddBot,
  allTokensFlat,
}: AddBotDialogProps) {
  /** Режим добавления токена */
  const [tokenMode, setTokenMode] = useState<TokenMode>('new');
  /** Выбранный существующий токен */
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

  /** Токены, не привязанные к выбранному проекту */
  const availableTokens = useMemo(() => {
    if (!projectForNewBot) return allTokensFlat;
    return allTokensFlat.filter(t => t.projectId !== projectForNewBot);
  }, [allTokensFlat, projectForNewBot]);

  const hasExistingTokens = availableTokens.length > 0;

  const handleClose = () => {
    setShowAddBot(false);
    setProjectForNewBot(null);
    setSelectedTokenId(null);
    setTokenMode('new');
  };

  const handleSubmit = () => {
    if (tokenMode === 'existing') {
      handleAddBot(selectedTokenId);
    } else {
      handleAddBot(null);
    }
  };

  return (
    <Dialog open={showAddBot} onOpenChange={setShowAddBot}>
      <DialogContent className="sm:max-w-md">
        <AddBotDialogHeader />

        <div className="space-y-4 sm:space-y-5 py-2">
          {!projectForNewBot && (
            <AddBotProjectSelect
              projects={projects}
              projectForNewBot={projectForNewBot}
              setProjectForNewBot={setProjectForNewBot}
            />
          )}

          {hasExistingTokens && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTokenMode('existing')}
                className={[
                  'flex-1 py-1.5 px-3 rounded-md text-sm font-medium border transition-colors',
                  tokenMode === 'existing'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-muted/40 text-foreground border-border hover:bg-muted/70',
                ].join(' ')}
              >
                Выбрать существующий
              </button>
              <button
                type="button"
                onClick={() => setTokenMode('new')}
                className={[
                  'flex-1 py-1.5 px-3 rounded-md text-sm font-medium border transition-colors',
                  tokenMode === 'new'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-muted/40 text-foreground border-border hover:bg-muted/70',
                ].join(' ')}
              >
                Ввести новый
              </button>
            </div>
          )}

          {tokenMode === 'existing' && hasExistingTokens ? (
            <AddBotTokenSelect
              tokens={availableTokens}
              selectedTokenId={selectedTokenId}
              onSelect={setSelectedTokenId}
            />
          ) : (
            <>
              <AddBotHelpBox />
              <AddBotTokenInput
                newBotToken={newBotToken}
                setNewBotToken={setNewBotToken}
                isParsingBot={isParsingBot}
                createBotMutation={createBotMutation}
                projectForNewBot={projectForNewBot}
              />
            </>
          )}
        </div>

        <AddBotDialogActions
          isParsingBot={isParsingBot}
          createBotMutation={createBotMutation}
          newBotToken={newBotToken}
          projectForNewBot={projectForNewBot}
          handleAddBot={handleSubmit}
          onCancel={handleClose}
          tokenMode={tokenMode}
          selectedTokenId={selectedTokenId}
        />
      </DialogContent>
    </Dialog>
  );
}
