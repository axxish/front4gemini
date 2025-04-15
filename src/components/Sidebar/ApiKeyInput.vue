<template>
  <div class="api-key-section">
    <label for="apiKey">API Key:</label>
    <input
      id="apiKey"
      type="password"
      :value="apiKey"
      @input="$emit('update-api-key', ($event.target as HTMLInputElement).value)"
      placeholder="Enter Google API Key"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'ApiKeyInput',
  props: {
    apiKey: String
  },
  emits: ['update-api-key']
});
</script>

<style scoped lang="scss">
  input {
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 5px;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.2);
    color: white;
    box-sizing: border-box;
    outline: none;
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
  }
  input:focus {
    border-color: rgba(40, 167, 69, 0.7);
    box-shadow: 0 0 10px rgba(40, 167, 69, 0.7);
  }
</style>
