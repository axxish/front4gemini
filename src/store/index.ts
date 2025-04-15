import { defineStore } from 'pinia';

// Define the structure for a single message in a conversation
interface Message {
  id: string; // Unique identifier for the message
  role: 'user' | 'model';
  text: string; // The content of the message
  timestamp: number; // Timestamp for when the message was created
}

// Define the structure for a conversation
interface Conversation {
  id: string; // Unique identifier for the conversation
  name: string; // Name of the conversation
  history: Message[]; // Array of messages in the conversation
  createdAt: number; // Timestamp for when the conversation was created
}

// Define the state structure
interface AppState {
  apiKey: string | null; // API key for authentication
  conversations: Conversation[]; // List of all conversations
  currentConversationId: string | null; // ID of the currently active conversation
}

// Helper function to load state from localStorage
const loadState = (): Partial<AppState> => {
  try {
    const serializedState = localStorage.getItem('chatAppState');
    return serializedState ? JSON.parse(serializedState) : {};
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return {};
  }
};

// Helper function to save state to localStorage
const saveState = (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('chatAppState', serializedState);
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
};

export const useAppStore = defineStore('app', {
  state: (): AppState => {
    const initialState: AppState = {
      apiKey: null,
      conversations: [],
      currentConversationId: null,
      ...loadState(),
    };

    // Ensure at least one default conversation exists
    if (initialState.conversations.length === 0) {
      const defaultConversationId = `conv-${Date.now()}`;
      initialState.conversations.push({
        id: defaultConversationId,
        name: 'Default Conversation',
        history: [],
        createdAt: Date.now(),
      });
      initialState.currentConversationId = defaultConversationId;
    }

    return initialState;
  },

  getters: {
    currentConversation: (state): Conversation | undefined => {
      return state.conversations.find(
        (conversation) => conversation.id === state.currentConversationId
      );
    },
    getApiKey: (state): string | null => {
      return state.apiKey;
    },
  },

  actions: {
    setApiKey(key: string) {
      this.apiKey = key;
      saveState(this.$state);
    },

    addMessageToCurrentConversation(
      messageText: string,
      role: 'user' | 'model'
    ) {
      const current = this.currentConversation;
      if (current) {
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          role,
          text: messageText,
          timestamp: Date.now(),
        };
        current.history.push(newMessage);
        saveState(this.$state);
      }
    },

    async createNewConversation() {
      const newId = `conv-${Date.now()}`;
      const defaultName = `New Chat ${this.conversations.length + 1}`;

      const newConversation = {
        id: newId,
        name: defaultName,
        history: [],
        createdAt: Date.now(),
      };

      this.conversations.push(newConversation);
      this.currentConversationId = newId;
      saveState(this.$state);
    },

    updateConversationName(id: string, name: string) {
      const conversation = this.conversations.find(conv => conv.id === id);
      if (conversation) {
        conversation.name = name;
        saveState(this.$state);
      }
    },

    switchConversation(id: string) {
      if (this.conversations.some((conversation) => conversation.id === id)) {
        this.currentConversationId = id;
        saveState(this.$state);
      }
    },

    deleteConversation(id: string) {
      this.conversations = this.conversations.filter(
        (conversation) => conversation.id !== id
      );
      if (this.currentConversationId === id) {
        this.currentConversationId =
          this.conversations.length > 0 ? this.conversations[0].id : null;
      }
      saveState(this.$state);
    },
  },
});
