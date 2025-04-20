<template>
  <div v-if="message" :class="['message', message.role, { error: message.role === 'model' && message.text?.startsWith('[ERROR]') }]">
    <!-- Removed model/user name label -->
    <div class="markdown-content">
      <span v-if="isLoading && !error && isLast && message.role === 'model' && !message.text">{{ spinnerChar }}</span>
      <span v-else v-html="renderMarkdown ? renderMarkdown(message.text?.startsWith('[ERROR]') ? message.text?.slice(7) : message.text ?? '') : ''"></span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'MessageItem',
  props: {
    message: {
      type: Object,
      required: true,
      default: () => ({ role: 'user', text: '', id: '', timestamp: Date.now() })
    },
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
      overflow-x: auto;
      :deep(pre) {
        overflow-x: auto;
        max-width: 100%;
        background: rgba(255,255,255,0.08);
        border-radius: 12px;
        padding: 12px;
        margin: 10px 0;
        font-size: 0.97em;
        backdrop-filter: blur(6px);
        box-shadow: 0 2px 12px 0 rgba(0,0,0,0.08);
        border: 1px solid rgba(255,255,255,0.18);
      }
      :deep(code) {
        word-break: break-word;
        font-family: var(--font-family-mono, 'Fira Mono', 'Consolas', 'Menlo', 'Monaco', 'Liberation Mono', 'Courier New', monospace);
        font-size: 0.97em;
      }
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
