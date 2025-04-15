<template>
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
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MessageItem from './MessageItem.vue';
export default defineComponent({
  name: 'MessageList',
  components: { MessageItem },
  props: {
    messages: Array,
    isLoading: Boolean,
    error: String,
    spinnerChar: String,
    renderMarkdown: Function
  }
});
</script>

<style scoped lang="scss">
  .message-history {
    flex-grow: 1;
    overflow-y: auto;
    margin-bottom: 15px;
    padding-right: 10px;
  }
</style>
