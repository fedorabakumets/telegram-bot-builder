/**
 * @fileoverview Компонент одной карточки сценария
 * @module client/components/editor/scenariy/components/TemplateCard
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Trash2, Sparkles, Eye, Users, Globe, Lock } from 'lucide-react';
import { getCategoryLabel } from '../utils/scenariy-kategorii';
import type { TemplateCardProps } from '../types/scenariy-tipy';

/**
 * Карточка одного сценария с кнопками действий
 * @param props - свойства компонента
 * @returns JSX элемент карточки
 */
export function TemplateCard({ template, onUse, showDelete, onDelete }: TemplateCardProps) {
  return (
    <Card className="group border border-border/40 shadow-sm hover:shadow-lg hover:border-border/70 transition-all duration-300 flex flex-col h-full overflow-hidden bg-gradient-to-br from-card/60 to-card/40 dark:from-card/50 dark:to-card/30 hover:from-blue-500/5 hover:to-cyan-500/5 dark:hover:from-blue-900/10 dark:hover:to-cyan-900/10 hover:scale-105">
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-30 bg-gradient-to-br from-blue-500/10 to-transparent transition-opacity duration-300 rounded-lg" />

      <CardHeader className="pb-2.5 xs:pb-3 sm:pb-4 relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm xs:text-base sm:text-lg font-bold leading-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {template.name}
            </CardTitle>
            <div className="flex items-center flex-wrap gap-1.5 mt-2">
              {template.ownerId === null ? (
                <>
                  <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold shadow-sm">
                    <Globe className="w-2.5 h-2.5 mr-1 hidden xs:inline" />Официальный
                  </Badge>
                  <Badge variant="outline" className="text-xs font-medium border-blue-200/50 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                    {getCategoryLabel(template.category ?? 'official')}
                  </Badge>
                </>
              ) : template.authorName ? (
                <Badge variant="secondary" className="text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  <Users className="w-2.5 h-2.5 mr-1 hidden xs:inline" />От @{template.authorName}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                  <Users className="w-2.5 h-2.5 mr-1 hidden xs:inline" />От сообщества
                </Badge>
              )}
              {showDelete && (
                <Badge variant={template.isPublic === 1 ? 'outline' : 'secondary'} className={`text-xs font-medium ${template.isPublic === 1 ? 'border-green-200/50 dark:border-green-800/50 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                  {template.isPublic === 1 ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                  <span className="ml-1 hidden xs:inline">{template.isPublic === 1 ? 'Публичный' : 'Приватный'}</span>
                </Badge>
              )}
            </div>
          </div>
          {(template.rating ?? 0) > 0 && (
            <div className="flex items-center gap-1 ml-auto flex-shrink-0 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 px-2 py-1.5 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50">
              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
              <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300">{(template.rating ?? 0).toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 p-3 xs:p-3.5 sm:p-4 relative z-10">
        {template.description && (
          <CardDescription className="text-xs xs:text-sm line-clamp-2 flex-1 text-muted-foreground group-hover:text-foreground/70 transition-colors">
            {template.description}
          </CardDescription>
        )}
        <div className="space-y-2.5 mt-auto">
          <div className="flex items-center gap-2 text-xs xs:text-sm text-muted-foreground bg-gradient-to-r from-muted/50 to-muted/30 dark:from-muted/30 dark:to-muted/10 rounded-lg px-2.5 py-2 border border-border/20 group-hover:border-border/40 transition-all">
            <Eye className="h-3.5 w-3.5 flex-shrink-0 text-blue-500/70" />
            <span className="font-medium">{template.useCount ?? 0}</span>
            <span className="text-muted-foreground/60">использований</span>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1 h-9 xs:h-10 text-xs xs:text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-sm hover:shadow-md transition-all group-hover:scale-105" onClick={() => onUse(template)} data-testid="button-use-template">
              <Sparkles className="w-3 h-3 mr-1.5" />Использовать
            </Button>
            {showDelete && (
              <Button size="sm" variant="outline" onClick={() => onDelete(template)} className="h-9 xs:h-10 px-2.5 border-red-200/50 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all" data-testid="button-delete-template">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
