/**
 * @fileoverview Компонент для отображения информации о токенах проекта с использованием React Query
 * Отображает список токенов, связанных с проектом
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Key } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BotToken } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface TokenInfoProps {
  /** ID проекта */
  projectId: number;
}

/**
 * Компонент для отображения информации о токенах проекта с использованием React Query
 * 
 * @component
 * @param {TokenInfoProps} props - Свойства компонента
 * @param {number} props.projectId - ID проекта
 * @returns {JSX.Element} Компонент информации о токенах
 */
export function TokenInfo({ projectId }: TokenInfoProps) {
  const { data: tokens = [], isLoading, isError } = useQuery<BotToken[]>({
    queryKey: [`/api/projects/${projectId}/tokens`],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/tokens`),
    staleTime: 30000, // 30 секунд
  });

  if (isLoading) {
    return (
      <Card className="border border-border/30 bg-muted/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">
              Токены проекта {projectId}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground italic">
            Загрузка токенов...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border border-border/30 bg-muted/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">
              Токены проекта {projectId}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">
            Ошибка загрузки токенов
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/30 bg-muted/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">
            Токены проекта {projectId}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {tokens.length > 0 ? (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between p-2 bg-background rounded-md border">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">ID: {token.id}</div>
                    {token.botUsername && (
                      <div className="text-xs text-muted-foreground">@{token.botUsername}</div>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {token.botFirstName || 'Бот'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">
            Нет связанных токенов
          </div>
        )}
      </CardContent>
    </Card>
  );
}