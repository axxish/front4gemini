<template>
  <div class="user-input">
    <textarea
      v-model="inputValue"
      placeholder="Type your message..."
      @keydown.enter.prevent="onSend"
    ></textarea>
    <button
      v-if="!isLoading"
      @click="onSend"
      :disabled="!inputValue.trim()"
      title="Send"
    >
      Start
    </button>
    <button
      v-else
      @click="$emit('stop-streaming')"
      title="Stop streaming"
    >
      Stop
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
export default defineComponent({
  name: 'UserInput',
  props: {
    modelValue: String,
    isLoading: Boolean
  },
  emits: ['update:modelValue', 'send', 'stop-streaming'],
  setup(props, { emit }) {
    const inputValue = ref(props.modelValue || '');
    watch(() => props.modelValue, val => { inputValue.value = val ?? ''; });
    const onSend = () => {
      if (!props.isLoading && inputValue.value.trim()) {
        emit('send');
      }
    };
    watch(inputValue, val => emit('update:modelValue', val));
    return { inputValue, onSend };
  }
});
</script>

<style scoped lang="scss">
  .user-input {
    display: flex;
    margin-top: auto;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
    textarea {
      flex-grow: 1;
      margin-right: 10px;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background-color: rgba(0, 0, 0, 0.2);
      color: white;
      resize: none;
      min-height: 40px;
      max-height: 150px;
      overflow-y: auto;
      transition: box-shadow 0.3s ease, border-color 0.3s ease;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }
    textarea:focus {
      border-color: rgba(40, 167, 69, 0.7);
      box-shadow: 0 0 10px rgba(40, 167, 69, 0.7);
      outline: none;
    }
    button {
      background-color: rgba(40, 167, 69, 0.7);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.3s ease;
      font-size: 2rem;
      font-family: 'Fira Mono', 'Consolas', 'Menlo', 'Monaco', 'Liberation Mono', 'Courier New', monospace;
      min-width: 100px;
      text-align: center;
      &:hover:not(:disabled) {
        background-color: rgba(33, 136, 56, 0.9);
      }
      &:disabled {
        background-color: rgba(108, 117, 125, 0.5);
        cursor: not-allowed;
      }
    }
  }
</style>
