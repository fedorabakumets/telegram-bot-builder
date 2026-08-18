/**
 * @fileoverview Подтверждение удаления бота в стиле карточки вкладки «Боты».
 * @module bot/DeleteBotConfirmDialog
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
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { IdBadge } from '@/components/editor/database/user-database/components/header/project-name-label';
import { useTokenUserCounts } from '@/components/editor/database/user-database/components/header/use-token-user-counts';
import { BotAvatar } from './card/BotAvatar';
import { listDeleteBotImpact } from './delete-bot-impact';
import type { BotToken } from '@shared/schema';

/** Пропсы диалога удаления */
interface DeleteBotConfirmDialogProps {
  /** Открыт ли диалог */
  open: boolean;
  /** Смена open */
  onOpenChange: (open: boolean) => void;
  /** Токен бота */
  token: BotToken;
  /** ID проекта */
  projectId: number;
  /** Процесс сейчас запущен */
  isRunning: boolean;
  /** Идёт удаление */
  pending?: boolean;
  /** Подтверждение */
  onConfirm: () => void;
}

/**
 * Окно «удалить бота»: аватар как на холсте и список того, что пропадёт.
 * @param props - Токен и колбэки
 * @returns JSX диалога
 */
export function DeleteBotConfirmDialog({
  open,
  onOpenChange,
  token,
  projectId,
  isRunning,
  pending = false,
  onConfirm,
}: DeleteBotConfirmDialogProps): React.JSX.Element {
  const title = token.botFirstName || token.name || `Бот ${token.id}`;
  const counts = useTokenUserCounts(open ? projectId : 0, open ? [token.id] : []);
  const items = listDeleteBotImpact({
    isRunning,
    userCount: counts.get(token.id),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] gap-0 overflow-hidden rounded-xl border-border/70 bg-card p-0 shadow-lg">
        <AlertDialogHeader className="space-y-0 p-0 text-left">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <BotAvatar
              tokenId={token.id}
              projectId={projectId}
              photoUrl={token.botPhotoUrl}
              botName={title}
              size={40}
              variant="service"
              className="shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="flex min-w-0 items-center gap-1.5 text-sm font-semibold leading-tight">
                <span className="truncate">Удалить {title}?</span>
                <IdBadge id={token.id} className="text-[10px] shrink-0" />
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {token.botUsername ? `@${token.botUsername}` : 'Это действие необратимо'}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <div className="border-t border-border/50 bg-muted/20 px-4 py-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
            Удалится
          </p>
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-[12px] text-foreground/90">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500/70" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <AlertDialogFooter className="border-t border-border/50 bg-muted/10 px-4 py-3 sm:space-x-2">
          <AlertDialogCancel className="h-8 rounded-md text-xs" disabled={pending}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive', size: 'sm' }) + ' h-8 text-xs'}
            disabled={pending}
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            {pending ? 'Удаление…' : 'Удалить бота'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
