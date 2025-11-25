import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { LocalStorageService } from "@/lib/local-storage";
import type { BotProject, BotToken, BotTemplate } from "@shared/schema";

type UserDataMode = 'local' | 'server';

interface UseUserDataOptions {
  isAuthenticated: boolean;
  userId?: number;
}

// Hook для управления проектами (localStorage vs сервер)
export function useProjects(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useQuery({
    queryKey: ['/api/projects', mode],
    queryFn: async () => {
      if (mode === 'local') {
        return LocalStorageService.getProjects();
      }
      const res = await fetch('/api/user/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });
}

// Hook для загрузки одного проекта по ID
export function useProject(id: number | null, options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useQuery({
    queryKey: ['/api/projects', id, mode],
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');
      
      console.log(`[useProject] Loading project ${id} in ${mode} mode`);
      
      if (mode === 'local') {
        const projects = LocalStorageService.getProjects();
        console.log(`[useProject] Found ${projects.length} projects in localStorage`);
        const project = projects.find(p => p.id === id);
        if (!project) {
          console.error(`[useProject] Project ${id} not found in localStorage`);
          throw new Error('Project not found in localStorage');
        }
        console.log(`[useProject] Successfully loaded project ${id} from localStorage`);
        return project;
      }
      
      console.log(`[useProject] Fetching project ${id} from server`);
      const res = await fetch(`/api/user/projects/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          console.error(`[useProject] Project ${id} not found on server (404)`);
          throw new Error('Project not found on server');
        }
        console.error(`[useProject] Failed to fetch project ${id} from server`);
        throw new Error('Failed to fetch project');
      }
      const data = await res.json();
      console.log(`[useProject] Successfully loaded project ${id} from server`);
      return data;
    },
    enabled: !!id,
    retry: false,
  });
}

// Hook для управления токенами (localStorage vs сервер)
export function useTokens(options: UseUserDataOptions, projectId?: number) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useQuery({
    queryKey: ['/api/tokens', projectId, mode],
    queryFn: async () => {
      if (mode === 'local') {
        return LocalStorageService.getTokens(projectId);
      }
      const url = projectId 
        ? `/api/user/tokens?projectId=${projectId}` 
        : '/api/user/tokens';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch tokens');
      return res.json();
    },
  });
}

// Hook для управления шаблонами (localStorage vs сервер)
export function useTemplates(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useQuery({
    queryKey: ['/api/templates', mode],
    queryFn: async () => {
      if (mode === 'local') {
        return LocalStorageService.getTemplates();
      }
      const res = await fetch('/api/user/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    },
  });
}

// Hook для создания проекта
export function useCreateProject(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof LocalStorageService.saveProject>[0]) => {
      if (mode === 'local') {
        return LocalStorageService.saveProject(data);
      }
      const res = await fetch('/api/user/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });
}

// Hook для обновления проекта
export function useUpdateProject(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: number; 
      data: Parameters<typeof LocalStorageService.updateProject>[1];
    }) => {
      if (mode === 'local') {
        return LocalStorageService.updateProject(id, data);
      }
      const res = await fetch(`/api/user/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });
}

// Hook для удаления проекта
export function useDeleteProject(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async (id: number) => {
      if (mode === 'local') {
        return LocalStorageService.deleteProject(id);
      }
      const res = await fetch(`/api/user/projects/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });
}

// Hook для создания токена
export function useCreateToken(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof LocalStorageService.saveToken>[0]) => {
      if (mode === 'local') {
        return LocalStorageService.saveToken(data);
      }
      const res = await fetch('/api/user/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create token');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
    },
  });
}

// Hook для обновления токена
export function useUpdateToken(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: number; 
      data: Parameters<typeof LocalStorageService.updateToken>[1];
    }) => {
      if (mode === 'local') {
        return LocalStorageService.updateToken(id, data);
      }
      const res = await fetch(`/api/user/tokens/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update token');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
    },
  });
}

// Hook для удаления токена
export function useDeleteToken(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async (id: number) => {
      if (mode === 'local') {
        return LocalStorageService.deleteToken(id);
      }
      const res = await fetch(`/api/user/tokens/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete token');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
    },
  });
}

// Hook для создания шаблона
export function useCreateTemplate(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof LocalStorageService.saveTemplate>[0]) => {
      if (mode === 'local') {
        return LocalStorageService.saveTemplate(data);
      }
      const res = await fetch('/api/user/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });
}

// Hook для обновления шаблона
export function useUpdateTemplate(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: number; 
      data: Parameters<typeof LocalStorageService.updateTemplate>[1];
    }) => {
      if (mode === 'local') {
        return LocalStorageService.updateTemplate(id, data);
      }
      const res = await fetch(`/api/user/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });
}

// Hook для удаления шаблона
export function useDeleteTemplate(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async (id: number) => {
      if (mode === 'local') {
        return LocalStorageService.deleteTemplate(id);
      }
      const res = await fetch(`/api/user/templates/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });
}
