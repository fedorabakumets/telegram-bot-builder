import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { FolderOpen, Bookmark, Save, Download, User, Send, Github } from 'lucide-react';
import { useState, useEffect, useRef, memo } from 'react';

interface HeaderProps {
  projectName: string;
  currentTab: 'editor' | 'preview' | 'export' | 'bot';
  onTabChange: (tab: 'editor' | 'preview' | 'export' | 'bot') => void;
  onSave: () => void;
  onExport: () => void;
  onSaveAsTemplate?: () => void;
  onLoadTemplate?: () => void;
  isSaving?: boolean;
}

function Header({ projectName, currentTab, onTabChange, onSave, onExport, onSaveAsTemplate, onLoadTemplate, isSaving }: HeaderProps) {
  const headerRef = useRef<HTMLHeadElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const lastLogRef = useRef(0);
  const mouseCountRef = useRef(0);
  const renderCountRef = useRef(0);
  const lastRenderLogRef = useRef(0);
  
  // 🟡 ЛОГИРОВАНИЕ РЕНДЕРОВ: Отслеживаем как часто header рендерится
  renderCountRef.current++;
  useEffect(() => {
    const now = performance.now();
    if (now - lastRenderLogRef.current > 300) {
      console.log(`🟡 HEADER RENDER #${renderCountRef.current} at ${now.toFixed(0)}ms`);
      lastRenderLogRef.current = now;
    }
  });
  
  // 🖱️ УЛУЧШЕННОЕ ОТСЛЕЖИВАНИЕ МЫШКИ: Логируем движение в header каждые 500ms
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const headerRect = headerRef.current?.getBoundingClientRect();
      if (headerRect && e.clientY < headerRect.bottom) {
        setMousePos({ x: e.clientX, y: e.clientY });
        mouseCountRef.current++;
        
        const now = performance.now();
        if (now - lastLogRef.current > 500) {
          const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
          console.log(`🖱️ HEADER MOUSE: pos=(${e.clientX}, ${e.clientY}), element=${elementUnderMouse?.tagName}.${elementUnderMouse?.className?.split(' ')[0]}`);
          lastLogRef.current = now;
        }
      }
    };
    
    const handleMouseEnter = () => {
      console.log(`➡️ MOUSE ENTER HEADER`);
    };
    
    const handleMouseLeave = () => {
      console.log(`⬅️ MOUSE LEAVE HEADER`);
      mouseCountRef.current = 0;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    headerRef.current?.addEventListener('mouseenter', handleMouseEnter);
    headerRef.current?.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      headerRef.current?.removeEventListener('mouseenter', handleMouseEnter);
      headerRef.current?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Логировать изменения стилей в header
  useEffect(() => {
    if (!headerRef.current) return;
    
    const headerElement = headerRef.current;
    let styleChangeCount = 0;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
            styleChangeCount++;
          }
        }
      });
    });
    
    observer.observe(headerElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      subtree: true,
      attributeOldValue: true
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <header ref={headerRef} data-testid="editor-header" className="bg-background border-b border-border h-16 flex items-center justify-between px-6 relative z-50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fab fa-telegram-plane text-primary-foreground text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">BotCraft Studio</h1>
            <p className="text-xs text-muted-foreground">{projectName}</p>
          </div>
        </div>
        
        <div className="h-6 w-px bg-border"></div>
        
        <nav className="flex flex-wrap items-center gap-1 max-sm:grid max-sm:grid-cols-2 max-sm:gap-x-2 max-sm:gap-y-1">
          {[
            { key: 'editor', label: 'Редактор' },
            { key: 'preview', label: 'Превью' },
            { key: 'export', label: 'Экспорт' },
            { key: 'bot', label: 'Бот' }
          ].map((tab) => (
            <button 
              key={tab.key}
              onClick={() => onTabChange(tab.key as any)}
              className={`px-3 py-1.5 text-sm max-sm:text-xs max-sm:px-2 max-sm:py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
                currentTab === tab.key 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 max-sm:grid max-sm:grid-cols-3 max-sm:gap-x-1 max-sm:gap-y-1 max-sm:text-xs">
        {onLoadTemplate && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log('Templates button clicked in header');
              onLoadTemplate();
            }}
            className="flex items-center justify-center px-1 py-0.5 text-xs max-sm:px-1 max-sm:py-0.5 max-sm:min-w-0 max-sm:w-full"
          >
            <FolderOpen className="h-2.5 w-2.5 max-sm:mx-auto text-muted-foreground" />
            <span className="max-sm:hidden ml-1">Шаблон</span>
          </Button>
        )}
        
        {onSaveAsTemplate && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSaveAsTemplate}
            className="flex items-center justify-center px-1 py-0.5 text-xs max-sm:px-1 max-sm:py-0.5 max-sm:min-w-0 max-sm:w-full"
          >
            <Bookmark className="h-2.5 w-2.5 max-sm:mx-auto text-muted-foreground" />
            <span className="max-sm:hidden ml-1">Создать</span>
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center justify-center px-1 py-0.5 text-xs max-sm:px-1 max-sm:py-0.5 max-sm:min-w-0 max-sm:w-full"
        >
          <Save className={`h-2.5 w-2.5 max-sm:mx-auto text-muted-foreground ${isSaving ? 'animate-spin' : ''}`} />
          <span className="max-sm:hidden ml-1">{isSaving ? 'Сохр...' : 'Сохр'}</span>
        </Button>
        
        <Button 
          size="sm"
          onClick={onExport}
          className="flex items-center justify-center px-1 py-0.5 text-xs max-sm:px-1 max-sm:py-0.5 max-sm:min-w-0 max-sm:w-full max-sm:col-span-2"
        >
          <i className="fas fa-download text-2xs max-sm:mx-auto"></i>
          <span className="max-sm:hidden ml-1">Экспорт</span>
        </Button>
        
        <div className="h-6 w-px bg-border max-sm:hidden"></div>
        
        <Button 
          variant="outline" 
          size="sm"
          asChild
          className="flex items-center justify-center px-1 py-0.5 text-xs max-sm:px-1 max-sm:py-0.5 max-sm:min-w-0"
          title="Открыть проект на GitHub"
        >
          <a
            href="https://github.com/fedorabakumets/telegram-bot-builder"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4 text-muted-foreground" />
            <span className="max-sm:hidden ml-1">GitHub</span>
          </a>
        </Button>
        
        <div className="max-sm:col-span-1 max-sm:flex max-sm:justify-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

// ✅ MEMO с custom comparator - игнорируем функции которые всегда разные
function propsAreEqual(prev: any, next: any) {
  for (const key in next) {
    const prevVal = prev[key];
    const nextVal = next[key];
    
    // Игнорируем функции - они всегда разные references
    if (typeof nextVal === 'function') continue;
    
    // Сравниваем остальное
    if (prevVal !== nextVal) {
      return false;
    }
  }
  return true;
}

export default memo(Header, propsAreEqual);
