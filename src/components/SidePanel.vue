<template>
  <div>
    <!-- 控制面板按钮 -->
    <div ref="toggleButton" class="toggle-button" @click="togglePanel">控制面板</div>

    <!-- 可显示/隐藏的侧边面板 -->
    <div :class="['side-panel', { open: isOpen }]" :style="panelStyle">
      <div class="side-panel-body">
        <p>生活便利度: {{ totalConvenience }}</p> <!-- 显示生活便利度 -->
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, nextTick } from 'vue';
import { totalConvenience as totalConvenienceValue } from '../utils/Home.js'; // 引入 totalConvenience

export default defineComponent({
  setup() {
    const isOpen = ref(false); // 控制面板显示/隐藏
    const panelX = ref(0); // 面板的初始水平位置
    const panelY = ref(0); // 面板的初始垂直位置

    // 面板样式
    const panelStyle = computed(() => ({
      left: `${panelX.value}px`,
      top: `${panelY.value}px`,
    }));

    // 切换面板的显示和隐藏
    const togglePanel = () => {
      isOpen.value = !isOpen.value;
      if (isOpen.value) {
        nextTick(() => {
          calculatePanelPosition(); // 确保 DOM 更新后计算面板位置
        });
      }
    };

    // 计算面板的位置
    const calculatePanelPosition = () => {
      const button = document.querySelector('.toggle-button');
      if (button) {
        const buttonRect = button.getBoundingClientRect();
        panelX.value = buttonRect.left; // 水平位置
        panelY.value = buttonRect.top - 420; // 垂直位置，固定面板在按钮上方
      }
    };

    return {
      isOpen,
      panelStyle,
      togglePanel,
      totalConvenience: totalConvenienceValue, // 使用导入的 `totalConvenience`
    };
  },
});
</script>

<style scoped>
.toggle-button {
  position: fixed;
  left: 20px;
  bottom: 20px;
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  z-index: 1000;
}

/* 面板样式 */
.side-panel {
  position: fixed;
  width: 300px;
  height: 400px;
  background-color: #f4f4f4;
  border: 1px solid #ccc;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s ease;
  opacity: 0;
  visibility: hidden;
  z-index: 999;
}

.side-panel.open {
  opacity: 1;
  visibility: visible;
}

/* 面板内容区域样式 */
.side-panel-body {
  padding: 20px;
}

button {
  padding: 10px 15px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  border: none;
}

button:hover {
  background-color: #0056b3;
}
</style>
