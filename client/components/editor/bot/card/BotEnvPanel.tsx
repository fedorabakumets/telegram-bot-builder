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
import { BotEnvStagingBar } from './BotEnvStagingBar';
import { useEnvVariables } from './use-env-variables';
import { useEnvPendingChanges } from './use-env-pending-changes';
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
}

/** Элемент системной переменной */
interface SystemVar {
  /** Имя переменной */
  key: string;
  /** Значение */
  value: string;
  /** Флаг секретности */
  isSecret: boolean;
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
 * @param serverEnv - Переменные из серверного окружения (fallback)
 * @returns Массив системных переменных
 */
function buildSystemVars(token: BotToken, projectId: number, tokenId: number,
  adminIds: string, customItems: Array<{ key: string; value: string }>,
  serverEnv: Map<string, string>): SystemVar[] {
  /** Маппинг кастомных переменных для переопределения дефолтов */
  const customMap = new Map(customItems.map(v => [v.key, v.value]));

  /** Резолвит значение: кастомное → серверное → дефолт */
  function resolve(key: string, defaultValue: string): string {
    return customMap.get(key) ?? serverEnv.get(key) ?? defaultValue;
  }

  return [
    { key: 'BOT_TOKEN', value: token.token, isSecret: true },
    { key: 'ADMIN_IDS', value: adminIds || '123456789', isSecret: true },
    { key: 'PROJECT_ID', value: String(projectId), isSecret: false },
    { key: 'TOKEN_ID', value: String(tokenId), isSecret: false },
    { key: 'API_BASE_URL', value: resolve('API_BASE_URL', 'http://localhost:5000'), isSecret: false },
    { key: 'API_PORT', value: resolve('API_PORT', '5000'), isSecret: false },
    { key: 'API_USE_SSL', value: resolve('API_USE_SSL', 'auto'), isSecret: false },
    { key: 'API_TIMEOUT', value: resolve('API_TIMEOUT', '10'), isSecret: false },
    { key: 'LOG_LEVEL', value: token.logLevel || 'WARNING', isSecret: false },
    { key: 'DISABLE_ASYNC_LOG', value: resolve('DISABLE_ASYNC_LOG', 'true'), isSecret: false },
    { key: 'REDIS_URL', value: resolve('REDIS_URL', 'redis://localhost:6379'), isSecret: true },
    { key: 'PROTECT_CONTENT', value: token.protectContent ? 'true' : 'false', isSecret: false },
    { key: 'SAVE_INCOMING_MEDIA', value: token.saveIncomingMedia ? 'true' : 'false', isSecret: false },
    { key: 'DATABASE_URL', value: resolve('DATABASE_URL', ''), isSecret: true },
    { key: 'MAX_UPDATE_AGE_SECONDS', value: resolve('MAX_UPDATE_AGE_SECONDS', '300'), isSecret: false },
    { key: 'WEBHOOK_PORT', value: resolve('WEBHOOK_PORT', '8080'), isSecret: false },
  ];
}

/**
 * Панель переменных окружения бота с dirty state
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvPanel({ projectId, tokenId, token, adminIds }: BotEnvPanelProps) {
  const { items, revealValue } = useEnvVariables(projectId, tokenId);
  const pending = useEnvPendingChanges(projectId, tokenId);

  /** Серверные переменные окружения (fallback для DATABASE_URL, REDIS_URL и т.д.) */
  const { data: serverEnvData } = useQuery<{ items: Array<{ key: string; value: string }> }>({
    queryKey: ['/api/server/env-keys'],
    queryFn: () => apiRequest('GET', '/api/server/env-keys'),
    staleTime: 5 * 60 * 1000,
  });

  /** Маппинг серверных переменных */
  const serverEnvMap = useMemo(() =>
    new Map((serverEnvData?.items ?? []).map(v => [v.key, v.value])),
    [serverEnvData],
  );

  const [showAdd, setShowAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const systemVars = useMemo(
    () => buildSystemVars(token, projectId, tokenId, adminIds, items, serverEnvMap),
    [token, projectId, tokenId, adminIds, items, serverEnvMap],
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
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground font-medium">{totalCount} переменных</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowRaw(!showRaw)} title="Raw-редактор">
            <FileCode className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSearch(!showSearch)} title="Поиск">
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" /> Новая
          </Button>
        </div>
      </div>

      {showSearch && (
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Фильтр по имени..." className="h-7 text-xs" autoFocus />
      )}

      {/* Мини-бар несохранённых изменений */}
      {pending.changesCount > 0 && (
        <BotEnvStagingBar
          changesCount={pending.changesCount}
          isSaving={pending.isSaving}
          onDiscard={pending.discardAll}
          onSave={pending.saveAll}
          onSaveAndRestart={pending.saveAndRestart}
        />
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
