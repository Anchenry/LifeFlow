<script setup>
import { ref } from 'vue';
import { switchMapLayer } from '../utils/Home.js'

const images = [
  { src: 'src/assets/osm.png', title: 'GaoDe矢量', id: 'GaoDe矢量' },
  { src: 'src/assets/arcgis.png', title: 'GaoDe影像', id: 'GaoDe影像' },
  // { src: 'src/assets/arcgis.png', title: 'GaoDe影像注记', id: 'GaoDe影像注记' },
];

const emit = defineEmits(['close-popup']);
const selectedImage = ref('');  // 用户选择的图片

// 更新点击时选择的地图类型
function onClick(imageId) {
  selectedImage.value = imageId;  // 更新 selectedImage.value

  // 清除所有图片的选中样式
  images.forEach((image) => {
    const imgEl = document.querySelector(`#imageOption-${image.id} img`);
    if (imgEl) {
      imgEl.style.border = 'none';
    }
  });

  // 为当前选中的图片设置样式
  const selectedImgEl = document.querySelector(`#imageOption-${imageId} img`);
  if (selectedImgEl) {
    selectedImgEl.style.border = '3px solid #007bff'; // 蓝色边框
    selectedImgEl.style.boxShadow = '0 6px 12px rgba(0, 123, 255, 0.3)'; // 添加阴影
  }
}

// 应用用户选择的地图风格
function applySelection() {
  if (selectedImage.value) {
    switchMapLayer(selectedImage.value);  // 切换地图层
    emit('close-popup');
  }
}

// 关闭弹窗的方法
function closePopup() {
  // 触发父组件的 closePopup 方法
  emit('close-popup');
}
</script>

<template>
  <div class="map-change">
    <!-- 显示图片选项 -->
    <div class="image-options">
      <div
          v-for="image in images"
          :key="image.id"
          v-on:click="onClick(image.id)"
          :id="`imageOption-${image.id}`"
          :class="{ selected: selectedImage.value === image.id }"
          class="image-option"
      >
        <img :src="image.src" :alt="image.title" class="image" />
        <p>{{ image.title }}</p>
      </div>
    </div>

    <!-- 应用和取消按钮 -->
    <button @click="applySelection" :disabled="!selectedImage" class="apply-button">应用</button>
    <button @click="closePopup" class="cancel-button">取消</button>
  </div>
</template>

<style scoped>
.map-change {
  background-color: white;
  text-align: center;
  width: 100%;
}

.image-options {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.image-option {
  cursor: pointer;
  text-align: center;
  margin: 10px;
}

.image-option img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 10px;
}

/* 鼠标悬浮时的样式 */
.image-option:hover img {
  transform: scale(1.05); /* 轻微放大 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* 添加阴影 */
}

.image-option p {
  font-size: 14px;
  color: #333;
}

.image-option p {
  font-size: 14px;
  color: #333;
}

.popup-content button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin: 20px 20px 0px 20px;
}

.popup-content button:hover {
  background-color: #0056b3;
}

/* 应用按钮样式 */
.apply-button {
  background-color: #28a745; /* 绿色背景 */
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px;
  font-size: 14px;
}

.apply-button:disabled {
  background-color: #85c39a; /* 禁用时的浅绿色 */
  cursor: not-allowed;
}

</style>
