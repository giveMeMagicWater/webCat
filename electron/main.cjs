const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

// 启用硬件加速和 WebGL 支持 + 隐藏自动化特征
app.commandLine.appendSwitch('enable-webgl')
app.commandLine.appendSwitch('enable-accelerated-2d-canvas')
app.commandLine.appendSwitch('enable-webgl2-compute-context')
app.commandLine.appendSwitch('ignore-gpu-blacklist')
app.commandLine.appendSwitch('enable-gpu-rasterization')
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled')  // 隐藏自动化特征
app.commandLine.appendSwitch('disable-dev-shm-usage')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-setuid-sandbox')
app.commandLine.appendSwitch('disable-web-security')  // 允许跨域

// 强制启用 GPU 和 WebGL（关键！）
app.commandLine.appendSwitch('enable-unsafe-webgpu')
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,WebGL2ComputeContext')
app.commandLine.appendSwitch('use-gl', 'desktop')  // 使用桌面 OpenGL
app.commandLine.appendSwitch('enable-zero-copy')

// 禁用可能干扰 WebGL 的功能
app.disableHardwareAcceleration = () => {} // 阻止禁用硬件加速


let mainWindow = null
let scrapingWindow = null // 抓取专用浏览器窗口
let collectedResources = [] // 收集的资源列表
let isScrapingActive = false // 抓取状态

// 最小资源大小（字节），对于图片/音视频/字体/cocos/spine 等类型生效。只有当 response header 中存在 content-length 时才会被用于过滤。
const MIN_RESOURCE_SIZE = 10 * 1024 // 10KB

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    center: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webgl: true,  // 启用 WebGL
      acceleratedGraphics: true,  // 启用硬件加速
      enableWebSQL: true
    },
    icon: path.join(__dirname, '../public/icon.png')
  })

  // 开发环境加载 Vite 服务器
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:3000')
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
  // 设置 User-Agent 伪装成 Chrome 浏览器
  app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  
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

// Chrome 浏览器的 User-Agent
const chromeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

ipcMain.handle('start-scraping', async (event, url) => {
  try {
    if (isScrapingActive) {
      return { success: false, error: '抓取已在进行中' }
    }

    // 重置资源列表
    collectedResources = []
    isScrapingActive = true

    // 创建抓取窗口
    scrapingWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      title: '资源抓取 - 请在此窗口操作游戏',
      webPreferences: {
        preload: path.join(__dirname, 'scraping-preload.cjs'),  // 添加专用 preload 脚本
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false, // 允许跨域,方便抓取资源
        webgl: true,  // 启用 WebGL
        acceleratedGraphics: true,  // 启用硬件加速
        enableWebSQL: true,
        allowRunningInsecureContent: true
      }
    })

    // 设置 User-Agent（伪装成 Chrome）
    const chromeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    scrapingWindow.webContents.setUserAgent(chromeUserAgent)

    // 监听所有网络请求
    scrapingWindow.webContents.session.webRequest.onCompleted((details) => {
      if (!isScrapingActive) return

      const { url, statusCode, responseHeaders, resourceType } = details
      // 过滤不需要的URL
      if (!shouldCollectResource(url, resourceType)) return

      // 将 responseHeaders 转换为普通对象（可序列化）
      const headers = responseHeaders ? JSON.parse(JSON.stringify(responseHeaders)) : {}

      // 读取 content-length 并解析为数字（若存在）
      const contentLengthHeader = headers['content-length'] ? headers['content-length'][0] : undefined
      const size = contentLengthHeader ? parseInt(contentLengthHeader) : 0

      const type = classifyResourceType(resourceType, url, headers)

      // 当存在 content-length 时，对特定类型应用最小大小过滤，避免抓取很多 <10KB 的无效小文件
      const sizeFilteredTypes = ['image', 'audio', 'video', 'font', 'cocos', 'spine']
      if (contentLengthHeader && size > 0 && size < MIN_RESOURCE_SIZE && sizeFilteredTypes.includes(type)) {
        // 忽略小文件
        return
      }

      const resource = {
        url,
        type,
        contentType: headers['content-type'] ? headers['content-type'][0] : '',
        size,
        status: statusCode,
        timestamp: Date.now()
      }

      // 避免重复
      if (!collectedResources.some(r => r.url === url)) {
        collectedResources.push(resource)

        // 实时发送资源到主窗口（创建可序列化副本）
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('scraping-progress', {
            type: 'resource-found',
            resource: JSON.parse(JSON.stringify(resource)), // 确保可序列化
            total: collectedResources.length
          })
        }
      }
    })

    // 加载目标网页
    await scrapingWindow.loadURL(url)

    // 页面加载完成后注入伪装脚本
    scrapingWindow.webContents.on('did-finish-load', () => {
      // 注入深度伪装脚本，隐藏所有 Electron 特征
      scrapingWindow.webContents.executeJavaScript(`
        (function() {
          // 删除 Electron 特征
          delete window.electron;
          delete window.electronAPI;
          delete window.process;
          delete window.require;
          delete window.module;
          delete window.global;
          
          // 覆盖 navigator 属性使其看起来像真实 Chrome
          Object.defineProperty(navigator, 'userAgent', {
            get: () => '${chromeUserAgent}',
            configurable: false
          });
          
          Object.defineProperty(navigator, 'vendor', {
            get: () => 'Google Inc.',
            configurable: false
          });
          
          Object.defineProperty(navigator, 'platform', {
            get: () => 'Win32',
            configurable: false
          });
          
          // 伪装 WebGL 信息
          const getParameter = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function(parameter) {
            if (parameter === 37445) {  // UNMASKED_VENDOR_WEBGL
              return 'Google Inc. (NVIDIA)';
            }
            if (parameter === 37446) {  // UNMASKED_RENDERER_WEBGL
              return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)';
            }
            return getParameter.call(this, parameter);
          };
          
          // WebGL2 同样处理
          if (typeof WebGL2RenderingContext !== 'undefined') {
            const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
            WebGL2RenderingContext.prototype.getParameter = function(parameter) {
              if (parameter === 37445) {
                return 'Google Inc. (NVIDIA)';
              }
              if (parameter === 37446) {
                return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)';
              }
              return getParameter2.call(this, parameter);
            };
          }
          
          // 确保 chrome 对象存在
          if (typeof chrome === 'undefined') {
            window.chrome = {
              runtime: {},
              loadTimes: function() {},
              csi: function() {},
              app: {}
            };
          }
          
          // 覆盖插件信息
          Object.defineProperty(navigator, 'plugins', {
            get: () => [
              { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
              { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
              { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
            ],
            configurable: false
          });
          
          // 添加 Chrome 特有的 API
          window.chrome.csi = () => ({
            startE: Date.now(),
            onloadT: Date.now(),
            pageT: Date.now(),
            tran: 15
          });
          
          window.chrome.loadTimes = () => ({
            requestTime: Date.now() / 1000,
            startLoadTime: Date.now() / 1000,
            commitLoadTime: Date.now() / 1000,
            finishDocumentLoadTime: Date.now() / 1000,
            finishLoadTime: Date.now() / 1000,
            firstPaintTime: Date.now() / 1000,
            firstPaintAfterLoadTime: 0,
            navigationType: 'Other',
            wasFetchedViaSpdy: false,
            wasNpnNegotiated: true,
            npnNegotiatedProtocol: 'h2',
            wasAlternateProtocolAvailable: false,
            connectionInfo: 'h2'
          });
          
          // 覆盖权限 API
          const originalQuery = window.navigator.permissions.query;
          window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
              Promise.resolve({ state: Notification.permission }) :
              originalQuery(parameters)
          );
          
          // 隐藏 Headless 特征
          Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
            configurable: false
          });
          
          console.log('🎭 浏览器伪装已激活 - 现在看起来像真实的 Chrome 浏览器');
        })();
      `);
    });

    // 窗口关闭时停止抓取
    scrapingWindow.on('closed', () => {
      if (isScrapingActive) {
        stopScraping()
      }
    })

    return { 
      success: true, 
      message: '抓取窗口已打开，请在窗口中操作游戏，资源将实时收集'
    }
  } catch (error) {
    console.error('抓取错误:', error)
    isScrapingActive = false
    return { success: false, error: error.message }
  }
})

// 停止抓取
ipcMain.handle('stop-scraping', async () => {
  try {
    // 创建可序列化的资源副本
    const resources = collectedResources.map(r => ({
      url: r.url,
      type: r.type,
      contentType: r.contentType,
      size: r.size,
      status: r.status,
      timestamp: r.timestamp
    }))
    
    stopScraping()
    
    return {
      success: true,
      resources,
      count: resources.length,
      message: `抓取完成，共收集 ${resources.length} 个资源`
    }
  } catch (error) {
    console.error('停止抓取错误:', error)
    return { success: false, error: error.message }
  }
})

// 获取当前抓取状态
ipcMain.handle('get-scraping-status', async () => {
  return {
    isActive: isScrapingActive,
    count: collectedResources.length
  }
})

// 停止抓取的内部方法
function stopScraping() {
  isScrapingActive = false
  if (scrapingWindow && !scrapingWindow.isDestroyed()) {
    scrapingWindow.close()
  }
  scrapingWindow = null
}

// 判断是否应该收集该资源
function shouldCollectResource(url, resourceType) {
  // 过滤掉不需要的URL
  const excludePatterns = [
    'chrome-extension://',
    'devtools://',
    'about:',
    'data:text/html',
    'blob:http'
  ]
  
  for (const pattern of excludePatterns) {
    if (url.startsWith(pattern)) return false
  }

  // 过滤掉分析和统计类请求
  const excludeKeywords = ['analytics', 'tracking', 'beacon', 'pixel']
  for (const keyword of excludeKeywords) {
    if (url.toLowerCase().includes(keyword)) return false
  }

  return true
}

// 分类资源类型
function classifyResourceType(resourceType, url, headers) {
  const urlLower = url.toLowerCase()
  const contentType = headers['content-type'] ? headers['content-type'][0].toLowerCase() : ''

  // Cocos Creator 特有资源（优先级最高）
  if (/\.(plist|atlas|bin|proto|prefab|fire|scene|anim|animclip|effect|material|meta|dbbin|cconb)(\?|$)/i.test(urlLower)) {
    return 'cocos'
  }

  // Spine 动画资源
  if (/\.(skel|atlas|json)(\?|$)/i.test(urlLower) || url.includes('spine')) {
    return 'spine'
  }

  // 图片
  if (resourceType === 'image' || 
      contentType.includes('image') ||
      /\.(jpg|jpeg|png|gif|bmp|svg|webp|ico|pvr|pkm|astc|ktx)(\?|$)/i.test(urlLower)) {
    return 'image'
  }

  // 音频
  if (resourceType === 'media' || 
      contentType.includes('audio') ||
      /\.(mp3|wav|ogg|m4a|aac|flac|caf)(\?|$)/i.test(urlLower)) {
    return 'audio'
  }

  // 视频
  if (contentType.includes('video') ||
      /\.(mp4|webm|avi|mov|flv|mkv)(\?|$)/i.test(urlLower)) {
    return 'video'
  }

  // 脚本（包括 Cocos 脚本）
  if (resourceType === 'script' || 
      contentType.includes('javascript') ||
      /\.(js|jsc|ts|json)(\?|$)/i.test(urlLower)) {
    return 'script'
  }

  // 样式
  if (resourceType === 'stylesheet' || 
      contentType.includes('css') ||
      /\.css(\?|$)/i.test(urlLower)) {
    return 'stylesheet'
  }

  // 字体
  if (resourceType === 'font' || 
      /\.(woff|woff2|ttf|eot|otf|fnt|bmfont)(\?|$)/i.test(urlLower)) {
    return 'font'
  }

  // JSON 配置数据
  if (contentType.includes('json') || /\.json(\?|$)/i.test(urlLower)) {
    return 'json'
  }

  return 'other'
}

ipcMain.handle('download-resources', async (event, resources, directory) => {
  try {
    if (!directory) {
      return { success: false, error: '请选择保存目录' }
    }

    const https = require('https')
    const http = require('http')
    const fs = require('fs')
    const path = require('path')
    const { URL } = require('url')

    let downloaded = 0
    let failed = 0
    const errors = []
    const detailedErrors = [] // 详细错误信息用于调试

    // 获取 session cookies（用于需要认证的资源）
    let cookies = ''
    if (scrapingWindow && !scrapingWindow.isDestroyed()) {
      const allCookies = await scrapingWindow.webContents.session.cookies.get({})
      cookies = allCookies.map(c => `${c.name}=${c.value}`).join('; ')
    }

    // 下载单个文件
    const downloadFile = (resource, retryCount = 0) => {
      return new Promise((resolve) => {
        try {
          // 检查URL格式
          if (!resource.url || !resource.url.startsWith('http')) {
            const error = `无效的URL: ${resource.url}`
            detailedErrors.push(error)
            errors.push(error)
            failed++
            resolve()
            return
          }

          const urlObj = new URL(resource.url)
          
          // 解析路径：保留原始目录结构
          let relativePath = urlObj.pathname
          
          // 移除开头的斜杠
          if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1)
          }
          
          // URL解码（处理中文等特殊字符）
          relativePath = decodeURIComponent(relativePath)
          
          // 如果路径为空，使用文件名或生成名称
          if (!relativePath || relativePath === '') {
            const timestamp = Date.now()
            const random = Math.random().toString(36).substr(2, 9)
            relativePath = `resource_${timestamp}_${random}`
          }
          
          // 构建完整的保存路径
          const savePath = path.join(directory, relativePath)
          const saveDir = path.dirname(savePath)
          
          // 创建目录（递归）
          if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true })
          }
          
          // 选择协议
          const protocol = urlObj.protocol === 'https:' ? https : http
          
          // 准备请求头
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': urlObj.origin + '/',
            'Origin': urlObj.origin
          }
          
          // 添加 cookies（如果有）
          if (cookies) {
            headers['Cookie'] = cookies
          }
          
          console.log(`📥 正在下载: ${resource.url}`)
          
          // 发起下载请求
          const request = protocol.get(resource.url, { headers }, (response) => {
            console.log(`📊 响应状态: ${response.statusCode} - ${resource.url}`)
            
            // 处理重定向
            if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
              const redirectUrl = response.headers.location
              console.log(`🔄 重定向到: ${redirectUrl}`)
              
              // 处理相对路径重定向
              const absoluteRedirectUrl = redirectUrl.startsWith('http') 
                ? redirectUrl 
                : new URL(redirectUrl, resource.url).href
              
              downloadFile({ ...resource, url: absoluteRedirectUrl }, retryCount).then(resolve)
              return
            }
            
            // 非200状态
            if (response.statusCode !== 200) {
              const error = `HTTP ${response.statusCode} - ${resource.url}`
              detailedErrors.push(error)
              errors.push(`${path.basename(resource.url)}: HTTP ${response.statusCode}`)
              failed++
              console.error(`❌ ${error}`)
              resolve()
              return
            }
            
            // 创建写入流
            const fileStream = fs.createWriteStream(savePath)
            let downloadedBytes = 0
            
            // 监听数据
            response.on('data', (chunk) => {
              downloadedBytes += chunk.length
            })
            
            response.pipe(fileStream)
            
            fileStream.on('finish', () => {
              fileStream.close()
              downloaded++
              console.log(`✅ 下载成功: ${relativePath} (${downloadedBytes} bytes)`)
              resolve()
            })
            
            fileStream.on('error', (err) => {
              const error = `文件写入错误: ${err.message} - ${resource.url}`
              detailedErrors.push(error)
              errors.push(`${path.basename(resource.url)}: 写入失败`)
              fs.unlink(savePath, () => {}) // 删除损坏的文件
              failed++
              console.error(`❌ ${error}`)
              resolve()
            })
          })
          
          request.on('error', (err) => {
            const error = `网络错误: ${err.message} - ${resource.url}`
            detailedErrors.push(error)
            errors.push(`${path.basename(resource.url)}: ${err.message}`)
            failed++
            console.error(`❌ ${error}`)
            
            // 重试机制（最多3次）
            if (retryCount < 3 && (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT')) {
              console.log(`🔄 重试第 ${retryCount + 1} 次: ${resource.url}`)
              setTimeout(() => {
                downloadFile(resource, retryCount + 1).then(resolve)
              }, 1000 * (retryCount + 1)) // 递增延迟
            } else {
              resolve()
            }
          })
          
          // 超时设置（60秒，给大文件更多时间）
          request.setTimeout(60000, () => {
            request.destroy()
            const error = `请求超时 (60s) - ${resource.url}`
            detailedErrors.push(error)
            errors.push(`${path.basename(resource.url)}: 超时`)
            failed++
            console.error(`❌ ${error}`)
            resolve()
          })
          
        } catch (error) {
          const errorMsg = `异常: ${error.message} - ${resource.url}`
          detailedErrors.push(errorMsg)
          errors.push(`${path.basename(resource.url)}: ${error.message}`)
          failed++
          console.error(`❌ ${errorMsg}`)
          resolve()
        }
      })
    }

    // 批量下载（并发控制）
    console.log(`\n🚀 开始下载 ${resources.length} 个资源...\n`)
    
    const concurrency = 3 // 降低并发数，避免服务器限制
    const chunks = []
    for (let i = 0; i < resources.length; i += concurrency) {
      chunks.push(resources.slice(i, i + concurrency))
    }

    // 逐批下载
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`\n📦 批次 ${i + 1}/${chunks.length}`)
      
      await Promise.all(chunk.map(resource => downloadFile(resource)))
      
      // 向主窗口发送进度
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-progress', {
          total: resources.length,
          downloaded: downloaded + failed,
          successful: downloaded,
          failed
        })
      }
      
      // 批次间延迟，避免服务器限制
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log(`\n✨ 下载完成！`)
    console.log(`📊 总计: ${resources.length}, 成功: ${downloaded}, 失败: ${failed}`)
    
    if (detailedErrors.length > 0) {
      console.log(`\n❌ 错误详情:`)
      detailedErrors.slice(0, 20).forEach((err, idx) => {
        console.log(`${idx + 1}. ${err}`)
      })
    }

    return {
      success: true,
      total: resources.length,
      downloaded,
      failed,
      errors: errors.slice(0, 20), // 返回前20个错误
      detailedErrors: detailedErrors.slice(0, 20) // 详细错误
    }
  } catch (error) {
    console.error('下载错误:', error)
    return { success: false, error: error.message }
  }
})

// 应用退出时清理
app.on('before-quit', async () => {
  console.log('应用退出')
})

// 导出主窗口实例供其他模块使用
module.exports = { mainWindow }
