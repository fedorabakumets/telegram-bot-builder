import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, Shield, CheckCircle2, Volume2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTelegramResendCode } from '@/hooks/use-telegram-resend-code';
import { QrCodeGenerator } from './qr-code-generator';
import { TelegramSmsResendButton } from './telegram-sms-resend';

/**
 * Свойства компонента TelegramAuth
 * @interface TelegramAuthProps
 * @property {boolean} open - Состояние открытия диалога
 * @property {Function} onOpenChange - Коллбэк для изменения состояния открытия
 * @property {Function} onSuccess - Коллбэк, вызываемый при успешной авторизации
 * @property {number} [projectId] - ID проекта для привязки сессии
 */
interface TelegramAuthProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projectId?: number;
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
export function TelegramAuth({ open, onOpenChange, onSuccess, projectId }: TelegramAuthProps) {
  const [step, setStep] = useState<'credentials' | 'phone' | 'code' | 'qr' | 'password' | 'qr-password'>('credentials');
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const { toast } = useToast();
  const [qrToken, setQrToken] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrPassword, setQrPassword] = useState('');
  const [qrCountdown, setQrCountdown] = useState(30);
  const [, setQrExpiredCount] = useState(0);

  /**
   * Хук для повторной отправки кода через звонок
   */
  const { resendCode, resendTimeout, isLoading: isResendLoading, currentPhoneCodeHash } = useTelegramResendCode({
    phoneNumber,
    phoneCodeHash,
    projectId,
    isActive: step === 'code'
  });

  /**
   * Генерирует QR-код для авторизации
   */
  const generateQRCode = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/telegram-auth/qr-generate', {
        projectId: projectId || 'default'
      });

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
          setStep('credentials');
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
        projectId: projectId || 'default',
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
            description: 'Теперь вы можете просматривать всех участников группы',
          });
          setStep('credentials');
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
        const response = await apiRequest('POST', '/api/telegram-auth/qr-refresh', {
          projectId: projectId || 'default'
        });

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

  /**
   * Проверка наличия credentials при открытии диалога
   */
  const checkCredentials = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/telegram-auth/status?projectId=${projectId || 'default'}`);
      const status = await response.json();
      setHasCredentials(status.hasCredentials || false);
    } catch (error) {
      console.error('Ошибка проверки credentials:', error);
      setHasCredentials(false);
    }
  };

  // Сбрасываем состояние при открытии и проверяем credentials
  useEffect(() => {
    if (open) {
      setApiId('');
      setApiHash('');
      setPhoneNumber('');
      setPhoneCode('');
      setPhoneCodeHash('');
      checkCredentials();
    }
  }, [open, projectId]);

  // Устанавливаем шаг после проверки credentials
  useEffect(() => {
    if (open) {
      // Если credentials уже есть, пропускаем шаг ввода
      setStep(hasCredentials ? 'phone' : 'credentials');
    }
  }, [open, hasCredentials]);

  /**
   * Сохраняет API credentials (если нужно) и отправляет код подтверждения
   *
   * Выполняет запрос к API для сохранения credentials (если их нет)
   * и отправляет код подтверждения на указанный номер телефона
   */
  const saveCredentialsAndSendCode = async () => {
    // Если credentials нет, сохраняем их
    if (!hasCredentials && (!apiId.trim() || !apiHash.trim())) {
      toast({
        title: "Ошибка",
        description: "Введите API ID и API Hash",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Сохраняем credentials только если их нет
      if (!hasCredentials) {
        const credentialsResponse = await apiRequest('POST', '/api/telegram-auth/save-credentials', {
          apiId: apiId.trim(),
          apiHash: apiHash.trim(),
          projectId: projectId || 'default'
        });

        if (!credentialsResponse.success) {
          toast({
            title: "Ошибка",
            description: credentialsResponse.error || "Не удалось сохранить credentials",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }

      // Затем отправляем код
      const response = await apiRequest('POST', '/api/telegram-auth/send-code', {
        phoneNumber: phoneNumber.trim(),
        projectId: projectId || 'default'
      });

      if (response.success) {
        setPhoneCodeHash(response.phoneCodeHash);
        setStep('code');
        
        // Формируем сообщение в зависимости от типа доставки кода
        let codeMessage = '';
        let codeTitle = 'Код отправлен';
        
        if (response.codeType === 'уведомление в Telegram') {
          codeTitle = 'Проверьте Telegram';
          codeMessage = 'Код придёт в приложение Telegram (не в бота!). Откройте Telegram → посмотрите уведомления или раздел "Чаты". Если у вас открыт Telegram на компьютере — код придёт туда.';
        } else if (response.codeType === 'голосовой звонок') {
          codeMessage = 'Вам поступит входящий звонок от Telegram. Робот продиктует 5-значный код.';
        } else if (response.codeType === 'SMS') {
          codeMessage = `Проверьте SMS на номере ${phoneNumber}.`;
        } else {
          codeMessage = `Код отправлен. Проверьте ${response.codeType || 'приложение Telegram'}.`;
        }
        
        // Добавляем информацию о следующем способе
        if (response.nextType && response.nextType !== response.codeType) {
          codeMessage += ` Если не придёт, через 10 сек можно запросить ${response.nextType}.`;
        }
        
        toast({
          title: codeTitle,
          description: codeMessage,
          duration: 15000,
        });
      } else {
        toast({
          title: "Ошибка отправки кода",
          description: response.error || "Неизвестная ошибка",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить код",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Проверяет введенный код подтверждения
   *
   * Выполняет запрос к API для проверки кода подтверждения
   * и обновляет состояние компонента в зависимости от результата.
   */
  const verifyCode = async () => {
    if (!phoneCode.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите код подтверждения",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/telegram-auth/verify-code', {
        phoneNumber: phoneNumber.trim(),
        phoneCode: phoneCode.trim(),
        phoneCodeHash: currentPhoneCodeHash,
        projectId: projectId || 'default'
      });

      if (response.success) {
        toast({
          title: "Авторизация успешна",
          description: "Теперь вы можете просматривать всех участников группы",
        });
        onSuccess();
        onOpenChange(false);
      } else if (response.needsPassword) {
        setStep('password');
        toast({
          title: "Требуется пароль 2FA",
          description: "Введите пароль двухфакторной аутентификации",
        });
      } else {
        toast({
          title: "Ошибка авторизации",
          description: response.error || "Неверный код",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: "Не удалось проверить код",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Обрабатывает нажатие клавиши Enter для выполнения действия
   *
   * @param {React.KeyboardEvent} e - Событие нажатия клавиши
   * @param {Function} action - Действие для выполнения
   */
  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !isLoading) {
      action();
    }
  };

  /**
   * Переход к шагу ввода номера телефона
   */
  const goToPhoneStep = () => {
    if (!apiId.trim() || !apiHash.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите API ID и API Hash",
        variant: "destructive"
      });
      return;
    }
    setStep('phone');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Авторизация Telegram Client API
          </DialogTitle>
          <DialogDescription>
            Для получения полного списка участников группы необходима авторизация через ваш номер телефона
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Шаг 1: Ввод API credentials */}
          {step === 'credentials' && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-3 text-sm text-muted-foreground">Проверка настроек...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="api-id">API ID</Label>
                    <Input
                      id="api-id"
                      placeholder="12345678"
                      value={apiId}
                      onChange={(e) => setApiId(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, goToPhoneStep)}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Получите на <a href="https://my.telegram.org" target="_blank" className="underline">my.telegram.org</a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api-hash">API Hash</Label>
                    <Input
                      id="api-hash"
                      placeholder="abcdef1234567890"
                      value={apiHash}
                      onChange={(e) => setApiHash(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, goToPhoneStep)}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Секретный ключ вашего приложения
                    </p>
                  </div>

                  <Button
                    onClick={goToPhoneStep}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Продолжить
                  </Button>
                </>
              )}
            </>
          )}

          {/* Шаг 2: Ввод номера телефона */}
          {step === 'phone' && (
            <>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-200">
                    <p className="font-semibold mb-1">⚠️ Код может не прийти</p>
                    <p>Для номеров +7 Telegram часто не отправляет коды в Client API. Рекомендуем использовать QR-код.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+7 xxx xxx xxxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, saveCredentialsAndSendCode)}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Введите номер в международном формате
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('credentials');
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Назад
                </Button>
                <Button
                  onClick={saveCredentialsAndSendCode}
                  disabled={isLoading || !phoneNumber.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Отправляем код...
                    </>
                  ) : (
                    'Отправить код'
                  )}
                </Button>
              </div>

              {/* QR-код как основной способ */}
              <div className="text-center space-y-2">
                <div className="text-xs text-muted-foreground">— или —</div>
                <Button
                  onClick={generateQRCode}
                  disabled={isLoading}
                  className="w-full gap-2"
                  variant="default"
                >
                  <QrCode className="h-4 w-4" />
                  Войти через QR-код (рекомендуется)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Откройте Telegram на телефоне → Настройки → Устройства → Привязать устройство
                </p>
              </div>
            </>
          )}

          {/* Ввод кода подтверждения */}
          {step === 'code' && (
            <>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <CheckCircle2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                  Проверьте Telegram
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Код придёт в приложение Telegram (не в бота!) на номер <Badge variant="outline">{phoneNumber}</Badge>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  💡 Если у вас открыт Telegram на компьютере — код придёт туда
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Код подтверждения</Label>
                <Input
                  id="code"
                  placeholder="12345"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, verifyCode)}
                  disabled={isLoading}
                  maxLength={5}
                />
                <p className="text-xs text-muted-foreground">
                  Введите 5-значный код из уведомления
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('phone');
                    setPhoneCode('');
                    setPhoneCodeHash('');
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Назад
                </Button>
                <Button
                  onClick={verifyCode}
                  disabled={isLoading || !phoneCode.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Проверяем...
                    </>
                  ) : (
                    'Подтвердить'
                  )}
                </Button>
              </div>

              {/* Повторная отправка кода */}
              <div className="space-y-2 text-center">
                <div className="text-xs text-muted-foreground">
                  Не пришёл код?
                </div>
                <TelegramSmsResendButton
                  phoneNumber={phoneNumber}
                  phoneCodeHash={currentPhoneCodeHash}
                  projectId={projectId}
                  disabled={resendTimeout > 0 || isResendLoading}
                />
                <Button
                  variant="ghost"
                  onClick={resendCode}
                  disabled={resendTimeout > 0 || isResendLoading}
                  className="w-full gap-2"
                  size="sm"
                >
                  <Volume2 className="h-4 w-4" />
                  {isResendLoading ? (
                    'Отправляем...'
                  ) : resendTimeout > 0 ? (
                    `Повторить через ${resendTimeout} сек`
                  ) : (
                    'Запросить код звонком'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep('phone');
                    setPhoneCode('');
                    setPhoneCodeHash('');
                  }}
                  disabled={isLoading}
                  className="w-full gap-2"
                  size="sm"
                >
                  🔄 Отправить код заново
                </Button>
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
          {step === 'credentials' && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• API ID и API Hash получаются на my.telegram.org</p>
              <p>• Это данные вашего Telegram-приложения</p>
              <p>• После ввода вы перейдёте к авторизации по номеру</p>
            </div>
          )}
          {step === 'phone' && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• На номер будет отправлен код подтверждения</p>
              <p>• API credentials будут сохранены автоматически</p>
              <p>• Используется официальный Telegram Client API</p>
            </div>
          )}
          {step === 'code' && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• После авторизации вы сможете просматривать всех участников групп</p>
              <p>• Данные авторизации сохраняются в сессии</p>
              <p>• Используется официальный Telegram Client API</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}