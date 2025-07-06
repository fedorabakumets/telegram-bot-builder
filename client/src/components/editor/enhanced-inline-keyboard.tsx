import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Plus, Trash2, GripVertical, Eye, Settings, Palette, Layout } from 'lucide-react';
import type { Button as ButtonType, Node } from '@shared/schema';

interface EnhancedInlineKeyboardProps {
  selectedNode: Node;
  allNodes: Node[];
  onNodeUpdate: (nodeId: string, data: Partial<Node['data']>) => void;
  onInlineButtonUpdate?: (nodeId: string, buttonId: string, data: Partial<ButtonType>) => void;
  onInlineButtonDelete?: (nodeId: string, buttonId: string) => void;
}

interface ButtonRow {
  id: string;
  buttons: ButtonType[];
}

export function EnhancedInlineKeyboard({
  selectedNode,
  allNodes,
  onNodeUpdate,
  onInlineButtonUpdate,
  onInlineButtonDelete
}: EnhancedInlineKeyboardProps) {
  const [activeTab, setActiveTab] = useState('buttons');
  const [previewMode, setPreviewMode] = useState(false);

  // Группируем кнопки по строкам
  const getButtonRows = (): ButtonRow[] => {
    const buttons = selectedNode.data.inlineButtons || [];
    const rows: ButtonRow[] = [];
    const buttonsByRow = new Map<number, ButtonType[]>();

    buttons.forEach(button => {
      const rowPos = button.rowPosition || 0;
      if (!buttonsByRow.has(rowPos)) {
        buttonsByRow.set(rowPos, []);
      }
      buttonsByRow.get(rowPos)!.push(button);
    });

    Array.from(buttonsByRow.keys()).sort().forEach((rowIndex, index) => {
      rows.push({
        id: `row-${index}`,
        buttons: buttonsByRow.get(rowIndex)!
      });
    });

    return rows.length > 0 ? rows : [{ id: 'row-0', buttons: [] }];
  };

  const handleAddButton = (rowIndex?: number) => {
    const newButton: ButtonType = {
      id: `btn-${Date.now()}`,
      text: 'Новая кнопка',
      action: 'goto',
      rowPosition: rowIndex ?? 0,
      style: 'default',
      width: 'auto'
    };

    const currentButtons = selectedNode.data.inlineButtons || [];
    onNodeUpdate(selectedNode.id, {
      inlineButtons: [...currentButtons, newButton]
    });
  };

  const handleAddRow = () => {
    const currentRows = getButtonRows();
    const newRowIndex = currentRows.length;
    handleAddButton(newRowIndex);
  };

  const handleDeleteButton = (buttonId: string) => {
    onInlineButtonDelete?.(selectedNode.id, buttonId);
  };

  const handleMoveButton = (buttonId: string, newRowIndex: number) => {
    onInlineButtonUpdate?.(selectedNode.id, buttonId, { rowPosition: newRowIndex });
  };

  const getButtonStyleIcon = (style: string) => {
    switch (style) {
      case 'primary': return '🔵';
      case 'secondary': return '⚪';
      case 'danger': return '🔴';
      default: return '🔘';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'goto': return '➡️';
      case 'command': return '⚡';
      case 'url': return '🔗';
      default: return '❔';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <Label className="text-sm font-medium text-foreground">
            Inline клавиатура
          </Label>
          <Badge variant="secondary" className="text-xs">
            {(selectedNode.data.inlineButtons || []).length} кнопок
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPreviewMode(!previewMode)}
            className="h-7 px-2"
          >
            <Eye className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAddRow}
            className="h-7 px-2"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="buttons" className="text-xs">
            <Layout className="w-3 h-3 mr-1" />
            Кнопки
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">
            <Settings className="w-3 h-3 mr-1" />
            Настройки
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs">
            <Eye className="w-3 h-3 mr-1" />
            Превью
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buttons" className="space-y-3">
          {/* Button Rows */}
          {getButtonRows().map((row, rowIndex) => (
            <Card key={row.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Строка {rowIndex + 1}
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    <Badge variant="outline" className="text-xs">
                      {row.buttons.length} кнопок
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddButton(rowIndex)}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {row.buttons.map((button, buttonIndex) => (
                    <div
                      key={button.id}
                      className="flex items-start space-x-2 p-3 bg-muted/30 rounded-lg border-l-4 border-l-blue-500"
                    >
                      <div className="flex-1 space-y-2">
                        {/* Button Text */}
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getButtonStyleIcon(button.style || 'default')}</span>
                          <Input
                            value={button.text}
                            onChange={(e) => onInlineButtonUpdate?.(selectedNode.id, button.id, { text: e.target.value })}
                            className="flex-1 text-sm"
                            placeholder="Текст кнопки"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteButton(button.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Action Settings */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Действие</Label>
                            <Select
                              value={button.action}
                              onValueChange={(value: 'goto' | 'command' | 'url') =>
                                onInlineButtonUpdate?.(selectedNode.id, button.id, { action: value })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="goto">
                                  <div className="flex items-center space-x-2">
                                    <span>➡️</span>
                                    <span>Перейти к экрану</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="command">
                                  <div className="flex items-center space-x-2">
                                    <span>⚡</span>
                                    <span>Выполнить команду</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="url">
                                  <div className="flex items-center space-x-2">
                                    <span>🔗</span>
                                    <span>Открыть ссылку</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">Стиль</Label>
                            <Select
                              value={button.style || 'default'}
                              onValueChange={(value: 'default' | 'primary' | 'secondary' | 'danger') =>
                                onInlineButtonUpdate?.(selectedNode.id, button.id, { style: value })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">🔘 Обычный</SelectItem>
                                <SelectItem value="primary">🔵 Основной</SelectItem>
                                <SelectItem value="secondary">⚪ Дополнительный</SelectItem>
                                <SelectItem value="danger">🔴 Внимание</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Action-specific inputs */}
                        {button.action === 'url' && (
                          <div>
                            <Label className="text-xs text-muted-foreground">URL</Label>
                            <Input
                              value={button.url || ''}
                              onChange={(e) => onInlineButtonUpdate?.(selectedNode.id, button.id, { url: e.target.value })}
                              className="h-8 text-xs"
                              placeholder="https://example.com"
                            />
                          </div>
                        )}

                        {button.action === 'goto' && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Целевой экран</Label>
                            <Select
                              value={button.target || ''}
                              onValueChange={(value) => onInlineButtonUpdate?.(selectedNode.id, button.id, { target: value })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Выберите экран" />
                              </SelectTrigger>
                              <SelectContent>
                                {allNodes
                                  .filter(node => node.id !== selectedNode.id)
                                  .map((node) => (
                                    <SelectItem key={node.id} value={node.id}>
                                      <div className="flex items-center space-x-2">
                                        <i className={`fas ${node.type === 'start' ? 'fa-play' : 'fa-comment'} text-xs`}></i>
                                        <span>{node.data.messageText?.slice(0, 30) || node.data.command || `${node.type} - ${node.id}`}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {button.action === 'command' && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Команда</Label>
                            <Input
                              value={button.target || ''}
                              onChange={(e) => onInlineButtonUpdate?.(selectedNode.id, button.id, { target: e.target.value })}
                              className="h-8 text-xs"
                              placeholder="/help"
                            />
                          </div>
                        )}


                      </div>
                    </div>
                  ))}

                  {row.buttons.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <div className="text-sm">Нет кнопок в этой строке</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddButton(rowIndex)}
                        className="mt-2"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Добавить кнопку
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Layout Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Layout className="w-4 h-4 mr-2" />
                Настройки макета
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Макет клавиатуры</Label>
                <Select
                  value={selectedNode.data.keyboardLayout || 'default'}
                  onValueChange={(value) => onNodeUpdate(selectedNode.id, { keyboardLayout: value as any })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Стандартный</SelectItem>
                    <SelectItem value="compact">Компактный</SelectItem>
                    <SelectItem value="wide">Широкий</SelectItem>
                    <SelectItem value="grid">Сетка</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Максимум кнопок в строке</Label>
                <Select
                  value={String(selectedNode.data.maxRowSize || 2)}
                  onValueChange={(value) => onNodeUpdate(selectedNode.id, { maxRowSize: parseInt(value) })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 8].map(num => (
                      <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Отдельным сообщением</Label>
                  <Switch
                    checked={selectedNode.data.separateMessages || false}
                    onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { separateMessages: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Показывать подсказку</Label>
                  <Switch
                    checked={selectedNode.data.showKeyboardHint !== false}
                    onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { showKeyboardHint: checked })}
                  />
                </div>
              </div>

              {selectedNode.data.showKeyboardHint !== false && (
                <div>
                  <Label className="text-xs text-muted-foreground">Заголовок клавиатуры</Label>
                  <Input
                    value={selectedNode.data.keyboardTitle || ''}
                    onChange={(e) => onNodeUpdate(selectedNode.id, { keyboardTitle: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Выберите действие:"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {/* Telegram-like Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Превью в Telegram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-b from-blue-500 to-blue-600 p-4 rounded-lg">
                <div className="bg-white rounded-lg p-3 shadow-lg">
                  {/* Message */}
                  <div className="flex items-start space-x-2 mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      B
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-3">
                        <div className="text-sm text-gray-800">
                          {selectedNode.data.messageText || 'Сообщение бота'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Keyboard Preview */}
                  {selectedNode.data.keyboardTitle && (
                    <div className="text-xs text-gray-500 mb-2 text-center">
                      {selectedNode.data.keyboardTitle}
                    </div>
                  )}

                  <div className="space-y-1">
                    {getButtonRows().map((row, rowIndex) => (
                      <div key={row.id} className="flex space-x-1">
                        {row.buttons.map((button) => (
                          <button
                            key={button.id}
                            className={`
                              flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors
                              ${button.style === 'primary' ? 'bg-blue-500 text-white' :
                                button.style === 'danger' ? 'bg-red-500 text-white' :
                                button.style === 'secondary' ? 'bg-gray-500 text-white' :
                                'bg-gray-200 text-gray-800'}
                            `}
                          >
                            <div className="flex items-center justify-center space-x-1">
                              <span>{getActionIcon(button.action)}</span>
                              <span>{button.text}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}