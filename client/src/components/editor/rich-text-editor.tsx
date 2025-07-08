import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  enableMarkdown?: boolean;
  onMarkdownToggle?: (enabled: boolean) => void;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Введите текст сообщения...",
  enableMarkdown = false,
  onMarkdownToggle
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const formatOptions = [
    { 
      icon: Bold, 
      name: 'Жирный', 
      markdown: '**текст**', 
      html: '<b>текст</b>',
      description: 'Выделяет текст жирным шрифтом'
    },
    { 
      icon: Italic, 
      name: 'Курсив', 
      markdown: '_текст_', 
      html: '<i>текст</i>',
      description: 'Выделяет текст курсивом'
    },
    { 
      icon: Underline, 
      name: 'Подчеркнутый', 
      markdown: '__текст__', 
      html: '<u>текст</u>',
      description: 'Подчеркивает текст'
    },
    { 
      icon: Strikethrough, 
      name: 'Зачеркнутый', 
      markdown: '~текст~', 
      html: '<s>текст</s>',
      description: 'Зачеркивает текст'
    },
    { 
      icon: Code, 
      name: 'Код', 
      markdown: '`код`', 
      html: '<code>код</code>',
      description: 'Выделяет код моноширинным шрифтом'
    },
    { 
      icon: Link, 
      name: 'Ссылка', 
      markdown: '[текст](url)', 
      html: '<a href="url">текст</a>',
      description: 'Создает кликабельную ссылку'
    }
  ];

  const insertFormatting = (format: typeof formatOptions[0]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText = '';
    const formatText = enableMarkdown ? format.markdown : format.html;
    
    if (selectedText) {
      // Replace placeholder with selected text
      newText = formatText.replace('текст', selectedText).replace('код', selectedText);
    } else {
      // Insert placeholder
      newText = formatText;
    }
    
    const newValue = value.substring(0, start) + newText + value.substring(end);
    onChange(newValue);
    
    // Set cursor position after insertion
    setTimeout(() => {
      if (selectedText) {
        textarea.setSelectionRange(start + newText.length, start + newText.length);
      } else {
        // Select the placeholder text
        const placeholderStart = start + newText.indexOf(enableMarkdown ? 'текст' : 'текст');
        const placeholderEnd = placeholderStart + 'текст'.length;
        textarea.setSelectionRange(placeholderStart, placeholderEnd);
      }
      textarea.focus();
    }, 0);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Скопировано!",
        description: "Форматирование скопировано в буфер обмена"
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderPreview = () => {
    if (!enableMarkdown) {
      // For HTML mode, just show the raw text with HTML tags
      return (
        <div className="p-3 bg-muted/50 rounded-lg border min-h-[100px] whitespace-pre-wrap">
          <div className="text-sm text-muted-foreground mb-2">HTML предпросмотр:</div>
          <div dangerouslySetInnerHTML={{ __html: value }} />
        </div>
      );
    }
    
    // For Markdown mode, convert common markdown to HTML for preview
    let htmlContent = value
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/~(.*?)~/g, '<s>$1</s>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br>');
    
    return (
      <div className="p-3 bg-muted/50 rounded-lg border min-h-[100px]">
        <div className="text-sm text-muted-foreground mb-2">Предпросмотр:</div>
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Редактор форматирования
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMarkdownToggle?.(!enableMarkdown)}
            className="text-xs"
          >
            {enableMarkdown ? 'Markdown' : 'HTML'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Formatting Toolbar */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">Панель форматирования</Label>
          <div className="grid grid-cols-2 gap-2">
            {formatOptions.map((format) => (
              <Button
                key={format.name}
                variant="outline"
                size="sm"
                onClick={() => insertFormatting(format)}
                className="justify-start gap-2 h-8 text-xs"
              >
                <format.icon className="w-3 h-3" />
                {format.name}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Text Editor with Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Type className="w-3 h-3" />
              Редактор
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-3 h-3" />
              Предпросмотр
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-3">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="min-h-[120px] resize-none"
              rows={6}
            />
            
            <div className="text-xs text-muted-foreground">
              {enableMarkdown ? (
                <span>💡 Используйте Markdown форматирование или кнопки выше</span>
              ) : (
                <span>💡 Используйте HTML теги или кнопки выше</span>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview">
            {renderPreview()}
          </TabsContent>
        </Tabs>

        {/* Quick Reference */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Быстрая справка</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(formatOptions.map(f => 
                `${f.name}: ${enableMarkdown ? f.markdown : f.html}`
              ).join('\n'))}
              className="h-6 px-2"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-1 text-xs">
            {formatOptions.slice(0, 3).map((format) => (
              <div key={format.name} className="flex items-center justify-between">
                <span className="text-muted-foreground">{format.name}:</span>
                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                  {enableMarkdown ? format.markdown : format.html}
                </code>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}