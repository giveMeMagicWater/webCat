<template>
  <div class="app-container">
    <!-- 标题栏 -->
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">🐱</span>
          <h1>WebCat</h1>
        </div>
        <p class="subtitle">Cocos Creator 资源抓取工具</p>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="app-main">
      <!-- 左侧控制面板 -->
      <aside class="control-panel card">
        <UrlInput 
          @start-scraping="handleStartScraping" 
          @stop-scraping="handleStopScraping"
          :scraping="scraping" 
        />
        <FilterPanel 
          :resources="resources"
          @filter-change="handleFilterChange"
        />
        <DownloadPanel 
          :selected-count="selectedResources.length"
          @download="handleDownload"
        />
      </aside>

      <!-- 右侧资源列表 -->
      <section class="resource-panel card">
        <ResourceList 
          :resources="filteredResources"
          :loading="scraping"
          @selection-change="handleSelectionChange"
        />
      </section>
    </main>

    <!-- 状态栏 -->
    <footer class="app-footer">
      <StatusBar 
        :total="resources.length"
        :filtered="filteredResources.length"
        :selected="selectedResources.length"
        :status="status"
      />
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import UrlInput from './components/UrlInput.vue'
import FilterPanel from './components/FilterPanel.vue'
import ResourceList from './components/ResourceList.vue'
import DownloadPanel from './components/DownloadPanel.vue'
import StatusBar from './components/StatusBar.vue'

// 状态管理
const resources = ref([])
const filteredResources = ref([])
const selectedResources = ref([])
const scraping = ref(false)
const status = ref('就绪')

// 开始抓取
const handleStartScraping = async (url) => {
  scraping.value = true
  status.value = '正在打开抓取窗口...'
  resources.value = []
  
  try {
    const result = await window.electronAPI.startScraping(url)
    if (result.success) {
      status.value = '抓取中 - 请在浏览器窗口中操作游戏，资源将实时显示'
    } else {
      status.value = `启动失败: ${result.error}`
      scraping.value = false
    }
  } catch (error) {
    status.value = `错误: ${error.message}`
    scraping.value = false
  }
}

// 停止抓取
const handleStopScraping = async () => {
  status.value = '正在停止抓取...'
  
  try {
    const result = await window.electronAPI.stopScraping()
    if (result.success) {
      status.value = `抓取完成！共收集 ${result.count} 个资源`
      // 资源已经通过实时更新添加到列表中了
    } else {
      status.value = `停止失败: ${result.error}`
    }
  } catch (error) {
    status.value = `错误: ${error.message}`
  } finally {
    scraping.value = false
  }
}

// 过滤资源
const handleFilterChange = (filtered) => {
  filteredResources.value = filtered
}

// 选择改变
const handleSelectionChange = (selected) => {
  selectedResources.value = selected
}

// 下载资源
const handleDownload = async (directory) => {
  if (selectedResources.value.length === 0) {
    alert('请先选择要下载的资源')
    return
  }

  status.value = `正在下载 ${selectedResources.value.length} 个资源...`
  
  try {
    // 转换为纯对象数组，去除 Vue 响应式属性
    const plainResources = selectedResources.value.map(r => ({
      url: r.url,
      type: r.type,
      contentType: r.contentType,
      size: r.size,
      status: r.status,
      timestamp: r.timestamp
    }))
    
    const result = await window.electronAPI.downloadResources(
      plainResources,
      directory
    )
    
    if (result.success) {
      status.value = `下载完成！成功: ${result.downloaded}, 失败: ${result.failed}`
    } else {
      status.value = `下载失败: ${result.error}`
    }
  } catch (error) {
    status.value = `下载错误: ${error.message}`
  }
}

// 监听抓取进度（实时更新）
if (window.electronAPI) {
  window.electronAPI.onScrapingProgress((data) => {
    if (data.type === 'resource-found') {
      // 实时添加新资源
      resources.value.push(data.resource)
      filteredResources.value = resources.value
      
      // 更新状态栏
      status.value = `抓取中 - 已收集 ${data.total} 个资源`
    }
  })
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  padding: 20px 30px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 32px;
}

.logo h1 {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.app-main {
  flex: 1;
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

.control-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  overflow-y: auto;
}

.resource-panel {
  padding: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.app-footer {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}
</style>
