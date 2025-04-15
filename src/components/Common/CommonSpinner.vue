<template>
  <span>{{ spinnerChar }}</span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'CommonSpinner',
  props: {
    spinnerChar: String
  }
});
</script>
