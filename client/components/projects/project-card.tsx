/**
 * @fileoverview Карточка проекта на account-level странице
 * @module components/projects/project-card
 */

import { Calendar, Download, Edit3, MoreHorizontal, Network, Star, Users } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { BotProject } from '@shared/schema';

/** Свойства карточки проекта */
export interface ProjectCardProps {
  /** Проект из API */
  project: BotProject;
  /** Количество нод */
  nodeCount: number;
  /** Количество листов */
  sheetsCount: number;
  /** Отформатированная дата изменения */
  updatedAt: string;
  /** Обработчик удаления */
  onDelete: (project: BotProject) => void;
  /** Вид отображения */
  view: 'grid' | 'list';
}

/**
 * Отображает проект с быстрыми действиями и статусом
 * @param props - Свойства карточки
 * @returns JSX элемент
 */
export function ProjectCard({ project, nodeCount, sheetsCount, updatedAt, onDelete, view }: ProjectCardProps) {
  const isList = view === 'list';
  return (
    <Card className="group border-border/70 bg-card/70 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className={isList ? 'flex items-center gap-4 p-4' : 'p-5'}>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <Badge variant="secondary" className="text-[10px] font-medium">Активный проект</Badge>
              </div>
              <h3 className="truncate text-lg font-semibold tracking-tight">{project.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description || 'Telegram-бот без описания'}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground">
              <Star className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Network className="h-3.5 w-3.5" />{nodeCount} узлов</span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Пользователи — пока нет данных</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{updatedAt}</span>
            <span>{sheetsCount} {sheetsCount === 1 ? 'лист' : sheetsCount < 5 ? 'листа' : 'листов'}</span>
          </div>
        </div>
        <div className={isList ? 'flex shrink-0 items-center gap-2' : 'mt-5 flex items-center gap-2'}>
          <Link href={`/editor/${project.id}`} className={isList ? '' : 'flex-1'}>
            <Button className={isList ? 'h-9' : 'w-full'}><Edit3 className="mr-2 h-4 w-4" />Открыть</Button>
          </Link>
          <Link href={`/editor/${project.id}?tab=export`}>
            <Button variant="outline" size="icon" className="h-9 w-9"><Download className="h-4 w-4" /></Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => onDelete(project)} title="Удалить проект">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
