import { create } from 'zustand';

export interface Content {
  id: string;
  url?: string;
  title: string;
  description?: string;
  content?: string;
  contentType: 'url' | 'text' | 'voice' | 'image';
  status: 'unprocessed' | 'read_later' | 'listen_later' | 'archived' | 'deleted';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  readProgress?: number;
  estimatedReadTime?: number;
  sourceApp?: string;
  thumbnail?: string;
}

export interface ContentFilter {
  status?: Content['status'];
  contentType?: Content['contentType'];
  tags?: string[];
  searchQuery?: string;
}

export interface ContentState {
  inbox: Content[];
  library: Content[];
  isLoading: boolean;
  error: string | null;
  selectedContent: Content | null;
  filter: ContentFilter;
}

export interface ContentActions {
  // Inbox management
  fetchInbox: () => Promise<void>;
  captureContent: (data: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  categorizeContent: (id: string, status: Content['status']) => Promise<void>;
  bulkCategorize: (ids: string[], status: Content['status']) => Promise<void>;

  // Library management
  fetchLibrary: () => Promise<void>;
  searchLibrary: (query: string, filters?: ContentFilter) => Promise<void>;

  // Content management
  updateContent: (id: string, updates: Partial<Content>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  setSelectedContent: (content: Content | null) => void;

  // Filters and search
  setFilter: (filter: ContentFilter) => void;
  clearFilter: () => void;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export type ContentStore = ContentState & ContentActions;

const initialState: ContentState = {
  inbox: [],
  library: [],
  isLoading: false,
  error: null,
  selectedContent: null,
  filter: {},
};

export const useContentStore = create<ContentStore>((set, get) => ({
  ...initialState,

  fetchInbox: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/content/inbox', {
        headers: {
          'Authorization': `Bearer ${/* get auth token */}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inbox');
      }

      const data = await response.json();
      set({ inbox: data.content, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
    }
  },

  captureContent: async (contentData) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/content/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${/* get auth token */}`,
        },
        body: JSON.stringify(contentData),
      });

      if (!response.ok) {
        throw new Error('Failed to capture content');
      }

      const newContent = await response.json();

      set(state => ({
        inbox: [newContent, ...state.inbox],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
      throw error;
    }
  },

  categorizeContent: async (id: string, status: Content['status']) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/content/${id}/categorize`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${/* get auth token */}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to categorize content');
      }

      const updatedContent = await response.json();

      set(state => ({
        inbox: state.inbox.map(item =>
          item.id === id ? updatedContent : item
        ),
        library: status !== 'deleted' && status !== 'unprocessed'
          ? [...state.library.filter(item => item.id !== id), updatedContent]
          : state.library.filter(item => item.id !== id),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  },

  bulkCategorize: async (ids: string[], status: Content['status']) => {
    try {
      // TODO: Replace with actual API calls
      await Promise.all(
        ids.map(id => get().categorizeContent(id, status))
      );
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  },

  fetchLibrary: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/library/search', {
        headers: {
          'Authorization': `Bearer ${/* get auth token */}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch library');
      }

      const data = await response.json();
      set({ library: data.content, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
    }
  },

  searchLibrary: async (query: string, filters?: ContentFilter) => {
    set({ isLoading: true, error: null });
    try {
      const searchParams = new URLSearchParams({
        q: query,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.contentType && { type: filters.contentType }),
        ...(filters?.tags && { tags: filters.tags.join(',') }),
      });

      // TODO: Replace with actual API call
      const response = await fetch(`/api/library/search?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${/* get auth token */}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search library');
      }

      const data = await response.json();
      set({ library: data.content, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
    }
  },

  updateContent: async (id: string, updates: Partial<Content>) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/content/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${/* get auth token */}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update content');
      }

      const updatedContent = await response.json();

      set(state => ({
        inbox: state.inbox.map(item =>
          item.id === id ? updatedContent : item
        ),
        library: state.library.map(item =>
          item.id === id ? updatedContent : item
        ),
        selectedContent: state.selectedContent?.id === id
          ? updatedContent
          : state.selectedContent,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  },

  deleteContent: async (id: string) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/content/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${/* get auth token */}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      set(state => ({
        inbox: state.inbox.filter(item => item.id !== id),
        library: state.library.filter(item => item.id !== id),
        selectedContent: state.selectedContent?.id === id
          ? null
          : state.selectedContent,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  },

  setSelectedContent: (content: Content | null) => {
    set({ selectedContent: content });
  },

  setFilter: (filter: ContentFilter) => {
    set({ filter });
  },

  clearFilter: () => {
    set({ filter: {} });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));