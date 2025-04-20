<template>
  <ul>
    <ConversationListItem
      v-for="conversation in conversations"
      :key="conversation.id"
      :conversation="conversation"
      :active="conversation.id === currentConversationId"
      @switch="$emit('switch', conversation.id)"
      @delete="$emit('delete', conversation.id)"
    />
  </ul>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ConversationListItem from './ConversationListItem.vue';

export default defineComponent({
  name: 'ConversationList',
  components: { ConversationListItem },
  props: {
    conversations: {
      type: Array as () => { id: string }[],
      required: true
    },
    currentConversationId: {
      type: String,
      required: true
    }
  },
  emits: ['switch', 'delete']
});
</script>

<style scoped lang="scss">
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    flex-grow: 1;
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
</style>
