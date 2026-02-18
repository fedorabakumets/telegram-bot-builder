/**
 * @fileoverview Компонент отображения ошибки 404 для несуществующего проекта
 *
 * Этот компонент показывает пользователю красивое сообщение о том, что проект не найден,
 * и предлагает варианты действий: перейти к существующим проектам или создать новый.
 *
 * @module ProjectNotFound
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';

/**
 * Компонент отображения ошибки 404 для несуществующего проекта
 *
 * @returns {JSX.Element} Компонент с сообщением об ошибке и кнопками навигации
 */
export function ProjectNotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📁</span>
          </div>
          <CardTitle className="text-2xl">Проект не найден</CardTitle>
          <CardDescription>
            Проект с таким ID не существует или был удален
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button 
            className="w-full" 
            onClick={() => setLocation('/')}
          >
            <i className="fas fa-list mr-2"></i>
            К списку проектов
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setLocation('/')}
          >
            <i className="fas fa-plus mr-2"></i>
            Создать новый проект
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/')}
          >
            На главную
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
