import { createApp } from 'vue';
import { createPinia } from 'pinia'; // Import Pinia
import App from './App.vue';
import router from './router';

const pinia = createPinia(); // Create Pinia instance

createApp(App)
  .use(pinia) // Use Pinia
  .use(router)
  .mount('#app');
