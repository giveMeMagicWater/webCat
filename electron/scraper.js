import puppeteer from 'puppeteer-core'
import path from 'path'
import { mainWindow } from './main.js'

/**
 * 资源抓取类
 */
class ResourceScraper {
  constructor() {
    this.browser = null
    this.page = null
    this.resources = []
  }

  /**
   * 初始化浏览器
   */
  async init() {
    try {
      // 使用系统 Chrome 或 Edge
      const executablePath = this.findChromePath()
      
      this.browser = await puppeteer.launch({
        headless: false,
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security'
        ]
      })

      this.page = await this.browser.newPage()
      
      // 设置视口
      await this.page.setViewport({ width: 1920, height: 1080 })
      
      return true
    } catch (error) {
      console.error('浏览器初始化失败:', error)
      return false
    }
  }

  /**
   * 查找系统中的 Chrome 路径
   */
  findChromePath() {
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ]

    const fs = require('fs')
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        return path
      }
    }

    throw new Error('未找到 Chrome 或 Edge 浏览器，请先安装')
  }

  /**
   * 开始抓取资源
   */
  async startScraping(url) {
    this.resources = []

    try {
      // 监听网络请求
      await this.page.setRequestInterception(true)
      
      this.page.on('request', (request) => {
        request.continue()
      })

      this.page.on('response', async (response) => {
        try {
          const url = response.url()
          const resourceType = response.request().resourceType()
          const contentType = response.headers()['content-type'] || ''
          
          // 分类资源
          const resource = {
            url,
            type: this.classifyResource(resourceType, contentType, url),
            contentType,
            size: response.headers()['content-length'] || 0,
            status: response.status()
          }

          // 只收集成功的请求
          if (response.ok() && this.isValidResource(resource)) {
            this.resources.push(resource)
            
            // 发送进度更新到渲染进程
            this.sendProgress({
              type: 'resource-found',
              resource,
              total: this.resources.length
            })
          }
        } catch (error) {
          console.error('处理响应失败:', error)
        }
      })

      // 访问目标页面
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      // 等待额外的动态加载
      await this.page.waitForTimeout(5000)

      return {
        success: true,
        resources: this.resources,
        count: this.resources.length
      }
    } catch (error) {
      console.error('抓取失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 分类资源类型
   */
  classifyResource(resourceType, contentType, url) {
    const urlLower = url.toLowerCase()
    
    // 图片
    if (resourceType === 'image' || 
        contentType.includes('image') ||
        /\.(jpg|jpeg|png|gif|bmp|svg|webp|ico)(\?|$)/i.test(urlLower)) {
      return 'image'
    }
    
    // 音频
    if (resourceType === 'media' || 
        contentType.includes('audio') ||
        /\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i.test(urlLower)) {
      return 'audio'
    }
    
    // 视频
    if (contentType.includes('video') ||
        /\.(mp4|webm|avi|mov|flv|mkv)(\?|$)/i.test(urlLower)) {
      return 'video'
    }
    
    // 脚本
    if (resourceType === 'script' || 
        contentType.includes('javascript') ||
        /\.(js|jsc|ts)(\?|$)/i.test(urlLower)) {
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
        /\.(woff|woff2|ttf|eot|otf)(\?|$)/i.test(urlLower)) {
      return 'font'
    }
    
    // JSON 数据
    if (contentType.includes('json') || /\.json(\?|$)/i.test(urlLower)) {
      return 'json'
    }
    
    // Cocos Creator 特有资源
    if (/\.(plist|atlas|bin|proto|prefab|fire|scene)(\?|$)/i.test(urlLower)) {
      return 'cocos'
    }
    
    return 'other'
  }

  /**
   * 判断是否是有效资源
   */
  isValidResource(resource) {
    // 过滤掉不需要的资源
    const excludeTypes = ['document', 'websocket']
    const excludeUrls = ['data:', 'blob:', 'chrome-extension:']
    
    if (excludeTypes.includes(resource.type)) {
      return false
    }
    
    for (const excludeUrl of excludeUrls) {
      if (resource.url.startsWith(excludeUrl)) {
        return false
      }
    }
    
    return true
  }

  /**
   * 发送进度更新
   */
  sendProgress(data) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scraping-progress', data)
    }
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  /**
   * 获取资源列表
   */
  getResources() {
    return this.resources
  }
}

export default ResourceScraper
