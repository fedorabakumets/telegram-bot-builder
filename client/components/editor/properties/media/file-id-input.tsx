/**
 * @fileoverview Компонент ввода Telegram file_id по токенам проекта
 * @module client/components/editor/properties/media/file-id-input
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { InfoBlock } from '@/components/ui/info-block';
import type { BotToken } from '@shared/schema';

/** Тип медиа для file_id */
type MediaType = 'photo' | 'video' | 'audio' | 'document';

/** Пропсы компонента FileIdInput */
interface FileIdInputProps {
  /** Идентификатор проекта для загрузки токенов */
  projectId: number;
  /** Текущий выбранный тип медиа */
  mediaType: MediaType;
  /** Callback при смене типа медиа */
  onMediaTypeChange: (type: MediaType) => void;
  /** Callback при добавлении — передаёт JSON-строку в attachedMedia */
  onAdd: (entry: string) => void;
}

/** Варианты типов медиа для выбора */
const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: 'photo', label: 'Фото' },
  { value: 'video', label: 'Видео' },
  { value: 'audio', label: 'Аудио' },
  { value: 'document', label: 'Документ' },
];

/**
 * Компонент ввода Telegram file_id для каждого токена проекта
 * @param props - Свойства компонента
 * @returns JSX элемент формы ввода file_id
 */
export function FileIdInput({ projectId, mediaType, onMediaTypeChange, onAdd }: FileIdInputProps) {
  /** Маппинг tokenId → введённый file_id */
  const [fileIds, setFileIds] = useState<Record<string, string>>({});

  /** Загружаем токены проекта */
  const { data: tokens = [], isLoading } = useQuery<BotToken[]>({
    queryKey: ['/api/user/tokens', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/user/tokens?projectId=${projectId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  /**
   * Обновляет file_id для конкретного токена
   * @param tokenId - Идентификатор токена
   * @param value - Введённое значение file_id
   */
  const handleFileIdChange = (tokenId: number, value: string) => {
    setFileIds((prev) => ({ ...prev, [String(tokenId)]: value }));
  };

  /**
   * Формирует JSON-строку и вызывает onAdd
   */
  const handleAdd = () => {
    const fileIdsByToken: Record<string, string> = {};
    for (const [id, fid] of Object.entries(fileIds)) {
      if (fid.trim()) fileIdsByToken[id] = fid.trim();
    }
    if (Object.keys(fileIdsByToken).length === 0) return;
    const entry = JSON.stringify({ __type: 'file_id', mediaType, fileIdsByToken });
    onAdd(entry);
    setFileIds({});
  };

  /** Есть ли хотя бы один заполненный file_id */
  const hasAnyFileId = Object.values(fileIds).some((v) => v.trim().length > 0);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Загрузка токенов...</p>;
  }

  if (tokens.length === 0) {
    return (
      <InfoBlock
        variant="warning"
        title="Нет токенов"
        description="Добавьте токен бота в настройках проекта, чтобы использовать Telegram file_id."
      />
    );
  }

  return (
    <div className="space-y-4">
      <InfoBlock
        variant="info"
        title="ℹ️ file_id привязан к конкретному боту"
        description="Один и тот же файл имеет разный file_id для каждого бота. Заполните поля для нужных токенов."
      />

      {/* Выбор типа медиа */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Тип медиа</Label>
        <RadioGroup
          value={mediaType}
          onValueChange={(v) => onMediaTypeChange(v as MediaType)}
          className="flex flex-wrap gap-3"
        >
          {MEDIA_TYPES.map(({ value, label }) => (
            <div key={value} className="flex items-center gap-1.5">
              <RadioGroupItem value={value} id={`mt-${value}`} />
              <Label htmlFor={`mt-${value}`} className="text-sm cursor-pointer">{label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Поля ввода file_id для каждого токена */}
      <div className="space-y-3">
        {tokens.map((token) => (
          <div key={token.id} className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              🤖 {token.name}{token.botUsername ? ` (@${token.botUsername})` : ''}
            </Label>
            <Input
              value={fileIds[String(token.id)] ?? ''}
              onChange={(e) => handleFileIdChange(token.id, e.target.value)}
              placeholder={`Введите file_id для этого бота...`}
              className="h-9 text-sm font-mono"
            />
          </div>
        ))}
      </div>

      <Button
        onClick={handleAdd}
        disabled={!hasAnyFileId}
        className="w-full"
      >
        Добавить file_id
      </Button>
    </div>
  );
}
