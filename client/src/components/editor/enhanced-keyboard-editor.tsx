import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, ArrowRight, Terminal, Link, Grid, List, Maximize, Minimize } from 'lucide-react';
interface Node {
  id: string;
  type: string;
  data: {
    messageText?: string;
    command?: string;
    imageUrl?: string;
    keyboardType?: 'none' | 'reply' | 'inline' | 'combined';
    buttons?: KeyboardButton[];
    inlineButtons?: KeyboardButton[];
    resizeKeyboard?: boolean;
    oneTimeKeyboard?: boolean;
    persistentKeyboard?: boolean;
    [key: string]: any;
  };
  position: { x: number; y: number };
}

interface EnhancedKeyboardEditorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, updates: any) => void;
  allNodes: Node[];
}

interface KeyboardButton {
  id: string;
  text: string;
  action: 'goto' | 'command' | 'url';
  target?: string;
  url?: string;
  rowPosition?: number;
  style?: 'default' | 'primary' | 'danger';
  requiresAuth?: boolean;
  adminOnly?: boolean;
  width?: 'auto' | 'full';
}

export function EnhancedKeyboardEditor({ node, onNodeUpdate, allNodes }: EnhancedKeyboardEditorProps) {
  const handleAddButton = (type: 'reply' | 'inline') => {
    const newButton: KeyboardButton = {
      id: `btn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: type === 'reply' ? 'Новая кнопка' : 'Новая inline кнопка',
      action: 'goto',
      rowPosition: 0,
      style: 'default',
      requiresAuth: false,
      adminOnly: false,
      width: 'auto'
    };

    if (type === 'reply') {
      const buttons = [...(node.data.buttons || []), newButton];
      onNodeUpdate(node.id, { buttons });
    } else {
      const inlineButtons = [...(node.data.inlineButtons || []), newButton];
      onNodeUpdate(node.id, { inlineButtons });
    }
  };

  const handleUpdateButton = (buttonId: string, updates: Partial<KeyboardButton>, type: 'reply' | 'inline') => {
    if (type === 'reply') {
      const buttons = (node.data.buttons || []).map((btn: KeyboardButton) => 
        btn.id === buttonId ? { ...btn, ...updates } : btn
      );
      onNodeUpdate(node.id, { buttons });
    } else {
      const inlineButtons = (node.data.inlineButtons || []).map((btn: KeyboardButton) => 
        btn.id === buttonId ? { ...btn, ...updates } : btn
      );
      onNodeUpdate(node.id, { inlineButtons });
    }
  };

  const handleDeleteButton = (buttonId: string, type: 'reply' | 'inline') => {
    if (type === 'reply') {
      const buttons = (node.data.buttons || []).filter((btn: KeyboardButton) => btn.id !== buttonId);
      onNodeUpdate(node.id, { buttons });
    } else {
      const inlineButtons = (node.data.inlineButtons || []).filter((btn: KeyboardButton) => btn.id !== buttonId);
      onNodeUpdate(node.id, { inlineButtons });
    }
  };

  const renderButtonEditor = (button: KeyboardButton, type: 'reply' | 'inline') => {
    return (
      <Card key={button.id} className="mb-3">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Button Text */}
            <div className="flex items-center gap-2">
              <Input
                value={button.text}
                onChange={(e) => handleUpdateButton(button.id, { text: e.target.value }, type)}
                placeholder={`Текст ${type === 'inline' ? 'inline ' : ''}кнопки`}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteButton(button.id, type)}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Type */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Действие</Label>
                <Select
                  value={button.action}
                  onValueChange={(value: 'goto' | 'command' | 'url') => 
                    handleUpdateButton(button.id, { action: value }, type)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goto">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        Перейти к экрану
                      </div>
                    </SelectItem>
                    <SelectItem value="command">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3" />
                        Выполнить команду
                      </div>
                    </SelectItem>
                    <SelectItem value="url">
                      <div className="flex items-center gap-2">
                        <Link className="h-3 w-3" />
                        Открыть ссылку
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target/URL based on action */}
              <div>
                {button.action === 'goto' && (
                  <>
                    <Label className="text-xs">Целевой экран</Label>
                    <Select
                      value={button.target || ''}
                      onValueChange={(value) => handleUpdateButton(button.id, { target: value }, type)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Выберите экран" />
                      </SelectTrigger>
                      <SelectContent>
                        {allNodes
                          .filter(n => n.id !== node.id)
                          .map((targetNode) => (
                            <SelectItem key={targetNode.id} value={targetNode.id}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {targetNode.type === 'start' ? '🚀' : 
                                   targetNode.type === 'message' ? '💬' :
                                   targetNode.type === 'command' ? '/' : '📄'}
                                </span>
                                <span>
                                  {targetNode.data.messageText?.substring(0, 30) || 
                                   targetNode.data.command || 
                                   `${targetNode.type} узел`}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </>
                )}

                {button.action === 'command' && (
                  <>
                    <Label className="text-xs">Команда</Label>
                    <Input
                      value={button.target || ''}
                      onChange={(e) => handleUpdateButton(button.id, { target: e.target.value }, type)}
                      placeholder="/help"
                      className="mt-1"
                    />
                  </>
                )}

                {button.action === 'url' && (
                  <>
                    <Label className="text-xs">URL</Label>
                    <Input
                      value={button.url || ''}
                      onChange={(e) => handleUpdateButton(button.id, { url: e.target.value }, type)}
                      placeholder="https://example.com"
                      className="mt-1"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Advanced Options for Inline Buttons */}
            {type === 'inline' && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="advanced" className="border-none">
                  <AccordionTrigger className="text-xs hover:no-underline py-2">
                    Дополнительные настройки
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Требует авторизации</Label>
                        <Switch
                          checked={button.requiresAuth || false}
                          onCheckedChange={(checked) => 
                            handleUpdateButton(button.id, { requiresAuth: checked }, type)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Только для админов</Label>
                        <Switch
                          checked={button.adminOnly || false}
                          onCheckedChange={(checked) => 
                            handleUpdateButton(button.id, { adminOnly: checked }, type)
                          }
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Keyboard Type Selector */}
      <div>
        <Label className="text-sm font-medium">Тип клавиатуры</Label>
        <Select
          value={node.data.keyboardType || 'none'}
          onValueChange={(value) => onNodeUpdate(node.id, { keyboardType: value })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <span>Без клавиатуры</span>
              </div>
            </SelectItem>
            <SelectItem value="reply">
              <div className="flex items-center gap-2">
                <Grid className="h-4 w-4" />
                <span>Reply клавиатура</span>
                <Badge variant="secondary" className="ml-2 text-xs">Основная</Badge>
              </div>
            </SelectItem>
            <SelectItem value="inline">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <span>Inline клавиатура</span>
                <Badge variant="secondary" className="ml-2 text-xs">В сообщении</Badge>
              </div>
            </SelectItem>
            <SelectItem value="combined">
              <div className="flex items-center gap-2">
                <Maximize className="h-4 w-4" />
                <span>Комбинированная</span>
                <Badge className="ml-2 text-xs">Reply + Inline</Badge>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Keyboard Configuration */}
      {node.data.keyboardType !== 'none' && (
        <div>
          {node.data.keyboardType === 'combined' ? (
            <Tabs defaultValue="reply" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reply">
                  Reply кнопки ({(node.data.buttons || []).length})
                </TabsTrigger>
                <TabsTrigger value="inline">
                  Inline кнопки ({(node.data.inlineButtons || []).length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="reply" className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Reply кнопки</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddButton('reply')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Добавить
                  </Button>
                </div>
                {(node.data.buttons || []).map((button: KeyboardButton) => renderButtonEditor(button, 'reply'))}
              </TabsContent>
              
              <TabsContent value="inline" className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Inline кнопки</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddButton('inline')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Добавить
                  </Button>
                </div>
                {(node.data.inlineButtons || []).map((button: KeyboardButton) => renderButtonEditor(button, 'inline'))}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {node.data.keyboardType === 'reply' ? 'Reply кнопки' : 'Inline кнопки'}
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddButton(node.data.keyboardType as 'reply' | 'inline')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить
                </Button>
              </div>
              {node.data.keyboardType === 'reply' ? (
                (node.data.buttons || []).map((button: KeyboardButton) => renderButtonEditor(button, 'reply'))
              ) : (
                (node.data.buttons || []).map((button: KeyboardButton) => renderButtonEditor(button, 'inline'))
              )}
            </div>
          )}

          {/* Keyboard Settings */}
          {node.data.keyboardType !== 'inline' && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Настройки клавиатуры</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">Подстроить размер</Label>
                    <p className="text-xs text-muted-foreground">Автоматически уменьшать клавиатуру</p>
                  </div>
                  <Switch
                    checked={node.data.resizeKeyboard ?? true}
                    onCheckedChange={(checked) => onNodeUpdate(node.id, { resizeKeyboard: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">Одноразовая клавиатура</Label>
                    <p className="text-xs text-muted-foreground">Скрыть после использования</p>
                  </div>
                  <Switch
                    checked={node.data.oneTimeKeyboard ?? false}
                    onCheckedChange={(checked) => onNodeUpdate(node.id, { oneTimeKeyboard: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">Постоянная клавиатура</Label>
                    <p className="text-xs text-muted-foreground">Всегда показывать клавиатуру</p>
                  </div>
                  <Switch
                    checked={node.data.persistentKeyboard ?? false}
                    onCheckedChange={(checked) => onNodeUpdate(node.id, { persistentKeyboard: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}