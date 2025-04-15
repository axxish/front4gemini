# Refactoring & Restructuring Plan for LLM Frontend Vue Project

## Overview
This project is a Vue 3 + TypeScript single-page application (SPA) that serves as a frontend for interacting with Google Gemini (LLM) via the official SDK. The current codebase has all logic and UI in a single large view (`HomeView.vue`), with CSS embedded in the same file. There is little to no componentization, and the code is not modular, making it hard to maintain, extend, or test.

## Goals
- **Improve maintainability, readability, and scalability**
- **Enable code reuse and separation of concerns**
- **Follow Vue 3 and modern frontend best practices**
- **Prepare for future features and UI/UX improvements**

---

## 1. Project Structure

**Recommended folder structure:**

```
src/
  assets/
  components/
    Chat/
      ChatArea.vue
      MessageList.vue
      MessageItem.vue
      UserInput.vue
    Sidebar/
      Sidebar.vue
      ConversationList.vue
      ConversationListItem.vue
      ApiKeyInput.vue
    Common/
      Spinner.vue
      Modal.vue
      ...
  views/
    HomeView.vue
  store/
    index.ts
  router/
    index.ts
  styles/
    _variables.scss
    _mixins.scss
    main.scss
  App.vue
  main.ts
```

- **components/**: All reusable UI components, grouped by domain (Chat, Sidebar, Common, etc.)
- **views/**: Page-level components (e.g., HomeView)
- **styles/**: Global SCSS variables, mixins, and main stylesheet

---

## 2. Componentization Plan

### Sidebar
- **Sidebar.vue**: Container for sidebar, handles open/collapse logic
- **ConversationList.vue**: List of conversations
- **ConversationListItem.vue**: Single conversation row (with delete, select, etc.)
- **ApiKeyInput.vue**: API key input field (with show/hide toggle, validation, etc.)

### Chat Area
- **ChatArea.vue**: Main chat container, holds message list and user input
- **MessageList.vue**: Renders all messages in a conversation
- **MessageItem.vue**: Renders a single message (user/model, markdown, error, etc.)
- **UserInput.vue**: Textarea and send/stop button, handles input and key events

### Common/Utility
- **Spinner.vue**: Animated spinner for loading states
- **Modal.vue**: (Optional) For confirmations, alerts, etc.

---

## 3. CSS & Styling
- Move all global styles, variables, and mixins to `src/styles/`
- Use `scoped` styles for components, but keep shared variables in SCSS partials
- Use BEM or another naming convention for class names
- Remove duplicate or redundant CSS
- Consider using a UI library (Vuetify, Quasar, PrimeVue) for base components if desired

---

## 4. State Management
- Keep Pinia store in `src/store/`
- Move conversation/message logic out of components into store actions/getters
- Use composables (`src/composables/`) for logic that is reused across components (e.g., markdown rendering, API key management)

---

## 5. Other Best Practices
- Use TypeScript interfaces/types for all data structures
- Use `defineProps`/`defineEmits` in components for clear API
- Use `emit` for parent-child communication
- Use `v-model` for two-way binding where appropriate
- Add error boundaries and fallback UI for API errors
- Add unit tests for store and key components (optional)

---

## 6. Example Componentization Mapping
| UI Element                | New Component(s)                |
|-------------------------- |---------------------------------|
| Sidebar                   | Sidebar.vue                     |
| Conversation List         | ConversationList.vue, ConversationListItem.vue |
| API Key Input             | ApiKeyInput.vue                 |
| Chat Area                 | ChatArea.vue                    |
| Message History           | MessageList.vue, MessageItem.vue|
| User Input                | UserInput.vue                   |
| Loading Spinner           | Spinner.vue                     |

---

## 7. Migration Steps
1. **Create new folders and move global styles out of HomeView.vue**
2. **Extract Sidebar and ChatArea into their own components**
3. **Extract subcomponents (lists, items, input, spinner, etc.)**
4. **Move logic from HomeView.vue into store/composables as needed**
5. **Refactor HomeView.vue to use new components**
6. **Test and adjust for feature parity**
7. **Polish styles and add documentation**

---

## 8. Future Enhancements
- Add settings modal for API key and preferences
- Add conversation search/filter
- Add markdown preview and formatting tools
- Add support for attachments/images (if supported by backend)
- Add tests and CI/CD

---

## References
- [Vue 3 Style Guide](https://vuejs.org/style-guide/)
- [Pinia Best Practices](https://pinia.vuejs.org/cookbook/)
- [Vue Component Design Patterns](https://vuejs.org/guide/components/)

---

**This plan will make the codebase modular, maintainable, and ready for future growth.**
