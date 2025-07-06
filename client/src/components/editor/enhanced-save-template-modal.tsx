import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { X, Tag, Save, Loader2, Sparkles, Zap, Clock, Settings, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTemplateAutoSave } from '@/hooks/use-template-autosave';
import { TemplateAutoSaveIndicator } from '@/components/ui/template-autosave-indicator';
import type { BotData } from '@/types/bot';

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  requiresToken: boolean;
  complexity: number;
  estimatedTime: number;
}

interface EnhancedSaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  botData: BotData;
  projectName?: string;
  existingTemplateId?: number;
  onTemplateSaved?: (templateId: number) => void;
}

export function EnhancedSaveTemplateModal({ 
  isOpen, 
  onClose, 
  botData, 
  projectName,
  existingTemplateId,
  onTemplateSaved
}: EnhancedSaveTemplateModalProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: projectName ? `${projectName} - Шаблон` : 'Новый шаблон',
    description: '',
    category: 'custom',
    tags: [],
    isPublic: false,
    difficulty: 'easy',
    language: 'ru',
    requiresToken: true,
    complexity: 1,
    estimatedTime: 5,
  });
  
  const [newTag, setNewTag] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [instantSaveMode, setInstantSaveMode] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const {
    triggerAutoSave,
    forceSave,
    resetAutoSave,
    setExistingTemplateId,
    getAutoSaveState,
    isSaving,
    isCreating,
    lastSaved,
    hasUnsavedChanges,
    templateId,
  } = useTemplateAutoSave(botData, formData, {
    enabled: autoSaveEnabled,
    instantSave: instantSaveMode,
    delay: instantSaveMode ? 0 : 800,
    showToasts: true,
    onSaveSuccess: (id) => {
      onTemplateSaved?.(id);
    }
  });

  // Установка существующего ID шаблона для редактирования
  useEffect(() => {
    if (existingTemplateId) {
      setExistingTemplateId(existingTemplateId);
    }
  }, [existingTemplateId, setExistingTemplateId]);

  // Автосохранение при изменении данных
  useEffect(() => {
    if (autoSaveEnabled && isOpen) {
      triggerAutoSave();
    }
  }, [formData, botData, autoSaveEnabled, isOpen, triggerAutoSave]);

  const resetForm = () => {
    setFormData({
      name: projectName ? `${projectName} - Шаблон` : 'Новый шаблон',
      description: '',
      category: 'custom',
      tags: [],
      isPublic: false,
      difficulty: 'easy',
      language: 'ru',
      requiresToken: true,
      complexity: 1,
      estimatedTime: 5,
    });
    setNewTag('');
    resetAutoSave();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleManualSave = () => {
    forceSave();
  };

  const handleClose = () => {
    if (hasUnsavedChanges && autoSaveEnabled) {
      forceSave();
    }
    onClose();
  };

  const categories = [
    { value: 'custom', label: 'Пользовательский', icon: '👤' },
    { value: 'business', label: 'Бизнес', icon: '💼' },
    { value: 'entertainment', label: 'Развлечения', icon: '🎉' },
    { value: 'education', label: 'Образование', icon: '📚' },
    { value: 'utility', label: 'Утилиты', icon: '🔧' },
    { value: 'games', label: 'Игры', icon: '🎮' },
  ];

  const difficultyOptions = [
    { value: 'easy', label: 'Легкий', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    { value: 'medium', label: 'Средний', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
    { value: 'hard', label: 'Сложный', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  ];

  const selectedDifficulty = difficultyOptions.find(d => d.value === formData.difficulty);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span>{existingTemplateId ? 'Редактировать шаблон' : 'Сохранить как шаблон'}</span>
            </DialogTitle>
            
            <div className="flex items-center space-x-2">
              <TemplateAutoSaveIndicator
                isSaving={isSaving}
                isCreating={isCreating}
                lastSaved={lastSaved}
                hasUnsavedChanges={hasUnsavedChanges}
                templateId={templateId}
                instantMode={instantSaveMode}
                showLabel={false}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Создайте шаблон для повторного использования вашего бота</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={autoSaveEnabled}
                  onCheckedChange={setAutoSaveEnabled}
                  size="sm"
                />
                <Label className="text-xs">Автосохранение</Label>
              </div>
              
              {autoSaveEnabled && (
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={instantSaveMode}
                    onCheckedChange={setInstantSaveMode}
                    size="sm"
                  />
                  <Label className="text-xs flex items-center space-x-1">
                    <Zap className="h-3 w-3" />
                    <span>Мгновенно</span>
                  </Label>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Основное</span>
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Детали</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>Дополнительно</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название шаблона *</Label>
                  <Input
                    id="name"
                    placeholder="Введите название шаблона"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Категория</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center space-x-2">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  placeholder="Опишите функциональность вашего бота..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[100px] focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label>Теги</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Добавить тег..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleAddTag} variant="outline" size="sm">
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Сложность</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select 
                      value={formData.difficulty} 
                      onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                        setFormData(prev => ({ ...prev, difficulty: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {difficultyOptions.map((diff) => (
                          <SelectItem key={diff.value} value={diff.value}>
                            <Badge className={diff.color} variant="secondary">
                              {diff.label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Язык</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select 
                      value={formData.language} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                        <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Уровень сложности</CardTitle>
                    <CardDescription className="text-xs">От 1 (простой) до 10 (сложный)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Slider
                        value={[formData.complexity]}
                        onValueChange={([value]) => setFormData(prev => ({ ...prev, complexity: value }))}
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-center">
                        <Badge variant="outline" className="text-sm">
                          {formData.complexity}/10
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Время настройки</CardTitle>
                    <CardDescription className="text-xs">Примерное время в минутах</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Slider
                        value={[formData.estimatedTime]}
                        onValueChange={([value]) => setFormData(prev => ({ ...prev, estimatedTime: value }))}
                        max={120}
                        min={1}
                        step={5}
                        className="w-full"
                      />
                      <div className="text-center">
                        <Badge variant="outline" className="text-sm flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formData.estimatedTime} мин</span>
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Дополнительные настройки</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Публичный шаблон</Label>
                        <p className="text-xs text-muted-foreground">
                          Разрешить другим пользователям использовать этот шаблон
                        </p>
                      </div>
                      <Switch
                        checked={formData.isPublic}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Требует токен</Label>
                        <p className="text-xs text-muted-foreground">
                          Для работы бота необходим Telegram Bot Token
                        </p>
                      </div>
                      <Switch
                        checked={formData.requiresToken}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresToken: checked }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Статистика шаблона */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Статистика шаблона</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {botData.nodes?.length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Узлов</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {botData.connections?.length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Связей</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {formData.tags.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Тегов</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <TemplateAutoSaveIndicator
              isSaving={isSaving}
              isCreating={isCreating}
              lastSaved={lastSaved}
              hasUnsavedChanges={hasUnsavedChanges}
              templateId={templateId}
              instantMode={instantSaveMode}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Закрыть
            </Button>
            
            {!autoSaveEnabled && (
              <Button 
                onClick={handleManualSave}
                disabled={isSaving || !formData.name.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCreating ? 'Создание...' : 'Сохранение...'}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {existingTemplateId ? 'Обновить' : 'Сохранить'}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}