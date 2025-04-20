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
      class="radial-send-btn"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="13" stroke="#fff" stroke-width="2" fill="rgba(255,255,255,0.15)"/>
        <polygon points="11,8 21,14 11,20 11,8" fill="#fff"/>
      </svg>
    </button>
    <button
      v-else
      @click="$emit('stop-streaming')"
      title="Stop streaming"
      class="radial-send-btn"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="13" stroke="#fff" stroke-width="2" fill="rgba(255,255,255,0.15)"/>
        <rect x="10" y="10" width="8" height="8" rx="2" fill="#fff"/>
      </svg>
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
    .radial-send-btn {
      background: none;
      padding: 0;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      outline: none;
      transition: filter 0.2s, opacity 0.2s;
      opacity: 1;
      filter: none;
      &:hover:not(:disabled) svg {
        filter: drop-shadow(0 0 8px #fff) brightness(1.5);
        opacity: 1;
      }
      &:disabled,
      &[disabled] {
        opacity: 0.5;
        filter: grayscale(1) brightness(0.7);
        cursor: not-allowed;
      }
      svg {
        display: block;
        transition: filter 0.2s, opacity 0.2s;
      }
    }
  }
  .user-input button,
  .user-input .radial-send-btn {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
  }
</style>
