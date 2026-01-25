/**
 * Organism Components Examples
 * 
 * Example implementations of all organism components
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { FormSection, useFormSection } from './FormSection';
import { UserCard } from './UserCard';
import { Navigation, NavigationItem, NavigationGroup } from './Navigation';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';

// FormSection Example
export const FormSectionExample: React.FC = () => {
  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  });

  const { register, formState: { errors } } = form;

  const personalInfoSection = useFormSection({
    form,
    fields: ['firstName', 'lastName'],
    sectionName: 'personalInfo',
  });

  const contactSection = useFormSection({
    form,
    fields: ['email', 'phone'],
    sectionName: 'contact',
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">FormSection Example</h2>
      
      <form className="space-y-6">
        <FormSection
          title="Personal Information"
          description="Enter your basic personal details"
          required
          error={personalInfoSection.firstError}
        >
          <FormField label="First Name" error={errors.firstName?.message}>
            <Input {...register('firstName', { required: 'First name is required' })} />
          </FormField>
          
          <FormField label="Last Name" error={errors.lastName?.message}>
            <Input {...register('lastName', { required: 'Last name is required' })} />
          </FormField>
        </FormSection>

        <FormSection
          title="Contact Information"
          description="How can we reach you?"
          error={contactSection.firstError}
        >
          <FormField label="Email" error={errors.email?.message}>
            <Input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address',
                },
              })}
            />
          </FormField>
          
          <FormField label="Phone" error={errors.phone?.message}>
            <Input {...register('phone')} />
          </FormField>
        </FormSection>

        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
};

// UserCard Example
export const UserCardExample: React.FC = () => {
  const users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '/avatars/john.jpg',
      role: 'Admin',
      status: 'online' as const,
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'User',
      status: 'away' as const,
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'Moderator',
      status: 'offline' as const,
    },
  ];

  const actions = [
    {
      label: 'Edit',
      onClick: () => console.log('Edit user'),
      variant: 'primary' as const,
      icon: 'fa-solid fa-edit',
    },
    {
      label: 'Delete',
      onClick: () => console.log('Delete user'),
      variant: 'destructive' as const,
      icon: 'fa-solid fa-trash',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">UserCard Example</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            variant="detailed"
            actions={actions}
            onCardClick={() => console.log('Card clicked:', user.name)}
          />
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Compact Variant</h3>
        <div className="space-y-2">
          {users.map((user) => (
            <UserCard
              key={`compact-${user.id}`}
              user={user}
              variant="compact"
              actions={actions.slice(0, 1)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Navigation Example
export const NavigationExample: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(['main']);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="flex h-screen">
      <Navigation
        variant="sidebar"
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(!collapsed)}
        showCollapseToggle
        header={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">TB</span>
            </div>
            <span className="font-semibold">Telegram Bot Builder</span>
          </div>
        }
        footer={
          <div className="text-xs text-muted-foreground">
            Version 1.0.0
          </div>
        }
      >
        <NavigationGroup
          title="Main"
          collapsible
          collapsed={!expandedGroups.includes('main')}
          onToggleCollapsed={() => toggleGroup('main')}
        >
          <NavigationItem
            label="Dashboard"
            href="/dashboard"
            icon="fa-solid fa-home"
          />
          <NavigationItem
            label="Projects"
            href="/projects"
            icon="fa-solid fa-folder"
            badge={5}
          />
          <NavigationItem
            label="Templates"
            href="/templates"
            icon="fa-solid fa-file-code"
          />
        </NavigationGroup>

        <NavigationGroup
          title="Tools"
          variant="separated"
          collapsible
          collapsed={!expandedGroups.includes('tools')}
          onToggleCollapsed={() => toggleGroup('tools')}
        >
          <NavigationItem
            label="Database"
            href="/database"
            icon="fa-solid fa-database"
          />
          <NavigationItem
            label="Analytics"
            href="/analytics"
            icon="fa-solid fa-chart-bar"
            badge="New"
            badgeVariant="primary"
          />
        </NavigationGroup>

        <NavigationGroup title="Settings">
          <NavigationItem
            label="Preferences"
            href="/settings"
            icon="fa-solid fa-cog"
          />
          <NavigationItem
            label="Help"
            href="/help"
            icon="fa-solid fa-question-circle"
          />
        </NavigationGroup>
      </Navigation>

      <div className="flex-1 p-6 bg-background">
        <h1 className="text-2xl font-bold mb-4">Navigation Example</h1>
        <p className="text-muted-foreground">
          This is the main content area. The navigation sidebar supports
          collapsing, nested items, badges, and responsive behavior.
        </p>
      </div>
    </div>
  );
};

// Combined Examples
export const OrganismExamples: React.FC = () => {
  const [activeExample, setActiveExample] = React.useState('formSection');

  const examples = [
    { id: 'formSection', label: 'FormSection', component: FormSectionExample },
    { id: 'userCard', label: 'UserCard', component: UserCardExample },
    { id: 'navigation', label: 'Navigation', component: NavigationExample },
  ];

  const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component || FormSectionExample;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Organism Components</h1>
          <div className="flex gap-2">
            {examples.map((example) => (
              <Button
                key={example.id}
                variant={activeExample === example.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveExample(example.id)}
              >
                {example.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <ActiveComponent />
    </div>
  );
};

export default OrganismExamples;