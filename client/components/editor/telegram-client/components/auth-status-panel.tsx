/**
 * @fileoverview Компонент панели статуса авторизации Telegram Client API
 *
 * Отображает статус сессии и кнопки управления.
 *
 * @module AuthStatusPanel
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Phone, LogOut, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import type { AuthStatus } from '../types';

/**
 * Пропсы компонента статуса авторизации
 */
export interface AuthStatusPanelProps {
  /** Статус авторизации */
  authStatus: AuthStatus;
  /** Статус загрузки */
  isLoading: boolean;
  /** Обработчик входа */
  onLogin: () => void;
  /** Обработчик выхода */
  onLogout: () => void;
}

/**
 * Панель статуса авторизации Client API
 *
 * @param {AuthStatusPanelProps} props - Пропсы компонента
 * @returns {JSX.Element} Панель статуса сессии
 *
 * @example
 * ```tsx
 * <AuthStatusPanel
 *   authStatus={authStatus}
 *   isLoading={isLoading}
 *   onLogin={() => setShowAuthDialog(true)}
 *   onLogout={handleLogout}
 * />
 * ```
 */
export function AuthStatusPanel({
  authStatus,
  isLoading,
  onLogin,
  onLogout,
}: AuthStatusPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Статус сессии</Label>
        {authStatus.isAuthenticated ? (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Авторизован
          </Badge>
        ) : (
          <Badge variant="secondary">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Не авторизован
          </Badge>
        )}
      </div>

      {authStatus.isAuthenticated && (
        <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
          <p><strong>Пользователь:</strong> {authStatus.username || authStatus.phoneNumber}</p>
          {authStatus.userId && authStatus.userId !== 'default' && (
            <p><strong>ID:</strong> {authStatus.userId}</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {!authStatus.isAuthenticated && (
          <Button onClick={onLogin} className="flex-1" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Войти
          </Button>
        )}
        {authStatus.isAuthenticated && (
          <Button onClick={onLogout} disabled={isLoading} variant="outline" className="flex-1" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        )}
      </div>
    </div>
  );
}
