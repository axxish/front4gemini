<template>
  <div class="chat-area glass-effect">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'ChatArea'
});
</script>

<style scoped lang="scss">
  .chat-area {
    position: relative;
    z-index: 1;
    width: 700px;
    max-width: 700px;
    min-width: 350px;
    margin: auto;
    align-self: center;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
    padding-top: 32px;
    padding-bottom: 32px;
    .chat-content {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      h3 {
        margin-top: 0;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      }
      .message-history {
        flex-grow: 1;
        overflow-y: auto;
        min-height: 0;
        max-height: 100%;
      }
    }
  }
</style>
