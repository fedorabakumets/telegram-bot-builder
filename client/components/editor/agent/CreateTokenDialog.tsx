/**
 * @fileoverview Форма создания токена MCP в оформлении вкладки агента.
 * @module editor/agent/CreateTokenDialog
 */
import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateAgentToken } from "./use-agent-tokens";
import "./agent-page.css";

/** Свойства диалога создания токена. */
export interface CreateTokenDialogProps {
  /** Признак открытия диалога. */
  open: boolean;
  /** Обработчик изменения состояния открытия. */
  onOpenChange: (open: boolean) => void;
  /** Обработчик одноразового показа созданного секрета. */
  onCreated: (token: string) => void;
}

/**
 * Создаёт токен для внешнего клиента и показывает ошибки рядом с формой.
 * @param props - Состояние диалога и обработчики результата.
 * @returns Диалог с настройками имени, срока и описанием доступа.
 */
export function CreateTokenDialog({ open, onOpenChange, onCreated }: CreateTokenDialogProps) {
  const createToken = useCreateAgentToken();
  const id = useId();
  const labelRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [expiry, setExpiry] = useState("0");
  const [error, setError] = useState("");
  const [labelError, setLabelError] = useState(false);

  /**
   * Закрывает диалог и сбрасывает черновик, если запрос не выполняется.
   * @param nextOpen - Новое состояние открытия.
   */
  const handleOpenChange = (nextOpen: boolean) => {
    if (createToken.isPending) return;
    if (!nextOpen) {
      setLabel("");
      setExpiry("0");
      setError("");
      setLabelError(false);
    }
    onOpenChange(nextOpen);
  };

  /**
   * Проверяет название и создаёт токен с текущими правами чтения и записи.
   * @param event - Событие отправки формы.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createToken.isPending) return;
    if (!label.trim()) {
      setLabelError(true);
      setError("Укажите название, чтобы отличать этот токен от других.");
      labelRef.current?.focus();
      return;
    }
    setError("");
    setLabelError(false);
    const expiresInDays = Number.parseInt(expiry, 10);
    try {
      const result = await createToken.mutateAsync({
        label: label.trim(),
        scopes: "read,write",
        ...(expiresInDays > 0 ? { expiresInDays } : {}),
      });
      setLabel("");
      setExpiry("0");
      onOpenChange(false);
      onCreated(result.token);
    } catch {
      setError("Не удалось создать токен. Проверьте соединение и попробуйте ещё раз.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="agent-dialog agent-surface gap-6 rounded-2xl p-6 sm:p-6">
        <DialogHeader className="space-y-2 pr-6 text-left">
          <DialogTitle className="text-2xl font-semibold tracking-normal">Создать токен</DialogTitle>
          <DialogDescription className="text-pretty text-sm">Подключите свой ИИ клиент к проектам через MCP.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={handleSubmit} className="space-y-4" aria-busy={createToken.isPending}>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor={`${id}-label`} className={`text-sm font-medium ${labelError ? 'text-destructive' : ''}`}>Название клиента</Label>
              <span className={`text-xs ${labelError ? 'text-destructive' : 'text-muted-foreground'}`}>Обязательно</span>
            </div>
            <Input ref={labelRef} id={`${id}-label`} placeholder="Например, Cursor на ноутбуке" value={label}
              onChange={(event) => { setLabel(event.target.value); if (labelError && event.target.value.trim()) { setLabelError(false); setError(""); } }}
              required disabled={createToken.isPending} aria-invalid={labelError}
              aria-describedby={labelError ? `${id}-error` : `${id}-hint`} className="agent-field h-12 rounded-lg px-3 text-base" />
            {labelError
              ? <p id={`${id}-error`} role="alert" className="text-pretty text-xs text-destructive">{error}</p>
              : <p id={`${id}-hint`} className="text-pretty text-xs text-muted-foreground">Название видно только вам. Для каждого клиента используйте отдельный токен.</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-expiry`} className="text-sm font-medium">Срок действия</Label>
            <Select value={expiry} onValueChange={setExpiry} disabled={createToken.isPending}>
              <SelectTrigger id={`${id}-expiry`} aria-describedby={`${id}-expiry-hint`} className="agent-field h-12 rounded-lg px-3 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="agent-dialog agent-surface rounded-lg">
                <SelectItem value="0">Без ограничения</SelectItem>
                <SelectItem value="30">30 дней</SelectItem>
                <SelectItem value="90">90 дней</SelectItem>
              </SelectContent>
            </Select>
            <p id={`${id}-expiry-hint`} className="text-pretty text-xs text-muted-foreground">{expiry === "0" ? "Токен действует, пока вы не отзовёте доступ." : "По окончании срока клиенту понадобится новый токен."}</p>
          </div>
          <div className="agent-inset space-y-1 rounded-xl p-4">
            <p className="text-sm font-semibold">Доступ к проектам: чтение и запись</p>
            <p className="text-pretty text-xs text-muted-foreground">Клиент сможет просматривать и изменять ваши проекты. Доступ можно отозвать на вкладке «Агент».</p>
          </div>
          {error && !labelError && <p role="alert" className="text-pretty text-sm text-destructive">{error}</p>}
          <p className="text-pretty text-xs text-muted-foreground">Скопируйте токен после создания. Полностью он будет показан только один раз.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={createToken.isPending} onClick={() => handleOpenChange(false)} className="agent-action px-3 font-semibold">Отмена</Button>
            <Button type="submit" disabled={createToken.isPending} className="agent-action px-3 text-base font-semibold">
              {createToken.isPending ? "Создание токена…" : "Создать токен"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
