<template>
  <div class="url-input-container">
    <h3>🌐 目标网址</h3>
    <div class="input-group">
      <input
        v-model="url"
        type="text"
        placeholder="请输入网页 URL，例如: https://example.com/game"
        :disabled="scraping"
        @keyup.enter="handleAction"
      />
      <button 
        v-if="!scraping"
        class="btn-primary"
        @click="startScraping"
        :disabled="!url"
      >
        🚀 开始抓取
      </button>
      <button 
        v-else
        class="btn-stop"
        @click="stopScraping"
      >
        ⏸️ 停止抓取
      </button>
    </div>
    
    <div v-if="!scraping" class="hint warning">
      ⚠️ 请确保输入的是合法的网页地址
    </div>
    <div v-else class="hint active">
      <div class="pulse-dot"></div>
      <div>
        <strong>正在抓取中...</strong>
        <p>✨ 请在打开的浏览器窗口中操作游戏，资源将实时收集</p>
        <p>🎮 触发游戏的各种功能来加载更多资源</p>
        <p>🛑 完成后点击"停止抓取"按钮</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  scraping: Boolean
})

const emit = defineEmits(['start-scraping', 'stop-scraping'])

const url = ref('')

const startScraping = () => {
  if (url.value && !props.scraping) {
    emit('start-scraping', url.value)
  }
}

const stopScraping = () => {
  emit('stop-scraping')
}

const handleAction = () => {
  if (props.scraping) {
    stopScraping()
  } else {
    startScraping()
  }
}
</script>

<style scoped>
.url-input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.input-group {
  display: flex;
  gap: 8px;
}

input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.btn-primary,
.btn-stop {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-stop {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  animation: pulse 2s ease-in-out infinite;
}

.btn-stop:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.btn-primary:active:not(:disabled),
.btn-stop:active {
  transform: translateY(0);
}

.hint {
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 12px;
}

.hint.warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
}

.hint.active {
  background: linear-gradient(135deg, #e0f7fa 0%, #e1bee7 100%);
  border: 2px solid #667eea;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: slideDown 0.3s ease-out;
}

.hint.active strong {
  color: #667eea;
  font-size: 14px;
  display: block;
  margin-bottom: 6px;
}

.hint.active p {
  margin: 4px 0;
  color: #555;
  line-height: 1.5;
}

.pulse-dot {
  width: 12px;
  height: 12px;
  background: #667eea;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
  animation: pulseDot 1.5s ease-in-out infinite;
}

@keyframes pulseDot {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.6;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
