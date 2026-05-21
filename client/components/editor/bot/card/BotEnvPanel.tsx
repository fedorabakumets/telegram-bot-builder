/**
 * @fileoverview Панель переменных окружения бота (режим «Переменные»)
 * Отображает системные и пользовательские переменные с dirty state
 * @module components/editor/bot/card/BotEnvPanel
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, FileCode } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { BotEnvRow } from './BotEnvRow';
import { BotEnvAddRow } from './BotEnvAddRow';
import { BotEnvRawEditor } from './BotEnvRawEditor';
import { useEnvVariables } from './use-env-variables';
import type { useEnvPendingChanges } from './use-env-pending-changes';
import type { BotToken } from '@shared/schema';

/** Свойства панели переменных окружения */
interface BotEnvPanelProps {
  /** ID проекта */
  projectId: number;
  /** ID токена */
  tokenId: number;
  /** Объект токена для системных переменных */
  token: BotToken;
  /** ID администраторов из проекта */
  adminIds: string;
  /** Общий pending state из BotCard */
  pending: ReturnType<typeof useEnvPendingChanges>;
}

/** Элемент системной переменной */
interface SystemVar {
  /** Имя переменной */
  key: string;
  /** Значение */
  value: string;
  /** Флаг секретности */
  isSecret: boolean;
  /** Значение подтянуто из серверного окружения (показывать как ссылку) */
  isServerRef: boolean;
}

/** Переменные, которые нельзя редактировать */
const READ_ONLY_KEYS = new Set(['PROJECT_ID', 'TOKEN_ID']);

/**
 * Формирует массив системных переменных из данных токена
 * @param token - Объект токена
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param adminIds - ID администраторов
 * @param customItems - Кастомные переменные для переопределения дефолтов
 * @param serverEnvKeys - Ключи доступных серверных переменных
 * @returns Массив системных переменных
 */
function buildSystemVars(token: BotToken, projectId: number, tokenId: number,
  adminIds: string, customItems: Array<{ key: string; value: string }>,
  serverEnvKeys: Set<string>): SystemVar[] {
  /** Маппинг кастомных переменных для переопределения дефолтов */
  const customMap = new Map(customItems.map(v => [v.key, v.value]));

  /** Резолвит значение и определяет источник */
  function resolve(key: string, defaultValue: string): { value: string; isServerRef: boolean } {
    if (customMap.has(key)) return { value: customMap.get(key)!, isServerRef: false };
    if (serverEnvKeys.has(key)) return { value: `\${{${key}}}`, isServerRef: true };
    return { value: defaultValue, isServerRef: false };
  }

  const apiBaseUrl = resolve('API_BASE_URL', 'http://localhost:5000');
  const apiPort = resolve('API_PORT', '5000');
  const apiUseSsl = resolve('API_USE_SSL', 'auto');
  const apiTimeout = resolve('API_TIMEOUT', '10');
  const disableAsyncLog = resolve('DISABLE_ASYNC_LOG', 'true');
  const redisUrl = resolve('REDIS_URL', 'redis://localhost:6379');
  const databaseUrl = resolve('DATABASE_URL', '');
  const maxUpdateAge = resolve('MAX_UPDATE_AGE_SECONDS', '300');
  const webhookPort = resolve('WEBHOOK_PORT', '8080');

  return [
    { key: 'BOT_TOKEN', value: token.token, isSecret: true, isServerRef: false },
    { key: 'ADMIN_IDS', value: adminIds || '123456789', isSecret: true, isServerRef: false },
    { key: 'PROJECT_ID', value: String(projectId), isSecret: false, isServerRef: false },
    { key: 'TOKEN_ID', value: String(tokenId), isSecret: false, isServerRef: false },
    { key: 'API_BASE_URL', value: apiBaseUrl.value, isSecret: false, isServerRef: apiBaseUrl.isServerRef },
    { key: 'API_PORT', value: apiPort.value, isSecret: false, isServerRef: apiPort.isServerRef },
    { key: 'API_USE_SSL', value: apiUseSsl.value, isSecret: false, isServerRef: apiUseSsl.isServerRef },
    { key: 'API_TIMEOUT', value: apiTimeout.value, isSecret: false, isServerRef: apiTimeout.isServerRef },
    { key: 'LOG_LEVEL', value: token.logLevel || 'WARNING', isSecret: false, isServerRef: false },
    { key: 'DISABLE_ASYNC_LOG', value: disableAsyncLog.value, isSecret: false, isServerRef: disableAsyncLog.isServerRef },
    { key: 'REDIS_URL', value: redisUrl.value, isSecret: true, isServerRef: redisUrl.isServerRef },
    { key: 'PROTECT_CONTENT', value: token.protectContent ? 'true' : 'false', isSecret: false, isServerRef: false },
    { key: 'SAVE_INCOMING_MEDIA', value: token.saveIncomingMedia ? 'true' : 'false', isSecret: false, isServerRef: false },
    { key: 'DATABASE_URL', value: databaseUrl.value, isSecret: true, isServerRef: databaseUrl.isServerRef },
    { key: 'MAX_UPDATE_AGE_SECONDS', value: maxUpdateAge.value, isSecret: false, isServerRef: maxUpdateAge.isServerRef },
    { key: 'WEBHOOK_PORT', value: webhookPort.value, isSecret: false, isServerRef: webhookPort.isServerRef },
  ];
}

/**
 * Панель переменных окружения бота с dirty state
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvPanel({ projectId, tokenId, token, adminIds, pending }: BotEnvPanelProps) {
  const { items, revealValue } = useEnvVariables(projectId, tokenId);

  /** Серверные переменные окружения (только ключи — значения не передаются) */
  const { data: serverEnvData } = useQuery<{ items: Array<{ key: string }> }>({
    queryKey: ['/api/server/env-keys'],
    queryFn: () => apiRequest('GET', '/api/server/env-keys'),
    staleTime: 5 * 60 * 1000,
  });

  /** Множество ключей серверных переменных (значения не передаются) */
  const serverEnvKeys = useMemo(() =>
    new Set((serverEnvData?.items ?? []).map(v => v.key)),
    [serverEnvData],
  );

  const [showAdd, setShowAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const systemVars = useMemo(
    () => buildSystemVars(token, projectId, tokenId, adminIds, items, serverEnvKeys),
    [token, projectId, tokenId, adminIds, items, serverEnvKeys],
  );

  /** Ключи системных переменных для фильтрации дублей */
  const systemKeys = useMemo(() => new Set(systemVars.map(v => v.key)), [systemVars]);

  const filteredSystem = useMemo(() =>
    systemVars.filter(v => v.key.includes(search.toUpperCase())), [systemVars, search]);

  /** Кастомные переменные без дублей с системными */
  const filteredCustom = useMemo(() =>
    items.filter(v => v.key.includes(search.toUpperCase()) && !systemKeys.has(v.key)),
    [items, search, systemKeys]);

  const totalCount = systemVars.length + filteredCustom.length;

  /** Обработчик pending изменения из BotEnvRow */
  function handlePendingChange(key: string, value: string, type: 'system' | 'custom', id?: number) {
    pending.addChange({ action: 'update', type, id, key, value });
  }

  /** Обработчик создания переменной (в pending) */
  function handleCreate(key: string, value: string, isSecret: number) {
    pending.addChange({ action: 'create', type: 'custom', key, value, isSecret });
    setShowAdd(false);
  }

  /** Обработчик удаления переменной (в pending) */
  function handleDelete(id: number) {
    const item = items.find(v => v.id === id);
    pending.addChange({ action: 'delete', type: 'custom', id, key: item?.key ?? '', value: '' });
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Заголовок */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{totalCount} перем.</span>
        <div className="flex items-center gap-0.5 ml-auto">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowRaw(!showRaw)} title="Raw-редактор">
            <FileCode className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSearch(!showSearch)} title="Поиск">
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">Новая</span>
          </Button>
        </div>
      </div>

      {showSearch && (
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Фильтр по имени..." className="h-7 text-xs" autoFocus />
      )}

      {showRaw ? (
        <BotEnvRawEditor
          systemVars={systemVars}
          customItems={filteredCustom.map(v => ({ id: v.id, key: v.key, value: v.value, isSecret: v.isSecret }))}
          onSystemUpdate={(key, value) => pending.addChange({ action: 'update', type: 'system', key, value })}
          onCreate={(key, value, isSecret) => handleCreate(key, value, isSecret)}
          onUpdate={(id, val) => pending.addChange({ action: 'update', type: 'custom', id, key: '', value: val })}
          onDelete={handleDelete}
          onClose={() => setShowRaw(false)}
        />
      ) : (
        <>
          {showAdd && (
            <BotEnvAddRow onSave={handleCreate} onCancel={() => setShowAdd(false)} />
          )}

          {/* Системные переменные */}
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-2">Системные</span>
            {filteredSystem.map(v => (
              <BotEnvRow
                key={v.key} id={null} envKey={v.key} value={v.value}
                isSecret={v.isSecret} isSystem={true}
                isServerRef={v.isServerRef}
                onPendingChange={!READ_ONLY_KEYS.has(v.key) ? handlePendingChange : undefined}
                pendingValue={pending.getPendingValue(v.key)}
              />
            ))}
          </div>

          {/* Пользовательские переменные */}
          {(filteredCustom.length > 0 || !showSearch) && (
            <>
              <Separator className="opacity-30" />
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-2">Пользовательские</span>
                {filteredCustom.map(v => (
                  <BotEnvRow
                    key={v.id} id={v.id} envKey={v.key} value={v.value}
                    isSecret={!!v.isSecret} isSystem={false}
                    onReveal={revealValue}
                    onPendingChange={handlePendingChange}
                    onDelete={handleDelete}
                    pendingValue={pending.getPendingValue(v.key)}
                  />
                ))}
                {filteredCustom.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 px-2 py-2">Нет пользовательских переменных</p>
                )}
              </div>
            </>
          )}

        </>
      )}
    </div>
  );
}
