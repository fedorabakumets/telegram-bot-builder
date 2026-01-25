/**
 * Template Layout Examples
 * 
 * Example implementations showing how to use the different layout templates
 * with proper integration of navigation, themes, and responsive design.
 */

import React from 'react';
import { DashboardLayout } from './DashboardLayout';
import { EditorLayout } from './EditorLayout';
import { AuthLayout } from './AuthLayout';
import { Navigation } from '../organisms/Navigation/Navigation';
import { NavigationGroup } from '../organisms/Navigation/NavigationGroup';
import { NavigationItem } from '../organisms/Navigation/NavigationItem';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Typography } from '../atoms/Typography';
import { FormField } from '../molecules/FormField';
import { Input } from '../atoms/Input';

// Dashboard Layout Example
export const DashboardLayoutExample: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const navigation = (
    <Navigation
      variant="sidebar"
      header={
        <div className="flex items-center gap-3">
          <Icon name="fa-solid fa-robot" size="lg" className="text-primary" />
          <Typography variant="h3" className="font-bold">
            Bot Builder
          </Typography>
        </div>
      }
      footer={
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Icon name="fa-solid fa-cog" size="sm" className="mr-2" />
            Settings
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Icon name="fa-solid fa-sign-out-alt" size="sm" className="mr-2" />
            Logout
          </Button>
        </div>
      }
    >
      <NavigationGroup title="Main">
        <NavigationItem
          label="Dashboard"
          href="/dashboard"
          icon="fa-solid fa-home"
          active
        />
        <NavigationItem
          label="Bots"
          href="/bots"
          icon="fa-solid fa-robot"
          badge={5}
        />
        <NavigationItem
          label="Templates"
          href="/templates"
          icon="fa-solid fa-layer-group"
        />
      </NavigationGroup>
      
      <NavigationGroup title="Tools">
        <NavigationItem
          label="Editor"
          href="/editor"
          icon="fa-solid fa-edit"
        />
        <NavigationItem
          label="Analytics"
          href="/analytics"
          icon="fa-solid fa-chart-bar"
        />
      </NavigationGroup>
    </Navigation>
  );

  return (
    <DashboardLayout
      navigation={navigation}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      pageTitle="Dashboard"
      breadcrumbs={
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Home</span>
          <Icon name="fa-solid fa-chevron-right" size="xs" />
          <span>Dashboard</span>
        </div>
      }
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Icon name="fa-solid fa-plus" size="sm" className="mr-2" />
            New Bot
          </Button>
          <Button variant="ghost" size="sm">
            <Icon name="fa-solid fa-bell" size="sm" />
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Typography variant="h2">Welcome to Bot Builder</Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <Typography variant="h3" className="mb-2">Total Bots</Typography>
            <Typography variant="h1" className="text-primary">12</Typography>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <Typography variant="h3" className="mb-2">Active Users</Typography>
            <Typography variant="h1" className="text-success">1,234</Typography>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <Typography variant="h3" className="mb-2">Messages Today</Typography>
            <Typography variant="h1" className="text-info">5,678</Typography>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Editor Layout Example
export const EditorLayoutExample: React.FC = () => {
  const toolbar = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <Typography variant="h3" className="font-semibold">
          Bot Editor
        </Typography>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Icon name="fa-solid fa-save" size="sm" className="mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <Icon name="fa-solid fa-play" size="sm" className="mr-2" />
            Test
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Icon name="fa-solid fa-undo" size="sm" />
        </Button>
        <Button variant="ghost" size="sm">
          <Icon name="fa-solid fa-redo" size="sm" />
        </Button>
      </div>
    </div>
  );

  const leftPanel = (
    <div className="p-4 space-y-4">
      <Typography variant="h4" className="font-semibold">Properties</Typography>
      <div className="space-y-3">
        <FormField label="Node Name">
          <Input placeholder="Enter node name" />
        </FormField>
        <FormField label="Message">
          <textarea
            className="w-full p-2 border rounded-md resize-none"
            rows={4}
            placeholder="Enter message text"
          />
        </FormField>
      </div>
    </div>
  );

  const rightPanel = (
    <div className="p-4 space-y-4">
      <Typography variant="h4" className="font-semibold">Components</Typography>
      <div className="space-y-2">
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Icon name="fa-solid fa-comment" size="sm" className="mr-2" />
          Message
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Icon name="fa-solid fa-question" size="sm" className="mr-2" />
          Question
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Icon name="fa-solid fa-code" size="sm" className="mr-2" />
          Code
        </Button>
      </div>
    </div>
  );

  const bottomPanel = (
    <div className="p-4">
      <Typography variant="h4" className="font-semibold mb-4">Code View</Typography>
      <div className="bg-muted p-4 rounded-md font-mono text-sm">
        <pre>{`{
  "type": "message",
  "content": "Hello, World!",
  "next": null
}`}</pre>
      </div>
    </div>
  );

  return (
    <EditorLayout
      toolbar={toolbar}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      bottomPanel={bottomPanel}
    >
      <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg m-4">
        <div className="text-center space-y-4">
          <Icon name="fa-solid fa-mouse-pointer" size="xl" className="text-muted-foreground" />
          <Typography variant="body1" className="text-muted-foreground">
            Canvas Area - Drag components here
          </Typography>
        </div>
      </div>
    </EditorLayout>
  );
};

// Auth Layout Example
export const AuthLayoutExample: React.FC = () => {
  const logo = (
    <div className="flex items-center justify-center">
      <Icon name="fa-solid fa-robot" size="xl" className="text-primary" />
    </div>
  );

  const footer = (
    <div className="space-y-2">
      <Typography variant="body-small" className="text-muted-foreground">
        Don't have an account?{' '}
        <a href="#" className="text-primary hover:underline">
          Sign up
        </a>
      </Typography>
      <Typography variant="caption" className="text-muted-foreground">
        © 2024 Bot Builder. All rights reserved.
      </Typography>
    </div>
  );

  const sideContent = (
    <div className="text-center space-y-6">
      <Icon name="fa-solid fa-robot" size="4xl" className="text-primary" />
      <div className="space-y-4">
        <Typography variant="h2" className="font-bold">
          Build Amazing Bots
        </Typography>
        <Typography variant="body1" className="text-muted-foreground max-w-md">
          Create powerful Telegram bots with our intuitive visual editor.
          No coding required.
        </Typography>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <Icon name="fa-solid fa-check" className="text-success" />
          <Typography variant="body-small">Visual Editor</Typography>
        </div>
        <div className="space-y-2">
          <Icon name="fa-solid fa-check" className="text-success" />
          <Typography variant="body-small">No Coding</Typography>
        </div>
        <div className="space-y-2">
          <Icon name="fa-solid fa-check" className="text-success" />
          <Typography variant="body-small">Real-time Testing</Typography>
        </div>
        <div className="space-y-2">
          <Icon name="fa-solid fa-check" className="text-success" />
          <Typography variant="body-small">Easy Deployment</Typography>
        </div>
      </div>
    </div>
  );

  return (
    <AuthLayout
      variant="split"
      background="gradient"
      title="Welcome Back"
      subtitle="Sign in to your Bot Builder account"
      logo={logo}
      footer={footer}
      sideContent={sideContent}
      sidePosition="left"
    >
      <div className="space-y-4">
        <FormField label="Email">
          <Input type="email" placeholder="Enter your email" />
        </FormField>
        <FormField label="Password">
          <Input type="password" placeholder="Enter your password" />
        </FormField>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded" />
            Remember me
          </label>
          <a href="#" className="text-sm text-primary hover:underline">
            Forgot password?
          </a>
        </div>
        <Button className="w-full">
          Sign In
        </Button>
      </div>
    </AuthLayout>
  );
};

// Export all examples
export const TemplateExamples = {
  DashboardLayoutExample,
  EditorLayoutExample,
  AuthLayoutExample,
};