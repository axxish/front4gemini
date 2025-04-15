<template>
  <li :class="{ active }" @click="$emit('switch')">
    <span>{{ conversation.name }}</span>
    <button class="delete-button" @click.stop="$emit('delete')">X</button>
  </li>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'ConversationListItem',
  props: {
    conversation: Object,
    active: Boolean
  },
  emits: ['switch', 'delete']
});
</script>

<style scoped lang="scss">
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
</style>
