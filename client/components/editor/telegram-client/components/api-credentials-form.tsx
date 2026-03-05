/**
 * @fileoverview Компонент формы ввода API credentials Telegram
 *
 * Предоставляет поля для ввода API ID и API Hash.
 *
 * @module ApiCredentialsForm
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Loader2 } from 'lucide-react';

/**
 * Пропсы компонента формы credentials
 */
export interface ApiCredentialsFormProps {
  /** Значение API ID */
  apiId: string;
  /** Значение API Hash */
  apiHash: string;
  /** Статус загрузки */
  isLoading: boolean;
  /** Обработчик изменения API ID */
  onChangeApiId: (value: string) => void;
  /** Обработчик изменения API Hash */
  onChangeApiHash: (value: string) => void;
  /** Обработчик сохранения */
  onSave: () => void;
}

/**
 * Форма ввода API credentials от my.telegram.org
 *
 * @param {ApiCredentialsFormProps} props - Пропсы компонента
 * @returns {JSX.Element} Форма ввода credentials
 *
 * @example
 * ```tsx
 * <ApiCredentialsForm
 *   apiId={apiId}
 *   apiHash={apiHash}
 *   isLoading={isLoading}
 *   onChangeApiId={setApiId}
 *   onChangeApiHash={setApiHash}
 *   onSave={handleSave}
 * />
 * ```
 */
export function ApiCredentialsForm({
  apiId,
  apiHash,
  isLoading,
  onChangeApiId,
  onChangeApiHash,
  onSave,
}: ApiCredentialsFormProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Telegram API Credentials</Label>
      <div className="space-y-2">
        <div>
          <Label htmlFor="api-id" className="text-xs">API ID</Label>
          <Input
            id="api-id"
            placeholder="12345678"
            value={apiId}
            onChange={(e) => onChangeApiId(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="api-hash" className="text-xs">API Hash</Label>
          <Input
            id="api-hash"
            placeholder="abcdef1234567890"
            value={apiHash}
            onChange={(e) => onChangeApiHash(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button onClick={onSave} disabled={isLoading} className="w-full" size="sm">
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Settings className="h-4 w-4 mr-2" />}
          Сохранить
        </Button>
        <p className="text-xs text-muted-foreground">
          Получите на <a href="https://my.telegram.org" target="_blank" className="underline">my.telegram.org</a>
        </p>
      </div>
    </div>
  );
}
