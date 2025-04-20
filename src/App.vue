<template>
  <router-view />
</template>

<style lang="scss">
@import "@/styles/global.scss";

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #ffffff;
  background: linear-gradient(135deg, #004d00, #003300, #001a00);
  min-height: 100vh;
  display: flex;
  width: 100%;
  backdrop-filter: blur(15px);
  box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.5);
}

/* Remove default nav styles */
/*
nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
*/
</style>
