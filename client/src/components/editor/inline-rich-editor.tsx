import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Type,
  Quote,
  Heading3,
  Link,
  List,
  ListOrdered,
  RotateCcw,
  RotateCw,
  Copy,
  Sparkles,
  Plus,
  Image,
  Video,
  Music,
  FileText
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Variable {
  name: string;
  nodeId: string;
  nodeType: string;
  description?: string;
  mediaType?: string;
}

interface InlineRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  enableMarkdown?: boolean;
  onMarkdownToggle?: (enabled: boolean) => void;
  onFormatModeChange?: (formatMode: 'html' | 'markdown' | 'none') => void;
  availableVariables?: Variable[];
  onMediaVariableSelect?: (variableName: string, mediaType: string) => void;
}

export function InlineRichEditor({
  value,
  onChange,
  placeholder = "Введите текст сообщения...",
  enableMarkdown = false,
  onMarkdownToggle,
  onFormatModeChange,
  availableVariables = [],
  onMediaVariableSelect
}: InlineRichEditorProps) {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [isFormatting, setIsFormatting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Save state to undo stack
  const saveToUndoStack = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), value]);
    setRedoStack([]);
  }, [value]);

  // Update word and character counts
  useEffect(() => {
    const plainText = value.replace(/<[^>]*>/g, '').replace(/\*\*|__|~~|`/g, '');
    const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(plainText.length);
  }, [value]);

  // Convert value to display HTML
  const valueToHtml = useCallback((text: string) => {
    if (!text) return '';
    
    let html = text;
    
    if (enableMarkdown) {
      // Convert markdown to HTML for contenteditable
      html = html
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/~~(.*?)~~/g, '<s>$1</s>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^# (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h5>$1</h5>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\n/g, '<br>');
    } else {
      // For HTML mode, just convert newlines to br tags
      html = html.replace(/\n/g, '<br>');
    }
    
    return html;
  }, [enableMarkdown]);

  // Convert display HTML back to value
  const htmlToValue = useCallback((html: string) => {
    if (!html) return '';
    
    let text = html;
    
    if (enableMarkdown) {
      // Convert HTML back to markdown
      text = text
        .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
        .replace(/<u[^>]*>(.*?)<\/u>/g, '__$1__')
        .replace(/<s[^>]*>(.*?)<\/s>/g, '~~$1~~')
        .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
        .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, '> $1')
        .replace(/<h3[^>]*>(.*?)<\/h3>/g, '# $1')
        .replace(/<h4[^>]*>(.*?)<\/h4>/g, '## $1')
        .replace(/<h5[^>]*>(.*?)<\/h5>/g, '### $1')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<div[^>]*>/g, '\n')
        .replace(/<\/div>/g, '');
    } else {
      // For HTML mode, just convert br tags to newlines
      text = text
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<div[^>]*>/g, '\n')
        .replace(/<\/div>/g, '');
    }
    
    return text;
  }, [enableMarkdown]);

  // Update editor content when value changes
  useEffect(() => {
    if (editorRef.current && !isFormatting) {
      const html = valueToHtml(value);
      if (editorRef.current.innerHTML !== html) {
        // Save current selection
        const selection = window.getSelection();
        let range = null;
        let offset = 0;
        
        if (selection && selection.rangeCount > 0) {
          try {
            range = selection.getRangeAt(0);
            offset = range.startOffset;
          } catch (e) {
            // Ignore selection errors
          }
        }
        
        editorRef.current.innerHTML = html;
        
        // Restore selection
        if (range && selection) {
          try {
            const newRange = document.createRange();
            const walker = document.createTreeWalker(
              editorRef.current,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            
            let currentOffset = 0;
            let targetNode = null;
            
            while (walker.nextNode()) {
              const node = walker.currentNode;
              const nodeLength = node.textContent?.length || 0;
              
              if (currentOffset + nodeLength >= offset) {
                targetNode = node;
                break;
              }
              currentOffset += nodeLength;
            }
            
            if (targetNode) {
              newRange.setStart(targetNode, Math.min(offset - currentOffset, targetNode.textContent?.length || 0));
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          } catch (e) {
            // Ignore range errors
          }
        }
      }
    }
  }, [value, valueToHtml, isFormatting]);

  // Handle input in contenteditable
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      setIsFormatting(true);
      const html = editorRef.current.innerHTML;
      const text = htmlToValue(html);
      onChange(text);
      setTimeout(() => setIsFormatting(false), 0);
    }
  }, [onChange, htmlToValue]);

  // Format options
  const formatOptions = [
    { 
      command: 'bold', 
      icon: Bold, 
      name: 'Жирный', 
      shortcut: 'Ctrl+B',
      markdown: '**текст**',
      html: '<strong>текст</strong>'
    },
    { 
      command: 'italic', 
      icon: Italic, 
      name: 'Курсив', 
      shortcut: 'Ctrl+I',
      markdown: '*текст*',
      html: '<em>текст</em>'
    },
    { 
      command: 'underline', 
      icon: Underline, 
      name: 'Подчеркнутый', 
      shortcut: 'Ctrl+U',
      markdown: '__текст__',
      html: '<u>текст</u>'
    },
    { 
      command: 'strikethrough', 
      icon: Strikethrough, 
      name: 'Зачеркнутый', 
      shortcut: 'Ctrl+Shift+X',
      markdown: '~~текст~~',
      html: '<s>текст</s>'
    },
    { 
      command: 'code', 
      icon: Code, 
      name: 'Код', 
      shortcut: 'Ctrl+E',
      markdown: '`код`',
      html: '<code>код</code>'
    },
    { 
      command: 'quote', 
      icon: Quote, 
      name: 'Цитата', 
      shortcut: 'Ctrl+Q',
      markdown: '> цитата',
      html: '<blockquote>цитата</blockquote>'
    },
    { 
      command: 'heading', 
      icon: Heading3, 
      name: 'Заголовок', 
      shortcut: 'Ctrl+H',
      markdown: '# заголовок',
      html: '<h3>заголовок</h3>'
    }
  ];

  // Apply formatting
  const applyFormatting = useCallback((format: typeof formatOptions[0]) => {
    if (!editorRef.current) return;
    
    saveToUndoStack();
    setIsFormatting(true);
    
    // Автоматически переключаемся в HTML режим при использовании кнопок форматирования
    if (onFormatModeChange) {
      onFormatModeChange('html');
    }
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      toast({
        title: "Нет выделения",
        description: "Выделите текст для форматирования или поставьте курсор в нужное место",
        variant: "default"
      });
      setIsFormatting(false);
      return;
    }
    
    try {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (format.command === 'bold' || format.command === 'italic' || format.command === 'underline' || format.command === 'strikethrough') {
        // Use document.execCommand for basic formatting
        document.execCommand(format.command, false, undefined);
      } else if (format.command === 'code') {
        // Custom code formatting
        if (selectedText) {
          const codeElement = document.createElement('code');
          codeElement.textContent = selectedText;
          range.deleteContents();
          range.insertNode(codeElement);
          range.selectNode(codeElement);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else if (format.command === 'quote') {
        // Custom quote formatting
        if (selectedText) {
          const quoteElement = document.createElement('blockquote');
          quoteElement.textContent = selectedText;
          range.deleteContents();
          range.insertNode(quoteElement);
          range.selectNode(quoteElement);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else if (format.command === 'heading') {
        // Custom heading formatting
        if (selectedText) {
          const headingElement = document.createElement('h3');
          headingElement.textContent = selectedText;
          range.deleteContents();
          range.insertNode(headingElement);
          range.selectNode(headingElement);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      
      // Update the value
      setTimeout(() => {
        handleInput();
        toast({
          title: "Форматирование применено",
          description: `${format.name} применен к выделенному тексту`,
          variant: "default"
        });
      }, 0);
    } catch (e) {
      toast({
        title: "Ошибка форматирования",
        description: "Не удалось применить форматирование",
        variant: "destructive"
      });
    }
    
    setTimeout(() => setIsFormatting(false), 100);
  }, [saveToUndoStack, handleInput, toast, onFormatModeChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      
      switch (key) {
        case 'b':
          e.preventDefault();
          applyFormatting(formatOptions[0]);
          break;
        case 'i':
          e.preventDefault();
          applyFormatting(formatOptions[1]);
          break;
        case 'u':
          e.preventDefault();
          applyFormatting(formatOptions[2]);
          break;
        case 'e':
          e.preventDefault();
          applyFormatting(formatOptions[4]);
          break;
        case 'q':
          e.preventDefault();
          applyFormatting(formatOptions[5]);
          break;
        case 'h':
          e.preventDefault();
          applyFormatting(formatOptions[6]);
          break;
        case 'x':
          if (e.shiftKey) {
            e.preventDefault();
            applyFormatting(formatOptions[3]);
          }
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            redo();
          } else {
            e.preventDefault();
            undo();
          }
          break;
      }
    }
  }, [applyFormatting, formatOptions]);

  // Undo functionality
  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousValue = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, value]);
      setUndoStack(prev => prev.slice(0, -1));
      onChange(previousValue);
      toast({
        title: "Отменено",
        description: "Последнее действие отменено",
        variant: "default"
      });
    }
  }, [undoStack, value, onChange, toast]);

  // Redo functionality
  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextValue = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, value]);
      setRedoStack(prev => prev.slice(0, -1));
      onChange(nextValue);
      toast({
        title: "Повторено",
        description: "Действие повторено",
        variant: "default"
      });
    }
  }, [redoStack, value, onChange, toast]);

  // Copy formatted text
  const copyFormatted = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      navigator.clipboard.writeText(html).then(() => {
        toast({
          title: "Скопировано",
          description: "Форматированный текст скопирован в буфер обмена",
          variant: "default"
        });
      });
    }
  }, [toast]);

  // Insert variable at cursor position
  const insertVariable = useCallback((variableName: string) => {
    // Проверяем, является ли это медиапеременной
    const variable = availableVariables.find(v => v.name === variableName);
    const isMediaVariable = variable?.mediaType !== undefined;
    
    if (isMediaVariable && onMediaVariableSelect && variable) {
      // Для медиапеременных вызываем специальный callback
      onMediaVariableSelect(variableName, variable.mediaType!);
      toast({
        title: "Медиа прикреплено",
        description: `Медиафайл "${variableName}" добавлен в прикрепленные медиа`,
        variant: "default"
      });
      return;
    }
    
    // Для обычных переменных - вставляем в текст
    if (!editorRef.current) return;
    
    saveToUndoStack();
    setIsFormatting(true);
    
    const selection = window.getSelection();
    if (!selection) {
      setIsFormatting(false);
      return;
    }

    try {
      let range: Range;
      
      if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      } else {
        // If no selection, create a range at the end of the content
        range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
      }

      // Create the variable placeholder text
      const variableText = `{${variableName}}`;
      const textNode = document.createTextNode(variableText);
      
      // Insert the variable
      range.deleteContents();
      range.insertNode(textNode);
      
      // Position cursor after the inserted variable
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Update the value
      setTimeout(() => {
        handleInput();
        toast({
          title: "Переменная добавлена",
          description: `Переменная "${variableName}" вставлена в текст`,
          variant: "default"
        });
      }, 0);
      
    } catch (e) {
      toast({
        title: "Ошибка",
        description: "Не удалось вставить переменную",
        variant: "destructive"
      });
    }
    
    setTimeout(() => setIsFormatting(false), 100);
  }, [availableVariables, onMediaVariableSelect, saveToUndoStack, handleInput, toast]);

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Modern Toolbar */}
      <div className="bg-gradient-to-r from-slate-50/60 to-slate-100/40 dark:from-slate-950/40 dark:to-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-lg p-2.5 sm:p-3 backdrop-blur-sm">
        <div className="flex flex-row flex-wrap items-center gap-2">
          {/* Formatting Tools */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-white dark:bg-slate-900/50 rounded-lg p-1.5 sm:p-2 border border-slate-200/50 dark:border-slate-800/50">
            {formatOptions.map((format) => (
              <Button
                key={format.command}
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting(format)}
                className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                title={`${format.name} (${format.shortcut})`}
              >
                <format.icon className="h-4 sm:h-4 w-4 sm:w-4 text-slate-700 dark:text-slate-300" />
              </Button>
            ))}
          </div>
          
          {/* History Tools */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-white dark:bg-slate-900/50 rounded-lg p-1.5 sm:p-2 border border-slate-200/50 dark:border-slate-800/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={undoStack.length === 0}
              className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-40"
              title="Отменить (Ctrl+Z)"
            >
              <RotateCcw className="h-4 sm:h-4 w-4 sm:w-4 text-slate-700 dark:text-slate-300" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={redoStack.length === 0}
              className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-40"
              title="Повторить (Ctrl+Shift+Z)"
            >
              <RotateCw className="h-4 sm:h-4 w-4 sm:w-4 text-slate-700 dark:text-slate-300" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={copyFormatted}
              className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
              title="Копировать форматированный текст"
            >
              <Copy className="h-4 sm:h-4 w-4 sm:w-4 text-slate-700 dark:text-slate-300" />
            </Button>
          </div>
          
          {/* Variables Insert Button */}
          {availableVariables.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 sm:h-9 px-2.5 sm:px-3 gap-1.5 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-600/20 dark:to-cyan-600/15 hover:from-blue-500/20 hover:to-cyan-500/15 dark:hover:from-blue-600/30 dark:hover:to-cyan-600/25 border border-blue-300/40 dark:border-blue-600/40 hover:border-blue-400/60 dark:hover:border-blue-500/60 transition-all"
                  title="Вставить переменную"
                >
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">Переменная</span>
                  <span className="sm:hidden">+ Переменная</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 sm:w-64">
                <DropdownMenuLabel className="text-xs sm:text-sm font-semibold">
                  📌 Доступные переменные
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableVariables.map((variable, index) => {
                  const getMediaIcon = () => {
                    switch (variable.mediaType) {
                      case 'photo': return <Image className="h-4 w-4 text-blue-500" />;
                      case 'video': return <Video className="h-4 w-4 text-purple-500" />;
                      case 'audio': return <Music className="h-4 w-4 text-green-500" />;
                      case 'document': return <FileText className="h-4 w-4 text-orange-500" />;
                      default: return null;
                    }
                  };

                  const getBadgeText = () => {
                    if (variable.mediaType) {
                      switch (variable.mediaType) {
                        case 'photo': return '🖼️ Фото';
                        case 'video': return '🎥 Видео';
                        case 'audio': return '🎵 Аудио';
                        case 'document': return '📄 Документ';
                      }
                    }
                    if (variable.nodeType === 'user-input') return '⌨️ Ввод';
                    if (variable.nodeType === 'start') return '▶️ Команда';
                    if (variable.nodeType === 'command') return '🔧 Команда';
                    if (variable.nodeType === 'system') return '⚙️ Система';
                    if (variable.nodeType === 'conditional') return '❓ Условие';
                    return '📌 Другое';
                  };

                  const mediaIcon = getMediaIcon();
                  
                  return (
                    <DropdownMenuItem
                      key={`${variable.nodeId}-${variable.name}-${index}`}
                      onClick={() => insertVariable(variable.name)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center gap-2">
                          {mediaIcon && <span className="flex-shrink-0">{mediaIcon}</span>}
                          <code className="text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {`{${variable.name}}`}
                          </code>
                          <Badge variant="secondary" className="text-xs h-5 ml-auto">
                            {getBadgeText()}
                          </Badge>
                        </div>
                        {variable.description && (
                          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {variable.description}
                          </div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                {availableVariables.length === 0 && (
                  <DropdownMenuItem disabled>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Нет доступных переменных
                    </span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Editor Container */}
      <div className="relative border border-slate-300/60 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-950 overflow-hidden transition-all hover:border-slate-400/80 dark:hover:border-slate-600/80 focus-within:ring-2 focus-within:ring-blue-500/50 dark:focus-within:ring-blue-500/30">
        {/* Placeholder */}
        {!value && (
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 text-slate-400 dark:text-slate-600 text-sm sm:text-base pointer-events-none font-medium">
            {placeholder}
          </div>
        )}

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="min-h-[120px] sm:min-h-[140px] p-3 sm:p-4 w-full text-sm sm:text-base bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none whitespace-pre-wrap selection:bg-blue-200 dark:selection:bg-blue-900"
          style={{ 
            lineHeight: '1.6',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}
          data-placeholder={placeholder}
        />
        
        {/* Stats Bar */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/50">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            <i className="fas fa-align-left mr-1 sm:mr-1.5"></i>
            <span className="hidden sm:inline">{wordCount} слов</span>
            <span className="sm:hidden">{wordCount}</span>
          </span>
          <div className="w-px h-3 bg-slate-300/30 dark:bg-slate-700/30"></div>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            <i className="fas fa-font mr-1 sm:mr-1.5"></i>
            <span className="hidden sm:inline">{charCount} символов</span>
            <span className="sm:hidden">{charCount}</span>
          </span>
        </div>
      </div>
    </div>
  );
}