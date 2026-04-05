/**
 * @fileoverview Главная страница сценариев — только layout и композиция компонентов
 * @module client/components/editor/scenariy/ScenariyPage
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useVseStsenary, useRekomenduemyeStsenary, useMoiStsenary } from './hooks/use-scenariy-zaprosy';
import { useIspolzovatStsenary, useUdalitStsenary } from './hooks/use-scenariy-mutatsii';
import { useScenariyFiltry } from './hooks/use-scenariy-filtry';
import { TemplateFilters } from './components/TemplateFilters';
import { TemplateTabs } from './components/TemplateTabs';
import { TemplateDeleteDialog } from './components/TemplateDeleteDialog';
import type { SortBy, TabValue } from './types/scenariy-tipy';
import type { BotTemplate } from '@shared/schema';

/**
 * Страница сценариев ботов — layout + композиция всех дочерних компонентов
 * @returns JSX элемент страницы
 */
export default function ScenariyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState<TabValue>('all');
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [templateToDelete, setTemplateToDelete] = useState<BotTemplate | null>(null);

  const { data: templates = [], isLoading, isError } = useVseStsenary();
  const { data: featuredTemplates = [], isLoading: isLoadingFeatured, isError: isFeaturedError } = useRekomenduemyeStsenary(currentTab === 'featured');
  const { data: myTemplates = [], isLoading: isLoadingMy, isError: isMyError } = useMoiStsenary();

  const { handleUseTemplate } = useIspolzovatStsenary();
  const deleteMutation = useUdalitStsenary();

  const filteredTemplates = useScenariyFiltry({
    templates, featuredTemplates, myTemplates,
    currentTab, searchTerm, selectedCategory, sortBy,
  });

  /**
   * Открывает диалог подтверждения удаления
   * @param template - сценарий для удаления
   */
  const handleDeleteRequest = (template: BotTemplate) => {
    setTemplateToDelete(template);
  };

  /**
   * Подтверждает удаление выбранного сценария
   */
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
          <p className="text-muted-foreground mb-4">Произошла ошибка при загрузке. Пожалуйста, обновите страницу.</p>
          <Button onClick={() => window.location.reload()}>Обновить страницу</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />Назад к редактору
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Сценарии ботов</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="space-y-3 xs:space-y-4 sm:space-y-4">
              <TemplateFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
              <TemplateTabs
                currentTab={currentTab}
                onTabChange={setCurrentTab}
                templates={filteredTemplates}
                isLoading={isLoading}
                isLoadingFeatured={isLoadingFeatured}
                isLoadingMy={isLoadingMy}
                onUse={handleUseTemplate}
                onDelete={handleDeleteRequest}
              />
            </div>
          </div>
        </div>
      </div>

      <TemplateDeleteDialog
        template={templateToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTemplateToDelete(null)}
      />
    </div>
  );
}
