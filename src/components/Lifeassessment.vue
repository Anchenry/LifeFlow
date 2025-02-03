<template>
  <div class="lifeassessment">
    <!-- 左侧控制面板 -->
    <div class="control-panel">
      <div class="slider-demo-block">
        <span class="demonstration">距离</span>
        <el-slider v-model="valuedistance" :min="0" :max="5" :step="0.1" style="width: 60%;padding-right: 5px" show-stops />
      </div>
      <div class="slider-demo-block">
        <span class="demonstration">商业</span>
        <el-slider v-model="valuebusiness" :min="0" :max="10" :step="1" style="width: 60%;padding-right: 5px" show-stops />
      </div>
      <div class="slider-demo-block">
        <span class="demonstration">交通</span>
        <el-slider v-model="valuetraffic" :min="0" :max="10" :step="1" style="width: 60%;padding-right: 5px" show-stops />
      </div>
      <div class="slider-demo-block">
        <span class="demonstration">休闲</span>
        <el-slider v-model="valueleisure" :min="0" :max="10" :step="1" style="width: 60%;padding-right: 5px" show-stops />
      </div>
      <div class="slider-demo-block">
        <span class="demonstration">公共服务</span>
        <el-slider v-model="valuepublic" :min="0" :max="10" :step="1" style="width: 60%;padding-right: 5px" show-stops />
      </div>
    </div>

    <!-- 右侧生活便利度与热力图控制 -->
    <div class="right-panel">
      <div class="ConveniencePanel">
        <p>生活便利度: <span class="total-convenience">{{ formattedConvenience }}</span></p>
      </div>
      <div class="heatmap-controls">
        <p>显示的热力图类别：</p>
        <label>
          <input type="checkbox" v-model="showBusinessHeatmap" /> 商业
        </label>
        <label>
          <input type="checkbox" v-model="showTrafficHeatmap" /> 交通
        </label>
        <label>
          <input type="checkbox" v-model="showLeisureHeatmap" /> 休闲
        </label>
        <label>
          <input type="checkbox" v-model="showPublicHeatmap" /> 公共服务
        </label>
      </div>
    </div>
  </div>

  <div class="buttonment">
    <button @click="applySelection" class="apply-button">应用</button>
    <button @click="closePopup" class="cancel-button">取消</button>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { defineEmits } from 'vue'
import { updateUserPreferences, userPreferences, updateMacDistance, maxDistance, totalConvenience, addHeatmapLayer, heatmapStates} from '../utils/home.js'

// 使用 defineEmits 显式声明事件
const emit = defineEmits(['closePopup'])

// 关闭窗口
function closePopup() {
  emit('close-popup');
}

const valuedistance = ref(maxDistance)
const valuebusiness = ref(userPreferences['商业'])
const valuetraffic = ref(userPreferences['交通'])
const valueleisure = ref(userPreferences['休闲'])
const valuepublic = ref(userPreferences['公共服务'])

// 热力图显示状态
const showBusinessHeatmap = ref(heatmapStates['商业'])
const showTrafficHeatmap = ref(heatmapStates['交通'])
const showLeisureHeatmap = ref(heatmapStates['休闲'])
const showPublicHeatmap = ref(heatmapStates['公共服务'])

// 应用选择的设置
function applySelection() {
  const updatedPreferences = {
    '商业': valuebusiness.value,
    '交通': valuetraffic.value,
    '休闲': valueleisure.value,
    '公共服务': valuepublic.value
  };

  // 更新偏好设置
  updateMacDistance(valuedistance)
  updateUserPreferences(updatedPreferences);

  // 更新热力图
  updateHeatmapLayers();
  closePopup();
}

// 更新热力图图层
function updateHeatmapLayers() {
  const selectedCategories = {
    '商业': showBusinessHeatmap.value,
    '交通': showTrafficHeatmap.value,
    '休闲': showLeisureHeatmap.value,
    '公共服务': showPublicHeatmap.value
  };

  // 调用函数来根据选中的类别更新热力图
  addHeatmapLayer(selectedCategories);
}

const formattedConvenience = computed(() => {
  return totalConvenience.value.toFixed(2);
});

// 显示便利度
defineExpose({
  totalConvenience,
});
</script>

<style scoped>
.lifeassessment {
  display: flex;
  justify-content: space-between;
  padding: 10px; /* 减少内边距 */
  gap: 10px; /* 减少左右两部分之间的间距 */
}

/* 控制面板样式 */
.control-panel {
  text-align: center;
  border: 2px dashed #bbb; /* 虚线边框 */
  border-radius: 10px; /* 圆角 */
  padding: 10px; /* 减少内边距 */
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); /* 阴影 */
}

.slider-demo-block {
  max-width: 400px; /* 缩小最大宽度 */
  min-width: 120px; /* 缩小最小宽度 */
  display: flex;
  align-items: center;
  margin-bottom: 10px; /* 减少滑动条之间的间距 */
}

.slider-demo-block .el-slider {
  width: 60%; /* 缩小滑块宽度 */
  max-width: 200px; /* 缩小最大宽度 */
  min-width: 80px; /* 缩小最小宽度 */
  margin-left: 8px; /* 减少左边距 */
}

.slider-demo-block .demonstration {
  font-size: 12px; /* 缩小字体大小 */
  color: var(--el-text-color-primary);
  line-height: 32px; /* 调整行高 */
  min-width: 50px; /* 缩小最小宽度 */
}

.slider-demo-block .demonstration + .el-slider {
  flex: 0 0 60%; /* 调整滑块宽度占比 */
  margin-left: 8px; /* 减少左边距 */
}

/* 应用按钮样式 */
.popup-content button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px; /* 缩小按钮内边距 */
  border-radius: 5px;
  cursor: pointer;
  margin: 10px 10px 0px 10px; /* 减少按钮外边距 */
  font-size: 12px; /* 缩小字体大小 */
}

.popup-content button:hover {
  background-color: #0056b3;
}

.apply-button {
  background-color: #28a745; /* 绿色背景 */
  color: white;
  border: none;
  padding: 8px 16px; /* 缩小按钮内边距 */
  border-radius: 5px;
  cursor: pointer;
  margin-right: 8px; /* 减少右边距 */
  font-size: 12px; /* 缩小字体大小 */
}

.apply-button:disabled {
  background-color: #85c39a; /* 禁用时的浅绿色 */
  cursor: not-allowed;
}

/* 右侧面板容器 */
.right-panel {
  display: flex;
  flex-direction: column; /* 垂直排列 */
  gap: 10px; /* 减少 ConveniencePanel 和 heatmap-controls 之间的间距 */
}

/* 生活便利度面板样式 */
.ConveniencePanel {
  border: 2px dashed #bbb; /* 虚线边框 */
  border-radius: 10px; /* 圆角 */
  padding: 10px; /* 减少内边距 */
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); /* 阴影 */
  font-size: 12px; /* 缩小字体大小 */
}
.ConveniencePanel p {
  font-size: 16px; /* 设置常规文本的字体大小 */
}
.ConveniencePanel .total-convenience {
  font-size: 24px; /* 设置数字部分的字体大小，增大显示效果 */
  font-weight: bold; /* 使数字更加突出 */
  color: #007bff; /* 给数字添加颜色，增强可见性 */
}

/* 热力图控制面板样式 */
.heatmap-controls {
  border: 2px dashed #bbb; /* 虚线边框 */
  border-radius: 10px; /* 圆角 */
  padding: 10px; /* 减少内边距 */
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); /* 阴影 */
  display: grid;
  gap: 10px; /* 减少控件之间的间距 */
  font-size: 12px; /* 缩小字体大小 */
}

.heatmap-controls label {
  display: flex;
  align-items: center;
  font-size: 12px; /* 缩小字体大小 */
}

.heatmap-controls input {
  margin-right: 6px; /* 减少复选框和标签之间的间距 */
}

.buttonment{
  text-align: center;
}
</style>
