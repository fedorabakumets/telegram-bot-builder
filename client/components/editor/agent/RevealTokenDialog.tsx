/**
 * @fileoverview Диалог показа созданного токена агента (один раз)
 *
 * Показывает полный секрет токена с копированием и предупреждением,
 * а также готовый сниппет настройки MCP. При закрытии токен теряется.
 *
 * @module editor/agent/RevealTokenDialog
 */

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { McpConfigSnippet } from "./McpConfigSnippet";

/** Свойства диалога показа токена */
export interface RevealTokenDialogProps {
  /** Полный секрет токена (null — диалог закрыт) */
  token: string | null;
  /** Обработчик закрытия диалога */
  onClose: () => void;
}

/**
 * Диалог одноразового показа секрета токена.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function RevealTokenDialog({ token, onClose }: RevealTokenDialogProps) {
  const { toast } = useToast();

  /** Копирует токен в буфер обмена */
  const handleCopy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    toast({ title: "Скопировано", description: "Токен в буфере обмена" });
  };

  return (
    <Dialog open={!!token} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Токен создан</DialogTitle>
          <DialogDescription>
            Сохрани токен сейчас — больше он не отобразится.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <code className="flex-1 select-all break-all rounded-md bg-muted p-3 font-mono text-sm">
            {token}
          </code>
          <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Копировать">
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {token && <McpConfigSnippet token={token} />}

        <DialogFooter>
          <Button onClick={onClose}>Готово</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
