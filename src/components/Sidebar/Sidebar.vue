<template>
  <div class="sidebar glass-effect" :class="{ 'sidebar-open': isSidebarOpen }">
    <div class="sidebar-header">
      <h2>Conversations</h2>
      <button class="hide-sidebar-btn" @click="$emit('collapse')" title="Hide menu">✖</button>
    </div>
    <button @click="$emit('new-conversation')">+ New Chat</button>
    <div class="conversations-scroll">
      <ConversationList :conversations="conversations" :currentConversationId="currentConversationId"
        @switch="id => $emit('switch-conversation', id)" @delete="id => $emit('delete-conversation', id)" />
    </div>
    <ApiKeyInput :apiKey="apiKey" @update-api-key="$emit('update-api-key', $event)" />
    <div class="model-select-section">
      <label for="modelSelect">Model:</label>
      <select id="modelSelect" :value="selectedModel"
        @change="$emit('update-selected-model', ($event.target as HTMLSelectElement).value)">
        <option v-for="model in models" :key="model.name" :value="model.name">
          {{ model.displayName }}
        </option>
      </select>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ConversationList from './ConversationList.vue';
import ApiKeyInput from './ApiKeyInput.vue';

export default defineComponent({
  name: 'SidebarMenu',
  components: { ConversationList, ApiKeyInput },
  props: {
    conversations: Array,
    currentConversationId: String,
    apiKey: String,
    isSidebarOpen: Boolean,
    selectedModel: String,
    models: {
      type: Array as () => Array<{ name: string; displayName: string }>,
      required: true
    }
  },
  emits: ['collapse', 'new-conversation', 'switch-conversation', 'delete-conversation', 'update-api-key', 'update-selected-model']
});
</script>

<style scoped lang="scss">
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
  box-sizing: border-box;
  color: #fff;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  min-height: 100vh;
  max-height: 100vh;
  width: 320px;
  min-width: 220px;
  max-width: 400px;
  margin: 0;
  border-radius: 0;
  border-top: none;
  border-bottom: none;
  border-left: none;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  z-index: 2;
  transition: width 0.3s cubic-bezier(.4, 2, .6, 1), opacity 0.3s;
  overflow: hidden;
  box-sizing: border-box;

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

  .conversations-scroll {
    flex: 1 1 auto;
    overflow-y: auto;
    min-height: 0;
    max-height: 100%;
  }

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

  .api-key-section {
    margin-top: auto;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
    padding-bottom: env(safe-area-inset-bottom, 24px);

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

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  h2 {
    margin: 0;
    flex: 1;
    text-align: left;
    font-size: 1.2em;
  }
}

.hide-sidebar-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5em;
  cursor: pointer;
  margin-left: 10px;
  padding: 0 8px;
  transition: color 0.2s;

  &:hover {
    color: #ffc107;
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
</style>
