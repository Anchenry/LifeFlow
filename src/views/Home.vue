<script setup>
import {ref, onMounted, computed, nextTick} from 'vue'; // vue相关方法
import 'ol/ol.css'; // 地图样式
import { initMap } from '../utils/Home.js'; // 引入初始化地图的函数

// 引用地图容器的ref
const mapRef = ref(null);

// 在组件挂载后初始化地图
onMounted(() => {
  initMap(mapRef.value);  // 初始化地图并传入容器
});
</script>

<template>
  <!-- 地图容器，绑定 ref -->
  <div id="main_map" class="main_map" ref="mapRef"></div>
</template>

<style scoped>
.main_map {
  width: 100%;
  height: 100%;
}
</style>
