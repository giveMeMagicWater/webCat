<template>
  <div class="filter-panel-container">
    <h3>🔍 资源筛选</h3>
    
    <div class="filter-group">
      <label>资源类型</label>
      <div class="checkbox-group">
        <label class="checkbox-item" v-for="type in resourceTypes" :key="type.value">
          <input 
            type="checkbox" 
            :value="type.value"
            v-model="selectedTypes"
            @change="applyFilter"
          />
          <span>{{ type.label }} ({{ getTypeCount(type.value) }})</span>
        </label>
      </div>
    </div>

    <div class="filter-group">
      <label>关键词搜索</label>
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="输入 URL 关键词..."
        @input="applyFilter"
      />
    </div>

    <div class="filter-actions">
      <button class="btn-secondary" @click="selectAll">全选</button>
      <button class="btn-secondary" @click="clearAll">清空</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  resources: Array
})

const emit = defineEmits(['filter-change'])

const resourceTypes = [
  { label: '🎮 Cocos', value: 'cocos' },
  { label: '🦴 Spine', value: 'spine' },
  { label: '📷 图片', value: 'image' },
  { label: '🎵 音频', value: 'audio' },
  { label: '� 视频', value: 'video' },
  { label: '� 脚本', value: 'script' },
  { label: '📋 JSON', value: 'json' },
  { label: '� 样式', value: 'stylesheet' },
  { label: '🔤 字体', value: 'font' },
  { label: '📦 其他', value: 'other' }
]

const selectedTypes = ref([])
const searchKeyword = ref('')

// 初始化时全选
watch(() => props.resources, () => {
  if (selectedTypes.value.length === 0) {
    selectedTypes.value = resourceTypes.map(t => t.value)
  }
}, { immediate: true })

// 获取各类型的数量
const getTypeCount = (type) => {
  if (!props.resources) return 0
  return props.resources.filter(r => r.type === type).length
}

// 应用过滤
const applyFilter = () => {
  if (!props.resources) return

  let filtered = props.resources.filter(r => {
    const typeMatch = selectedTypes.value.includes(r.type)
    const keywordMatch = !searchKeyword.value || 
      r.url.toLowerCase().includes(searchKeyword.value.toLowerCase())
    return typeMatch && keywordMatch
  })

  emit('filter-change', filtered)
}

// 全选
const selectAll = () => {
  selectedTypes.value = resourceTypes.map(t => t.value)
  applyFilter()
}

// 清空
const clearAll = () => {
  selectedTypes.value = []
  applyFilter()
}

// 监听资源变化
watch(() => props.resources, () => {
  applyFilter()
}, { deep: true })
</script>

<style scoped>
.filter-panel-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-group > label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.checkbox-item:hover {
  background: #f5f5f5;
}

.checkbox-item input[type="checkbox"] {
  cursor: pointer;
}

.checkbox-item span {
  font-size: 13px;
  color: #666;
}

input[type="text"] {
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
}

input[type="text"]:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.btn-secondary {
  padding: 8px 16px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}
</style>
