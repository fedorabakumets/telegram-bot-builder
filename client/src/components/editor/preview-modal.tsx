import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Node } from '@/types/bot';
import { useState } from 'react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  projectName: string;
}

export function PreviewModal({ isOpen, onClose, nodes, projectName }: PreviewModalProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [messageHistory, setMessageHistory] = useState<Array<{
    id: string;
    type: 'bot' | 'user';
    text: string;
    time: string;
    buttons?: Array<{ text: string; target?: string; }>;
  }>>([]);

  // Find start node or first node
  const startNode = nodes.find(node => node.type === 'start') || nodes[0];

  const handleStart = () => {
    if (!startNode) return;
    
    const time = new Date().toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const botMessage = {
      id: `msg-${Date.now()}`,
      type: 'bot' as const,
      text: startNode.data.messageText || 'Привет!',
      time,
      buttons: startNode.data.keyboardType !== 'none' ? startNode.data.buttons : undefined
    };

    setMessageHistory([botMessage]);
    setCurrentNodeId(startNode.id);
  };

  const handleButtonClick = (buttonText: string, target?: string) => {
    const time = new Date().toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      type: 'user' as const,
      text: buttonText,
      time
    };

    setMessageHistory(prev => [...prev, userMessage]);

    // Navigate to target node if exists
    setTimeout(() => {
      if (target) {
        // Find the target node by ID
        const targetNode = nodes.find(node => node.id === target);
        
        if (targetNode) {
          // Update current node
          setCurrentNodeId(targetNode.id);
          
          // Create bot response from target node
          const botResponse = {
            id: `msg-${Date.now()}-bot`,
            type: 'bot' as const,
            text: targetNode.data.messageText || 'Сообщение',
            time: new Date().toLocaleTimeString('ru-RU', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            buttons: targetNode.data.keyboardType !== 'none' ? targetNode.data.buttons : undefined
          };

          setMessageHistory(prev => [...prev, botResponse]);
        } else {
          // Node not found - show error
          const errorResponse = {
            id: `msg-${Date.now()}-bot`,
            type: 'bot' as const,
            text: `❌ Экран с ID "${target}" не найден`,
            time: new Date().toLocaleTimeString('ru-RU', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          };

          setMessageHistory(prev => [...prev, errorResponse]);
        }
      } else {
        // No target specified
        const defaultResponse = {
          id: `msg-${Date.now()}-bot`,
          type: 'bot' as const,
          text: 'Функция в разработке',
          time: new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };

        setMessageHistory(prev => [...prev, defaultResponse]);
      }
    }, 500);
  };

  const reset = () => {
    setMessageHistory([]);
    setCurrentNodeId('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] p-0">
        <DialogHeader className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fab fa-telegram-plane text-white text-sm"></i>
            </div>
            <div>
              <DialogTitle className="font-semibold text-gray-900">Превью бота</DialogTitle>
              <p className="text-xs text-gray-500">{projectName}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Chat Area */}
        <div className="h-96 bg-gray-100 overflow-y-auto p-4 space-y-3">
          {messageHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-robot text-primary text-xl"></i>
                </div>
                <p className="text-sm text-gray-600 mb-4">Нажмите "Запустить", чтобы протестировать бота</p>
                <button
                  onClick={handleStart}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={!startNode}
                >
                  {startNode ? 'Запустить бота' : 'Нет стартового узла'}
                </button>
              </div>
            </div>
          ) : (
            messageHistory.map((message) => (
              <div key={message.id}>
                {message.type === 'bot' ? (
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-robot text-white text-xs"></i>
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-lg px-4 py-3 max-w-xs shadow-sm">
                      <p className="text-sm text-gray-900">{message.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{message.time}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2 justify-end">
                    <div className="bg-blue-500 text-white rounded-2xl rounded-tr-lg px-4 py-3 max-w-xs">
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs text-blue-200 mt-1">{message.time}</p>
                    </div>
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-user text-gray-600 text-xs"></i>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                {message.type === 'bot' && message.buttons && (
                  <div className="ml-10 mt-2">
                    {message.buttons.length <= 2 ? (
                      <div className="space-y-1">
                        {message.buttons.map((button, index) => (
                          <button
                            key={index}
                            onClick={() => handleButtonClick(button.text, button.target)}
                            className="w-full bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            {button.text}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        {message.buttons.map((button, index) => (
                          <button
                            key={index}
                            onClick={() => handleButtonClick(button.text, button.target)}
                            className="bg-blue-500 text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            {button.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={reset}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Сбросить
            </button>
            <div className="flex-1"></div>
            <span className="text-xs text-gray-500">
              {messageHistory.length} сообщений
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
