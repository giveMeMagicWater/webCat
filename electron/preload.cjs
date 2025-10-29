const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 选择保存目录
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // 开始抓取资源
  startScraping: (url) => ipcRenderer.invoke('start-scraping', url),
  
  // 停止抓取资源
  stopScraping: () => ipcRenderer.invoke('stop-scraping'),
  
  // 获取抓取状态
  getScrapingStatus: () => ipcRenderer.invoke('get-scraping-status'),
  
  // 下载资源
  downloadResources: (resources, directory) => 
    ipcRenderer.invoke('download-resources', resources, directory),
  
  // 监听抓取进度
  onScrapingProgress: (callback) => {
    ipcRenderer.on('scraping-progress', (event, data) => callback(data))
  },
  
  // 监听下载进度
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data))
  },
  
  // 移除监听器
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  }
})
