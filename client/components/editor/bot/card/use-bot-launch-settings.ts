/**
 * @fileoverview Состояние настроек запуска без сохранения унаследованного адреса API.
 */
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppConfig } from '@/hooks/use-app-config';
import { useToast } from '@/hooks/use-toast';
import { updateLaunchSettings, type BotLaunchSettingsProps, type LaunchModeChoice, type LaunchSettingsPatch } from './bot-launch-helpers';

/** Управляет черновиком, наследованием адреса и явным сохранением изменений пользователя. */
export function useBotLaunchSettings(props: BotLaunchSettingsProps) {
  const { tokenId, projectId, launchMode, webhookBaseUrl, webhookSecretToken, onPendingChange } = props;
  const [localMode, setLocalMode] = useState<LaunchModeChoice>((launchMode as LaunchModeChoice) ?? 'polling');
  const [localBaseUrl, setLocalBaseUrl] = useState(webhookBaseUrl ?? '');
  const [localSecret, setLocalSecret] = useState(webhookSecretToken ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queued = useRef<LaunchSettingsPatch>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: config } = useAppConfig();
  const serverBaseUrl = (config?.webhookBaseUrl ?? '').trim().replace(/\/+$/, '');
  const inheritedBaseUrl = props.projectWebhookBaseUrl?.trim().replace(/\/+$/, '') || serverBaseUrl;
  const mutation = useMutation({
    mutationFn: (changes: LaunchSettingsPatch) => updateLaunchSettings(projectId, tokenId, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/launch-default`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/setting-defaults`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens/${tokenId}/runtime-settings`] });
      toast({ title: 'Перезапустите бота чтобы применить изменения' });
    },
  });

  /** Сбрасывает черновик после отмены, сохранения и выбора другого бота. */
  useEffect(() => {
    setLocalMode((launchMode as LaunchModeChoice) ?? 'polling');
    setLocalBaseUrl(webhookBaseUrl ?? '');
    setLocalSecret(webhookSecretToken ?? '');
  }, [launchMode, webhookBaseUrl, webhookSecretToken, tokenId]);
  /** Отменяет отложенную запись при уходе с карточки или переключении бота. */
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    queued.current = {};
  }, [projectId, tokenId]);

  /** Сохраняет исключительно явное изменение пользователя с задержкой для текстовых полей. */
  function save(changes: LaunchSettingsPatch, delayed: boolean) {
    if (onPendingChange) return;
    if (timer.current) clearTimeout(timer.current);
    queued.current = { ...queued.current, ...changes };
    /** Передаёт только явно изменённые поля, включая другие отложенные поля. */
    const flush = () => {
      mutation.mutate(queued.current);
      queued.current = {};
    };
    if (delayed) timer.current = setTimeout(flush, 800);
    else flush();
  }
  /** Меняет режим и передаёт его общей панели сохранения. */
  function handleModeChange(mode: LaunchModeChoice) {
    setLocalMode(mode);
    onPendingChange?.('LAUNCH_MODE', mode);
    save({ launchMode: mode }, false);
  }
  /** Меняет источник или собственный адрес; пустое значение использует адрес сервера. */
  function handleBaseUrlChange(url: string) {
    setLocalBaseUrl(url);
    onPendingChange?.('WEBHOOK_BASE_URL', url);
    save({ webhookBaseUrl: url.trim() || null }, true);
  }
  /** Сохраняет собственный секрет; пустое значение допускает автоматическую генерацию. */
  function handleSecretChange(secret: string) {
    setLocalSecret(secret);
    onPendingChange?.('WEBHOOK_SECRET_TOKEN', secret);
    save({ webhookSecretToken: secret || null }, true);
  }
  return { localMode, localBaseUrl, localSecret, inheritedBaseUrl, serverBaseUrl,
    effectiveBaseUrl: localBaseUrl === 'inherit' ? inheritedBaseUrl : localBaseUrl.trim() || serverBaseUrl,
    handleModeChange, handleBaseUrlChange, handleSecretChange };
}
