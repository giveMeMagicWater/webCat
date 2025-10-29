import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import ResourceScraper from './scraper.js'
import { downloadResources } from './downloader.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null
let scraper = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    icon: path.join(__dirname, '../public/icon.png')
  })

  // 开发环境加载 Vite 服务器
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // 生产环境加载构建后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 当 Electron 完成初始化时创建窗口
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 当所有窗口关闭时退出应用 (macOS 除外)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC 通信处理
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  return result.filePaths[0]
})

ipcMain.handle('start-scraping', async (event, url) => {
  try {
    // 初始化抓取器
    if (!scraper) {
      scraper = new ResourceScraper()
      await scraper.init()
    }

    // 开始抓取
    const result = await scraper.startScraping(url)
    return result
  } catch (error) {
    console.error('抓取错误:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('download-resources', async (event, resources, directory) => {
  try {
    const result = await downloadResources(resources, directory, (progress) => {
      // 发送下载进度
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-progress', progress)
      }
    })
    return result
  } catch (error) {
    console.error('下载错误:', error)
    return { success: false, error: error.message }
  }
})

// 应用退出时清理
app.on('before-quit', async () => {
  if (scraper) {
    await scraper.close()
  }
})

// 导出主窗口实例供其他模块使用
export { mainWindow }
