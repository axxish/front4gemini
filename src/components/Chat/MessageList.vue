<template>
  <div class="message-history-scrollable">
    <div class="message-history">
      <MessageItem
        v-for="(message, index) in messages"
        :key="index"
        :message="message"
        :is-last="index === messages.length - 1"
        :is-loading="isLoading"
        :error="error"
        :spinner-char="spinnerChar"
        :render-markdown="renderMarkdown"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MessageItem from './MessageItem.vue';

// Define a Message interface for type safety
export interface Message {
  id: string;
  role: string;
  text: string;
  timestamp: number;
}

export default defineComponent({
  name: 'MessageList',
  components: { MessageItem },
  props: {
    messages: {
      type: Array as () => Array<Message>,
      required: true
    },
    isLoading: Boolean,
    error: String,
    spinnerChar: String,
    renderMarkdown: Function
  }
});
</script>

<style scoped lang="scss">
.message-history-scrollable {
  flex-grow: 1;
  min-height: 0;
  max-height: calc(100vh - 180px); // Adjust 180px as needed for header, input, and padding
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.message-history {
  display: flex;
  flex-direction: column;
  gap: 0;
}
</style>
