<template>
  <li :class="{ active }" @click="$emit('switch')">
    <span>{{ conversation.name }}</span>
    <span class="delete-x" @click.stop="$emit('delete')" aria-label="Delete conversation" title="Delete conversation">&times;</span>
  </li>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'ConversationListItem',
  props: {
    conversation: {
      type: Object,
      required: true
    },
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
  .delete-x {
    color: #fff;
    font-size: 1.5em;
    cursor: pointer;
    margin-left: 12px;
    line-height: 1;
    font-family: inherit;
    font-weight: 700;
    transition: color 0.2s, text-shadow 0.2s;
    user-select: none;
    text-shadow: 0 1px 4px rgba(0,0,0,0.15);
    &:hover {
      color: #fff;
      text-shadow: 0 2px 8px #fff;
    }
  }
</style>
