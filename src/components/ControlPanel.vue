<script setup>
import { ref } from 'vue';
import { totalConvenience } from '../utils/Home.js'; // 引入 totalConvenience

const isOpen = ref(false); // 控制面板显示/隐藏

// 导出的变量和方法可以直接在模板中使用
defineExpose({
  isOpen,
  totalConvenience, // 不需要重新定义 totalConvenience
});
</script>

<template>
  <!-- 可显示/隐藏的侧边面板 -->
  <div :class="['side-panel', { open: isOpen }]" :style="panelStyle">
    <div class="side-panel-body">
      <p>生活便利度: {{ totalConvenience }}</p> <!-- 显示生活便利度 -->
    </div>
  </div>
</template>

<style scoped>
/* 样式部分 */
</style>
