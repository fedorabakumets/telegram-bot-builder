/**
 * @fileoverview Диалог редактирования токена бота
 *
 * Компонент предоставляет интерфейс для редактирования:
 * - Имени токена
 * - Описания токена
 *
 * @module EditBotTokenDialog
 */

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { EditTokenDialogHeader } from './EditTokenDialogHeader';
import { TokenNameField } from './TokenNameField';
import { TokenDescriptionField } from './TokenDescriptionField';
import { EditTokenDialogActions } from './EditTokenDialogActions';

interface EditBotTokenDialogProps {
  editingToken: any | null;
  setEditingToken: (token: any | null) => void;
  editName: string;
  setEditName: (name: string) => void;
  updateTokenMutation: any;
  editDescription: string;
  setEditDescription: (desc: string) => void;
}

/**
 * Диалог редактирования токена бота
 */
export function EditBotTokenDialog({
  editingToken,
  setEditingToken,
  editName,
  setEditName,
  updateTokenMutation,
  editDescription,
  setEditDescription
}: EditBotTokenDialogProps) {
  const handleSave = () => {
    if (editingToken) {
      updateTokenMutation.mutate({
        tokenId: editingToken.id,
        data: {
          name: editName.trim() || editingToken.name,
          description: editDescription.trim() || null
        }
      });
    }
  };

  return (
    <Dialog open={!!editingToken} onOpenChange={() => setEditingToken(null)}>
      <DialogContent className="sm:max-w-md">
        <EditTokenDialogHeader />

        <div className="space-y-4 sm:space-y-5 py-2">
          <TokenNameField
            editName={editName}
            setEditName={setEditName}
            isPending={updateTokenMutation.isPending}
          />

          <TokenDescriptionField
            editDescription={editDescription}
            setEditDescription={setEditDescription}
            isPending={updateTokenMutation.isPending}
          />
        </div>

        <EditTokenDialogActions
          isPending={updateTokenMutation.isPending}
          hasName={editName.trim().length > 0}
          onCancel={() => setEditingToken(null)}
          onSave={handleSave}
        />
      </DialogContent>
    </Dialog>
  );
}
