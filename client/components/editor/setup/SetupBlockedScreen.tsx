/**
 * @fileoverview Экран блокировки при незавершённом setup без ADMIN_API_KEY
 * @module components/editor/setup/SetupBlockedScreen
 */

/**
 * Статический экран: оператор должен задать ADMIN_API_KEY и перезапустить сервер.
 * @returns JSX элемент с инструкцией
 */
export function SetupBlockedScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="text-xl font-semibold text-foreground">
          Платформа не настроена
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Первоначальная настройка выполняется через панель оператора. Задайте{' '}
          <code className="text-foreground">ADMIN_API_KEY</code> в файле{' '}
          <code className="text-foreground">.env</code>, перезапустите сервер и
          откройте <code className="text-foreground">/admin</code>.
        </p>
        <p className="text-xs text-muted-foreground">
          Сгенерировать ключ:{' '}
          <code className="text-foreground">openssl rand -hex 32</code>
        </p>
      </div>
    </div>
  );
}
