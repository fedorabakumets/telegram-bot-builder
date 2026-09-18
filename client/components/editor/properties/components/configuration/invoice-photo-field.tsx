/**
 * @fileoverview Картинка счёта: загрузка / URL / хранилище → invoicePhotoUrl
 * @module components/editor/properties/components/configuration/invoice-photo-field
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MediaQuickAddRow } from '../../media/media-quick-add-row';
import { VariableSelector } from '../variables/variable-selector';
import type { Variable } from '../../../inline-rich/types';

/**
 * Пропсы поля картинки счёта
 */
interface InvoicePhotoFieldProps {
  /** ID проекта для загрузки */
  projectId: number;
  /** ID узла */
  nodeId: string;
  /** Текущий URL или /uploads/… */
  value: string;
  /** Сохранение в invoicePhotoUrl */
  onChange: (value: string) => void;
  /** Переменные для подстановки */
  textVariables?: Variable[];
  /** Data узла для размеров фото */
  data?: any;
  /** Обновление размеров */
  onNodeUpdate?: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Проверяет, что значение — JSON file_id (для счёта не подходит)
 * @param url - Строка из медиа
 * @returns true если это file_id
 */
function isFileIdEntry(url: string): boolean {
  return url.includes('"__type":"file_id"');
}

/**
 * Поле одной картинки для send_invoice без file_id и мультивыбора
 *
 * @param props - Свойства поля
 * @returns JSX элемент
 */
export function InvoicePhotoField({
  projectId,
  nodeId,
  value,
  onChange,
  textVariables = [],
  data,
  onNodeUpdate,
}: InvoicePhotoFieldProps) {
  /**
   * Берёт первый подходящий URL из прикрепления
   * @param urls - Список URL из медиа-блока
   */
  const handleAttached = (urls: string[]) => {
    const next = urls.find((u) => u.trim() && !isFileIdEntry(u))?.trim() || '';
    if (next) onChange(next);
  };

  const previewSrc =
    value && !value.startsWith('{') && !isFileIdEntry(value) ? value : '';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">Картинка товара</Label>
        {textVariables.length > 0 && (
          <VariableSelector
            availableVariables={textVariables}
            onSelect={(name) => onChange(`{${name}}`)}
          />
        )}
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Одна картинка: загрузка, URL или переменная. Telegram качает её по публичному
        адресу; для `/uploads/` бот подставит <code className="text-[9px]">API_BASE_URL</code>.
      </p>

      {value ? (
        <div className="rounded-lg border border-yellow-200/50 dark:border-yellow-800/40 p-2 space-y-2">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Картинка счёта"
              className="w-full max-h-28 object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[10px] font-mono break-all text-muted-foreground">
              {value}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => onChange('')}
            >
              Убрать
            </Button>
          </div>
        </div>
      ) : (
        <MediaQuickAddRow
          projectId={projectId}
          nodeId={nodeId}
          nodeName={nodeId}
          multiple={false}
          placeholder="URL или файл с диска"
          onAttached={handleAttached}
        />
      )}
      {onNodeUpdate && (
        <div className="grid grid-cols-3 gap-1">
          <Input
            className="h-7 text-[10px]"
            placeholder="size"
            value={data?.invoicePhotoSize || ''}
            onChange={(e) => onNodeUpdate(nodeId, { invoicePhotoSize: e.target.value })}
          />
          <Input
            className="h-7 text-[10px]"
            placeholder="width"
            value={data?.invoicePhotoWidth || ''}
            onChange={(e) => onNodeUpdate(nodeId, { invoicePhotoWidth: e.target.value })}
          />
          <Input
            className="h-7 text-[10px]"
            placeholder="height"
            value={data?.invoicePhotoHeight || ''}
            onChange={(e) => onNodeUpdate(nodeId, { invoicePhotoHeight: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
