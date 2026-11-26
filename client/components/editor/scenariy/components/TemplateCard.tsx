/**
 * @fileoverview Компонент одной карточки сценария
 * @module client/components/editor/scenariy/components/TemplateCard
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Trash2, Sparkles, Eye, Users, Globe, Lock } from 'lucide-react';
import { cn } from '@/utils/utils';
import { getCategoryLabel } from '../utils/scenariy-kategorii';
import type { TemplateCardProps } from '../types/scenariy-tipy';

/**
 * Карточка одного сценария с кнопками действий
 * @param props - свойства компонента
 * @returns JSX элемент карточки
 */
export function TemplateCard({
  template,
  onUse,
  showDelete,
  onDelete,
  animateButton = false,
  buttonDelayMs = 0,
}: TemplateCardProps) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card dark:bg-transparent dark:border-white/10 dark:hover:border-white/20 shadow-none transition-colors hover:border-foreground/25">

      <CardHeader className="p-5 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="break-words text-base font-normal leading-snug tracking-tight">
              {template.name}
            </CardTitle>
            <div className="flex items-center flex-wrap gap-1.5 mt-2">
              {template.ownerId === null ? (
                <>
                  <Badge variant="default" className="border border-border bg-transparent text-muted-foreground dark:border-[#354159] dark:text-[#b8c5db] text-xs font-normal">
                    <Globe className="w-2.5 h-2.5 mr-1 hidden xs:inline text-emerald-700 dark:text-emerald-400" />Официальный
                  </Badge>
                  <Badge variant="outline" className="border border-border bg-transparent text-muted-foreground dark:border-[#354159] dark:text-[#b8c5db] text-xs font-normal">
                    {getCategoryLabel(template.category ?? 'official')}
                  </Badge>
                </>
              ) : template.authorName ? (
                <Badge variant="secondary" className="border border-border bg-transparent text-muted-foreground dark:border-[#354159] dark:text-[#b8c5db] text-xs font-normal">
                  <Users className="w-2.5 h-2.5 mr-1 hidden xs:inline text-violet-700 dark:text-violet-400" />От @{template.authorName}
                </Badge>
              ) : (
                <Badge variant="secondary" className="border border-border bg-transparent text-muted-foreground dark:border-[#354159] dark:text-[#b8c5db] text-xs font-normal">
                  <Users className="w-2.5 h-2.5 mr-1 hidden xs:inline text-violet-700 dark:text-violet-400" />От сообщества
                </Badge>
              )}
              {showDelete && (
                <Badge variant={template.isPublic === 1 ? 'outline' : 'secondary'} className={`text-xs font-normal ${template.isPublic === 1 ? 'border-green-200/50 dark:border-green-800/50 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                  {template.isPublic === 1 ? <Globe className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" /> : <Lock className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />}
                  <span className="ml-1">{template.isPublic === 1 ? 'Публичный' : 'Приватный'}</span>
                </Badge>
              )}
            </div>
          </div>
          {(template.rating ?? 0) > 0 && (
            <div className="flex items-center gap-1 ml-auto flex-shrink-0 bg-transparent px-2 py-1.5 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50">
              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
              <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300">{(template.rating ?? 0).toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-2">
        {template.description && (
          <CardDescription className="line-clamp-3 break-words text-sm leading-relaxed text-muted-foreground">
            {template.description}
          </CardDescription>
        )}
        <div className="space-y-2.5 mt-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5 flex-shrink-0 text-sky-700 dark:text-sky-400" />
            <span className="font-normal">{template.useCount ?? 0}</span>
            <span className="text-muted-foreground">использований</span>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className={cn(
                'flex-1 h-9 border-0 bg-transparent text-foreground hover:bg-transparent hover:text-violet-700 focus-visible:text-violet-700 dark:hover:text-violet-400 dark:focus-visible:text-violet-400 text-sm font-normal shadow-none',
                animateButton &&
                  'animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both',
              )}
              style={
                animateButton ? { animationDelay: `${buttonDelayMs}ms` } : undefined
              }
              onClick={() => onUse(template)}
              data-testid="button-use-template"
            >
              <Sparkles className="w-3 h-3 mr-1.5 text-violet-700 dark:text-violet-400" />
              Использовать
            </Button>
            {showDelete && (
              <Button size="sm" variant="outline" onClick={() => onDelete(template)} className="h-9 xs:h-10 px-2.5 border-red-200/50 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all" aria-label={`Удалить шаблон «${template.name}»`} data-testid="button-delete-template">
                <Trash2 className="h-3.5 w-3.5 text-rose-700 dark:text-rose-400" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
