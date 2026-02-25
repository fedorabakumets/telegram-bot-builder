import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, QrCode, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { QrCodeGenerator } from './qr-code-generator';

/**
 * Свойства компонента TelegramAuth
 * @interface TelegramAuthProps
 * @property {boolean} open - Состояние открытия диалога
 * @property {Function} onOpenChange - Коллбэк для изменения состояния открытия
 * @property {Function} onSuccess - Коллбэк, вызываемый при успешной авторизации
 */
interface TelegramAuthProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Компонент авторизации через Telegram
 *
 * Предоставляет интерфейс для авторизации через Telegram Client API
 * с использованием номера телефона и кода подтверждения.
 *
 * @param {TelegramAuthProps} props - Свойства компонента
 * @returns {JSX.Element} Диалог авторизации через Telegram
 *
 * @example
 * ```tsx
 * <TelegramAuth
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSuccess={() => console.log('Успешная авторизация')}
 * />
 * ```
 */
export function TelegramAuth({ open, onOpenChange, onSuccess }: TelegramAuthProps) {
  const [step, setStep] = useState<'phone' | 'qr' | 'qr-password'>('phone');
  const [, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [qrToken, setQrToken] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrPassword, setQrPassword] = useState('');
  const [qrCountdown, setQrCountdown] = useState(30);
  const [, setQrExpiredCount] = useState(0);

  /**
   * Генерирует QR-код для авторизации
   */
  const generateQRCode = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/telegram-auth/qr-generate', {});

      if (response.success) {
        // Если требуется 2FA — переключаемся на ввод пароля
        if (response.requiresPassword) {
          setStep('qr-password');
          toast({
            title: 'Требуется 2FA',
            description: 'Введите пароль двухфакторной аутентификации',
          });
        } else {
          setQrToken(response.token);
          setQrUrl(response.qrUrl);
          setStep('qr');
          setQrExpiredCount(0); // Сбрасываем счётчик при новой генерации
          toast({
            title: 'QR-код сгенерирован',
            description: 'Отсканируйте QR-код в приложении Telegram',
          });
        }
      } else {
        const isApiInvalid = response.error?.includes('API_ID') || response.error?.includes('API_HASH');
        toast({
          title: 'Ошибка генерации QR-кода',
          description: isApiInvalid
            ? 'Неверные API credentials. Получите новые на my.telegram.org'
            : response.error || 'Не удалось сгенерировать QR-код',
          variant: 'destructive'
        });
        if (isApiInvalid) {
          toast({
            title: 'Ошибка',
            description: 'Неверные API credentials',
            variant: 'destructive'
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сгенерировать QR-код',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Проверяет статус QR-кода (вызывается только когда пользователь сообщил о сканировании)
   */
  const checkQRStatus = async (): Promise<void> => {
    if (!qrToken) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/telegram-auth/qr-check', {
        token: qrToken,
        password: qrPassword || undefined // Передаём пароль если есть
      });

      if (response.success) {
        // Если требуется 2FA пароль и пароль ещё не введён
        if (response.needsPassword && !qrPassword) {
          setStep('qr-password');
          toast({
            title: 'Требуется пароль 2FA',
            description: 'Введите пароль двухфакторной аутентификации',
          });
          return;
        }
        
        // Если авторизация успешна (сессия сохранена)
        if (response.isAuthenticated) {
          toast({
            title: 'Авторизация успешна',
            description: 'Telegram Client API подключён',
          });
          setQrToken('');
          setQrUrl('');
          setQrPassword('');
          setQrExpiredCount(0);
          onSuccess();
          onOpenChange(false);
        } else {
          // Токен истёк или ещё не отсканирован
          toast({
            title: 'QR-код не активен',
            description: 'Токен истёк или ещё не отсканирован. Попробуйте обновить QR-код.',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Ошибка проверки QR:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось проверить QR',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Polling для проверки QR-кода и автообновления токена
   */
  useEffect(() => {
    if (step !== 'qr' && step !== 'qr-password') return;
    if (!qrToken) return;

    console.log('🔍 QR polling запущен');

    // Таймер обратного отсчёта для визуализации
    const countdownInterval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          // Когда таймер дошёл до 0 — обновляем токен
          generateQRCode();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    // Обновляем токен каждые 25 секунд (запас до 30 сек)
    const refreshInterval = setInterval(async () => {
      try {
        console.log('🔄 Автообновление QR-токена...');
        const response = await apiRequest('POST', '/api/telegram-auth/qr-refresh', {});

        if (response.success) {
          // Обновляем токен и URL — теперь используется новый токен
          setQrToken(response.token);
          setQrUrl(response.qrUrl);
          setQrCountdown(response.expires || 30);
          console.log(`✅ QR-токен обновлён (expires: ${response.expires}с)`);
        } else {
          console.error('❌ Ошибка обновления QR:', response.error);
          // При ошибке — пробуем сгенерировать новый QR
          await generateQRCode();
        }
      } catch (error) {
        console.error('Ошибка обновления QR:', error);
      }
    }, 25000);

    return () => {
      console.log('🛑 QR polling остановлен');
      clearInterval(countdownInterval);
      clearInterval(refreshInterval);
    };
  }, [step, qrPassword, generateQRCode]);

  // Сбрасываем состояние при открытии
  useEffect(() => {
    if (open) {
      setPhoneNumber('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Авторизация Telegram Client API
          </DialogTitle>
          <DialogDescription>
            Используйте личный аккаунт Telegram для расширенных возможностей бота
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ввод номера телефона */}
          {step === 'phone' && (
            <>
         

              {/* QR-код как основной способ */}
              <div className="text-center space-y-2">
                <Button
                  onClick={generateQRCode}
                  disabled={isLoading}
                  className="w-full gap-2"
                  variant="default"
                >
                  <QrCode className="h-4 w-4" />
                  Войти через QR-код
                </Button>
                <p className="text-xs text-muted-foreground">
                  Откройте Telegram на телефоне → Настройки → Устройства → Привязать устройство
                </p>
              </div>
            </>
          )}

          {/* QR-код авторизация */}
          {step === 'qr' && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 animate-pulse" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Ожидание сканирования...
                  </p>
                </div>

                {/* Реальный QR-код с таймером */}
                <div className="bg-white p-4 rounded-lg inline-block mb-3 relative">
                  {qrUrl ? (
                    <>
                      <QrCodeGenerator value={qrUrl} size={200} />
                      {/* Индикатор обновления */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        <span className="animate-pulse">🔄</span>
                        <span>{qrCountdown}с</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded">
                      <QrCode className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-green-700 dark:text-green-300">
                  Откройте Telegram → Настройки → Устройства → Подключить устройство
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ✨ QR-код обновляется автоматически. Успейте отсканировать за {qrCountdown} сек!
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  ℹ️ Если видите "Токен истёк" — это нормально, QR обновится автоматически
                </p>
              </div>

              {/* Кнопка проверки после сканирования */}
              <div className="text-center">
                <Button
                  onClick={checkQRStatus}
                  disabled={isLoading}
                  className="w-full gap-2"
                  variant="default"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Проверяем...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Я отсканировал QR-код
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Нажмите после сканирования для проверки
                </p>
              </div>

              {qrUrl && (
                <div className="text-center">
                  <a
                    href={qrUrl.replace('tg://', 'https://t.me/')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Открыть ссылку в браузере
                  </a>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('phone');
                    setQrToken('');
                    setQrUrl('');
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Назад
                </Button>
                <Button
                  onClick={generateQRCode}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  Обновить QR
                </Button>
              </div>
            </div>
          )}

          {/* QR-код с вводом 2FA пароля */}
          {step === 'qr-password' && (
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
                    value={qrPassword}
                    onChange={(e) => setQrPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => {
                      setStep('qr');
                      setQrPassword('');
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Назад
                  </Button>
                  <Button
                    onClick={() => {
                      if (qrPassword.trim()) {
                        // Проверяем QR с паролем
                        checkQRStatus();
                      }
                    }}
                    className="flex-1"
                    disabled={isLoading || !qrPassword.trim()}
                  >
                    {isLoading ? 'Проверяем...' : 'Проверить'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Информационная панель */}
          {step === 'phone' && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Используйте личный аккаунт Telegram для расширенных возможностей бота</p>
              <p>• QR-код — самый надёжный способ авторизации</p>
              <p>• Используется официальный Telegram Client API</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}