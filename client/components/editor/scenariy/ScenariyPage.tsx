/**
 * @fileoverview Главная страница сценариев — layout и композиция
 * @module client/components/editor/scenariy/ScenariyPage
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/queryClient';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { isGuest } from '@/types/telegram-user';
import { cn } from '@/utils/utils';
import { useVseStsenary, useRekomenduemyeStsenary, useMoiStsenary } from './hooks/use-scenariy-zaprosy';
import { useIspolzovatStsenary, useUdalitStsenary } from './hooks/use-scenariy-mutatsii';
import { useScenariyFiltry } from './hooks/use-scenariy-filtry';
import { TemplateFilters } from './components/TemplateFilters';
import { TemplateTabs } from './components/TemplateTabs';
import { TemplateDeleteDialog } from './components/TemplateDeleteDialog';
import { ScenariyPageHeader } from './ScenariyPageHeader';
import { ScenariyLearnPanel, useScenariyLearn } from './learn';
import type { SortBy, TabValue } from './types/scenariy-tipy';
import type { BotTemplate } from '@shared/schema';

/**
 * Страница сценариев ботов
 * @returns JSX элемент страницы
 */
export default function ScenariyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState<TabValue>('all');
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [templateToDelete, setTemplateToDelete] = useState<BotTemplate | null>(null);

  const { user, sessionReady } = useTelegramAuth();
  const isGuestUser = !user || isGuest(user);
  const userId = isGuestUser ? 'anon' : (user as { id: number }).id;

  const { data: activeProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['/api/projects/list', userId, 'active'],
    queryFn: () => apiRequest('GET', '/api/projects/list?archived=false'),
    enabled: sessionReady && !isGuestUser,
  });

  /** Пока сессия/проекты не готовы — не мигаем каталогом и обучением */
  const awaitingGate =
    !sessionReady || (sessionReady && !isGuestUser && loadingProjects);

  const isOnboarding =
    !awaitingGate && !isGuestUser && activeProjects.length === 0;

  const backLabel: 'back' | 'editor' | 'pending' = awaitingGate
    ? 'pending'
    : isOnboarding || isGuestUser
      ? 'back'
      : 'editor';

  const learn = useScenariyLearn(isOnboarding);

  const { data: templates = [], isLoading, isError } = useVseStsenary();
  const { data: featuredTemplates = [], isLoading: isLoadingFeatured, isError: isFeaturedError } =
    useRekomenduemyeStsenary(currentTab === 'featured');
  const { data: myTemplates = [], isLoading: isLoadingMy, isError: isMyError } = useMoiStsenary();

  const { handleUseTemplate } = useIspolzovatStsenary();
  const deleteMutation = useUdalitStsenary();

  const filteredTemplates = useScenariyFiltry({
    templates, featuredTemplates, myTemplates,
    currentTab, searchTerm, selectedCategory, sortBy,
  });

  useEffect(() => {
    if (learn.focusTab) setCurrentTab(learn.focusTab);
  }, [learn.focusTab]);

  const handleDeleteRequest = (template: BotTemplate) => setTemplateToDelete(template);

  const handleDeleteConfirm = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete.id);
      setTemplateToDelete(null);
    }
  };

  if (isError || isFeaturedError || isMyError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Ошибка загрузки сценариев</h2>
          <p className="text-muted-foreground mb-4">Обновите страницу и попробуйте снова.</p>
          <Button onClick={() => window.location.reload()}>Обновить страницу</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ScenariyPageHeader
        backLabel={backLabel}
        learnActive={learn.active}
        onStartLearn={learn.restart}
      />

      <div className="container mx-auto px-4 py-6">
        {awaitingGate ? (
          <div className="flex justify-center py-16" aria-busy="true">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-3 xs:space-y-4 sm:space-y-4">
              {learn.active ? (
                <ScenariyLearnPanel
                  step={learn.step}
                  stepNumber={learn.stepNumber}
                  totalSteps={learn.totalSteps}
                  lineReady={learn.lineReady}
                  isLast={learn.isLast}
                  isFirst={learn.isFirst}
                  onLineDone={learn.markLineReady}
                  onNext={learn.goNext}
                  onBack={learn.goBack}
                  onSkip={learn.skip}
                />
              ) : null}

              <div
                className={cn(
                  'transition-all duration-500',
                  learn.showFilters
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 max-h-0 overflow-hidden pointer-events-none',
                )}
              >
                <TemplateFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              </div>

              <TemplateTabs
                currentTab={currentTab}
                onTabChange={setCurrentTab}
                templates={filteredTemplates}
                isLoading={isLoading}
                isLoadingFeatured={isLoadingFeatured}
                isLoadingMy={isLoadingMy}
                onUse={handleUseTemplate}
                onDelete={handleDeleteRequest}
                guideMode={learn.active}
                visibleTabCount={learn.visibleTabs}
                showCards={learn.showCards}
              />
            </div>
          </div>
        )}
      </div>

      <TemplateDeleteDialog
        template={templateToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTemplateToDelete(null)}
      />
    </div>
  );
}
