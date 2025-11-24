import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { TelegramAuth } from '@/components/telegram-auth';

export function AuthBar() {
  const [showTelegramAuth, setShowTelegramAuth] = useState(false);

  return (
    <>
      <div className="w-full bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 py-2 px-4 flex items-center justify-start">
        <Button 
          onClick={() => setShowTelegramAuth(true)}
          size="sm"
          className="flex items-center gap-2"
          title="Вход через Telegram"
          data-testid="button-auth-bar-telegram"
        >
          <LogIn className="h-4 w-4" />
          Вход через Telegram
        </Button>
      </div>

      <TelegramAuth 
        open={showTelegramAuth}
        onOpenChange={setShowTelegramAuth}
        onSuccess={() => {
          setShowTelegramAuth(false);
        }}
      />
    </>
  );
}
