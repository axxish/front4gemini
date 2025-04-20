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
    <div class="custom-select-wrapper">
      <label for="modelSelect">Model:</label>
      <div class="custom-select" tabindex="0">
        <div class="custom-select__selected" @click="showDropdown = !showDropdown">
          {{ models.find(m => m.name === selectedModel)?.displayName || 'Select model' }}
          <span class="custom-select__arrow">▼</span>
        </div>
        <ul v-if="showDropdown" class="custom-select__dropdown">
          <li v-for="model in models" :key="model.name" @click="$emit('update-selected-model', model.name); showDropdown = false">
            {{ model.displayName }}
          </li>
        </ul>
      </div>
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
    conversations: {
      type: Array as () => { id: string }[],
      required: true
    },
    currentConversationId: {
      type: String,
      default: ''
    },
    apiKey: String,
    isSidebarOpen: Boolean,
    selectedModel: String,
    models: {
      type: Array as () => Array<{ name: string; displayName: string }>,
      required: true
    }
  },
  emits: ['collapse', 'new-conversation', 'switch-conversation', 'delete-conversation', 'update-api-key', 'update-selected-model'],
  data() {
    return {
      showDropdown: false
    };
  }
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
  font-size: 1.1em;
  cursor: pointer;
  margin-left: 10px;
  padding: 2px 8px;
  line-height: 1;
  border-radius: 4px;
  transition: color 0.2s, background 0.2s;
  font-family: inherit;
  font-weight: 400;
  &:hover {
    color: #fff;
    background: rgba(255,255,255,0.08);
  }
}

.delete-button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.1em;
  cursor: pointer;
  margin-left: 8px;
  padding: 2px 6px;
  line-height: 1;
  border-radius: 4px;
  transition: color 0.2s, background 0.2s;
  font-family: inherit;
  font-weight: 400;
  &:hover {
    color: #fff;
    background: rgba(255,0,0,0.08);
  }
}

.delete-button:hover {
  color: darkred;
}

.model-select-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);

  label {
    display: block;
    margin-bottom: 5px;
  }

  select {
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 5px;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.2);
    color: white;
    box-sizing: border-box;
    outline: none;
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
    appearance: none;
    cursor: pointer;

    &:focus {
      border-color: rgba(40, 167, 69, 0.7);
      box-shadow: 0 0 10px rgba(40, 167, 69, 0.7);
    }

    option {
      background-color: #1a1a1a;
      color: white;
    }
  }
}

.custom-select-wrapper {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);

  label {
    display: block;
    margin-bottom: 5px;
  }

  .custom-select {
    position: relative;
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 5px;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.2);
    color: white;
    box-sizing: border-box;
    outline: none;
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
    cursor: pointer;
    min-height: 40px;
    height: 40px;
    max-height: 40px;
    display: flex;
    align-items: center;

    &__selected {
      display: flex;
      align-items: center;
      min-height: 40px;
      height: 40px;
      max-height: 40px;
      width: 100%;
      padding-right: 12px;
      position: relative;
      justify-content: space-between;
      // Ensure text stays left, arrow right
      .custom-select__arrow {
        margin-left: auto;
        margin-right: 0;
        align-self: center;
      }
    }

    &__arrow {
      margin-left: 10px;
      margin-right: 0;
      align-self: center;
    }

    &__dropdown {
      position: absolute;
      left: 0;
      bottom: 100%;
      width: 100%;
      background-color: rgba(30, 30, 30, 0.65);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 5px;
      margin-bottom: 5px;
      z-index: 1;
      list-style: none;
      padding: 0;
      margin: 0;
      max-height: 220px;
      overflow-y: auto;
      /* Custom scrollbar for dropdown */
      &::-webkit-scrollbar {
        width: 6px;
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.18);
        border-radius: 6px;
      }
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.18) transparent;

      li {
        padding: 8px;
        cursor: pointer;
        transition: background-color 0.3s ease;

        &:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
      }
    }
  }
}
</style>
