<template>
  <div class="home-view">
    <!-- Burger Menu Button (Mobile) -->
    <button class="burger-menu" @click="toggleSidebar">
      <div class="burger-line"></div>
      <div class="burger-line"></div>
      <div class="burger-line"></div>
    </button>

    <!-- Sidebar for Conversations (REQ-002) -->
    <div :class="['sidebar', 'glass-effect', { 'sidebar-open': isSidebarOpen }]">
      <h2>Conversations</h2>
      <button @click="startNewConversation">+ New Chat</button>
      <ul>
        <li
          v-for="conversation in conversations"
          :key="conversation.id"
          :class="{ active: conversation.id === currentConversationId }"
          @click="switchConversation(conversation.id)"
        >
          <span>{{ conversation.name }}</span>
          <button
            class="delete-button"
            @click.stop="deleteConversation(conversation.id)"
          >
            X
          </button>
        </li>
      </ul>

      <!-- API Key Input (REQ-005) -->
      <div class="api-key-section">
        <label for="apiKey">API Key:</label>
        <input
          id="apiKey"
          type="password"
          :value="apiKey"
          @input="updateApiKey(($event.target as HTMLInputElement).value)"
          placeholder="Enter Google API Key"
        />
      </div>
    </div>

    <!-- Overlay for mobile -->
    <div 
      v-if="isSidebarOpen" 
      class="mobile-overlay"
      @click="toggleSidebar"
    ></div>

    <!-- Main Chat Area -->
    <div class="chat-area glass-effect">
      <div v-if="!apiKey" class="api-key-missing">
        <div class="alert">
          <h3>⚠️ API Key Required</h3>
          <p>Please enter your Google AI API key in the sidebar to start chatting.</p>
        </div>
      </div>
      <div v-else-if="currentConversation" class="chat-content">
        <h3>{{ currentConversation.name }}</h3>
        <!-- Chat History (REQ-001, REQ-008) -->
        <div class="message-history">
          <div
            v-for="(message, index) in currentConversation.history"
            :key="index"
            :class="['message', message.role]"
          >
            <strong>{{ message.role === 'user' ? 'You' : 'Gemini' }}:</strong>
            <div
              class="markdown-content"
              v-html="renderMarkdown(message.text)"
            ></div>
          </div>
        </div>

        <!-- User Input -->
        <div class="user-input">
          <textarea
            v-model="userInput"
            placeholder="Type your message..."
            @keydown.enter.prevent="sendMessage"
          ></textarea>
          <button
            @click="sendMessage"
            :disabled="!userInput.trim() || isLoading"
          >
            Send
          </button>
        </div>
        <p v-if="isLoading">Loading...</p>
        <p v-if="error">{{ error }}</p>
      </div>
      <div v-else>
        <p>Select or start a conversation.</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, watch } from 'vue';
  import { useAppStore } from '@/store'; // Corrected path
  import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
    ChatSession,
  } from '@google/generative-ai';
  import MarkdownIt from 'markdown-it';

  export default defineComponent({
    name: 'HomeView',
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

      const apiKey = computed(() => store.getApiKey);
      const conversations = computed(() => store.conversations);
      const currentConversationId = computed(() => store.currentConversationId);
      const currentConversation = computed(() => store.currentConversation);

      // Function to initialize or update the chat session when API key or conversation changes
      const initializeChat = () => {
        error.value = null; // Clear previous errors
        if (apiKey.value && currentConversation.value) {
          try {
            const genAI = new GoogleGenerativeAI(apiKey.value);
            chatSession.value = genAI
              .getGenerativeModel({ model: 'gemini-2.0-flash' }) // Changed model to gemini-2.0-flash
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

        try {
          // Add user message to conversation
          store.addMessageToCurrentConversation(messageText, 'user');

          // Add a temporary streaming model message
          const streamingMessageId = `msg-streaming-${Date.now()}`;
          const streamingMessage = {
            id: streamingMessageId,
            role: 'model' as const, // Fix: ensure literal type
            text: '',
            timestamp: Date.now(),
          };
          if (currentConversation.value) {
            currentConversation.value.history.push(streamingMessage);
          }

          // Use streaming API
          const stream = await chatSession.value.sendMessageStream(messageText);
          let fullText = '';
          for await (const chunk of stream.stream) {
            fullText += chunk.text();
            // Update the streaming message text
            if (currentConversation.value) {
              const msg = currentConversation.value.history.find(m => m.id === streamingMessageId);
              if (msg) msg.text = fullText;
            }
          }

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
          console.error('Error sending message:', e);
          error.value = `Error communicating with Gemini: ${e.message}`;
        } finally {
          isSending = false; // Release lock
          isLoading.value = false; // Reset loading state
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

      const isSidebarOpen = ref(false);

      const toggleSidebar = () => {
        isSidebarOpen.value = !isSidebarOpen.value;
        // Prevent body scroll when sidebar is open on mobile
        document.body.style.overflow = isSidebarOpen.value ? 'hidden' : '';
      };

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
      };
    },
  });
</script>

<style scoped lang="scss">
  .home-view {
    display: flex;
    height: 100vh; // Use full viewport height
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
  }

  .glass-effect {
    background: rgba(255, 255, 255, 0.1); // Semi-transparent white (REQ-003)
    backdrop-filter: blur(10px); // Blur effect (REQ-003)
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 20px;
    box-sizing: border-box;
    color: #fff;
  }

  .sidebar {
    width: 250px;
    margin-right: 20px;
    display: flex;
    flex-direction: column;
    overflow-y: auto; // Allow scrolling if content overflows

    h2 {
      margin-top: 0;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      padding-bottom: 10px;
    }

    button {
      background-color: rgba(255, 255, 255, 0.3);
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 8px;
      cursor: pointer;
      margin-bottom: 15px;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.5);
      }
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      flex-grow: 1; // Take remaining space

      li {
        padding: 10px;
        margin-bottom: 5px;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;

        &:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        &.active {
          background-color: rgba(255, 255, 255, 0.4);
          font-weight: bold;
        }
      }
    }

    .api-key-section {
      margin-top: auto; // Push to the bottom
      padding-top: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.3);

      label {
        display: block;
        margin-bottom: 5px;
      }

      input {
        width: 100%;
        padding: 8px;
        border-radius: 5px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background-color: rgba(0, 0, 0, 0.2);
        color: white;
        box-sizing: border-box;
      }
    }
  }

  input {
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 5px;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.2);
    color: white;
    box-sizing: border-box;
    outline: none;
    transition: box-shadow 0.3s ease, border-color 0.3s ease; // Smooth tween for glow effect
  }

  input:focus {
    border-color: rgba(40, 167, 69, 0.7); // Green border on focus
    box-shadow: 0 0 10px rgba(40, 167, 69, 0.7); // Green glow effect
  }

  .chat-area {
    flex-grow: 1; // Take remaining horizontal space
    display: flex;
    flex-direction: column;
    height: calc(100vh - 40px); // Adjust height considering padding
    max-width: 1200px; // Limit maximum width
    margin: 0 auto; // Center the chat area when it hits max width

    .chat-content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      overflow-y: hidden; // Hide scrollbar for the container

      h3 {
        margin-top: 0;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      }

      .message-history {
        flex-grow: 1;
        overflow-y: auto; // Enable scrolling for messages
        margin-bottom: 15px;
        padding-right: 10px; // Space for scrollbar

        .message {
          margin-bottom: 15px;
          padding: 10px;
          border-radius: 8px;
          max-width: 80%;

          strong {
            display: block;
            margin-bottom: 4px;
          }

          .markdown-content {
            word-wrap: break-word;
            white-space: normal;
            line-height: 1.4;

            :deep(ul),
            :deep(ol) {
              margin: 0 0 10px 0; // Add spacing between lists
              padding-left: 1.5em;
              padding-top: 10px; // Add top padding to lists
            }

            :deep(li) {
              list-style-position: outside;
              margin: 0 0 5px 0; // Add spacing between list items
              padding: 0;
            }

            :deep(ul) {
              list-style-type: disc;
            }

            :deep(p) {
              display: inline;
              margin: 0;
            }

            :deep(p) {
              margin: 0 0 10px 0; // Add spacing between paragraphs
            }
          }

          &.user {
            background-color: rgba(0, 123, 255, 0.3);
            margin-left: auto;
            text-align: right;
            padding-right: 15px; // Add right padding for user messages
          }

          &.model {
            background-color: rgba(40, 167, 69, 0.4);
            margin-right: auto;
            text-align: left;
            padding-left: 15px; // Add left padding for model messages
          }
        }
      }

      .user-input {
        display: flex;
        margin-top: auto; // Push input to the bottom
        padding-top: 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.3);

        textarea {
          flex-grow: 1;
          margin-right: 10px;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background-color: rgba(0, 0, 0, 0.2);
          color: white;
          resize: none; // Prevent manual resizing
          min-height: 40px; // Minimum height for one line
          max-height: 150px; // Maximum height before scrolling
          overflow-y: auto;
          transition: box-shadow 0.3s ease, border-color 0.3s ease; // Smooth tween for glow effect
          -webkit-appearance: none; // Remove OS-specific styles
          -moz-appearance: none;
          appearance: none;
        }

        textarea:focus {
          border-color: rgba(40, 167, 69, 0.7); // Green border on focus
          box-shadow: 0 0 10px rgba(40, 167, 69, 0.7); // Green glow effect
          outline: none; // Remove OS-specific focus outline
        }

        button {
          background-color: rgba(40, 167, 69, 0.7);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.3s ease;

          &:hover:not(:disabled) {
            background-color: rgba(33, 136, 56, 0.9);
          }

          &:disabled {
            background-color: rgba(108, 117, 125, 0.5);
            cursor: not-allowed;
          }
        }
      }
      p {
        margin-top: 5px;
        &.error {
          color: #ffc107; // Warning color for errors
        }
      }
    }
  }

  .delete-button {
    background: none;
    border: none;
    color: red;
    font-size: 16px;
    cursor: pointer;
    margin-left: auto;
    padding: 0;
    transition: color 0.3s ease;
  }

  .delete-button:hover {
    color: darkred;
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

  .burger-menu {
    display: none; // Hidden by default on desktop
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

  .sidebar {
    transition: transform 0.3s ease;
    z-index: 1000;
  }

  @media (max-width: 768px) {
    .burger-menu {
      display: block;
    }

    .mobile-overlay {
      display: block;
    }

    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: 80%;
      max-width: 300px;
      margin: 0;
      transform: translateX(-100%);

      &.sidebar-open {
        transform: translateX(0);
      }
    }

    .chat-area {
      width: 100%;
      margin-left: 0;
      padding-top: 60px; // Space for burger menu
    }
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
</style>
