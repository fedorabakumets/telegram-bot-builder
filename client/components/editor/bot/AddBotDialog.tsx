/**
 * @fileoverview Диалог добавления нового бота
 *
 * Компонент предоставляет интерфейс для подключения нового бота:
 * - Выбор проекта
 * - Ввод токена бота
 * - Инструкция по получению токена
 *
 * @module AddBotDialog
 */

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AddBotDialogHeader } from './AddBotDialogHeader';
import { AddBotProjectSelect } from './AddBotProjectSelect';
import { AddBotHelpBox } from './AddBotHelpBox';
import { AddBotTokenInput } from './AddBotTokenInput';
import { AddBotDialogActions } from './AddBotDialogActions';

interface AddBotDialogProps {
  showAddBot: boolean;
  setShowAddBot: (show: boolean) => void;
  projectForNewBot: number | null;
  setProjectForNewBot: (projectId: number | null) => void;
  projects: any[];
  newBotToken: string;
  setNewBotToken: (token: string) => void;
  isParsingBot: boolean;
  createBotMutation: any;
  handleAddBot: () => void;
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
  handleAddBot
}: AddBotDialogProps) {
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

          <AddBotHelpBox />

          <AddBotTokenInput
            newBotToken={newBotToken}
            setNewBotToken={setNewBotToken}
            isParsingBot={isParsingBot}
            createBotMutation={createBotMutation}
            projectForNewBot={projectForNewBot}
          />
        </div>

        <AddBotDialogActions
          isParsingBot={isParsingBot}
          createBotMutation={createBotMutation}
          newBotToken={newBotToken}
          projectForNewBot={projectForNewBot}
          handleAddBot={handleAddBot}
          onCancel={() => {
            setShowAddBot(false);
            setProjectForNewBot(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
