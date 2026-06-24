/**
 * @fileoverview Диалог создания персонального токена агента (MCP)
 *
 * Форма: название, права (read / read,write), срок действия. После успеха
 * передаёт полный секрет токена наверх для одноразового показа.
 *
 * @module editor/agent/CreateTokenDialog
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateAgentToken } from "./use-agent-tokens";
import type { CreateAgentTokenBody } from "./agent-token-types";

/** Свойства диалога создания токена */
export interface CreateTokenDialogProps {
  /** Признак открытия диалога */
  open: boolean;
  /** Обработчик изменения состояния открытия */
  onOpenChange: (open: boolean) => void;
  /** Колбэк с полным секретом созданного токена */
  onCreated: (token: string) => void;
}

/**
 * Диалог создания токена агента.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function CreateTokenDialog({ open, onOpenChange, onCreated }: CreateTokenDialogProps) {
  const { toast } = useToast();
  const createToken = useCreateAgentToken();
  const [label, setLabel] = useState("");
  const [scopes, setScopes] = useState<CreateAgentTokenBody["scopes"]>("read,write");
  const [expiry, setExpiry] = useState("0");

  /** Отправляет форму создания токена */
  const handleSubmit = async () => {
    if (!label.trim()) {
      toast({ title: "Укажи название", variant: "destructive" });
      return;
    }
    const expiresInDays = parseInt(expiry);
    try {
      const res = await createToken.mutateAsync({
        label: label.trim(),
        scopes,
        ...(expiresInDays > 0 ? { expiresInDays } : {}),
      });
      onOpenChange(false);
      setLabel("");
      setScopes("read,write");
      setExpiry("0");
      onCreated(res.token);
    } catch {
      toast({ title: "Не удалось создать токен", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать токен</DialogTitle>
          <DialogDescription>Токен для подключения ИИ-агента к твоим проектам.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="agent-token-label">Название</Label>
            <Input
              id="agent-token-label"
              placeholder="Например, Cursor на ноуте"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Права</Label>
            <Select value={scopes} onValueChange={(v) => setScopes(v as CreateAgentTokenBody["scopes"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read,write">Чтение и запись</SelectItem>
                <SelectItem value="read">Только чтение</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Срок действия</Label>
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Без срока</SelectItem>
                <SelectItem value="30">30 дней</SelectItem>
                <SelectItem value="90">90 дней</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={createToken.isPending}>
            {createToken.isPending ? "Создаём…" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
