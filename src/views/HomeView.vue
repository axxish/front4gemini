<template>
  <div class="home-view">
    <!-- Sidebar for Conversations (REQ-002) -->
    <div class="sidebar glass-effect">
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

    <!-- Main Chat Area -->
    <div class="chat-area glass-effect">
      <div v-if="currentConversation" class="chat-content">
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
          } catch (e: any) {
            console.error('Failed to initialize GoogleGenerativeAI:', e);
            error.value = `Failed to initialize AI. Check API Key and configuration. Error: ${e.message}`;
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
          // Ensure all messages have a `parts` property when adding to the conversation
          const userMessage = {
            role: 'user' as const,
            parts: [{ text: messageText }],
          };
          if (
            !currentConversation.value.history.some((msg) => {
              return JSON.stringify(msg) === JSON.stringify(userMessage);
            })
          ) {
            store.addMessageToCurrentConversation(
              userMessage.parts[0].text,
              'user'
            );
          }

          // Send the message to the API
          const result = await chatSession.value.sendMessage(messageText);
          const response = await result.response;
          const responseText = response.text();

          // Add the model's response to the conversation history only if not already added
          const modelMessage = {
            role: 'model' as const,
            parts: [{ text: responseText }],
          };
          if (
            !currentConversation.value.history.some((msg) => {
              return JSON.stringify(msg) === JSON.stringify(modelMessage);
            })
          ) {
            store.addMessageToCurrentConversation(responseText, 'model');
          }
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
</style>
