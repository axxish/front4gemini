<template>
  <div
    :class="['message', message.role, { error: message.role === 'model' && message.text.startsWith('[ERROR]') }]"
  >
    <strong>{{ message.role === 'user' ? 'You' : 'Gemini' }}:</strong>
    <div class="markdown-content">
      <span v-if="isLoading && !error && isLast && message.role === 'model' && !message.text">{{ spinnerChar }}</span>
      <span v-else v-html="renderMarkdown(message.text.startsWith('[ERROR]') ? message.text.slice(7) : message.text)"></span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'MessageItem',
  props: {
    message: Object,
    isLast: Boolean,
    isLoading: Boolean,
    error: String,
    spinnerChar: String,
    renderMarkdown: Function
  }
});
</script>

<style scoped lang="scss">
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
      :deep(ul), :deep(ol) {
        margin: 0 0 10px 0;
        padding-left: 1.5em;
        padding-top: 10px;
      }
      :deep(li) {
        list-style-position: outside;
        margin: 0 0 5px 0;
        padding: 0;
      }
      :deep(ul) {
        list-style-type: disc;
      }
      :deep(p) {
        display: inline;
        margin: 0 0 10px 0;
      }
    }
    &.user {
      background-color: rgba(0, 123, 255, 0.3);
      margin-left: auto;
      text-align: right;
      padding-right: 15px;
    }
    &.model {
      background-color: rgba(40, 167, 69, 0.4);
      margin-right: auto;
      text-align: left;
      padding-left: 15px;
    }
  }
</style>
