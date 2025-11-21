import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/editor/header';
import { useQuery } from '@tanstack/react-query';
import { BotProject, Node, Connection, BotData, BotDataWithSheets } from '@shared/schema';
import { parseCommandFromText } from '@/lib/commands';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { ArrowLeft, Send, Phone, MessageCircle, Users, Bot } from 'lucide-react';
import { SheetsManager } from '@/utils/sheets-manager';

// Функция для рендеринга markdown в HTML
const renderMarkdown = (text: string): string => {
  return text
    // Жирный текст: **text** → <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Курсив: *text* → <em>text</em>
    .replace(/\*((?:[^*]|\*{2})*?)\*/g, '<em>$1</em>')
    // Код: `text` → <code>text</code>
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs">$1</code>')
    // Переносы строк: \n → <br>
    .replace(/\n/g, '<br>')
    // Ссылки: [text](url) → <a href="url">text</a>
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
};

export default function BotPreview() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const projectId = params.id ? parseInt(params.id) : null;

  // Load project data
  const { data: projects } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
  });

  const currentProject = projects?.find(p => p.id === projectId);

  // Extract nodes and connections from project data
  const getNodesAndConnections = useCallback(() => {
    if (!currentProject?.data) return { nodes: [], connections: [] };

    const projectData = currentProject.data as any;

    // Check if it's new format with sheets
    if (SheetsManager.isNewFormat(projectData)) {
      const activeSheet = SheetsManager.getActiveSheet(projectData);
      if (activeSheet) {
        return { nodes: activeSheet.nodes, connections: activeSheet.connections };
      }
    } else {
      // Legacy format
      const botData = projectData as BotData;
      return { nodes: botData.nodes || [], connections: botData.connections || [] };
    }

    return { nodes: [], connections: [] };
  }, [currentProject?.data]);

  const { nodes, connections } = getNodesAndConnections();

  // Preview state
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [messageHistory, setMessageHistory] = useState<Array<{
    id: string;
    type: 'bot' | 'user';
    text: string;
    time: string;
    buttons?: Array<{ text: string; target?: string; action?: string; }>;
    keyboardType?: 'reply' | 'inline' | 'none';
    mediaType?: 'photo' | 'video' | 'audio' | 'document' | 'sticker' | 'voice' | 'animation' | 'location' | 'contact' | 'poll' | 'dice';
    mediaUrl?: string;
    mediaCaption?: string;
    mediaData?: any;
  }>>([]);
  const [currentReplyKeyboard, setCurrentReplyKeyboard] = useState<Array<{ text: string; target?: string; action?: string; }> | null>(null);
  const [textInput, setTextInput] = useState('');
  const [waitingForInput, setWaitingForInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Find start node or first node
  const startNode = nodes.find(node => node.type === 'start') || nodes[0];

  // Helper function to find next node based on connections
  const findNextNode = (currentNodeId: string, isSuccess: boolean = true) => {
    const fromConnections = connections.filter(conn => conn.source === currentNodeId);
    
    if (fromConnections.length === 0) {
      return null;
    }

    const nextConnection = fromConnections[0];
    return nextConnection ? nodes.find(node => node.id === nextConnection.target) : null;
  };

  // Helper function to get media information from a node
  const getMediaInfo = (node: Node) => {
    switch (node.type) {
      case 'photo':
        return {
          mediaType: 'photo' as const,
          mediaUrl: node.data.imageUrl || 'https://picsum.photos/800/600?random=1',
          mediaCaption: node.data.mediaCaption
        };
      case 'video':
        return {
          mediaType: 'video' as const,
          mediaUrl: node.data.videoUrl || 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          mediaCaption: node.data.mediaCaption
        };
      case 'audio':
        return {
          mediaType: 'audio' as const,
          mediaUrl: node.data.audioUrl || 'https://www.soundjay.com/misc/beep-07a.wav',
          mediaCaption: node.data.mediaCaption,
          mediaData: {
            performer: node.data.performer,
            duration: node.data.duration
          }
        };
      case 'document':
        return {
          mediaType: 'document' as const,
          mediaUrl: node.data.documentUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          mediaCaption: node.data.mediaCaption,
          mediaData: {
            filename: node.data.filename || node.data.documentName || 'document.pdf'
          }
        };
      case 'sticker':
        return {
          mediaType: 'sticker' as const,
          mediaUrl: node.data.stickerUrl || 'https://telegram.org/img/t_logo.png',
          mediaCaption: node.data.mediaCaption
        };
      case 'voice':
        return {
          mediaType: 'voice' as const,
          mediaUrl: node.data.voiceUrl || 'https://www.soundjay.com/misc/beep-07a.wav',
          mediaCaption: node.data.mediaCaption,
          mediaData: {
            duration: node.data.duration
          }
        };
      case 'animation':
        return {
          mediaType: 'animation' as const,
          mediaUrl: node.data.animationUrl || 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
          mediaCaption: node.data.mediaCaption
        };
      case 'location':
        return {
          mediaType: 'location' as const,
          mediaData: {
            latitude: node.data.latitude || 55.7558,
            longitude: node.data.longitude || 37.6176,
            title: node.data.title || 'Местоположение',
            address: node.data.address || 'Адрес не указан'
          }
        };
      case 'contact':
        return {
          mediaType: 'contact' as const,
          mediaData: {
            phoneNumber: node.data.phoneNumber || '+7 (900) 123-45-67',
            firstName: node.data.firstName || 'Имя',
            lastName: node.data.lastName || 'Фамилия'
          }
        };
      case 'keyboard':
        if (node.data.action === 'poll') {
          return {
            mediaType: 'poll' as const,
            mediaData: {
              question: node.data.question || 'Вопрос опроса',
              options: node.data.options || ['Вариант 1', 'Вариант 2'],
              isAnonymous: node.data.isAnonymous || true,
              allowsMultipleAnswers: node.data.allowsMultipleAnswers || false
            }
          };
        } else if (node.data.action === 'dice') {
          return {
            mediaType: 'dice' as const,
            mediaData: {
              emoji: node.data.emoji || '🎲'
            }
          };
        }
        break;
      default:
        return null;
    }
  };

  // Process node and add to chat
  const processNode = useCallback((node: Node, userMessage?: string) => {
    if (!node) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Add user message first if provided
    if (userMessage) {
      setMessageHistory(prev => [...prev, {
        id: `user-${Date.now()}`,
        type: 'user',
        text: userMessage,
        time: timeString
      }]);
    }

    // Get media info for the node
    const mediaInfo = getMediaInfo(node);

    // Create bot message
    const botMessage: any = {
      id: node.id,
      type: 'bot',
      text: node.data.text || node.data.messageText || '',
      time: timeString,
      buttons: [],
      keyboardType: 'none'
    };

    // Add media info if present
    if (mediaInfo) {
      Object.assign(botMessage, mediaInfo);
    }

    // Handle different node types
    switch (node.type) {
      case 'message':
      case 'start':
        // Add buttons if they exist
        if (node.data.buttons && node.data.buttons.length > 0) {
          botMessage.buttons = node.data.buttons.map((btn: any) => ({
            text: btn.text,
            target: btn.target,
            action: btn.action
          }));
          botMessage.keyboardType = node.data.keyboardType || 'inline';
        }
        break;

      case 'keyboard':
        if (node.data.action === 'input') {
          setWaitingForInput(true);
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }
        break;

      case 'condition':
        // For condition nodes, automatically proceed to next node
        const nextNode = findNextNode(node.id, true);
        if (nextNode) {
          setTimeout(() => processNode(nextNode), 500);
          return;
        }
        break;
    }

    // Add bot message to history
    setMessageHistory(prev => [...prev, botMessage]);

    // Set current reply keyboard
    if (botMessage.buttons && botMessage.buttons.length > 0 && botMessage.keyboardType === 'reply') {
      setCurrentReplyKeyboard(botMessage.buttons);
    } else if (botMessage.keyboardType === 'inline' || botMessage.keyboardType === 'none') {
      setCurrentReplyKeyboard(null);
    }

    // Auto scroll to bottom
    setTimeout(() => {
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    }, 100);

    // Check for auto transition first
    if (node.data.autoTransitionTo) {
      console.log(`⚡ Автопереход от ${node.id} к ${node.data.autoTransitionTo}`);
      const autoTransitionNode = nodes.find(n => n.id === node.data.autoTransitionTo);
      if (autoTransitionNode) {
        setTimeout(() => processNode(autoTransitionNode), 800);
        setCurrentNodeId(node.id);
        return;
      }
    }
    
    // If not an input node and not a node with buttons, automatically proceed to next
    if (!(node.type === 'keyboard' && node.data.action === 'input') && (!botMessage.buttons || botMessage.buttons.length === 0)) {
      const nextNode = findNextNode(node.id);
      if (nextNode) {
        setTimeout(() => processNode(nextNode), 1000);
      }
    }

    setCurrentNodeId(node.id);
  }, [connections, findNextNode, nodes]);

  // Handle button click
  const handleButtonClick = (button: { text: string; target?: string; action?: string; }) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Add user message
    setMessageHistory(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user',
      text: button.text,
      time: timeString
    }]);

    // Clear reply keyboard after button click
    setCurrentReplyKeyboard(null);

    // Find target node and process it
    if (button.target) {
      const targetNode = nodes.find(node => node.id === button.target);
      if (targetNode) {
        setTimeout(() => processNode(targetNode), 500);
      }
    } else {
      // If no target, find next node from current
      const nextNode = findNextNode(currentNodeId);
      if (nextNode) {
        setTimeout(() => processNode(nextNode), 500);
      }
    }
  };

  // Handle text input
  const handleSendMessage = () => {
    if (!textInput.trim()) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Add user message
    setMessageHistory(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user',
      text: textInput,
      time: timeString
    }]);

    const inputText = textInput;
    setTextInput('');
    setWaitingForInput(false);

    // Parse command if it starts with '/'
    if (inputText.startsWith('/')) {
      const command = parseCommandFromText(inputText);
      if (command && command.command) {
        // Find node with matching command
        const commandNode = nodes.find(node => 
          node.data.command === command.command || 
          (node.data.text || node.data.messageText)?.includes(command.command)
        );
        if (commandNode) {
          setTimeout(() => processNode(commandNode), 500);
          return;
        }
      }
    }

    // For input nodes, proceed to next node
    const currentNode = nodes.find(node => node.id === currentNodeId);
    if (currentNode?.type === 'keyboard' && currentNode.data.action === 'input') {
      const nextNode = findNextNode(currentNodeId);
      if (nextNode) {
        setTimeout(() => processNode(nextNode), 500);
      }
    }
  };

  // Handle keyboard enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle reply keyboard button click
  const handleReplyKeyboardClick = (button: { text: string; target?: string; action?: string; }) => {
    setTextInput(button.text);
    handleSendMessage();
  };

  // Reset chat
  const resetChat = () => {
    setMessageHistory([]);
    setCurrentNodeId('');
    setCurrentReplyKeyboard(null);
    setTextInput('');
    setWaitingForInput(false);
    
    if (startNode) {
      setTimeout(() => processNode(startNode), 500);
    }
  };

  // Initialize chat when component mounts or nodes change
  useEffect(() => {
    if (startNode && messageHistory.length === 0) {
      processNode(startNode);
    }
  }, [startNode, processNode, messageHistory.length]);

  // Go back to editor
  const handleGoBack = () => {
    setLocation(`/editor/${projectId}`);
  };

  // Handle tab change for header
  const handleTabChange = (tab: 'editor' | 'preview' | 'export' | 'bot') => {
    if (tab === 'editor') {
      handleGoBack();
    } else if (tab === 'preview') {
      // Already on preview
      return;
    }
    // Other tabs would need navigation logic if implemented
  };

  // Handle save (no-op for preview)
  const handleSave = () => {
    // Preview page doesn't save
  };

  // Handle export (could navigate to export or show modal)
  const handleExport = () => {
    // Could implement export functionality
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Проект не найден</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header
        projectName={currentProject.name}
        currentTab="preview"
        onTabChange={handleTabChange}
        onSave={handleSave}
        onExport={handleExport}
        isSaving={false}
      />

      {/* Chat Interface */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Чат с ботом
              <span className="text-sm font-normal text-muted-foreground ml-auto">
                {messageHistory.length} сообщений
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetChat}
                  data-testid="button-reset"
                >
                  Перезапустить
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleGoBack}
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  К редактору
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Chat messages */}
            <div 
              ref={chatAreaRef}
              className="flex-1 overflow-y-auto space-y-3 p-2 border rounded bg-muted/20"
              data-testid="chat-area"
            >
              {messageHistory.map((message, index) => (
                <div 
                  key={`${message.id}-${index}-${message.time}`} 
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-card border'
                  }`}>
                    {/* Media content */}
                    {message.mediaType && message.mediaType !== 'location' && message.mediaType !== 'contact' && message.mediaType !== 'poll' && message.mediaType !== 'dice' && (
                      <div className="mb-2">
                        {message.mediaType === 'photo' && (
                          <img src={message.mediaUrl} alt="Фото" className="max-w-full h-auto rounded" />
                        )}
                        {message.mediaType === 'video' && (
                          <video controls className="max-w-full h-auto rounded">
                            <source src={message.mediaUrl} type="video/mp4" />
                            Ваш браузер не поддерживает видео.
                          </video>
                        )}
                        {message.mediaType === 'audio' && (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm">Аудио сообщение</span>
                            {message.mediaData?.duration && (
                              <span className="text-xs text-muted-foreground">
                                {message.mediaData.duration}с
                              </span>
                            )}
                          </div>
                        )}
                        {message.mediaType === 'document' && (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm">
                              {message.mediaData?.filename || 'Документ'}
                            </span>
                          </div>
                        )}
                        {message.mediaType === 'sticker' && (
                          <img src={message.mediaUrl} alt="Стикер" className="w-32 h-32 object-contain" />
                        )}
                        {message.mediaType === 'voice' && (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm">Голосовое сообщение</span>
                            {message.mediaData?.duration && (
                              <span className="text-xs text-muted-foreground">
                                {message.mediaData.duration}с
                              </span>
                            )}
                          </div>
                        )}
                        {message.mediaType === 'animation' && (
                          <img src={message.mediaUrl} alt="Анимация" className="max-w-full h-auto rounded" />
                        )}
                      </div>
                    )}

                    {/* Special media types */}
                    {message.mediaType === 'location' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-muted rounded">
                          <MessageCircle className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{message.mediaData?.title}</div>
                            <div className="text-sm text-muted-foreground">{message.mediaData?.address}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {message.mediaType === 'contact' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-muted rounded">
                          <Users className="h-4 w-4" />
                          <div>
                            <div className="font-medium">
                              {message.mediaData?.firstName} {message.mediaData?.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {message.mediaData?.phoneNumber}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {message.mediaType === 'poll' && (
                      <div className="space-y-2">
                        <div className="font-medium">{message.mediaData?.question}</div>
                        <div className="space-y-1">
                          {message.mediaData?.options?.map((option: string, index: number) => (
                            <div key={index} className="p-2 bg-muted rounded text-sm">
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.mediaType === 'dice' && (
                      <div className="text-center">
                        <div className="text-4xl">{message.mediaData?.emoji}</div>
                      </div>
                    )}

                    {/* Text content */}
                    {message.text && (
                      <div 
                        className="text-sm whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
                      />
                    )}
                    
                    {/* Caption for media */}
                    {message.mediaCaption && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {message.mediaCaption}
                      </div>
                    )}

                    {/* Inline buttons */}
                    {message.buttons && message.buttons.length > 0 && message.keyboardType === 'inline' && (
                      <div className="mt-2 space-y-1">
                        {message.buttons.map((button, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handleButtonClick(button)}
                            data-testid={`button-inline-${index}`}
                          >
                            {button.text}
                          </Button>
                        ))}
                      </div>
                    )}

                    <div className="text-xs opacity-70 mt-1">
                      {message.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply keyboard */}
            {currentReplyKeyboard && currentReplyKeyboard.length > 0 && (
              <div className="border rounded p-2 bg-muted/20">
                <div className="text-xs text-muted-foreground mb-2">Быстрые ответы:</div>
                <div className="grid grid-cols-2 gap-2">
                  {currentReplyKeyboard.map((button, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleReplyKeyboardClick(button)}
                      data-testid={`button-reply-${index}`}
                    >
                      {button.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={waitingForInput ? "Введите ответ..." : "Введите сообщение или команду..."}
                className="flex-1"
                data-testid="input-message"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!textInput.trim()}
                data-testid="button-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}