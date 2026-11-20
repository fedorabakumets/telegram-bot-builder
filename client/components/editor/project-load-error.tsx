/** @fileoverview Повторная загрузка существующего проекта после временного сбоя или истечения сессии. */
import { Button } from '@/components/ui/button';
/** Показывает ошибку загрузки без утверждения об удалении проекта. @returns Панель повторной загрузки. */
export function ProjectLoadFailure() {
  return <div className="flex min-h-screen items-center justify-center bg-background p-4">
    <div className="w-full max-w-md space-y-3 rounded-xl border border-border p-6">
      <h1 className="text-xl font-semibold">Не удалось загрузить проект</h1>
      <p className="text-sm text-muted-foreground">Проверьте соединение и повторите загрузку. Возможно, сервер перезапускался или нужно обновить сессию.</p>
      <Button variant="outline" onClick={() => window.location.reload()}>Повторить загрузку</Button>
    </div>
  </div>;
}
