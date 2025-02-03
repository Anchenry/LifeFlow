<script setup>
  import Home from './views/Home.vue'
  import Menu from './components/Menu.vue'
  import SidePanel from '../src/components/SidePanel.vue'
  import { ref } from 'vue';

  const currentMap = ref(null);
</script>

<template>
  <main style="height: 100%">
    <Home />  <!-- 使用Home组件 -->
    <Menu /> <!-- 使用Menu菜单栏 -->
<!--    <SidePanel />-->
  </main>
</template>

<style scoped>
</style>
