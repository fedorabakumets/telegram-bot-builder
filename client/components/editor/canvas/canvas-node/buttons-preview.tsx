import { useMemo } from 'react';
import { Node } from '@/types/bot';
import { ButtonsPreviewHeader } from './buttons-preview-header';
import { InlineButton } from './inline-button';
import { ReplyButton } from './reply-button';
import { OptionButton } from './option-button';
import { DoneButton } from './done-button';
import { KeyboardGrid } from '../keyboard-grid';
import { OutputPort } from './output-port';
import { PortType } from './port-colors';
import { buildDynamicButtonsPreviewItems, getDynamicButtonsSummary, normalizeDynamicButtonsConfig } from '@/components/editor/properties/utils/dynamic-buttons';

interface ButtonsPreviewProps {
  node: Node;
  allNodes?: Node[];
  onPortMouseDown?: (e: React.MouseEvent, portType: PortType, buttonId?: string, portCenter?: { x: number; y: number }) => void;
  isConnectionSource?: boolean;
  onButtonPortMount?: (buttonId: string, offset: { x: number; y: number }) => void;
}

export function ButtonsPreview({ node, allNodes, onPortMouseDown, isConnectionSource, onButtonPortMount }: ButtonsPreviewProps) {
  const keyboardType = node.data.keyboardType as 'inline' | 'reply' | 'none';
  const enableDynamicButtons = (node.data as any).enableDynamicButtons ?? false;
  const dynamicButtons = enableDynamicButtons ? normalizeDynamicButtonsConfig((node.data as any).dynamicButtons) : null;
  const effectiveKeyboardType = enableDynamicButtons ? 'inline' : keyboardType;

  const staticButtons = node.data.buttons || [];
  const previewButtons = useMemo(() => {
    if (enableDynamicButtons) {
      return buildDynamicButtonsPreviewItems(dynamicButtons);
    }
    return staticButtons;
  }, [enableDynamicButtons, dynamicButtons, staticButtons]);

  if (previewButtons.length === 0 || effectiveKeyboardType === 'none') {
    return null;
  }

  const hasOptionButtons = staticButtons.some((button: any) => button.action === 'selection');
  const isMultiSelect = !enableDynamicButtons && hasOptionButtons && (node.data as any).allowMultipleSelection;

  const completeButton = useMemo(
    () => (isMultiSelect ? staticButtons.find((button: any) => button.action === 'complete') : undefined),
    [isMultiSelect, staticButtons]
  );
  void completeButton;

  const dynamicSummary = enableDynamicButtons ? getDynamicButtonsSummary(dynamicButtons) : '';
  const previewKeyboardLayout = enableDynamicButtons ? undefined : node.data.keyboardLayout;
  const previewDefaultColumns = enableDynamicButtons ? dynamicButtons?.columns ?? 2 : 2;

  return (
    <div className="space-y-3 mb-1">
      <ButtonsPreviewHeader
        isMultiSelect={isMultiSelect}
        keyboardType={effectiveKeyboardType}
        isDynamicMode={enableDynamicButtons}
        dynamicSummary={dynamicSummary}
      />

      {enableDynamicButtons && dynamicButtons && (
        <div className="rounded-md border border-blue-200/50 bg-blue-50/50 px-2 py-1 text-xs text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-300">
          <span className="font-medium">&#9889;</span> {dynamicButtons.sourceVariable || 'response'}
          {dynamicButtons.arrayPath ? `.${dynamicButtons.arrayPath}` : ''} ({dynamicButtons.columns} cols)
        </div>
      )}

      {effectiveKeyboardType === 'inline' ? (
        <KeyboardGrid
          buttons={previewButtons}
          keyboardLayout={previewKeyboardLayout}
          defaultColumns={previewDefaultColumns}
          buttonClassName=""
          renderButton={(button: any) => {
            if (button.action === 'complete') return <DoneButton button={button} />;
            if (button.action === 'selection') return <OptionButton button={button} />;
            return (
              <div className="relative">
                <InlineButton button={button} allNodes={allNodes} />
                {button.action === 'goto' && (
                  <OutputPort portType="button-goto" buttonId={button.id} onPortMouseDown={onPortMouseDown} isActive={isConnectionSource} onMount={onButtonPortMount} />
                )}
              </div>
            );
          }}
        />
      ) : (
        <KeyboardGrid
          buttons={previewButtons}
          keyboardLayout={previewKeyboardLayout}
          defaultColumns={previewDefaultColumns}
          buttonClassName=""
          renderButton={(button: any) => (
            <div className="relative">
              <ReplyButton button={button} allNodes={allNodes} />
              {button.action === 'goto' && (
                <OutputPort portType="button-goto" buttonId={button.id} onPortMouseDown={onPortMouseDown} isActive={isConnectionSource} onMount={onButtonPortMount} />
              )}
            </div>
          )}
        />
      )}
    </div>
  );
}
