/** @fileoverview Настройки оформления, навигации и видимости Mini в этом браузере. */
import { useTheme } from '@/components/editor/header/utils/theme-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WorkspaceLayoutSettings } from './workspace-layout-settings';
import { MiniVisibilitySetting } from './mini-visibility-setting';
import { setSidebarPosition, sidebarPositions, useSidebarPosition } from '@/components/editor/app-sidebar/hooks/use-sidebar-position';

/** Состояние боковой панели передаёт профиль. */
interface InterfaceSettingsCardProps {
  /** Свёрнута ли панель. */
  isSidebarCollapsed: boolean;
  /** Применяет и сохраняет новое состояние боковой панели. */
  onToggleSidebar: () => void;
  /** Проект для открытия выбранной вкладки в новом окне браузера. */
  previewProjectId?: number;
}

/** Доступные варианты оформления. */
const themeOptions = [['dark', 'Тёмная'], ['light', 'Светлая'], ['system', 'Как в системе']] as const;

/**
 * Применяет выбор через существующие локальные настройки приложения.
 * @param props - Состояние сайдбара и действие переключения.
 * @returns Раздел интерфейса в профиле.
 */
export function InterfaceSettingsCard({ isSidebarCollapsed, onToggleSidebar, previewProjectId }: InterfaceSettingsCardProps) {
  const { theme, setTheme } = useTheme();
  const sidebarPosition = useSidebarPosition();

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Интерфейс</CardTitle>
        <CardDescription>Настройки применяются сразу и сохраняются в этом браузере.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="profile-interface-theme">Тема</Label>
          <Select value={theme} onValueChange={value => {
            const option = themeOptions.find(([key]) => key === value);
            if (option) setTheme(option[0]);
          }}>
            <SelectTrigger id="profile-interface-theme"><SelectValue /></SelectTrigger>
            <SelectContent>{themeOptions.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="profile-sidebar-position">Положение панели навигации</Label>
          <Select value={sidebarPosition} onValueChange={value => {
            const selected = sidebarPositions.find(([position]) => position === value);
            if (selected) setSidebarPosition(selected[0]);
          }}>
            <SelectTrigger id="profile-sidebar-position"><SelectValue /></SelectTrigger>
            <SelectContent>{sidebarPositions.map(([position, label]) => <SelectItem key={position} value={position}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3 sm:self-end sm:pb-2">
          <Label htmlFor="profile-interface-sidebar">Свёрнутый сайдбар</Label>
          <Switch id="profile-interface-sidebar" checked={isSidebarCollapsed} onCheckedChange={onToggleSidebar}
            disabled={sidebarPosition === 'top' || sidebarPosition === 'bottom'} />
        </div>
        <MiniVisibilitySetting />
        <WorkspaceLayoutSettings projectId={previewProjectId} />
      </CardContent>
    </Card>
  );
}
