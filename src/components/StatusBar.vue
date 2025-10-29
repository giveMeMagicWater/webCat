<template>
  <div class="status-bar">
    <div class="status-left">
      <span class="status-item">
        <span class="status-label">总资源:</span>
        <span class="status-value">{{ total }}</span>
      </span>
      <span class="status-divider">|</span>
      <span class="status-item">
        <span class="status-label">已筛选:</span>
        <span class="status-value">{{ filtered }}</span>
      </span>
      <span class="status-divider">|</span>
      <span class="status-item">
        <span class="status-label">已选择:</span>
        <span class="status-value highlight">{{ selected }}</span>
      </span>
    </div>

    <div class="status-center">
      <span class="status-message" :class="statusClass">
        {{ status }}
      </span>
    </div>

    <div class="status-right">
      <span class="status-item">
        <span class="status-label">版本:</span>
        <span class="status-value">v1.0.0</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: Number,
  filtered: Number,
  selected: Number,
  status: String
})

const statusClass = computed(() => {
  if (props.status.includes('完成')) return 'success'
  if (props.status.includes('失败') || props.status.includes('错误')) return 'error'
  if (props.status.includes('抓取中') || props.status.includes('下载中')) return 'loading'
  return 'normal'
})
</script>

<style scoped>
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 30px;
  font-size: 13px;
  color: #666;
}

.status-left,
.status-center,
.status-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-label {
  color: #999;
}

.status-value {
  font-weight: 600;
  color: #333;
}

.status-value.highlight {
  color: #667eea;
  font-size: 14px;
}

.status-divider {
  color: #ddd;
}

.status-message {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-message.normal {
  background: #e3f2fd;
  color: #1976d2;
}

.status-message.success {
  background: #e8f5e9;
  color: #388e3c;
}

.status-message.error {
  background: #ffebee;
  color: #d32f2f;
}

.status-message.loading {
  background: #fff3e0;
  color: #f57c00;
}
</style>
