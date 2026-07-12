/**
 * @fileoverview Группы полей формы конфига хранилища (`StorageConfigFormFields`).
 * @module components/editor/files/panel/storage/storage-config-form-fields
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { STORAGE_CONFIG_FORM_SECTION_TITLE_CLASS, STORAGE_CONFIG_FORM_SETTING_ROW_CLASS } from '../panel-styles';
import { configStr, type StorageConfigDraft } from './storage-config-draft';

/** Пропсы групп полей формы хранилища */
export interface StorageConfigFormFieldsProps {
  /** Текущий черновик */
  draft: StorageConfigDraft;
  /** Заданы ли уже секреты у конфига (режим правки S3) */
  hasSecrets: boolean;
  /** Изменить несекретное поле config по ключу */
  onConfigChange: (key: string, value: unknown) => void;
  /** Изменить кред S3 (accessKeyId/secretAccessKey) */
  onCredChange: (key: 's3AccessKeyId' | 's3SecretAccessKey', value: string) => void;
}

/**
 * Поля для локального хранилища (путь к папке).
 * @param props - Черновик и колбэк изменения config
 * @returns JSX-блок полей local
 */
function LocalFields({ draft, onConfigChange }: StorageConfigFormFieldsProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="storage-root-path">Путь к папке</Label>
      <Input
        id="storage-root-path"
        value={configStr(draft.config, 'rootPath')}
        onChange={(e) => onConfigChange('rootPath', e.target.value)}
        placeholder="uploads"
        data-testid="storage-field-rootPath"
      />
      <p className="text-xs text-muted-foreground">Относительный путь от корня проекта на сервере</p>
    </div>
  );
}

/**
 * Поля для S3-хранилища (endpoint, region, bucket, path-style, public URL, креды).
 * @param props - Черновик, флаг наличия секретов и колбэки изменений
 * @returns JSX-блок полей S3
 */
function S3Fields({ draft, hasSecrets, onConfigChange, onCredChange }: StorageConfigFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="storage-endpoint">Endpoint URL</Label>
          <Input
            id="storage-endpoint"
            value={configStr(draft.config, 'endpointUrl')}
            onChange={(e) => onConfigChange('endpointUrl', e.target.value)}
            placeholder="http://localhost:9000"
            data-testid="storage-field-endpointUrl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="storage-region">Регион</Label>
          <Input
            id="storage-region"
            value={configStr(draft.config, 'region')}
            onChange={(e) => onConfigChange('region', e.target.value)}
            placeholder="us-east-1"
            data-testid="storage-field-region"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="storage-bucket">Бакет</Label>
          <Input
            id="storage-bucket"
            value={configStr(draft.config, 'bucket')}
            onChange={(e) => onConfigChange('bucket', e.target.value)}
            placeholder="botcraft-files"
            data-testid="storage-field-bucket"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="storage-public-url">Публичный URL</Label>
          <Input
            id="storage-public-url"
            value={configStr(draft.config, 'publicUrlBase')}
            onChange={(e) => onConfigChange('publicUrlBase', e.target.value)}
            placeholder="https://cdn.example.com"
            data-testid="storage-field-publicUrlBase"
          />
          <p className="text-xs text-muted-foreground">Необязательно — для прямых ссылок на файлы</p>
        </div>
      </div>

      <div className={STORAGE_CONFIG_FORM_SETTING_ROW_CLASS}>
        <div className="space-y-0.5">
          <Label htmlFor="storage-force-path-style" className="text-sm font-medium">
            Path-style адресация
          </Label>
          <p className="text-xs text-muted-foreground">Включите для MinIO и совместимых серверов</p>
        </div>
        <Switch
          id="storage-force-path-style"
          checked={Boolean(draft.config.forcePathStyle)}
          onCheckedChange={(v) => onConfigChange('forcePathStyle', v)}
          data-testid="storage-field-forcePathStyle"
        />
      </div>

      <div className="space-y-3 pt-1">
        <p className={STORAGE_CONFIG_FORM_SECTION_TITLE_CLASS}>Ключи доступа</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="storage-access-key">Access Key ID</Label>
            <Input
              id="storage-access-key"
              value={draft.s3AccessKeyId ?? ''}
              onChange={(e) => onCredChange('s3AccessKeyId', e.target.value)}
              placeholder={hasSecrets ? 'оставьте пустым — сохранить текущий' : 'AKIA…'}
              autoComplete="off"
              data-testid="storage-field-accessKeyId"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="storage-secret-key">Secret Access Key</Label>
            <Input
              id="storage-secret-key"
              type="password"
              value={draft.s3SecretAccessKey ?? ''}
              onChange={(e) => onCredChange('s3SecretAccessKey', e.target.value)}
              placeholder={hasSecrets ? 'оставьте пустым — сохранить текущий' : '••••••••'}
              autoComplete="new-password"
              data-testid="storage-field-secretAccessKey"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Группы полей формы хранилища: показывает local- либо S3-блок по типу бэкенда.
 * @param props - Черновик, флаг секретов и колбэки изменений
 * @returns JSX-блок полей выбранного бэкенда
 */
export function StorageConfigFormFields(props: StorageConfigFormFieldsProps) {
  return props.draft.backend === 's3' ? <S3Fields {...props} /> : <LocalFields {...props} />;
}
