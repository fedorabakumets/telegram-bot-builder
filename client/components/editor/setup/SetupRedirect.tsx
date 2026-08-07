/**
 * @fileoverview Редирект с /setup на /projects после завершения первоначальной настройки
 * @module components/editor/setup/SetupRedirect
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

/**
 * Перенаправляет с /setup на /projects.
 * Используется только когда setup уже пройден (внутри AuthGuard).
 *
 * @returns JSX элемент: спиннер на время редиректа
 */
export function SetupRedirect() {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate('/projects', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
