/**
 * @fileoverview Строка настройки: маскированный токен и замена по двойному клику
 * @module bot/card/BotTokenSettings
 */

import { KeyRound } from 'lucide-react';
import { TokenDisplayEdit } from '../token/TokenDisplayEdit';
import { SettingCard } from './SettingCard';

/** Пропсы строки токена */
interface BotTokenSettingsProps {
  /** ID проекта */
  projectId: number;
  /** ID записи токена */
  tokenId: number;
  /** Значение токена (может быть маской) */
  token: string;
}

/**
 * Поле смены BOT_TOKEN в секции «Запуск» (список и холст)
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotTokenSettings({
  projectId,
  tokenId,
  token,
}: BotTokenSettingsProps) {
  return (
    <SettingCard
      icon={KeyRound}
      title="Токен бота"
      description="Нажмите на токен, чтобы посмотреть или заменить его"
      testId="bot-token-settings"
    >
      <TokenDisplayEdit
        key={`${projectId}:${tokenId}`}
        token={token}
        tokenId={tokenId}
        projectId={projectId}
        hidePrefix
        onTokenUpdate={() => undefined}
      />
    </SettingCard>
  );
}
