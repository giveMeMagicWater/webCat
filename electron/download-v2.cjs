// 备选下载方案：使用 Electron 内置下载 API
// 如果当前下载方法失败率高，可以使用这个方案

const { app, BrowserWindow, ipcMain, dialog, session } = require('electron')
const path = require('path')
const fs = require('fs')

// 使用 Electron 的下载管理器下载资源
ipcMain.handle('download-resources-v2', async (event, resources, directory) => {
  try {
    if (!directory) {
      return { success: false, error: '请选择保存目录' }
    }

    if (!scrapingWindow || scrapingWindow.isDestroyed()) {
      return { success: false, error: '抓取窗口已关闭，请重新抓取' }
    }

    let downloaded = 0
    let failed = 0
    const errors = []
    const downloads = new Map() // 跟踪下载状态

    // 设置下载事件监听
    scrapingWindow.webContents.session.on('will-download', (event, item, webContents) => {
      const url = item.getURL()
      const urlObj = new URL(url)
      
      // 解析相对路径
      let relativePath = urlObj.pathname
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1)
      }
      relativePath = decodeURIComponent(relativePath)
      
      if (!relativePath) {
        relativePath = `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      
      // 设置保存路径
      const savePath = path.join(directory, relativePath)
      const saveDir = path.dirname(savePath)
      
      // 创建目录
      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true })
      }
      
      item.setSavePath(savePath)
      
      // 下载完成
      item.once('done', (event, state) => {
        if (state === 'completed') {
          downloaded++
          console.log(`✅ 下载成功: ${relativePath}`)
        } else {
          failed++
          errors.push(`${path.basename(url)}: ${state}`)
          console.error(`❌ 下载失败: ${url} - ${state}`)
        }
        
        downloads.delete(url)
        
        // 发送进度
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-progress', {
            total: resources.length,
            downloaded: downloaded + failed,
            successful: downloaded,
            failed
          })
        }
      })
    })

    // 触发下载
    console.log(`\n🚀 使用 Electron 下载 API 下载 ${resources.length} 个资源...\n`)
    
    for (const resource of resources) {
      try {
        if (!resource.url || !resource.url.startsWith('http')) {
          failed++
          errors.push(`无效URL: ${resource.url}`)
          continue
        }
        
        downloads.set(resource.url, true)
        scrapingWindow.webContents.downloadURL(resource.url)
        
        // 等待一小段时间，避免并发过高
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error) {
        failed++
        errors.push(`${resource.url}: ${error.message}`)
        downloads.delete(resource.url)
      }
    }

    // 等待所有下载完成
    const maxWaitTime = 300000 // 最多等待5分钟
    const startTime = Date.now()
    
    while (downloads.size > 0 && Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`\n✨ 下载完成！`)
    console.log(`📊 总计: ${resources.length}, 成功: ${downloaded}, 失败: ${failed}`)

    return {
      success: true,
      total: resources.length,
      downloaded,
      failed,
      errors: errors.slice(0, 20)
    }

  } catch (error) {
    console.error('下载错误:', error)
    return { success: false, error: error.message }
  }
})

module.exports = { downloadResourcesV2: true }
