/**
 * @fileoverview Диалог подтверждения отзыва токена агента (MCP)
 *
 * @module editor/agent/RevokeTokenAlert
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRevokeAgentToken } from "./use-agent-tokens";
import type { AgentTokenDto } from "./agent-token-types";

/** Свойства диалога отзыва токена */
export interface RevokeTokenAlertProps {
  /** Токен для отзыва (null — диалог закрыт) */
  token: AgentTokenDto | null;
  /** Обработчик закрытия диалога */
  onClose: () => void;
}

/**
 * Диалог подтверждения отзыва токена.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function RevokeTokenAlert({ token, onClose }: RevokeTokenAlertProps) {
  const { toast } = useToast();
  const revoke = useRevokeAgentToken();

  /** Подтверждает отзыв токена */
  const handleConfirm = async () => {
    if (!token) return;
    try {
      await revoke.mutateAsync(token.id);
      toast({ title: "Токен отозван", description: `«${token.label}» больше не работает` });
    } catch {
      toast({ title: "Не удалось отозвать токен", variant: "destructive" });
    } finally {
      onClose();
    }
  };

  return (
    <AlertDialog open={!!token} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Отозвать токен?</AlertDialogTitle>
          <AlertDialogDescription>
            Токен «{token?.label}» мгновенно перестанет работать. Действие необратимо.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={revoke.isPending}>
            Отозвать
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
