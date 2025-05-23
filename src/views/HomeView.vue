<template>
  <div class="layout-root">
    <div v-if="!sidebarCollapsed" class="sidebar-container">
      <SidebarMenu
        :conversations="conversations"
        :currentConversationId="currentConversationId ?? undefined"
        :apiKey="apiKey ?? undefined"
        :isSidebarOpen="isSidebarOpen"
        :models="models"
        :selectedModel="selectedModel"
        @collapse="collapseSidebar"
        @new-conversation="startNewConversation"
        @switch-conversation="switchConversation"
        @delete-conversation="deleteConversation"
        @update-api-key="updateApiKey"
        @update-selected-model="updateSelectedModel"
      />
    </div>
    <div v-else-if="sidebarCollapsed" class="sidebar-collapsed" @click="expandSidebar" title="Expand sidebar"></div>
    <div class="main-area">
      <div class="chat-area-outer">
        <ChatArea>
          <div v-if="!apiKey" class="api-key-missing">
            <div class="alert">
              <h3>⚠️ API Key Required</h3>
              <p>Please enter your Google AI API key in the sidebar to start chatting.</p>
            </div>
          </div>
          <div v-else-if="currentConversation" class="chat-content">
            <h3>{{ currentConversation.name }}</h3>
            <MessageList
              :messages="currentConversation.history"
              :isLoading="isLoading"
              :error="error ?? undefined"
              :spinnerChar="spinnerChar"
              :renderMarkdown="renderMarkdown"
            />
            <UserInput
              v-model="userInput"
              :isLoading="isLoading"
              @send="sendMessage"
              @stop-streaming="stopStreaming"
            />
          </div>
          <div v-else>
            <p>Select or start a conversation.</p>
          </div>
        </ChatArea>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
  import { useAppStore } from '@/store'; // Corrected path
  import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
    ChatSession,
  } from '@google/generative-ai';
  import MarkdownIt from 'markdown-it';
  import SidebarMenu from '@/components/Sidebar/Sidebar.vue';
  import ChatArea from '@/components/Chat/ChatArea.vue';
  import MessageList from '@/components/Chat/MessageList.vue';
  import UserInput from '@/components/Chat/UserInput.vue';
  
  interface GoogleModel {
    name: string;
    displayName: string;
    [key: string]: unknown;
  }

  // Helper to load models from Google API
  async function loadModels(store: ReturnType<typeof useAppStore>, apiKey: string) {
    if (!apiKey) return;
    let cached = localStorage.getItem('modelListCache');
    let models: GoogleModel[] = [];
    if (cached) {
      try {
        models = JSON.parse(cached);
      } catch {
        // Ignore JSON parse errors and fallback to fetching models
      }
    } else {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await resp.json();
        models = (data.models || [])
          .filter((m: GoogleModel) => m.displayName && m.name && Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'));
        models = models.map((m: GoogleModel) => ({ name: m.name, displayName: m.displayName }));
        localStorage.setItem('modelListCache', JSON.stringify(models));
      } catch (e) {
        models = [{ name: 'models/gemini-2.0-flash', displayName: 'Gemini 2.0 Flash' }];
      }
    }
    store.setModels(models);
  }

  export default defineComponent({
    name: 'HomeView',
    components: {
      SidebarMenu,
      ChatArea,
      MessageList,
      UserInput
    },
    setup() {
      const md = new MarkdownIt({
        html: false,
        breaks: true,
        linkify: true,
        typographer: true,
        xhtmlOut: true,
      })
        .disable(['lheading', 'heading', 'hr'])
        .enable(['newline']);

      // Add a custom rule to preserve certain whitespace
      md.enable(['newline']);

      const renderMarkdown = (text: string) => {
        try {
          // Preserve line breaks while preventing unwanted splits
          const processedText = text
            .replace(/\r\n/g, '\n')
            // Preserve intentional line breaks
            .replace(/\n\n+/g, '\n\n')
            // Add spaces after list markers to prevent splitting
            .replace(/^([*+-]|\d+\.)\s*/gm, '$1 ');

          return md.render(processedText);
        } catch (e) {
          console.error('Error rendering markdown:', e);
          return text || '';
        }
      };

      const store = useAppStore();
      const userInput = ref('');
      const isLoading = ref(false);
      const error = ref<string | null>(null);
      let chatSession = ref<ChatSession | null>(null);
      let isSending = false; // Global lock to prevent concurrent sends
      let stopStreamController: AbortController | null = null;

      const apiKey = computed(() => store.getApiKey);
      const conversations = computed(() => store.conversations);
      const currentConversationId = computed(() => store.currentConversationId);
      const currentConversation = computed(() => store.currentConversation);
      const models = computed(() => store.getModels);
      const selectedModel = computed(() => store.getSelectedModel);

      // Spinner animation state
      const spinnerFrames = ['|', '/', '-', '\\'];
      const spinnerChar = ref(spinnerFrames[0]);
      let spinnerIndex = 0;
      let spinnerInterval: number | null = null;

      onMounted(() => {
        // Load models on first mount if not cached, and whenever API key changes
        if (apiKey.value) {
          loadModels(store, apiKey.value);
        }
        spinnerInterval = window.setInterval(() => {
          spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
          spinnerChar.value = spinnerFrames[spinnerIndex];
        }, 120);
      });
      onUnmounted(() => {
        if (spinnerInterval) clearInterval(spinnerInterval);
      });

      watch(apiKey, (newKey, oldKey) => {
        if (newKey && newKey !== oldKey) {
          localStorage.removeItem('modelListCache');
          loadModels(store, newKey);
        }
      });

      // Function to initialize or update the chat session when API key or conversation changes
      const initializeChat = () => {
        error.value = null; // Clear previous errors
        if (apiKey.value && currentConversation.value && selectedModel.value) {
          try {
            const genAI = new GoogleGenerativeAI(apiKey.value);
            chatSession.value = genAI
              .getGenerativeModel({ model: selectedModel.value })
              .startChat({
                // Pass existing history to the chat session
                history: currentConversation.value.history.map((message) => ({
                  parts: [{ text: message.text }],
                  role: message.role,
                })),
                generationConfig: {
                  maxOutputTokens: 800, // Adjust as needed
                },
                safetySettings: [
                  {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                  },
                  {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                  },
                  // Add other categories as needed
                ],
              });
          } catch (e) {
            if (e instanceof Error) {
              console.error('Failed to initialize GoogleGenerativeAI:', e);
              error.value = `Failed to initialize AI. Check API Key and configuration. Error: ${e.message}`;
            } else {
              console.error('Failed to initialize GoogleGenerativeAI:', e);
              error.value = 'Failed to initialize AI. Check API Key and configuration.';
            }
            chatSession.value = null;
          }
        } else {
          chatSession.value = null; // Clear session if no key or conversation
        }
      };

      // Watch for changes in API key or current conversation to re-initialize chat
      watch([apiKey, currentConversationId], initializeChat, {
        immediate: true,
      });

      const updateApiKey = (key: string) => {
        store.setApiKey(key);
      };

      const sendMessage = async () => {
        if (
          isSending || // Prevent concurrent sends
          !userInput.value.trim() ||
          isLoading.value ||
          !chatSession.value ||
          !currentConversation.value
        ) {
          return; // Prevent sending if conditions are not met
        }

        isSending = true; // Acquire lock
        isLoading.value = true; // Prevent multiple triggers
        const messageText = userInput.value.trim();
        userInput.value = ''; // Clear input field immediately
        error.value = null;

        // Declare streamingMessageId and streamingMessage here for use in try/catch
        const streamingMessageId = `msg-streaming-${Date.now()}`;
        const streamingMessage = {
          id: streamingMessageId,
          role: 'model' as const,
          text: '',
          timestamp: Date.now(),
        };

        try {
          // Add user message to conversation
          store.addMessageToCurrentConversation(messageText, 'user');

          // Add a temporary streaming model message
          if (currentConversation.value) {
            currentConversation.value.history.push(streamingMessage);
          }

          // Use streaming API
          stopStreamController = new AbortController();
          const stream = await chatSession.value.sendMessageStream(messageText, { signal: stopStreamController.signal });
          let fullText = '';
          for await (const chunk of stream.stream) {
            fullText += chunk.text();
            // Update the streaming message text
            if (currentConversation.value) {
              const msg = currentConversation.value.history.find(m => m.id === streamingMessageId);
              if (msg) msg.text = fullText;
            }
          }
          stopStreamController = null;

          // Replace the streaming message with a finalized message
          if (currentConversation.value) {
            const idx = currentConversation.value.history.findIndex(m => m.id === streamingMessageId);
            if (idx !== -1) {
              currentConversation.value.history.splice(idx, 1);
              store.addMessageToCurrentConversation(fullText, 'model');
            }
          }

          // If this was the first model response in the conversation, generate a title
          if (currentConversation.value.history.filter(msg => msg.role === 'model').length === 1) {
            try {
              // Create a new chat session just for the title generation
              const genAI = new GoogleGenerativeAI(apiKey.value as string);
              const titleSession = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }).startChat({
                generationConfig: {
                  maxOutputTokens: 60,
                }
              });

              // Send context and request a structured title
              const titlePrompt = `Context - User: "${messageText}" Assistant: "${fullText}"
Based on this exchange, generate a very concise and relevant title (max 6 words). Respond with ONLY the title - no quotes, no explanation, no extra text.`;

              const titleResult = await titleSession.sendMessage(titlePrompt);
              const titleResponse = await titleResult.response;
              const title = titleResponse.text().trim();
              
              // Update the conversation name
              store.updateConversationName(currentConversation.value.id, title);
            } catch (e) {
              console.error('Error generating title:', e);
            }
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
          stopStreamController = null;
          console.error('Error sending message:', e);
          // Place error in the existing streaming message instead of adding a new one
          if (currentConversation.value) {
            const msg = currentConversation.value.history.find(m => m.id === streamingMessageId);
            if (msg) {
              msg.text = '[ERROR]' + (e?.message || 'Unknown error');
            }
          }
        } finally {
          isSending = false; // Release lock
          isLoading.value = false; // Reset loading state
        }
      };

      const stopStreaming = () => {
        if (stopStreamController) {
          stopStreamController.abort();
          stopStreamController = null;
        }
      };

      // Prevent Enter key from triggering sendMessage multiple times
      const handleKeyUp = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendMessage();
        }
      };

      // Add a wrapper function to prevent multiple triggers
      const handleSendMessage = () => {
        if (!isLoading.value) {
          sendMessage();
        }
      };

      const startNewConversation = () => {
        store.createNewConversation();
        // Chat will re-initialize via the watcher
      };

      const switchConversation = (id: string) => {
        store.switchConversation(id);
        // Chat will re-initialize via the watcher
      };

      const deleteConversation = (id: string) => {
        store.deleteConversation(id);
      };

      const updateSelectedModel = (modelName: string) => {
        store.setSelectedModel(modelName);
      };

      const isSidebarOpen = ref(false);
      const sidebarCollapsed = ref(false);
      const collapseSidebar = () => { sidebarCollapsed.value = true; };
      const expandSidebar = () => { sidebarCollapsed.value = false; };

      const toggleSidebar = () => {
        isSidebarOpen.value = !isSidebarOpen.value;
      };

      const hideSidebar = () => {
        isSidebarOpen.value = false;
      };

      const sidebarWidth = ref('320px');

      function updateSidebarWidth() {
        // Only run on desktop
        if (window.innerWidth > 1100) {
          nextTick(() => {
            const chatArea = document.querySelector('.chat-area') as HTMLElement;
            const sidebar = document.querySelector('.sidebar') as HTMLElement;
            if (chatArea && sidebar) {
              const chatRect = chatArea.getBoundingClientRect();
              // The left space is the distance from the left edge to the chat area minus margin
              const leftSpace = Math.max(chatRect.left - 40, 200); // 40px margin, min 200px
              sidebar.style.width = leftSpace + 'px';
            }
          });
        } else {
          // On mobile, use default width
          const sidebar = document.querySelector('.sidebar') as HTMLElement;
          if (sidebar) sidebar.style.width = '';
        }
      }

      onMounted(() => {
        window.addEventListener('resize', updateSidebarWidth);
        nextTick().then(updateSidebarWidth);
      });
      onUnmounted(() => {
        window.removeEventListener('resize', updateSidebarWidth);
      });
      // Also update after sidebar is shown/hidden
      watch(() => sidebarCollapsed.value, () => { nextTick().then(updateSidebarWidth); });
      watch(() => isSidebarOpen.value, () => { nextTick().then(updateSidebarWidth); });

      return {
        apiKey,
        conversations,
        currentConversationId,
        currentConversation,
        userInput,
        isLoading,
        error,
        updateApiKey,
        sendMessage,
        handleSendMessage,
        handleKeyUp,
        startNewConversation,
        switchConversation,
        deleteConversation,
        renderMarkdown, // Add the renderMarkdown method to the returned object
        isSidebarOpen,
        toggleSidebar,
        hideSidebar,
        spinnerChar,
        stopStreaming,
        sidebarCollapsed,
        collapseSidebar,
        expandSidebar,
        sidebarWidth,
        models,
        selectedModel,
        updateSelectedModel,
      };
    },
  });
</script>

<style scoped lang="scss">
.layout-root {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  box-sizing: border-box;
  background: none;
  position: relative;
}
.sidebar-container {
  width: 320px;
  min-width: 220px;
  max-width: 400px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  z-index: 2;
}
.sidebar-collapsed {
  width: 8px;
  min-width: 8px;
  max-width: 12px;
  height: 100vh;
  background: rgba(255,255,255,0.10);
  border-right: 1.5px solid rgba(255,255,255,0.18);
  box-shadow: 2px 0 12px 0 rgba(0,0,0,0.08);
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition: background 0.2s, width 0.2s;
  z-index: 3;
  position: relative;
  &:hover {
    background: rgba(255,255,255,0.18);
    width: 16px;
  }
}
.main-area {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  align-items: center;
  justify-content: center;
  position: relative;
}
.chat-area-outer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
}
.show-sidebar-btn {
  position: absolute;
  left: 0;
  top: 20px;
  z-index: 10;
  background: rgba(40, 167, 69, 0.7);
  color: #fff;
  border: none;
  border-radius: 0 8px 8px 0;
  font-size: 2rem;
  padding: 8px 16px;
  cursor: pointer;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  transition: background 0.2s;
  &:hover { background: rgba(33, 136, 56, 0.9); }
}
.api-key-missing {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  .alert {
    background-color: rgba(255, 193, 7, 0.2);
    border: 1px solid rgba(255, 193, 7, 0.5);
    border-radius: 8px;
    padding: 20px;
    max-width: 400px;
    h3 {
      color: #ffc107;
      margin-top: 0;
      margin-bottom: 10px;
    }
    p {
      margin: 0;
      line-height: 1.5;
    }
  }
}
@media (max-width: 900px) {
  .layout-root {
    flex-direction: column;
  }
  .sidebar-container {
    width: 100vw;
    max-width: 100vw;
    min-width: 0;
    height: auto;
    position: relative;
  }
  .main-area {
    width: 100vw;
    align-items: stretch;
  }
  .chat-area-outer {
    width: 100vw;
    height: auto;
  }
}
.home-view {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  box-sizing: border-box;
  position: relative;
  background: none;
  justify-content: center;
  align-items: center;
  padding: 0;
}
.burger-menu {
  display: none;
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  width: 40px;
  height: 40px;
  border-radius: 5px;
  background-color: rgba(40, 167, 69, 0.7);
  .burger-line {
    width: 25px;
    height: 2px;
    background-color: white;
    margin: 5px 0;
    transition: 0.3s;
  }
  &:hover {
    background-color: rgba(33, 136, 56, 0.9);
  }
}
.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
}
.show-sidebar-btn {
  position: absolute;
  left: 0;
  top: 20px;
  z-index: 10;
  background: rgba(40, 167, 69, 0.7);
  color: #fff;
  border: none;
  border-radius: 0 8px 8px 0;
  font-size: 2rem;
  padding: 8px 16px;
  cursor: pointer;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  transition: background 0.2s;
  &:hover { background: rgba(33, 136, 56, 0.9); }
}
.sidebar-slide-enter-active, .sidebar-slide-leave-active {
  transition: width 0.3s cubic-bezier(.4,2,.6,1), opacity 0.3s;
}
.sidebar-slide-enter-from, .sidebar-slide-leave-to {
  width: 0;
  opacity: 0;
}
/* Basic Scrollbar Styling (Optional) */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
@media (max-width: 768px) {
  .burger-menu {
    display: block;
  }
  .mobile-overlay {
    display: block;
  }
  /* Disable sidebar transition on mobile for instant open/close */
  .sidebar-slide-enter-active, .sidebar-slide-leave-active {
    transition: none !important;
  }
  .sidebar-slide-enter-from, .sidebar-slide-leave-to {
    width: 0;
    opacity: 0;
  }
}
</style>
