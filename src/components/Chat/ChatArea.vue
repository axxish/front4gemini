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
    height: auto;
    max-height: 96vh;
    .chat-content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      overflow-y: hidden;
      h3 {
        margin-top: 0;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      }
    }
  }
</style>
