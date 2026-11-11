/** @fileoverview Поддержание актуальности пользователей и статистики. */
import { useLiveInvalidate } from '../hooks/use-live-invalidate';
import { useTraffic } from '../hooks/queries/use-traffic';
/**
 * Пропсы внутреннего компонента-инвалидатора
 */
interface LiveInvalidatorProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId: number | null;
}

/**
 * Вспомогательный компонент, вызывающий useLiveInvalidate внутри UserMessagesLiveProvider.
 * Также держит useTraffic смонтированным чтобы инвалидация кэша трафика работала
 * независимо от того, какой вид статистики выбран (дашборд или классика).
 * Рендерится без UI — только для подключения хуков к контексту провайдера.
 * @param props - Пропсы компонента
 * @returns null
 */
export function LiveInvalidator({ projectId, selectedTokenId }: LiveInvalidatorProps): null {
  useLiveInvalidate({ projectId, selectedTokenId });
  // Держим useTraffic смонтированным всегда — иначе при классическом виде
  // StatsDashboard не рендерится и инвалидация не триггерит fetch
  useTraffic({ projectId, selectedTokenId });
  return null;
}
