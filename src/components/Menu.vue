<script setup>
import {nextTick, onMounted, ref} from 'vue';
import MapChange from './MapChange.vue';
import Lifeassessment from "./Lifeassessment.vue";
import TransportAssess from "@/components/TransportAssess.vue";

// 按钮配置
const buttons = [
  { icon: '../assets/mapchange.svg', popupTitle: '地图切换', type: 'map' },
  { icon: '../assets/lifeassessment.svg', popupTitle: '生活便利', type: 'life' },
  { icon: '../assets/convenienttransportation.svg', popupTitle: '交通便利', type: 'transport' },
  // { icon: '../assets/controlpanel.svg', popupTitle: '控制面板', type: 'control' },
];

// 控制弹窗显示
const isPopupVisible = ref(false);
// 当前点击的按钮
const currentButton = ref(null);

// 获取图标路径
const getIconPath = (icon) => {
  return new URL(`${icon}`, import.meta.url).href;
};

// 打开弹窗并显示对应的按钮信息
function openPopup(index) {
  currentButton.value = buttons[index];
  isPopupVisible.value = true;

  nextTick(() => {
    calculatePopupPosition();
  });
}

// 关闭弹窗
function closePopup() {
  isPopupVisible.value = false;
  currentButton.value = null;
}

// 弹窗位置状态
const popupPosition = ref({ x: 0, y: 0 });

// 计算弹窗初始位置（屏幕中央）
// 计算弹窗初始位置（相对于菜单栏的上方，距离页面底部）
function calculatePopupPosition() {
  const popupContent = document.getElementById('popup-content'); // 通过id获取元素
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // 获取菜单栏的位置
  const menuBar = document.querySelector('.menu-bar');
  const menuBarHeight = menuBar ? menuBar.offsetHeight : 0;

  // 获取弹窗内容宽度
  const popupWidth = popupContent ? popupContent.offsetWidth : 300; // 默认宽度为300px
  const popupHeight = popupContent ? popupContent.offsetHeight : 200; // 默认高度为200px

  popupPosition.value = {
    x: (screenWidth - popupWidth) / 2, // 水平居中
    y: menuBarHeight + 10, // 弹窗距离菜单栏 10px
  };
}

// 拖拽状态
const isDragging = ref(false);
// 拖拽起始位置
const dragStartPosition = ref({ x: 0, y: 0 });

// 开始拖拽
// 开始拖拽
function startDrag(event) {
  isDragging.value = true;
  // 计算拖拽起始位置
  dragStartPosition.value = {
    x: event.clientX - popupPosition.value.x, // 计算水平偏移
    y: event.clientY + popupPosition.value.y - window.innerHeight, // 计算竖直偏移（相对于底部）
  };

  // 监听鼠标移动和释放事件
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
}

// 拖拽中
function onDrag(event) {
  if (isDragging.value) {
    popupPosition.value = {
      x: event.clientX - dragStartPosition.value.x, // 水平位置
      y: window.innerHeight - (event.clientY - dragStartPosition.value.y), // 垂直位置相对于页面底部
    };
  }
}

// 停止拖拽
function stopDrag() {
  isDragging.value = false;
  // 移除事件监听
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
}


</script>

<template>
  <!-- 底部菜单栏 -->
  <div class="menu-bar">
    <div
        v-for="(button, index) in buttons"
        :key="index"
        class="menu-button"
        @click="openPopup(index)"
    >
      <img :src="getIconPath(button.icon)" alt="icon" class="button-icon" />
    </div>
  </div>

  <!-- 弹窗 -->
  <div v-if="isPopupVisible" class="popup-overlay" @click="closePopup">
    <div
        class="popup-content"
        id = "popup-content"
        @click.stop
        :style="{ left: popupPosition.x + 'px', bottom: popupPosition.y + 'px' }"
    >
      <!-- 弹窗标题（可拖动区域） -->
      <h3
          class="popup-title"
          @mousedown="startDrag"
      >
        {{ currentButton ? currentButton.popupTitle : '' }}
      </h3>
      <!-- 根据按钮类型来渲染不同的内容 -->
      <div v-if="currentButton?.type === 'map'">
        <MapChange @close-popup="closePopup" />
      </div>
      <div v-if="currentButton?.type === 'life'">
        <Lifeassessment @close-popup="closePopup" />
      </div>
      <div v-if="currentButton?.type === 'transport'">
        <TransportAssess @close-popup="closePopup" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 页面主体样式 */
.content {
  padding: 20px;
  text-align: center;
}

/* 菜单栏样式 */
.menu-bar {
  position: fixed;
  bottom: 0;
  left: 50%;  /* 将菜单栏的左边距设置为屏幕中心 */
  transform: translateX(-50%);  /* 使用 translateX 来精确居中 */
  display: flex;
  justify-content: center;  /* 水平居中按钮 */
  align-items: center;  /* 垂直居中按钮 */
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 30px 30px 0 0;
  padding: 10px;
  box-shadow: 0px -4px 8px rgba(0, 0, 0, 0.2);
  width: auto; /* 可以根据内容调整宽度 */
}

/* 圆形按钮样式 */
.menu-button {
  width: 50px;
  height: 50px;
  background-color: #ffffff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s ease;
  margin: 3px;
}

.menu-button:hover {
  transform: translateY(-5px);
}

.button-icon {
  width: 30px;  /* 设置图标的最大宽度 */
  height: 30px; /* 设置图标的最大高度 */
  object-fit: contain;  /* 保持图标的原始比例 */
}

/* 弹窗遮罩层 */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  //background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 弹窗垂直位置稍微偏上 */
  z-index: 10; /* 确保弹窗在地图之上 */
  pointer-events: none;
}

/* 弹窗内容 */
.popup-content {
  position: absolute;
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  cursor: grab; /* 拖拽时显示抓取光标 */
  user-select: none; /* 防止拖拽时选中文本 */
  width: 300px; /* 弹窗宽度固定为 300px */
  max-height: 80vh; /* 弹窗最大高度为视口的 80% */
  overflow-y: auto; /* 内容超出时显示滚动条 */
  pointer-events: auto;
  width: auto;
}

/* 拖拽时的光标 */
.popup-content:active {
  cursor: grabbing;
}

/* 弹窗标题居中 */
.popup-title {
  text-align: center; /* 文字水平居中 */
  margin: 0 0 20px 0; /* 调整标题与内容的间距 */
}
</style>