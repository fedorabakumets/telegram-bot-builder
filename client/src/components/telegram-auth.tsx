import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, Shield, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TelegramAuthProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface AuthStatus {
  isAuthenticated: boolean;
  phoneNumber?: string;
  userId?: string;
  needsCode?: boolean;
  needsPassword?: boolean;
}

export function TelegramAuth({ open, onOpenChange, onSuccess }: TelegramAuthProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ isAuthenticated: false });
  const { toast } = useToast();

  // Проверяем статус авторизации при открытии
  useEffect(() => {
    if (open) {
      checkAuthStatus();
    }
  }, [open]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/telegram-auth/status');
      const status = await response.json();
      setAuthStatus(status);
      
      if (status.isAuthenticated) {
        toast({
          title: "Уже авторизован",
          description: `Вы авторизованы как ${status.phoneNumber}`,
        });
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Ошибка проверки статуса:', error);
    }
  };

  const sendCode = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите номер телефона",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('/api/telegram-auth/send-code', {
        method: 'POST',
        body: { phoneNumber: phoneNumber.trim() }
      });

      if (response.success) {
        setPhoneCodeHash(response.phoneCodeHash);
        setStep('code');
        toast({
          title: "Код отправлен",
          description: `Проверьте SMS на номере ${phoneNumber}`,
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
      const response = await apiRequest('/api/telegram-auth/verify-code', {
        method: 'POST',
        body: {
          phoneNumber: phoneNumber.trim(),
          phoneCode: phoneCode.trim(),
          phoneCodeHash
        }
      });

      if (response.success) {
        toast({
          title: "Авторизация успешна",
          description: "Теперь вы можете просматривать всех участников группы",
        });
        onSuccess();
        onOpenChange(false);
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

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !isLoading) {
      action();
    }
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
          {step === 'phone' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+7 xxx xxx xxxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, sendCode)}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Введите номер в международном формате
                </p>
              </div>

              <Button 
                onClick={sendCode} 
                disabled={isLoading || !phoneNumber.trim()}
                className="w-full"
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
            </>
          ) : (
            <>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  Код отправлен на номер <Badge variant="outline">{phoneNumber}</Badge>
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
                  Введите 5-значный код из SMS
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('phone')}
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
            </>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• После авторизации вы сможете просматривать всех участников групп</p>
            <p>• Данные авторизации сохраняются в сессии</p>
            <p>• Используется официальный Telegram Client API</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}