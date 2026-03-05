/**
 * @fileoverview Компонент конфигурации Telegram Client API
 *
 * Композиция компонентов для настройки Client API.
 *
 * @module TelegramClientConfig
 */

import { Card, CardContent } from '@/components/ui/card';
import { TelegramAuth } from './telegram-auth';
import { useTelegramAuth } from './hooks';
import {
  ClientApiCardHeader,
  ApiCredentialsForm,
  ApiCredentialsSaved,
  AuthStatusPanel,
  WarningAlert,
} from './components';
import type { ApiCredentials } from './types';

/**
 * Компонент настройки Telegram Client API
 *
 * @returns {JSX.Element} Панель конфигурации Client API
 */
export function TelegramClientConfig() {
  const {
    authStatus,
    apiId,
    apiHash,
    isLoading,
    showAuthDialog,
    loadStatus,
    saveCredentials,
    logout,
    resetCredentials,
    setShowAuthDialog,
    setApiId,
    setApiHash,
  } = useTelegramAuth();

  const handleSaveCredentials = () => {
    saveCredentials({ apiId, apiHash } as ApiCredentials);
  };

  return (
    <>
      <Card className="border-purple-200 dark:border-purple-800">
        <ClientApiCardHeader />

        <CardContent className="space-y-6">
          {!authStatus.hasCredentials && (
            <ApiCredentialsForm
              apiId={apiId}
              apiHash={apiHash}
              isLoading={isLoading}
              onChangeApiId={setApiId}
              onChangeApiHash={setApiHash}
              onSave={handleSaveCredentials}
            />
          )}

          {authStatus.hasCredentials && (
            <ApiCredentialsSaved
              isLoading={isLoading}
              onReset={resetCredentials}
            />
          )}

          <AuthStatusPanel
            authStatus={authStatus}
            isLoading={isLoading}
            onLogin={() => setShowAuthDialog(true)}
            onLogout={logout}
          />

          <WarningAlert />
        </CardContent>
      </Card>

      <TelegramAuth
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={() => {
          loadStatus();
          setShowAuthDialog(false);
        }}
      />
    </>
  );
}
