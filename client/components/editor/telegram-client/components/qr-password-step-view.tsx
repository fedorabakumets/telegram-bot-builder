/**
 * @fileoverview Компонент шага с 2FA паролем для QR авторизации
 *
 * Отображает поле ввода пароля двухфакторной аутентификации.
 *
 * @module QrPasswordStepView
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import type { QrPasswordStepViewProps } from '../types';

/**
 * Компонент шага с 2FA паролем
 *
 * @param {QrPasswordStepViewProps} props - Пропсы компонента
 * @returns {JSX.Element} Шаг с вводом пароля
 *
 * @example
 * ```tsx
 * <QrPasswordStepView
 *   password={password}
 *   isLoading={false}
 *   onPasswordChange={setPassword}
 *   onSubmitPassword={handleSubmit}
 *   onBack={handleBack}
 * />
 * ```
 */
export function QrPasswordStepView({
  password,
  isLoading,
  onPasswordChange,
  onSubmitPassword,
  onBack,
}: QrPasswordStepViewProps) {
  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Требуется пароль 2FA
          </p>
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-300 mb-4">
          Ваш аккаунт защищён двухфакторной аутентификацией
        </p>

        <div className="space-y-2">
          <Label htmlFor="qr-password">Пароль 2FA</Label>
          <Input
            id="qr-password"
            type="password"
            placeholder="Введите пароль 2FA"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            Назад
          </Button>
          <Button
            onClick={onSubmitPassword}
            className="flex-1"
            disabled={isLoading || !password.trim()}
          >
            {isLoading ? 'Генерация...' : 'Проверить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
