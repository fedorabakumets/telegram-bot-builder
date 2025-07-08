import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Link, 
  Type,
  Eye,
  Copy,
  Sparkles,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InlineRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  enableMarkdown?: boolean;
  onMarkdownToggle?: (enabled: boolean) => void;
}

export function InlineRichEditor({
  value,
  onChange,
  placeholder = "Введите текст сообщения...",
  enableMarkdown = false,
  onMarkdownToggle
}: InlineRichEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Update counts when value changes
  useEffect(() => {
    setWordCount(value.trim().split(/\s+/).filter(word => word.length > 0).length);
    setCharCount(value.length);
  }, [value]);

  // Save to undo stack
  const saveToUndoStack = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), value]);
    setRedoStack([]);
  }, [value]);

  // Convert markdown/HTML to display format
  const convertToDisplayFormat = useCallback((text: string) => {
    let displayText = text;
    
    if (enableMarkdown) {
      // Convert markdown to HTML for display
      displayText = displayText
        .replace(/\*\*(.*?)\*\*/g, '<strong class="inline-format-bold">$1</strong>')
        .replace(/_(.*?)_/g, '<em class="inline-format-italic">$1</em>')
        .replace(/__(.*?)__/g, '<span class="inline-format-underline">$1</span>')
        .replace(/~(.*?)~/g, '<span class="inline-format-strikethrough">$1</span>')
        .replace(/`(.*?)`/g, '<code class="inline-format-code">$1</code>')
        .replace(/```\n(.*?)\n```/gs, '<pre class="inline-format-pre"><code>$1</code></pre>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="inline-format-link">$1</a>')
        .replace(/^> (.*)$/gm, '<blockquote class="inline-format-quote">$1</blockquote>')
        .replace(/^# (.*)$/gm, '<h3 class="inline-format-heading">$1</h3>')
        .replace(/\n/g, '<br>');
    } else {
      // HTML mode - display tags as formatted text
      displayText = displayText
        .replace(/<b>(.*?)<\/b>/g, '<strong class="inline-format-bold">$1</strong>')
        .replace(/<i>(.*?)<\/i>/g, '<em class="inline-format-italic">$1</em>')
        .replace(/<u>(.*?)<\/u>/g, '<span class="inline-format-underline">$1</span>')
        .replace(/<s>(.*?)<\/s>/g, '<span class="inline-format-strikethrough">$1</span>')
        .replace(/<code>(.*?)<\/code>/g, '<code class="inline-format-code">$1</code>')
        .replace(/<pre><code>(.*?)<\/code><\/pre>/gs, '<pre class="inline-format-pre"><code>$1</code></pre>')
        .replace(/<a href="([^"]+)">(.*?)<\/a>/g, '<a href="$1" class="inline-format-link">$2</a>')
        .replace(/<blockquote>(.*?)<\/blockquote>/g, '<blockquote class="inline-format-quote">$1</blockquote>')
        .replace(/<h3>(.*?)<\/h3>/g, '<h3 class="inline-format-heading">$1</h3>')
        .replace(/\n/g, '<br>');
    }
    
    return displayText;
  }, [enableMarkdown]);

  // Convert display format back to raw text
  const convertToRawFormat = useCallback((html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }, []);

  // Handle input in contenteditable
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const rawText = convertToRawFormat(target.innerHTML);
    onChange(rawText);
  }, [onChange, convertToRawFormat]);

  // Update editor content when value changes externally
  useEffect(() => {
    if (editorRef.current) {
      const displayContent = convertToDisplayFormat(value);
      if (editorRef.current.innerHTML !== displayContent) {
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        const startOffset = range?.startOffset;
        
        editorRef.current.innerHTML = displayContent;
        
        // Restore cursor position
        if (selection && startOffset !== undefined) {
          try {
            const newRange = document.createRange();
            const textNode = editorRef.current.firstChild;
            if (textNode) {
              newRange.setStart(textNode, Math.min(startOffset, textNode.textContent?.length || 0));
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
  }, [value, convertToDisplayFormat]);

  const formatOptions = [
    { 
      icon: Bold, 
      name: 'Жирный', 
      markdown: '**', 
      html: 'b',
      shortcut: 'Ctrl+B',
      className: 'inline-format-bold'
    },
    { 
      icon: Italic, 
      name: 'Курсив', 
      markdown: '_', 
      html: 'i',
      shortcut: 'Ctrl+I',
      className: 'inline-format-italic'
    },
    { 
      icon: Underline, 
      name: 'Подчеркнутый', 
      markdown: '__', 
      html: 'u',
      shortcut: 'Ctrl+U',
      className: 'inline-format-underline'
    },
    { 
      icon: Strikethrough, 
      name: 'Зачеркнутый', 
      markdown: '~', 
      html: 's',
      shortcut: 'Ctrl+Shift+X',
      className: 'inline-format-strikethrough'
    },
    { 
      icon: Code, 
      name: 'Код', 
      markdown: '`', 
      html: 'code',
      shortcut: 'Ctrl+E',
      className: 'inline-format-code'
    }
  ];

  // Apply formatting to selected text
  const applyFormatting = useCallback((format: typeof formatOptions[0]) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (!selectedText) {
      toast({
        title: "Выделите текст",
        description: "Сначала выделите текст, который хотите отформатировать",
        variant: "default"
      });
      return;
    }

    saveToUndoStack();
    
    if (enableMarkdown) {
      // Markdown formatting
      let formattedText = '';
      switch (format.name) {
        case 'Жирный':
          formattedText = `**${selectedText}**`;
          break;
        case 'Курсив':
          formattedText = `_${selectedText}_`;
          break;
        case 'Подчеркнутый':
          formattedText = `__${selectedText}__`;
          break;
        case 'Зачеркнутый':
          formattedText = `~${selectedText}~`;
          break;
        case 'Код':
          formattedText = `\`${selectedText}\``;
          break;
        default:
          formattedText = selectedText;
      }
      
      // Replace selected text with formatted version
      range.deleteContents();
      range.insertNode(document.createTextNode(formattedText));
      
      // Update value
      const newValue = editorRef.current?.textContent || '';
      onChange(newValue);
    } else {
      // HTML formatting
      const span = document.createElement('span');
      span.className = format.className;
      span.textContent = selectedText;
      
      range.deleteContents();
      range.insertNode(span);
      
      // Update value  
      const newValue = editorRef.current?.textContent || '';
      onChange(newValue);
    }

    toast({
      title: "Форматирование применено",
      description: `Применено к выделенному тексту: ${format.name}`,
      variant: "default"
    });
  }, [enableMarkdown, onChange, saveToUndoStack, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const format = formatOptions.find(f => {
          const shortcut = f.shortcut?.toLowerCase();
          if (!shortcut) return false;
          
          if (shortcut.includes('shift') && !e.shiftKey) return false;
          if (!shortcut.includes('shift') && e.shiftKey) return false;
          
          const key = shortcut.split('+').pop();
          return e.key.toLowerCase() === key;
        });
        
        if (format) {
          e.preventDefault();
          applyFormatting(format);
        }
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('keydown', handleKeyDown);
      return () => editor.removeEventListener('keydown', handleKeyDown);
    }
  }, [formatOptions, applyFormatting]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Скопировано!",
        description: "Текст скопирован в буфер обмена"
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Card className={`w-full transition-all duration-300 ${isExpanded ? 'col-span-2' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            Встроенный редактор с форматированием
            {charCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {wordCount} слов • {charCount} символов
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
              title={isExpanded ? "Свернуть" : "Развернуть"}
            >
              {isExpanded ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkdownToggle?.(!enableMarkdown)}
              className="text-xs"
            >
              {enableMarkdown ? 'Markdown' : 'HTML'}
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex items-center gap-1">
            {formatOptions.map((format) => (
              <Button
                key={format.name}
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting(format)}
                className="h-8 w-8 p-0"
                title={`${format.name} (${format.shortcut})`}
              >
                <format.icon className="w-3 h-3" />
              </Button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-border mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(value)}
            disabled={!value.trim()}
            className="h-8 px-2 text-xs"
            title="Копировать весь текст"
          >
            <Copy className="w-3 h-3 mr-1" />
            Копировать
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label className="text-xs font-medium flex items-center gap-2">
            <Type className="w-3 h-3" />
            Редактор с живым форматированием
          </Label>
          
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 mb-3">
            <div className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span>💡</span>
              <span>Выделите текст и нажмите кнопку форматирования или используйте Ctrl+B/I/U</span>
            </div>
          </div>
          
          <div className="relative">
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              className={`
                w-full min-h-[120px] p-3 border rounded-md bg-background 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                text-sm resize-none transition-all duration-200
                ${isExpanded ? 'min-h-[200px]' : ''}
              `}
              style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}
              suppressContentEditableWarning={true}
            />
            
            {/* Placeholder */}
            {!value && (
              <div className="absolute top-3 left-3 text-muted-foreground text-sm pointer-events-none">
                {placeholder}
              </div>
            )}
            
            {/* Character count */}
            {charCount > 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                {charCount}/4096
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        {value && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                {enableMarkdown ? '📝 Markdown' : '🏷️ HTML'} форматирование
              </span>
              <span>📊 {wordCount} слов, {charCount} символов</span>
            </div>
            <div className="flex items-center gap-1">
              {charCount <= 4096 ? (
                <span className="text-green-600 dark:text-green-400">✓ Telegram OK</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">⚠ Превышен лимит</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}