<template>
  <div class="download-panel-container">
    <h3>💾 下载管理</h3>
    
    <div class="info-box">
      <p>已选择: <strong>{{ selectedCount }}</strong> 个资源</p>
    </div>

    <div class="download-actions">
      <button 
        class="btn-select-dir"
        @click="selectDirectory"
      >
        📁 选择保存目录
      </button>
      
      <div v-if="saveDirectory" class="selected-dir">
        <span class="dir-icon">📂</span>
        <span class="dir-path" :title="saveDirectory">{{ saveDirectory }}</span>
      </div>

      <button 
        class="btn-download"
        @click="startDownload"
        :disabled="!canDownload"
      >
        ⬇️ 开始下载
      </button>
    </div>

    <div class="tips">
      <p>💡 提示:</p>
      <ul>
        <li>在资源列表中勾选要下载的文件</li>
        <li>选择保存目录后点击开始下载</li>
        <li>资源将按类型分类保存</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  selectedCount: Number
})

const emit = defineEmits(['download'])

const saveDirectory = ref('')

const canDownload = computed(() => {
  return props.selectedCount > 0 && saveDirectory.value
})

const selectDirectory = async () => {
  const dir = await window.electronAPI.selectDirectory()
  if (dir) {
    saveDirectory.value = dir
  }
}

const startDownload = () => {
  if (canDownload.value) {
    emit('download', saveDirectory.value)
  }
}
</script>

<style scoped>
.download-panel-container {
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

.info-box {
  padding: 12px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 6px;
  border: 1px solid #667eea30;
}

.info-box p {
  margin: 0;
  font-size: 14px;
  color: #555;
}

.info-box strong {
  color: #667eea;
  font-size: 16px;
}

.download-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-select-dir,
.btn-download {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-select-dir {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-select-dir:hover {
  background: #667eea;
  color: white;
}

.btn-download {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.btn-download:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.selected-dir {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 12px;
}

.dir-icon {
  font-size: 16px;
}

.dir-path {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #666;
}

.tips {
  padding: 12px;
  background: #fff3cd;
  border-radius: 6px;
  border: 1px solid #ffc107;
}

.tips p {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #856404;
}

.tips ul {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: #856404;
}

.tips li {
  margin-bottom: 4px;
}
</style>
