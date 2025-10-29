<template>
  <div class="resource-list-container">
    <div class="list-header">
      <h3>📦 资源列表</h3>
      <div class="header-actions">
        <label class="select-all">
          <input 
            type="checkbox" 
            v-model="selectAllChecked"
            @change="toggleSelectAll"
          />
          <span>全选</span>
        </label>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在抓取资源...</p>
    </div>

    <div v-else-if="resources.length === 0" class="empty-state">
      <span class="empty-icon">📭</span>
      <p>暂无资源</p>
      <p class="empty-hint">请输入网址并点击"开始抓取"</p>
    </div>

    <div v-else class="list-content">
      <div class="list-scroll">
        <div 
          v-for="(resource, index) in resources" 
          :key="index"
          class="resource-item"
          :class="{ selected: selectedItems.has(index) }"
        >
          <label class="resource-checkbox">
            <input 
              type="checkbox" 
              :checked="selectedItems.has(index)"
              @change="toggleSelect(index)"
            />
          </label>

          <div class="resource-icon">
            {{ getTypeIcon(resource.type) }}
          </div>

          <div class="resource-info">
            <div class="resource-url" :title="resource.url">
              {{ getFileName(resource.url) }}
            </div>
            <div class="resource-meta">
              <span class="meta-type">{{ getTypeName(resource.type) }}</span>
              <span class="meta-size">{{ formatSize(resource.size) }}</span>
            </div>
          </div>

          <div class="resource-actions">
            <button 
              class="btn-icon"
              @click="copyUrl(resource.url)"
              title="复制链接"
            >
              📋
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  resources: Array,
  loading: Boolean
})

const emit = defineEmits(['selection-change'])

const selectedItems = ref(new Set())
const selectAllChecked = ref(false)

// 监听资源变化,清空选择
watch(() => props.resources, () => {
  selectedItems.value.clear()
  selectAllChecked.value = false
  emitSelection()
}, { deep: true })

// 切换单项选择
const toggleSelect = (index) => {
  if (selectedItems.value.has(index)) {
    selectedItems.value.delete(index)
  } else {
    selectedItems.value.add(index)
  }
  updateSelectAllState()
  emitSelection()
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectAllChecked.value) {
    props.resources.forEach((_, index) => {
      selectedItems.value.add(index)
    })
  } else {
    selectedItems.value.clear()
  }
  emitSelection()
}

// 更新全选状态
const updateSelectAllState = () => {
  selectAllChecked.value = selectedItems.value.size === props.resources.length
}

// 发送选择变化
const emitSelection = () => {
  const selected = props.resources.filter((_, index) => 
    selectedItems.value.has(index)
  )
  emit('selection-change', selected)
}

// 获取文件名
const getFileName = (url) => {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const parts = pathname.split('/')
    return parts[parts.length - 1] || url
  } catch {
    return url
  }
}

// 获取类型图标
const getTypeIcon = (type) => {
  const icons = {
    cocos: '🎮',
    spine: '🦴',
    image: '📷',
    audio: '🎵',
    video: '🎬',
    script: '📝',
    json: '📋',
    stylesheet: '🎨',
    font: '🔤',
    other: '📦'
  }
  return icons[type] || '📦'
}

// 获取类型名称
const getTypeName = (type) => {
  const names = {
    cocos: 'Cocos',
    spine: 'Spine',
    image: '图片',
    audio: '音频',
    video: '视频',
    script: '脚本',
    json: 'JSON',
    stylesheet: '样式',
    font: '字体',
    other: '其他'
  }
  return names[type] || '未知'
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '未知'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// 复制链接
const copyUrl = (url) => {
  navigator.clipboard.writeText(url).then(() => {
    // 可以添加一个提示
    console.log('链接已复制')
  })
}
</script>

<style scoped>
.resource-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #999;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 64px;
}

.empty-hint {
  font-size: 12px;
  color: #bbb;
}

.list-content {
  flex: 1;
  overflow: hidden;
}

.list-scroll {
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.resource-item:hover {
  background: #f9f9f9;
  border-color: #667eea;
  transform: translateX(2px);
}

.resource-item.selected {
  background: #667eea10;
  border-color: #667eea;
}

.resource-checkbox input {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.resource-icon {
  font-size: 24px;
  min-width: 24px;
}

.resource-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resource-url {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.meta-type {
  color: #667eea;
  font-weight: 600;
}

.meta-size {
  color: #999;
}

.resource-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  padding: 6px 10px;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f0f0f0;
  border-color: #667eea;
}
</style>
