/**
 * @fileoverview Состояние настроек запуска без сохранения унаследованного адреса API.
 */
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppConfig } from '@/hooks/use-app-config';
import { useToast } from '@/hooks/use-toast';
import { updateLaunchSettings, type BotLaunchSettingsProps, type LaunchMode } from './bot-launch-helpers';

/** Управляет черновиком, наследованием адреса и явным сохранением изменений пользователя. */
export function useBotLaunchSettings(props: BotLaunchSettingsProps) {
  const { tokenId, projectId, launchMode, webhookBaseUrl, webhookSecretToken, onPendingChange } = props;
  const [localMode, setLocalMode] = useState<LaunchMode>((launchMode as LaunchMode) ?? 'polling');
  const [localBaseUrl, setLocalBaseUrl] = useState(webhookBaseUrl ?? '');
  const [localSecret, setLocalSecret] = useState(webhookSecretToken ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: config } = useAppConfig();
  const inheritedBaseUrl = (config?.webhookBaseUrl ?? '').trim().replace(/\/+$/, '');
  const mutation = useMutation({
    mutationFn: ({ mode, url, secret }: { mode: string; url: string | null; secret: string | null }) =>
      updateLaunchSettings(projectId, tokenId, mode, url, secret),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      toast({ title: 'Перезапустите бота чтобы применить изменения' });
    },
  });

  /** Сбрасывает черновик после отмены, сохранения и выбора другого бота. */
  useEffect(() => {
    setLocalMode((launchMode as LaunchMode) ?? 'polling');
    setLocalBaseUrl(webhookBaseUrl ?? '');
    setLocalSecret(webhookSecretToken ?? '');
  }, [launchMode, webhookBaseUrl, webhookSecretToken, tokenId]);
  /** Отменяет отложенную запись при уходе с карточки или переключении бота. */
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, [tokenId]);

  /** Сохраняет исключительно явное изменение пользователя с задержкой для текстовых полей. */
  function save(mode: LaunchMode, url: string, secret: string, delayed: boolean) {
    if (timer.current) clearTimeout(timer.current);
    if (onPendingChange) return;
    const payload = { mode, url: url.trim() || null, secret: secret || null };
    if (delayed) timer.current = setTimeout(() => mutation.mutate(payload), 800);
    else mutation.mutate(payload);
  }
  /** Меняет режим и передаёт его общей панели сохранения. */
  function handleModeChange(mode: LaunchMode) {
    setLocalMode(mode);
    onPendingChange?.('LAUNCH_MODE', mode);
    save(mode, localBaseUrl, localSecret, false);
  }
  /** Меняет собственный адрес; пустое значение возвращает наследование API. */
  function handleBaseUrlChange(url: string) {
    setLocalBaseUrl(url);
    onPendingChange?.('WEBHOOK_BASE_URL', url);
    save(localMode, url, localSecret, true);
  }
  /** Сохраняет собственный секрет; пустое значение допускает автоматическую генерацию. */
  function handleSecretChange(secret: string) {
    setLocalSecret(secret);
    onPendingChange?.('WEBHOOK_SECRET_TOKEN', secret);
    save(localMode, localBaseUrl, secret, true);
  }
  return { localMode, localBaseUrl, localSecret, inheritedBaseUrl,
    effectiveBaseUrl: localBaseUrl.trim() || inheritedBaseUrl,
    handleModeChange, handleBaseUrlChange, handleSecretChange };
}
