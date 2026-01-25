/**
 * Тестовая страница для проверки шаблонов
 * 
 * Простая страница для демонстрации работы всех трёх шаблонов
 */

import React from 'react';
import { DashboardLayout } from './DashboardLayout';
import { EditorLayout } from './EditorLayout';
import { AuthLayout } from './AuthLayout';

export const TestDashboard: React.FC = () => {
  return (
    <DashboardLayout pageTitle="Тест Dashboard">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Dashboard Layout работает!</h1>
        <p className="text-muted-foreground">Это тестовая страница для проверки DashboardLayout.</p>
      </div>
    </DashboardLayout>
  );
};

export const TestEditor: React.FC = () => {
  return (
    <EditorLayout
      toolbar={
        <div className="flex items-center gap-4">
          <span className="font-semibold">Редактор ботов</span>
        </div>
      }
    >
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Editor Layout работает!</h1>
          <p className="text-muted-foreground">Это тестовая страница для проверки EditorLayout.</p>
        </div>
      </div>
    </EditorLayout>
  );
};

export const TestAuth: React.FC = () => {
  return (
    <AuthLayout
      title="Вход в систему"
      subtitle="Тестовая страница авторизации"
    >
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Auth Layout работает!</h1>
          <p className="text-muted-foreground">Это тестовая страница для проверки AuthLayout.</p>
        </div>
      </div>
    </AuthLayout>
  );
};