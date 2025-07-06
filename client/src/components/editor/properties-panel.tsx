import { Node, Button } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button as UIButton } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { validateCommand, getCommandSuggestions, STANDARD_COMMANDS } from '@/lib/commands';
import { EnhancedInlineKeyboard } from './enhanced-inline-keyboard';
import { useState, useMemo, useEffect } from 'react';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  allNodes?: Node[];
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  onButtonAdd: (nodeId: string, button: Button) => void;
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  onButtonDelete: (nodeId: string, buttonId: string) => void;
  onInlineButtonAdd?: (nodeId: string, button: Button) => void;
  onInlineButtonUpdate?: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  onInlineButtonDelete?: (nodeId: string, buttonId: string) => void;
}

export function PropertiesPanel({ 
  selectedNode,
  allNodes = [],
  onNodeUpdate, 
  onButtonAdd, 
  onButtonUpdate, 
  onButtonDelete,
  onInlineButtonAdd,
  onInlineButtonUpdate,
  onInlineButtonDelete
}: PropertiesPanelProps) {
  const { toast } = useToast();
  const [commandInput, setCommandInput] = useState('');
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);

  // Автоматическая инициализация дефолтных значений для фото узлов
  useEffect(() => {
    if (selectedNode && selectedNode.type === 'photo') {
      const missingDefaults: Partial<Node['data']> = {};
      
      if (selectedNode.data.sendAsDocument === undefined) {
        missingDefaults.sendAsDocument = false;
      }
      if (selectedNode.data.hasContentProtection === undefined) {
        missingDefaults.hasContentProtection = true;
      }
      if (selectedNode.data.disableWebPagePreview === undefined) {
        missingDefaults.disableWebPagePreview = false;
      }
      
      // Обновляем узел только если есть отсутствующие значения
      if (Object.keys(missingDefaults).length > 0) {
        onNodeUpdate(selectedNode.id, missingDefaults);
      }
    }
  }, [selectedNode?.id, selectedNode?.type]);

  // Валидация команды
  const commandValidation = useMemo(() => {
    if (selectedNode && (selectedNode.type === 'start' || selectedNode.type === 'command')) {
      return validateCommand(selectedNode.data.command || '');
    }
    return { isValid: true, errors: [] };
  }, [selectedNode?.data.command]);

  // Автодополнение команд
  const commandSuggestions = useMemo(() => {
    if (commandInput.length > 0) {
      return getCommandSuggestions(commandInput);
    }
    return STANDARD_COMMANDS.slice(0, 5);
  }, [commandInput]);
  if (!selectedNode) {
    return (
      <aside className="w-full h-full bg-background border-l border-border flex flex-col">
        {/* Empty State Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center">
              <i className="fas fa-sliders-h text-muted-foreground text-sm"></i>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Свойства</h2>
              <p className="text-xs text-muted-foreground">Выберите элемент для настройки</p>
            </div>
          </div>
        </div>

        {/* Empty State Content */}
        <div className="flex-1 flex items-center justify-center p-8 empty-state-container">
          <div className="text-center max-w-xs">
            {/* Animated Icon */}
            <div className="relative mx-auto mb-6 empty-state-icon">
              <div className="w-16 h-16 empty-state-icon-bg rounded-2xl flex items-center justify-center mx-auto">
                <i className="fas fa-mouse-pointer text-muted-foreground text-xl transition-all duration-300 hover:text-primary hover:scale-110"></i>
              </div>
              {/* Enhanced pulse effect */}
              <div className="absolute inset-0 w-16 h-16 bg-primary/10 rounded-2xl pulse-primary"></div>
            </div>

            {/* Content */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-medium text-foreground gradient-text">Выберите элемент</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Нажмите на любой элемент в редакторе, чтобы увидеть его настройки здесь
              </p>
            </div>

            {/* Enhanced Help Tips */}
            <div className="space-y-3">
              <div className="flex items-center text-xs text-muted-foreground empty-state-tip floating-tip">
                <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                  <i className="fas fa-lightbulb text-primary text-xs"></i>
                </div>
                <span>Перетащите компоненты из левой панели</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground empty-state-tip floating-tip">
                <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                  <i className="fas fa-hand-pointer text-primary text-xs"></i>
                </div>
                <span>Кликните по элементу для настройки</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground empty-state-tip floating-tip">
                <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                  <i className="fas fa-magic text-primary text-xs"></i>
                </div>
                <span>Используйте предварительный просмотр для тестирования</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const nodeTypeNames = {
    start: '/start команда',
    command: 'Пользовательская команда',
    message: 'Текстовое сообщение',
    photo: 'Фото с текстом',
    keyboard: 'Клавиатура',
    condition: 'Условие',
    input: 'Ввод данных'
  };

  const nodeIcons = {
    start: 'fas fa-play',
    command: 'fas fa-terminal',
    message: 'fas fa-comment',
    photo: 'fas fa-image',
    keyboard: 'fas fa-keyboard',
    condition: 'fas fa-code-branch',
    input: 'fas fa-edit'
  };

  const nodeColors = {
    start: 'bg-green-100 text-green-600',
    command: 'bg-indigo-100 text-indigo-600',
    message: 'bg-blue-100 text-blue-600',
    photo: 'bg-purple-100 text-purple-600',
    keyboard: 'bg-amber-100 text-amber-600',
    condition: 'bg-red-100 text-red-600',
    input: 'bg-cyan-100 text-cyan-600'
  };

  const handleAddButton = () => {
    const newButton: Button = {
      id: nanoid(),
      text: 'Новая кнопка',
      action: 'goto',
      target: '',
      rowPosition: 0,
      style: 'default',
      width: 'auto',
      icon: undefined,
      url: undefined
    };
    onButtonAdd(selectedNode.id, newButton);
  };

  const handleAddInlineButton = () => {
    console.log('Adding inline button, current inlineButtons:', selectedNode.data.inlineButtons);
    const newButton: Button = {
      id: nanoid(),
      text: 'Новая inline кнопка',
      action: 'goto',
      target: '',
      rowPosition: 0,
      style: 'default',
      width: 'auto',
      icon: undefined,
      url: undefined
    };
    if (onInlineButtonAdd) {
      console.log('Calling onInlineButtonAdd with:', newButton);
      onInlineButtonAdd(selectedNode.id, newButton);
    } else {
      console.log('onInlineButtonAdd is not defined');
    }
  };

  const getNodeIcon = (type: string) => {
    const icons: Record<string, string> = {
      start: 'fas fa-play',
      message: 'fas fa-comment',
      photo: 'fas fa-image',
      keyboard: 'fas fa-keyboard',
      condition: 'fas fa-code-branch',
      input: 'fas fa-edit',
      command: 'fas fa-terminal'
    };
    return icons[type] || 'fas fa-circle';
  };

  const getNodeTitle = (node: Node) => {
    if (node.data.command) return node.data.command;
    if (node.data.messageText) return node.data.messageText.slice(0, 30) + (node.data.messageText.length > 30 ? '...' : '');
    return `${nodeTypeNames[node.type]} #${node.id.slice(0, 8)}`;
  };

  return (
    <aside className="w-full h-full bg-background border-l border-border flex flex-col">
      {/* Properties Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${nodeColors[selectedNode.type]}`}>
            <i className={`${nodeIcons[selectedNode.type]} text-sm`}></i>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">{nodeTypeNames[selectedNode.type]}</h2>
            <div className="flex items-center mt-1">
              <span className="text-xs text-muted-foreground">ID:</span>
              <code className="ml-1 px-2 py-0.5 bg-muted rounded text-xs font-mono text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedNode.id);
                      toast({
                        title: "ID скопирован!",
                        description: `ID "${selectedNode.id}" скопирован в буфер обмена`,
                      });
                    }}
                    title="Нажмите, чтобы скопировать">
                {selectedNode.id}
              </code>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Настройте параметры выбранного элемента</p>
      </div>

      {/* Properties Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Basic Settings */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Основные настройки</h3>
          <div className="space-y-4">
            {(selectedNode.type === 'start' || selectedNode.type === 'command') && (
              <>
                <div className="relative">
                  <Label className="text-xs font-medium text-muted-foreground">Команда</Label>
                  <div className="relative">
                    <Input
                      value={selectedNode.data.command || ''}
                      onChange={(e) => {
                        onNodeUpdate(selectedNode.id, { command: e.target.value });
                        setCommandInput(e.target.value);
                        setShowCommandSuggestions(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowCommandSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCommandSuggestions(false), 200)}
                      className={`mt-2 ${!commandValidation.isValid ? 'border-red-500' : ''}`}
                      placeholder="/start"
                    />
                    
                    {/* Автодополнение команд */}
                    {showCommandSuggestions && commandSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                        {commandSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b border-border last:border-b-0"
                            onClick={() => {
                              onNodeUpdate(selectedNode.id, { 
                                command: suggestion.command,
                                description: suggestion.description 
                              });
                              setShowCommandSuggestions(false);
                            }}
                          >
                            <div className="font-medium text-foreground">{suggestion.command}</div>
                            <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Ошибки валидации */}
                  {!commandValidation.isValid && commandValidation.errors.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {commandValidation.errors.map((error, index) => (
                        <div key={index} className="flex items-center text-xs text-red-600">
                          <i className="fas fa-exclamation-circle mr-1"></i>
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Описание</Label>
                  <Input
                    value={selectedNode.data.description || ''}
                    onChange={(e) => onNodeUpdate(selectedNode.id, { description: e.target.value })}
                    className="mt-2"
                    placeholder="Описание команды"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Используется для меню команд в @BotFather
                  </div>
                </div>
                
                {/* Синонимы команд */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Синонимы команды</Label>
                  <div className="mt-2 space-y-2">
                    {(selectedNode.data.synonyms || []).map((synonym, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={synonym}
                          onChange={(e) => {
                            const newSynonyms = [...(selectedNode.data.synonyms || [])];
                            newSynonyms[index] = e.target.value;
                            onNodeUpdate(selectedNode.id, { synonyms: newSynonyms });
                          }}
                          placeholder="Например: старт, привет, начать"
                          className="flex-1"
                        />
                        <UIButton
                          onClick={() => {
                            const newSynonyms = [...(selectedNode.data.synonyms || [])];
                            newSynonyms.splice(index, 1);
                            onNodeUpdate(selectedNode.id, { synonyms: newSynonyms });
                          }}
                          variant="outline"
                          size="sm"
                          className="px-2 py-1"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </UIButton>
                      </div>
                    ))}
                    <UIButton
                      onClick={() => {
                        const newSynonyms = [...(selectedNode.data.synonyms || []), ''];
                        onNodeUpdate(selectedNode.id, { synonyms: newSynonyms });
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <i className="fas fa-plus mr-2 text-xs"></i>
                      Добавить синоним
                    </UIButton>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Текстовые сообщения, которые будут вызывать эту команду. Например: "старт" вместо "/start"
                  </div>
                </div>
              </>
            )}

            {selectedNode.type === 'photo' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">URL изображения</Label>
                  <div className="relative">
                    <Input
                      value={selectedNode.data.imageUrl || ''}
                      onChange={(e) => onNodeUpdate(selectedNode.id, { imageUrl: e.target.value })}
                      className="mt-2 pr-10"
                      placeholder="https://example.com/image.jpg"
                    />
                    {selectedNode.data.imageUrl && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-1">
                        {selectedNode.data.imageUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? (
                          <i className="fas fa-check-circle text-green-500 text-sm"></i>
                        ) : (
                          <i className="fas fa-exclamation-triangle text-yellow-500 text-sm"></i>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Поддерживаются: JPG, PNG, GIF, WebP, BMP. Максимум 20 МБ
                  </div>
                  {selectedNode.data.imageUrl && !selectedNode.data.imageUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center">
                      <i className="fas fa-info-circle mr-1"></i>
                      Убедитесь, что URL заканчивается расширением изображения
                    </div>
                  )}
                </div>
                
                {/* Превью изображения */}
                {selectedNode.data.imageUrl && (
                  <div className="relative">
                    <div className="flex items-center mb-3">
                      <div className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-2"></div>
                      <Label className="text-xs font-medium text-foreground">Превью изображения</Label>
                    </div>
                    <div className="mt-2 p-1 rounded-xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:via-pink-500/20 dark:to-indigo-500/20">
                      <div className="aspect-video bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-gray-900/80 dark:to-gray-800/80 rounded-lg flex items-center justify-center relative overflow-hidden border border-purple-200/30 dark:border-purple-700/30 backdrop-blur-sm">
                        <img 
                          src={selectedNode.data.imageUrl} 
                          alt="Превью фото" 
                          className="max-h-full max-w-full object-contain rounded transition-all duration-300 hover:scale-105 filter drop-shadow-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="fallback-icon hidden w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 flex items-center justify-center mb-4">
                            <i className="fas fa-exclamation-triangle text-red-500 dark:text-red-400 text-2xl"></i>
                          </div>
                          <span className="text-sm font-medium text-center">Ошибка загрузки изображения</span>
                          <span className="text-xs text-center mt-1 opacity-70">Проверьте корректность URL</span>
                        </div>
                        
                        {/* Декоративные элементы */}
                        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-purple-400/50 dark:bg-purple-500/50 animate-pulse"></div>
                        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-pink-400/50 dark:bg-pink-500/50 animate-pulse delay-75"></div>
                        <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-indigo-400/50 dark:bg-indigo-500/50 animate-pulse delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Дополнительные настройки фото */}
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-2"></div>
                    <Label className="text-xs font-medium text-foreground">Дополнительные настройки</Label>
                  </div>
                  <div className="mt-2 space-y-3">
                    <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-card/60 to-card/40 dark:from-gray-800/60 dark:to-gray-900/40 border border-border/50 dark:border-gray-700/50 hover:border-purple-500/30 dark:hover:border-purple-400/30 transition-all duration-300 hover:shadow-lg dark:hover:shadow-purple-500/10">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                          <i className="fas fa-file-image text-blue-600 dark:text-blue-400 text-sm"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm font-medium text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                            Отправлять без сжатия
                          </Label>
                          <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Сохранить оригинальное качество изображения
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Switch
                          checked={selectedNode.data.sendAsDocument ?? false}
                          onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { sendAsDocument: checked })}
                          className="photo-settings-switch blue-variant"
                        />
                      </div>
                    </div>
                    
                    <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-card/60 to-card/40 dark:from-gray-800/60 dark:to-gray-900/40 border border-border/50 dark:border-gray-700/50 hover:border-green-500/30 dark:hover:border-green-400/30 transition-all duration-300 hover:shadow-lg dark:hover:shadow-green-500/10">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                          <i className="fas fa-shield-alt text-green-600 dark:text-green-400 text-sm"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm font-medium text-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                            Защитить от пересылки
                          </Label>
                          <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Запретить сохранение и пересылку изображения
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Switch
                          checked={selectedNode.data.hasContentProtection ?? true}
                          onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { hasContentProtection: checked })}
                          className="photo-settings-switch green-variant"
                        />
                      </div>
                    </div>
                    
                    <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-card/60 to-card/40 dark:from-gray-800/60 dark:to-gray-900/40 border border-border/50 dark:border-gray-700/50 hover:border-orange-500/30 dark:hover:border-orange-400/30 transition-all duration-300 hover:shadow-lg dark:hover:shadow-orange-500/10">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                          <i className="fas fa-link text-orange-600 dark:text-orange-400 text-sm"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm font-medium text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                            Показывать превью ссылки
                          </Label>
                          <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Отображать превью при отправке URL-адресов
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Switch
                          checked={!(selectedNode.data.disableWebPagePreview ?? false)}
                          onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { disableWebPagePreview: !checked })}
                          className="photo-settings-switch orange-variant"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Содержимое сообщения</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Текст сообщения</Label>
              <Textarea
                value={selectedNode.data.messageText || ''}
                onChange={(e) => onNodeUpdate(selectedNode.id, { messageText: e.target.value })}
                className="mt-2 h-24 resize-none"
                placeholder="Введите текст сообщения..."
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Поддержка Markdown</Label>
              <Switch
                checked={selectedNode.data.markdown}
                onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { markdown: checked })}
              />
            </div>
          </div>
        </div>

        {/* Keyboard Settings */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Клавиатура</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Тип клавиатуры</Label>
              <Select
                value={selectedNode.data.keyboardType}
                onValueChange={(value: 'reply' | 'inline' | 'none') => 
                  onNodeUpdate(selectedNode.id, { keyboardType: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reply">Reply клавиатура</SelectItem>
                  <SelectItem value="inline">Inline кнопки</SelectItem>
                  <SelectItem value="none">Без клавиатуры</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Buttons List */}
            {selectedNode.data.keyboardType !== 'none' && (
              <div>


                {/* Enhanced Inline Keyboard */}
                {selectedNode.data.keyboardType === 'inline' && (
                  <EnhancedInlineKeyboard
                    selectedNode={selectedNode}
                    allNodes={allNodes || []}
                    onNodeUpdate={onNodeUpdate}
                    onInlineButtonUpdate={onInlineButtonUpdate}
                    onInlineButtonDelete={onInlineButtonDelete}
                  />
                )}

                {/* Reply buttons for reply mode */}
                {selectedNode.data.keyboardType === 'reply' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        {selectedNode.data.keyboardType === 'reply' ? 'Reply кнопки' : 'Кнопки'}
                      </Label>
                      <UIButton
                        size="sm"
                        variant="ghost"
                        onClick={handleAddButton}
                        className="text-xs text-primary hover:text-primary/80 font-medium h-auto p-1"
                      >
                        + Добавить
                      </UIButton>
                    </div>
                    <div className="space-y-2">
                      {selectedNode.data.buttons.map((button) => (
                    <div key={button.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Input
                          value={button.text}
                          onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { text: e.target.value })}
                          className="flex-1 text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Текст кнопки"
                        />
                        <UIButton
                          size="sm"
                          variant="ghost"
                          onClick={() => onButtonDelete(selectedNode.id, button.id)}
                          className="text-muted-foreground hover:text-destructive dark:text-muted-foreground dark:hover:text-destructive h-auto p-1 transition-colors duration-200"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </UIButton>
                      </div>
                      <Select
                        value={button.action}
                        onValueChange={(value: 'goto' | 'command' | 'url') =>
                          onButtonUpdate(selectedNode.id, button.id, { action: value })
                        }
                      >
                        <SelectTrigger className="w-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="goto">Перейти к экрану</SelectItem>
                          <SelectItem value="command">Выполнить команду</SelectItem>
                          <SelectItem value="url">Открыть ссылку</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {button.action === 'url' && (
                        <Input
                          value={button.url || ''}
                          onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { url: e.target.value })}
                          className="mt-2 text-xs"
                          placeholder="https://example.com"
                        />
                      )}
                      
                      {button.action === 'command' && (
                        <div className="mt-2 space-y-2">
                          <Select
                            value={button.target || ''}
                            onValueChange={(value) => onButtonUpdate(selectedNode.id, button.id, { target: value })}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Выберите команду" />
                            </SelectTrigger>
                            <SelectContent>
                              {allNodes
                                .filter(node => (node.type === 'start' || node.type === 'command') && node.data.command)
                                .map((node) => (
                                  <SelectItem key={node.id} value={node.data.command!}>
                                    <div className="flex items-center space-x-2">
                                      <i className={`${node.type === 'start' ? 'fas fa-play' : 'fas fa-terminal'} text-xs`}></i>
                                      <span>{node.data.command}</span>
                                      {node.data.description && (
                                        <span className="text-gray-500">- {node.data.description}</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              {STANDARD_COMMANDS.map((cmd) => (
                                <SelectItem key={cmd.command} value={cmd.command}>
                                  <div className="flex items-center space-x-2">
                                    <i className="fas fa-lightbulb text-yellow-500 text-xs"></i>
                                    <span>{cmd.command}</span>
                                    <span className="text-gray-500">- {cmd.description}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Input
                            value={button.target || ''}
                            onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { target: e.target.value })}
                            className="text-xs"
                            placeholder="Или введите команду вручную (например: /help)"
                          />
                          
                          {button.target && !button.target.startsWith('/') && (
                            <div className="flex items-center text-xs text-warning-foreground bg-warning/10 dark:bg-warning/5 border border-warning/20 dark:border-warning/10 p-2 rounded-md">
                              <svg className="w-3 h-3 mr-2 text-warning" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span>Команда должна начинаться с символа "/"</span>
                            </div>
                          )}
                        </div>
                      )}

                      {button.action === 'goto' && (
                        <div className="mt-2 space-y-2">
                          <Select
                            value={button.target || ''}
                            onValueChange={(value) => onButtonUpdate(selectedNode.id, button.id, { target: value })}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Выберите экран" />
                            </SelectTrigger>
                            <SelectContent>
                              {allNodes
                                .filter(node => node.id !== selectedNode.id)
                                .map((node) => {
                                  const nodeName = 
                                    node.type === 'start' ? node.data.command :
                                    node.type === 'command' ? node.data.command :
                                    node.type === 'message' ? 'Сообщение' :
                                    node.type === 'photo' ? 'Фото' :
                                    node.type === 'keyboard' ? 'Клавиатура' :
                                    node.type === 'condition' ? 'Условие' :
                                    node.type === 'input' ? 'Ввод' : 'Узел';
                                  
                                  return (
                                    <SelectItem key={node.id} value={node.id}>
                                      {nodeName} ({node.id})
                                    </SelectItem>
                                  );
                                })}
                              {allNodes.filter(node => node.id !== selectedNode.id).length === 0 && (
                                <SelectItem value="no-nodes" disabled>
                                  Создайте другие экраны для выбора
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          
                          <Input
                            value={button.target || ''}
                            onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { target: e.target.value })}
                            className="text-xs"
                            placeholder="Или введите ID вручную"
                          />
                        </div>
                      )}
                    </div>
                    ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Command Advanced Settings */}
        {(selectedNode.type === 'start' || selectedNode.type === 'command') && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced-settings" className="border-border">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline hover:text-foreground/90 transition-colors duration-200">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Расширенные настройки команды
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-gradient-to-br from-background to-muted/20 dark:from-background dark:to-muted/10 border border-border/50 rounded-lg mt-2 overflow-hidden">
                <div className="space-y-4 p-4">
                  {/* Show in Menu Setting */}
                  <div className="group flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-200">
                    <div className="flex-1">
                      <Label className="text-xs font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                        Показать в меню
                      </Label>
                      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Команда появится в меню @BotFather
                      </div>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={selectedNode.data.showInMenu ?? true}
                        onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { showInMenu: checked })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                  
                  {/* Private Only Setting */}
                  <div className="group flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-warning/30 hover:bg-card/80 transition-all duration-200">
                    <div className="flex-1">
                      <Label className="text-xs font-medium text-foreground group-hover:text-warning transition-colors duration-200">
                        Только в приватных чатах
                      </Label>
                      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Команда работает только в диалоге с ботом
                      </div>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={selectedNode.data.isPrivateOnly ?? false}
                        onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { isPrivateOnly: checked })}
                        className="data-[state=checked]:bg-warning"
                      />
                    </div>
                  </div>
                  

                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <Separator />

        {/* Keyboard Advanced Settings */}
        {selectedNode.data.keyboardType === 'reply' && (
          <div className="bg-gradient-to-br from-background to-muted/20 dark:from-background dark:to-muted/10 border border-border/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-secondary/20 to-secondary/10 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-secondary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-foreground bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
                Настройки клавиатуры
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="group flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-secondary/30 hover:bg-card/80 transition-all duration-200">
                <div className="flex-1">
                  <Label className="text-xs font-medium text-foreground group-hover:text-secondary transition-colors duration-200">
                    Одноразовая клавиатура
                  </Label>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Скрыть после нажатия
                  </div>
                </div>
                <div className="ml-4">
                  <Switch
                    checked={selectedNode.data.oneTimeKeyboard}
                    onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { oneTimeKeyboard: checked })}
                    className="data-[state=checked]:bg-secondary"
                  />
                </div>
              </div>
              
              <div className="group flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-secondary/30 hover:bg-card/80 transition-all duration-200">
                <div className="flex-1">
                  <Label className="text-xs font-medium text-foreground group-hover:text-secondary transition-colors duration-200">
                    Изменить размер клавиатуры
                  </Label>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Подогнать под содержимое
                  </div>
                </div>
                <div className="ml-4">
                  <Switch
                    checked={selectedNode.data.resizeKeyboard}
                    onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { resizeKeyboard: checked })}
                    className="data-[state=checked]:bg-secondary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Properties Footer */}
      <div className="p-4 border-t border-border bg-gradient-to-r from-background to-muted/10 dark:from-background dark:to-muted/5">
        <div className="flex space-x-2">
          <UIButton 
            variant="outline" 
            className="flex-1 hover:bg-muted/80 dark:hover:bg-muted/60 transition-all duration-200"
            onClick={() => {
              // Reset to default values
              onNodeUpdate(selectedNode.id, {
                messageText: '',
                keyboardType: 'none',
                buttons: [],
                markdown: false,
                oneTimeKeyboard: false,
                resizeKeyboard: true
              });
            }}
          >
            Сбросить
          </UIButton>
          <UIButton className="flex-1 bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80 transition-all duration-200">
            Применить
          </UIButton>
        </div>
      </div>
    </aside>
  );
}
